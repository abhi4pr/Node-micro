import dotenv from "dotenv";
import mongoose from "mongoose";
import logger from "./utils/logger";
import express from "express";
import helmet from "helmet";
import cors from "cors";

const app = express();

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
