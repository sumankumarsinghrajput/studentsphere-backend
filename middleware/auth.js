const jwt  = require('jsonwebtoken');
const User = require('../models/User');

module.exports = (requiredRole) => async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'No token, access denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id, '-password');
    if (!user) return res.status(401).json({ msg: 'User not found' });
    req.user = { id: user._id, role: user.role, email: user.email };
    if (requiredRole && user.role !== requiredRole)
      return res.status(403).json({ msg: 'Access forbidden' });
    next();
  } catch {
    res.status(401).json({ msg: 'Invalid or expired token' });
  }
};
