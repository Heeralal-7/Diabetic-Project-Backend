//medicine.js
const Medicine = require("../../../../modal/MedicineSchema");
const Service = require("../../../../modal/VendorMedicine");
const PharmacyMedicine = require("../../../../modal/VendorMedicine");
const vendor = require("../../../../modal/vandor");
const fs = require("fs");
const ExcelJS = require('exceljs');
const mongoose = require("mongoose");
 
 
// Upload Excel and save to DB
 
// Method: POST
// Endpoint: /admin-medicine/upload-medicine-excel
const uploadMedicineExcel = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: 0, message: 'No file uploaded' });
      }
  
      // 1) Stream reader
      const stream = fs.createReadStream(req.file.path);
      const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(stream);
  
      const batchSize = 1000;
      let batch = [];
      let headers = [];
  
      // 2) Read sheet-by-sheet and row-by-row
      for await (const worksheetReader of workbookReader) {
        for await (const row of worksheetReader) {
          const cells = row.values.slice(1); // first value is null
  
          if (row.number === 1) {
            headers = cells.map(h => String(h).trim());
          } else {
            const obj = {};
            headers.forEach((h, i) => {
               if (h === 'image_url' && cells[i]) {
                // Split the string by a comma to create an array of URLs
                // .map(url => url.trim()) ensures any extra spaces are removed
                obj[h] = String(cells[i]).split(',').map(url => url.trim());
              } else {
                obj[h] = cells[i] != null ? cells[i] : "";
              }
            });
            batch.push(obj);
          }
  
          // 3) जब batch पूरा हो जाए, insert कर दो
          if (batch.length >= batchSize) {
            await Medicine.insertMany(batch);
            batch = [];
          }
        }
      }
  
      // 4) आखिरी बैच बचा हो तो डाल दो
      if (batch.length > 0) {
        await Medicine.insertMany(batch);
      }
  
      // 5) Process हो जाने के बाद फ़ाइल delete कर दो
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('File delete error:', err);
      });
  
      res.status(200).json({ success: 1, message: 'Excel uploaded and data saved successfully' });
    }
    catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ success: 0, message: 'Something went wrong', error: err.message });
    }
  };
  
 
// Get all medicine data
// Method: GET
// Endpoint: /admin-medicine/get-all-medicine
const getAllMedicineData = async (req, res) => {
    try {
      const medicines = await Medicine.find({});
      const totalCount = medicines.length;
  
      res.send({
        success: 1,
        message: "All medicine data",
        totalCount,
        details: medicines
      });
    } catch (err) {
      res.status(500).send({ success: 0, message: err.message });
    }
  };
 
 
// Admin: Update medicine details
// Method: PUT
// Endpoint: /admin-medicine/update-medicine
const updateMedicine = async (req, res) => {
  try {
    const { Id } = req.query;
    const updateData = req.body;
 
    if (!Id) {
      return res.status(400).send({
        success: 0,
        message: "Id is required",
      });
    }
 
    let updatedMedicine;
 
    // If it's a valid MongoDB ObjectId, search by _id
    if (mongoose.Types.ObjectId.isValid(Id)) {
      updatedMedicine = await Medicine.findByIdAndUpdate(
        Id,
        updateData,
        { new: true, runValidators: true }
      );
    }
    
    // Otherwise, search by custom "Id" field
    if (!updatedMedicine) {
      updatedMedicine = await Medicine.findOneAndUpdate(
        { Id: Id },
        updateData,
        { new: true, runValidators: true }
      );
    }
 
    if (!updatedMedicine) {
      return res.status(404).send({
        success: 0,
        message: "Medicine not found",
      });
    }
 
    return res.send({
      success: 1,
      message: "Medicine updated successfully",
      details: updatedMedicine,
    });
  } catch (error) {
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};
 
 
  // Admin: Get pending approval medicines
// Method: GET
// Endpoint: /admin-medicine/pending-medicine/:id
 
const getPendingMedicines = async (req,res)=>{
  try {
    const data = await PharmacyMedicine.find({onStatus:"0"})
    return res.send({
      success:1,
      message:"fetch succesfully",
      details:data
    })
  } catch (error) {
    return res.send({
      success:0,
      message:error.message
    })
  }
}
 
 
// Admin: Approve a medicine
// Method: patch
// Endpoint: /admin-medicine/approve-medicine/:id
 
const approveMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Approving Medicine ID:", id);
 
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({
        success: 0,
        message: "Invalid ID format",
      });
    }
 
    const updated = await PharmacyMedicine.findByIdAndUpdate(
      id,
      { onStatus: "1" },
      { new: true }
    );
 
    if (!updated) {
      console.log("Medicine not found in DB");
      return res.status(404).send({
        success: 0,
        message: "Medicine not found",
      });
    }
 
    return res.send({
      success: 1,
      message: "Medicine approved successfully",
      details: updated,
    });
  } catch (error) {
    console.log("Error:", error.message);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};
 
 
// Admin: Reject a medicine
// Method: patch
// Endpoint: /admin-medicine/reject-medicine/:id
const rejectMedicine = async (req, res) => {
  try {
    const { id } = req.params;
 
    const updated = await PharmacyMedicine.findByIdAndUpdate(
      id,
      { onStatus: "2" },
      { new: true }
    );
 
    if (!updated) {
      return res.status(404).send({
        success: 0,
        message: "Medicine not found",
      });
    }
 
    return res.send({
      success: 1,
      message: "Medicine rejected successfully",
      details: updated,
    });
  } catch (error) {
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};
 
 
 // Admin: Delete a medicine
// Method: DELETE
// Endpoint: /admin-medicine/delete-medicine/:id
const deleteMedicine = async (req, res) => {
    try {
      const { id } = req.params;
  
      const deleted = await Medicine.findByIdAndDelete(id);
  
      if (!deleted) {
        return res.status(404).send({
          success: 0,
          message: "Medicine not found",
        });
      }
  
      return res.send({
        success: 1,
        message: "Medicine deleted successfully",
      });
    } catch (error) {
      return res.status(500).send({
        success: 0,
        message: error.message,
      });
    }
  };

  
// Admin: Delete multiple medicines
// Method: DELETE
// Endpoint: /admin-medicine/delete-multiple-medicine
const deleteMultipleMedicine = async (req, res) => {
    try {
      const { ids } = req.body;
  
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).send({
          success: 0,
          message: "Please provide an array of medicine IDs to delete.",
        });
      }
  
      const result = await Medicine.deleteMany({
        _id: { $in: ids },
      });
  
      if (result.deletedCount === 0) {
        return res.status(404).send({
          success: 0,
          message: "No medicines found with the provided IDs.",
        });
      }
  
      return res.send({
        success: 1,
        message: `${result.deletedCount} medicines deleted successfully.`,
      });
    } catch (error) {
      return res.status(500).send({
        success: 0,
        message: error.message,
      });
    }
  };

 
 
module.exports = { uploadMedicineExcel, getAllMedicineData ,
  getPendingMedicines,
  approveMedicine,
  rejectMedicine,
  updateMedicine,
  deleteMedicine,
  deleteMultipleMedicine
};
 
 