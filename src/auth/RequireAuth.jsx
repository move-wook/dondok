import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export default function RequireAuth({ children }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="p-8 text-center text-gray-500">로딩중…</div>;
  if (!session) return <Navigate to="/login" replace />;
  return children;
}
