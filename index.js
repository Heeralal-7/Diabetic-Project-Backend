const express = require("express");
const cluster = require('cluster')
const os = require('os')
require("dotenv").config();
const cors = require("cors");
const { db } = require("./db/dataBase");
const bodyParser = require("body-parser");
const morgan = require("morgan");


const app = express();
const port = process.env.PORT || 8081;
// const totalCpus = os.cpus().length
// app.use(morgan("dev"));  //api hit counter
app.use(morgan(":method :url :status :response-time ms - :remote-addr"));

const dns = require('node:dns/promises');
dns.setServers(["1.1.1.1", "8.8.8.8"]); // Forces Node to bypass the Windows DNS bug


// if(cluster.isPrimary){
//   for(let i=0; i<totalCpus; i++){
//     cluster.fork()
//   }
// } else{
  
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("./uploads"));
app.use(bodyParser.urlencoded({ extended: true }));
const path = require("path");

app.use('/prescriptions', express.static(path.join(__dirname, 'uploads/doctor/PdfDocument')));
app.use('/uploads/specialists', express.static(path.join(__dirname, 'uploads/specialists'))); // ✅ ADD THIS LINE
app.use('/uploads/aboutus', express.static(path.join(__dirname, 'uploads/aboutus'))); // ✅ ADD THIS LINE
app.use('/uploads/science', express.static(path.join(__dirname, 'uploads/science'))); // ✅ ADD THIS LINE
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

 
 
// Databas
db();

////////////    Admin Routes Start    /////////////////////
app.use("/admin", require("./routes/admin/login"));
app.use("/admin-vendor-all", require("./routes/admin/Vendor/Lab/User"));
app.use("/admin-test", require("./routes/admin/Vendor/Lab/testCreate"));
app.use("/qualification", require("./routes/admin/Doctor/qualification"));
app.use("/specialists", require("./routes/admin/Doctor/specialists"));
app.use("/vendor-coupon", require("./routes/admin/Vendor/Lab/coupon"));
app.use("/vendor-package", require("./routes/admin/Vendor/Lab/package"));
app.use("/admin-blog", require("./routes/admin/User/blog"));
app.use("/admin-clinic", require("./routes/admin/Clinic/clinic1"));
app.use("/vendor-document", require("./routes/admin/Vendor/Lab/document"));
app.use("/banner-image", require("./routes/admin/User/banner"));
app.use("/upload-videos", require("./routes/admin/User/video"));
app.use("/customer", require("./routes/admin/adminCustomerSupport"));
app.use("/admin-pharmacy-all", require("./routes/admin/Vendor/Pharmacy/user")) 
app.use("/admin-user" , require("./routes/admin/User/user"))
app.use("/footer-content" , require("./routes/admin/User/footerContent"))
app.use("/admin-food" , require("./routes/admin/Vendor/Food/addFood"))
app.use("/doctorAccess", require("./routes/admin/Doctor/doctorAccess"));
app.use("/admin-medicine", require("./routes/admin/Vendor/Pharmacy/Medicine")); // upload medicine
app.use("/upload-excel-hospital", require("./routes/admin/Vendor/Pharmacy/Products")); // upload hospital product
 app.use("/admin-delivery-charges", require("./routes/admin/Vendor/Pharmacy/DeliveryCharges")); // delivery charges
 app.use("/admin-food-delivery-charges", require("./routes/admin/Vendor/Food/deliveryCharges")); // delivery charges food
 app.use("/admin-lab-delivery-charges", require("./routes/admin/Vendor/Lab/labDeliveryCharges")); // delivery charges lab
 app.use("/distance", require("./routes/admin/User/distanceLimit")); 
 
 

 app.use("/admin/subadmin", require("./routes/admin/subAdmin"));
app.use("/admin/location", require("./routes/admin/location"));
app.use("/admin/membership", require("./routes/admin/Doctor/Membership")); // Membership plan routes
app.use("/admin", require("./routes/admin/User/AboutUs")); // About Us routes
app.use("/admin", require("./routes/admin/User/contactUs")); // Contact Us routes
app.use("/admin/science-page", require("./routes/admin/User/sciencePageRoutes")); // Science Page routes
app.use("/admin-revenue", require("./routes/admin/Revenue/Order")); // Revenue routes
app.use("/brand-images-pharmacy", require("./routes/app/user/brandImagePharmacy"));
app.use("/admin-cancel-charge", require("./routes/admin/Revenue/CancelCharge")); // Cancellation charge routes
app.use("/care-program", require("./routes/admin/User/careProgramPageEdit")); // Cancellation charge routes
app.use("/admin-payout", require("./routes/admin/Revenue/Payout")); // Payout Request routes
 
////////////    Admin Routes End    /////////////////////


////////////// Subadmin Rotues Start  //////////////////
app.use("/subadmin", require("./routes/subadmin/subAdminDashboard")); // Sub-admin specific routes
app.use("/subadmin/user", require("./routes/subadmin/user/user")); // Sub-admin user management routes
app.use("/subadmin/about-us", require("./routes/subadmin/user/AboutUs")); // Sub-admin user management routes
app.use("/subadmin/science", require("./routes/subadmin/user/Science")); // Sub-admin user management routes
app.use("/subadmin/blogs", require("./routes/subadmin/user/Blogs")); // Sub-admin user management routes


app.use("/subadmin/doctor", require("./routes/subadmin/doctor/doctor")); // Sub-admin doctor management routes

app.use("/subadmin/clinic", require("./routes/subadmin/clinic/clinic")); // Sub-admin clinic management routes
app.use("/subadmin/specialists", require("./routes/subadmin/clinic/specialists")); // Sub-admin specialists management routes

app.use("/subadmin/vendor/lab", require("./routes/subadmin/Vendor/Lab/LabSubadmin")); // Sub-admin vendor management routes
app.use("/subadmin/vendor/labtest", require("./routes/subadmin/Vendor/Lab/TestCreate")); // Sub-admin test management routes
app.use("/membership", require("./routes/subadmin/doctor/MembershipPlan")); // Sub-admin membership plan routes

app.use("/subadmin/pharmacy", require("./routes/subadmin/Vendor/Pharmacy/PharmacySubadmin")); // Sub-admin pharmacy vendor management routes
app.use("/subadmin/vendor/food", require("./routes/subadmin/Vendor/Food/FoodSubadmin")); // Sub-admin food vendor management routes
app.use("/subadmin-food-delivery-charges", require("./routes/subadmin/Vendor/Food/DeliveryChargeSub")); // Sub-admin food delivery charges routes
app.use("/subadmin-lab-delivery-charges", require("./routes/subadmin/Vendor/Lab/labDeliveryCharges")); // subadmin lab delivery charges routes
app.use("/subadmin/upload-image-brand", require("./routes/subadmin/user/UploadBrandImagesPharmacy"))
app.use("/footerSub", require("./routes/subadmin/user/footerContent"))
app.use("/contactUsSub", require("./routes/subadmin/user/contactUs"))
app.use("/video", require("./routes/subadmin/user/video"))
app.use("/subadmin-cancellation", require("./routes/subadmin/user/cancellationCharge"))
app.use("/care", require("./routes/subadmin/user/careProgramEdit"))



////////////// App Rotues Start  //////////////////

////////////// Doctor Rotues Start  //////////////////
app.use("/doctor", require("./routes/app/Docter/login"));
app.use("/appointments", require("./routes/app/Docter/appointments"));
app.use("/qualification", require("./routes/app/Docter/qualification"));
app.use("/specialiazation", require("./routes/app/Docter/specialiaztion"));
app.use("/doctor-document", require("./routes/app/Docter/document"));
app.use("/fees", require("./routes/app/Docter/ConsultationFees"));
app.use("/doctor-rating", require("./routes/app/Docter/rating"));
app.use("/doctor-coupon", require("./routes/app/Docter/coupon"));
app.use("/doctor-availability", require("./routes/app/Docter/availability"));
app.use("/doctor-privacy", require("./routes/app/Docter/privacypolicy"));
app.use("/add-bank", require("./routes/app/Docter/AddAccount"));
app.use("/doctor-Prescription",require("./routes/app/Docter/doctorPrescription"));
app.use("/fire",require("./routes/app/Docter/firebase"))
app.use("/doctor-revenue", require("./routes/app/Docter/revenueDoctor")); 
////////////// Doctor Rotues End  //////////////////

////////////    Vendor Routes Start    /////////////////////
app.use("/vendor", require("./routes/app/vendor/signup"));
app.use("/all-appointments", require("./routes/app/vendor/lab/appointment"));
app.use("/availability", require("./routes/app/vendor/lab/availabiliity"));
app.use("/coupon", require("./routes/app/vendor/lab/coupon"));
app.use("/document", require("./routes/app/vendor/lab/document"));
app.use("/addTest", require("./routes/app/vendor/lab/addTest"));
app.use("/package", require("./routes/app/vendor/lab/addPackage"));
app.use("/test", require("./routes/app/vendor/lab/testCreate"));
app.use("/driver", require("./routes/app/vendor/lab/driver"));
app.use("/pick", require("./routes/app/vendor/lab/pickup"));
app.use("/vendor-rating", require("./routes/app/vendor/lab/rating"));
app.use("/services", require("./routes/app/vendor/pharmacy/addService"));
app.use("/Products", require("./routes/app/vendor/pharmacy/addProducts"));
app.use("/appointment", require("./routes/app/vendor/pharmacy/appointments"));
app.use("/organ" , require("./routes/app/vendor/lab/organ"))
app.use('/bulk' , require("./routes/app/vendor/lab/addPackageCategories"))
app.use('/food' , require("./routes/app/vendor/food/addfood"))
app.use('/food-vendor-revenue' , require("./routes/app/vendor/food/Revenue"))
app.use('/pharmacy-vendor-revenue' , require("./routes/app/vendor/pharmacy/Revenue"))
app.use('/lab-vendor-revenue' , require("./routes/app/vendor/lab/Revenue"))
app.use('/food-available' , require("./routes/app/vendor/food/availability"))
app.use('/craving' , require("./routes/app/user/food/craving"))
app.use('/vendor-order', require("./routes/app/vendor/food/order"))

app.use("/vendor-payout", require("./routes/app/vendor/Payout")); // Payout Request routes


////////////    Vendor Routes End    /////////////////////

// Country data
app.use("/country", require("./routes/app/cntrydata/cntry"));

////////////    User Routes Start    /////////////////////
app.use("/user", require("./routes/app/user/login"));
app.use("/user-appointment", require("./routes/app/user/Doctor/Appointment"));
app.use("/user-rating", require("./routes/app/user/rating"));
app.use(
  "/user-doctor-availablity",
  require("./routes/app/user/Doctor/availablity")
);
app.use("/user-add-member", require("./routes/app/user/Doctor/AddPatient"));
app.use("/user-applycoupon", require("./routes/app/user/Doctor/applycoupon"));
app.use("/user-doctor", require("./routes/app/user/Doctor/user"));
app.use("/blogs", require("./routes/app/user/blog/blog"));
app.use("/create-comment", require("./routes/app/user/comment"));
app.use("/like-dislike", require("./routes/app/user/like"));
app.use("/user-policy", require("./routes/app/user/privacypolicy"));
app.use("/rewards", require("./routes/app/user/reward"));
app.use("/user-coupons", require("./routes/app/user/coupon "));
app.use("/user-prescription", require("./routes/app/user/userprescription"));
app.use("/bp", require("./routes/app/user/userbp"));
app.use("/weight", require("./routes/app/user/userWeight"));
app.use("/bmi", require("./routes/app/user/bmi"));
app.use("/tag", require("./routes/app/user/alertDoctor"));
app.use("/labnear", require("./routes/app/user/lab/nearLabs"));
app.use("/apply", require("./routes/app/user/lab/applyCoupon"));
app.use("/lab-appointment", require("./routes/app/user/lab/appointment"));
app.use("/customer", require("./routes/app/user/customerSupport"));
app.use("/shops", require("./routes/app/user/pharmacy/nearShops"));
app.use("/patient", require("./routes/app/user/lab/addpatientdetails"));
app.use("/labtest", require("./routes/app/user/lab/myLabtest"))
app.use("/onSearch" , require("./routes/app/user/lab/onSearch"))
app.use("/tbanner" , require("./routes/app/user/banner"))
app.use("/topKitchen" , require("./routes/app/user/food/topkitchen"))
app.use('/food-Order' , require("./routes/app/user/food/order"))
app.use("/Userpayment",require("./routes/app/user/payment"))
app.use("/membership",require("./routes/app/user/referal"))
app.use("/user-membership", require("./routes/app/user/Doctor/Membership"));
app.use("/user", require("./routes/app/user/userAboutUs"));
app.use("/user/food-delivery-charges", require("./routes/app/vendor/food/deliveryCharges"));

app.use("/razorpay", require("./routes/razorpay/Payment"));
app.use("/user-cancel-charge", require("./routes/app/user/CancelChargeUser"));
////////////    User Routes end    /////////////////////

////////////    Driver Routes Start    /////////////////////
app.use("/driver", require("./routes/app/driver/login"));
app.use("/history", require("./routes/app/driver/History"));
app.use("/member",require("./routes/app/driver/AddMebmer"))
app.use("/driver-pharmacy", require("./routes/app/driver/PharmacyDriver"));
 
 
////////////    Driver Routes End    /////////////////////

app.get("/test", (req, res) => {
  return res.send("hello world");
});

////////////    App Routes End    /////////////////////

////////////    Website Routes Start    /////////////////////

app.use("/website", require("./routes/website/vendor/lab/user"));
app.use("/doctor", require("./routes/website/Doctor/doctor"));
////////////    Website Routes End    /////////////////////

app.use("/update-test", require("./routes/test"));

// Zego Cloud
app.use("/generate-token", require("./routes/zego/zego"));
//End Zego Cloud

app.use("/agora", require("./routes/agora/agora"));

////////////    Clinic Routes start    /////////////////////


app.use("/Clinic",require("./routes/app/Clinic/login"))
app.use("/Clinic-Documnet",require("./routes/app/Clinic/Document"))
app.use("/userClinic",require("./routes/app/user/Clinic/Clinic"))
app.use("/clincuser",require("./routes/app/user/Clinic/ClinicAppointment"))
app.use("/ClinicAppointment",require("./routes/app/Clinic/ClinicAppointment"))
app.use("/clinic-revenue", require("./routes/app/Clinic/revenueClinic"));
////////////    Clinic Routes End    /////////////////////





// Listener
const IP = process.env.IP;

// app.listen(port, IP, () => {
//   console.log(`App is listening at ${IP}:${port}`);
// });

app.listen(port, "0.0.0.0", () => {
  console.log(`App is listening at ${IP}:${port}`);
  
})
// }