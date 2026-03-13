import logger from "../utils/logger.js";
import jwt from "jsonwebtoken";

const validateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    logger.warn("access attempt without token");
    return res.status(500).json({
      success: false,
      message: "authentication required",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn("invalid token");
      return res.status(409).json({
        success: false,
        message: "invalid token",
      });
    }
    req.user = user;
    next();
  });
};

export default validateToken;
