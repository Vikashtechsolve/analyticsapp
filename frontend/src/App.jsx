import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Footer from './components/Footer';
import { Skeleton } from './components/ui/Skeleton';

const Home = lazy(() => import('./pages/Home'));
const ClassroomDashboard = lazy(() => import('./pages/public/ClassroomDashboard'));
const StudentProfile = lazy(() => import('./pages/public/StudentProfile'));
const JoinClassroom = lazy(() => import('./pages/public/JoinClassroom'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminRegister = lazy(() => import('./pages/admin/AdminRegister'));
const AdminPortal = lazy(() => import('./pages/admin/AdminPortal'));
const OrgDashboard = lazy(() => import('./pages/admin/OrgDashboard'));
const ClassroomManage = lazy(() => import('./pages/admin/ClassroomManage'));

function PageFallback() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-7xl mx-auto space-y-4">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">
        <Suspense fallback={<PageFallback />}>
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
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}
