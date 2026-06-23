import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import ClassroomDashboard from './pages/public/ClassroomDashboard';
import StudentProfile from './pages/public/StudentProfile';
import JoinClassroom from './pages/public/JoinClassroom';
import AdminLogin from './pages/admin/AdminLogin';
import AdminRegister from './pages/admin/AdminRegister';
import AdminPortal from './pages/admin/AdminPortal';
import OrgDashboard from './pages/admin/OrgDashboard';
import ClassroomManage from './pages/admin/ClassroomManage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/c/:slug" element={<ClassroomDashboard />} />
      <Route path="/c/:slug/join" element={<JoinClassroom />} />
      <Route path="/c/:slug/student/:studentId" element={<StudentProfile />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/register" element={<AdminRegister />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPortal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orgs/:orgId"
        element={
          <ProtectedRoute>
            <OrgDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/classrooms/:id"
        element={
          <ProtectedRoute>
            <ClassroomManage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
