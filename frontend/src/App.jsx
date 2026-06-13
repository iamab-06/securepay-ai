import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { LandingLayout } from './components/layout/landing-layout';
import { DashboardLayout } from './components/layout/dashboard-layout';
import AdminLayout from './components/layout/AdminLayout';

import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import LoginPage from './pages/auth/login';
import RegisterPage from './pages/auth/register';

// Pages
import LandingPage from './pages/landing';
import DashboardPage from './pages/dashboard';
import SendMoneyPage from './pages/send-money';
import BeneficiariesPage from './pages/beneficiaries';
import TransactionsPage from './pages/transactions';
import AddMoneyPage from './pages/add-money';
import AuditPage from './pages/audit';
import SecurityPage from './pages/security';
import SettingsPage from './pages/settings';
import KycPage from './pages/settings/kyc';
import PlaceholderPage from './pages/placeholder';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import KycQueue from './pages/admin/KycQueue';
import UserManagement from './pages/admin/UserManagement';
import WalletManagement from './pages/admin/WalletManagement';
import FraudManagement from './pages/admin/FraudManagement';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Landing Routes */}
            <Route element={<LandingLayout />}>
              <Route path="/" element={<LandingPage />} />
            </Route>
            
            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Protected Dashboard Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/send-money" element={<SendMoneyPage />} />
                <Route path="/add-money" element={<AddMoneyPage />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/beneficiaries" element={<BeneficiariesPage />} />
                <Route path="/insights" element={<PlaceholderPage title="AI Insights" />} />
                <Route path="/security" element={<SecurityPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/settings/kyc" element={<KycPage />} />
              </Route>
            </Route>

            {/* Admin Routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="kyc" element={<KycQueue />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="wallets" element={<WalletManagement />} />
                <Route path="fraud" element={<FraudManagement />} />
                <Route path="audit" element={<AuditPage />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
