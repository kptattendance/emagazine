import mongoose from "mongoose";

/*
"From the Editor's Desk" on the home page.
There is only ever one of these.
*/

const editorDeskSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "",
      trim: true,
    },

    // e.g. Chief Editor, Senior Grade Lecturer
    designation: {
      type: String,
      default: "",
      trim: true,
    },

    message: {
      type: String,
      default: "",
      trim: true,
    },

    photo: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("EditorDesk", editorDeskSchema);
