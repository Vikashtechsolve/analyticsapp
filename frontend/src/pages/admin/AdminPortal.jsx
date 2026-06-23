import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/client';
import { highestRoleInOrg, isInstructorRole } from '../../utils/orgRoles';
import SuperAdminDashboard from './SuperAdminDashboard';
import OrgDashboard from './OrgDashboard';
import InstructorOrgDashboard from './InstructorOrgDashboard';
import LegacyInstructorDashboard from './LegacyInstructorDashboard';

export default function AdminPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi
      .me()
      .then((res) => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem('token');
        navigate('/admin/login');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 animate-pulse">Loading portal…</p>
      </div>
    );
  }

  if (user?.isSuperAdmin) {
    return <SuperAdminDashboard user={user} />;
  }

  if (user?.isLegacy || !user?.memberships?.length) {
    return <LegacyInstructorDashboard user={user} />;
  }

  const orgId = user.memberships[0]?.org?._id;
  const role = highestRoleInOrg(user.memberships, orgId);
  if (isInstructorRole(role)) {
    return <InstructorOrgDashboard user={user} />;
  }

  return <OrgDashboard user={user} />;
}
