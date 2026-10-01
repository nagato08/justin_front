import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { UserRole } from "../lib/types";
import { Spinner } from "./ui";

export function ProtectedRoute({ roles }: { roles: UserRole[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="screen-center"><Spinner /></div>;
  if (!user) return <Navigate to="/connexion" state={{ from: location.pathname }} replace />;
  if (!roles.includes(user.role)) {
    return <Navigate to={user.role === "ADMIN" ? "/admin" : user.role === "DELIVERER" ? "/driver" : "/"} replace />;
  }
  return <Outlet />;
}
