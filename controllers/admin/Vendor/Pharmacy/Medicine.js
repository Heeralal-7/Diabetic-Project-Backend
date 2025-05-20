const Medicine = require("../../../../modal/MedicineSchema"); // Update path if needed
const fs = require("fs");
const ExcelJS = require('exceljs');
 
 
// Upload Excel and save to DB
 
// Method: POST
// Endpoint: /upload-excel/upload-medicine-excel
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
              obj[h] = cells[i] != null ? cells[i] : "";
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
// Endpoint: /upload-excel/get-all-medicine
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
module.exports = { uploadMedicineExcel, getAllMedicineData };
 
 