const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const normalizedRoles = roles.map(r => r.toLowerCase());
    const userRole = (req.user.role || '').toLowerCase();

    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this resource`
      });
    }

    next();
  };
};

const requireRole = (role) => authorize(role);

module.exports = {
  authorize,
  requireRole
};
