import { Schema, model } from "mongoose";
import { notificationEnum } from "../../common/enum/notification.enum.js";

const notificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(notificationEnum),
      default: notificationEnum.AUDIT_ALERT,
    },
    action: {
      type: String,
    },
    targetId: {
      type: Schema.Types.ObjectId,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const notificationModel = model("Notification", notificationSchema);
export default notificationModel;
