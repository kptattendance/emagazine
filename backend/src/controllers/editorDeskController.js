import EditorDesk from "../models/EditorDesk.js";

import {
  deleteImage,
  uploadImage,
} from "../config/storage.js";

const EDITOR_FOLDER = "kpt-emagazine/editor";

/*
=====================================================
GET (PUBLIC)
=====================================================

Returns null until a message has been written.
=====================================================
*/

export const getEditorDesk = async (req, res) => {
  try {
    const desk = await EditorDesk.findOne().lean();

    return res.status(200).json({
      success: true,
      data: desk?.message ? desk : null,
    });
  } catch (error) {
    console.error("GET EDITOR DESK ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load the editor's desk.",
    });
  }
};


/*
=====================================================
SAVE
=====================================================

Creates the editor's desk the first time, updates it
after that. An empty message hides the section.
=====================================================
*/

export const saveEditorDesk = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const designation = String(req.body.designation || "").trim();
    const message = String(req.body.message || "").trim();

    if (message && !name) {
      return res.status(400).json({
        success: false,
        message: "Please enter the editor's name.",
      });
    }

    const desk =
      (await EditorDesk.findOne()) || new EditorDesk();

    const oldPhoto = desk.photo;

    if (req.file) {
      desk.photo = await uploadImage(req.file, EDITOR_FOLDER);
    }

    desk.name = name;
    desk.designation = designation;
    desk.message = message;

    await desk.save();

    // Remove the replaced photo only after the save succeeded
    if (req.file && oldPhoto) {
      await deleteImage(oldPhoto);
    }

    return res.status(200).json({
      success: true,
      message: message
        ? "Editor's desk saved."
        : "Editor's desk hidden from the home page.",
      data: desk,
    });
  } catch (error) {
    console.error("SAVE EDITOR DESK ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save the editor's desk.",
    });
  }
};
