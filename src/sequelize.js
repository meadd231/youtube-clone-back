const pg = require("pg");
const { Sequelize, DataTypes } = require("sequelize");
const UserModel = require("./models/User");
const VideoModel = require("./models/Video");
const VideoLikeModel = require("./models/VideoLike");
const CommentLikeModel = require("./models/CommentLike");
const CommentModel = require("./models/Comment");
const SubscriptionModel = require("./models/Subscription");

pg.defaults.ssl = false;
const sequelize = new Sequelize('postgres://postgres:marx1818ch!@localhost:5432/YoutubeClone', {
  logging: false,
  dialect: 'postgres',
  dialectOptions: {
    ssl: false,
  },
});
(async () => await sequelize.sync({ alter: true }))();

const User = UserModel(sequelize, DataTypes);
const Video = VideoModel(sequelize, DataTypes);
const VideoLike = VideoLikeModel(sequelize, DataTypes);
const CommentLike = CommentLikeModel(sequelize, DataTypes);
const Comments = CommentModel(sequelize, DataTypes);
const Subscription = SubscriptionModel(sequelize, DataTypes);

// video - user association
// video의 writer 컬럼이 User의 기본키를 참조함.
Video.belongsTo(User, { foreignKey: "writer", as: 'author' });

// video likes association
User.belongsToMany(Video, { through: VideoLike, foreignKey: "userId", as: 'likedVideos' });
Video.belongsToMany(User, { through: VideoLike, foreignKey: "videoId", as: 'likingUsers' });

// comments association
User.hasMany(Comments, {
  foreignKey: "userId",
});
Comments.belongsTo(User, { foreignKey: "userId" });
Video.hasMany(Comments, {
  foreignKey: "videoId",
});
Comments.belongsTo(Video, { foreignKey: "videoId" });

Comments.hasMany(Comments, {
  foreignKey: "commentId",
  as: "replies",
});
Comments.belongsTo(Comments, { foreignKey: "commentId", as: "parentComment" });

// comment likes association
User.belongsToMany(Comments, { through: CommentLike, foreignKey: "userId", as: 'likedComments' });
Comments.belongsToMany(User, { through: CommentLike, foreignKey: "commentId", as: 'likingUsers' });

// 구독자(subscriber)와 채널 소유자(channel) 간의 관계 설정
Subscription.belongsTo(User, { foreignKey: 'subscriberId', as: 'subscriber' });
Subscription.belongsTo(User, { foreignKey: 'channelId', as: 'channel' });

// 사용자 간의 구독 관계 설정
User.hasMany(Subscription, { foreignKey: 'subscriberId', as: 'subscriptions' });
User.hasMany(Subscription, { foreignKey: 'channelId', as: 'subscribers' });


module.exports = {
  User,
  Video,
  VideoLike,
  Comments,
  CommentLike,
  Subscription,
};
