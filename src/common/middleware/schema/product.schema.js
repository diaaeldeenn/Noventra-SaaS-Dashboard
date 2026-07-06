import { z } from "zod";

export const addProductSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: "Product name is required" })
      .trim()
      .min(2, { message: "Name must be at least 2 characters long" }),

    sku: z
      .string({ required_error: "SKU / Barcode is required" })
      .trim()
      .min(3, { message: "SKU must be at least 3 characters long" }),

    description: z.string().trim().optional(),

    purchasePrice: z
      .string({ required_error: "Purchase price is required" })
      .transform((val) => Number(val))
      .refine((val) => val >= 0, {
        message: "Purchase price must be a positive number",
      }),

    sellingPrice: z
      .string({ required_error: "Selling price is required" })
      .transform((val) => Number(val))
      .refine((val) => val >= 0, {
        message: "Selling price must be a positive number",
      }),

    stock: z
      .string({ required_error: "Stock quantity is required" })
      .transform((val) => Number(val))
      .refine((val) => val >= 0, { message: "Stock cannot be negative" }),

    lowStockThreshold: z
      .string()
      .optional()
      .transform((val) => (val ? Number(val) : 5))
      .refine((val) => val >= 0, { message: "Threshold cannot be negative" }),

    category: z
      .string({ required_error: "Category is required" })
      .trim()
      .min(2, { message: "Category name is too short" }),
  }),

  file: z.object(
    {
      fieldname: z.string(),
      originalname: z.string(),
      encoding: z.string(),
      mimetype: z.string().refine((val) => val.startsWith("image/"), {
        message: "Only image files are allowed",
      }),
      size: z.number().refine((val) => val <= 5 * 1024 * 1024, {
        message: "Image size must be less than 5MB",
      }),
    },
    { required_error: "Product image is required" },
  ),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, { message: "Name must be at least 2 characters long" })
      .optional(),

    description: z.string().trim().optional(),

    purchasePrice: z
      .string()
      .transform((val) => Number(val))
      .refine((val) => val >= 0, {
        message: "Purchase price must be a positive number",
      })
      .optional(),

    sellingPrice: z
      .string()
      .transform((val) => Number(val))
      .refine((val) => val >= 0, {
        message: "Selling price must be a positive number",
      })
      .optional(),

    stock: z
      .string()
      .transform((val) => Number(val))
      .refine((val) => val >= 0, { message: "Stock cannot be negative" })
      .optional(),

    lowStockThreshold: z
      .string()
      .transform((val) => Number(val))
      .refine((val) => val >= 0, { message: "Threshold cannot be negative" })
      .optional(),

    category: z
      .string()
      .trim()
      .min(2, { message: "Category name is too short" })
      .optional(),
  }),
  params: z.object({
    productId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, { message: "Invalid Product ID format" }),
  }),
});

export const updateStockSchema = z.object({
  body: z.object({
    quantity: z
      .string({ required_error: "Quantity is required" })
      .transform((val) => Number(val))
      .refine((val) => [1, -1].includes(val), {
        message:
          "Quantity must be either 1 (for increment) or -1 (for decrement)",
      }),
  }),
  params: z.object({
    productId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, { message: "Invalid Product ID format" }),
  }),
});
