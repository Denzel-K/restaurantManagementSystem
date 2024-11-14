const dotenv = require('dotenv');
const mysql = require('mysql2');
dotenv.config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME,
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
