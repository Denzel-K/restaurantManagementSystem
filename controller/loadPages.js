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

module.exports.getAuth = (_req, res) => {
  res.render('auth', {pageTitle: 'Restaurant Management System'});
}

module.exports.getDashboard = (_req, res) => {
  res.render('dashboard', {pageTitle: 'Dashboard'});
}

module.exports.renderInventory = async (req, res) => {
  const user = req.user;
  console.log("User Role ID:", user.role_id);

  res.render('inventory', 
    {
      pageTitle: 'Inventory',
      user,
      email: user.email,
      role_id: user.role_id
    }
  );
}

module.exports.renderMenu = async (req, res) => {
  const user = req.user;

  res.render('menu',
    {
      pageTitle: 'Menu',
      user,
      email: user.email,
      role_id: user.role_id
    }
  );
}

module.exports.renderOrders = async (req, res) => {
  const user = req.user;

  res.render('orders', 
    {
      pageTitle: 'Order History',
      user,
      email: user.email,
      role_id: user.role_id
    }
  );
}

module.exports.renderAccounts = async (req, res) => {
  const user = req.user;

  res.render('accounts', 
    {
      pageTitle: 'Accounts',
      user,
      email: user.email,
      role_id: user.role_id
    }
  );
}