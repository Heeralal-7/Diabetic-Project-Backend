const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const router = express.Router();
const { adminMiddleware } = require("../../middleware/auth");

// Models
const FoodOrder = require("../../modal/foodOrder");
const OrderPharmacy = require("../../modal/OrderPharmacy");
const Appointment = require("../../modal/Appointment");

// Razorpay Instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// CREATE ORDER
// End point : razorpay/payment/create-order
router.post("/payment/create-order", async (req, res) => {
  try {
    const { amount, currency = "INR", receipt = "receipt_1" } = req.body;

    const options = {
      amount,
      currency,
      receipt,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    return res.json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// VERIFY PAYMENT (Supports both actual + manual Postman test)
// End point : razorpay/payment/verify-payment
router.post("/payment/verify-payment", (req, res) => {
  try {
    let { razorpay_order_id, razorpay_payment_id, razorpay_signature, test_mode } = req.body;

    // ---------------------------
    // TEST MODE (For Postman)
    // ---------------------------
    if (test_mode === true) {
      const bodyString = `${razorpay_order_id}|${razorpay_payment_id}`;

      const testSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(bodyString)
        .digest("hex");

      if (testSignature === razorpay_signature) {
        return res.json({
          success: true,
          message: "TEST MODE: Payment verified successfully",
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "TEST MODE: Payment verification failed",
        });
      }
    }

    // ---------------------------
    // LIVE / REAL PAYMENT VERIFY
    // ---------------------------
    const signBody = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(signBody)
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      return res.json({
        success: true,
        message: "Payment verified successfully",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// CAPTURE PAYMENT
// End point ; razorpay/payment/capture-payment
router.post("/payment/capture-payment", async (req, res) => {
  try {
    const { payment_id, amount } = req.body;

    const payment = await razorpay.payments.capture(payment_id, amount);

    return res.json({
      success: true,
      message: "Payment captured successfully",
      data: payment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Process Refund via Razorpay (Admin)
// End point: /razorpay/payment/process-refund
// Process Refund via Razorpay (Admin)
// End point: /razorpay/payment/process-refund
// ✅ Corrected Backend Code for Refund
// router.post('/payment/process-refund', adminMiddleware, async (req, res) => {
//   try {
//     const { orderId, orderType } = req.body;

//     if (!orderId || !orderType) {
//       return res.status(400).json({ success: false, message: "Order ID and type required" });
//     }

//     // 1. Fetch the Order
//     let order;
//     let OrderModel;

//     switch (orderType) {
//       case 'food': OrderModel = FoodOrder; break;
//       case 'pharmacy': OrderModel = OrderPharmacy; break;
//       case 'lab':
//       case 'doctor': OrderModel = Appointment; break;
//       default: return res.status(400).json({ success: false, message: "Invalid order type" });
//     }

//     order = await OrderModel.findById(orderId);

//     if (!order) {
//       return res.status(404).json({ success: false, message: "Order not found" });
//     }

//     if (order.cancellationStatus !== 'cancelled') {
//       return res.status(400).json({ success: false, message: "Order is not cancelled yet" });
//     }

//     if (order.refundStatus === 'completed') {
//       return res.status(400).json({ success: false, message: "Refund already processed" });
//     }

//     // Handle COD
//     if (order.paymentMethod === 'cod') {
//       order.refundStatus = 'completed';
//       order.refundId = 'COD_REFUND';
//       order.refundedAt = new Date();
//       await order.save();
      
//       return res.json({
//         success: true,
//         message: "COD Order marked as refunded",
//         data: { refundId: 'COD_REFUND' }
//       });
//     }

//     // Get Payment ID
//     const razorpayTxnId = order.paymentId; 

//     if (!razorpayTxnId) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "No Online Payment ID found (paymentId missing)" 
//       });
//     }

//     // ---------------------------------------------------------
//     // ✅ FIX START: Check Status & Capture if needed
//     // ---------------------------------------------------------
    
//     // 1. Fetch Payment Details from Razorpay
//     let paymentDetails;
//     try {
//         paymentDetails = await razorpay.payments.fetch(razorpayTxnId);
//     } catch (err) {
//         return res.status(400).json({ success: false, message: "Invalid Payment ID on Razorpay" });
//     }

//     // 2. Agar status 'authorized' hai, to pehle CAPTURE karo
//     if (paymentDetails.status === 'authorized') {
//         try {
//             // Full amount capture karna padta hai refund karne ke liye
//             await razorpay.payments.capture(razorpayTxnId, paymentDetails.amount, paymentDetails.currency);
//             console.log("Payment automatically captured before refunding.");
//         } catch (captureError) {
//             return res.status(500).json({ 
//                 success: false, 
//                 message: "Could not capture payment: " + captureError.message 
//             });
//         }
//     }
//     // ---------------------------------------------------------
//     // ✅ FIX END
//     // ---------------------------------------------------------

//     // 3. Calculate Refund Amount
//     const refundAmountInRupees = order.refundAmount; 
    
//     if (!refundAmountInRupees || refundAmountInRupees <= 0) {
//        return res.status(400).json({ success: false, message: "Refund amount is 0 or invalid" });
//     }

//     const refundAmountInPaise = Math.round(refundAmountInRupees * 100);

//     // 4. Refund Call
//     try {
//       const refund = await razorpay.payments.refund(razorpayTxnId, {
//         amount: refundAmountInPaise,
//         speed: "normal",
//         notes: {
//           reason: "Order Cancellation via Admin Panel",
//           orderId: orderId,
//           orderType: orderType
//         },
//         receipt: `Refund_${orderId}`
//       });

//       // 5. Save to DB
//       order.refundStatus = 'completed';
//       order.refundId = refund.id;
//       order.refundedAt = new Date();
//       await order.save();

//       res.json({
//         success: true,
//         message: "Refund initiated successfully via Razorpay",
//         data: refund
//       });

//     } catch (razorpayError) {
//       console.error("Razorpay Refund Error:", razorpayError);
//       return res.status(500).json({ 
//         success: false, 
//         message: "Razorpay Refund Failed: " + (razorpayError.error?.description || razorpayError.message) 
//       });
//     }

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

router.post('/payment/process-refund', adminMiddleware, async (req, res) => {
  try {
    // manualTransactionId & refundMode are sent by Admin for COD orders
    const { orderId, orderType, manualTransactionId, refundMode } = req.body; 

    if (!orderId || !orderType) {
      return res.status(400).json({ success: false, message: "Order ID and type required" });
    }

    // 1. Fetch Order
    let OrderModel;
    switch (orderType) {
      case 'food': OrderModel = FoodOrder; break;
      case 'pharmacy': OrderModel = OrderPharmacy; break;
      case 'lab': OrderModel = Appointment; break;
      case 'doctor': OrderModel = Appointment; break;
      default: return res.status(400).json({ success: false, message: "Invalid order type" });
    }

    const order = await OrderModel.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.refundStatus === 'completed') {
      return res.status(400).json({ success: false, message: "Refund already processed" });
    }

    // ==========================================
    // CASE 1: COD REFUND (Manual)
    // ==========================================
    if (order.paymentMethod === 'cod') {
      
      // Validation: Admin must provide Transaction ID
      if (!manualTransactionId) {
        return res.status(400).json({ success: false, message: "Transaction ID is required for COD Refund" });
      }

      order.refundStatus = 'completed';
      order.refundId = manualTransactionId; // The Bank/UPI Ref ID
      order.refundedAt = new Date();
      
      // Save extra details for record
      order.manualRefundDetails = {
        adminTransactionId: manualTransactionId,
        refundedByMode: refundMode || 'Manual Transfer', // e.g. "IMPS"
        refundDate: new Date()
      };

      await order.save();
      
      return res.json({
        success: true,
        message: "COD Refund marked as completed successfully",
        data: { refundId: manualTransactionId }
      });
    }

    // ==========================================
    // CASE 2: ONLINE REFUND (Razorpay)
    // ==========================================
    const razorpayTxnId = order.paymentId; 
    if (!razorpayTxnId) {
      return res.status(400).json({ success: false, message: "No Payment ID found" });
    }

    // (Existing Razorpay Logic...)
    // 1. Capture if authorized
    let paymentDetails;
    try {
        paymentDetails = await razorpay.payments.fetch(razorpayTxnId);
        if (paymentDetails.status === 'authorized') {
            await razorpay.payments.capture(razorpayTxnId, paymentDetails.amount, paymentDetails.currency);
        }
    } catch (err) {
        // ignore error
    }

    // 2. Process Refund
    const refundAmountInPaise = Math.round(order.refundAmount * 100);
    const refund = await razorpay.payments.refund(razorpayTxnId, {
        amount: refundAmountInPaise,
        speed: "normal",
        notes: { reason: "Admin Cancellation", orderId, orderType },
        receipt: `Refund_${orderId}`
    });

    order.refundStatus = 'completed';
    order.refundId = refund.id;
    order.refundedAt = new Date();
    await order.save();

    res.json({ success: true, message: "Online Refund initiated", data: refund });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});
module.exports = router;
