const ActivityLogService = require("../services/activityLogService");

// ✅ ACTIVITY LOGGER MIDDLEWARE
const activityLogger = (options = {}) => {
  return async (req, res, next) => {
    // Store original functions
    const originalSend = res.send;
    const originalJson = res.json;

    // Capture request data
    req.activityData = {
      method: req.method,
      endpoint: req.originalUrl,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      timestamp: new Date()
    };

    // Override res.send to capture response
    res.send = function(data) {
      logActivity(req, res, data);
      originalSend.call(this, data);
    };

    res.json = function(data) {
      logActivity(req, res, data);
      originalJson.call(this, data);
    };

    next();
  };
};

// ✅ LOG ACTIVITY BASED ON REQUEST AND RESPONSE
async function logActivity(req, res, responseData) {
  try {
    // Only log for admin/sub-admin routes
    if (!req.admin && !req.subAdmin) return;

    const performer = req.admin || req.subAdmin;
    const isAdmin = !!req.admin;

    // Determine action based on method and endpoint
    const { method, endpoint } = req.activityData;
    let action = getActionFromMethod(method);
    let entityType = getEntityTypeFromEndpoint(endpoint);
    let vendorType = getVendorTypeFromEndpoint(endpoint);

    // Skip logging for certain endpoints
    if (shouldSkipLogging(endpoint)) return;

    // Prepare description
    const description = generateActivityDescription(performer, action, entityType, vendorType, req.body);

    // Log the activity
    await ActivityLogService.logActivity({
      performedBy: performer._id,
      performedByModel: isAdmin ? 'Admin' : 'SubAdmin',
      action,
      entityType,
      vendorType,
      description,
      method,
      endpoint,
      ipAddress: req.activityData.ipAddress,
      userAgent: req.activityData.userAgent,
      status: responseData?.success === 1 ? 'SUCCESS' : 'FAILED',
      errorMessage: responseData?.success === 0 ? responseData.message : null
    });

  } catch (error) {
    console.error('Activity logging middleware error:', error);
    // Don't break the request if logging fails
  }
}

// ✅ HELPER FUNCTIONS
function getActionFromMethod(method) {
  const actionMap = {
    'POST': 'CREATE',
    'GET': 'VIEW',
    'PUT': 'UPDATE',
    'PATCH': 'UPDATE',
    'DELETE': 'DELETE'
  };
  return actionMap[method] || 'VIEW';
}

function getEntityTypeFromEndpoint(endpoint) {
  if (endpoint.includes('/vendor/')) return 'Vendor';
  if (endpoint.includes('/clinic/')) return 'Clinic';
  if (endpoint.includes('/doctor/')) return 'Doctor';
  if (endpoint.includes('/user/')) return 'User';
  if (endpoint.includes('/sub-admin/')) return 'SubAdmin';
  if (endpoint.includes('/admin/')) return 'Admin';
  return 'System';
}

function getVendorTypeFromEndpoint(endpoint) {
  if (endpoint.includes('/lab/')) return 'lab';
  if (endpoint.includes('/pharmacy/')) return 'pharmacy';
  if (endpoint.includes('/food/')) return 'food';
  return null;
}

function shouldSkipLogging(endpoint) {
  const skipEndpoints = [
    '/api/activity-logs',
    '/api/admin/dashboard',
    '/api/sub-admin/dashboard',
    '/api/auth/change-password'
  ];
  return skipEndpoints.some(skip => endpoint.includes(skip));
}

function generateActivityDescription(performer, action, entityType, vendorType, body) {
  const performerType = performer.constructor.modelName;
  const vendorText = vendorType ? ` (${vendorType})` : '';

  switch (action) {
    case 'LOGIN':
      return `${performerType} logged in`;
    case 'CREATE':
      return `${performerType} created ${entityType.toLowerCase()}${vendorText}`;
    case 'UPDATE':
      return `${performerType} updated ${entityType.toLowerCase()}${vendorText}`;
    case 'DELETE':
      return `${performerType} deleted ${entityType.toLowerCase()}${vendorText}`;
    case 'APPROVE':
      return `${performerType} approved ${entityType.toLowerCase()}${vendorText}`;
    default:
      return `${performerType} performed ${action} on ${entityType}${vendorText}`;
  }
}

module.exports = {
  activityLogger,
  ActivityLogService
};