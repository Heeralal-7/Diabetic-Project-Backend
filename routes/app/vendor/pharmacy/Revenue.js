// routes/pharmacy/revenue.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Models
const OrderPharmacy = require('../../../../modal/OrderPharmacy');
const CutoffSettings = require('../../../../modal/CutoffSettings');

// Middleware (Change this import to your specific Pharmacy Middleware if needed)
const { VendorMiddleware } = require('../../../../middleware/auth'); 

// ✅ HELPER: Earnings Calculation
const calculateEarnings = (amount, percentage) => {
    const adminShare = (amount * percentage) / 100;
    const vendorNet = amount - adminShare;
    return {
        adminShare: parseFloat(adminShare.toFixed(2)),
        vendorNet: parseFloat(vendorNet.toFixed(2))
    };
};

// @route   GET /api/pharmacy/revenue/stats
router.get('/stats', VendorMiddleware, async (req, res) => {
    try {
        const vendorId = req.user._id;
        console.log("Pharmacy Stats Request for:", vendorId);

        // 1. Get Cutoff Settings
        const settings = await CutoffSettings.findOne();
        const cutoffPercentage = settings?.pharmacyCutoff || 5; // ✅ Pharmacy Cutoff

        // 2. Dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // 3. Query (Matches Admin Logic)
        // Pharmacy stores vendorId inside 'items' array
        const query = {
            'items.vendorId': { 
                $in: [vendorId.toString(), new mongoose.Types.ObjectId(vendorId)] 
            },
            // ✅ Correct Status for Pharmacy
        };

        const orders = await OrderPharmacy.find(query);
        console.log(`Found ${orders.length} pharmacy orders.`);

        // 4. Calculate Stats
        let stats = {
            today: { revenue: 0, adminShare: 0, earning: 0, count: 0 },
            weekly: { revenue: 0, adminShare: 0, earning: 0, count: 0 },
            monthly: { revenue: 0, adminShare: 0, earning: 0, count: 0 },
            total: { revenue: 0, adminShare: 0, earning: 0, count: 0 }
        };

        orders.forEach(order => {
            // ✅ Price Logic: GrandTotal or SubTotal
            const price = parseFloat(order.grandTotal) || parseFloat(order.subTotal) || 0;
            
            const { adminShare, vendorNet } = calculateEarnings(price, cutoffPercentage);
            const orderDate = new Date(order.createdAt);

            // Update Total
            stats.total.revenue += price;
            stats.total.adminShare += adminShare;
            stats.total.earning += vendorNet;
            stats.total.count += 1;

            // Update Period Stats
            if (orderDate >= today) {
                stats.today.revenue += price;
                stats.today.adminShare += adminShare;
                stats.today.earning += vendorNet;
                stats.today.count += 1;
            }
            if (orderDate >= startOfWeek) {
                stats.weekly.revenue += price;
                stats.weekly.adminShare += adminShare;
                stats.weekly.earning += vendorNet;
                stats.weekly.count += 1;
            }
            if (orderDate >= startOfMonth) {
                stats.monthly.revenue += price;
                stats.monthly.adminShare += adminShare;
                stats.monthly.earning += vendorNet;
                stats.monthly.count += 1;
            }
        });

        const formatStats = (obj) => ({
            revenue: parseFloat(obj.revenue.toFixed(2)),
            adminShare: parseFloat(obj.adminShare.toFixed(2)),
            earning: parseFloat(obj.earning.toFixed(2)),
            count: obj.count
        });

        res.json({
            success: true,
            message: "Pharmacy stats fetched",
            cutoffPercentage,
            data: {
                today: formatStats(stats.today),
                weekly: formatStats(stats.weekly),
                monthly: formatStats(stats.monthly),
                total: formatStats(stats.total)
            }
        });

    } catch (error) {
        console.error("Pharmacy Stats Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/pharmacy/revenue/orders
router.get('/orders', VendorMiddleware, async (req, res) => {
    try {
        const vendorId = req.user._id;
        const { page = 1, limit = 10, startDate, endDate } = req.query;

        const settings = await CutoffSettings.findOne();
        const cutoffPercentage = settings?.pharmacyCutoff || 5;

        let query = { 
            'items.vendorId': { 
                $in: [vendorId.toString(), new mongoose.Types.ObjectId(vendorId)] 
            },
           
        };

        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate + 'T23:59:59.999Z')
            };
        }

        const skip = (page - 1) * limit;

        const orders = await OrderPharmacy.find(query)
            .populate('userId', 'name phone')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalOrders = await OrderPharmacy.countDocuments(query);

        const processedOrders = orders.map(order => {
            const price = parseFloat(order.grandTotal) || parseFloat(order.subTotal) || 0;
            const { adminShare, vendorNet } = calculateEarnings(price, cutoffPercentage);

            return {
                _id: order._id,
                orderId: `PHARM-${order._id.toString().slice(-8)}`,
                customerName: order.userId?.name || 'Guest',
                createdAt: order.createdAt,
                status: order.orderStatus, // Pharmacy uses orderStatus
                totalAmount: parseFloat(price.toFixed(2)),
                adminCommission: adminShare,
                yourEarning: vendorNet,
                cutoffPercentageUsed: cutoffPercentage
            };
        });

        res.json({
            success: true,
            message: "Pharmacy orders fetched",
            pagination: {
                total: totalOrders,
                page: parseInt(page),
                pages: Math.ceil(totalOrders / limit)
            },
            currentCutoffPercentage: cutoffPercentage,
            data: processedOrders
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;