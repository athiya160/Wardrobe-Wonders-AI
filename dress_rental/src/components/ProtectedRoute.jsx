import { Navigate, Outlet, useLocation } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles && user) {
    const role = user.role || user.type;
    if (!allowedRoles.includes(role)) {
      if (role === "admin") return <Navigate to="/admin" replace />;
      if (role === "provider") return <Navigate to="/provider-dashboard" replace />;
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
