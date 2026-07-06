import { Router } from "express";
import { authentication, authorization } from "../../common/middleware/auth.js";
import { RoleEnum } from "../../common/enum/user.enum.js";
import * as PS from "./product.service.js";
import { localMulter } from "../../common/middleware/multer.js";
import { multerTypeEnum } from "../../common/enum/multer.enum.js";
import { schema } from "../../common/middleware/schema.js";
import {
  addProductSchema,
  updateProductSchema,
  updateStockSchema,
} from "../../common/middleware/schema/product.schema.js";
import { employeesStatusSchema } from "../../common/middleware/schema/auth.schema.js";

const productRouter = Router();

productRouter.post(
  "/",
  authentication,
  authorization([RoleEnum.admin, RoleEnum.manager]),
  localMulter({ fileExt: multerTypeEnum.image }).single("image"),
  schema(addProductSchema),
  PS.addProduct,
);

productRouter.get(
  "/",
  authentication,
  authorization([RoleEnum.admin, RoleEnum.manager, RoleEnum.employee]),
  PS.getProducts,
);

productRouter.get(
  "/low-stock",
  authentication,
  authorization([RoleEnum.admin, RoleEnum.manager]),
  PS.getLowStockProducts,
);

productRouter.get(
  "/:productId",
  authentication,
  authorization([RoleEnum.admin, RoleEnum.manager, RoleEnum.employee]),
  schema(employeesStatusSchema),
  PS.getSpeceficProduct,
);

productRouter.put(
  "/:productId",
  authentication,
  authorization([RoleEnum.admin, RoleEnum.manager]),
  schema(updateProductSchema),
  PS.updateProduct,
);

productRouter.patch(
  "/:productId/stock",
  authentication,
  authorization([RoleEnum.admin, RoleEnum.manager]),
  schema(updateStockSchema),
  PS.updateStock,
);

productRouter.patch(
  "/:productId/availability",
  authentication,
  authorization([RoleEnum.admin, RoleEnum.manager]),
  PS.toggleAvailability,
);

export default productRouter;
