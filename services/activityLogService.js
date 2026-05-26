const ActivityLog = require("../modal/activityLog");

class ActivityLogService {
  
  // ✅ LOG ACTIVITY
  static async logActivity(activityData) {
    try {
      const {
        performedBy,
        performedByModel,
        action,
        entityType,
        entityId,
        vendorType = null,
        description,
        method,
        endpoint,
        oldValues = null,
        newValues = null,
        ipAddress,
        userAgent,
        status = 'SUCCESS',
        errorMessage = null,
        locationContext = {}
      } = activityData;

      const activityLog = new ActivityLog({
        performedBy,
        performedByModel,
        action,
        entityType,
        entityId,
        vendorType,
        description,
        method,
        endpoint,
        oldValues,
        newValues,
        ipAddress,
        userAgent,
        status,
        errorMessage,
        locationContext,
        timestamp: new Date()
      });

      await activityLog.save();
      return activityLog;
    } catch (error) {
      console.error('Activity logging failed:', error);
      // Don't throw error to avoid breaking main functionality
    }
  }

  // ✅ LOG LOGIN ACTIVITY
  static async logLogin(adminOrSubAdmin, ipAddress, userAgent, status = 'SUCCESS', errorMessage = null) {
    const isAdmin = adminOrSubAdmin.constructor.modelName === 'Admin';
    
    return await this.logActivity({
      performedBy: adminOrSubAdmin._id,
      performedByModel: isAdmin ? 'Admin' : 'SubAdmin',
      action: 'LOGIN',
      entityType: 'System',
      description: `${isAdmin ? 'Admin' : 'SubAdmin'} logged in`,
      method: 'POST',
      endpoint: '/api/auth/login',
      ipAddress,
      userAgent,
      status,
      errorMessage,
      locationContext: {
        country: adminOrSubAdmin.country || '',
        state: adminOrSubAdmin.state || '',
        city: adminOrSubAdmin.city || ''
      }
    });
  }

  // ✅ LOG LOGOUT ACTIVITY
  static async logLogout(adminOrSubAdmin, ipAddress, userAgent) {
    const isAdmin = adminOrSubAdmin.constructor.modelName === 'Admin';
    
    return await this.logActivity({
      performedBy: adminOrSubAdmin._id,
      performedByModel: isAdmin ? 'Admin' : 'SubAdmin',
      action: 'LOGOUT',
      entityType: 'System',
      description: `${isAdmin ? 'Admin' : 'SubAdmin'} logged out`,
      method: 'POST',
      endpoint: '/api/auth/logout',
      ipAddress,
      userAgent,
      locationContext: {
        country: adminOrSubAdmin.country || '',
        state: adminOrSubAdmin.state || '',
        city: adminOrSubAdmin.city || ''
      }
    });
  }

  // ✅ LOG VENDOR ACTIVITY
  static async logVendorActivity(adminOrSubAdmin, action, vendor, vendorType, method, endpoint, oldValues = null, newValues = null) {
    const isAdmin = adminOrSubAdmin.constructor.modelName === 'Admin';
    
    const actionDescriptions = {
      'CREATE': `Created ${vendorType} vendor: ${vendor.name}`,
      'UPDATE': `Updated ${vendorType} vendor: ${vendor.name}`,
      'DELETE': `Deleted ${vendorType} vendor: ${vendor.name}`,
      'APPROVE': `Approved ${vendorType} vendor: ${vendor.name}`,
      'REJECT': `Rejected ${vendorType} vendor: ${vendor.name}`,
      'VIEW': `Viewed ${vendorType} vendor: ${vendor.name}`
    };

    return await this.logActivity({
      performedBy: adminOrSubAdmin._id,
      performedByModel: isAdmin ? 'Admin' : 'SubAdmin',
      action,
      entityType: 'Vendor',
      entityId: vendor._id,
      vendorType,
      description: actionDescriptions[action] || `${action} ${vendorType} vendor`,
      method,
      endpoint,
      oldValues,
      newValues,
      ipAddress: adminOrSubAdmin.ipAddress,
      userAgent: adminOrSubAdmin.userAgent,
      locationContext: {
        country: vendor.country || '',
        state: vendor.state || '',
        city: vendor.city || ''
      }
    });
  }

  // ✅ LOG CLINIC ACTIVITY
  static async logClinicActivity(adminOrSubAdmin, action, clinic, method, endpoint, oldValues = null, newValues = null) {
    const isAdmin = adminOrSubAdmin.constructor.modelName === 'Admin';
    
    const actionDescriptions = {
      'CREATE': `Created clinic: ${clinic.clinicName || clinic.name}`,
      'UPDATE': `Updated clinic: ${clinic.clinicName || clinic.name}`,
      'DELETE': `Deleted clinic: ${clinic.clinicName || clinic.name}`,
      'APPROVE': `Approved clinic: ${clinic.clinicName || clinic.name}`,
      'REJECT': `Rejected clinic: ${clinic.clinicName || clinic.name}`,
      'VERIFY': `Verified clinic: ${clinic.clinicName || clinic.name}`
    };

    return await this.logActivity({
      performedBy: adminOrSubAdmin._id,
      performedByModel: isAdmin ? 'Admin' : 'SubAdmin',
      action,
      entityType: 'Clinic',
      entityId: clinic._id,
      description: actionDescriptions[action] || `${action} clinic`,
      method,
      endpoint,
      oldValues,
      newValues,
      ipAddress: adminOrSubAdmin.ipAddress,
      userAgent: adminOrSubAdmin.userAgent,
      locationContext: {
        country: clinic.country || '',
        state: clinic.state || '',
        city: clinic.city || ''
      }
    });
  }

  // ✅ LOG DOCTOR ACTIVITY
  static async logDoctorActivity(adminOrSubAdmin, action, doctor, method, endpoint, oldValues = null, newValues = null) {
    const isAdmin = adminOrSubAdmin.constructor.modelName === 'Admin';
    
    const actionDescriptions = {
      'CREATE': `Created doctor: ${doctor.name}`,
      'UPDATE': `Updated doctor: ${doctor.name}`,
      'DELETE': `Deleted doctor: ${doctor.name}`,
      'APPROVE': `Approved doctor: ${doctor.name}`,
      'REJECT': `Rejected doctor: ${doctor.name}`,
      'VERIFY': `Verified doctor: ${doctor.name}`
    };

    return await this.logActivity({
      performedBy: adminOrSubAdmin._id,
      performedByModel: isAdmin ? 'Admin' : 'SubAdmin',
      action,
      entityType: 'Doctor',
      entityId: doctor._id,
      description: actionDescriptions[action] || `${action} doctor`,
      method,
      endpoint,
      oldValues,
      newValues,
      ipAddress: adminOrSubAdmin.ipAddress,
      userAgent: adminOrSubAdmin.userAgent,
      locationContext: {
        country: doctor.country || '',
        state: doctor.state || '',
        city: doctor.city || ''
      }
    });
  }

  // ✅ LOG SUB-ADMIN ACTIVITY
  static async logSubAdminActivity(admin, action, subAdmin, method, endpoint, oldValues = null, newValues = null) {
    const actionDescriptions = {
      'CREATE': `Created sub-admin: ${subAdmin.name}`,
      'UPDATE': `Updated sub-admin: ${subAdmin.name}`,
      'DELETE': `Deleted sub-admin: ${subAdmin.name}`,
      'STATUS_CHANGE': `Changed status of sub-admin: ${subAdmin.name}`,
      'PERMISSION_UPDATE': `Updated permissions for sub-admin: ${subAdmin.name}`
    };

    return await this.logActivity({
      performedBy: admin._id,
      performedByModel: 'Admin',
      action,
      entityType: 'SubAdmin',
      entityId: subAdmin._id,
      description: actionDescriptions[action] || `${action} sub-admin`,
      method,
      endpoint,
      oldValues,
      newValues,
      ipAddress: admin.ipAddress,
      userAgent: admin.userAgent
    });
  }

  // ✅ GET ACTIVITIES WITH FILTERS
  static async getActivities(filters = {}) {
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
      limit = 10,
      search = ''
    } = filters;

    const query = {};

    if (performedBy) query.performedBy = performedBy;
    if (performedByModel) query.performedByModel = performedByModel;
    if (action) query.action = action;
    if (entityType) query.entityType = entityType;
    if (entityId) query.entityId = entityId;
    if (vendorType) query.vendorType = vendorType;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Search in description
    if (search) {
      query.description = { $regex: search, $options: 'i' };
    }

    const activities = await ActivityLog.find(query)
      .populate('performedBy', 'name email')
      .populate('entityId', 'name email clinicName business')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ActivityLog.countDocuments(query);

    return {
      activities,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalActivities: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }

  // ✅ GET ACTIVITY SUMMARY (FOR DASHBOARD)
  static async getActivitySummary(adminOrSubAdmin, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const query = {
      createdAt: { $gte: startDate }
    };

    // For sub-admin, only show their activities
    if (adminOrSubAdmin.constructor.modelName === 'SubAdmin') {
      query.performedBy = adminOrSubAdmin._id;
      query.performedByModel = 'SubAdmin';
    }

    const activities = await ActivityLog.find(query);

    const summary = {
      totalActivities: activities.length,
      activitiesByAction: {},
      activitiesByEntity: {},
      activitiesByDay: {},
      recentActivities: activities.slice(0, 10)
    };

    activities.forEach(activity => {
      // Count by action
      summary.activitiesByAction[activity.action] = 
        (summary.activitiesByAction[activity.action] || 0) + 1;

      // Count by entity
      summary.activitiesByEntity[activity.entityType] = 
        (summary.activitiesByEntity[activity.entityType] || 0) + 1;

      // Count by day
      const day = activity.createdAt.toISOString().split('T')[0];
      summary.activitiesByDay[day] = (summary.activitiesByDay[day] || 0) + 1;
    });

    return summary;
  }
}

module.exports = ActivityLogService;