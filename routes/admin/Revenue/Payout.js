const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Razorpay = require('razorpay');

// Models
const PayoutRequest = require('../../../modal/PayoutRequest');
const FoodOrder = require('../../../modal/foodOrder');
const OrderPharmacy = require('../../../modal/OrderPharmacy');
const Appointment = require('../../../modal/Appointment');
const Vendor = require('../../../modal/vandor'); 
const Doctor = require('../../../modal/docter'); 
const Clinic = require('../../../modal/clinic'); 

// Middleware
const { adminMiddleware } = require('../../../middleware/auth'); 

// Initialize Razorpay Safely
let razorpay = null;
try {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
    }
} catch (err) {
    console.warn("Razorpay init warning:", err.message);
}

// ==========================================
// 1. GET PAYOUT REQUESTS
// ==========================================
router.get('/payout-requests', adminMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) query.status = status;

    const requests = await PayoutRequest.find(query)
      .populate('vendorId', 'name email phone shopName clinicName bankDetails') 
      .sort({ createdAt: -1 });

    res.json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 2. APPROVE PAYOUT (REAL & SIMULATION FLOW)
// ==========================================
router.put('/payout-request/approve/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMode } = req.body; // 'razorpay' or 'manual'
    let { transactionId, adminNote } = req.body; 

    const request = await PayoutRequest.findById(id);
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });
    if (request.status === 'approved') return res.status(400).json({ success: false, message: "Already approved" });

    // --- RAZORPAY / INSTANT TRANSFER LOGIC ---
    if (paymentMode === 'razorpay') {
        
        // 1. Fetch Vendor Bank Details
        let vendor = null;
        if (request.vendorModel === 'vandor') vendor = await Vendor.findById(request.vendorId);
        else if (request.vendorModel === 'Doctor') vendor = await Doctor.findById(request.vendorId);
        else if (request.vendorModel === 'Clinic') vendor = await Clinic.findById(request.vendorId);

        // ✅ Check Bank Details (Required for both Real and Fake flow)
        if (!vendor || !vendor.bankDetails?.accountNumber || !vendor.bankDetails?.ifscCode) {
            return res.status(400).json({ 
                success: false, 
                message: "Bank details missing. Cannot process transfer." 
            });
        }

        // ✅ CHECK: REAL MODE OR SIMULATION?
        // Agar .env me Account Number hai, to Real. Nahi to Fake.
        const isRealMode = process.env.RAZORPAYX_ACCOUNT_NUMBER && razorpay;

        if (isRealMode) {
            // 👉 REAL MONEY TRANSFER
            try {
                // 1. Create Contact
                const contact = await razorpay.contacts.create({
                    name: vendor.name,
                    email: vendor.email || "vendor@example.com",
                    contact: vendor.phone,
                    type: "vendor",
                    reference_id: String(vendor._id),
                });

                // 2. Create Fund Account
                const fundAccount = await razorpay.fund_accounts.create({
                    contact_id: contact.id,
                    account_type: "bank_account",
                    bank_account: {
                        name: vendor.bankDetails.accountHolderName,
                        ifsc: vendor.bankDetails.ifscCode,
                        account_number: vendor.bankDetails.accountNumber,
                    },
                });

                // 3. Initiate Payout
                const payout = await razorpay.payouts.create({
                    account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER, 
                    fund_account_id: fundAccount.id,
                    amount: Math.round(request.totalAmount * 100),
                    currency: "INR",
                    mode: "IMPS",
                    purpose: "payout",
                    reference_id: String(request._id),
                });

                transactionId = payout.id;
                adminNote = `Success: RazorpayX Transfer (Ref: ${payout.id})`;

            } catch (error) {
                console.error("Real Payout Failed:", error);
                return res.status(500).json({ success: false, message: "Razorpay Error: " + error.error?.description });
            }
        } 
        else {
            // 👉 FAKE MONEY TRANSFER (SIMULATION)
            // Backend behaves EXACTLY like Real Mode but generates a fake ID
            console.log("⚠️ Simulation Mode: Generating Fake Transaction...");
            
            // Generate a realistic looking Razorpay ID
            const randomId = Math.random().toString(36).substring(2, 12).toUpperCase();
            transactionId = `pout_sim_${randomId}`; 
            
            adminNote = `Success: Simulated Transfer (Test Mode). Sent to ${vendor.bankDetails.accountNumber}`;
        }
    }

    // --- DB UPDATE (Common) ---
    request.status = 'approved';
    request.transactionId = transactionId || "Manual";
    request.adminNote = adminNote || "";
    await request.save();

    // Mark orders as paid
    const updatePromises = [];
    if (request.foodOrders?.length > 0) updatePromises.push(FoodOrder.updateMany({ _id: { $in: request.foodOrders } }, { payoutStatus: 'paid' }));
    if (request.pharmacyOrders?.length > 0) updatePromises.push(OrderPharmacy.updateMany({ _id: { $in: request.pharmacyOrders } }, { payoutStatus: 'paid' }));
    if (request.appointments?.length > 0) updatePromises.push(Appointment.updateMany({ _id: { $in: request.appointments } }, { payoutStatus: 'paid' }));

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: "Transfer Successful!",
      data: {
          request,
          mode: paymentMode === 'razorpay' ? 'Instant Transfer' : 'Manual',
          transactionId: transactionId
      }
    });

  } catch (error) {
    console.error("Approval Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. REJECT (No changes)
router.put('/payout-request/reject/:id', adminMiddleware, async (req, res) => {
    // ... (Same as previous code) ...
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const request = await PayoutRequest.findById(id);
        if (!request) return res.status(404).json({ success: false, message: "Not found" });
        if (request.status === 'approved') return res.status(400).json({ success: false, message: "Cannot reject approved" });

        request.status = 'rejected';
        request.adminNote = reason;
        await request.save();

        // Revert Logic
        const revert = [];
        if (request.foodOrders?.length) revert.push(FoodOrder.updateMany({ _id: { $in: request.foodOrders } }, { payoutStatus: 'pending', payoutRequestId: null }));
        if (request.pharmacyOrders?.length) revert.push(OrderPharmacy.updateMany({ _id: { $in: request.pharmacyOrders } }, { payoutStatus: 'pending', payoutRequestId: null }));
        if (request.appointments?.length) revert.push(Appointment.updateMany({ _id: { $in: request.appointments } }, { payoutStatus: 'pending', payoutRequestId: null }));
        await Promise.all(revert);

        res.json({ success: true, message: "Rejected successfully" });
    } catch(e) { res.status(500).json({success: false, message: e.message}); }
});

module.exports = router;