import cron from "node-cron";
import { DateTime } from "luxon";
import salesModel from "../../DB/models/sales.model.js";
import { sendDailyReportEmail } from "../utils/email/email.service.js";
import { clearDashboardCache } from "../../modules/dashboard/dashboard.service.js";

export const runDailySalesReport = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.warn(
        "[CRON WARN] ADMIN_EMAIL is not defined in environment variables.",
      );
      return;
    }

    const yesterday = DateTime.now().setZone("Africa/Cairo").minus({ days: 1 });
    const startOfDay = yesterday.startOf("day").toJSDate();
    const endOfDay = yesterday.endOf("day").toJSDate();
    const formattedDate = yesterday.toFormat("yyyy-MM-dd");

    const salesStatsPromise = salesModel.aggregate([
      {
        $match: {
          isCancelled: false,
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
          totalProfit: { $sum: "$totalProfit" },
        },
      },
    ]);

    const topProductPromise = salesModel.aggregate([
      {
        $match: {
          isCancelled: false,
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          totalQuantity: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $project: {
          name: "$productDetails.name",
          totalQuantity: 1,
        },
      },
    ]);

    const [salesStats, topProductResult] = await Promise.all([
      salesStatsPromise,
      topProductPromise,
    ]);

    const stats = salesStats[0] || {
      totalSales: 0,
      totalRevenue: 0,
      totalProfit: 0,
    };

    const topProduct =
      topProductResult.length > 0 ? topProductResult[0].name : null;

    const reportData = {
      date: formattedDate,
      totalSales: stats.totalSales,
      totalRevenue: Number(stats.totalRevenue.toFixed(2)),
      totalProfit: Number(stats.totalProfit.toFixed(2)),
      topProduct,
    };

    await sendDailyReportEmail({
      adminEmail,
      reportData,
    });

    console.log(
      `[CRON SUCCESS] Daily sales report sent for date: ${formattedDate}`,
    );
  } catch (error) {
    console.error(
      "[CRON ERROR] Failed to generate or send daily sales report:",
      error,
    );
  }
};

export const initCronJobs = () => {
  cron.schedule(
    "5 0 * * *",
    async () => {
      console.log("[CRON] Executing scheduled daily sales report task...");
      await runDailySalesReport();
      await clearDashboardCache();
    },
    {
      timezone: "Africa/Cairo",
    },
  );

  console.log("⏱️ Cron jobs initialized successfully.");
};
