import mongoose from "mongoose";
import { DateTime } from "luxon";
import * as db_service from "../../DB/db.service.js";
import productModel from "../../DB/models/product.model.js";
import salesModel from "../../DB/models/sales.model.js";
import auditLogModel from "../../DB/models/audit.model.js";
import { TargetEnum } from "../../common/enum/target.enum.js";
import { formatEnum } from "../../common/enum/sales.enum.js";
import { successResponse } from "../../common/utils/response.success.js";
import {
  exportSalesToExcel,
  exportSalesToPDF,
  exportSalesToWord,
  exportSingleSaleToExcel,
  exportSingleSaleToPDF,
  exportSingleSaleToWord,
} from "./sales.export.helper.js";
import { createNotificationFromAudit } from "../notification/notification.service.js";
import { notificationEnum } from "../../common/enum/notification.enum.js";
import { sendLowStockEmail } from "../../common/utils/email/email.service.js";
import { clearDashboardCache } from "../dashboard/dashboard.service.js";

export const createSale = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, paymentMethod } = req.body;

    const combinedItemsMap = new Map();
    for (const item of items) {
      const idStr = item.product.toString();
      combinedItemsMap.set(
        idStr,
        (combinedItemsMap.get(idStr) || 0) + item.quantity,
      );
    }

    const productIds = Array.from(combinedItemsMap.keys());

    const products = await db_service.find({
      model: productModel,
      filter: { _id: { $in: productIds }, isAvailable: true },
      options: { session },
    });

    if (products.length !== productIds.length) {
      throw new Error(
        "One or more products were not found or are unavailable",
        { cause: 404 },
      );
    }

    let totalAmount = 0;
    let totalProfit = 0;
    const saleItems = [];
    const lowStockProducts = [];

    for (const product of products) {
      const quantity = combinedItemsMap.get(product._id.toString());

      if (product.stock < quantity) {
        throw new Error(
          `Insufficient stock for '${product.name}'. Available: ${product.stock}, requested: ${quantity}`,
          { cause: 400 },
        );
      }

      const updatedProduct = await db_service.findOneAndUpdate({
        model: productModel,
        filter: { _id: product._id, stock: { $gte: quantity } },
        update: { $inc: { stock: -quantity } },
        options: { session, new: true },
      });

      if (!updatedProduct) {
        throw new Error(
          `Stock update failed for '${product.name}' due to dynamic changes. Please retry.`,
          { cause: 409 },
        );
      }

      if (updatedProduct.stock <= updatedProduct.lowStockThreshold) {
        lowStockProducts.push(updatedProduct);
      }

      const itemTotalPrice = product.sellingPrice * quantity;
      const itemProfit =
        (product.sellingPrice - product.purchasePrice) * quantity;

      totalAmount += itemTotalPrice;
      totalProfit += itemProfit;

      saleItems.push({
        productId: product._id,
        quantity,
        purchasePriceAtSale: product.purchasePrice,
        sellingPriceAtSale: product.sellingPrice,
      });
    }

    const invoiceNumber = `INV-${DateTime.now().setZone("Africa/Cairo").toFormat("yyyyMMdd-HHmmss")}-${Math.floor(1000 + Math.random() * 9000)}`;
    const [sale] = await salesModel.create(
      [
        {
          invoiceNumber,
          soldBy: req.user._id,
          items: saleItems,
          totalAmount,
          totalProfit,
          paymentMethod,
        },
      ],
      { session },
    );

    await auditLogModel.create(
      [
        {
          userId: req.user._id,
          action: "CREATE_SALE",
          targetId: sale._id,
          targetModel: TargetEnum.Sale || "Sale",
          details: `Created sale invoice: ${invoiceNumber} with total: ${totalAmount}`,
        },
      ],
      { session },
    );

    await createNotificationFromAudit({
      action: "CREATE_SALE",
      details: `A new invoice number ${invoiceNumber} has been created with a total value of ${totalAmount}`,
      targetId: sale._id,
      actorId: req.user._id,
      type: notificationEnum.SALE_CREATED,
      session,
    });

    for (const prod of lowStockProducts) {
      await createNotificationFromAudit({
        action: "LOW_STOCK_ALERT",
        details: `Warning: Product '${prod.name}' is low on stock (${prod.stock} remaining).`,
        targetId: prod._id,
        actorId: req.user._id,
        type: notificationEnum.LOW_STOCK,
        session,
      });
    }

    await session.commitTransaction();
    session.endSession();

    if (lowStockProducts.length > 0) {
      Promise.allSettled(
        lowStockProducts.map((prod) =>
          sendLowStockEmail({
            adminEmail: process.env.ADMIN_EMAIL || req.user.email,
            productName: prod.name,
            currentStock: prod.stock,
            productId: prod._id,
          }),
        ),
      ).then((results) => {
        const failed = results.filter((result) => result.status === "rejected");
        if (failed.length > 0) {
          console.error("Low Stock Email Errors:", failed);
        }
      });
    }

    await clearDashboardCache();

    return successResponse({
      res,
      status: 201,
      message: "Sale completed successfully",
      data: sale,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const getAllSales = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      paymentMethod,
      isCancelled,
      soldBy,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const filter = {};

    let isCancelledFilter = false;

    if (isCancelled !== undefined) {
      if (typeof isCancelled === "boolean") {
        isCancelledFilter = isCancelled;
      } else if (typeof isCancelled === "string") {
        isCancelledFilter = isCancelled === "true";
      }
    }

    filter.isCancelled = isCancelledFilter;

    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }

    if (soldBy) {
      filter.soldBy = soldBy;
    }

    if (startDate || endDate) {
      filter.createdAt = {};

      if (startDate) {
        filter.createdAt.$gte = DateTime.fromISO(startDate, {
          zone: "Africa/Cairo",
        })
          .startOf("day")
          .toJSDate();
      }

      if (endDate) {
        filter.createdAt.$lte = DateTime.fromISO(endDate, {
          zone: "Africa/Cairo",
        })
          .endOf("day")
          .toJSDate();
      }
    }

    const [sales, totalDocs] = await Promise.all([
      db_service.find({
        model: salesModel,
        filter,
        select: "-__v",
        options: {
          skip,
          limit,
          sort: { createdAt: -1 },
          populate: [
            { path: "soldBy", select: "name email role" },
            { path: "cancelledBy", select: "name email role" },
            { path: "items.productId", select: "name sellingPrice category" },
          ],
        },
      }),
      salesModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalDocs / limit);

    return successResponse({
      res,
      status: 200,
      message: "Sales fetched successfully",
      data: {
        sales,
        pagination: {
          totalDocs,
          totalPages,
          currentPage: page,
          limit,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const cancelSale = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    const sale = await db_service.findOne({
      model: salesModel,
      filter: { _id: id, isCancelled: false },
      options: { session },
    });

    if (!sale) {
      throw new Error("Sale invoice not found or already cancelled", {
        cause: 404,
      });
    }

    const bulkStockOps = sale.items.map((item) => ({
      updateOne: {
        filter: { _id: item.productId },
        update: { $inc: { stock: item.quantity } },
      },
    }));

    if (bulkStockOps.length > 0) {
      await productModel.bulkWrite(bulkStockOps, { session });
    }

    sale.isCancelled = true;
    sale.cancelledBy = req.user._id;
    sale.cancelledAt = DateTime.now().setZone("Africa/Cairo").toJSDate();
    await sale.save({ session });

    await db_service.create({
      model: auditLogModel,
      data: {
        userId: req.user._id,
        action: "CANCEL_SALE",
        targetId: sale._id,
        targetModel: TargetEnum.Sale || "Sale",
        details: `Cancelled invoice: ${sale.invoiceNumber} and restored product stock`,
      },
      options: { session },
    });

    await createNotificationFromAudit({
      action: "CANCEL_SALE",
      details: `The invoice number ${sale.invoiceNumber} has been canceled and the products have been returned to inventory.`,
      targetId: sale._id,
      actorId: req.user._id,
      type: notificationEnum.SALE_CANCELLED,
      session,
    });

    await session.commitTransaction();
    session.endSession();

    await clearDashboardCache();

    return successResponse({
      res,
      status: 200,
      message: "Sale cancelled successfully and stock restored",
      data: sale,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const exportSales = async (req, res, next) => {
  const { format = formatEnum.excel, startDate, endDate } = req.query;

  const filter = { isCancelled: false };

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      filter.createdAt.$gte = DateTime.fromISO(startDate, {
        zone: "Africa/Cairo",
      })
        .startOf("day")
        .toJSDate();
    }
    if (endDate) {
      filter.createdAt.$lte = DateTime.fromISO(endDate, {
        zone: "Africa/Cairo",
      })
        .endOf("day")
        .toJSDate();
    }
  }

  const sales = await db_service.find({
    model: salesModel,
    filter,
    options: {
      limit: 5000,
      sort: { createdAt: -1 },
      populate: [
        { path: "soldBy", select: "name email" },
        { path: "items.productId", select: "name" },
      ],
    },
  });

  if (!sales || sales.length === 0) {
    throw new Error("No sales data available for export", { cause: 404 });
  }

  const exportDateStr = DateTime.now()
    .setZone("Africa/Cairo")
    .toFormat("yyyy-MM-dd_HH-mm");

  if (format === formatEnum.pdf) {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=sales_report_${exportDateStr}.pdf`,
    );
    return exportSalesToPDF(sales, res);
  }

  if (format === formatEnum.word) {
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=sales_report_${exportDateStr}.docx`,
    );
    return exportSalesToWord(sales, res);
  }

  if (format === formatEnum.excel) {
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=sales_report_${exportDateStr}.xlsx`,
    );
    return exportSalesToExcel(sales, res);
  }

  throw new Error(`Unsupported export format: ${format}`, { cause: 400 });
};

export const printSingleSale = async (req, res, next) => {
  const { id } = req.params;
  const { format = formatEnum.excel } = req.query;

  const sale = await db_service.findOne({
    model: salesModel,
    filter: { _id: id },
    populate: [
      { path: "soldBy", select: "name email" },
      { path: "items.productId", select: "name" },
    ],
  });

  if (!sale) {
    throw new Error("Sale invoice not found", { cause: 404 });
  }

  if (format === formatEnum.pdf) {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=invoice_${sale.invoiceNumber}.pdf`,
    );
    return exportSingleSaleToPDF(sale, res);
  }

  if (format === formatEnum.word) {
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice_${sale.invoiceNumber}.docx`,
    );
    return exportSingleSaleToWord(sale, res);
  }

  if (format === formatEnum.excel) {
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice_${sale.invoiceNumber}.xlsx`,
    );
    return exportSingleSaleToExcel(sale, res);
  }

  throw new Error(`Unsupported export format: ${format}`, { cause: 400 });
};

export const getSaleById = async (req, res, next) => {
  const { id } = req.params;

  const sale = await db_service.findOne({
    model: salesModel,
    filter: { _id: id },
    populate: [
      { path: "soldBy", select: "name email role" },
      { path: "cancelledBy", select: "name email role" },
      { path: "items.productId", select: "name category sellingPrice" },
    ],
  });

  if (!sale) {
    throw new Error("Sale invoice not found", { cause: 404 });
  }

  return successResponse({
    res,
    status: 200,
    message: "Sale invoice fetched successfully",
    data: { sale },
  });
};
