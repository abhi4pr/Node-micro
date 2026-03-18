import pkg from "cloudinary";
import logger from "../utils/logger.js";

const { v2: cloudinary } = pkg;

cloudinary.config({
  cloud_name: process.env.cloud_name || "dr2oiwhr8",
  api_key: process.env.api_key || "773179384363792",
  api_secret: process.env.api_secret || "W2hWVOiEQOEG_rwDrvkfV5rgwGM",
});

export const uploadMediaToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          logger.error("error while uploading file", error);
          reject(error);
        } else {
          resolve(result);
        }
      },
    );
    uploadStream.end(file.buffer);
  });
};

export const deleteMediaFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    logger.info("media deleted from cloudinary", publicId);
    return result;
  } catch (err) {
    logger.error("error deleting media from cloudinary", err);
    throw err;
  }
};

export default uploadMediaToCloudinary;
