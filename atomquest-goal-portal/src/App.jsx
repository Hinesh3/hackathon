import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { LoadingScreen } from './components/UI';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';

// Employee
import EmployeeDashboard from './pages/employee/Dashboard';
import GoalsList from './pages/employee/GoalsList';
import NewGoal from './pages/employee/NewGoal';
import GoalDetail from './pages/employee/GoalDetail';

// Manager
import ManagerDashboard from './pages/manager/Dashboard';
import TeamView from './pages/manager/TeamView';
import Approvals from './pages/manager/Approvals';

// Admin
import AdminDashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
import Cycles from './pages/admin/Cycles';
import Reports from './pages/admin/Reports';
import AuditLog from './pages/admin/AuditLog';
import SharedGoals from './pages/admin/SharedGoals';

function Protected({ children, roles }) {
  const { user, userData, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(userData?.role)) return <Navigate to={`/${userData?.role}/dashboard`} replace />;
  return children;
}

function AppShell({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}

function RoleRedirect() {
  const { userData } = useAuth();
  if (!userData) return <Navigate to="/login" replace />;
  return <Navigate to={`/${userData.role}/dashboard`} replace />;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return (
    <Routes>
      <Route path="/login" element={user ? <RoleRedirect /> : <Login />} />
      <Route path="/" element={<Protected><RoleRedirect /></Protected>} />

      {/* Employee */}
      <Route path="/employee/dashboard" element={<Protected roles={['employee']}><AppShell><EmployeeDashboard /></AppShell></Protected>} />
      <Route path="/employee/goals" element={<Protected roles={['employee']}><AppShell><GoalsList /></AppShell></Protected>} />
      <Route path="/employee/goals/new" element={<Protected roles={['employee']}><AppShell><NewGoal /></AppShell></Protected>} />
      <Route path="/employee/goals/:id" element={<Protected roles={['employee']}><AppShell><GoalDetail /></AppShell></Protected>} />

      {/* Manager */}
      <Route path="/manager/dashboard" element={<Protected roles={['manager']}><AppShell><ManagerDashboard /></AppShell></Protected>} />
      <Route path="/manager/team" element={<Protected roles={['manager']}><AppShell><TeamView /></AppShell></Protected>} />
      <Route path="/manager/team/:id" element={<Protected roles={['manager']}><AppShell><TeamView /></AppShell></Protected>} />
      <Route path="/manager/approvals" element={<Protected roles={['manager']}><AppShell><Approvals /></AppShell></Protected>} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={<Protected roles={['admin']}><AppShell><AdminDashboard /></AppShell></Protected>} />
      <Route path="/admin/users" element={<Protected roles={['admin']}><AppShell><Users /></AppShell></Protected>} />
      <Route path="/admin/cycles" element={<Protected roles={['admin']}><AppShell><Cycles /></AppShell></Protected>} />
      <Route path="/admin/reports" element={<Protected roles={['admin']}><AppShell><Reports /></AppShell></Protected>} />
      <Route path="/admin/audit" element={<Protected roles={['admin']}><AppShell><AuditLog /></AppShell></Protected>} />
      <Route path="/admin/shared-goals" element={<Protected roles={['admin']}><AppShell><SharedGoals /></AppShell></Protected>} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1A2540', color: '#E2E8F0', border: '1px solid #2a3a5c', fontSize: '0.875rem' },
            success: { iconTheme: { primary: '#10B981', secondary: '#1A2540' } },
            error: { iconTheme: { primary: '#F43F5E', secondary: '#1A2540' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
