const trimTrailingSlash = (url = "") => url.replace(/\/+$/, "");
// CRA replaces explicit REACT_APP references at build time; dynamic lookups do not work.
export const API_URL = trimTrailingSlash(
  process.env.REACT_APP_BACKEND_URL ||
    process.env.REACT_APP_API_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://store-api.stemsai.in"
      : ""),
);
export const API = `${API_URL}/api`;
export const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";
export const RAZORPAY_KEY_ID = process.env.REACT_APP_RAZORPAY_KEY_ID || "";
