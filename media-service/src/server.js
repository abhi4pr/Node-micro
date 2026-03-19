import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import mediaRoutes from "./routes/media-routes.js";
import errorHandler from "./middleware/errorHandler.js";
import logger from "./utils/logger.js";
import express from "express";
import { connectToRabbitMQ, consumeEvent } from "./utils/rabbitmq.js";
import { handlePostDeleted } from "./eventHandlers/media-event-handlers.js";

const app = express();
const PORT = process.env.PORT || 5003;

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

app.use("/api/media", mediaRoutes);

app.use(errorHandler);

async function startServer() {
  try {
    await connectToRabbitMQ();
    await consumeEvent("post.deleted", handlePostDeleted);
    app.listen(PORT, () => {
      logger.info(`media service running on ${PORT}`);
    });
  } catch (e) {
    logger.error("failed to connect", e);
    process.exit(1);
  }
}

startServer();

// app.listen(PORT, () => {
//   logger.info(`media service running on ${PORT}`);
// });

process.on("unhandledRejection", (reason, promise) => {
  logger.error("unhandled rejection at", promise, "reason", reason);
});
