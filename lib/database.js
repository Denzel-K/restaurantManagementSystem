const dotenv = require('dotenv');
const mysql = require('mysql2');
const fs = require('fs');

dotenv.config();

const db = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  port: process.env.MYSQLPORT || 3306,
  database: process.env.MYSQLDATABASE,
  multipleStatements: true
});

// Check the connection
const setupDatabase = () => {
  return new Promise((resolve, reject) => {
    db.getConnection((err, connection) => {
      if (err) {
        console.error("Failed to connect to MySQL:", err);
        reject(err);
      } else {
        console.log("Connected to MySQL database.");
        connection.release();
        resolve();
      }
    });
  });
};

module.exports = {
  db,
  setupDatabase
};
