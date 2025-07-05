const Payment = require("../../../modal/payment");
const User = require("../../../modal/user");
const Doctor = require("../../../modal/docter");
const Vendor = require("../../../modal/vandor");
const Clinic = require("../../../modal/clinic");
const mongoose = require("mongoose");
const moment = require('moment');
//  Userpayment/payment
const payment = async (req, res) => {
    try {
      const userId = req.user._id;
      const { doctorId, vendorId, clinicId } = req.query;
      const { amount, PaymentId } = req.body;
  
      // Validate required fields
      if (!amount || !PaymentId) {
        return res.status(400).send({
          success: 0,
          message: "Amount and PaymentId are required in the request body.",
        });
      }
  
      // Build paymentData
      let paymentData = {
        userId,
        Amount: amount,
        PaymentId,
      };
  
      if (doctorId) paymentData.doctorId = doctorId;
      if (vendorId) paymentData.vendorId = vendorId;
      if (clinicId) {
        paymentData.clinicId = clinicId;
        if (doctorId) {
          paymentData.ClinicStatus = "1";
        }
      }
  
      if (!doctorId && !vendorId && !clinicId) {
        return res.status(400).send({
          success: 0,
          message: "At least one of doctorId, vendorId, or clinicId must be provided.",
        });
      }
  
      const newPayment = new Payment(paymentData);
      await newPayment.save();
  
      return res.send({
        success: 1,
        message: "Payment recorded successfully",
        data: newPayment,
      });
    } catch (error) {
      return res.status(500).send({
        success: 0,
        message: error.message,
      });
    }
  };
  
   
  //      Userpayment/getPayment
 const getPayment = async (req, res) => {
  try {
    const { doctorId, clinicId, vendorId } = req.query;

    let filter = {};

    if (doctorId) {
      filter.doctorId = doctorId;

      if (clinicId) {
        filter.ClinicStatus = "1";
        filter.clinicId = clinicId;
      }
    } else if (vendorId) {
      filter.vendorId = vendorId;
    } else if (clinicId) {
      filter.clinicId = clinicId;
      filter.ClinicStatus = "1"; // Only status "1" payments
    } else {
      return res.status(400).send({
        success: 0,
        message: "Either doctorId or vendorId is required.",
      });
    }

    const payments = await Payment.find(filter).populate("userId");

    let response = {
      success: 1,
      message: "Payments fetched successfully",
      data: payments,
    };

    // Only if doctorId is not passed, calculate totalAmount
    if (!doctorId && clinicId) {
      const totalAmount = payments.reduce((sum, p) => sum + (p.Amount || 0), 0);
      response.totalAmount = totalAmount;
    }

    return res.send(response);
  } catch (error) {
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};




  // Userpayment/getTotalEarnings
  const getTotalEarnings = async (req, res) => {
    try {
      const { doctorId, vendorId, clinicId } = req.query;
  
      if (!doctorId && !vendorId && !clinicId) {
        return res.status(400).send({
          success: 0,
          message: "doctorId, vendorId, or clinicId is required",
        });
      }
  
      const matchFilter = {};
      if (doctorId) matchFilter.doctorId = new mongoose.Types.ObjectId(doctorId);
      if (vendorId) matchFilter.vendorId = new mongoose.Types.ObjectId(vendorId);
      if (clinicId) {
        matchFilter.clinicId = new mongoose.Types.ObjectId(clinicId);
        matchFilter.ClinicStatus = "1";
      }
  
      const now = new Date();
  
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
  
      const startOfWeek = new Date();
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
  
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);
  
      const getAmount = async (startDate) => {
        const result = await Payment.aggregate([
          { $match: { ...matchFilter, timestamp: { $gte: startDate } } },
          { $group: { _id: null, totalAmount: { $sum: "$Amount" } } },
        ]);
        return result[0]?.totalAmount || 0;
      };
  
      const [total, today, thisWeek, thisMonth, thisYear] = await Promise.all([
        getAmount(new Date(0)),      // All time
        getAmount(startOfDay),       // Today
        getAmount(startOfWeek),      // This week
        getAmount(startOfMonth),     // This month
        getAmount(startOfYear),      // This year
      ]);
  
      return res.send({
        success: 1,
        message: "Earnings fetched successfully",
        data: {
          total,
          today,
          thisWeek,
          thisMonth,
          thisYear,
        },
      });
    } catch (error) {
      return res.status(500).send({
        success: 0,
        message: error.message,
      });
    }
  };
  

  module.exports = {payment,getPayment,getTotalEarnings}
