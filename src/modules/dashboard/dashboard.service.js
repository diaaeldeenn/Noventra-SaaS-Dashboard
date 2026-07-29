import salesModel from "../../DB/models/sales.model.js";
import productModel from "../../DB/models/product.model.js";
import userModel from "../../DB/models/user.model.js";
import * as redisService from "../../DB/redis/redis.service.js";
import { successResponse } from "../../common/utils/response.success.js";
import { dashboardEnum } from "../../common/enum/dashboard.enum.js";
import { DateTime } from "luxon";

export const DASHBOARD_CACHE_KEY = process.env.DASHBOARD_CACHE_KEY;

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

    const startOfDay = DateTime.now().startOf("day").toJSDate();
    const startOfMonth = DateTime.now().startOf("month").toJSDate();

    const [
      totalProducts,
      lowStockProducts,
      totalEmployees,
      overallSales,
      todaySales,
      monthSales,
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
    ]);

    const stats = {
      totalSalesAmount: overallSales[0]?.totalAmount || 0,
      totalProfit: overallSales[0]?.totalProfit || 0,
      todaySalesAmount: todaySales[0]?.totalAmount || 0,
      monthSalesAmount: monthSales[0]?.totalAmount || 0,
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
  const { period = dashboardEnum.monthly } = req.query;

  const chartCacheKey = `dashboard:chart:${period}`;
  const rawChartData = await redisService.get(chartCacheKey);

  const chartData = rawChartData || [];

  return successResponse({
    res,
    status: 200,
    message: `Dashboard chart data (${period}) fetched successfully`,
    data: {
      period,
      chartData,
    },
  });
};
