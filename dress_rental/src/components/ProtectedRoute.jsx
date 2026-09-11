import { Navigate, Outlet } from "react-router-dom";
import Fotter from "./Fotter";

const ProtectedRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user) {
    const role = user.role || user.type;
    if (!allowedRoles.includes(role)) {
      if (role === "admin") return <Navigate to="/admin" replace />;
      if (role === "provider") return <Navigate to="/provider-dashboard" replace />;
      return <Navigate to="/" replace />;
    }
  }

  return (
    <>
      <Outlet />
      <Fotter />
    </>
  );
};

export default ProtectedRoute;
