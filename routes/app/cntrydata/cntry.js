const { Router } = require("express");
const {
  listOfCity,
  cntryinsert,
  listOfCountry,
  listOfState,
} = require("../../../controllers/app/cntrydata/cntrydata");

const router = Router();
router.post("/cntry", cntryinsert);
router.get("/", listOfCountry);
router.post("/states", listOfState);
router.post("/city", listOfCity);

module.exports = router;
