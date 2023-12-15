const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");

const { User, Video } = require("../sequelize");

router.get("/:channelName", auth, async (req, res) => {
  try {
    const { channelName } = req.params;
    const channel = await User.findOne({ where: { nickname: channelName } });
    const videoNum = await Video.count({ where: { writer: channel.id } });
    channel.dataValues.videoNum = videoNum;
    res.status(200).json({ success: true, channel });
  } catch (error) {
    console.error(error);
  }
});

module.exports = router;
