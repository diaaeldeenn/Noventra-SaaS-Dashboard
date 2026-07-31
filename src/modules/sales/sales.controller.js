import { Router } from "express";
import * as SS from "./sales.service.js";
import { authentication, authorization } from "../../common/middleware/auth.js";
import { schema } from "../../common/middleware/schema.js";
import { RoleEnum } from "../../common/enum/user.enum.js";
import {
  createSaleSchema,
  cancelSaleSchema,
  exportSalesSchema,
  getAllSalesSchema,
  getSaleByIdSchema,
} from "../../common/middleware/schema/sales.schema.js";

const salesRouter = Router();

salesRouter.post(
  "/",
  authentication,
  authorization([RoleEnum.admin, RoleEnum.manager, RoleEnum.employee]),
  schema(createSaleSchema),
  SS.createSale,
);

salesRouter.patch(
  "/:id/cancel",
  authentication,
  authorization([RoleEnum.admin, RoleEnum.manager]),
  schema(cancelSaleSchema),
  SS.cancelSale,
);

salesRouter.get(
  "/export",
  authentication,
  authorization([RoleEnum.admin, RoleEnum.manager]),
  schema(exportSalesSchema),
  SS.exportSales,
);

salesRouter.get(
  "/:id/print",
  authentication,
  authorization([RoleEnum.admin, RoleEnum.manager, RoleEnum.employee]),
  schema(getSaleByIdSchema),
  SS.printSingleSale,
);

salesRouter.get(
  "/",
  authentication,
  authorization([RoleEnum.admin, RoleEnum.manager, RoleEnum.employee]),
  schema(getAllSalesSchema),
  SS.getAllSales,
);

salesRouter.get(
  "/:id",
  authentication,
  authorization([RoleEnum.admin, RoleEnum.manager, RoleEnum.employee]),
  schema(getSaleByIdSchema),
  SS.getSaleById,
);

export default salesRouter;
