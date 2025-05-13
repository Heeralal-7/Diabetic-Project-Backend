const Vendor = require("../../../../modal/vandor");
const Addtest = require("../../../../modal/addTest");
const Appointment = require("../../../../modal/Appointment");
const Package = require("../../../../modal/AddPackages");
const Test = require("../../../../modal/addTest");

//Get prescribed test
//Method:Get
//Endpoint: /onSearch/presTest
const getprescribedTest = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const data = await Addtest.find({ prescription: true })
      .populate("vendorId")
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    if (!data) {
      return res.send({
        success: 1,
        message: "No prescribed test available",
      });
    }

    return res.send({
      success: 1,
      message: "Fetched successfully",
      details: data,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//Get popular package
//Method:Get
//Endpoint:/onSearch/package
const popularPackage = async (req, res) => {
  try {
    // Fetch all appointments from the database
    const appointments = await Appointment.find({}).populate('testId');


    const packageMap = {};


    appointments.forEach((appointment) => {
     
      const tests = Array.isArray(appointment.testId)
        ? appointment.testId
        : [appointment.testId];


      tests.forEach((test) => {
        const testId = test._id.toString(); 
        if (!packageMap[testId]) {
          packageMap[testId] = {
            testDetails: test, 
            count: 1, 
          };
        } else {
          packageMap[testId].count += 1; 
        }
      });
    });

    const sortedPackages = Object.values(packageMap).sort(
      (a, b) => b.count - a.count
    );

    // Limit the result to the top 5 packages
    const topPackages = sortedPackages.slice(0, 5).map((pkg) => {
      const { count, testDetails } = pkg;
      return testDetails; 
    });

    return res.send({
      success: 1,
      message: "Top 5 popular packages fetched successfully",
      data: topPackages,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};


//Search test and package user
//Method:Get
//Endpoint:/onSearch/search?q
const search = async (req, res) => {
  try {
    const { q } = req.query;
    let query = {};

    if (q) {
      const regex = new RegExp(q, "i");
      query = {
        $and: [
          {
            $or: [
              { testName: { $regex: regex } },
              { packageName: { $regex: regex } },
            ],
          },
        ],
      };
    }
    const options = {
      sort: { createdAt: -1 },
    };

    // Search in both Package and Test collections
    const packageResults = await Package.find(query, null, options).populate('vendorId');
    const testResults = await Test.find(query, null, options).populate('vendorId');

    // Combine the results from both collections
    const combinedResults = [...packageResults, ...testResults];

    return res.send({
      success: 1,
      message: "Results fetched successfully",
      details: combinedResults,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//selected labs
//Method:Get
//Endpoints: /onSearch/selected
const selectedtastlab = async(req,res)=>{
  try {
    const {testName} = req.query

    const data = await Test.find({testName:testName}).populate("vendorId")

    if(data.length == 0){
      return res.send({
        success:0,
        message:'No lab found'
      })
    }

    return res.send({
      success:1,
      message:'Fetched successfully',
      details:data
    })


  } catch (error) {
    return res.send({
      success:0,
      message:error.message
    })
  }
}


module.exports = { getprescribedTest, popularPackage, search, selectedtastlab };
