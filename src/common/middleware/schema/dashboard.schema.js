import { z } from "zod";
import { dashboardEnum } from "../../enum/dashboard.enum.js";

export const getDashboardChartsSchema = z.object({
  query: z.object({
    period: z
      .enum(Object.values(dashboardEnum))
      .optional()
      .default(dashboardEnum.monthly),
  }),
});
