const doctorPrescription = require("../../../modal/DoctorPrescription")
const Service = require("../../../modal/addServices");
const Medicine = require("../../../modal/MedicineSchema")
const PharmacyMedicine = require("../../../modal/VendorMedicine");
const Appointment = require("../../../modal/Appointment");
const path = require("path");
const Prescription = require("../../../modal/DoctorPrescription")
const PDFDocument = require("pdfkit");
const fs = require("fs");
const Doctor = require("../../../modal/docter");
const User = require("../../../modal/user");
const PdfPrinter = require("pdfmake");
 const InsuranceModel = require("../../../modal/AddInsurance")
 const QRCode = require("qrcode");
// doctor-Prescription/createDoctorPrescription


const projectRoot = process.cwd();  // e.g. /Users/huzaifa/Desktop/git-diabetis/diabtic-backend
const fontsDir    = path.join(
  projectRoot,
  "controllers",
  "app",
  "Docter",
  "fonts"
);
// ensure fontsDir exists
fs.mkdirSync(fontsDir, { recursive: true });

// Configure fonts for pdfmake
const fonts = {
  Roboto: {
    normal:      path.join(fontsDir, "Roboto-Regular.ttf"),
    bold:        path.join(fontsDir, "Roboto-Medium.ttf"),
    italics:     path.join(fontsDir, "Roboto-Italic.ttf"),
    bolditalics: path.join(fontsDir, "Roboto-MediumItalic.ttf"),
  }
};

const printer = new PdfPrinter(fonts);


const createDoctorPrescription = async(req, res) => {
  try {
    // 1) Destructure
    let {
      Advice, AnyAdvice, SpecialInstruction,
      MedicineId, Dose, Timeing, UserId,
      Days, NextAppoinment, appointmentId, addInsuranceTypeId
    } = req.body;
    const doctorId = req.user._id;

    // Force MedicineId into array
    if (!Array.isArray(MedicineId)) {
      MedicineId = typeof MedicineId === "string" && MedicineId.includes(",")
        ? MedicineId.split(",").map(id => id.trim())
        : [MedicineId].filter(Boolean);
    }

    // 2) Validate appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).json({ success: 0, message: "Appointment not found." });
    if (appointment.type === "Online" && appointment.callStatus !== "1")
      return res.status(400).json({ success: 0, message: "Complete the call first." });
    if (await Prescription.findOne({ AppointmentId: appointmentId }))
      return res.status(409).json({ success: 0, message: "Already exists." });

    // 3) Create
    const prescription = await Prescription.create({
      Advice, AnyAdvice, SpecialInstruction,
      MedicineId, Dose, Timeing, doctorId, UserId,
      Days, NextAppoinment, AppointmentId: appointmentId,
      PrescriptionStatus: "4",
      insuranceImage: req.files?.insuranceImage
        ? `/doctor/insuranceImage/${req.files.insuranceImage[0].filename}`
        : "/doctor/insuranceImage/default_insurance.png",
      addInsuranceTypeId,
    });

    // 4) Populate
    const pop = await Prescription.findById(prescription._id)
      .populate({
        path: "AppointmentId",
        select: "date timeSlot address gender dob price doctorId clinicId userId",
        populate: [
          { path: "userId",   select: "name gender address dob" },
          { path: "doctorId", select: "name" },
          { path: "clinicId", select: "name address city" },
        ],
      })
      .populate("MedicineId", "name")
      .populate("addInsuranceTypeId", "name");

    const appt  = pop.AppointmentId;
    const price = appt?.price || 0;
    const qrUrl = await QRCode.toDataURL(`Total Price: ₹${price}`);

    // 5) Paths
    const logoPath      = path.join(projectRoot, "uploads/doctor/PdfDocument/vecteezy_illustration-hospital-building-and-ambulance_24701003.png");
    const signaturePath = path.join(projectRoot, "uploads/doctor/signature", `${doctorId}.png`);
    const insurancePath = path.join(
      projectRoot,
      "uploads/doctor/insuranceImage",
      req.files?.insuranceImage?.[0]?.filename || "default_insurance.png"
    );

    // 6) Build dynamic medicine rows
    const medRows = pop.MedicineId.map((med, i) => {
      const doseArr = Array.isArray(Dose) ? Dose : [Dose];
      const timeArr = Array.isArray(Timeing) ? Timeing : [Timeing];
      const daysArr = Array.isArray(Days) ? Days : [Days];
      return [
        (i + 1).toString(),
        med.name || "",
        doseArr[i] || "",
        timeArr[i] || "",
        (daysArr[i] || "").toString()
      ];
    });

    // 7) PDF definition
    const docDefinition = {
      defaultStyle: { font: "Roboto" },
      pageSize: "A4",
      pageMargins: [30, 40, 30, 40],

      content: [
        // header
        {
          columns: [
            { image: logoPath, width: 60 },
            {
              stack: [
                { text: appt.doctorId?.name || "Unknown Doctor", fontSize: 14, bold: true },
                { text: appt.clinicId?.name  || "Unknown Clinic", fontSize: 10 },
                { text: `${appt.clinicId?.address || ""}, ${appt.clinicId?.city || ""}`, fontSize: 9 }
              ],
              alignment: "right"
            }
          ]
        },

        // patient details table
        { text: "PATIENT DETAILS", style: "sectionHeader", margin: [0,15,0,6] },
        {
          table: {
            widths: ["auto","auto","auto","*"],
            body: [
              ["Appointment ID","Date","Time","DOB"],
              [ appt._id.toString(), appt.date, appt.timeSlot, appt.userId?.dob || "" ],
              ["Name","Gender","Address",""],
              [ appt.userId?.name || "", appt.userId?.gender || "", appt.userId?.address || "", "" ]
            ]
          },
          layout: "lightHorizontalLines"
        },

        // prescription table with dynamic rows
        { text: "PRESCRIPTION", style: "sectionHeader", margin: [0,15,0,6] },
        {
          table: {
            widths: [30,"*",50,60,50],
            body: [
              ["S.No.","Medicine","Dose","Time","Duration"],
              ...medRows
            ]
          },
          layout: "lightHorizontalLines"
        },

        // advice + signature
        {
          columns: [
            {
              width: "*",
              stack: [
                { text: `Advised: ${Advice}`,            fontSize: 9 },
                { text: `Advice Given: ${AnyAdvice}`,    fontSize: 9 },
                { text: `Special: ${SpecialInstruction}`, fontSize: 9 },
                { text: `Next Appt: ${NextAppoinment}`,   fontSize: 9 },
                { text: `Insurance: ${pop.addInsuranceTypeId?.name || "N/A"}`, fontSize: 9 }
              ]
            },
            {
              width: 120,
              stack: [
                fs.existsSync(signaturePath)
                  ? { image: signaturePath, width: 80, alignment: "right", margin: [0,5] }
                  : { text: "No Signature", italics: true, alignment: "right" },
                { text: `Dr. ${appt.doctorId?.name || ""}`, alignment: "right", fontSize: 10 }
              ]
            }
          ],
          margin: [0,15,0,10]
        },

        // insurance image
        {
          image: insurancePath,
          width: 130,
          alignment: "left",
          margin: [0,0,0,10]
        },

        // total price & QR
        { text: `Total Price: ₹${price}`, bold: true, margin: [0,0,0,5] },
        { image: qrUrl, width: 80, alignment: "left" },

        // footer
        {
          text: "Terms: Do not share or alter.",
          italics: true,
          fontSize: 7,
          margin: [0,15,0,0]
        }
      ],

      styles: {
        sectionHeader: { fontSize: 12, bold: true }
      }
    };

    // 8) Render & save
    const pdfDir  = path.join(projectRoot, "uploads/doctor/PdfDocument");
    fs.mkdirSync(pdfDir, { recursive: true });
    const pdfName = `prescription_${prescription._id}.pdf`;
    const pdfPath = path.join(pdfDir, pdfName);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    pdfDoc.pipe(fs.createWriteStream(pdfPath));
    pdfDoc.end();

    // 9) Update & respond
    prescription.pdfUrl = `/prescriptions/${pdfName}`;
    await prescription.save();

    res.status(201).json({
      success: 1,
      message: "Prescription PDF created",
      pdfUrl: prescription.pdfUrl,
      details: pop
    });

  } catch (err) {
    console.error("createDoctorPrescription error:", err);
    res.status(500).json({ success: 0, message: err.message });
  }
}

   






      
// /doctor-Prescription/getMedicineData
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

// /doctor-Prescription/getAllPrescription

const getAllPrescription = async (req, res) => {
  try {
    const { AppointmentId } = req.query;

    if (!AppointmentId) {
      return res.send({
        success: 0,
        message: "please enter AppointmentId",
      });
    }

    // Appointment details (full details as stored)
    const appointmentDetails = await Appointment.findById(AppointmentId).lean();

    // Prescription details linked to this AppointmentId with Medicine name populated
    const prescriptionDetails = await doctorPrescription
      .find({ AppointmentId: AppointmentId })
      .populate("MedicineId", "name") // populate only the 'name' field
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


//  doctor-Prescription/Postpone
const Postpone = async (req, res) => {
  try {
    const { StartDate, selectavailbilty, StartTime, EndTime, AppointmentId } = req.body;
    const doctorId = req.user._id;

    // Check all required fields
    if (!StartDate || !selectavailbilty || !StartTime || !EndTime || !AppointmentId) {
      return res.status(400).json({
        success: 0,
        message: "All fields are required",
      });
    }

    // Update the appointment
    const updated = await Appointment.findByIdAndUpdate(
      AppointmentId,
      {
        StartDate,
        StartTime,
        EndTime,
        selectavailbilty,
        doctorId,
        PostponeStaus: "1", // Marking as postponed
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
 //       doctor-Prescription/getInsurance
 const getInsurance = async(req,res) =>{
  try {
    const data = await InsuranceModel.find();

    return res.send({
      success:1,
      message:"get",
      details:data
    })

  } catch (error) {
    return res.send({
      success:0,
      message:error.message
    })
  }
 } 

module.exports = {getMedicineData,createDoctorPrescription,getAllPrescription,Postpone,getInsurance}