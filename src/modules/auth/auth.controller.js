import { Router } from "express";
import * as auth from "./auth.service.js";
import { authentication, authorization } from "../../common/middleware/auth.js";
import { schema } from "../../common/middleware/schema.js";
import { RoleEnum } from "../../common/enum/user.enum.js";
import { resetPasswordSchema, signInSchema, signUpSchema, updatePasswordSchema } from "../../common/middleware/schema/auth.schema.js";

const authRouter = Router();

authRouter.post("/newEmployee", authentication, authorization([RoleEnum.admin]), schema(signUpSchema), auth.signUp);
authRouter.post("/login", schema(signInSchema), auth.login);
authRouter.get("/profile", authentication, auth.getProfile);
authRouter.patch("/updatePassword",authentication,schema(updatePasswordSchema),auth.updatePassword);
authRouter.patch("/users/:id/reset-password", authentication, authorization([RoleEnum.admin]), schema(resetPasswordSchema), auth.resetPassword);

export default authRouter;