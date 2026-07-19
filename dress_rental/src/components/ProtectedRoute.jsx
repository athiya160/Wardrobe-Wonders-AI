import { Navigate, Outlet } from "react-router-dom";
import Fotter from "./Fotter";
const ProtectedRoute = () => {
  const token = localStorage.getItem("token");
  if (!token) <Navigate to="login" />;
  return (
    <>
      <Outlet />
      <Fotter />
    </>
  );
};

export default ProtectedRoute;
