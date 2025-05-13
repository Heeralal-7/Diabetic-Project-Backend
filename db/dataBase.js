const mongoose = require("mongoose");

const db = async () => {
  try {
   //  console.log(process.env.DATABASE_URL);
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("Database is connected successfully...");
  } catch (error) {
    console.log(error.message);
  }
};
module.exports = { db };
    