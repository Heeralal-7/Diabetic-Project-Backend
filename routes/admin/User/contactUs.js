const { Router } = require("express");
const { addContact, getContact, updateContact } = require( "../../../controllers/admin/User/contactUs.js");
const { adminMiddleware } = require("../../../middleware/auth.js");
 
const router = Router();
 
 
router.post("/create-contact",adminMiddleware,addContact);
router.get("/get-contact", adminMiddleware,getContact);
router.put("/update-contact",adminMiddleware,updateContact);

// user routes
router.get("/get-contact-user" ,getContact); // for user only

 
module.exports = router
 
 
 