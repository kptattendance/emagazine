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
    */
    type: {
      type: String,
      enum: ["activity", "creative"],
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