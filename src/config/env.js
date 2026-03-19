const trimTrailingSlash = (url = "") => url.replace(/\/+$/, "");

const viteEnv = typeof import.meta !== "undefined" ? import.meta.env : {};

const readEnv = (...keys) => {
  for (const key of keys) {
    const value = viteEnv?.[key] ?? process.env[key];
    if (value) {
      return value;
    }
  }
  return "";
};

export const API_URL = trimTrailingSlash(
  readEnv("VITE_API_URL", "REACT_APP_BACKEND_URL", "REACT_APP_API_URL")
);
export const API = `${API_URL}/api`;
export const GOOGLE_CLIENT_ID =
  readEnv("VITE_GOOGLE_CLIENT_ID", "REACT_APP_GOOGLE_CLIENT_ID");
export const RAZORPAY_KEY_ID =
  readEnv("VITE_RAZORPAY_KEY_ID", "REACT_APP_RAZORPAY_KEY_ID");
