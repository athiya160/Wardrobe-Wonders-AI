import axios from "axios";

/**
 * Dynamic API Base URL configuration for Web and Capacitor Android environments.
 * 
 * - Web (Development): Defaults to http://localhost:4000
 * - Web (Production): Uses VITE_API_URL configured at build time (e.g. https://api.wardrobewonders.com)
 * - Android Capacitor: Uses VITE_API_URL if provided. In development mode on Capacitor, warns if localhost is used.
 */

// Allow tunnels (like localtunnel / ngrok) to pass API calls directly without interstitial browser warnings
axios.defaults.headers.common["bypass-tunnel-reminder"] = "true";
axios.defaults.headers.common["ngrok-skip-browser-warning"] = "true";

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, "");
  }

  // Detect Capacitor native mobile environment
  const isCapacitor = typeof window !== "undefined" && Boolean(window.Capacitor?.isNativePlatform?.());
  if (isCapacitor) {
    console.warn(
      "[Mobile API Config] Running inside Capacitor native container without VITE_API_URL. " +
      "Connecting to 'https://wardrobe-wonders-ai.onrender.com' fallback."
    );
    return "https://wardrobe-wonders-ai.onrender.com";
  }

  // In production builds (Vercel/Render), default to live backend if env var is omitted
  if (import.meta.env.PROD) {
    return "https://wardrobe-wonders-ai.onrender.com";
  }

  return "http://localhost:4000";
};

export const BASE_URL = getApiBaseUrl();
