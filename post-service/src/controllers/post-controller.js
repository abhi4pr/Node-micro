import logger from "../utils/logger.js";
import Post from "../models/Post.js";

export const createPost = async (req, res) => {
  try {
    const { content, mediaIds } = req.body;
    const newlyCreatedPost = new Post({
      user: req.user.userId,
      content,
      mediaIds: mediaIds || [],
    });
    await newlyCreatedPost.save();
    logger.info("post created success", newlyCreatedPost);
    res.status(201).json({
      success: false,
      message: "post created successfully",
    });
  } catch (e) {
    logger.error("error creating post", e);
    res.status(500).json({
      success: false,
      message: "error creating post",
    });
  }
};

export const getAllPosts = async (req, res) => {
  try {
  } catch (e) {
    logger.error("error getting post lists", e);
    res.status(500).json({
      success: false,
      message: "error getting post lists",
    });
  }
};

export const getPost = async (req, res) => {
  try {
  } catch (e) {
    logger.error("error getting post by id", e);
    res.status(500).json({
      success: false,
      message: "error getting post by id",
    });
  }
};

export const deletePost = async (req, res) => {
  try {
  } catch (e) {
    logger.error("error deleting post by id", e);
    res.status(500).json({
      success: false,
      message: "error deleting post by id",
    });
  }
};
