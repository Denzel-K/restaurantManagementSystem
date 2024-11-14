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

// Create the database if it doesn't exist (without IF NOT EXISTS for compatibility)
const createDatabase = async () => {
  try {
    // Check if the database already exists
    const [databases] = await db.promise().query("SHOW DATABASES LIKE 'sql7743204'");
    if (databases.length === 0) {
      await db.promise().query(`CREATE DATABASE sql7743204`);
      console.log("Database created.");
    } else {
      console.log("Database already exists.");
    }
  } catch (err) {
    console.error("Error creating database:", err);
    throw err;
  }
};

// Check if the database exists
const checkDatabase = async () => {
  try {
    const [databases] = await db.promise().query("SHOW DATABASES LIKE 'sql7743204'");
    return databases.length > 0;
  } catch (err) {
    console.error('Error checking for database:', err);
    throw err;
  }
};

// Check if a core table exists (e.g., users)
const checkTables = async () => {
  try {
    // Alternative query for compatibility
    const [tables] = await db.promise().query(`
      SELECT TABLE_NAME 
      FROM information_schema.tables 
      WHERE table_schema = 'sql7743204' 
      AND table_name = 'users'
    `);
    return tables.length > 0;
  } catch (err) {
    console.error('Error checking for tables:', err);
    throw err;
  }
};

// Initialize the database and tables
const setupDatabase = async () => {
  try {
    const dbExists = await checkDatabase();
    if (!dbExists) {
      console.log('Database does not exist. Creating it...');
      await createDatabase();
    }

    // Proceed with table checks and setup
    const tablesExist = await checkTables();
    if (!tablesExist) {
      console.log('Tables do not exist. Running table setup...');
      const setupSql = fs.readFileSync('./lib/RMS.sql', 'utf8');
      await db.promise().query(setupSql);
      console.log('Tables setup completed.');
    } else {
      console.log('Tables already exist.');
    }

  } catch (err) {
    console.error('Error setting up the database:', err);
    throw err;
  }
};

// Export the db connection and database-related functions
module.exports = {
  db,
  checkDatabase,
  checkTables,
  setupDatabase
};
