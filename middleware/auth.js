const jwt = require('jsonwebtoken');

module.exports = (requiredRole) => (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'No token, access denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    if (requiredRole && decoded.role !== requiredRole)
      return res.status(403).json({ msg: 'Access forbidden' });
    next();
  } catch {
    res.status(401).json({ msg: 'Invalid or expired token' });
  }
};