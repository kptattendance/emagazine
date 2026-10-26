import mongoose from "mongoose";

/*
One like per browser per article.

visitorId is a random ID the reader's browser keeps;
it identifies a browser, not a person.
*/

const articleLikeSchema = new mongoose.Schema(
  {
    content: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MagazineContent",
      required: true,
    },

    visitorId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

articleLikeSchema.index(
  { content: 1, visitorId: 1 },
  { unique: true }
);

export default mongoose.model("ArticleLike", articleLikeSchema);
