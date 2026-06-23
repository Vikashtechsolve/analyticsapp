const { Classroom } = require('../models');
const { canAccessClassroom } = require('../services/authz.service');

const loadClassroom = async (req, res, next) => {
  try {
    const id = req.params.id || req.params.classroomId;
    const classroom = await Classroom.findById(id);
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });
    req.classroom = classroom;
    next();
  } catch (err) {
    next(err);
  }
};

const ensureClassroomAccess = async (req, res, next) => {
  try {
    if (!req.classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    if (req.user?.isSuperAdmin) return next();

    const allowed = await canAccessClassroom(req.user._id, req.classroom, req.memberships);
    if (!allowed) return res.status(403).json({ message: 'Access denied' });

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  loadClassroom,
  ensureClassroomAccess,
};
