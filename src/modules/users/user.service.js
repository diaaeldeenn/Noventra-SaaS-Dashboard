import { RoleEnum } from "../../common/enum/user.enum.js";
import { successResponse } from "../../common/utils/response.success.js";
import { decrypt } from "../../common/utils/security/encrypt.security.js";
import * as db_service from "../../DB/db.service.js";
import userModel from "../../DB/models/user.model.js";

export const getAllEmployees = async (req, res, next) => {
  try {
    const employees = await db_service.find({
      model: userModel,
      filter: { role: { $ne: RoleEnum.admin } },
      select: "-password",
    });
    const decryptedEmployees = employees.map((emp) => {
      const empObj = emp.toObject();
      if (empObj.phone) {
        empObj.phone = decrypt(empObj.phone);
      }
      return empObj;
    });
    return successResponse({ res, data: decryptedEmployees });
  } catch (error) {
    next(error);
  }
};

export const employeesStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const employee = await db_service.findById({
      model: userModel,
      id,
    });

    if (!employee) {
      throw new Error("Employee not found", {
        cause: 404,
      });
    }

    employee.isActive = !employee.isActive;

    await employee.save();

    return successResponse({
      res,
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};
