import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, X, ShieldCheck } from "lucide-react";
import { API, API_URL } from "../../config/env";
import { product, priceLabel } from "../../config/product";
import { track, trackPurchase } from "../../lib/tracking";
const Checkout = createContext(null);
const TOKEN = "stems_purchase_token";
const PENDING = "stems_pending_payment";
export function purchaseHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${sessionStorage.getItem(TOKEN) || ""}`,
  };
}
export async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { ...purchaseHeaders(), ...options.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : "Unable to complete the request. Please try again.",
    );
  return data;
}
let scriptPromise;
function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (!scriptPromise)
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      const timeout = setTimeout(() => {
        script.remove();
        scriptPromise = null;
        reject(new Error("Checkout took too long to load. Please try again."));
      }, 20000);
      script.onload = () => {
        clearTimeout(timeout);
        resolve();
      };
      script.onerror = () => {
        clearTimeout(timeout);
        script.remove();
        scriptPromise = null;
        reject(
          new Error(
            "Unable to load secure checkout. Check your connection and try again.",
          ),
        );
      };
      document.body.appendChild(script);
    });
  return scriptPromise;
}
export function CheckoutProvider({ children }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(Boolean(sessionStorage.getItem(PENDING)));
  const lock = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Prepare both remote dependencies while the visitor reads the page. Render
    // services can need time to wake, and Razorpay's SDK should already be in the
    // browser before the visitor asks to pay.
    loadCheckout().catch(() => {});
    if (API_URL) {
      fetch(`${API_URL}/health`, { cache: "no-store" }).catch(() => {});
    }
  }, []);
  const finish = () => {
    lock.current = false;
    setBusy(false);
  };
  async function verify(response) {
    sessionStorage.setItem(PENDING, JSON.stringify(response));
    setRetry(true);
    try {
      const receipt = await api("/product/verify-payment", {
        method: "POST",
        body: JSON.stringify(response),
      });
      sessionStorage.removeItem(PENDING);
      setRetry(false);
      setError("");
      trackPurchase(receipt);
      navigate("/download");
    } catch (e) {
      setError(e.message);
    } finally {
      finish();
    }
  }
  async function start() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    if (sessionStorage.getItem(PENDING)) {
      await verify(JSON.parse(sessionStorage.getItem(PENDING)));
      return;
    }
    try {
      // Reopen an existing verified purchase instead of charging again.
      if (sessionStorage.getItem(TOKEN)) {
        try {
          await api("/product/access");
          navigate("/download");
          finish();
          return;
        } catch (_) {
          /* Pending or expired */
        }
      }
      // Loading the SDK and creating the order are independent. Running them
      // together makes checkout wait for only the slower request, not both.
      const [order] = await Promise.all([
        api("/product/create-order", { method: "POST" }),
        loadCheckout(),
      ]);
      sessionStorage.setItem(TOKEN, order.token);
      track("InitiateCheckout", {
        value: order.amount / 100,
        currency: order.currency,
      });
      const checkout = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id,
        name: "Stems",
        description: product.name,
        theme: { color: "#2563eb" },
        handler: verify,
        modal: {
          ondismiss: () => {
            finish();
            setError(
              "Checkout closed. No download has been unlocked. You can try again when ready.",
            );
          },
        },
      });
      checkout.on("payment.failed", () => {
        setError(
          "Payment was unsuccessful. Please retry in checkout or close it and choose another method.",
        );
      });
      checkout.open();
    } catch (e) {
      setError(e.message);
      finish();
    }
  }
  return (
    <Checkout.Provider value={{ start, busy }}>
      {children}
      {(error || retry) && (
        <aside className="checkout-notice" role="status">
          <ShieldCheck size={22} />
          <div>
            <strong>
              {retry ? "Complete payment verification" : "Checkout update"}
            </strong>
            <p>
              {error ||
                "A payment is awaiting confirmation. Verify it before starting another purchase."}
            </p>
            {retry && (
              <button onClick={start} disabled={busy}>
                {busy ? "Verifying…" : "Retry verification"}
              </button>
            )}
          </div>
          {!retry && (
            <button
              aria-label="Dismiss checkout message"
              onClick={() => setError("")}
            >
              <X size={18} />
            </button>
          )}
        </aside>
      )}
    </Checkout.Provider>
  );
}
export function PaymentButton({ children, className = "" }) {
  const { start, busy } = useContext(Checkout);
  return (
    <button
      className={`st-button ${className}`}
      onClick={start}
      disabled={busy}
    >
      {busy
        ? "Opening secure checkout…"
        : children || `Get instant access — ${priceLabel}`}
      <ArrowUpRight size={18} />
    </button>
  );
}
