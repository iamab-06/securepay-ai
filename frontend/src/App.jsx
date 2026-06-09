import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Layouts
import { LandingLayout } from './components/layout/landing-layout';
import { DashboardLayout } from './components/layout/dashboard-layout';

import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
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
import PlaceholderPage from './pages/placeholder';

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
                <Route path="/admin" element={<AuditPage />} />
                <Route path="/insights" element={<PlaceholderPage title="AI Insights" />} />
                <Route path="/security" element={<SecurityPage />} />
                <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
                <Route path="/admin" element={<PlaceholderPage title="Admin Panel" />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
