// db.js (or wherever you connect)
const mongoose = require("mongoose");
 
const db = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL, {
      dbName: "diabetic",      
    });
    console.log("Database is connected successfully");
  } catch (error) {
    console.log(error.message);
  }
};
 
module.exports = { db };
 