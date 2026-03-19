import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useAuth, API } from "../App";
import { RAZORPAY_KEY_ID } from "../config/env";
import {
  CreditCard, Check, Sparkles, Crown, Zap, Star, Gift,
  RefreshCw, AlertCircle, TrendingUp, Loader2, ChevronRight
} from "lucide-react";

function getAuthHeaders() {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Load Razorpay SDK ─────────────────────────────────────────────────────────
function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ── Plan config (UI) ──────────────────────────────────────────────────────────
const PLAN_ICONS = {
  free:    <Star size={22} />,
  starter: <Gift size={22} />,
  basic:   <Zap size={22} />,
  pro:     <Crown size={22} />,
};

const PLAN_THEME = {
  free:    { icon: "#64748b", iconBg: "#f1f5f9", border: "rgba(100,116,139,0.2)", badge: null },
  starter: { icon: "#16a34a", iconBg: "#dcfce7", border: "rgba(22,163,74,0.35)",  badge: "green" },
  basic:   { icon: "#6366f1", iconBg: "#eef2ff", border: "rgba(99,102,241,0.45)", badge: "indigo" },
  pro:     { icon: "#d97706", iconBg: "#fef3c7", border: "rgba(217,119,6,0.45)",  badge: "amber" },
};

const BADGE_STYLE = {
  green:  { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  indigo: { bg: "#eef2ff", color: "#4f46e5", border: "#c7d2fe" },
  amber:  { bg: "#fef3c7", color: "#b45309", border: "#fde68a" },
};

const FEATURE_ICONS = {
  ai_queries:     "🤖",
  mock_tests:     "📝",
  draft_evals:    "✍️",
  case_laws:      "⚖️",
  revision_notes: "📖",
  study_planner:  "📅",
  analytics:      "📊",
  video:          "🎥",
  priority:       "⚡",
  reset_note:     "🔄",
};

// ── Usage Bar ─────────────────────────────────────────────────────────────────
function UsageBar({ label, used, limit, color = "#6366f1" }) {
  const pct = limit === -1 ? 100 : Math.min((used / limit) * 100, 100);
  const isUnlimited = limit === -1;
  const isWarning = !isUnlimited && pct >= 80;
  const barColor = isWarning ? "#ef4444" : color;

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>{label}</span>
        <span style={{ fontSize: 11, color: isWarning ? "#ef4444" : "#94a3b8" }}>
          {isUnlimited ? "Unlimited" : `${used} / ${limit}`}
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: "#e2e8f0", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 99, transition: "width 0.5s" }} />
      </div>
    </div>
  );
}

// ── Plan Card ─────────────────────────────────────────────────────────────────
function PlanCard({ plan, currentPlan, onUpgrade, loading }) {
  const theme = PLAN_THEME[plan.plan] || PLAN_THEME.free;
  const badge = plan.badge ? BADGE_STYLE[theme.badge] : null;
  const isCurrent = currentPlan?.plan === plan.plan;
  const isFree = plan.plan === "free";
  const isPaying = loading === plan.plan;

  const features = Object.entries(plan.features || {});

  return (
    <div style={{
      background: "white",
      border: `2px solid ${isCurrent ? theme.border : "rgba(226,232,240,0.8)"}`,
      borderRadius: 20,
      overflow: "hidden",
      position: "relative",
      boxShadow: isCurrent ? `0 0 0 4px ${theme.iconBg}` : "0 1px 4px rgba(0,0,0,0.06)",
      transition: "all 0.2s",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Badge */}
      {plan.badge && badge && (
        <div style={{
          position: "absolute", top: 14, right: 14,
          background: badge.bg, color: badge.color,
          border: `1px solid ${badge.border}`,
          borderRadius: 20, padding: "3px 10px",
          fontSize: 10, fontWeight: 800,
          letterSpacing: "0.06em", textTransform: "uppercase",
        }}>{plan.badge}</div>
      )}
      {isCurrent && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, ${theme.icon}, ${theme.iconBg})`,
        }} />
      )}

      {/* Header */}
      <div style={{ padding: "28px 24px 20px", textAlign: "center" }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, margin: "0 auto 14px",
          background: theme.iconBg, color: theme.icon,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>{PLAN_ICONS[plan.plan]}</div>

        <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>{plan.name}</h3>

        <div style={{ margin: "12px 0 6px", display: "flex", alignItems: "baseline", justifyContent: "center", gap: 2 }}>
          <span style={{ fontSize: 34, fontWeight: 900, color: "#0f172a" }}>{plan.price_display}</span>
          {plan.period && <span style={{ fontSize: 13, color: "#94a3b8", marginLeft: 3 }}>{plan.period}</span>}
        </div>
        <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.5 }}>{plan.description}</p>

        {plan.one_time && (
          <div style={{ marginTop: 8, fontSize: 11, color: "#16a34a", fontWeight: 700, background: "#f0fdf4", padding: "3px 10px", borderRadius: 20, display: "inline-block" }}>
            ✓ One-time purchase — lifetime offer
          </div>
        )}
      </div>

      {/* Features */}
      <div style={{ padding: "0 24px 20px", flex: 1 }}>
        <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
          {features.map(([key, val]) => (
            <div key={key} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
              <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{FEATURE_ICONS[key] || "•"}</span>
              <span style={{ fontSize: 13, color: "#475569", lineHeight: 1.5 }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: "0 24px 24px" }}>
        <button
          onClick={() => !isCurrent && !isFree && onUpgrade(plan.plan)}
          disabled={isCurrent || isFree || isPaying}
          style={{
            width: "100%", padding: "12px 16px", borderRadius: 12,
            border: "none", cursor: isCurrent || isFree ? "default" : "pointer",
            fontSize: 14, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            background: isCurrent
              ? theme.iconBg
              : isFree
                ? "#f1f5f9"
                : plan.plan === "pro"
                  ? "linear-gradient(135deg,#d97706,#b45309)"
                  : plan.plan === "starter"
                    ? "linear-gradient(135deg,#16a34a,#15803d)"
                    : "linear-gradient(135deg,#6366f1,#4f46e5)",
            color: isCurrent ? theme.icon : isFree ? "#94a3b8" : "white",
            opacity: (isCurrent || isFree) ? 0.85 : 1,
            transition: "all 0.18s",
          }}
        >
          {isPaying ? (
            <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Processing...</>
          ) : isCurrent ? (
            <><Check size={15} /> Current Plan</>
          ) : isFree ? (
            "Free Plan"
          ) : (
            <><Sparkles size={15} /> {plan.plan === "starter" ? "Claim Offer" : "Upgrade Now"} <ChevronRight size={14} /></>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SubscriptionPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [currentSub, setCurrentSub] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [payLoading, setPayLoading] = useState(null); // plan key being processed

  const fetchData = useCallback(async () => {
    setPageLoading(true);
    try {
      const [plansRes, subRes] = await Promise.all([
        axios.get(`${API}/subscription/plans`, { headers: getAuthHeaders(), withCredentials: true }),
        axios.get(`${API}/subscription/current`, { headers: getAuthHeaders(), withCredentials: true }),
      ]);
      setPlans(plansRes.data.plans || []);
      setCurrentSub(subRes.data);
    } catch (err) {
      toast.error("Failed to load subscription data");
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Razorpay payment flow ─────────────────────────────────────────────────
  const handleUpgrade = async (planKey) => {
    setPayLoading(planKey);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) { toast.error("Could not load payment gateway. Check your internet connection."); return; }

      // 1. Create order on backend
      const orderRes = await axios.post(
        `${API}/subscription/create-order`,
        { plan: planKey },
        { headers: { ...getAuthHeaders(), "Content-Type": "application/json" }, withCredentials: true }
      );
      const { order_id, amount, currency } = orderRes.data;
      // Key ID read from env var — secret stays on server only
      const key = RAZORPAY_KEY_ID;

      // 2. Open Razorpay checkout
      await new Promise((resolve, reject) => {
        const options = {
          key,
          amount,
          currency,
          name: "STEMS AI",
          description: `${planKey.charAt(0).toUpperCase() + planKey.slice(1)} Plan`,
          order_id,
          prefill: {
            name: user?.name || "",
            email: user?.email || "",
          },
          theme: { color: planKey === "pro" ? "#d97706" : planKey === "starter" ? "#16a34a" : "#6366f1" },
          handler: async (response) => {
            try {
              // 3. Verify payment on backend
              const verifyRes = await axios.post(
                `${API}/subscription/verify-payment`,
                {
                  razorpay_order_id:   response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature:  response.razorpay_signature,
                  plan: planKey,
                },
                { headers: { ...getAuthHeaders(), "Content-Type": "application/json" }, withCredentials: true }
              );
              toast.success(verifyRes.data.message || "Subscription activated! 🎉");
              await fetchData(); // refresh UI
              resolve();
            } catch (err) {
              toast.error("Payment verification failed. Contact support with your payment ID.");
              reject(err);
            }
          },
          modal: {
            ondismiss: () => { toast("Payment cancelled."); resolve(); },
          },
        };
        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (resp) => {
          toast.error(`Payment failed: ${resp.error?.description || "Unknown error"}`);
          resolve();
        });
        rzp.open();
      });

    } catch (err) {
      const detail = err?.response?.data?.detail || err.message;
      if (detail?.includes("Starter plan already used")) {
        toast.error("You've already used the New User Offer.");
        await fetchData();
      } else {
        toast.error(`Payment error: ${detail || "Please try again."}`);
      }
    } finally {
      setPayLoading(null);
    }
  };

  if (pageLoading) {
    return (
      <DashboardLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 260, gap: 12, color: "#94a3b8" }}>
          <Loader2 size={22} style={{ animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: 15 }}>Loading plans...</span>
        </div>
      </DashboardLayout>
    );
  }

  const planLimits = currentSub?.limits || {};

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>

        {/* ── Page Header ── */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", margin: "0 0 8px", fontFamily: "'Outfit',sans-serif" }}>
            Choose Your Plan
          </h1>
          <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>
            Unlock your full CS exam potential with the right plan
          </p>
        </div>

        {/* ── Current Plan Banner ── */}
        {currentSub && currentSub.plan !== "free" && (
          <div style={{
            background: "linear-gradient(135deg,#4f46e5,#6366f1)",
            borderRadius: 16, padding: "20px 24px", marginBottom: 28,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 12, color: "white",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CreditCard size={20} />
              </div>
              <div>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Active Plan</p>
                <p style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
                  {currentSub.plan.charAt(0).toUpperCase() + currentSub.plan.slice(1)}
                </p>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              {currentSub.expires_at && (
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", margin: "0 0 2px" }}>
                  Expires {new Date(currentSub.expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              )}
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", margin: 0 }}>
                {currentSub.ai_queries_used} / {currentSub.ai_queries_limit === -1 ? "∞" : currentSub.ai_queries_limit} AI queries used
              </p>
            </div>
          </div>
        )}

        {/* ── Usage Tracker (paid plans) ── */}
        {currentSub && currentSub.plan !== "free" && (
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px 24px", marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <TrendingUp size={16} style={{ color: "#6366f1" }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Monthly Usage</span>
              <button onClick={fetchData} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                <RefreshCw size={14} />
              </button>
            </div>
            <UsageBar label="AI Queries" used={currentSub.ai_queries_used || 0} limit={planLimits.ai_queries ?? -1} color="#6366f1" />
          </div>
        )}

        {/* ── Expired warning ── */}
        {currentSub?.is_expired && (
          <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 12, padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
            <AlertCircle size={18} style={{ color: "#ea580c", flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "#9a3412" }}>
              Your subscription has expired. Renew or upgrade to continue full access.
            </span>
          </div>
        )}

        {/* ── Plans Grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20, marginBottom: 40 }}>
          {plans.map((plan) => (
            <PlanCard
              key={plan.plan}
              plan={plan}
              currentPlan={currentSub}
              onUpgrade={handleUpgrade}
              loading={payLoading}
            />
          ))}
        </div>

        {/* ── FAQ ── */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 20, padding: "28px 32px" }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 22px", fontFamily: "'Outfit',sans-serif" }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
            {[
              { q: "Can I cancel anytime?", a: "Yes. Cancel anytime — you keep access until the end of your billing period." },
              { q: "What payment methods are accepted?", a: "All major credit/debit cards, UPI, net banking, and wallets via Razorpay." },
              { q: "Is there a refund policy?", a: "We offer a 7-day money-back guarantee if you're not satisfied with premium features." },
              { q: "Can I switch plans?", a: "Yes. Upgrade or downgrade at any time. Changes take effect on your next billing cycle." },
              { q: "What is the New User Offer?", a: "A one-time ₹90 plan available only once per account. After it expires, upgrade to ₹199 or ₹499." },
              { q: "How are AI queries counted?", a: "Each message sent to the AI Mentor counts as 1 query. Limits reset every 30 days." },
            ].map((faq, i) => (
              <div key={i}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>{faq.q}</p>
                <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.65 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Payment security note ── */}
        <p style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", marginTop: 24 }}>
          🔒 Payments are processed securely by Razorpay. STEMS AI does not store your card details.
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  );
}
