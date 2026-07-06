import { Router } from "express";
import { authentication, authorization } from "../../common/middleware/auth.js";
import { RoleEnum } from "../../common/enum/user.enum.js";
import { schema } from "../../common/middleware/schema.js";
import * as US from "./user.service.js";
import { employeesStatusSchema, updateEmployeeSchema } from "../../common/middleware/schema/auth.schema.js";

const usersRouter = Router();

usersRouter.get("/", authentication, authorization([RoleEnum.admin, RoleEnum.manager]), US.getAllEmployees);
usersRouter.patch("/:id/status", authentication, authorization([RoleEnum.admin]),schema(employeesStatusSchema), US.employeesStatus);
usersRouter.get("/:id", authentication, authorization([RoleEnum.admin,RoleEnum.manager]),schema(employeesStatusSchema), US.getSpecificEmployee);
usersRouter.put("/:id", authentication, authorization([RoleEnum.admin]),schema(updateEmployeeSchema), US.updateSpecificEmployee);

export default usersRouter;