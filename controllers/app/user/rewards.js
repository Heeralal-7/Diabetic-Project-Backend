const User = require("../../../modal/user");
const Reward = require("../../../modal/Rewards");

const FIELD_REWARDS = {
  name: 10,
  email: 10,
  relationship: 5,
  occupation: 10,
  gender: 10,
  birthyear: 10,
  weight: 5,
  height: 5,
  diabteticType: 5,
  diabeticduration: 5,
  dailyactivity: 10,
  bloodgroup: 10,
  familyhistorydiabetic: 5,
  takingmedicines: 5,
};

const calculateCoinReward = (user) => {
  let totalReward = 0;
  const userFields = Object.keys(user._doc);

  for (const key of userFields) {
    if (FIELD_REWARDS[key] && user._doc[key] && key !== "_id" && key !== "_v") {
      if (Array.isArray(user._doc[key])) {
        if (user._doc[key].length > 0) {
          totalReward += FIELD_REWARDS[key];
        }
      } else {
        totalReward += FIELD_REWARDS[key];
      }
    }
  }
  return totalReward;
};

//User get coin according to profile
//Method:Get
//Endpoints:/rewards/create-reward
const rewards = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.send({
        success: 0,
        message: "Id is required",
      });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.send({
        success: 0,
        message: "No user found",
      });
    }

    const coinReward = calculateCoinReward(user);
    if (coinReward > 0) {
      await Reward.create({ userId, coins: coinReward });
    }

    return res.send({
      success: 1,
      message: `You have been rewarded coins`,
      details: `${coinReward}`,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = { rewards };
