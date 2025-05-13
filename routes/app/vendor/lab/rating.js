const { Router } = require("express");

const { VendorMiddleware } = require("../../../../middleware/auth");
const { getVendorRating, getRatingFeedback } = require("../../../../controllers/app/vandor/lab/rating");

const router = Router();

router.get("/", VendorMiddleware, getVendorRating);
router.get("/feedback", VendorMiddleware, getRatingFeedback);

module.exports = router;
