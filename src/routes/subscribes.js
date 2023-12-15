const express = require("express");
const router = express.Router();

const { auth } = require("../middleware/auth");

const SubscribesController = require("../controllers/subscribes.controller");
const subscribesController = new SubscribesController();

router.get("/users", auth, subscribesController.getUsersSubscribes);

router.post("/subscribe", auth, subscribesController.postSubscribe);

router.get("/:channelId/subscribed", auth, subscribesController.getChannelSubscribed);

module.exports = router;
