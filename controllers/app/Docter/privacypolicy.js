const Privacypolicy = require("../../../modal/privacypolicy");

// Endpoint: /doctor-privacy/create
// Method: POST
const privacy = async (req, res) => {
  try {
    const { privacyPolicy } = req.body;
    let str = JSON.stringify(privacyPolicy);

    const data = await Privacypolicy.create({ privacyPolicy: str });
    return res.send({
      success: 1,
      message: "Privacy policy created ",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//Endpoint: /doctor-privacy
const getPrivacy = async (req, res) => {
  try {
    const data = await Privacypolicy.findOne({});
    if (!data) {
      return res.send({
        success: 0,
        message: "Nothing",
      });
    }
    const formattedPolicy = data.privacyPolicy.replace(/\n/g, "<br>");
    const termsPolicy = data.termsAndCondition.replace(/\n/g, "<br>");
    const paymentPolicy = data.paymentPolicy.replace(/\n/g, "<br>");
    const aboutUsPolicy = data.aboutUs.replace(/\n/g, "<br>");
    return res.send({
      success: 1,
      message: "Created ",
      details: {
        privacyPolicy: formattedPolicy,
        termsAndCondition: termsPolicy,
        paymentPolicy,
        aboutUs: aboutUsPolicy,
      },
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = { privacy, getPrivacy };
