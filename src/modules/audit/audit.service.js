import { DateTime } from "luxon";
import * as db_service from "../../DB/db.service.js";
import auditLogModel from "../../DB/models/audit.model.js";
import { formatEnum } from "../../common/enum/sales.enum.js";
import { successResponse } from "../../common/utils/response.success.js";
import {
  exportAuditLogsToExcel,
  exportAuditLogsToPDF,
  exportAuditLogsToWord,
} from "./audit.export.helper.js";

export const getAuditLogs = async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    userId,
    action,
    targetModel,
    startDate,
    endDate,
  } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = {};

  if (userId) filter.userId = userId;
  if (action) filter.action = action;
  if (targetModel) filter.targetModel = targetModel;

  if (startDate || endDate) {
    filter.createdAt = {};

    if (startDate) {
      filter.createdAt.$gte = DateTime.fromISO(startDate)
        .startOf("day")
        .toJSDate();
    }

    if (endDate) {
      filter.createdAt.$lte = DateTime.fromISO(endDate).endOf("day").toJSDate();
    }
  }

  const [logs, totalDocs] = await Promise.all([
    db_service.find({
      model: auditLogModel,
      filter,
      select: "-__v",
      options: {
        skip,
        limit: Number(limit),
        sort: { createdAt: -1 },
        populate: [{ path: "userId", select: "name email role" }],
      },
    }),
    auditLogModel.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalDocs / Number(limit));

  return successResponse({
    res,
    status: 200,
    message: "Audit logs fetched successfully",
    data: {
      logs,
      pagination: {
        totalDocs,
        totalPages,
        currentPage: Number(page),
        limit: Number(limit),
      },
    },
  });
};

export const exportAuditLogs = async (req, res, next) => {
  const {
    format = formatEnum.excel,
    userId,
    action,
    targetModel,
    startDate,
    endDate,
  } = req.query;

  const filter = {};

  if (userId) filter.userId = userId;
  if (action) filter.action = action;
  if (targetModel) filter.targetModel = targetModel;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      filter.createdAt.$gte = DateTime.fromISO(startDate)
        .startOf("day")
        .toJSDate();
    }
    if (endDate) {
      filter.createdAt.$lte = DateTime.fromISO(endDate).endOf("day").toJSDate();
    }
  }

  const logs = await db_service.find({
    model: auditLogModel,
    filter,
    options: {
      limit: 5000,
      sort: { createdAt: -1 },
      populate: [{ path: "userId", select: "userName email" }],
    },
  });

  if (!logs || logs.length === 0) {
    throw new Error("No audit logs available for export", { cause: 404 });
  }

  const exportDateStr = DateTime.now().toFormat("yyyy-MM-dd_HH-mm");

  if (format === formatEnum.pdf) {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=audit_logs_${exportDateStr}.pdf`,
    );
    return exportAuditLogsToPDF(logs, res);
  }

  if (format === formatEnum.word) {
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=audit_logs_${exportDateStr}.docx`,
    );
    return exportAuditLogsToWord(logs, res);
  }

  if (format === formatEnum.excel) {
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=audit_logs_${exportDateStr}.xlsx`,
    );
    return exportAuditLogsToExcel(logs, res);
  }

  throw new Error(`Unsupported export format: ${format}`, { cause: 400 });
};
