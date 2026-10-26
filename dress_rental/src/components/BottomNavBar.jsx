import React, { useState, useEffect } from "react";
import {
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  Badge,
  Box,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import HomeIcon from "@mui/icons-material/Home";
import CheckroomOutlinedIcon from "@mui/icons-material/CheckroomOutlined";
import CheckroomIcon from "@mui/icons-material/Checkroom";
import DiamondOutlinedIcon from "@mui/icons-material/DiamondOutlined";
import DiamondIcon from "@mui/icons-material/Diamond";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import PersonIcon from "@mui/icons-material/Person";
import LocalMallOutlinedIcon from "@mui/icons-material/LocalMallOutlined";
import LocalMallIcon from "@mui/icons-material/LocalMall";
import DryCleaningOutlinedIcon from "@mui/icons-material/DryCleaningOutlined";
import AuthModal from "./AuthModal";

export const BottomNavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [cartCount, setCartCount] = useState(0);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const updateCart = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        setCartCount(cart.length);
      } catch {
        setCartCount(0);
      }
    };
    const updateAuth = () => {
      setToken(localStorage.getItem("token"));
    };

    updateCart();
    updateAuth();

    window.addEventListener("cart_updated", updateCart);
    window.addEventListener("auth_updated", updateAuth);
    window.addEventListener("storage", updateAuth);
    return () => {
      window.removeEventListener("cart_updated", updateCart);
      window.removeEventListener("auth_updated", updateAuth);
      window.removeEventListener("storage", updateAuth);
    };
  }, []);

  // Determine current active tab
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === "/") return 0;
    if (path === "/w-dress") return 1;
    if (path === "/m-dress") return 2;
    if (path === "/jewellery") return 3;
    if (path === "/profile" || path === "/my-rentals" || path === "/provider-dashboard" || path === "/login") return 4;
    return -1;
  };

  const handleTabChange = (event, newValue) => {
    switch (newValue) {
      case 0:
        navigate("/");
        break;
      case 1:
        navigate("/w-dress");
        break;
      case 2:
        navigate("/m-dress");
        break;
      case 3:
        navigate("/jewellery");
        break;
      case 4:
        if (token) {
          navigate("/profile");
        } else {
          setAuthModalOpen(true);
        }
        break;
      default:
        break;
    }
  };

  return (
    <>
      <Paper
        elevation={8}
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
          display: { xs: "block", md: "none" },
          backgroundColor: "rgba(255, 255, 255, 0.96)",
          backdropFilter: "blur(16px)",
          borderTop: "1px solid #ECE7DE",
          boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.06)",
          paddingBottom: "env(safe-area-inset-bottom, 6px)",
        }}
      >
        <BottomNavigation
          showLabels
          value={getActiveTab()}
          onChange={handleTabChange}
          sx={{
            height: 62,
            backgroundColor: "transparent",
            "& .MuiBottomNavigationAction-root": {
              minWidth: "auto",
              padding: "6px 0",
              color: "#8E8880",
              transition: "all 0.2s ease",
              "& .MuiBottomNavigationAction-label": {
                fontSize: "0.68rem",
                fontWeight: 600,
                letterSpacing: "0.02em",
                marginTop: "2px",
                "&.Mui-selected": {
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  color: "#9C7238",
                },
              },
              "&.Mui-selected": {
                color: "#9C7238",
              },
            },
          }}
        >
          <BottomNavigationAction
            label="Home"
            icon={getActiveTab() === 0 ? <HomeIcon sx={{ fontSize: 22, color: "#9C7238" }} /> : <HomeOutlinedIcon sx={{ fontSize: 22 }} />}
          />
          <BottomNavigationAction
            label="Women"
            icon={getActiveTab() === 1 ? <CheckroomIcon sx={{ fontSize: 22, color: "#9C7238" }} /> : <CheckroomOutlinedIcon sx={{ fontSize: 22 }} />}
          />
          <BottomNavigationAction
            label="Men"
            icon={getActiveTab() === 2 ? <DryCleaningOutlinedIcon sx={{ fontSize: 22, color: "#9C7238" }} /> : <DryCleaningOutlinedIcon sx={{ fontSize: 22 }} />}
          />
          <BottomNavigationAction
            label="Jewellery"
            icon={getActiveTab() === 3 ? <DiamondIcon sx={{ fontSize: 22, color: "#9C7238" }} /> : <DiamondOutlinedIcon sx={{ fontSize: 22 }} />}
          />
          <BottomNavigationAction
            label={token ? "Profile" : "Account"}
            icon={
              getActiveTab() === 4 ? (
                <PersonIcon sx={{ fontSize: 22, color: "#9C7238" }} />
              ) : (
                <PersonOutlineOutlinedIcon sx={{ fontSize: 22 }} />
              )
            }
          />
        </BottomNavigation>
      </Paper>

      {/* Global Auth Modal Triggered from Bottom Bar */}
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab="login"
      />
    </>
  );
};

export default BottomNavBar;
