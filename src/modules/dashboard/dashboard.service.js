import salesModel from "../../DB/models/sales.model.js";
import productModel from "../../DB/models/product.model.js";
import userModel from "../../DB/models/user.model.js";
import * as redisService from "../../DB/redis/redis.service.js";
import { successResponse } from "../../common/utils/response.success.js";
import { dashboardEnum } from "../../common/enum/dashboard.enum.js";
import { DateTime } from "luxon";

export const DASHBOARD_CACHE_KEY = process.env.DASHBOARD_CACHE_KEY;
const EGYPT_TIMEZONE = "Africa/Cairo";

const PERIOD_CONFIG = {
  [dashboardEnum.daily]: {
    unit: "hours",
    count: 24,
    format: "yyyy-MM-dd HH:00",
    dbFormat: "%Y-%m-%d %H:00",
    getStartDate: (now) => now.startOf("hour").minus({ hours: 23 }),
  },

  [dashboardEnum.weekly]: {
    unit: "days",
    count: 7,
    format: "yyyy-MM-dd",
    dbFormat: "%Y-%m-%d",
    getStartDate: (now) => now.minus({ days: 6 }).startOf("day"),
  },

  [dashboardEnum.monthly]: {
    unit: "days",
    count: null,
    format: "yyyy-MM-dd",
    dbFormat: "%Y-%m-%d",
    getStartDate: (now) => now.startOf("month"),
  },

  [dashboardEnum.yearly]: {
    unit: "months",
    count: 12,
    format: "yyyy-MM",
    dbFormat: "%Y-%m",
    getStartDate: (now) => now.minus({ months: 11 }).startOf("month"),
  },
};

const fillMissingChartDates = (rawChartData, period) => {
  const config = PERIOD_CONFIG[period] || PERIOD_CONFIG[dashboardEnum.monthly];
  const now = DateTime.now().setZone(EGYPT_TIMEZONE);
  const dataMap = new Map(rawChartData.map((item) => [item.label, item]));

  const totalSteps =
    config.count || (period === dashboardEnum.monthly ? now.daysInMonth : now.day);

  const startPoint = config.count
    ? now.startOf(config.unit).minus({ [config.unit]: totalSteps - 1 })
    : now.startOf("month");

  return Array.from({ length: totalSteps }, (_, i) => {
    const label = startPoint.plus({ [config.unit]: i }).toFormat(config.format);
    const existing = dataMap.get(label);

    return {
      label,
      totalSales: existing?.totalSales || 0,
      totalProfit: existing?.totalProfit || 0,
      count: existing?.count || 0,
    };
  });
};

const buildChartPipeline = (period) => {
  const config = PERIOD_CONFIG[period] || PERIOD_CONFIG[dashboardEnum.monthly];
  const now = DateTime.now().setZone(EGYPT_TIMEZONE);

  return [
    {
      $match: {
        isCancelled: false,
        createdAt: { $gte: config.getStartDate(now).toJSDate() },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: config.dbFormat,
            date: "$createdAt",
            timezone: EGYPT_TIMEZONE,
          },
        },
        totalSales: { $sum: "$totalAmount" },
        totalProfit: { $sum: "$totalProfit" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        label: "$_id",
        totalSales: 1,
        totalProfit: 1,
        count: 1,
      },
    },
  ];
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const cachedStats = await redisService.get(DASHBOARD_CACHE_KEY);
    if (cachedStats) {
      return successResponse({
        res,
        status: 200,
        message: "Dashboard stats fetched successfully (from cache)",
        data: cachedStats,
      });
    }

    const startOfDay = DateTime.now()
      .setZone(EGYPT_TIMEZONE)
      .startOf("day")
      .toJSDate();
    const startOfMonth = DateTime.now()
      .setZone(EGYPT_TIMEZONE)
      .startOf("month")
      .toJSDate();

    const [
      totalProducts,
      lowStockProducts,
      totalEmployees,
      overallSales,
      todaySales,
      monthSales,
      totalOrders,
    ] = await Promise.all([
      productModel.countDocuments({ isAvailable: true }),

      productModel.countDocuments({
        isAvailable: true,
        $expr: { $lte: ["$stock", "$lowStockThreshold"] },
      }),

      userModel.countDocuments({ isActive: true }),

      salesModel.aggregate([
        { $match: { isCancelled: false } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$totalAmount" },
            totalProfit: { $sum: "$totalProfit" },
          },
        },
      ]),

      salesModel.aggregate([
        { $match: { isCancelled: false, createdAt: { $gte: startOfDay } } },
        { $group: { _id: null, totalAmount: { $sum: "$totalAmount" } } },
      ]),

      salesModel.aggregate([
        { $match: { isCancelled: false, createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, totalAmount: { $sum: "$totalAmount" } } },
      ]),

      salesModel.countDocuments({ isCancelled: false }),
    ]);

    const stats = {
      totalSalesAmount: overallSales[0]?.totalAmount || 0,
      totalProfit: overallSales[0]?.totalProfit || 0,
      todaySalesAmount: todaySales[0]?.totalAmount || 0,
      monthSalesAmount: monthSales[0]?.totalAmount || 0,
      totalOrders,
      totalEmployees,
      totalProducts,
      lowStockProductsCount: lowStockProducts,
    };

    await redisService.set({
      key: DASHBOARD_CACHE_KEY,
      value: stats,
      ttl: 600,
    });

    return successResponse({
      res,
      status: 200,
      message: "Dashboard stats fetched successfully",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardCharts = async (req, res, next) => {
  try {
    const { period = dashboardEnum.monthly } = req.query;
    const chartCacheKey = `dashboard:chart:${period}`;

    const rawChartDataFromCache = await redisService.get(chartCacheKey);

    if (rawChartDataFromCache) {
      return successResponse({
        res,
        status: 200,
        message: `Dashboard chart data (${period}) fetched successfully (from cache)`,
        data: {
          period,
          chartData: rawChartDataFromCache,
        },
      });
    }

    const pipeline = buildChartPipeline(period);
    const rawAggregatedData = await salesModel.aggregate(pipeline);

    const chartData = fillMissingChartDates(rawAggregatedData, period);

    await redisService.set({
      key: chartCacheKey,
      value: chartData,
      ttl: 600,
    });

    return successResponse({
      res,
      status: 200,
      message: `Dashboard chart data (${period}) fetched successfully`,
      data: {
        period,
        chartData,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const clearDashboardCache = async () => {
  try {
    const dashboardKeys = await redisService.keys("dashboard:*");

    if (dashboardKeys?.length > 0) {
      await Promise.all(
        dashboardKeys.map((key) => redisService.deleteKey(key)),
      );
    }
  } catch (error) {
    console.error("Failed to clear dashboard cache:", error);
  }
};
