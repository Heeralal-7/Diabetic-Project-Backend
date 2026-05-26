// routes/clinic/revenue.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Appointment = require('../../../modal/Appointment');
const CutoffSettings = require('../../../modal/CutoffSettings');
// Make sure AddMember and Patient models are registered in Mongoose
// const AddMember = require('../../../modal/AddMember'); // Uncomment if needed
const { ClinicMiddleware } = require('../../../middleware/auth'); 

const getAppointmentPrice = (apt) => parseFloat(apt.price) || 0;

const calculateEarnings = (amount, percentage) => {
    const adminShare = (amount * percentage) / 100;
    const vendorNet = amount - adminShare;
    return {
        adminShare: parseFloat(adminShare.toFixed(2)),
        vendorNet: parseFloat(vendorNet.toFixed(2))
    };
};

// @route   GET /api/clinic-revenue/stats
router.get('/stats', ClinicMiddleware, async (req, res) => {
    try {
        const clinicId = req.user._id;
        
        const settings = await CutoffSettings.findOne();
        const cutoffPercentage = settings?.clinicCutoff || 5;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const query = {
            $or: [
                { clinicId: clinicId.toString() },                 
                { clinicId: new mongoose.Types.ObjectId(clinicId) } 
            ]
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
            message: "Clinic stats fetched",
            cutoffPercentage,
            data: {
                today: fmt(stats.today),
                weekly: fmt(stats.weekly),
                monthly: fmt(stats.monthly),
                total: fmt(stats.total)
            }
        });

    } catch (error) {
        console.error("Clinic Stats Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/clinic-revenue/orders
router.get('/orders', ClinicMiddleware, async (req, res) => {
    try {
        const clinicId = req.user._id;
        const { page = 1, limit = 10 } = req.query;

        const settings = await CutoffSettings.findOne();
        const cutoffPercentage = settings?.clinicCutoff || 5;

        let query = { 
            $or: [
                { clinicId: clinicId.toString() },
                { clinicId: new mongoose.Types.ObjectId(clinicId) }
            ]
        };

        const skip = (page - 1) * limit;

        // ✅ IMPORTANT: Aapke schema mein 'patientId' ka ref 'AddMember' hai.
        // Hum 'patientId' ko populate kar rahe hain taaki naam mile.
        const appointments = await Appointment.find(query)
            .populate('patientId', 'name phone age gender') // Priority 1: AddMember Schema
            .populate('Patient', 'name phone age gender')   // Priority 2: Patient Schema
            .populate('doctorId', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalOrders = await Appointment.countDocuments(query);

        const processedOrders = appointments.map(apt => {
            const price = getAppointmentPrice(apt);
            const { adminShare, vendorNet } = calculateEarnings(price, cutoffPercentage);

            // ✅ STRICT NAME LOGIC: No User Name Fallback
            let patientName = "Unknown Patient";

            if (apt.patientId && apt.patientId.name) {
                // Agar patientId (AddMember) mein naam hai
                patientName = apt.patientId.name;
            } 
            else if (apt.Patient && apt.Patient.name) {
                // Agar Patient (Patient Model) mein naam hai
                patientName = apt.Patient.name;
            }
            else if (apt.name && apt.name.trim() !== "") {
                // Agar direct name string saved hai
                patientName = apt.name;
            }
            
            // Maine yahan se userId ka fallback hata diya hai. 
            // Ab agar patient ka naam nahi mila to "Unknown Patient" hi dikhega.

            return {
                _id: apt._id,
                orderId: `CLN-${apt._id.toString().slice(-8)}`,
                customerName: patientName, 
                doctorName: apt.doctorId?.name || 'Assigned Doctor',
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
            message: "Clinic appointments fetched",
            pagination: {
                total: totalOrders,
                page: parseInt(page),
                pages: Math.ceil(totalOrders / limit)
            },
            currentCutoffPercentage: cutoffPercentage,
            data: processedOrders
        });

    } catch (error) {
        console.error("Clinic Orders Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;