const { Schema, model } = require("mongoose");

const subAdminSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { type: String, default: "" },
    
    // ✅ YEH UPDATE KAREN - IMPROVED PERMISSIONS STRUCTURE
    permissions: {
      // Vendor type specific permissions
      vendors: {
        lab: {
          view: { type: Boolean, default: false },
          create: { type: Boolean, default: false },
          edit: { type: Boolean, default: false },
          delete: { type: Boolean, default: false }
        },
        pharmacy: {
          view: { type: Boolean, default: false },
          create: { type: Boolean, default: false },
          edit: { type: Boolean, default: false },
          delete: { type: Boolean, default: false }
        },
        food: {
          view: { type: Boolean, default: false },
          create: { type: Boolean, default: false },
          edit: { type: Boolean, default: false },
          delete: { type: Boolean, default: false }
        }
      },
      clinics: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false }
      },
      doctors: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false }
      },
      users: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false }
      }
    },
    
    locationAccess: {
      countries: [{ type: String, default: [] }],
      states: [{ type: String, default: [] }],
      cities: [{ type: String, default: [] }]
    },
    
    // ✅ YEH ADD KAREN - ASSIGNED ENTITIES
    assignedVendors: [{
      type: Schema.Types.ObjectId,
      ref: "Vandor",
      default: []
    }],
    assignedClinics: [{
      type: Schema.Types.ObjectId,
      ref: "Clinic", 
      default: []
    }],
    assignedDoctors: [{
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      default: []
    }],
    
    isActive: { type: Boolean, default: true },
    token: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true }
  },
  { timestamps: true }
);

module.exports = model("SubAdmin", subAdminSchema);