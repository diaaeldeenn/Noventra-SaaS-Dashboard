import jwt from "jsonwebtoken";
import * as db_service from "../../DB/db.service.js";
import userModel from "../../DB/models/user.model.js";

export const authentication = async (req, res, next) => {
  try {
    const { token } = req.headers;
    if (!token) {
      return next(
        Object.assign(new Error("Token Not Provided"), { cause: 401 }),
      );
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    if (!decoded || !userId) {
      return next(Object.assign(new Error("Invalid Token"), { cause: 401 }));
    }
    const user = await db_service.findOne({
      model: userModel,
      filter: { _id: userId, isActive: true },
    });
    if (!user) {
      return next(
        Object.assign(new Error("User Not Found or Inactive"), { cause: 404 }),
      );
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
};

export const authorization = (roles = []) => {
  return (req, res, next) => {
    try {
      if (!req.user || !roles.includes(req.user.role)) {
        return next(
          Object.assign(new Error("UnAuthorized Access"), { cause: 403 }),
        );
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
