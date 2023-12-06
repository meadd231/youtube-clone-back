const { Sequelize } = require("sequelize");

module.exports = (sequelize, DataTypes) =>
  sequelize.define("Comment", {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
    },
    content: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    likes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    dislikes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    replyNum: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  });
