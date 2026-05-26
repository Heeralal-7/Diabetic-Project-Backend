const { Router } = require("express");
const { addContact, getContact, updateContact } = require( "../../../controllers/subadmin/user/contactUs.js");
const { subAdminMiddleware } = require("../../../middleware/auth.js");
 
const router = Router();
 
 
router.post("/create-contact",subAdminMiddleware,addContact);
router.get("/get-contact", subAdminMiddleware,getContact);
router.put("/update-contact",subAdminMiddleware,updateContact);
 
// user routes
router.get("/get-contact-user" ,getContact); // for user only
 
 
module.exports = router;
 