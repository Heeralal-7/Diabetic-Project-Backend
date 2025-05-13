const Vendor = require("../../../../modal/vandor");
const PickupCharges = require("../../../../modal/Pickup Charges");

//create pickup by vendor
//Method:Post
//Endpoint:/pick/create
const pickup = async (req, res) => {
  try {
    const { fixedPrice, fixedDistance, pricePerkm } = req.body;

    const vendor = await Vendor.findById(req.user._id);
    if (!vendor) {
      return res.send({
        success: 0,
        message: "Vendor not found",
      });
    }

    const data = await PickupCharges.create({
      fixedPrice,
      fixedDistance,
      pricePerkm,
      vendorId: req.user._id,
    });

    return res.send({
      success: 1,
      message: "Created successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//Get pickup by vendor
//Method:Get
//Endpoint:/pick
const getPickup = async (req, res) => {
  try {
    const data = await PickupCharges.find({ vendorId: req.user._id });
    if (!data) {
      return res.send({
        success: 0,
        message: "Data is not found",
      });
    }

    return res.send({
      success: 1,
      message: "Fetched successfully",
      details: data,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//Update pickup by vendor
//Method:Patch
//Endpoint:/pick/update/:id
const updatePick = async (req, res) => {
  try {
    const { fixedPrice, fixedDistance, pricePerkm } = req.body;
    const { id } = req.params;

    const vendor = await Vendor.findById({ _id: req.user._id });
    if (!vendor) {
      return res.send({
        success: 0,
        message: "Vendor not authenticated",
      });
    }

    const data = await PickupCharges.findByIdAndUpdate(
      id,
      {
        fixedPrice,
        fixedDistance,
        pricePerkm,
      },
      { new: true }
    );

    return res.send({
      success: 1,
      message: "Updated successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//Delete pickup by vendor
//Method:Delete
//Endpoint:/pick/delete/:id
const deletePick = async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await Vendor.findById({ _id: req.user._id });
    if (!vendor) {
      return res.send({
        success: 0,
        message: "Vendor is not authenticated",
      });
    }

    await PickupCharges.findByIdAndDelete(id);

    return res.send({
      success: 1,
      message: "Deleted successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};
module.exports = { pickup, getPickup, updatePick, deletePick };
