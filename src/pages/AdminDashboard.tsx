import { Navigate } from 'react-router-dom'

/**
 * AdminDashboard — redirects to /admin
 *
 * All admin section rendering is now handled by AdminLayout
 * via state-based section selection (no route-based navigation).
 */
export default function AdminDashboard() {
  return <Navigate to="/admin" replace />
}
