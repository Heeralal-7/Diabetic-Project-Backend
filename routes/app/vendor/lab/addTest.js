const { Router } = require("express");
const { VendorMiddleware } = require("../../../../middleware/auth");
const {
  createTest,
  getAllTests,
  deleteTest,
  editTest,
  updateTest,
  updatestatus,
} = require("../../../../controllers/app/vandor/lab/addTest");

const router = Router();

router.post("/create-test", VendorMiddleware, createTest);
router.get("/", VendorMiddleware, getAllTests);
router.delete("/:id", VendorMiddleware, deleteTest);
router.patch("/:id", VendorMiddleware, editTest);
router.put("/new", updateTest);
router.patch("/update/:id", VendorMiddleware , updatestatus)
module.exports = router;
