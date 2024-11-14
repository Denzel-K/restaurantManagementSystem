const dotenv = require('dotenv');
const mysql = require('mysql2');
const fs = require('fs');

dotenv.config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 3306,
  multipleStatements: true
});

// Create the database if it doesn't exist
const createDatabase = () => {
  return new Promise((resolve, reject) => {
    db.query('CREATE DATABASE IF NOT EXISTS sql7743204', (err) => {
      if (err) {
        console.error("Error creating database:", err);
        reject(err);
      } else {
        console.log("Database created or already exists.");
        resolve();
      }
    });
  });
};

// Check if the database exists (compatible with older MySQL versions)
const checkDatabase = () => {
  return new Promise((resolve, reject) => {
    db.query("SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = 'sql7743204'", (err, results) => {
      if (err) {
        console.error('Error checking for database:', err);
        reject(err); // Reject the promise if there's an error
      } else {
        resolve(results.length > 0); // Resolve with a boolean indicating if the database exists
      }
    });
  });
};

// Check if a core table exists (compatible with older MySQL versions)
const checkTables = () => {
  return new Promise((resolve, reject) => {
    db.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = 'sql7743204' 
      AND TABLE_NAME = 'users'
    `, (err, results) => {
      if (err) {
        console.error('Error checking for tables:', err);
        reject(err); // Reject the promise if there's an error
      } else {
        resolve(results.length > 0); // Resolve with a boolean indicating if the table exists
      }
    });
  });
};

// Initialize the database and tables
const setupDatabase = () => {
  return new Promise((resolve, reject) => {
    db.getConnection((err, connection) => {
      if (err) {
        console.error("Failed to connect to MySQL:", err);
        reject(err); // Reject if connection fails
      } else {
        console.log("Connected to MySQL database.");
        connection.release(); // Release the connection back to the pool

        checkDatabase()
          .then(async (dbExists) => {
            if (!dbExists) {
              console.log('Database does not exist. Creating it...');
              await createDatabase();
            }

            const tablesExist = await checkTables();
            if (!tablesExist) {
              console.log('Tables do not exist. Running table setup...');
              const setupSql = fs.readFileSync('./lib/RMS.sql', 'utf8');
              db.query(setupSql, (err) => {
                if (err) {
                  console.error('Error running table setup:', err);
                  reject(err);
                } else {
                  console.log('Tables setup completed.');
                  resolve();
                }
              });
            } else {
              console.log('Tables already exist.');
              resolve();
            }
          })
          .catch((err) => {
            console.error('Error checking database or tables:', err);
            reject(err);
          });
      }
    });
  });
};

// Export the db connection and database-related functions
module.exports = {
  db,
  checkDatabase,
  checkTables,
  setupDatabase
};
