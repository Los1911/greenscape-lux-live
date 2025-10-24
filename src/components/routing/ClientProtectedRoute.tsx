// Legacy component - redirects to shared ProtectedRoute
import ProtectedRoute from '../shared/ProtectedRoute';

interface ClientProtectedRouteProps {
  children: React.ReactNode;
}

export default function ClientProtectedRoute({ children }: ClientProtectedRouteProps) {
  return (
    <ProtectedRoute type="client">
      {children}
    </ProtectedRoute>
  );
}