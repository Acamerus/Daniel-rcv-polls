const { DataTypes } = require("sequelize");
const db = require("./db");

const VoteToken = db.define("voteToken", {
  pollId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: "Unique identifier for each voter (generated client-side)",
  },
  votedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = VoteToken;
