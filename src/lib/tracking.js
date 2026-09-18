// No trackers are loaded without configured IDs AND explicit consent.
export const CONSENT_KEY = "stems_analytics_consent";
export const PIXEL_ID = process.env.REACT_APP_META_PIXEL_ID;

export function hasConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY) === "granted";
  } catch (_) {
    return false;
  }
}

// PageView is sent once per path so the base-code call and the storefront's own
// call do not double-count, while SPA route changes still register.
let lastPageViewPath = null;

// Meta base code. The stub queues calls made before fbevents.js finishes
// loading, so events fired right after init are not lost.
function loadPixel() {
  if (!PIXEL_ID || window.fbq) return;
  const fbq = (window.fbq = function () {
    fbq.callMethod
      ? fbq.callMethod.apply(fbq, arguments)
      : fbq.queue.push(arguments);
  });
  if (!window._fbq) window._fbq = fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
  fbq("init", PIXEL_ID);
}

// Safe to call repeatedly: on app start, and again the moment consent is given.
export function initTracking() {
  if (!hasConsent()) return;
  loadPixel();
  track("PageView");
}

export function track(event, data = {}) {
  if (!hasConsent()) return;
  const ga = process.env.REACT_APP_GA4_ID;
  if (event === "PageView") {
    const path = window.location.pathname;
    if (path === lastPageViewPath) return;
    lastPageViewPath = path;
  }
  if (PIXEL_ID && window.fbq) window.fbq("track", event, data);
  const names = {
    PageView: "page_view",
    ViewContent: "view_item",
    InitiateCheckout: "begin_checkout",
    Purchase: "purchase",
  };
  if (ga && window.gtag) window.gtag("event", names[event] || event, data);
}

// Called only with the successful server verification response.
export function trackPurchase(receipt) {
  const key = `stems_purchase_${receipt.payment_id}`;
  if (localStorage.getItem(key)) return;
  track("Purchase", {
    value: receipt.value,
    currency: receipt.currency,
    transaction_id: receipt.payment_id,
  });
  localStorage.setItem(key, "1");
}
