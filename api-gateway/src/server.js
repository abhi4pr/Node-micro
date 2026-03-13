import dotenv from "dotenv";
dotenv.config();
import express from "express";
import helmet from "helmet";
import cors from "cors";
import Redis from "ioredis";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import logger from "./utils/logger.js";
import proxy from "express-http-proxy";
import errorHandler from "./middleware/errorHandler.js";
import validateToken from "./middleware/authMiddleware.js";

const app = express();
const PORT = process.env.PORT || 5000;

const redisClient = new Redis(process.env.REDIS_URL);

app.use(helmet());
app.use(cors());
app.use(express.json());

const ratelimitOptions = rateLimit({
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

app.use(ratelimitOptions);

app.use((req, res, next) => {
  logger.info(`received ${req.method} req to ${req.url}`);
  logger.info(`request body, ${req.body}`);
  next();
});

const proxyOptions = {
  proxyReqPathResolver: (req) => {
    return req.originalUrl.replace(/^\/v1/, "/api");
  },
  proxyErrorHandler: (err, res, next) => {
    logger.error(`Proxy error: ${err.message}`);
    res.status(500).json({
      message: `Internal server error`,
      error: err.message,
    });
  },
};

app.use(
  "/v1/auth",
  proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, useReq, userRes) => {
      logger.info(
        `Response received from identity service: ${proxyRes.statusCode}`,
      );
      return proxyResData;
    },
  }),
);

app.use(
  "/v1/posts",
  validateToken,
  proxy(process.env.POST_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, useReq, userRes) => {
      logger.info(
        `Response received from post service: ${proxyRes.statusCode}`,
      );
      return proxyResData;
    },
  }),
);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`api gateway is running on ${PORT}`);
  logger.info(
    `identity service running on ${process.env.IDENTITY_SERVICE_URL}`,
  );
  logger.info(`post service running on ${process.env.POST_SERVICE_URL}`);
  logger.info(`Redis url ${process.env.REDIS_URL}`);
});
