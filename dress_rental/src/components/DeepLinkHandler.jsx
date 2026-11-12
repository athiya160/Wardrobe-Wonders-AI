import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * DeepLinkHandler
 * Dynamically listens for Capacitor native appUrlOpen events (custom scheme dressr:// or App Links)
 * and navigates the React router to the target path and query parameters.
 */
const DeepLinkHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let urlListener = null;
    let backListener = null;

    const setupListeners = async () => {
      try {
        const { App: CapApp } = await import("@capacitor/app");

        // 1. Deep link listener for custom schemes and App Links
        urlListener = await CapApp.addListener("appUrlOpen", (event) => {
          try {
            const rawUrl = event.url;
            if (!rawUrl) return;

            let targetPath = "";
            let search = "";

            if (rawUrl.startsWith("dressr://")) {
              // Custom scheme format: dressr://verify-payment?transactionId=... or dressr://order-success
              const withoutScheme = rawUrl.replace("dressr://", "");
              const parts = withoutScheme.split("?");
              targetPath = `/${parts[0].replace(/^\//, "")}`;
              search = parts[1] ? `?${parts[1]}` : "";
            } else {
              // Verified App Link format: https://wardrobewonders.com/verify-payment?...
              const parsed = new URL(rawUrl);
              targetPath = parsed.pathname;
              search = parsed.search;
            }

            if (targetPath) {
              navigate(`${targetPath}${search}`);
            }
          } catch (err) {
            console.warn("DeepLinkHandler error parsing URL:", event.url, err);
          }
        });

        // 2. Android hardware back button listener
        backListener = await CapApp.addListener("backButton", ({ canGoBack }) => {
          const currentPath = window.location.pathname;
          if (currentPath === "/signup" || currentPath === "/sign-up") {
            navigate("/login");
          } else if (currentPath === "/login" || currentPath === "/" || !canGoBack) {
            CapApp.exitApp();
          } else {
            window.history.back();
          }
        });
      } catch {
        // Not running in native Capacitor environment
      }
    };

    setupListeners();

    return () => {
      if (urlListener && typeof urlListener.remove === "function") {
        urlListener.remove();
      }
      if (backListener && typeof backListener.remove === "function") {
        backListener.remove();
      }
    };
  }, [navigate]);

  return null;
};

export default DeepLinkHandler;
