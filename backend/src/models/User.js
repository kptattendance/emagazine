import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    clerkUserId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    role: {
      type: String,
      enum: [
        "admin",
        "hod",
        "principal",
        "staff",
        "mag_coordinator",
        "student",
      ],
      default: "student",
    },

    department: {
      type: String,
      enum: [
        "AE", // Automobile Engineering
        "CE", // Civil Engineering
        "ME", // Mechanical Engineering
        "EE", // Electrical & Electronics Engineering
        "CH", // Chemical Engineering
        "PT", // Polymer Technology
        "EC", // Electronics & Communication Engineering
        "CS", // Computer Science & Engineering
        "SC", // Science
        "IN", // Institute / Institutional Activities
      ],
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;