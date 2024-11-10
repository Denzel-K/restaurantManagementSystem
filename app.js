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
app.use(cors());
app.use(cookie_parser()); 
app.use(authRoutes);

// Check if the database and tables exist, and set them up if necessary
// setupDatabase()
//   .then(() => {
//     console.log('Database and tables checked/initialized successfully.');
//   })
//   .catch(err => {
//     console.error('Error during database setup:', err);
//   });

// Server setup
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});