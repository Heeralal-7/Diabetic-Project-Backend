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

route.post("/near", middlewere, getVendor);

route.get("/available/:id", middlewere, getVendoravailability);
route.get("/test/:id", middlewere, getVendorTest);
route.get("/startdate/:id", middlewere, getAllStartAndEndDateUser);
route.post("/time/:id", middlewere , getAvailabiltyOfUserVendorAndTime)
route.get("/date/:id", middlewere, getVendorDate)
route.get("/particular/:id", middlewere , getParticularVendor)
route.get("/package/:id", middlewere , getpackages)
route.get("/package" ,middlewere , getallpacakge)
route.get("/parttest" , middlewere , getparticulatlabtest)
route.get("/getcollectionPackage", middlewere,getPackagecollection );
route.get("/getAllOrgans",getAllOrgans );
module.exports = route;
