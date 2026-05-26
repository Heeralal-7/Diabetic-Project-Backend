const express = require("express");
const router = express.Router();

const ActivityLogService = require("../services/activityLogService");
const { adminMiddleware, subAdminMiddleware, adminOrSubAdmin } = require("../middleware/auth");

// ✅ GET ACTIVITY LOGS (ADMIN ONLY - CAN SEE ALL)
router.get("/admin/activities", adminMiddleware, async (req, res) => {
  try {
    const {
      performedBy,
      performedByModel,
      action,
      entityType,
      entityId,
      vendorType,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      search = ''
    } = req.query;

    const filters = {
      performedBy,
      performedByModel,
      action,
      entityType,
      entityId,
      vendorType,
      startDate,
      endDate,
      page: parseInt(page),
      limit: parseInt(limit),
      search
    };

    const result = await ActivityLogService.getActivities(filters);

    return res.send({
      success: 1,
      message: "Activity logs fetched successfully",
      data: result
    });

  } catch (error) {
    console.error('Get activities error:', error);
    return res.send({
      success: 0,
      message: error.message
    });
  }
});

// ✅ GET SUB-ADMIN ACTIVITIES (SUB-ADMIN CAN SEE ONLY THEIR ACTIVITIES)
router.get("/sub-admin/activities", subAdminMiddleware, async (req, res) => {
  try {
    const {
      action,
      entityType,
      vendorType,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      search = ''
    } = req.query;

    const filters = {
      performedBy: req.subAdmin._id,
      performedByModel: 'SubAdmin',
      action,
      entityType,
      vendorType,
      startDate,
      endDate,
      page: parseInt(page),
      limit: parseInt(limit),
      search
    };

    const result = await ActivityLogService.getActivities(filters);

    return res.send({
      success: 1,
      message: "Your activity logs fetched successfully",
      data: result
    });

  } catch (error) {
    console.error('Get sub-admin activities error:', error);
    return res.send({
      success: 0,
      message: error.message
    });
  }
});

// ✅ GET ACTIVITY SUMMARY FOR DASHBOARD
router.get("/dashboard/summary", adminOrSubAdmin, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const user = req.admin || req.subAdmin;

    const summary = await ActivityLogService.getActivitySummary(user, parseInt(days));

    return res.send({
      success: 1,
      message: "Activity summary fetched successfully",
      data: summary
    });

  } catch (error) {
    console.error('Get activity summary error:', error);
    return res.send({
      success: 0,
      message: error.message
    });
  }
});

// ✅ GET ACTIVITY STATISTICS
router.get("/statistics", adminOrSubAdmin, async (req, res) => {
  try {
    const user = req.admin || req.subAdmin;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const query = {
      createdAt: { $gte: startDate }
    };

    // For sub-admin, only their activities
    if (user.constructor.modelName === 'SubAdmin') {
      query.performedBy = user._id;
      query.performedByModel = 'SubAdmin';
    }

    const ActivityLog = require("../modal/activityLog");
    
    const stats = await ActivityLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalActivities: { $sum: 1 },
          successfulActivities: {
            $sum: { $cond: [{ $eq: ["$status", "SUCCESS"] }, 1, 0] }
          },
          failedActivities: {
            $sum: { $cond: [{ $eq: ["$status", "FAILED"] }, 1, 0] }
          },
          byAction: { $push: "$action" },
          byEntity: { $push: "$entityType" }
        }
      }
    ]);

    const result = stats[0] || {
      totalActivities: 0,
      successfulActivities: 0,
      failedActivities: 0,
      byAction: [],
      byEntity: []
    };

    // Count actions and entities
    const actionCounts = {};
    const entityCounts = {};

    result.byAction.forEach(action => {
      actionCounts[action] = (actionCounts[action] || 0) + 1;
    });

    result.byEntity.forEach(entity => {
      entityCounts[entity] = (entityCounts[entity] || 0) + 1;
    });

    return res.send({
      success: 1,
      message: "Activity statistics fetched successfully",
      data: {
        totalActivities: result.totalActivities,
        successfulActivities: result.successfulActivities,
        failedActivities: result.failedActivities,
        successRate: result.totalActivities > 0 ? 
          ((result.successfulActivities / result.totalActivities) * 100).toFixed(2) : 0,
        activitiesByAction: actionCounts,
        activitiesByEntity: entityCounts
      }
    });

  } catch (error) {
    console.error('Get activity statistics error:', error);
    return res.send({
      success: 0,
      message: error.message
    });
  }
});

module.exports = router;