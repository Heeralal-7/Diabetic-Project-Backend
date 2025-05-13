const { Router } = require("express");
const {
  getVendorPackage,
} = require("../../../../controllers/admin/Vendor/Lab/package");

const route = Router();

route.get("/vendor-package/:id", getVendorPackage);

module.exports = route;
