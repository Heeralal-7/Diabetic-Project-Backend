const express = require('express');
const router = express.Router();
const { 
  getallUsers, 
  activeUser, 
  inActiveUser, 
  firstuser, 
  allusersdata,
  getUserById,
  updateUserStatus,
  deleteUser 
} = require('../../../controllers/subadmin/user/user');
const { subAdminMiddleware } = require('../../../middleware/auth');

// ✅ GET ALL USERS (with pagination, search, filters)
router.get('/', subAdminMiddleware, getallUsers);

// ✅ GET ACTIVE USERS
router.get('/active', subAdminMiddleware, activeUser);

// ✅ GET INACTIVE USERS
router.get('/inactive', subAdminMiddleware, inActiveUser);

// ✅ GET LAST 5 REGISTERED USERS
router.get('/recent/first-five', subAdminMiddleware, firstuser);

// ✅ GET LAST 12 MONTHS REGISTRATION STATS
router.get('/stats/registration', subAdminMiddleware, allusersdata);

// ✅ GET SINGLE USER BY ID
router.get('/:id', subAdminMiddleware, getUserById);

// ✅ UPDATE USER STATUS (activate/deactivate)
router.put('/:id/status', subAdminMiddleware, updateUserStatus);

// ✅ DELETE USER
router.delete('/:id', subAdminMiddleware, deleteUser);

module.exports = router;