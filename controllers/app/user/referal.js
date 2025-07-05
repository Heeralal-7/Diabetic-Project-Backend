const UserMemberShip = require("../../../modal/UsermemberShip");


// membership/Usermembersship
const Usermembersship = async (req, res) => {
  try {
    const { BloodSugar, AgeGroup, HadDiabetes, LifeStyle, finalPrice } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(400).send({
        success: 0,
        message: "User ID not found from token",
      });
    }

    const newMembership = await UserMemberShip.create({
      BloodSugar,
      AgeGroup,
      HadDiabetes,
      LifeStyle,
      finalPrice,
      UserId: userId,
    });

    return res.status(200).send({
      success: 1,
      message: "Membership saved successfully",
      data: newMembership,
    });

  } catch (error) {
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};
//     ,
const getUserMembership = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(400).send({
        success: 0,
        message: "User ID not found from token",
      });
    }

    const membership = await UserMemberShip.findOne({ UserId: userId }).populate({
      path: "UserId",
      select: "-password -__v", // you can exclude sensitive fields like password
    });

    if (!membership) {
      return res.status(404).send({
        success: 0,
        message: "Membership not found",
      });
    }

    return res.status(200).send({
      success: 1,
      message: "Membership retrieved successfully",
      data: membership,
    });
  } catch (error) {
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = {Usermembersship,getUserMembership}