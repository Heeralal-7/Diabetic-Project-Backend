const Documents = require("../../../../modal/Document");
const getDocuments = async (req, res) => {
  try {
    const { id } = req.query;
    const data = await Documents.find({ vendorId: id });
    if (!data) {
      return res.send({
        success: 0,
        message: "Not authorized",
      });
    }

    return res.send({
      success: 1,
      message: "Fetched",
      details: data,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = { getDocuments };
