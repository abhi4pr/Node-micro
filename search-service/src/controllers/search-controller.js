import logger from "../utils/logger.js";
import Search from "../models/Search.js";

export const searchPostController = async (req, res) => {
  logger.info("search endpoint hit...");
  try {
    const { query } = req.query;
    const results = await Search.find(
      {
        $text: { $search: query },
      },
      { score: { $meta: "textScore" } },
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(10);
    res.json(results);
  } catch (error) {
    logger.error("error searching post", error);
    return res.status(500).json({
      success: false,
      message: "error searching post",
    });
  }
};
