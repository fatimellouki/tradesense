import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'superadmin';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole) {
    const hasAccess =
      user?.role === requiredRole ||
      user?.role === 'superadmin' ||
      (requiredRole === 'admin' && user?.role === 'admin');

    if (!hasAccess) {
      return <Navigate to="/dashboard" />;
    }
  }

  return <>{children}</>;
}
