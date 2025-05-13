const Qualification = require("../../../modal/Qualification")
const Docter = require("../../../modal/docter");


// Create qualififcation
// Method:Post
// EndPoint:/create
const qualification = async(req,res)=>{
try {
       const {qualification} = req.body
       if(!qualification){
        return res.send({
            success:0,
            message:'All fields are required'
        })
       }
    
       const doctor = await Qualification.create({
        qualification
       }) 
    
       return res.send({
        success:1,
        message:'Qualification created sucessfully'
       })
} catch (error) {
    return res.send({
        success:0,
        message:error.message
    })
}

}



const getDoctorStats = async (req, res) => {
    try {
      const currentDate = new Date();
  
      const months = Array.from({ length: 12 }, (_, i) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        return {
          year: date.getFullYear(),
          month: date.getMonth() + 1, 
        };
      }).reverse(); 
  
      const doctorStats = await Docter.aggregate([
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
  
      const stats = months.map(({ year, month }) => {
        const stat = doctorStats.find(
          (d) => d._id.year === year && d._id.month === month
        );
        return {
          year,
          month,
          count: stat ? stat.count : 0, 
        };
      });
  
      return res.send({
        success: 1,
        message: "Monthly doctor registration stats",
        details: stats,
      });
    } catch (error) {
      return res.send({
        success: 0,
        message: error.message,
      });
    }
  };
  

module.exports = {qualification,getDoctorStats}