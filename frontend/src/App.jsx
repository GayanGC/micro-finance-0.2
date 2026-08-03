import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SystemModeProvider } from './context/SystemModeContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/Layout/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Employees from './pages/Employees';
import Customers from './pages/Customers';
import Loans from './pages/Loans';
import Collections from './pages/Collections';
import BulkCollections from './pages/BulkCollections';
import MyActiveLoans from './pages/MyActiveLoans';
import MonthlySettlements from './pages/MonthlySettlements';
import PlaceholderView from './pages/PlaceholderView';
import Settings from './pages/Settings';
import Approvals from './pages/Approvals';
import Notifications from './pages/Notifications';
import AuditLogs from './pages/AuditLogs';
import RiskManagement from './pages/RiskManagement';
import Holidays from './pages/Holidays';

// Smart Home Index Redirect
const HomeRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'Customer') return <Navigate to="/profile" replace />;
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SystemModeProvider>
          <Router>
            <Routes>
              {/* Public Login Route */}
              <Route path="/login" element={<Login />} />

              {/* Root Home Route */}
              <Route path="/" element={<HomeRedirect />} />

              {/* Protected Dashboard Layout Shell */}
              <Route
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />

                {/* Settings — all authenticated users */}
                <Route path="/settings" element={<Settings />} />

                {/* Holiday Plan — Admin only */}
                <Route
                  path="/holidays"
                  element={
                    <ProtectedRoute allowedRoles={['Admin', 'super_admin']}>
                      <Holidays />
                    </ProtectedRoute>
                  }
                />

                {/* Admin & super_admin Routes */}
                <Route
                  path="/employees"
                  element={
                    <ProtectedRoute allowedRoles={['Admin', 'super_admin']}>
                      <Employees />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute allowedRoles={['Admin', 'super_admin', 'auditor']}>
                      <PlaceholderView title="Financial & Audit Reports" subtitle="Portfolio risk analysis, profit-and-loss statements, and audit trail logs." />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/audit-logs"
                  element={
                    <ProtectedRoute allowedRoles={['Admin', 'super_admin', 'auditor']}>
                      <AuditLogs />
                    </ProtectedRoute>
                  }
                />

                {/* Shared Admin, Agent, credit_officer Routes */}
                <Route
                  path="/customers"
                  element={
                    <ProtectedRoute allowedRoles={['Admin', 'Agent', 'super_admin', 'credit_officer']}>
                      <Customers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/loans"
                  element={
                    <ProtectedRoute allowedRoles={['Admin', 'Agent', 'super_admin', 'credit_officer']}>
                      <Loans />
                    </ProtectedRoute>
                  }
                />

                {/* Loan Approval Workflow — Enterprise Mode */}
                <Route
                  path="/approvals"
                  element={
                    <ProtectedRoute allowedRoles={['Admin', 'super_admin', 'credit_officer', 'Agent']}>
                      <Approvals />
                    </ProtectedRoute>
                  }
                />

                {/* Risk Management — credit officers and admins */}
                <Route
                  path="/risk-management"
                  element={
                    <ProtectedRoute allowedRoles={['Admin', 'super_admin', 'credit_officer', 'auditor']}>
                      <RiskManagement />
                    </ProtectedRoute>
                  }
                />

                {/* Notifications — all staff */}
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute allowedRoles={['Admin', 'Agent', 'super_admin', 'credit_officer', 'auditor']}>
                      <Notifications />
                    </ProtectedRoute>
                  }
                />

                {/* Collections — Admin & Agent */}
                <Route
                  path="/collections"
                  element={
                    <ProtectedRoute allowedRoles={['Admin', 'Agent', 'super_admin']}>
                      <Collections />
                    </ProtectedRoute>
                  }
                />

                {/* Bulk Collections — Field Officers / Cashiers */}
                <Route
                  path="/bulk-collections"
                  element={
                    <ProtectedRoute allowedRoles={['Admin', 'Agent', 'super_admin']}>
                      <BulkCollections />
                    </ProtectedRoute>
                  }
                />

                {/* Customer Specific Routes */}
                <Route
                  path="/active-loans"
                  element={
                    <ProtectedRoute allowedRoles={['Customer']}>
                      <MyActiveLoans />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settlements"
                  element={
                    <ProtectedRoute allowedRoles={['Customer']}>
                      <MonthlySettlements />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Fallback Catch-all Route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </SystemModeProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
