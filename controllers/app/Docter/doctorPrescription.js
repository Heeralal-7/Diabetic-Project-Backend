const doctorPrescription = require("../../../modal/DoctorPrescription");
const Service = require("../../../modal/addServices");
const Medicine = require("../../../modal/MedicineSchema");
const PharmacyMedicine = require("../../../modal/VendorMedicine");
const Appointment = require("../../../modal/Appointment");
const Prescription = require("../../../modal/DoctorPrescription");
const Doctor = require("../../../modal/docter");
const User = require("../../../modal/user");
const InsuranceModel = require("../../../modal/AddInsurance");

const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit"); // Kept if you use it elsewhere, though pdfmake is used below
const PdfPrinter = require("pdfmake");
const QRCode = require("qrcode");

// ==========================================
// CONFIGURATION & SETUP
// ==========================================

const projectRoot = process.cwd(); 

// 1. Setup Font Directory (Ensure this matches your folder name 'Docter' vs 'Doctor')
const fontsDir = path.join(
  projectRoot,
  "controllers",
  "app",
  "Docter", 
  "fonts"
);

// Ensure fonts directory exists to prevent immediate crash
if (!fs.existsSync(fontsDir)) {
  console.warn("⚠️  WARNING: Font directory not found at:", fontsDir);
  // Optional: Create it if it doesn't exist
  fs.mkdirSync(fontsDir, { recursive: true });
}

// 2. Configure Fonts for PdfMake
const fonts = {
  Roboto: {
    normal: path.join(fontsDir, "Roboto-Regular.ttf"),
    bold: path.join(fontsDir, "Roboto-Medium.ttf"),
    italics: path.join(fontsDir, "Roboto-Italic.ttf"),
    bolditalics: path.join(fontsDir, "Roboto-MediumItalic.ttf"),
  }
};

// Initialize Printer Safely
let printer;
try {
  printer = new PdfPrinter(fonts);
} catch (error) {
  console.error("❌ PDF Printer Initialization Error (Check Font Paths):", error.message);
}

// Helper: Check if image exists before adding to PDF to prevent crashes
const getSafeImagePath = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    return filePath;
  }
  return null; // Return null so we can render text instead of crashing
};


// ==========================================
// CONTROLLERS
// ==========================================

// 1. Create Doctor Prescription (Fixed)
const createDoctorPrescription = async (req, res) => {
  try {
    // 1) Destructure & Validate Input
    let {
      Advice, AnyAdvice, SpecialInstruction,
      MedicineId, Dose, Timeing, UserId,
      Days, NextAppoinment, appointmentId, addInsuranceTypeId
    } = req.body;
    
    const doctorId = req.user._id;

    // Force MedicineId into array if it comes as string
    if (!Array.isArray(MedicineId)) {
      MedicineId = typeof MedicineId === "string" && MedicineId.includes(",")
        ? MedicineId.split(",").map(id => id.trim())
        : [MedicineId].filter(Boolean);
    }

    // 2) Validate appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).json({ success: 0, message: "Appointment not found." });
    
    // Check call status for online appointments
    if (appointment.type === "Online" && appointment.callStatus !== "1") {
       return res.status(400).json({ success: 0, message: "Complete the call first." });
    }

    // Check duplicate
    if (await Prescription.findOne({ AppointmentId: appointmentId })) {
       return res.status(409).json({ success: 0, message: "Prescription already exists." });
    }

    // 3) Determine Insurance Image Path for DB
    // Note: We store the relative URL in DB, but need absolute path for PDF generation
    let insuranceDbPath = "/doctor/insuranceImage/default_insurance.png";
    let insuranceFilename = "default_insurance.png";

    if (req.files?.insuranceImage) {
      insuranceFilename = req.files.insuranceImage[0].filename;
      insuranceDbPath = `/doctor/insuranceImage/${insuranceFilename}`;
    }

    // 4) Create Database Record
    const prescription = await Prescription.create({
      Advice, AnyAdvice, SpecialInstruction,
      MedicineId, Dose, Timeing, doctorId, UserId,
      Days, NextAppoinment, AppointmentId: appointmentId,
      PrescriptionStatus: "4",
      insuranceImage: insuranceDbPath,
      addInsuranceTypeId,
    });

    // 5) Populate Data for PDF
    const pop = await Prescription.findById(prescription._id)
      .populate({
        path: "AppointmentId",
        select: "date timeSlot address gender dob price doctorId clinicId userId",
        populate: [
          { path: "userId", select: "name gender address dob" },
          { path: "doctorId", select: "name" },
          { path: "clinicId", select: "name address city" },
        ],
      })
      .populate("MedicineId", "name")
      .populate("addInsuranceTypeId", "name");

    const appt = pop.AppointmentId;
    const price = appt?.price || 0;
    
    // Generate QR
    const qrUrl = await QRCode.toDataURL(`Total Price: ₹${price}`);

    // 6) Prepare Absolute Paths for PDF Generation
    const logoRawPath = path.join(projectRoot, "uploads/doctor/PdfDocument/vecteezy_illustration-hospital-building-and-ambulance_24701003.png");
    const signatureRawPath = path.join(projectRoot, "uploads/doctor/signature", `${doctorId}.png`);
    const insuranceRawPath = path.join(projectRoot, "uploads/doctor/insuranceImage", insuranceFilename);

    // Validate Paths (Prevent Crash if missing)
    const logoPath = getSafeImagePath(logoRawPath);
    const signaturePath = getSafeImagePath(signatureRawPath);
    const insurancePath = getSafeImagePath(insuranceRawPath);

    // 7) Build Dynamic Medicine Rows
    const doseArr = Array.isArray(Dose) ? Dose : [Dose];
    const timeArr = Array.isArray(Timeing) ? Timeing : [Timeing];
    const daysArr = Array.isArray(Days) ? Days : [Days];

    const medRows = pop.MedicineId.map((med, i) => {
      return [
        (i + 1).toString(),
        med.name || "N/A",
        (doseArr[i] || "").toString(),
        (timeArr[i] || "").toString(),
        (daysArr[i] || "").toString()
      ];
    });

    // 8) PDF Definition
    const docDefinition = {
      defaultStyle: { font: "Roboto" },
      pageSize: "A4",
      pageMargins: [30, 40, 30, 40],

      content: [
        // Header
        {
          columns: [
            logoPath ? { image: logoPath, width: 60 } : { text: "", width: 60 },
            {
              stack: [
                { text: appt.doctorId?.name || "Unknown Doctor", fontSize: 14, bold: true },
                { text: appt.clinicId?.name || "Unknown Clinic", fontSize: 10 },
                { text: `${appt.clinicId?.address || ""}, ${appt.clinicId?.city || ""}`, fontSize: 9 }
              ],
              alignment: "right"
            }
          ]
        },

        // Patient Details
        { text: "PATIENT DETAILS", style: "sectionHeader", margin: [0, 15, 0, 6] },
        {
          table: {
            widths: ["auto", "auto", "auto", "*"],
            body: [
              ["Appointment ID", "Date", "Time", "DOB"],
              [
                appt._id.toString(), 
                appt.date || "", 
                appt.timeSlot || "", 
                appt.userId?.dob || ""
              ],
              ["Name", "Gender", "Address", ""],
              [
                appt.userId?.name || "", 
                appt.userId?.gender || "", 
                appt.userId?.address || "", 
                ""
              ]
            ]
          },
          layout: "lightHorizontalLines"
        },

        // Prescription Table
        { text: "PRESCRIPTION", style: "sectionHeader", margin: [0, 15, 0, 6] },
        {
          table: {
            widths: [30, "*", 50, 60, 50],
            body: [
              ["S.No.", "Medicine", "Dose", "Time", "Duration"],
              ...medRows
            ]
          },
          layout: "lightHorizontalLines"
        },

        // Advice + Signature
        {
          columns: [
            {
              width: "*",
              stack: [
                { text: `Advised: ${Advice || ""}`, fontSize: 9 },
                { text: `Advice Given: ${AnyAdvice || ""}`, fontSize: 9 },
                { text: `Special: ${SpecialInstruction || ""}`, fontSize: 9 },
                { text: `Next Appt: ${NextAppoinment || ""}`, fontSize: 9 },
                { text: `Insurance: ${pop.addInsuranceTypeId?.name || "N/A"}`, fontSize: 9 }
              ]
            },
            {
              width: 120,
              stack: [
                signaturePath
                  ? { image: signaturePath, width: 80, alignment: "right", margin: [0, 5] }
                  : { text: "No Signature", italics: true, alignment: "right", margin: [0, 5] },
                { text: `Dr. ${appt.doctorId?.name || ""}`, alignment: "right", fontSize: 10 }
              ]
            }
          ],
          margin: [0, 15, 0, 10]
        },

        // Insurance Image
        insurancePath
          ? { image: insurancePath, width: 130, alignment: "left", margin: [0, 0, 0, 10] }
          : { text: "", margin: [0, 0, 0, 10] },

        // Total Price & QR
        { text: `Total Price: ₹${price}`, bold: true, margin: [0, 0, 0, 5] },
        { image: qrUrl, width: 80, alignment: "left" },

        // Footer
        {
          text: "Terms: Do not share or alter.",
          italics: true,
          fontSize: 7,
          margin: [0, 15, 0, 0]
        }
      ],

      styles: {
        sectionHeader: { fontSize: 12, bold: true }
      }
    };

    // 9) Generate & Save PDF
    const pdfDir = path.join(projectRoot, "uploads/doctor/PdfDocument");
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

    const pdfName = `prescription_${prescription._id}.pdf`;
    const pdfPath = path.join(pdfDir, pdfName);

    if (!printer) throw new Error("PDF Printer failed to initialize (Missing Fonts)");

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const writeStream = fs.createWriteStream(pdfPath);
    
    pdfDoc.pipe(writeStream);
    pdfDoc.end();

    // 10) Handle Stream Finish vs Error
    writeStream.on('finish', async () => {
      try {
        // Update URL in DB (Using relative path for frontend access)
        prescription.pdfUrl = `/prescriptions/${pdfName}`;
        await prescription.save();

        res.status(201).json({
          success: 1,
          message: "Prescription PDF created successfully",
          pdfUrl: prescription.pdfUrl,
          details: pop
        });
      } catch (saveErr) {
        console.error("Error saving PDF URL:", saveErr);
        res.status(500).json({ success: 0, message: "PDF created but failed to save URL." });
      }
    });

    writeStream.on('error', (err) => {
      console.error("PDF Write Stream Error:", err);
      res.status(500).json({ success: 0, message: "Failed to write PDF file." });
    });

  } catch (err) {
    console.error("Create Prescription Error:", err);
    res.status(500).json({ success: 0, message: err.message || "Internal Server Error" });
  }
};


// 2. Get Medicine Data
const getMedicineData = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const [medicines, totalCount] = await Promise.all([
      Medicine.find().skip(parseInt(skip)).limit(parseInt(limit)),
      Medicine.countDocuments()
    ]);

    if (!medicines || medicines.length === 0) {
      return res.status(200).json({
        success: 0,
        message: "No medicine records found.",
      });
    }

    return res.status(200).json({
      success: 1,
      message: "Medicine data fetched successfully",
      totalCount,
      currentPage: parseInt(page),
      pageSize: parseInt(limit),
      details: medicines,
    });
  } catch (error) {
    console.error("Get Medicine Data Error:", error);
    return res.status(500).json({
      success: 0,
      message: "Internal server error",
      error: error.message,
    });
  }
};


// 3. Get All Prescriptions
const getAllPrescription = async (req, res) => {
  try {
    const { AppointmentId } = req.query;

    if (!AppointmentId) {
      return res.send({
        success: 0,
        message: "please enter AppointmentId",
      });
    }

    // Appointment details
    const appointmentDetails = await Appointment.findById(AppointmentId).lean();

    // Prescription details linked to this AppointmentId
    const prescriptionDetails = await doctorPrescription
      .find({ AppointmentId: AppointmentId })
      .populate("MedicineId", "name")
      .lean();

    return res.send({
      success: 1,
      message: "all data fetched",
      appointmentDetails,
      prescriptionDetails,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};


// 4. Postpone Appointment
const Postpone = async (req, res) => {
  try {
    const { StartDate, selectavailbilty, StartTime, EndTime, AppointmentId } = req.body;
    const doctorId = req.user._id;

    if (!StartDate || !selectavailbilty || !StartTime || !EndTime || !AppointmentId) {
      return res.status(400).json({
        success: 0,
        message: "All fields are required",
      });
    }

    const updated = await Appointment.findByIdAndUpdate(
      AppointmentId,
      {
        StartDate,
        StartTime,
        EndTime,
        selectavailbilty,
        doctorId,
        PostponeStaus: "1",
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: 0,
        message: "Appointment not found",
      });
    }

    return res.json({
      success: 1,
      message: "Appointment postponed successfully",
      data: updated,
    });

  } catch (error) {
    return res.status(500).json({
      success: 0,
      message: error.message,
    });
  }
};


// 5. Get Insurance Types
const getInsurance = async (req, res) => {
  try {
    const data = await InsuranceModel.find();

    return res.send({
      success: 1,
      message: "get",
      details: data
    });

  } catch (error) {
    return res.send({
      success: 0,
      message: error.message
    });
  }
};

module.exports = {
  getMedicineData,
  createDoctorPrescription,
  getAllPrescription,
  Postpone,
  getInsurance
};