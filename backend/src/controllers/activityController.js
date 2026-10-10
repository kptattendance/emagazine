import Activity from "../models/Activity.js";
import MagazineContent from "../models/MagazineContent.js";

const ACTIVITY_TYPES = ["activity", "creative"];

/*
=====================================================
DELETE SINGLE ACTIVITY
=====================================================
Activity can be permanently deleted only if it is not
used by any magazine content.
*/

export const deleteActivity = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found.",
      });
    }

    const usedCount = await MagazineContent.countDocuments({
      activity: activity._id,
    });

    if (usedCount > 0) {
      return res.status(400).json({
        success: false,
        message:
          `Cannot delete "${activity.name}" because it is already used by ${usedCount} magazine content item(s). Deactivate it instead.`,
      });
    }

    await Activity.findByIdAndDelete(activity._id);

    return res.status(200).json({
      success: true,
      message: "Activity deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE ACTIVITY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete activity.",
      error: error.message,
    });
  }
};


/*
=====================================================
DELETE MULTIPLE ACTIVITIES
=====================================================
Only activities that are not used by magazine content
will be deleted.
*/

export const deleteMultipleActivities = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one activity.",
      });
    }

    const activities = await Activity.find({
      _id: { $in: ids },
    });

    if (activities.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No activities found.",
      });
    }

    const blocked = [];
    const deletableIds = [];

    for (const activity of activities) {
      const usedCount = await MagazineContent.countDocuments({
        activity: activity._id,
      });

      if (usedCount > 0) {
        blocked.push({
          name: activity.name,
          usedCount,
        });
      } else {
        deletableIds.push(activity._id);
      }
    }

    if (deletableIds.length > 0) {
      await Activity.deleteMany({
        _id: { $in: deletableIds },
      });
    }

    let message = "";

    if (deletableIds.length > 0 && blocked.length === 0) {
      message = `${deletableIds.length} activity(s) deleted successfully.`;
    } else if (deletableIds.length > 0 && blocked.length > 0) {
      message =
        `${deletableIds.length} activity(s) deleted. ` +
        `${blocked.length} activity(s) could not be deleted because they are already used by magazine content.`;
    } else {
      message =
        "None of the selected activities could be deleted because they are already used by magazine content.";
    }

    return res.status(200).json({
      success: true,
      message,
      deletedCount: deletableIds.length,
      blockedCount: blocked.length,
      blocked,
    });
  } catch (error) {
    console.error(
      "DELETE MULTIPLE ACTIVITIES ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete selected activities.",
      error: error.message,
    });
  }
};
/*
=====================================================
GET ALL ACTIVITIES
=====================================================
Admin can see both active and inactive activities.
*/

export const getActivities = async (req, res) => {
  try {
    const activities = await Activity.find()
      .sort({ order: 1, name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: activities.length,
      data: activities,
    });
  } catch (error) {
    console.error("GET ACTIVITIES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch activities.",
      error: error.message,
    });
  }
};


/*
=====================================================
GET ACTIVE ACTIVITIES
=====================================================
Used by student/staff/HOD forms for dropdown.
*/

export const getActiveActivities = async (req, res) => {
  try {
    const activities = await Activity.find({
      isActive: true,
    })
      .sort({ order: 1, name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: activities.length,
      data: activities,
    });
  } catch (error) {
    console.error("GET ACTIVE ACTIVITIES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch active activities.",
      error: error.message,
    });
  }
};


/*
=====================================================
GET SINGLE ACTIVITY
=====================================================
*/

export const getActivityById = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: activity,
    });
  } catch (error) {
    console.error("GET ACTIVITY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch activity.",
      error: error.message,
    });
  }
};


/*
=====================================================
CREATE ACTIVITY
=====================================================
Admin adds a new activity.
*/

export const createActivity = async (req, res) => {
  try {
    const { name, order, type, imageRequired } = req.body;

    const cleanName = String(name || "").trim();

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: "Activity name is required.",
      });
    }

    const existingActivity = await Activity.findOne({
      name: {
        $regex: `^${cleanName.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        )}$`,
        $options: "i",
      },
    });

    if (existingActivity) {
      return res.status(409).json({
        success: false,
        message: "This activity already exists.",
      });
    }

    if (
      type !== undefined &&
      !ACTIVITY_TYPES.includes(type)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid activity type.",
      });
    }

    const activity = await Activity.create({
      name: cleanName,
      type: type || "activity",
      imageRequired:
        imageRequired !== undefined
          ? Boolean(imageRequired)
          : true,
      order:
        order !== undefined && order !== ""
          ? Number(order)
          : 0,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Activity created successfully.",
      data: activity,
    });
  } catch (error) {
    console.error("CREATE ACTIVITY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create activity.",
      error: error.message,
    });
  }
};


/*
=====================================================
UPDATE ACTIVITY
=====================================================
Admin can rename/reorder an activity.
*/

export const updateActivity = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found.",
      });
    }

    const { name, order, type, imageRequired } = req.body;

    if (type !== undefined) {
      if (!ACTIVITY_TYPES.includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid activity type.",
        });
      }

      activity.type = type;
    }

    if (imageRequired !== undefined) {
      activity.imageRequired = Boolean(imageRequired);
    }

    if (name !== undefined) {
      const cleanName = String(name).trim();

      if (!cleanName) {
        return res.status(400).json({
          success: false,
          message: "Activity name cannot be empty.",
        });
      }

      const duplicate = await Activity.findOne({
        _id: { $ne: activity._id },
        name: {
          $regex: `^${cleanName.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          )}$`,
          $options: "i",
        },
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "Another activity with this name already exists.",
        });
      }

      activity.name = cleanName;
    }

    if (order !== undefined && order !== "") {
      activity.order = Number(order);
    }

    await activity.save();

    return res.status(200).json({
      success: true,
      message: "Activity updated successfully.",
      data: activity,
    });
  } catch (error) {
    console.error("UPDATE ACTIVITY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update activity.",
      error: error.message,
    });
  }
};


/*
=====================================================
TOGGLE ACTIVITY
=====================================================
We don't delete activities.
We activate/deactivate them.
*/

export const toggleActivity = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found.",
      });
    }

    activity.isActive = !activity.isActive;

    await activity.save();

    return res.status(200).json({
      success: true,
      message: activity.isActive
        ? "Activity activated successfully."
        : "Activity deactivated successfully.",
      data: activity,
    });
  } catch (error) {
    console.error("TOGGLE ACTIVITY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to change activity status.",
      error: error.message,
    });
  }
};