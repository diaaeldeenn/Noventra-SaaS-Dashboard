import { Router } from "express";
import * as AS from "./audit.service.js";
import { authentication, authorization } from "../../common/middleware/auth.js";
import { schema } from "../../common/middleware/schema.js";
import { RoleEnum } from "../../common/enum/user.enum.js";
import {
  getAuditLogsSchema,
  exportAuditLogsSchema,
} from "../../common/middleware/schema/audit.schema.js";

const auditRouter = Router();

auditRouter.get(
  "/export",
  authentication,
  authorization([RoleEnum.admin, RoleEnum.manager]),
  schema(exportAuditLogsSchema),
  AS.exportAuditLogs,
);

auditRouter.get(
  "/",
  authentication,
  authorization([RoleEnum.admin, RoleEnum.manager]),
  schema(getAuditLogsSchema),
  AS.getAuditLogs,
);

export default auditRouter;
