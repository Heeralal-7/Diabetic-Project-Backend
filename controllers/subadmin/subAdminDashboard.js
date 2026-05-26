const Vendor = require("../../modal/vandor");
const clinicModel = require("../../modal/clinic");
const Docter = require("../../modal/docter");
const Users = require("../../modal/user");
const SubAdmin = require("../../modal/subAdmin");
const bcrypt = require("bcryptjs");

// ✅ SUB-ADMIN DASHBOARD STATISTICS WITH VENDOR TYPE SUPPORT
const getSubAdminDashboardStats = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    
    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // ✅ BUILD LOCATION QUERY FOR SUB-ADMIN
    let locationQuery = {};
    if (subAdmin.locationAccess) {
      const { locationAccess } = subAdmin;
      if (locationAccess.countries && locationAccess.countries.length > 0) {
        locationQuery.country = { $in: locationAccess.countries };
      }
      if (locationAccess.states && locationAccess.states.length > 0) {
        locationQuery.state = { $in: locationAccess.states };
      }
      if (locationAccess.cities && locationAccess.cities.length > 0) {
        locationQuery.city = { $in: locationAccess.cities };
      }
    }

    const stats = {};

    // ✅ VENDORS STATS WITH TYPE SPECIFIC PERMISSIONS
    // ✅ VENDORS STATS WITH SEPARATE PERMISSIONS FOR LAB, PHARMACY, FOOD
if (subAdmin.permissions?.vendors) {
  const vendorStats = {
    total: 0,
    active: 0,
    inactive: 0,
    byType: {
      lab: 0,
      pharmacy: 0,
      food: 0
    }
  };

  // ✅ LAB VENDORS STATS
  if (subAdmin.permissions.vendors.lab?.view) {
    const labQuery = { ...locationQuery, vendor: "Lab" };
    vendorStats.byType.lab = await Vendor.countDocuments(labQuery);
    vendorStats.total += vendorStats.byType.lab;
    vendorStats.active += await Vendor.countDocuments({ ...labQuery, isActive: true });
    vendorStats.inactive += await Vendor.countDocuments({ ...labQuery, isActive: false });
  }

  // ✅ PHARMACY VENDORS STATS
  if (subAdmin.permissions.vendors.pharmacy?.view) {
    const pharmacyQuery = { ...locationQuery, vendor: "Pharmacy" };
    vendorStats.byType.pharmacy = await Vendor.countDocuments(pharmacyQuery);
    vendorStats.total += vendorStats.byType.pharmacy;
    vendorStats.active += await Vendor.countDocuments({ ...pharmacyQuery, isActive: true });
    vendorStats.inactive += await Vendor.countDocuments({ ...pharmacyQuery, isActive: false });
  }

  // ✅ FOOD VENDORS STATS
  if (subAdmin.permissions.vendors.food?.view) {
    const foodQuery = { ...locationQuery, vendor: "Food" };
    vendorStats.byType.food = await Vendor.countDocuments(foodQuery);
    vendorStats.total += vendorStats.byType.food;
    vendorStats.active += await Vendor.countDocuments({ ...foodQuery, isActive: true });
    vendorStats.inactive += await Vendor.countDocuments({ ...foodQuery, isActive: false });
  }

  stats.vendors = vendorStats;
} else {
  stats.vendors = {
    total: 0,
    active: 0,
    inactive: 0,
    byType: {
      lab: 0,
      pharmacy: 0,
      food: 0
    }
  };
}

    // ✅ CLINICS STATS (If permission exists)
    if (subAdmin.permissions?.clinics?.view) {
      const totalClinics = await clinicModel.countDocuments(locationQuery);
      const verifiedClinics = await clinicModel.countDocuments({ ...locationQuery, Accountverify: "1" });
      const pendingClinics = await clinicModel.countDocuments({ ...locationQuery, Accountverify: "0" });
      const rejectedClinics = await clinicModel.countDocuments({ ...locationQuery, Accountverify: "2" });

      stats.clinics = {
        total: totalClinics,
        verified: verifiedClinics,
        pending: pendingClinics,
        rejected: rejectedClinics
      };
    } else {
      stats.clinics = {
        total: 0,
        verified: 0,
        pending: 0,
        rejected: 0
      };
    }

    // ✅ DOCTORS STATS (If permission exists)
    if (subAdmin.permissions?.doctors?.view) {
      const totalDoctors = await Docter.countDocuments(locationQuery);
      const verifiedDoctors = await Docter.countDocuments({ ...locationQuery, Accountverify: "1" });
      const pendingDoctors = await Docter.countDocuments({ ...locationQuery, Accountverify: "0" });
      const rejectedDoctors = await Docter.countDocuments({ ...locationQuery, Accountverify: "2" });

      stats.doctors = {
        total: totalDoctors,
        verified: verifiedDoctors,
        pending: pendingDoctors,
        rejected: rejectedDoctors
      };
    } else {
      stats.doctors = {
        total: 0,
        verified: 0,
        pending: 0,
        rejected: 0
      };
    }

    // ✅ USERS STATS (If permission exists)
    if (subAdmin.permissions?.users?.view) {
      const totalUsers = await Users.countDocuments(locationQuery);
      const activeUsers = await Users.countDocuments({ ...locationQuery, isActive: true });
      const inactiveUsers = await Users.countDocuments({ ...locationQuery, isActive: false });

      stats.users = {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers
      };
    } else {
      stats.users = {
        total: 0,
        active: 0,
        inactive: 0
      };
    }

    // ✅ RECENT ACTIVITIES (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivities = {
      newVendors: subAdmin.permissions?.vendors ? 
        await Vendor.countDocuments({ 
          ...locationQuery, 
          createdAt: { $gte: sevenDaysAgo },
          ...(subAdmin.permissions.vendors && {
            vendor: { 
              $in: [
                ...(subAdmin.permissions.vendors.lab?.view ? ['Lab'] : []),
                ...(subAdmin.permissions.vendors.pharmacy?.view ? ['Pharmacy'] : []),
                ...(subAdmin.permissions.vendors.food?.view ? ['Food'] : [])
              ]
            }
          })
        }) : 0,
      newClinics: subAdmin.permissions?.clinics?.view ? 
        await clinicModel.countDocuments({ ...locationQuery, createdAt: { $gte: sevenDaysAgo } }) : 0,
      newDoctors: subAdmin.permissions?.doctors?.view ? 
        await Docter.countDocuments({ ...locationQuery, createdAt: { $gte: sevenDaysAgo } }) : 0,
      newUsers: subAdmin.permissions?.users?.view ? 
        await Users.countDocuments({ ...locationQuery, createdAt: { $gte: sevenDaysAgo } }) : 0,
    };

    stats.recentActivities = recentActivities;

    // ✅ PERMISSION SUMMARY
    stats.permissions = {
      vendors: {
        lab: subAdmin.permissions?.vendors?.lab?.view || false,
        pharmacy: subAdmin.permissions?.vendors?.pharmacy?.view || false,
        food: subAdmin.permissions?.vendors?.food?.view || false
      },
      clinics: subAdmin.permissions?.clinics?.view || false,
      doctors: subAdmin.permissions?.doctors?.view || false,
      users: subAdmin.permissions?.users?.view || false
    };

    return res.send({
      success: 1,
      message: "Sub-admin dashboard stats fetched successfully",
      data: {
        stats,
        subAdmin: {
          name: subAdmin.name,
          email: subAdmin.email,
          permissions: subAdmin.permissions,
          locationAccess: subAdmin.locationAccess
        }
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return res.send({
      success: 0,
      message: error.message,
    });
  }
}; 

// ✅ SUB-ADMIN RECENT REGISTRATIONS WITH VENDOR TYPE SUPPORT
const getRecentRegistrations = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    const { type, limit = 5, vendorType } = req.query; // vendors, clinics, doctors, users

    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // ✅ BUILD LOCATION QUERY FOR SUB-ADMIN
    let locationQuery = {};
    if (subAdmin.locationAccess) {
      const { locationAccess } = subAdmin;
      if (locationAccess.countries && locationAccess.countries.length > 0) {
        locationQuery.country = { $in: locationAccess.countries };
      }
      if (locationAccess.states && locationAccess.states.length > 0) {
        locationQuery.state = { $in: locationAccess.states };
      }
      if (locationAccess.cities && locationAccess.cities.length > 0) {
        locationQuery.city = { $in: locationAccess.cities };
      }
    }

    let recentData = [];

    switch (type) {
      case 'vendors':
        if (!subAdmin.permissions?.vendors) {
          return res.status(403).send({
            success: 0,
            message: "No permission to view vendors",
          });
        }

        // ✅ VENDOR TYPE SPECIFIC QUERY
        let vendorQuery = { ...locationQuery };
        
        // If specific vendor type requested
        if (vendorType) {
          if (!subAdmin.permissions.vendors[vendorType]?.view) {
            return res.status(403).send({
              success: 0,
              message: `No permission to view ${vendorType} vendors`,
            });
          }
          vendorQuery.vendor = vendorType.charAt(0).toUpperCase() + vendorType.slice(1);
        } else {
          // Show all permitted vendor types
          const allowedTypes = [];
          if (subAdmin.permissions.vendors.lab?.view) allowedTypes.push('Lab');
          if (subAdmin.permissions.vendors.pharmacy?.view) allowedTypes.push('Pharmacy');
          if (subAdmin.permissions.vendors.food?.view) allowedTypes.push('Food');
          
          if (allowedTypes.length > 0) {
            vendorQuery.vendor = { $in: allowedTypes };
          } else {
            return res.status(403).send({
              success: 0,
              message: "No vendor permissions",
            });
          }
        }

        recentData = await Vendor.find(vendorQuery)
          .select('name email business vendor isActive createdAt country state city')
          .sort({ createdAt: -1 })
          .limit(parseInt(limit));
        break;

      case 'clinics':
        if (!subAdmin.permissions?.clinics?.view) {
          return res.status(403).send({
            success: 0,
            message: "No permission to view clinics",
          });
        }
        recentData = await clinicModel.find(locationQuery)
          .select('name email clinicName Accountverify createdAt country state city')
          .sort({ createdAt: -1 })
          .limit(parseInt(limit));
        break;

      case 'doctors':
        if (!subAdmin.permissions?.doctors?.view) {
          return res.status(403).send({
            success: 0,
            message: "No permission to view doctors",
          });
        }
        recentData = await Docter.find(locationQuery)
          .select('name email specialist Accountverify createdAt country state city')
          .sort({ createdAt: -1 })
          .limit(parseInt(limit));
        break;

      case 'users':
        if (!subAdmin.permissions?.users?.view) {
          return res.status(403).send({
            success: 0,
            message: "No permission to view users",
          });
        }
        recentData = await Users.find(locationQuery)
          .select('name email number isActive createdAt country state city')
          .sort({ createdAt: -1 })
          .limit(parseInt(limit));
        break;

      default:
        return res.status(400).send({
          success: 0,
          message: "Invalid type. Use: vendors, clinics, doctors, users",
        });
    }

    return res.send({
      success: 1,
      message: `Recent ${type} fetched successfully`,
      data: recentData
    });

  } catch (error) {
    console.error('Recent registrations error:', error);
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ SUB-ADMIN VERIFICATION REQUESTS
const getVerificationRequests = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    const { type } = req.query; // clinics, doctors

    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // ✅ BUILD LOCATION QUERY FOR SUB-ADMIN
    let locationQuery = {};
    if (subAdmin.locationAccess) {
      const { locationAccess } = subAdmin;
      if (locationAccess.countries && locationAccess.countries.length > 0) {
        locationQuery.country = { $in: locationAccess.countries };
      }
      if (locationAccess.states && locationAccess.states.length > 0) {
        locationQuery.state = { $in: locationAccess.states };
      }
      if (locationAccess.cities && locationAccess.cities.length > 0) {
        locationQuery.city = { $in: locationAccess.cities };
      }
    }

    let pendingRequests = [];

    switch (type) {
      case 'clinics':
        if (!subAdmin.permissions?.clinics?.view || !subAdmin.permissions?.clinics?.edit) {
          return res.status(403).send({
            success: 0,
            message: "No permission to view/edit clinics",
          });
        }
        pendingRequests = await clinicModel.find({ 
          ...locationQuery, 
          Accountverify: "0" 
        })
        .select('name clinicName email phoneNumber city state createdAt')
        .sort({ createdAt: -1 });
        break;

      case 'doctors':
        if (!subAdmin.permissions?.doctors?.view || !subAdmin.permissions?.doctors?.edit) {
          return res.status(403).send({
            success: 0,
            message: "No permission to view/edit doctors",
          });
        }
        pendingRequests = await Docter.find({ 
          ...locationQuery, 
          Accountverify: "0" 
        })
        .select('name email specialist phoneNumber city state createdAt')
        .sort({ createdAt: -1 });
        break;

      default:
        return res.status(400).send({
          success: 0,
          message: "Invalid type. Use: clinics, doctors",
        });
    }

    return res.send({
      success: 1,
      message: `Pending ${type} verification requests fetched successfully`,
      data: pendingRequests
    });

  } catch (error) {
    console.error('Verification requests error:', error);
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ SUB-ADMIN PROFILE
const getSubAdminProfile = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;

    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    const profile = await SubAdmin.findById(subAdmin._id)
      .select('-password -token');

    return res.send({
      success: 1,
      message: "Sub-admin profile fetched successfully",
      data: profile
    });

  } catch (error) {
    console.error('Profile error:', error);
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ UPDATE SUB-ADMIN PROFILE
const updateSubAdminProfile = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    const { name, email } = req.body;

    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (req.file) {
      updateData.image = `/subadmin/profileImage/${req.file.filename}`;
    }

    const updatedSubAdmin = await SubAdmin.findByIdAndUpdate(
      subAdmin._id,
      updateData,
      { new: true }
    ).select('-password -token');

    return res.send({
      success: 1,
      message: "Profile updated successfully",
      data: updatedSubAdmin
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};
// ✅ CHANGE SUB-ADMIN PASSWORD
const changeSubAdminPassword = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).send({
        success: 0,
        message: "All password fields are required",
      });
    }

    // Check if new password matches confirm password
    if (newPassword !== confirmPassword) {
      return res.status(400).send({
        success: 0,
        message: "New password and confirm password do not match",
      });
    }

    // Check if new password is different from current password
    if (currentPassword === newPassword) {
      return res.status(400).send({
        success: 0,
        message: "New password must be different from current password",
      });
    }

    // Check password length
    if (newPassword.length < 6) {
      return res.status(400).send({
        success: 0,
        message: "New password must be at least 6 characters long",
      });
    }

    // Find subadmin with password
    const subAdminWithPassword = await SubAdmin.findById(subAdmin._id).select('+password');
    
    if (!subAdminWithPassword) {
      return res.status(404).send({
        success: 0,
        message: "Sub-admin not found",
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, subAdminWithPassword.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).send({
        success: 0,
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    subAdminWithPassword.password = hashedNewPassword;
    await subAdminWithPassword.save();

    return res.send({
      success: 1,
      message: "Password changed successfully",
    });

  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ SUB-ADMIN ACTIVITY LOG
const getSubAdminActivities = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    const { page = 1, limit = 10 } = req.query;

    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // Basic activity info - you can extend this with a proper Activity model
    const activities = {
      lastLogin: subAdmin.updatedAt,
      permissions: subAdmin.permissions,
      locationAccess: subAdmin.locationAccess,
      message: "Detailed activity logging can be implemented with Activity model"
    };

    return res.send({
      success: 1,
      message: "Activities info fetched",
      data: activities
    });

  } catch (error) {
    console.error('Activities error:', error);
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};
// ✅ SUB-ADMIN MONTHLY REGISTRATION STATS FOR GRAPHS
const getSubAdminMonthlyStats = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    if (!subAdmin) {
      return res.status(401).send({ success: 0, message: "Sub-admin not authenticated" });
    }

    // ✅ स्थान के आधार पर क्वेरी बनाएँ
    let locationQuery = {};
    if (subAdmin.locationAccess) {
      const { countries, states, cities } = subAdmin.locationAccess;
      if (countries && countries.length > 0) locationQuery.country = { $in: countries };
      if (states && states.length > 0) locationQuery.state = { $in: states };
      if (cities && cities.length > 0) locationQuery.city = { $in: cities };
    }

    // ✅ एग्रीगेशन के लिए हेल्पर फ़ंक्शन
    const getMonthlyAggregation = async (model, additionalMatch = {}) => {
      const matchQuery = { ...locationQuery, ...additionalMatch };
      
      // सुनिश्चित करें कि createdAt फ़ील्ड पर इंडेक्स है ताकि प्रदर्शन बेहतर हो
      return await model.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            year: "$_id.year",
            month: "$_id.month",
            count: 1
          }
        },
        { $sort: { year: 1, month: 1 } }
      ]);
    };

    const monthlyStats = {};

    // ✅ डॉक्टर आँकड़े (यदि अनुमति हो)
    if (subAdmin.permissions?.doctors?.view) {
      monthlyStats.doctors = await getMonthlyAggregation(Docter);
    }

    // ✅ उपयोगकर्ता आँकड़े (यदि अनुमति हो)
    if (subAdmin.permissions?.users?.view) {
      monthlyStats.users = await getMonthlyAggregation(Users);
    }
    
    // ✅ वेंडर आँकड़े (यदि अनुमति हो)
    if (subAdmin.permissions?.vendors) {
      monthlyStats.vendors = {};
      if (subAdmin.permissions.vendors.lab?.view) {
        monthlyStats.vendors.lab = await getMonthlyAggregation(Vendor, { vendor: "Lab" });
      }
      if (subAdmin.permissions.vendors.pharmacy?.view) {
        monthlyStats.vendors.pharmacy = await getMonthlyAggregation(Vendor, { vendor: "Pharmacy" });
      }
      if (subAdmin.permissions.vendors.food?.view) {
        monthlyStats.vendors.food = await getMonthlyAggregation(Vendor, { vendor: "Food" });
      }
    }
    
    // ✅ क्लिनिक आँकड़े (यदि अनुमति हो)
    if (subAdmin.permissions?.clinics?.view) {
        monthlyStats.clinics = await getMonthlyAggregation(clinicModel);
    }

    return res.send({
      success: 1,
      message: "Sub-admin monthly stats fetched successfully",
      data: monthlyStats
    });

  } catch (error) {
    console.error('Monthly stats error:', error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = {
  getSubAdminDashboardStats,
  getRecentRegistrations,
  getVerificationRequests,
  getSubAdminMonthlyStats,
  getSubAdminProfile,
  updateSubAdminProfile,
  changeSubAdminPassword,
  getSubAdminActivities
};