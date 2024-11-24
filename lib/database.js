const dotenv = require('dotenv');
const mysql = require('mysql2');
const fs = require('fs');

dotenv.config();

const db = mysql.createPool({
  host: 'mysql.railway.internal',
  user: 'root',
  password: 'AKbEJgeuqJPSOSnxXeDIMzlMKnOHYFGp',
  port: 3306,
  database: 'railway',
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
