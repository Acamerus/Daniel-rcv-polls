const { DataTypes } = require("sequelize");
const db = require("./db");

const Ballot = db.define("ballot", {
  pollId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  ranking: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: "Ordered array of option IDs representing voter preference",
  },
});

module.exports = Ballot;
