import logger from "../utils/logger.js";
import Post from "../models/Post.js";
import { validateCreatePost } from "../utils/validation.js";
import { publishEvent } from "../utils/rabbitmq.js";

async function invalidatePostCache(req, input) {
  const cachedKey = `post:${input}`;
  await req.redisClient.del(cachedKey);
  const keys = await req.redisClient.keys("posts:*");
  if (keys.length > 0) {
    await req.redisClient.del(keys);
  }
}

export const createPost = async (req, res) => {
  logger.info("create post api hit ...");
  try {
    const { error } = validateCreatePost(req.body);
    if (error) {
      logger.warn("validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { content, mediaIds } = req.body;
    const newlyCreatedPost = new Post({
      user: req.user.userId,
      content,
      mediaIds: mediaIds || [],
    });
    await newlyCreatedPost.save();
    await invalidatePostCache(req, newlyCreatedPost._id.toString());
    logger.info("post created success", newlyCreatedPost);
    res.status(201).json({
      success: true,
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const cacheKey = `posts:${page}:${limit}`;
    const cachedPosts = await req.redisClient.get(cacheKey);
    if (cachedPosts) {
      return res.json(JSON.parse(cachedPosts));
    }
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
    const totalNoOfPosts = await Post.countDocuments();
    const result = {
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalNoOfPosts / limit),
      totalPosts: totalNoOfPosts,
    };
    await req.redisClient.setex(cacheKey, 300, JSON.stringify(result));
    res.json(result);
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
    const postId = req.params.id;
    const cacheKey = `post:${postId}`;
    const cachedPost = await req.redisClient.get(cacheKey);
    if (cachedPost) {
      return res.json(JSON.parse(cachedPost));
    }
    const singlePostDetailsById = await Post.findById(postId);
    if (!singlePostDetailsById) {
      return res.status(404).json({
        success: false,
        message: "post not found",
      });
    }
    await req.redisClient.setex(
      cachedPost,
      3600,
      JSON.stringify(singlePostDetailsById),
    );
    res.json(singlePostDetailsById);
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
    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId,
    });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "post not found",
      });
    }
    await publishEvent("post.deleted", {
      postId: post._id.toString(),
      userId: req.user.userId,
      mediaIds: post.mediaIds,
    });
    await invalidatePostCache(req, req.params.id);
    res.json({
      message: "post deleted success",
      success: true,
    });
  } catch (e) {
    logger.error("error deleting post by id", e);
    res.status(500).json({
      success: false,
      message: "error deleting post by id",
    });
  }
};
