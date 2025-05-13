const generateToken04 = require("../../zego/server");

// Generate Token
const generateTokenZego = async (req, res) => {
  try {
    const appID = 2053141949;
    const secret = process.env.ZEGO_SECRET;

    if (!appID || !secret) {
      return res.status(500).send({
        success: 0,
        message: "Missing ZEGO_APP_ID or ZEGO_SECRET environment variable.",
      });
    }

    const { userId, payload = "", effectiveTimeInSeconds = 3600 } = req.body;

    if (!userId) {
      return res.status(400).send({
        success: 0,
        message: "User ID is required.",
      });
    }

    // Assuming generateToken04 is a function that generates a token based on these parameters.
    const token = generateToken04(
      appID,
      userId,
      secret,
      effectiveTimeInSeconds,
      payload
    );

    return res.send({
      success: 1,
      message: "Token created successfully",
      details: {
        token,
      },
    });
  } catch (error) {
    console.error("Error generating token:", error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// You should have your generateToken04 function defined or imported here

module.exports = { generateTokenZego };
