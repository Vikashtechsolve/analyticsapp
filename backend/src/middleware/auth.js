const jwt = require('jsonwebtoken');
const { User, Instructor, Membership } = require('../models');

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const token = header.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user = await User.findById(decoded.id || decoded.userId).select('-passwordHash');
    if (!user && decoded.id) {
      const instructor = await Instructor.findById(decoded.id).select('-passwordHash');
      if (instructor) {
        user = await User.findOne({ legacyInstructorId: instructor._id }).select('-passwordHash');
        if (!user) {
          req.instructor = instructor;
          req.user = {
            _id: instructor._id,
            email: instructor.email,
            name: instructor.name,
            isSuperAdmin: false,
            isLegacy: true,
          };
          req.memberships = [];
          return next();
        }
      }
    }

    if (!user || user.status === 'disabled') {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const memberships = await Membership.find({ userId: user._id }).lean();

    req.user = user;
    req.memberships = memberships;
    req.instructor = user.isLegacy ? user : { _id: user._id, email: user.email, name: user.name };
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const requireSuperAdmin = (req, res, next) => {
  if (!req.user?.isSuperAdmin) {
    return res.status(403).json({ message: 'Super admin access required' });
  }
  next();
};

module.exports = auth;
module.exports.requireSuperAdmin = requireSuperAdmin;
