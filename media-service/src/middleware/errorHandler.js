import logger from "../utils/logger.js";

const errorHanlder = (err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "internal server error",
  });
};

export default errorHanlder;
