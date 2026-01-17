import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { useUIStore } from './store/uiStore';

// Pages
import LandingPage from './components/LandingPage';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import Dashboard from './features/dashboard/Dashboard';
import PricingPage from './features/payment/PricingPage';
import LeaderboardPage from './features/leaderboard/LeaderboardPage';
import AdminDashboard from './features/admin/AdminDashboard';

// Components
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './features/auth/ProtectedRoute';

function App() {
  const { checkAuth, isAuthenticated } = useAuthStore();
  const { darkMode } = useUIStore();

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

  return (
    <Router>
      <div className="min-h-screen">
        <Navbar />
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
            <Route path="/leaderboard" element={<LeaderboardPage />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            {/* Admin routes */}
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
    </Router>
  );
}

export default App;
