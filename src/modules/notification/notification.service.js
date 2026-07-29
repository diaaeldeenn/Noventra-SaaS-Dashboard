import notificationModel from "../../DB/models/notification.model.js";
import userModel from "../../DB/models/user.model.js";
import * as db_service from "../../DB/db.service.js";
import { successResponse } from "../../common/utils/response.success.js";
import { notificationEnum } from "../../common/enum/notification.enum.js";

export const createNotificationFromAudit = async ({
  action,
  details,
  targetId,
  actorId,
  type = notificationEnum.AUDIT_ALERT,
  session = null,
}) => {
  try {
    const receivers = await userModel.find(
      {
        role: { $in: ["ADMIN", "MANAGER"] },
        _id: { $ne: actorId },
      },
      "_id",
      { session },
    );

    if (!receivers.length) return;

    const notifications = receivers.map((user) => ({
      userId: user._id,
      title: `Alert : ${action}`,
      message: details,
      type,
      action,
      targetId,
    }));

    await notificationModel.insertMany(notifications, { session });
  } catch (error) {
    console.error("Error creating notification from audit:", error);
  }
};

export const getUserNotifications = async (req, res, next) => {
  const { page = 1, limit = 10, isRead } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = { userId: req.user._id };
  if (isRead !== undefined) {
    filter.isRead = isRead === "true";
  }

  const [notifications, totalDocs, unreadCount] = await Promise.all([
    db_service.find({
      model: notificationModel,
      filter,
      options: {
        skip,
        limit: Number(limit),
        sort: { createdAt: -1 },
      },
    }),
    notificationModel.countDocuments(filter),
    notificationModel.countDocuments({ userId: req.user._id, isRead: false }),
  ]);

  return successResponse({
    res,
    status: 200,
    message: "Notifications fetched successfully",
    data: {
      notifications,
      unreadCount,
      pagination: {
        totalDocs,
        totalPages: Math.ceil(totalDocs / Number(limit)),
        currentPage: Number(page),
        limit: Number(limit),
      },
    },
  });
};

export const markAsRead = async (req, res, next) => {
  const { id } = req.params;

  const notification = await db_service.findOneAndUpdate({
    model: notificationModel,
    filter: { _id: id, userId: req.user._id },
    update: { isRead: true },
    options: { new: true },
  });

  if (!notification) {
    throw new Error("Notification not found", { cause: 404 });
  }

  return successResponse({
    res,
    status: 200,
    message: "Notification marked as read",
    data: notification,
  });
};

export const markAllAsRead = async (req, res, next) => {
  await notificationModel.updateMany(
    { userId: req.user._id, isRead: false },
    { $set: { isRead: true } },
  );

  return successResponse({
    res,
    status: 200,
    message: "All notifications marked as read",
  });
};
