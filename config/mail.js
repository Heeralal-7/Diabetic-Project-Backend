const nodemailer = require("nodemailer");

const sendMailToUser = async (user, otp) => {
  let mailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.USER_EMAIL,
      pass: process.env.USER_PASSWORD,
    },
  });

  let mailDetails = {
    from: process.env.USER_EMAIL,
    to: user,
    subject: "Email Verification",
    text: `Here is the otp of Vendor ${otp}`,
  };

  mailTransporter.sendMail(mailDetails, function (err, data) {
    if (err) {
      console.log("Error Occurs");
    } else {
      console.log("Email sent successfully");
    }
  });
};

module.exports = sendMailToUser;
