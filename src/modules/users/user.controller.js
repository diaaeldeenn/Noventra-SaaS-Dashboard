import { Router } from "express";
import { authentication, authorization } from "../../common/middleware/auth.js";
import { RoleEnum } from "../../common/enum/user.enum.js";
import { schema } from "../../common/middleware/schema.js";
import * as US from "./user.service.js";
import { employeesStatusSchema } from "../../common/middleware/schema/auth.schema.js";

const usersRouter = Router();

usersRouter.get("/", authentication, authorization([RoleEnum.admin, RoleEnum.manager]), US.getAllEmployees);
usersRouter.patch("/:id/status", authentication, authorization([RoleEnum.admin]),schema(employeesStatusSchema), US.employeesStatus);

export default usersRouter;