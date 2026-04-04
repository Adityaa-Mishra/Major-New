const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'Token is not valid' });
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const providerOnly = (req, res, next) => {
  if (req.user.role !== 'provider') return res.status(403).json({ message: 'Provider access only' });
  next();
};

const userOnly = (req, res, next) => {
  if (req.user.role !== 'user') return res.status(403).json({ message: 'User access only' });
  next();
};

module.exports = { auth, providerOnly, userOnly };
