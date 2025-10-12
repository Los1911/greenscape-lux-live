// Legacy component - redirects to shared ProtectedRoute
import ProtectedRoute from '../shared/ProtectedRoute';

interface ProProtectedRouteProps {
  children: React.ReactNode;
  waitForSession?: boolean;
}

export default function ProProtectedRoute({ 
  children, 
  waitForSession = false 
}: ProProtectedRouteProps) {
  return (
    <ProtectedRoute type="pro" waitForSession={waitForSession}>
      {children}
    </ProtectedRoute>
  );
}