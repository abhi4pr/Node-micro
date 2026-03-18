import express from "express";
import multer from "multer";
import { getAllMedias, uploadMedia } from "../controllers/media-controller.js";
import authenticateRequest from "../middleware/authMiddleware.js";
import logger from "../utils/logger.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("file");

router.post(
  "/upload",
  authenticateRequest,
  (req, res, next) => {
    upload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        logger.error("multer error while uploading", err);
        return res.status(400).json({
          message: "multer error while uploading",
          error: err.message,
          stack: err.stack,
        });
      } else if (err) {
        logger.error("unknown error while uploading", err);
        return res.status(400).json({
          message: "unknown error while uploading",
          error: err.message,
          stack: err.stack,
        });
      }
      if (!req.file) {
        return res.status(400).json({
          message: "no file found",
        });
      }
      next();
    });
  },
  uploadMedia,
);

router.get("/get", authenticateRequest, getAllMedias);

export default router;
