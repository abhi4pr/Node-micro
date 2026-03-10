import logger from "../utils/logger.js";
import { validateRegistration, validateLogin } from "../utils/validation.js";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import RefreshToken from "../models/RefreshToken.js";

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
      return res.status(409).json({
        success: false,
        message: "user allready registered",
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

export const loginUser = async (req, res) => {
  logger.info("login endpoint hit ...");
  try {
    const { error } = validateLogin(req.body);
    if (error) {
      logger.warn("validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn("invalid user");
      return res.status(400).json({
        success: false,
        message: "invalid credentials",
      });
    }
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      logger.warn("invalid password");
      return res.status(400).json({
        success: false,
        message: "invalid password",
      });
    }
    const { accessToken, refreshToken } = await generateToken(user);
    res.json({
      accessToken,
      refreshToken,
      userId: user._id,
    });
  } catch (e) {
    logger.error("login error occured", e);
    res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

export const refreshTokenUser = async (req, res) => {
  logger.info("refresh token api hit ...");
  try {
    const refreshtoken = req.body;
    if (!refreshtoken) {
      logger.warn("refresh token missing");
      return res.status(400).json({
        success: false,
        message: "refresh token missing",
      });
    }

    const storedToken = await RefreshToken.findOne({ token: refreshtoken });
    if (!storedToken || storedToken.expiresAt < new Date()) {
      logger.warn("invalid or expired refresh token");
      return res.status(400).json({
        success: false,
        message: "invalid or expired refresh token",
      });
    }
    const user = await User.findById(storedToken.user);
    if (!user) {
      logger.warn("user not found");
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await generateToken(user);
    await RefreshToken.deleteOne({ _id: storedToken._id });
    res.json({
      accessToken: newAccessToken,
      refreshtoken: newRefreshToken,
    });
  } catch (e) {
    logger.error("refresh token error occured", e);
    res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

export const logoutUser = async (req, res) => {
  logger.info("logoutuser api hit ...");
  try {
    const refreshtoken = req.body;
    if (!refreshtoken) {
      logger.warn("refresh token missing");
      return res.status(400).json({
        success: false,
        message: "refresh token missing",
      });
    }
    await RefreshToken.deleteOne({ token: refreshtoken });
    logger.info("refresh token deleted");
    res.json({
      success: false,
      message: "logout user success",
    });
  } catch (e) {
    logger.error("logout error occured", e);
    res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
