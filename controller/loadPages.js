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

module.exports.getHome = (_req, res) => {
  res.render('home', {pageTitle: 'Restaurant Management System'});
}

module.exports.getDashboard = (_req, res) => {
  res.render('dashboard', {pageTitle: 'Dashboard'});
}

module.exports.renderInventory = async (_req, res) => {
  res.render('inventory');
}