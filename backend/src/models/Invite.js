const mongoose = require('mongoose');
const { ROLES } = require('./Membership');

const inviteSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, trim: true, default: '' },
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    orgUnitId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrgUnit', default: null },
    role: { type: String, enum: ROLES, required: true },
    token: { type: String, required: true, unique: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
    acceptedAt: { type: Date },
  },
  { timestamps: true }
);

inviteSchema.index({ email: 1, orgId: 1, acceptedAt: 1 });

module.exports = mongoose.model('Invite', inviteSchema);
