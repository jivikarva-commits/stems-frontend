import { API } from "../config/env";

const CLICK_VISITOR = "stems_access_click_visitor";

export function trackAccessClick() {
  try {
    let visitorId = localStorage.getItem(CLICK_VISITOR);
    if (!visitorId) {
      visitorId =
        window.crypto?.randomUUID?.() ||
        `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(CLICK_VISITOR, visitorId);
    }
    fetch(`${API}/product/access-click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitor_id: visitorId }),
      keepalive: true,
    }).catch(() => {});
  } catch (_) {
    // Analytics must never delay or block checkout.
  }
}
