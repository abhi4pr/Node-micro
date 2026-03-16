import { cloudinary, v2 } from "cloudinary";
import logger from "../utils/logger.js";

cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.api_key,
  api_secret: process.env.api_secret,
});

const uploadMediaToCloudinary = (file) => {
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

export default uploadMediaToCloudinary;
