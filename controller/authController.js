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

// Fetch Item details on order
module.exports.fetchItemDetails = async (req, res) => {
  const itemId = req.params.itemId;

  // Query the database to get item details based on itemId
  const query = 'SELECT * FROM menu WHERE id = ?'; // Assuming `id` is the primary key in the menu_items table

  db.query(query, [itemId], (err, results) => {
    if (err) {
      console.error('Error fetching item from database:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    // If no item is found, return a 404 status
    if (results.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Return the item details in JSON format
    const item = results[0];
    res.json({
      id: item.id,
      item_name: item.item_name,
      description: item.description,
      price: item.price,
      category: item.category
    });
  });
}

// Order placement
module.exports.placeOrder = async (req, res) => {
  const { orderItems, paymentMethod } = req.body;

  console.log({ orderItems });

  // Validate incoming data
  if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
    return res.status(400).json({ error: 'No order items provided' });
  }

  try {
    const userId = 1; // Set a default user_id for now

    // Calculate the total price from the order items
    let totalPrice = 0;
    const orderItemsData = [];

    for (const item of orderItems) {
      const { itemName, price, quantity } = item;

      // Check if price and quantity are valid
      if (isNaN(price) || isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({ error: 'Invalid item price or quantity' });
      }

      // Check if the price is negative
      if (price < 0) {
        return res.status(400).json({ error: 'Price cannot be negative' });
      }

      totalPrice += price * quantity;

      // Get the menu_id based on the item name
      const cleanedItemName = itemName.replace(/:$/, '').trim();
      console.log(`Searching for menu item: "${cleanedItemName}"`); 

      const [menuItem] = await db.promise().query('SELECT id FROM menu WHERE item_name = ?', [cleanedItemName]);
      const menuId = menuItem[0]?.id;
      console.log(`Menu ID found: ${menuId}`); // Log the result

      if (!menuId) {
          console.log(`Menu item not found for ${cleanedItemName}`);
          return res.status(400).json({ error: `Menu item not found for ${cleanedItemName}` });
      }

      // Push the values in the correct format for order_items table
      orderItemsData.push([null, menuId, quantity, price]); // Use null for order_id here, it will be set later
    }

    // Ensure totalPrice is a valid number
    if (isNaN(totalPrice)) {
      return res.status(400).json({ error: 'Total price calculation failed' });
    }

    // Insert the order into the 'orders' table
    const orderQuery = `
      INSERT INTO orders (order_number, user_id, total_price, payment_method, status, created_at) 
      VALUES (?, ?, ?, ?, ?, NOW())`;

    const [orderResult] = await db.promise().query(orderQuery, [
      generateOrderNumber(),
      userId,
      totalPrice.toFixed(2),
      paymentMethod,
      'pending',
    ]);

    const orderId = orderResult.insertId;

    // Insert each item into the 'order_items' table
    const itemsQuery = `
      INSERT INTO order_items (order_id, menu_id, quantity, unit_price)
      VALUES ?`;

    // Now we can set the order_id for each item
    const itemsWithOrderId = orderItemsData.map(item => [orderId, ...item.slice(1)]); // Prepend orderId to each item

    await db.promise().query(itemsQuery, [itemsWithOrderId]);

    res.status(201).json({ message: 'Order placed successfully', orderId });
  } 
  catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ error: 'Failed to place order' });
  }
};

// Helper function to generate a unique order number
function generateOrderNumber() {
  return `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}


module.exports.fetchOrders = async (req, res) => {
  try {
    db.query('SELECT * FROM orders', (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error fetching orders' });
      }

      res.json(results);
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const updateQuery = `
    UPDATE orders 
    SET 
      status = ?, 
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.query(updateQuery, [status, id], (error, result) => {
    if (error) {
      console.error('Error updating order status:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (result.affectedRows > 0) {
      return res.status(200).json({ message: 'Order status updated successfully' });
    } 
    else {
      console.log('Order not found');
      return res.status(404).json({ message: 'Order not found' });
    }
  });
};


module.exports.getReceipt = async (req, res) => {
  const orderId = req.params.orderId;

  try {
    // Use a Promise wrapper around db.query
    const [rows] = await new Promise((resolve, reject) => {
      db.query(
        `SELECT order_number, total_price, payment_method, status, updated_at FROM orders WHERE id = ?`,
        [orderId],
        (error, results) => {
          if (error) {
            return reject(error);
          }
          resolve([results]); 
        }
      );
    });

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = rows[0];

    // Send JSON response with the order details
    res.json({
      order_number: order.order_number,
      total_price: order.total_price,
      payment_method: order.payment_method,
      status: order.status,
      updated_at: order.updated_at
    });
  } catch (error) {
    console.error('Error fetching order receipt:', error);
    res.status(500).json({ error: 'Failed to retrieve order receipt' });
  }
};