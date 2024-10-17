const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const secretKey = 'your_jwt_secret';
const maxAge = 3 * 24 * 60 * 60;
const dotenv = require('dotenv');
const mysql = require('mysql2');

dotenv.config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME, 
  multipleStatements: true 
});

// Register new user
exports.registerUser = async (req, res) => {
  const { name, email, phone, password } = req.body;

  try {
    // Check if user already exists
    const [existingUser] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user and assign them the 'super_admin' role if they are the first user
    const [existingUsers] = await db.promise().query('SELECT * FROM users');
    const role_id = existingUsers.length === 0 ? 1 : 4; // '1' -> super_admin, '4' -> general_users
    
    // Insert the new user into the database
    const [result] = await db.promise().query(
      'INSERT INTO users (name, email, phone, password, role_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone, hashedPassword, role_id]
    );

    // Automatically log in the user by generating a JWT token
    const token = jwt.sign({ id: result.insertId, email: email }, secretKey, { expiresIn: maxAge });

    // Redirect to the same page with the token
    res.status(201).json({
      success: true,
      message: 'User registered successfully and logged in',
      token,
    });
  } 
  catch (error) {
    console.log("Error: ", error.message);
    res.status(500).json({ message: 'Error registering user', error });
  }
};

// Login user
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const [user] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    if (user.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    const foundUser = user[0]; // Extract the user object

    // Compare password
    const match = await bcrypt.compare(password, foundUser.password);
    if (!match) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: foundUser.id, email: foundUser.email }, secretKey, { expiresIn: maxAge });

    // Redirect to the same page with the token
    res.status(200).json({
      message: 'Login successful',
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
};

// Inventory fetch
module.exports.getInventory = async (_req, res) => {
  try {
    db.query('SELECT * FROM inventory', (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error fetching inventory data' });
      }

      res.json(results);
    });
  } 
  catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
