const { User, Subscription } = require("../sequelize");

class SubscribesController {
  getUsersSubscribes = async (req, res) => {
    try {
      const { userId } = req.params;
      const { user } = req.locals;
      const subscribes = await Subscription.findAll({
        where: { subscriberId: user.id },
      });
      res.status(200).json({ success: true, subscribes });
    } catch (error) {
      console.error(error);
    }
  };

  // 구독 api. 조건문을 걸고 있다면 구독 취소, 없다면 구독
  postSubscribe = async (req, res) => {
    try {
      const { writer } = req.body; // video writer id
      const { id } = req.body.user; // user id

      const subscribe = await Subscription.findOne({
        where: { channelId: writer, subscriberId: id },
      });

      let type = "subscribe";

      if (!subscribe) {
        // 구독
        await Subscription.create({
          subscriberId: id,
          channelId: writer,
        });

        const channel = await User.findByPk(writer);
        channel.subscribeNum += 1;
        await channel.save();
        console.log("구독 완료");
      } else if (subscribe) {
        // 구독 취소
        Subscription.destroy({
          where: { channelId: writer, subscriberId: id },
        });

        const channel = await User.findByPk(writer);
        channel.subscribeNum -= 1;
        await channel.save();
        type = "cancel";
        console.log("구독 취소 완료");
      }

      res.status(201).json({ success: true, type });
    } catch (error) {
      console.error(error);
    }
  };

  getChannelSubscribed = async (req, res) => {
    try {
      const { channelId } = req.params;
      const { user } = req.locals;
      const subscription = await Subscription.findOne({
        where: { channelId, subscriberId: user.id },
      });
      let subscribed = false;
      if (subscription) {
        subscribed = true;
      } else {
        subscribed = false;
      }
      console.log("whether", subscribed);
      res.status(200).json({ success: true, subscribed });
    } catch (error) {
      console.error(error);
    }
  };
}

module.exports = SubscribesController;
