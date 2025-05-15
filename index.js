const express = require("express");
const cluster = require('cluster')
const os = require('os')
require("dotenv").config();
const cors = require("cors");
const { db } = require("./db/dataBase");
const bodyParser = require("body-parser");

const app = express();
const port = process.env.PORT || 8081;
const totalCpus = os.cpus().length
 

if(cluster.isPrimary){
  for(let i=0; i<totalCpus; i++){
    cluster.fork()
  }
} else{
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("./uploads"));
app.use(bodyParser.urlencoded({ extended: true }));

// Database
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
app.use("/vendor-document", require("./routes/admin/Vendor/Lab/document"));
app.use("/banner-image", require("./routes/admin/User/banner"));
app.use("/upload-videos", require("./routes/admin/User/video"));
app.use("/customer", require("./routes/admin/adminCustomerSupport"));
app.use("/admin-pharmacy-all", require("./routes/admin/Vendor/Pharmacy/user")) 
app.use("/admin-user" , require("./routes/admin/User/user"))
app.use("/admin-food" , require("./routes/admin/Vendor/Food/addFood"))
////////////    Admin Routes End    /////////////////////

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
app.use("/appointment", require("./routes/app/vendor/pharmacy/appointments"));
app.use("/organ" , require("./routes/app/vendor/lab/organ"))
app.use('/bulk' , require("./routes/app/vendor/lab/addPackageCategories"))
app.use('/food' , require("./routes/app/vendor/food/addfood"))
app.use('/food-available' , require("./routes/app/vendor/food/availability"))
app.use('/craving' , require("./routes/app/user/food/craving"))
app.use('/vendor-order', require("./routes/app/vendor/food/order"))


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
////////////    User Routes end    /////////////////////

////////////    Driver Routes Start    /////////////////////
app.use("/driver", require("./routes/app/driver/login"));
app.use("/history", require("./routes/app/driver/History"));
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

// app.use("/agora", require("./routes/agora/agora"));

// Listener
const IP = process.env.IP;

// app.listen(port, IP, () => {
//   console.log(`App is listening at ${IP}:${port}`);
// });

app.listen(port,() => {
  console.log(`App is listening at ${IP}:${port}`);
  
})
}
