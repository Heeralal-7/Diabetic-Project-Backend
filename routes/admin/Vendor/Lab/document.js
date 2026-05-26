const { Router } = require("express");
const { adminMiddleware } = require("../../../../middleware/auth");
const {
  getDocuments,
  approveVendorDocumentField,
  rejectVendorDocumentField, 

} = require("../../../../controllers/admin/Vendor/Lab/document");

const route = Router();

route.get("/vendordoc", getDocuments);
route.patch("/approveVendorDocumentField/:id", approveVendorDocumentField);
route.patch("/rejectVendorDocumentField/:id", rejectVendorDocumentField);

module.exports = route;
