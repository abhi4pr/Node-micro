import logger from "../utils/logger";
import { validateRegistration } from "../utils/validation";
import User from "../models/User";
import generateToken from "../utils/generateToken";

export const registerUser = async (req, res) => {
  logger.info("registration endpoint hit");
  try {
    const { error } = validateRegistration(req.body);
    if (error) {
      logger.warn("validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { email, password, username } = req.body;
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      logger.warn("user already exist");
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    user = new User({ username, email, password });
    await user.save();
    logger.warn("user saved success", user._id);

    const { accessToken, refreshToken } = await generateToken(user);
    res.status(201).json({
      success: true,
      message: "user registered success",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("registration failed", error);
    res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
