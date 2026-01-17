import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'superadmin';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  // Redirect to appropriate login page based on route type
  if (!isAuthenticated) {
    // Admin routes redirect to admin login
    if (requiredRole === 'admin' || requiredRole === 'superadmin') {
      return <Navigate to="/admin/login" />;
    }
    return <Navigate to="/login" />;
  }

  if (requiredRole) {
    const hasAccess =
      user?.role === requiredRole ||
      user?.role === 'superadmin' ||
      (requiredRole === 'admin' && user?.role === 'admin');

    if (!hasAccess) {
      // Non-admin trying to access admin - redirect to admin login
      return <Navigate to="/admin/login" />;
    }
  }

  return <>{children}</>;
}
