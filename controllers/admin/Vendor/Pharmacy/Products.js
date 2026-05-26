const PharmacyProduct = require("../../../../modal/PharmacyProducts"); // Update path as needed
const fs = require("fs");
const ExcelJS = require('exceljs');
const mongoose = require("mongoose");
 
// Upload Excel and save to DB
// Method: POST
// Endpoint: /upload-excel-hospital/upload-product-excel
const uploadProductExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: 0, message: 'No file uploaded' });
    }
 
    const stream = fs.createReadStream(req.file.path);
    const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(stream);
 
    const batchSize = 1000;
    let batch = [];
    let headers = [];
 
    for await (const worksheetReader of workbookReader) {
      for await (const row of worksheetReader) {
        const cells = row.values.slice(1); // remove first null value
 
        if (row.number === 1) {
          headers = cells.map(h => String(h).trim());
        } else {
          const obj = {};
          headers.forEach((h, i) => {
             if (h === 'image_url' && cells[i]) {
              // Split the comma-separated string into an array of URLs
              // .map(url => url.trim()) removes any extra spaces around the URLs
              obj[h] = String(cells[i]).split(',').map(url => url.trim());
            } else {
              // For all other columns, use the original logic
              obj[h] = cells[i] != null ? cells[i] : "";
            }
          });
          batch.push(obj);
        }
 
        if (batch.length >= batchSize) {
          await PharmacyProduct.insertMany(batch);
          batch = [];
        }
      }
    }
 
    if (batch.length > 0) {
      await PharmacyProduct.insertMany(batch);
    }
 
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('File delete error:', err);
    });
 
    res.status(200).json({ success: 1, message: 'Excel uploaded and product data saved successfully' });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: 0, message: 'Something went wrong', error: err.message });
  }
};
 
// Get Product Data (Excluding Approved & No Status)
// Method: GET
// Endpoint: /upload-excel-hospital/get-all-product
const getAllProductData = async (req, res) => {
  try {
       
    const products = await PharmacyProduct.find({
        onStatus: { $nin: [0, "", null] }
    })
    .sort({ createdAt: -1 }); // Newest first
 
    const totalCount = products.length;
 
    res.send({
      success: 1,
      message: "Filtered product data (No Approved, No Empty Status)",
      totalCount,
      details: products
    });
  } catch (err) {
    res.status(500).send({ success: 0, message: err.message });
  }
};
 
// Update Product Status (Approve/Reject) for Admin
// Method: PUT
// Endpoint: /upload-excel-hospital/update-product-status
const updateProductStatus = async (req, res) => {
  try {
    // 1. Request Body se data lena
    const { productId, onStatus } = req.body;
 
    // 2. Validation: Check karein data aaya ya nahi
    if (!productId) {
      return res.status(400).send({
          success: 0,
          message: "Product ID (productId) is required."
      });
    }
 
    // Check onStatus validation (0 ya 1 hona chahiye)
    // Hum loose equality (==) use kar rahe hain taaki string "0" ya number 0 dono chalein
    if (onStatus == undefined || (onStatus != 0 && onStatus != 1)) {
        return res.status(400).send({
            success: 0,
            message: "Invalid status. Send 0 for Approve, 1 for Reject."
        });
    }
 
    // 3. Status Action define karna (Log purpose ke liye)
    // Note: User logic -> 0 = Approve, 1 = Reject
    const action = onStatus == 0 ? "Approved" : "Rejected";
 
    // 4. Database Update
    const updatedProduct = await PharmacyProduct.findByIdAndUpdate(
      productId,
      {
          onStatus: onStatus
      },
      { new: true } // Update hone ke baad wala data return karega
    );
 
    // 5. Agar product nahi mila
    if (!updatedProduct) {
      return res.status(404).send({
          success: 0,
          message: "Product not found."
      });
    }
 
    // 6. Success Response
    res.send({
      success: 1,
      message: `Product successfully ${action} (Status: ${onStatus})`,
      data: updatedProduct
    });
 
  } catch (err) {
    // Error Handling
    console.error("Update Status Error:", err);
    res.status(500).send({ success: 0, message: err.message });
  }
};
 

// Admin: Update a single product
// Method: PUT
// Endpoint: /upload-excel-hospital/update-product/:id
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send({ success: 0, message: "Invalid product ID format." });
        }

        const updatedProduct = await PharmacyProduct.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true } // Return the updated document and run schema validators
        );

        if (!updatedProduct) {
            return res.status(404).send({ success: 0, message: "Product not found." });
        }

        return res.send({ success: 1, message: "Product updated successfully.", details: updatedProduct });

    } catch (error) {
        // Handle potential validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).send({ success: 0, message: "Validation failed.", error: error.message });
        }
        return res.status(500).send({ success: 0, message: "An error occurred while updating the product.", error: error.message });
    }
};

// --- NEW ---
// Admin: Delete a single product
// Method: DELETE
// Endpoint: /upload-excel-hospital/delete-product/:id
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send({ success: 0, message: "Invalid product ID format." });
        }

        const deletedProduct = await PharmacyProduct.findByIdAndDelete(id);

        if (!deletedProduct) {
            return res.status(404).send({ success: 0, message: "Product not found." });
        }

        return res.send({ success: 1, message: "Product deleted successfully." });

    } catch (error) {
        return res.status(500).send({ success: 0, message: error.message });
    }
};


// --- NEW ---
// Admin: Delete multiple products
// Method: DELETE
// Endpoint: /upload-excel-hospital/delete-multiple-products
const deleteMultipleProducts = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).send({ success: 0, message: "Please provide an array of product IDs to delete." });
        }

        const result = await PharmacyProduct.deleteMany({
            _id: { $in: ids },
        });

        if (result.deletedCount === 0) {
            return res.status(404).send({ success: 0, message: "No products found with the provided IDs." });
        }

        return res.send({ success: 1, message: `${result.deletedCount} products deleted successfully.` });

    } catch (error) {
        return res.status(500).send({ success: 0, message: error.message });
    }
};
 
module.exports = { uploadProductExcel, getAllProductData,updateProduct,updateProductStatus, deleteProduct, deleteMultipleProducts };
 
 