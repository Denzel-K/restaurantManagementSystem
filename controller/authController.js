const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const mysql = require('mysql2');
const { authenticateUser } = require('../middleware/authMiddleware');
dotenv.config();

const secretKey = 'scrt123';
const maxAge = 3 * 24 * 60 * 60;

const db = mysql.createPool({
  host: 'mysql.railway.internal',
  user: 'root',
  password: 'AKbEJgeuqJPSOSnxXeDIMzlMKnOHYFGp',
  port: 3306,
  database: 'railway',
  multipleStatements: true
});

// const db = mysql.createPool({
//   host: 'localhost',
//   user: 'root',
//   password: '#Secure1234',
//   port: 3306,
//   database: 'restaurant_management',
//   multipleStatements: true
// });


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

    // Assign role based on whether this is the first user
    const [existingUsers] = await db.promise().query('SELECT * FROM users');
    const role_id = existingUsers.length === 0 ? 1 : 4; // '1' -> super_admin, '4' -> general_users/kitchen

    // Insert the new user into the database
    const [result] = await db.promise().query(
      'INSERT INTO users (name, email, phone, password, role_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone, hashedPassword, role_id]
    );

    // Generate JWT token with role_id and user_id included
    const token = jwt.sign(
      { id: result.insertId, email: email, role_id: role_id },
      secretKey,
      { expiresIn: maxAge }
    );

    res.cookie('jwt', token, { httpOnly: true, expires: new Date(Date.now() + maxAge * 1000) });

    // Respond with success and the token
    res.status(201).json({
      success: true,
      message: 'User registered successfully and logged in',
      token,
    });
  } catch (error) {
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

    // Generate JWT token with role_id and user_id included
    const token = jwt.sign(
      { id: foundUser.id, email: foundUser.email, role_id: foundUser.role_id },
      secretKey,
      { expiresIn: maxAge }
    );

    res.cookie('jwt', token, { httpOnly: true, expires: new Date(Date.now() + maxAge * 1000) });

    // Respond with success and the token
    res.status(200).json({
      message: 'Login successful',
      token,
    });
  } catch (error) {
    console.log("Error: ", error.message);
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
  const { item_name, quantity, unit_price, reorder_level, category } = req.body;

  try {
    console.log({item_name, quantity, unit_price, reorder_level, category});

    await db.promise().query(
      `INSERT INTO inventory (item_name, quantity, unit_price, reorder_level, category) 
       VALUES (?, ?, ?, ?, ?)`,
      [item_name, quantity, unit_price, reorder_level, category]
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
  const { quantity, unit_price, reorder_level } = req.body;

  const updateQuery = `
    UPDATE inventory 
    SET 
      quantity = ?, 
      unit_price = ?, 
      reorder_level = ?
    WHERE id = ?
  `;

  db.query(updateQuery, [quantity, unit_price, reorder_level, id], (error, result) => {
    if (error) {
      console.error('Error updating item:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (result.affectedRows > 0) {
      return res.status(200).json({ message: 'Item updated successfully' });
    } 
    else {
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
    } 
    else {
      return res.status(404).json({ message: 'Item not found' });
    }
  });
};


// MENU CONTROLLERS
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
  const { item_name, price, category } = req.body;

  try {
    await db.promise().query(
      `INSERT INTO menu (item_name, price, category) 
       VALUES (?, ?, ?)`,
      [item_name, price, category]
    );

    res.status(201).json({ message: 'Menu item added successfully!' });
  } 
  catch (error) {
    console.error('Error adding menu item:', error);
    res.status(500).json({ message: 'Failed to add menu item.' });
  }
};

// Update a menu item
exports.updateMenuItem = async (req, res) => {
  const { id } = req.params;
  const { item_name, price, category } = req.body;

  const updateQuery = `
    UPDATE menu 
    SET 
      item_name = ?, 
      price = ?, 
      category = ?
    WHERE id = ?
  `;

  db.query(updateQuery, [item_name, price, category, id], (error, result) => {
    if (error) {
      console.error('Error updating menu item:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (result.affectedRows > 0) {
      return res.status(200).json({ message: 'Menu item updated successfully' });
    } 
    else {
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
    } 
    else {
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
      price: item.price,
      category: item.category
    });
  });
}

// Order placement
module.exports.placeOrder = [authenticateUser, async (req, res) => {
  const { orderItems, totalPrice } = req.body;

  // Validate incoming data
  if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
    return res.status(400).json({ error: 'No order items provided' });
  }

  if (isNaN(totalPrice) || totalPrice <= 0) {
    return res.status(400).json({ error: 'Invalid total price' });
  }

  try {
    const userId = req.userId; // Get the authenticated user's ID

    const orderItemsData = [];
    for (const item of orderItems) {
      const { itemName, price, quantity } = item;

      if (isNaN(price) || isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({ error: 'Invalid item price or quantity' });
      }

      if (price < 0) {
        return res.status(400).json({ error: 'Price cannot be negative' });
      }

      const cleanedItemName = itemName.replace(/:$/, '').trim();
      const [menuItem] = await db.promise().query('SELECT id FROM menu WHERE item_name = ?', [cleanedItemName]);
      const menuId = menuItem[0]?.id;

      if (!menuId) {
        return res.status(400).json({ error: `Menu item not found for ${cleanedItemName}` });
      }

      orderItemsData.push([null, menuId, quantity, price]); 
    }

    const orderQuery = `
      INSERT INTO orders (order_number, user_id, total_price, status, created_at) 
      VALUES (?, ?, ?, ?, NOW())`;

    const [orderResult] = await db.promise().query(orderQuery, [
      generateOrderNumber(),
      userId,
      totalPrice, // Use the total price directly
      'pending',
    ]);

    const orderId = orderResult.insertId;

    const itemsQuery = `
      INSERT INTO order_items (order_id, menu_id, quantity, unit_price)
      VALUES ?`;

    const itemsWithOrderId = orderItemsData.map(item => [orderId, ...item.slice(1)]);
    await db.promise().query(itemsQuery, [itemsWithOrderId]);

    res.status(201).json({ message: 'Order placed successfully', orderId });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ error: 'Failed to place order' });
  }

}
];

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
  } 
  catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status, paymentMethod } = req.body;

  const updateQuery = `
    UPDATE orders 
    SET 
      status = ?,
      payment_method = ?
    WHERE id = ?
  `;

  db.query(updateQuery, [status, paymentMethod, id], (error, result) => {
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
    const [orderRows] = await new Promise((resolve, reject) => {
      db.query(
        `SELECT 
          o.order_number, 
          o.total_price, 
          o.payment_method, 
          o.status,
          o.created_at,
          c.name AS cashier_name 
        FROM orders o
        JOIN users c ON o.user_id = c.id
        WHERE o.id = ?`,
        [orderId],
        (error, results) => {
          if (error) {
            return reject(error);
          }
          resolve([results]); 
        }
      );
    });

    if (orderRows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderRows[0];

    // Fetch order items
    const [itemsRows] = await new Promise((resolve, reject) => {
      db.query(
        `SELECT 
            m.item_name AS name, 
            oi.quantity, 
            oi.unit_price AS price 
        FROM order_items oi
        JOIN menu m ON oi.menu_id = m.id
        WHERE oi.order_id = ?`,
        [orderId],
        (error, results) => {
          if (error) {
            return reject(error);
          }
          resolve([results]); 
        }
      );
    });

    // Send JSON response with the order details and items
    res.json({
      order_number: order.order_number,
      total_price: order.total_price,
      payment_method: order.payment_method,
      status: order.status,
      created_at: order.created_at,
      cashier_name: order.cashier_name,
      order_items: itemsRows // Array of items
    });
  } 
  catch (error) {
    console.error('Error fetching order receipt:', error);
    res.status(500).json({ error: 'Failed to retrieve order receipt' });
  }
};


// Accounts controllers
// Get paginated users
exports.getPaginatedUsers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const [users] = await db.promise().query(
      'SELECT * FROM users LIMIT ? OFFSET ?', [limit, offset]
    );
    const [[{ count }]] = await db.promise().query('SELECT COUNT(*) AS count FROM users');
    const totalPages = Math.ceil(count / limit);

    res.json({ users, totalPages });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error });
  }
};

// Get a user by ID
exports.getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const [user] = await db.promise().query('SELECT * FROM users WHERE id = ?', [id]);
    if (user.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(user[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error });
  }
};

// Update user role
exports.updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role_id } = req.body;

  try {
    await db.promise().query('UPDATE users SET role_id = ? WHERE id = ?', [role_id, id]);
    res.status(200).json({ message: 'User role updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user role', error });
  }
};

// Delete a user
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    await db.promise().query('DELETE FROM users WHERE id = ?', [id]);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error });
  }
};



// Logout
module.exports.logout = (req, res) => {
  res.cookie ("jwt", '', {maxAge: 1});
  res.redirect ("/");
}