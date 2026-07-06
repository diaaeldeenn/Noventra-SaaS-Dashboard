import cloudinary from "../../common/utils/cloudinary.js";
import { successResponse } from "../../common/utils/response.success.js";
import * as db_service from "../../DB/db.service.js";
import productModel from "../../DB/models/product.model.js";
import auditLogModel from "../../DB/models/audit.model.js";
import slugify from "slugify";
import { TargetEnum } from "../../common/enum/target.enum.js";

export const addProduct = async (req, res, next) => {
  try {
    const {
      name,
      sku,
      description,
      purchasePrice,
      sellingPrice,
      stock,
      lowStockThreshold,
      category,
    } = req.body;

    const isExist = await db_service.findOne({
      model: productModel,
      filter: { $or: [{ name }, { sku }] },
    });

    if (isExist) {
      throw new Error("Product name or SKU already exists in inventory", {
        cause: 400,
      });
    }

    if (!req.file) {
      throw new Error("Product image is required", { cause: 400 });
    }

    const { secure_url, public_id } = await cloudinary.uploader.upload(
      `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
      { folder: `noventra_dashboard/products/` },
    );

    const slug = slugify(name, { lower: true, strict: true });

    const product = await db_service.create({
      model: productModel,
      data: {
        name,
        slug,
        sku,
        description,
        purchasePrice,
        sellingPrice,
        stock,
        lowStockThreshold: lowStockThreshold || 5,
        category,
        image: [{ secure_url, public_id }],
        createdBy: req.user._id,
      },
    });

    await db_service.create({
      model: auditLogModel,
      data: {
        userId: req.user._id,
        action: "CREATE_PRODUCT",
        targetId: product._id,
        targetModel: TargetEnum.Product,
        details: `Created product: ${name} with initial stock: ${stock}`,
      },
    });

    return successResponse({ res, status: 201, data: product });
  } catch (error) {
    next(error);
  }
};

export const getProducts = async (req, res, next) => {
  try {
    const {
      page,
      limit: limitQuery,
      search,
      category,
      sort,
      order,
    } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      filter.category = category;
    }

    let sortOption = { createdAt: -1 };
    if (sort) {
      const sortOrder = order === "asc" ? 1 : -1;
      sortOption = { [sort]: sortOrder };
    }

    const currentPage = Math.max(1, parseInt(page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(limitQuery) || 10));
    const skip = (currentPage - 1) * limit;

    const total = await productModel.countDocuments(filter);

    const products = await db_service.find({
      model: productModel,
      filter,
      options: {
        skip,
        limit,
        sort: sortOption,
      },
    });

    const paginationData = {
      page: currentPage,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };

    return successResponse({
      res,
      status: 200,
      data: {
        products,
        pagination: paginationData,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getLowStockProducts = async (req, res, next) => {
  try {
    const products = await db_service.find({
      model: productModel,
      filter: {
        $expr: { $lte: ["$stock", "$lowStockThreshold"] },
      },
    });

    return successResponse({
      res,
      status: 200,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

export const getSpeceficProduct = async (req, res, next) => {
  const { productId } = req.params;
  try {
    const product = await db_service.findById({
      model: productModel,
      id: productId,
    });
    if (!product) {
      throw new Error("Product Not Found", { cause: 404 });
    }
    successResponse({ res, status: 200, data: product });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const {
      name,
      description,
      purchasePrice,
      sellingPrice,
      stock,
      lowStockThreshold,
      category,
    } = req.body;

    const currentProduct = await db_service.findById({
      model: productModel,
      id: productId,
    });

    if (!currentProduct) {
      throw new Error("Product Not Found", { cause: 404 });
    }

    const updateData = {
      name,
      description,
      purchasePrice,
      sellingPrice,
      stock,
      lowStockThreshold,
      category,
      updatedBy: req.user._id,
    };

    if (name) {
      const isExist = await db_service.findOne({
        model: productModel,
        filter: { name, _id: { $ne: productId } },
      });
      if (isExist) {
        throw new Error("Product name already exists", { cause: 400 });
      }
      updateData.slug = slugify(name, { lower: true, strict: true });
    }

    const updatedProduct = await db_service.findOneAndUpdate({
      model: productModel,
      filter: { _id: productId },
      update: updateData,
    });

    await db_service.create({
      model: auditLogModel,
      data: {
        userId: req.user._id,
        action: "UPDATE_PRODUCT",
        targetId: updatedProduct._id,
        targetModel: TargetEnum.Product,
        details: `Updated product: ${updatedProduct.name}`,
      },
    });

    return successResponse({ res, status: 200, data: updatedProduct });
  } catch (error) {
    next(error);
  }
};

export const updateStock = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    const product = await db_service.findOneAndUpdate({
      model: productModel,
      filter: { _id: productId },
      update: {
        $inc: { stock: quantity },
        updatedBy: req.user._id,
      },
      options: { new: true },
    });

    if (!product) {
      throw new Error("Product Not Found", { cause: 404 });
    }

    await db_service.create({
      model: auditLogModel,
      data: {
        userId: req.user._id,
        action: "UPDATE_STOCK",
        targetId: product._id,
        targetModel: TargetEnum.Product,
        details: `Manually adjusted stock of product: ${product.name} by: ${quantity}. New stock is: ${product.stock}`,
      },
    });

    return successResponse({ res, status: 200, data: product });
  } catch (error) {
    next(error);
  }
};

export const toggleAvailability = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const product = await db_service.findById({
      model: productModel,
      id: productId,
    });

    if (!product) {
      throw new Error("Product Not Found", { cause: 404 });
    }

    product.isAvailable = !product.isAvailable;
    product.updatedBy = req.user._id;
    await product.save();

    await db_service.create({
      model: auditLogModel,
      data: {
        userId: req.user._id,
        action: "TOGGLE_AVAILABILITY",
        targetId: product._id,
        targetModel: TargetEnum.Product,
        details: `Changed availability of product: ${product.name} to: ${product.isAvailable}`,
      },
    });

    return successResponse({ res, status: 200, data: product });
  } catch (error) {
    next(error);
  }
};
