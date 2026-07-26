import * as z from "zod";
import { paymentMethodEnum } from "../../enum/product.enum.js";
import { formatEnum } from "../../enum/sales.enum.js";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, {
  message: "Invalid ObjectId",
});

export const createSaleSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          product: objectIdSchema,
          quantity: z
            .number({ required_error: "Quantity is required" })
            .int()
            .positive({ message: "Quantity must be greater than 0" }),
        }),
      )
      .min(1, { message: "Sale must contain at least one item" })
      .refine(
        (items) => {
          const productIds = items.map((item) => item.product);
          return new Set(productIds).size === productIds.length;
        },
        {
          message: "Duplicate products are not allowed in the same sale order",
        },
      ),
    paymentMethod: z
      .enum(Object.values(paymentMethodEnum), {
        invalid_type_error: "Payment method must be either 'cash' or 'card'",
      })
      .default(paymentMethodEnum.cash),
  }),
});

export const cancelSaleSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const getAllSalesSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 10)),
    search: z.string().optional(),
    soldBy: objectIdSchema.optional(),
    isCancelled: z
      .enum(["true", "false"])
      .optional()
      .transform((val) => val === "true"),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    sort: z.string().optional().default("-createdAt"),
  }),
});

export const getSaleByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const exportSalesSchema = z.object({
  query: z.object({
    format: z.enum(Object.values(formatEnum)).default(formatEnum.excel),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    soldBy: objectIdSchema.optional(),
  }),
});
