const { Sequelize } = require("sequelize");

module.exports = (sequelize, DataTypes) =>
  sequelize.define("VideoLike", {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },

    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'like'
    }
  });
