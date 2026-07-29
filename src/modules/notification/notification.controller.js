import { Router } from "express";
import * as NS from "./notification.service.js";
import { authentication } from "../../common/middleware/auth.js";

const notificationController = Router();

notificationController.get("/", authentication, NS.getUserNotifications);

notificationController.patch("/read-all", authentication, NS.markAllAsRead);

notificationController.patch("/:id/read", authentication, NS.markAsRead);

export default notificationController;