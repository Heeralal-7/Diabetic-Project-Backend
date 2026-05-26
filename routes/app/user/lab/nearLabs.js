const { Router } = require("express");
const { middlewere } = require("../../../../middleware/auth");
const {
  getVendor,

  getVendoravailability,
  getVendorTest,
  getAllStartAndEndDateUser,
  getAvailabiltyOfUserVendorAndTime,
  getVendorDate,
  getParticularVendor,
  getpackages,
  getallpacakge,
  getparticulatlabtest,
  getPackagecollection,
  getAllOrgans
 
} = require("../../../../controllers/app/user/labs/nearLabs");

const route = Router();

route.post("/near",  getVendor);

route.get("/available/:id",  getVendoravailability);
route.get("/test/:id",  getVendorTest);
route.get("/startdate/:id",  getAllStartAndEndDateUser);
route.post("/time/:id",  getAvailabiltyOfUserVendorAndTime)
route.get("/date/:id",  getVendorDate)
route.get("/particular/:id",  getParticularVendor)
route.get("/package/:id",  getpackages)
route.get("/package" , getallpacakge)
route.get("/parttest" ,  getparticulatlabtest)
route.get("/getcollectionPackage", getPackagecollection );
route.get("/getAllOrgans",getAllOrgans );
module.exports = route;
