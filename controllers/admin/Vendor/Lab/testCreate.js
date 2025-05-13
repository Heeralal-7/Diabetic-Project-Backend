const Testcreate = require('../../../../modal/testCreate')
const Adminlogin = require('../../../../modal/adminlogin')


// Create test 
// Method:Post
// EndPoint:/admin-test/create
const testCreate = async (req, res) => {
    try {
        const { name, category } = req.body
        if (!name || !category) {
            return res.send({
                success: 0,
                message: 'All fields are required'
            })
        }

        const admin = await Adminlogin.findById(req.user._id)
        if(!admin){
            return res.send({
                success:0,
                message:"admin is not authenticated"
            })
        }
        const create = await Testcreate.create({
            name,
            category
        })

        return res.send({
            success: 1,
            message: "Created",
        })
    } catch (error) {
        return res.send({
            message: error.message,
            success: 0
        })
    }
}



module.exports = { testCreate }