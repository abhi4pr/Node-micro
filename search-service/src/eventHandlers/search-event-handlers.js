import Search from "../models/Search.js";

import logger from "../utils/logger.js";

export const handlePostCreated = async (event) => {
  try {
    const newSearchPost = new Search({
      postId: event.postId,
      userId: event.userId,
      content: event.content,
      createdAt: event.createdAt,
    });
    await newSearchPost.save();
    logger.info(
      `search post created ${event.postId}, ${newSearchPost._id.toString()}`,
    );
  } catch (err) {
    logger.error("error handling post creation event", err);
  }
};
