const { Schema, model } = require("mongoose");

const activityLogSchema = new Schema(
  {
    // ✅ WHO performed the action
    performedBy: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'performedByModel'
    },
    performedByModel: {
      type: String,
      required: true,
      enum: ['Admin', 'SubAdmin']
    },
    
    // ✅ WHAT action was performed
    action: {
      type: String,
      required: true,
      enum: [
        'LOGIN', 'LOGOUT',
        'CREATE', 'UPDATE', 'DELETE', 'VIEW',
        'APPROVE', 'REJECT', 'VERIFY', 'BLOCK', 'UNBLOCK',
        'STATUS_CHANGE', 'PERMISSION_UPDATE'
      ]
    },
    
    // ✅ ON WHICH entity/collection
    entityType: {
      type: String,
      required: true,
      enum: ['Vendor', 'Clinic', 'Doctor', 'User', 'SubAdmin', 'Admin', 'System']
    },
    
    // ✅ SPECIFIC entity ID (if applicable)
    entityId: {
      type: Schema.Types.ObjectId,
      refPath: 'entityType'
    },
    
    // ✅ VENDOR TYPE SPECIFIC (if applicable)
    vendorType: {
      type: String,
      enum: ['lab', 'pharmacy', 'food', null]
    },
    
    // ✅ DETAILED DESCRIPTION
    description: {
      type: String,
      required: true
    },
    
    // ✅ REQUEST DETAILS
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    },
    endpoint: {
      type: String
    },
    
    // ✅ OLD AND NEW VALUES (for updates)
    oldValues: {
      type: Schema.Types.Mixed,
      default: null
    },
    newValues: {
      type: Schema.Types.Mixed,
      default: null
    },
    
    // ✅ IP ADDRESS & LOCATION
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    },
    
    // ✅ STATUS
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED'],
      default: 'SUCCESS'
    },
    errorMessage: {
      type: String,
      default: null
    },
    
    // ✅ LOCATION CONTEXT
    locationContext: {
      country: String,
      state: String,
      city: String
    },
    
    // ✅ TIMESTAMP
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { 
    timestamps: true,
    // ✅ FOR FASTER QUERIES
    indexes: [
      { performedBy: 1, createdAt: -1 },
      { entityType: 1, entityId: 1 },
      { action: 1, createdAt: -1 },
      { createdAt: -1 }
    ]
  }
);

module.exports = model("ActivityLog", activityLogSchema);