import mongoose from "mongoose";
import * as db_service from "../../DB/db.service.js";
import productModel from "../../DB/models/product.model.js";
import salesModel from "../../DB/models/sales.model.js";
import auditLogModel from "../../DB/models/audit.model.js";
import { TargetEnum } from "../../common/enum/target.enum.js";
import { successResponse } from "../../common/utils/response.success.js";
import {
  generateExcelReport,
  generatePdfReport,
  generateWordReport,
} from "./sales.export.helper.js";

export const createSale = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, paymentMethod } = req.body;

    let totalAmount = 0;
    let totalProfit = 0;
    const saleItems = [];

    for (const item of items) {
      const product = await db_service.findOne({
        model: productModel,
        filter: { _id: item.product, isAvailable: true },
        options: { session },
      });

      if (!product) {
        throw new Error(
          `Product with ID ${item.product} not found or unavailable`,
          { cause: 404 },
        );
      }

      if (product.stock < item.quantity) {
        throw new Error(
          `Insufficient stock for product '${product.name}'. Available: ${product.stock}, requested: ${item.quantity}`,
          { cause: 400 },
        );
      }

      const updatedProduct = await db_service.findOneAndUpdate({
        model: productModel,
        filter: {
          _id: product._id,
          stock: { $gte: item.quantity },
        },
        update: { $inc: { stock: -item.quantity } },
        options: { session, new: true },
      });

      if (!updatedProduct) {
        throw new Error(
          `Stock for product '${product.name}' was updated by another transaction. Please try again.`,
          { cause: 409 },
        );
      }

      const itemTotalPrice = product.sellingPrice * item.quantity;
      const itemProfit =
        (product.sellingPrice - product.purchasePrice) * item.quantity;

      totalAmount += itemTotalPrice;
      totalProfit += itemProfit;

      saleItems.push({
        productId: product._id,
        quantity: item.quantity,
        purchasePriceAtSale: product.purchasePrice,
        sellingPriceAtSale: product.sellingPrice,
      });
    }

    const invoiceNumber = `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const sale = await db_service.create({
      model: salesModel,
      data: {
        invoiceNumber,
        soldBy: req.user._id,
        items: saleItems,
        totalAmount,
        totalProfit,
        paymentMethod,
      },
      options: { session },
    });

    await db_service.create({
      model: auditLogModel,
      data: {
        userId: req.user._id,
        action: "CREATE_SALE",
        targetId: sale._id,
        targetModel: TargetEnum.Sale || "Sale",
        details: `Created sale invoice: ${invoiceNumber} with total: ${totalAmount}`,
      },
      options: { session },
    });

    await session.commitTransaction();
    session.endSession();

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

export const cancelSale = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    const sale = await db_service.findOne({
      model: salesModel,
      filter: { _id: id },
      options: { session },
    });

    if (!sale) {
      throw new Error("Sale invoice not found", { cause: 404 });
    }

    if (sale.isCancelled) {
      throw new Error("This sale invoice is already cancelled", { cause: 400 });
    }

    for (const item of sale.items) {
      await db_service.findOneAndUpdate({
        model: productModel,
        filter: { _id: item.productId },
        update: { $inc: { stock: item.quantity } },
        options: { session, new: true },
      });
    }

    sale.isCancelled = true;
    sale.cancelledBy = req.user._id;
    sale.cancelledAt = new Date();
    await sale.save({ session });

    await db_service.create({
      model: auditLogModel,
      data: {
        userId: req.user._id,
        action: "CANCEL_SALE",
        targetId: sale._id,
        targetModel: TargetEnum.Sale || "Sale",
        details: `Cancelled sale invoice: ${sale.invoiceNumber}. Restored items to inventory.`,
      },
      options: { session },
    });

    await session.commitTransaction();
    session.endSession();

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

export const getAllSales = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      search,
      soldBy,
      isCancelled,
      startDate,
      endDate,
      sort,
    } = req.query;

    const filter = {};

    if (search) {
      filter.invoiceNumber = { $regex: search, $options: "i" };
    }

    if (soldBy) {
      filter.soldBy = soldBy;
    }

    if (typeof isCancelled === "boolean") {
      filter.isCancelled = isCancelled;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const skip = (page - 1) * limit;

    const sales = await db_service.find({
      model: salesModel,
      filter,
      options: {
        skip,
        limit,
        sort,
        populate: [
          { path: "soldBy", select: "name email role" },
          { path: "items.productId", select: "name sku image" },
          { path: "cancelledBy", select: "name email" },
        ],
      },
    });

    const totalDocs = await salesModel.countDocuments(filter);
    const totalPages = Math.ceil(totalDocs / limit);

    return successResponse({
      res,
      status: 200,
      message: "Sales retrieved successfully",
      data: {
        sales,
        pagination: {
          totalDocs,
          totalPages,
          currentPage: page,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSaleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const sale = await db_service.findOne({
      model: salesModel,
      filter: { _id: id },
      options: {
        populate: [
          { path: "soldBy", select: "name email role" },
          { path: "items.productId", select: "name sku image category" },
          { path: "cancelledBy", select: "name email" },
        ],
      },
    });

    if (!sale) {
      throw new Error("Sale invoice not found", { cause: 404 });
    }

    return successResponse({
      res,
      status: 200,
      message: "Sale invoice retrieved successfully",
      data: sale,
    });
  } catch (error) {
    next(error);
  }
};

export const exportSales = async (req, res, next) => {
  try {
    const { format, startDate, endDate, soldBy } = req.query;

    const filter = {};

    if (soldBy) {
      filter.soldBy = soldBy;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const sales = await db_service.find({
      model: salesModel,
      filter,
      options: {
        sort: { createdAt: -1 },
        populate: [
          { path: "soldBy", select: "name email" },
          { path: "items.productId", select: "name sku" },
        ],
      },
    });

    switch (format) {
      case "pdf":
        return await generatePdfReport(sales, res);
      case "word":
        return await generateWordReport(sales, res);
      case "excel":
      default:
        return await generateExcelReport(sales, res);
    }
  } catch (error) {
    next(error);
  }
};
