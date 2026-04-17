import { Navigate, useLocation } from "react-router-dom";
import type { ReactElement } from "react";

import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types";

interface ProtectedRouteProps {
  children: ReactElement;
  roles?: UserRole[];
}

const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
  const { isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 text-neutral-600 dark:text-neutral-300">
        Checking session...
      </div>
    );
  }

  if (!isAuthenticated) {
    const loginPath = roles?.includes("admin") ? "/admin/login" : "/login";
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (roles && (!role || !roles.includes(role))) {
    return <Navigate to="/artworks" replace />;
  }

  return children;
};

export default ProtectedRoute;
