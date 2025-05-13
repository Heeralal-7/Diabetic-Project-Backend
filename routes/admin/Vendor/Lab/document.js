const { Router } = require("express");
const { adminMiddleware } = require("../../../../middleware/auth");
const {
  getDocuments,
} = require("../../../../controllers/admin/Vendor/Lab/document");

const route = Router();

route.get("/vendordoc", adminMiddleware, getDocuments);

module.exports = route;
