import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import Redis from "ioredis";
import cors from "cors";
import helmet from "helmet";
import errorHandler from "./middleware/errorHandler.js";
import logger from "./utils/logger.js";
import { connectToRabbitMQ, consumeEvent } from "./utils/rabbitmq.js";
import searchRoutes from "./routes/search-routes.js";
import {
  handlePostCreated,
  handlePostDeleted,
} from "./eventHandlers/search-event-handlers.js";

const app = express();
const PORT = process.env.PORT || 5004;

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => logger.info("connected to db"))
  .catch((error) => logger.error("mongodb connection error", error));

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`received ${req.method} req to ${req.url}`);
  logger.info(`request body, ${req.body}`);
  next();
});

app.use("/api/search", searchRoutes);

app.use(errorHandler);

async function startServer() {
  try {
    await connectToRabbitMQ();
    await consumeEvent("post.created", handlePostCreated);
    await consumeEvent("post.deleted", handlePostDeleted);
    app.listen(PORT, () => {
      logger.info(`search service running on ${PORT}`);
    });
  } catch (e) {
    logger.error("failed to connect", e);
    process.exit(1);
  }
}

startServer();

process.on("unhandledRejection", (reason, promise) => {
  logger.error("unhandled rejection at", promise, "reason", reason);
});
