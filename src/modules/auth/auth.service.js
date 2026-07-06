import { successResponse } from "../../common/utils/response.success.js";
import {
  decrypt,
  encrypt,
} from "../../common/utils/security/encrypt.security.js";
import {
  CompareHash,
  Hash,
} from "../../common/utils/security/hash.security.js";
import * as db_service from "../../DB/db.service.js";
import jwt from "jsonwebtoken";
import userModel from "../../DB/models/user.model.js";

export const signUp = async (req, res, next) => {
  const { name, email, password, rePassword, gender, phone, role } = req.body;
  try {
    if (await db_service.findOne({ model: userModel, filter: { email } })) {
      throw new Error("User Already Exist", { cause: 409 });
    }
    const user = await db_service.create({
      model: userModel,
      data: {
        name,
        email,
        password: Hash({ plainText: password }),
        gender,
        phone: encrypt(phone),
        role,
      },
    });
    successResponse({ res, status: 201, data: user });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await db_service.findOne({
      model: userModel,
      filter: { email },
    });
    if (!user) {
      throw new Error("User Not Exist", { cause: 409 });
    }
    if (!CompareHash({ plainText: password, cipherText: user.password })) {
      throw new Error("Invalid Password", { cause: 400 });
    }
    if (!user.isActive) {
      throw new Error(
        "Your account is deactivated. Please contact the admin.",
        { cause: 403 },
      );
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    successResponse({
      res,
      message: "LogIn Succefully",
      data: { token: token },
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const { password, createdAt, updatedAt, __v, ...rest } = req.user._doc;
    successResponse({ res, data: { ...rest, phone: decrypt(req.user.phone) } });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    let { id } = req.params;
    let { newPassword } = req.body;
    const user = await db_service.findById({ model: userModel, id });
    if (!user) {
      throw new Error("User not found", {
        cause: 404,
      });
    }
    const isSamePassword = CompareHash({
      plainText: newPassword,
      cipherText: user.password,
    });

    if (isSamePassword) {
      throw new Error("New password must be different from old password", {
        cause: 400,
      });
    }
    user.password = Hash({
      plainText: newPassword,
    });
    await user.save();
    successResponse({ res, message: "Password reset successfully" });
  } catch (error) {
    next(error);
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    let { oldPassword, newPassword, rePassword } = req.body;
    if (
      !CompareHash({ plainText: oldPassword, cipherText: req.user.password })
    ) {
      throw new Error("Invalid old Password", { cause: 400 });
    }
    const isSamePassword = CompareHash({
      plainText: newPassword,
      cipherText: req.user.password,
    });

    if (isSamePassword) {
      throw new Error("New password must be different from old password", {
        cause: 400,
      });
    }
    const hashNewPassword = Hash({ plainText: newPassword });
    req.user.password = hashNewPassword;
    await req.user.save();
    successResponse({ res });
  } catch (error) {
    next(error);
  }
};
