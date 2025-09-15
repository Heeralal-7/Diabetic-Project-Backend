const { Router } = require("express");
const { adminMiddleware } = require("../../../../middleware/auth");
const {
  getDocuments,
  approveVendorDocumentField,
  rejectVendorDocumentField, 

} = require("../../../../controllers/admin/Vendor/Lab/document");

const route = Router();

route.get("/vendordoc", adminMiddleware, getDocuments);
route.patch("/approveVendorDocumentField/:id", adminMiddleware, approveVendorDocumentField);
route.patch("/rejectVendorDocumentField/:id", adminMiddleware, rejectVendorDocumentField);

module.exports = route;
