import mongoose, { Schema } from "mongoose";
import { TargetEnum } from "../../common/enum/target.enum.js";

const auditLogSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    targetModel: {
      type: String,
      required: true,
      enum: Object.values(TargetEnum),
    },
    details: {
      type: String,
    },
  },
  { timestamps: true },
);

const auditLogModel =
  mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);

export default auditLogModel;
