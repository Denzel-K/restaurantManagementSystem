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

// Add new item
module.exports.addItem = async (req, res) => {
  const { item_name, quantity, unit_price, reorder_level, special_notes, category } = req.body;

  try {
    console.log({item_name, quantity, unit_price, reorder_level, special_notes, category});

    await db.promise().query(
      `INSERT INTO inventory (item_name, quantity, unit_price, reorder_level, special_notes, category) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [item_name, quantity, unit_price, reorder_level, special_notes, category]
    );

    res.status(201).json({ message: 'Item added successfully!' });
  } 
  catch (error) {
    console.error('Error adding item:', error);
    res.status(500).json({ message: 'Failed to add item.' });
  }
};


// Item details update
module.exports.updateItemDetails = async (req, res) => {
  const { id } = req.params;
  const { quantity, unit_price, reorder_level, special_notes } = req.body;

  const updateQuery = `
    UPDATE inventory 
    SET 
      quantity = ?, 
      unit_price = ?, 
      reorder_level = ?, 
      special_notes = ?, 
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.query(updateQuery, [quantity, unit_price, reorder_level, special_notes, id], (error, result) => {
    if (error) {
      console.error('Error updating item:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (result.affectedRows > 0) {
      return res.status(200).json({ message: 'Item updated successfully' });
    } else {
      return res.status(404).json({ message: 'Item not found' });
    }
  });
};

// Item deletion
module.exports.deleteItem = async (req, res) => {
  const { id } = req.params;

  const deleteQuery = `DELETE FROM inventory WHERE id = ?`;

  db.query(deleteQuery, [id], (error, result) => {
    if (error) {
      console.error('Error deleting item:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (result.affectedRows > 0) {
      return res.status(200).json({ message: 'Item deleted successfully' });
    } else {
      return res.status(404).json({ message: 'Item not found' });
    }
  });
};

// Fetch all menu items
exports.getMenuItems = async (_req, res) => {
  try {
    db.query('SELECT * FROM menu', (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error fetching menu items' });
      }

      res.json(results);
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add a new menu item
exports.addMenuItem = async (req, res) => {
  const { item_name, description, price, category } = req.body;

  try {
    await db.promise().query(
      `INSERT INTO menu (item_name, description, price, category) 
       VALUES (?, ?, ?, ?)`,
      [item_name, description, price, category]
    );

    res.status(201).json({ message: 'Menu item added successfully!' });
  } catch (error) {
    console.error('Error adding menu item:', error);
    res.status(500).json({ message: 'Failed to add menu item.' });
  }
};

// Update a menu item
exports.updateMenuItem = async (req, res) => {
  const { id } = req.params;
  const { item_name, description, price, category } = req.body;

  const updateQuery = `
    UPDATE menu 
    SET 
      item_name = ?, 
      description = ?, 
      price = ?, 
      category = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.query(updateQuery, [item_name, description, price, category, id], (error, result) => {
    if (error) {
      console.error('Error updating menu item:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (result.affectedRows > 0) {
      return res.status(200).json({ message: 'Menu item updated successfully' });
    } else {
      return res.status(404).json({ message: 'Menu item not found' });
    }
  });
};

// Delete a menu item
exports.deleteMenuItem = async (req, res) => {
  const { id } = req.params;

  const deleteQuery = `DELETE FROM menu WHERE id = ?`;

  db.query(deleteQuery, [id], (error, result) => {
    if (error) {
      console.error('Error deleting menu item:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (result.affectedRows > 0) {
      return res.status(200).json({ message: 'Menu item deleted successfully' });
    } else {
      return res.status(404).json({ message: 'Menu item not found' });
    }
  });
};

// Make order
module.exports.makeOrder = async (req, res) => {
  const itemId = req.params.id;

  // Query to fetch the item from the menu table
  db.query('SELECT * FROM menu WHERE id = ?', [itemId], (error, results) => {
    if (error) {
      console.error('Database query error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    // If no results are found, return a 404
    if (results.length === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Send the item details as a response
    res.json(results[0]); // results[0] contains the menu item
  });
}