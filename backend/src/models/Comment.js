import mongoose from "mongoose";

import {
  VISITOR_PLACES,
  VISITOR_TYPES,
} from "../config/feedback.js";

/*
A reader's comment on a published article.
Readers do not log in; they type their details.
*/

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MagazineContent",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    visitorType: {
      type: String,
      enum: VISITOR_TYPES,
      required: true,
    },

    place: {
      type: String,
      enum: VISITOR_PLACES,
      required: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
    },

    /*
    Approximate location of the reader's network, from the
    hosting provider. Shown only to admin, coordinator, HOD.
    */
    approxLocation: {
      city: { type: String, default: "" },
      region: { type: String, default: "" },
      country: { type: String, default: "" },
    },

    // One-way hash of the reader's IP, to spot repeat posters.
    // The IP itself is never stored.
    ipHash: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

commentSchema.index({ content: 1, createdAt: -1 });

export default mongoose.model("Comment", commentSchema);
