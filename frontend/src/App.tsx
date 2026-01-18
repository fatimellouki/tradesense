import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { useUIStore } from './store/uiStore';
import { changeLanguage } from './i18n';

// Pages
import LandingPage from './components/LandingPage';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import Dashboard from './features/dashboard/Dashboard';
import PricingPage from './features/payment/PricingPage';
import PayPalCallback from './features/payment/PayPalCallback';
import LeaderboardPage from './features/leaderboard/LeaderboardPage';
import AdminDashboard from './features/admin/AdminDashboard';
import AdminLoginPage from './features/admin/AdminLoginPage';

// Components
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './features/auth/ProtectedRoute';

// Layout wrapper that conditionally shows Navbar
function AppLayout() {
  const location = useLocation();
  const { checkAuth, isAuthenticated } = useAuthStore();
  const { darkMode, language } = useUIStore();

  // Hide navbar on admin routes
  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
    }
  }, [darkMode]);

  // Sync i18next with Zustand language state on load and when language changes
  useEffect(() => {
    changeLanguage(language);
  }, [language]);

  return (
    <div className="min-h-screen">
      {!isAdminRoute && <Navbar />}
      <main>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />
          } />
          <Route path="/register" element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />
          } />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/payment/callback" element={<PayPalCallback />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          {/* Admin routes - completely separate, no navbar */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
