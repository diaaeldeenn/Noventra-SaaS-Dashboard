import { z } from "zod";
import { formatEnum } from "../../enum/sales.enum.js";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const getAuditLogsSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? Number(val) : 1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? Number(val) : 10)),
    userId: z.string().regex(objectIdRegex, "Invalid User ID").optional(),
    action: z.string().trim().optional(),
    targetModel: z.string().trim().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

export const exportAuditLogsSchema = z.object({
  query: z.object({
    format: z
      .enum([formatEnum.excel, formatEnum.pdf, formatEnum.word])
      .optional()
      .default(formatEnum.excel),
    userId: z.string().regex(objectIdRegex, "Invalid User ID").optional(),
    action: z.string().trim().optional(),
    targetModel: z.string().trim().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});
