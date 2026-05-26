// routes/vendor/revenue.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Models (Path verify kar lena)
const FoodOrder = require('../../../../modal/foodOrder');
const CutoffSettings = require('../../../../modal/CutoffSettings');
const { VendorMiddleware } = require('../../../../middleware/auth'); 

// Helper: Price Calculation
const getOrderPrice = (order) => {
    return parseFloat(order.price) || 
           order.items?.reduce((itemSum, item) => 
             itemSum + (parseFloat(item.finalprice) || parseFloat(item.price) || 0), 0) || 0;
};

// Helper: Earnings Calculation
const calculateEarnings = (amount, percentage) => {
    const adminShare = (amount * percentage) / 100;
    const vendorNet = amount - adminShare;
    return {
        adminShare: parseFloat(adminShare.toFixed(2)),
        vendorNet: parseFloat(vendorNet.toFixed(2))
    };
};

// @route   GET /api/vendor/revenue/stats
router.get('/stats', VendorMiddleware, async (req, res) => {
    try {
        const vendorId = req.user._id;
        console.log("---------------- DEBUG START ----------------");
        console.log("1. Request Vendor ID:", vendorId);

        // Cutoff Settings
        const settings = await CutoffSettings.findOne();
        const cutoffPercentage = settings?.foodCutoff || 5;

        // Dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // ✅ DEBUG STEP 1: Bina kisi filter ke check karo ki DB mein koi order hai bhi ya nahi
        // (Just to check connection and schema)
        const randomOrder = await FoodOrder.findOne();
        if (randomOrder) {
            console.log("2. Sample Order from DB (Any Vendor):");
            console.log("   - ID:", randomOrder._id);
            console.log("   - VendorId Field Value:", randomOrder.vendorId);
            console.log("   - VendorId Type:", typeof randomOrder.vendorId);
            console.log("   - Status:", randomOrder.status);
        } else {
            console.log("2. ❌ DB is completely EMPTY. No FoodOrders found.");
        }

        // ✅ DEBUG STEP 2: Sirf Vendor ID se dhoondo (Status mat check karo abhi)
        const queryWithoutStatus = {
            $or: [
                { vendorId: vendorId.toString() },                 
                { vendorId: new mongoose.Types.ObjectId(vendorId) } 
            ]
        };

        const allVendorOrders = await FoodOrder.find(queryWithoutStatus);
        console.log(`3. Orders found for THIS Vendor (Any Status): ${allVendorOrders.length}`);

        if (allVendorOrders.length > 0) {
            console.log("   - First Order Status found:", allVendorOrders[0].status);
            console.log("   - First Order Price:", getOrderPrice(allVendorOrders[0]));
        }

        // ✅ FINAL QUERY (Agar upar orders mile, to hum status filter wapas laga denge baad mein)
        // Abhi ke liye maine STATUS filter HATA diya hai taaki aapko result dikhe.
        
        const orders = allVendorOrders; // Using all orders for now to show data

        // Calculate Stats
        let stats = {
            today: { revenue: 0, adminShare: 0, earning: 0, count: 0 },
            weekly: { revenue: 0, adminShare: 0, earning: 0, count: 0 },
            monthly: { revenue: 0, adminShare: 0, earning: 0, count: 0 },
            total: { revenue: 0, adminShare: 0, earning: 0, count: 0 }
        };

        orders.forEach(order => {
            // Note: Agar aap sirf completed orders ka revenue chahte hain to if condition lagayein
            // if (!['5', '7', 'completed', 'delivered'].includes(order.status)) return;

            const price = getOrderPrice(order);
            const { adminShare, vendorNet } = calculateEarnings(price, cutoffPercentage);
            const orderDate = new Date(order.createdAt);

            // Update Total
            stats.total.revenue += price;
            stats.total.adminShare += adminShare;
            stats.total.earning += vendorNet;
            stats.total.count += 1;

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

        console.log("---------------- DEBUG END ----------------");

        res.json({
            success: true,
            message: "Vendor revenue stats fetched (Debug Mode: Status Filter Removed)",
            cutoffPercentage: cutoffPercentage,
            debugInfo: {
                totalFound: orders.length,
                statusOfFirstOrder: orders.length > 0 ? orders[0].status : "N/A"
            },
            data: {
                today: formatStats(stats.today),
                weekly: formatStats(stats.weekly),
                monthly: formatStats(stats.monthly),
                total: formatStats(stats.total)
            }
        });

    } catch (error) {
        console.error("Vendor Stats Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/vendor/revenue/orders
router.get('/orders', VendorMiddleware, async (req, res) => {
    try {
        const vendorId = req.user._id;
        const { page = 1, limit = 10 } = req.query;

        const settings = await CutoffSettings.findOne();
        const cutoffPercentage = settings?.foodCutoff || 5;

        // ✅ DEBUG MODE: Status filter removed
        let query = { 
            $or: [
                { vendorId: vendorId.toString() },
                { vendorId: new mongoose.Types.ObjectId(vendorId) }
            ]
            // status check removed temporarly
        };

        const skip = (page - 1) * limit;

        const orders = await FoodOrder.find(query)
            .populate('userId', 'name phone')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalOrders = await FoodOrder.countDocuments(query);

        const processedOrders = orders.map(order => {
            const price = getOrderPrice(order);
            const { adminShare, vendorNet } = calculateEarnings(price, cutoffPercentage);

            return {
                _id: order._id,
                orderId: `FOOD-${order._id.toString().slice(-8)}`,
                customerName: order.userId?.name || 'Guest',
                createdAt: order.createdAt,
                status: order.status, // Is field ko check karein response mein
                totalAmount: parseFloat(price.toFixed(2)),
                adminCommission: adminShare,
                yourEarning: vendorNet,
                cutoffPercentageUsed: cutoffPercentage
            };
        });

        res.json({
            success: true,
            message: "Orders fetched (Debug Mode)",
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