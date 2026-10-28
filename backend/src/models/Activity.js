import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    /*
    activity → college event / activity report
    creative → own work (article, poem, drawing...)
    achievement → a prize, rank or selection someone won
    club        → an activity of a college club (NSS, NCC...)
    */
    type: {
      type: String,
      enum: ["activity", "club", "creative", "achievement"],
      default: "activity",
    },

    imageRequired: {
      type: Boolean,
      default: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Activity", activitySchema);