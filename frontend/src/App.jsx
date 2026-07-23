import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/Layout/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Employees from './pages/Employees';
import Customers from './pages/Customers';
import Loans from './pages/Loans';
import Collections from './pages/Collections';
import MyActiveLoans from './pages/MyActiveLoans';
import MonthlySettlements from './pages/MonthlySettlements';
import PlaceholderView from './pages/PlaceholderView';

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

              {/* Admin Specific Routes */}
              <Route
                path="/employees"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <Employees />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <PlaceholderView title="Financial & Audit Reports" subtitle="Portfolio risk analysis, profit-and-loss statements, and audit trail logs." />
                  </ProtectedRoute>
                }
              />

              {/* Shared Admin & Agent Routes */}
              <Route
                path="/customers"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Agent']}>
                    <Customers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/loans"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Agent']}>
                    <Loans />
                  </ProtectedRoute>
                }
              />

              {/* Agent Specific Routes */}
              <Route
                path="/collections"
                element={
                  <ProtectedRoute allowedRoles={['Agent']}>
                    <Collections />
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
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
