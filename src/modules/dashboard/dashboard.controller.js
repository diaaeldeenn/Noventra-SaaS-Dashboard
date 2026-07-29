import { Router } from "express";
import * as DS from "./dashboard.service.js";
import { authentication, authorization } from "../../common/middleware/auth.js";
import { schema } from "../../common/middleware/schema.js";
import { RoleEnum } from "../../common/enum/user.enum.js";
import { getDashboardChartsSchema } from "../../common/middleware/schema/dashboard.schema.js";

const dashboardRouter = Router();

dashboardRouter.get(
  "/stats",
  authentication,
  authorization([RoleEnum.admin, RoleEnum.manager]),
  DS.getDashboardStats,
);

dashboardRouter.get(
  "/charts",
  authentication,
  authorization([RoleEnum.admin, RoleEnum.manager]),
  schema(getDashboardChartsSchema),
  DS.getDashboardCharts,
);

export default dashboardRouter;
