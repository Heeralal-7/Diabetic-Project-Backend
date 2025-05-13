const { Router } = require("express");

const { VendorMiddleware } = require("../../../../middleware/auth");
const {
  createAvailability,
  getAvailabiltyOfVendorAndTime,
  getAllStartAndEndDate,
  removeDates,
} = require("../../../../controllers/app/vandor/lab/availability");

const router = Router();

router.post("/create", VendorMiddleware, createAvailability);
router.post("/dates", VendorMiddleware, getAvailabiltyOfVendorAndTime);
router.get("/", VendorMiddleware, getAllStartAndEndDate);
router.delete("/remove/:id", VendorMiddleware, removeDates);
module.exports = router;
