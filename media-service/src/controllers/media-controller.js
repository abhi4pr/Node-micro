import logger from "../utils/logger.js";
import uploadMediaToCloudinary from "../utils/cloudinary.js";
import Media from "../models/Media.js";

export const uploadMedia = async (req, res) => {
  logger.info("starting media upload");
  try {
    if (!req.file) {
      logger.error("no file found, please add a file");
      return res.status(400).json({
        message: "no file found, please add a file",
        success: false,
      });
    }
    const { originalname, mimetype, buffer } = req.file;
    const userId = req.user.userId;
    logger.info(`file details, name:${originalname}, Type:${mimetype}`);
    logger.info("uploading file to cloundinary");
    const cloundinaryUploadResult = await uploadMediaToCloudinary(req.file);
    logger.info(
      `cloudinary upload success, public-id is:${cloundinaryUploadResult.public_id}`,
    );
    const newlyCreatedMedia = new Media({
      public_id: cloundinaryUploadResult.public_id,
      originalName: originalname,
      mimeType: mimetype,
      url: cloundinaryUploadResult.secure_url,
      userId,
    });
    await newlyCreatedMedia.save();
    res.status(200).json({
      success: true,
      message: "media upload success",
      media_id: newlyCreatedMedia._id,
      url: newlyCreatedMedia.url,
    });
  } catch (e) {
    logger.error("error uploading media file", e);
    res.status(500).json({
      success: false,
      message: "error uploading media file",
    });
  }
};

export const getAllMedias = async (req, res) => {
  try {
    const results = await Media.find({});
    res.json({ results });
  } catch (e) {
    logger.error("error getting all media files", e);
    res.status(500).json({
      success: false,
      message: "error getting all media files",
    });
  }
};
