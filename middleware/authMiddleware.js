const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
const secretKey = 'wozawoza';

exports.authMiddleware = (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
    return res.status(401).redirect('/');
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded;
    next();
  } 
  catch (error) {
    return res.status(403).redirect('/'); 
  }
};

exports.authenticateUser = (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Failed to authenticate token' });
  }
};