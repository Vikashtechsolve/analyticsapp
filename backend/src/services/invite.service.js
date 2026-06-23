const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { User, Invite, Membership } = require('../models');
const { canInviteRole } = require('./authz.service');

const INVITE_DAYS = 7;

const createInviteToken = () => crypto.randomBytes(32).toString('hex');

const createInvite = async ({ email, name, orgId, orgUnitId, role, invitedBy, inviterMemberships }) => {
  if (!canInviteRole(inviterMemberships, role)) {
    throw new Error('You cannot invite users with this role');
  }

  const existing = await Invite.findOne({
    email: email.toLowerCase(),
    orgId,
    acceptedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  });
  if (existing) {
    throw new Error('An active invite already exists for this email');
  }

  const token = createInviteToken();
  const invite = await Invite.create({
    email: email.toLowerCase(),
    name: name || '',
    orgId,
    orgUnitId: orgUnitId || null,
    role,
    token,
    invitedBy,
    expiresAt: new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000),
  });

  return invite;
};

const acceptInvite = async ({ token, password, name }) => {
  const invite = await Invite.findOne({ token });
  if (!invite) throw new Error('Invalid invite link');
  if (invite.acceptedAt) throw new Error('Invite already used');
  if (invite.expiresAt < new Date()) throw new Error('Invite has expired');

  let user = await User.findOne({ email: invite.email });
  if (!user) {
    const passwordHash = await bcrypt.hash(password, 10);
    user = await User.create({
      email: invite.email,
      passwordHash,
      name: name || invite.name || invite.email.split('@')[0],
    });
  }

  await Membership.findOneAndUpdate(
    {
      userId: user._id,
      orgId: invite.orgId,
      orgUnitId: invite.orgUnitId,
      role: invite.role,
    },
    {
      userId: user._id,
      orgId: invite.orgId,
      orgUnitId: invite.orgUnitId,
      role: invite.role,
      invitedBy: invite.invitedBy,
    },
    { upsert: true, new: true }
  );

  invite.acceptedAt = new Date();
  await invite.save();

  return { user, invite };
};

module.exports = { createInvite, acceptInvite, INVITE_DAYS };
