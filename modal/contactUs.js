const mongoose = require("mongoose");
 
const contactSchema = new mongoose.Schema(
 
  {
 
    email: { type: String,
       
        },
 
    phone: { type: String,
        
        },
    registeredAddress: { type: String,
         },
 
    postalAddress: { type: String,
       
    },
    facebookLink:{
        type: String
    },
    instaLink:{
        type:String
    },
    youtubeLink:{
        type:String
    },
    twitterLink:{
        type:String
    },
    linkedinLink:{
       type:String
    },
    androidAppLink:{
        type:String
    },
    iosAppleLink:{
        type:String
    },
 
  },
 
  { timestamps: true }
 
);
 
module.exports= mongoose.model("ContactUs", contactSchema);
 
 
 