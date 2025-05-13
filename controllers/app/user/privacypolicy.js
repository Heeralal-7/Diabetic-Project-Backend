const Privacy = require("../../../modal/policy");


//users policy
//Method:Post
//Endpoints: /user-policy/create
const privacypolicy = async (req, res) => {
  try {
    const { privacyPolicy, termsAndCondition, aboutUs, paymentPolicy, whypres, type } =
      req.body;
    let str = JSON.stringify(privacyPolicy);
    let str1 = JSON.stringify(termsAndCondition);
    let str2 = JSON.stringify(aboutUs);
    let str3 = JSON.stringify(paymentPolicy);
    let str4 = JSON.stringify(whypres)

    const data = await Privacy.create({
      privacyPolicy: str,
      termsAndCondition: str1,
      aboutUs: str2,
      paymentPolicy: str3,
      whypres: str4,
      type,
    });
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

//Get policies
//Method:Get
//Endpoints:/user-policy?type=User
const getPrivacyPolicy = async (req, res) => {
  try {
    const { type } = req.query;
    const data = await Privacy.findOne({ type });
    if (!data) {
      return res.send({
        success: 0,
        message: "No data",
      });
    }
    const formattedPolicy = data.privacyPolicy.replace(/\\n/g, "<br>");
    const termsPolicy = data.termsAndCondition.replace(/\\n/g, "<br>");
    const paymentPolicy = data.paymentPolicy.replace(/\\n/g, "<br>");
    const aboutUsPolicy = data.aboutUs.replace(/\\n/g, "<br>");
    const whypresPolicy = data.whypres.replace(/\\n/g, "<br>");
    return res.send({
      success: 1,
      message: "Policy fetched successfully",
      details: {
        privacyPolicy: formattedPolicy,
        termsAndCondition: termsPolicy,
        paymentPolicy,
        aboutUs: aboutUsPolicy,
        whypresPolicy
      },
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = { privacypolicy, getPrivacyPolicy };
