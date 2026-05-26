const Testcreate = require('../../../../modal/testCreate')
const SubAdmin = require('../../../../modal/subAdmin')

// ✅ CREATE TEST - WITH LAB PERMISSIONS
// Method: POST
// EndPoint: /subadmin/vendor/labtest/create
const testCreate = async (req, res) => {
    try {
        const { name, category } = req.body
        
        if (!name || !category) {
            return res.status(400).send({
                success: 0,
                message: 'All fields are required'
            })
        }

        // ✅ CHECK SUBADMIN AUTHENTICATION
        const subAdmin = req.subAdmin;
        if (!subAdmin) {
            return res.status(401).send({
                success: 0,
                message: "Sub-admin not authenticated"
            })
        }

        // ✅ CHECK LAB CREATE PERMISSION FOR TESTS
        if (!subAdmin.permissions?.vendors?.lab?.create) {
            return res.status(403).send({
                success: 0,
                message: "No permission to create tests (Lab create permission required)"
            })
        }

        // ✅ CREATE TEST WITH SUBADMIN REFERENCE
        const create = await Testcreate.create({
            name,
            category,
            createdBy: {
                type: 'SubAdmin',
                id: subAdmin._id,
                name: subAdmin.name
            },
            locationAccess: subAdmin.locationAccess // Store location access for filtering
        })

        return res.status(201).send({
            success: 1,
            message: "Test created successfully",
            data: create
        })
    } catch (error) {
        console.error('Test creation error:', error);
        return res.status(500).send({
            message: error.message,
            success: 0
        })
    }
}

// ✅ GET ALL TESTS - WITH LAB PERMISSIONS
// Method: GET
// EndPoint: /subadmin/vendor/labtest/all
const getAllTests = async (req, res) => {
    try {
        const subAdmin = req.subAdmin;
        
        if (!subAdmin) {
            return res.status(401).send({
                success: 0,
                message: "Sub-admin not authenticated"
            })
        }

        // ✅ CHECK LAB VIEW PERMISSION FOR TESTS
        if (!subAdmin.permissions?.vendors?.lab?.view) {
            return res.status(403).send({
                success: 0,
                message: "No permission to view tests (Lab view permission required)"
            })
        }

        const { 
            page = 1, 
            limit = 10, 
            search = "",
            category = "",
            sortBy = "createdAt",
            sortOrder = "desc"
        } = req.query;

        // ✅ BUILD QUERY WITH LOCATION FILTERING
        let query = {};

        // Add search filter
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { category: { $regex: search, $options: "i" } }
            ];
        }

        // Add category filter
        if (category) {
            query.category = category;
        }

        // ✅ SORTING
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

        // ✅ PAGINATION
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // ✅ GET TESTS WITH PAGINATION
        const tests = await Testcreate.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum)
            .lean();

        // ✅ GET TOTAL COUNTS
        const totalTests = await Testcreate.countDocuments(query);

        // ✅ GET CATEGORY STATS
        const categories = await Testcreate.distinct('category', query);
        const categoryStats = await Testcreate.aggregate([
            { $match: query },
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        return res.send({
            success: 1,
            message: "Tests fetched successfully",
            data: {
                tests,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(totalTests / limitNum),
                    totalTests,
                    hasNext: pageNum < Math.ceil(totalTests / limitNum),
                    hasPrev: pageNum > 1
                },
                stats: {
                    total: totalTests,
                    categories: categories.length,
                    categoryStats
                },
                permissions: {
                    view: subAdmin.permissions.vendors?.lab?.view || false,
                    create: subAdmin.permissions.vendors?.lab?.create || false,
                    edit: subAdmin.permissions.vendors?.lab?.edit || false,
                    delete: subAdmin.permissions.vendors?.lab?.delete || false
                }
            }
        });

    } catch (error) {
        console.error('Get tests error:', error);
        return res.status(500).send({
            success: 0,
            message: error.message,
        });
    }
}

// ✅ GET SINGLE TEST - WITH LAB PERMISSIONS
// Method: GET
// EndPoint: /subadmin/vendor/labtest/:id
const getTestById = async (req, res) => {
    try {
        const subAdmin = req.subAdmin;
        const { id } = req.params;

        if (!subAdmin) {
            return res.status(401).send({
                success: 0,
                message: "Sub-admin not authenticated"
            })
        }

        // ✅ CHECK LAB VIEW PERMISSION FOR TESTS
        if (!subAdmin.permissions?.vendors?.lab?.view) {
            return res.status(403).send({
                success: 0,
                message: "No permission to view tests (Lab view permission required)"
            })
        }

        const test = await Testcreate.findById(id);

        if (!test) {
            return res.status(404).send({
                success: 0,
                message: "Test not found"
            })
        }

        return res.send({
            success: 1,
            message: "Test fetched successfully",
            data: test
        });

    } catch (error) {
        console.error('Get test by ID error:', error);
        return res.status(500).send({
            success: 0,
            message: error.message,
        });
    }
}

// ✅ UPDATE TEST - WITH LAB PERMISSIONS
// Method: PUT
// EndPoint: /subadmin/vendor/labtest/update/:id
const updateTest = async (req, res) => {
    try {
        const subAdmin = req.subAdmin;
        const { id } = req.params;
        const { name, category } = req.body;

        if (!subAdmin) {
            return res.status(401).send({
                success: 0,
                message: "Sub-admin not authenticated"
            })
        }

        // ✅ CHECK LAB EDIT PERMISSION FOR TESTS
        if (!subAdmin.permissions?.vendors?.lab?.edit) {
            return res.status(403).send({
                success: 0,
                message: "No permission to edit tests (Lab edit permission required)"
            })
        }

        if (!name || !category) {
            return res.status(400).send({
                success: 0,
                message: 'All fields are required'
            })
        }

        const test = await Testcreate.findById(id);

        if (!test) {
            return res.status(404).send({
                success: 0,
                message: "Test not found"
            })
        }

        // ✅ UPDATE TEST
        const updatedTest = await Testcreate.findByIdAndUpdate(
            id,
            { name, category },
            { new: true, runValidators: true }
        );

        return res.send({
            success: 1,
            message: "Test updated successfully",
            data: updatedTest
        });

    } catch (error) {
        console.error('Update test error:', error);
        return res.status(500).send({
            success: 0,
            message: error.message,
        });
    }
}

// ✅ DELETE TEST - WITH LAB PERMISSIONS
// Method: DELETE
// EndPoint: /subadmin/vendor/labtest/delete/:id
const deleteTest = async (req, res) => {
    try {
        const subAdmin = req.subAdmin;
        const { id } = req.params;

        if (!subAdmin) {
            return res.status(401).send({
                success: 0,
                message: "Sub-admin not authenticated"
            })
        }

        // ✅ CHECK LAB DELETE PERMISSION FOR TESTS
        if (!subAdmin.permissions?.vendors?.lab?.delete) {
            return res.status(403).send({
                success: 0,
                message: "No permission to delete tests (Lab delete permission required)"
            })
        }

        const test = await Testcreate.findById(id);

        if (!test) {
            return res.status(404).send({
                success: 0,
                message: "Test not found"
            })
        }

        // ✅ DELETE TEST
        await Testcreate.findByIdAndDelete(id);

        return res.send({
            success: 1,
            message: "Test deleted successfully"
        });

    } catch (error) {
        console.error('Delete test error:', error);
        return res.status(500).send({
            success: 0,
            message: error.message,
        });
    }
}

// ✅ GET TEST STATISTICS - WITH LAB PERMISSIONS
// Method: GET
// EndPoint: /subadmin/vendor/labtest/stats
const getTestStats = async (req, res) => {
    try {
        const subAdmin = req.subAdmin;

        if (!subAdmin) {
            return res.status(401).send({
                success: 0,
                message: "Sub-admin not authenticated"
            })
        }

        // ✅ CHECK LAB VIEW PERMISSION FOR TESTS
        if (!subAdmin.permissions?.vendors?.lab?.view) {
            return res.status(403).send({
                success: 0,
                message: "No permission to view test statistics (Lab view permission required)"
            })
        }

        // ✅ BUILD QUERY
        let query = {};

        // ✅ GET STATISTICS
        const totalTests = await Testcreate.countDocuments(query);
        
        // Category statistics
        const categoryStats = await Testcreate.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Recent tests (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentTests = await Testcreate.countDocuments({ 
            createdAt: { $gte: sevenDaysAgo } 
        });

        // Monthly statistics for last 6 months
        const currentDate = new Date();
        const months = Array.from({ length: 6 }, (_, i) => {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            return {
                year: date.getFullYear(),
                month: date.getMonth() + 1,
                name: date.toLocaleString('default', { month: 'long', year: 'numeric' })
            };
        }).reverse();

        const monthlyStats = await Testcreate.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(currentDate.getFullYear(), currentDate.getMonth() - 5, 1)
                    }
                }
            },
            {
                $addFields: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" },
                },
            },
            {
                $group: {
                    _id: { year: "$year", month: "$month" },
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 },
            },
        ]);

        const formattedMonthlyStats = months.map(({ year, month, name }) => {
            const stat = monthlyStats.find(
                (item) => item._id.year === year && item._id.month === month
            );
            return {
                name,
                count: stat ? stat.count : 0,
            };
        });

        return res.send({
            success: 1,
            message: "Test statistics fetched successfully",
            data: {
                stats: {
                    total: totalTests,
                    recent: recentTests,
                    categories: categoryStats.length
                },
                categoryStats,
                monthlyStats: formattedMonthlyStats,
                permissions: {
                    view: subAdmin.permissions.vendors?.lab?.view || false,
                    create: subAdmin.permissions.vendors?.lab?.create || false,
                    edit: subAdmin.permissions.vendors?.lab?.edit || false,
                    delete: subAdmin.permissions.vendors?.lab?.delete || false
                }
            }
        });

    } catch (error) {
        console.error('Get test stats error:', error);
        return res.status(500).send({
            success: 0,
            message: error.message,
        });
    }
}

module.exports = {
    testCreate,
    getAllTests,
    getTestById,
    updateTest,
    deleteTest,
    getTestStats
}