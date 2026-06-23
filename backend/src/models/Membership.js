const mongoose = require('mongoose');

const ROLES = ['org_admin', 'unit_admin', 'instructor'];

const membershipSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    orgUnitId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrgUnit', default: null },
    role: { type: String, enum: ROLES, required: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

membershipSchema.index({ userId: 1, orgId: 1, orgUnitId: 1, role: 1 }, { unique: true });
membershipSchema.index({ orgId: 1, orgUnitId: 1 });

module.exports = mongoose.model('Membership', membershipSchema);
module.exports.ROLES = ROLES;
