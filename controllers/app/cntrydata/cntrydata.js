const { Country: CountryData, State, City } = require("country-state-city");
const connectDB = require("../../../db/dataBase");
const mongoose = require("mongoose");
const Countries1 = require("../../../modal/countries");
const States1 = require("../../../modal/states");
const Cities1 = require("../../../modal/cities");
// add country data

const cntryinsert = async (req, res) => {
  try {
    // Ensure DB is connected

    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    // Insert countries
    const countryBulk = mongoose.connection.db
      .collection("countries")
      .initializeOrderedBulkOp();
    const countryData = CountryData.getAllCountries();
    // return res.send(countryData)
    countryData.forEach((ele) => {
      countryBulk.insert({
        name: ele.name,
        isoCode: ele.isoCode,
        phonecode: ele.phonecode,
      });
    });
    await countryBulk.execute();
    console.log("Countries inserted");

    // Insert states
    const stateBulk = mongoose.connection.db
      .collection("states")
      .initializeOrderedBulkOp();
    const stateData = State.getAllStates();
    //  return res.send(stateData)
    stateData.forEach((ele) => {
      stateBulk.insert({
        name: ele.name,
        countryCode: ele.countryCode,
        isoCode: ele.isoCode,
      });
    });
    await stateBulk.execute();
    console.log("States inserted");

    // Insert cities
    const cityBulk = mongoose.connection.db
      .collection("cities")
      .initializeOrderedBulkOp();
    const cityData = City.getAllCities();
    // return res.send(cityData)
    cityData.forEach((ele) => {
      cityBulk.insert({
        name: ele.name,
        stateCode: ele.stateCode,
        countryCode: ele.countryCode,
      });
    });
    await cityBulk.execute();
    console.log("Cities inserted");

    res.send({ message: "Data inserted successfully!" });
  } catch (error) {
    console.error("Error inserting data: ", error);
    res
      .status(500)
      .send({ message: "Error inserting data", error: error.message });
  }
};

// get all countries
const listOfCountry = async (req, res) => {
  try {
    const data = await Countries1.find();
    return res.send({
      success: 1,
      message: "List successfully get ",
      details: data,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: "List faild to  get ",
      error: error.message,
    });
  }
};
// get state
const listOfState = async (req, res) => {
  try {
    const data = await States1.find({ countryCode: req.body.cCode });
    return res.send({
      success: 1,
      message: "State successfully get ",
      details: data,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: "List faild to  get ",
      error: error.message,
    });
  }
};
// get cities
const listOfCity = async (req, res) => {
  try {
    const data = await Cities1.find({
      stateCode: req.body.sCode,
      countryCode: req.body.cCode,
    });
    return res.send({
      success: 1,
      message: "State successfully get ",
      details: data,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: "List faild to  get ",
      error: error.message,
    });
  }
};

module.exports = { cntryinsert, listOfCountry, listOfState, listOfCity };
