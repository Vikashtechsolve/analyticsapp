const bcrypt = require('bcryptjs');
const {
  Instructor,
  User,
  Organization,
  OrgUnit,
  Membership,
  Classroom,
} = require('../models');
const { slugify } = require('../utils/slugify');

const bootstrapSuperAdmin = async () => {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  if (!email || !password) return;

  let user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    const passwordHash = await bcrypt.hash(password, 10);
    user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      name: process.env.SUPER_ADMIN_NAME || 'Super Admin',
      isSuperAdmin: true,
    });
    console.log(`Super admin created: ${email}`);
  } else if (!user.isSuperAdmin) {
    user.isSuperAdmin = true;
    await user.save();
    console.log(`Super admin flag set for: ${email}`);
  }
};

const migrateInstructors = async () => {
  const instructors = await Instructor.find();
  for (const instructor of instructors) {
    let user = await User.findOne({ legacyInstructorId: instructor._id });
    if (!user) {
      user = await User.findOne({ email: instructor.email });
    }
    if (!user) {
      user = await User.create({
        email: instructor.email,
        passwordHash: instructor.passwordHash,
        name: instructor.name,
        legacyInstructorId: instructor._id,
      });
    } else if (!user.legacyInstructorId) {
      user.legacyInstructorId = instructor._id;
      await user.save();
    }

    const hasOrg = await Membership.findOne({ userId: user._id });
    if (hasOrg) continue;

    const orgName = `${instructor.name}'s Organization`;
    let slug = slugify(orgName);
    const existingOrg = await Organization.findOne({ slug });
    if (existingOrg) slug = `${slug}-${instructor._id.toString().slice(-6)}`;

    const org = await Organization.create({ name: orgName, slug });
    const rootUnit = await OrgUnit.create({
      orgId: org._id,
      parentId: null,
      type: 'root',
      name: orgName,
      slug: 'root',
    });

    await Membership.create({
      userId: user._id,
      orgId: org._id,
      orgUnitId: null,
      role: 'org_admin',
    });

    const classrooms = await Classroom.find({ instructorId: instructor._id });
    for (const classroom of classrooms) {
      if (!classroom.orgId) {
        classroom.orgId = org._id;
        classroom.orgUnitId = rootUnit._id;
        classroom.createdBy = user._id;
        await classroom.save();
      }
    }
  }
};

module.exports = { bootstrapSuperAdmin, migrateInstructors };
