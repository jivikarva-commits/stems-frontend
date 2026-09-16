// No trackers are loaded without configured IDs AND explicit consent.
export function track(event, data = {}) {
  if (localStorage.getItem("stems_analytics_consent") !== "granted") return;
  const pixel = process.env.REACT_APP_META_PIXEL_ID;
  const ga = process.env.REACT_APP_GA4_ID;
  if (pixel && window.fbq) window.fbq("track", event, data);
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
