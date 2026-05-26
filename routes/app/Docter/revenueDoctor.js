const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Models
const Appointment = require('../../../modal/Appointment'); 
const CutoffSettings = require('../../../modal/CutoffSettings'); 

// Middleware
const { doctorMiddleware } = require('../../../middleware/auth'); 

// Helper: Price Calculation
const getAppointmentPrice = (apt) => parseFloat(apt.price) || 0;

// Helper: Earnings Calculation
const calculateEarnings = (amount, percentage) => {
    const adminShare = (amount * percentage) / 100;
    const vendorNet = amount - adminShare;
    return {
        adminShare: parseFloat(adminShare.toFixed(2)),
        vendorNet: parseFloat(vendorNet.toFixed(2))
    };
};

// @route   GET /api/doctor-revenue/stats
router.get('/stats', doctorMiddleware, async (req, res) => {
    try {
        const doctorId = req.user._id;
        
        const settings = await CutoffSettings.findOne();
        const cutoffPercentage = settings?.doctorCutoff || 5;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const query = {
            $or: [
                { doctorId: doctorId.toString() },                 
                { doctorId: new mongoose.Types.ObjectId(doctorId) } 
            ],
            // status: { $in: ['7', 'completed', 'visited', 'checked'] } // Uncomment if needed
        };

        const appointments = await Appointment.find(query);

        let stats = {
            today: { revenue: 0, adminShare: 0, earning: 0, count: 0 },
            weekly: { revenue: 0, adminShare: 0, earning: 0, count: 0 },
            monthly: { revenue: 0, adminShare: 0, earning: 0, count: 0 },
            total: { revenue: 0, adminShare: 0, earning: 0, count: 0 }
        };

        appointments.forEach(apt => {
            const price = getAppointmentPrice(apt);
            const { adminShare, vendorNet } = calculateEarnings(price, cutoffPercentage);
            // Handle date fallback
            const date = new Date(apt.createdAt || apt.date); 

            stats.total.revenue += price;
            stats.total.adminShare += adminShare;
            stats.total.earning += vendorNet;
            stats.total.count += 1;

            if (date >= today) {
                stats.today.revenue += price;
                stats.today.adminShare += adminShare;
                stats.today.earning += vendorNet;
                stats.today.count += 1;
            }
            if (date >= startOfWeek) {
                stats.weekly.revenue += price;
                stats.weekly.adminShare += adminShare;
                stats.weekly.earning += vendorNet;
                stats.weekly.count += 1;
            }
            if (date >= startOfMonth) {
                stats.monthly.revenue += price;
                stats.monthly.adminShare += adminShare;
                stats.monthly.earning += vendorNet;
                stats.monthly.count += 1;
            }
        });

        const fmt = (obj) => ({
            revenue: parseFloat(obj.revenue.toFixed(2)),
            adminShare: parseFloat(obj.adminShare.toFixed(2)),
            earning: parseFloat(obj.earning.toFixed(2)),
            count: obj.count
        });

        res.json({
            success: true,
            message: "Doctor stats fetched",
            cutoffPercentage,
            data: {
                today: fmt(stats.today),
                weekly: fmt(stats.weekly),
                monthly: fmt(stats.monthly),
                total: fmt(stats.total)
            }
        });

    } catch (error) {
        console.error("Doctor Stats Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/doctor-revenue/orders
router.get('/orders', doctorMiddleware, async (req, res) => {
    try {
        const doctorId = req.user._id;
        const { page = 1, limit = 10 } = req.query;

        const settings = await CutoffSettings.findOne();
        const cutoffPercentage = settings?.doctorCutoff || 5;

        let query = { 
            $or: [
                { doctorId: doctorId.toString() },
                { doctorId: new mongoose.Types.ObjectId(doctorId) }
            ]
        };

        const skip = (page - 1) * limit;

        // ✅ UPDATED POPULATE: Prioritize Patient models
        const appointments = await Appointment.find(query)
            .populate('Patient', 'name phone age gender')   // Priority 1: Patient Model
            .populate('patientId', 'name phone age gender') // Priority 2: AddMember Model
            // .populate('userId', 'name') // Removed to prevent showing account holder name
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalOrders = await Appointment.countDocuments(query);

        const processedOrders = appointments.map(apt => {
            const price = getAppointmentPrice(apt);
            const { adminShare, vendorNet } = calculateEarnings(price, cutoffPercentage);

            // ✅ STRICT NAME LOGIC
            let patientName = "Unknown Patient";

            if (apt.Patient && apt.Patient.name) {
                patientName = apt.Patient.name;
            } else if (apt.patientId && apt.patientId.name) {
                patientName = apt.patientId.name;
            } else if (apt.name && apt.name.trim() !== "") {
                patientName = apt.name;
            }

            return {
                _id: apt._id,
                orderId: `DOC-${apt._id.toString().slice(-8)}`,
                customerName: patientName, // ✅ Now shows actual Patient Name
                createdAt: apt.createdAt || apt.date,
                status: apt.status,
                totalAmount: parseFloat(price.toFixed(2)),
                adminCommission: adminShare,
                yourEarning: vendorNet,
                cutoffPercentageUsed: cutoffPercentage
            };
        });

        res.json({
            success: true,
            message: "Doctor appointments fetched",
            pagination: {
                total: totalOrders,
                page: parseInt(page),
                pages: Math.ceil(totalOrders / limit)
            },
            currentCutoffPercentage: cutoffPercentage,
            data: processedOrders
        });

    } catch (error) {
        console.error("Doctor Orders Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;