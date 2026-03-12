import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import logger from "./utils/logger.js";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { RateLimiterRedis } from "rate-limiter-flexible";
import Redis from "ioredis";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import postRoutes from "./routes/post-routes.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 5002;

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => logger.info("connected to db"))
  .catch((error) => logger.error("mongodb connection error", error));

const redisClient = new Redis(process.env.REDIS_URL);

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`received ${req.method} req to ${req.url}`);
  logger.info(`request body, ${req.body}`);
  next();
});

app.use(
  "/api/posts",
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  postRoutes,
);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`post service running on ${PORT}`);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("unhandled rejection at", promise, "reason", reason);
});
