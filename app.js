const express = require('express');
const cors = require('cors');
const path = require('path')
const hbs = require('express-handlebars');
const Handlebars = require('handlebars');
const dotenv = require('dotenv');
const authRoutes = require("./routes/authRoutes");
const morgan = require('morgan');
const { setupDatabase } = require('./lib/database');
const cookie_parser = require('cookie-parser');

//.env
dotenv.config();

//Init
const app = express();

//Set view engine
const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access');

const handlebars = hbs.create({
  helpers: {
    eq: (a, b) => a === b,

    formatDate: (date) => {
      const d = new Date(date);
      return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    },

    uppercase: (str) => str.toUpperCase(),

    gt: (a, b) => a > b,

    gte: (a, b) => a >= b,

    isSuperAdmin: (role_id) => role_id === 1,

   // isAdminManager: (role_id) => role_id == 1 || 2,

    isManager: (role_id) => role_id === 2,

    isCashier: (role_id) => role_id === 3,

    isGeneralUser: (role_id) => role_id === 4,

    json: (context) => JSON.stringify(context),
  },
  extname: '.hbs',
  handlebars: allowInsecurePrototypeAccess(Handlebars)
});

app.engine('.hbs', handlebars.engine);
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));


// Middleware
app.use(morgan("dev"));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({
  origin: 'https://restaurantmanagementsystem-production-8958.up.railway.app',
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(cookie_parser()); 
app.use(authRoutes);


// Check if the database is connected, then start the server
const startServer = async () => {
  try {
    await setupDatabase(); // Wait for the database connection
    console.log("Database connected successfully.");

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } 
  catch (err) {
    console.error("Error connecting to the database:", err);
    process.exit(1); // Exit if database connection fails
  }
};

startServer();
