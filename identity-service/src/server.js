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
import routes from "./routes/identity-service.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 5001;

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

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 10,
  duration: 1,
});

app.use((req, res, next) => {
  rateLimiter
    .consume(req.ip)
    .then(() => next())
    .catch((err) => {
      logger.warn(`rate limiter exceeded for ip, ${req.ip}`);
      res.status(429).json({ success: false, message: "too many requests" });
    });
});

const sensitiveEndpointsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`sensitive endpoints`);
    res.status(429).json({ success: false, message: "too many requests" });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

app.use("/api/auth", routes);
app.use("/api/auth/register", sensitiveEndpointsLimiter);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`identity service running on ${PORT}`);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("unhandled rejection at", promise, "reason", reason);
});
