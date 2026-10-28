import ArticleLike from "../models/ArticleLike.js";
import MagazineContent from "../models/MagazineContent.js";

/*
=====================================================
READER LIKES
=====================================================

Readers do not log in. Comments were removed by the
magazine committee; only likes remain.
=====================================================
*/

const findPublished = (contentId) =>
  MagazineContent.findOne({
    _id: contentId,
    status: "published",
  });


/*
=====================================================
LIKE / UNLIKE (PUBLIC, NO LOGIN)
=====================================================

One like per browser per article; clicking again
removes it. The per-network rate limit stops scripts.
=====================================================
*/

const VISITOR_ID_PATTERN = /^[A-Za-z0-9-]{16,64}$/;

export const toggleLike = async (req, res) => {
  try {
    const visitorId = String(req.body.visitorId || "");

    if (!VISITOR_ID_PATTERN.test(visitorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request.",
      });
    }

    const article = await findPublished(req.params.contentId);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found.",
      });
    }

    const removed = await ArticleLike.findOneAndDelete({
      content: article._id,
      visitorId,
    });

    let liked;

    if (removed) {
      liked = false;

      await MagazineContent.updateOne(
        { _id: article._id, likeCount: { $gt: 0 } },
        { $inc: { likeCount: -1 } }
      );
    } else {
      try {
        await ArticleLike.create({
          content: article._id,
          visitorId,
        });

        liked = true;

        await MagazineContent.updateOne(
          { _id: article._id },
          { $inc: { likeCount: 1 } }
        );
      } catch (error) {
        // Two clicks at once: the first one already liked it
        if (error?.code !== 11000) throw error;

        liked = true;
      }
    }

    const updated = await MagazineContent.findById(article._id)
      .select("likeCount")
      .lean();

    return res.status(200).json({
      success: true,
      liked,
      likeCount: updated?.likeCount || 0,
    });
  } catch (error) {
    console.error("TOGGLE LIKE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update the like.",
    });
  }
};

// Which of these articles this browser has liked
export const getLikedArticles = async (req, res) => {
  try {
    const visitorId = String(req.query.visitorId || "");

    if (!VISITOR_ID_PATTERN.test(visitorId)) {
      return res.status(200).json({ success: true, data: [] });
    }

    const likes = await ArticleLike.find({ visitorId })
      .select("content")
      .lean();

    return res.status(200).json({
      success: true,
      data: likes.map((like) => String(like.content)),
    });
  } catch (error) {
    console.error("GET LIKED ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load likes.",
    });
  }
};

// When an article is deleted, its likes go too.
// A failure here never undoes or blocks the article delete.
export const deleteFeedbackFor = async (contentId) => {
  try {
    await ArticleLike.deleteMany({ content: contentId });
  } catch (error) {
    console.error("DELETE FEEDBACK ERROR:", error);
  }
};
