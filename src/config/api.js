/**
 * Centralized API route constants.
 *
 * Usage:
 *   import { API_ROUTES } from "./config/api";
 *   axios.post(`${API}${API_ROUTES.GENERATE_ANSWER}`, payload, options);
 *
 * With REACT_APP_BACKEND_URL=http://localhost:8000 this resolves to:
 *   http://localhost:8000/api/ai/generate-answer
 */
export const API_ROUTES = {
  // AI endpoints
  GENERATE_ANSWER: "/ai/generate-answer",
  AI_CHAT: "/ai/chat",
  AI_TEACH: "/ai/teach",
  AI_CASE_LAW_CHAT: "/ai/case-law-chat",
  AI_DRAFTING_CHAT: "/ai/drafting-chat",
};
