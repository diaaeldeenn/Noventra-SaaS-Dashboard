import express from "express";
import connectionDB from "./DB/connectionDB.js";
import userRouter from "./modules/users/user.controller.js";
import cors from "cors";
import { redisConnection } from "./DB/redis/redis.db.js";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import authRouter from "./modules/auth/auth.controller.js";


const app = express();

app.use(async (req, res, next) => {
  await connectionDB();
  next();
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 200, // Limit each IP to 200 requests per `window`
  message: "To Many Request Try After 15 Minutes",
  legacyHeaders: false,
});

app.use(cors(), helmet(), limiter, express.json());
app.use("/src/DB/uploads",express.static("src/DB/uploads"));
app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome In My Api" });
});
redisConnection();
app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("{/*demo}", (req, res) => {
  throw new Error(`Url ${req.originalUrl} Not Found!`, { cause: 404 });
});
app.use((err, req, res, next) => {
  res.status(err.cause || 500).json({ message: err.message, stack: err.stack });
});

export default app;