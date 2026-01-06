const { DataTypes } = require("sequelize");
const db = require("./db");

const Option = db.define("option", {
  text: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  pollId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

module.exports = Option;
