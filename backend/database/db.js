require("dotenv").config();
const { Sequelize } = require("sequelize");

// Use SQLite for development (no server needed)
// Use postgres for production if DATABASE_URL is set
const db = new Sequelize(
  process.env.DATABASE_URL || "sqlite::memory:",
  {
    logging: false, // comment this line to enable SQL logging
    // For SQLite:
    dialect: process.env.DATABASE_URL ? "postgres" : "sqlite",
  }
);

module.exports = db;
