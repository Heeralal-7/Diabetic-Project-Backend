const { Router } = require("express");
const { doctorMiddleware } = require("../../../middleware/auth");
const {
  createAccount,
  getDoctorBankAccount,
  getAllBanksName,
  searchBank,
} = require("../../../controllers/app/Docter/AddAccount");

const router = Router();

router.post("/", doctorMiddleware, createAccount);
router.get("/", doctorMiddleware, getDoctorBankAccount);
router.get("/banks", doctorMiddleware, getAllBanksName);
router.post("/search", doctorMiddleware, searchBank);

module.exports = router;
