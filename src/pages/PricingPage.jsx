import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Check, Zap, Shield, TrendingUp, Star, ChevronRight } from "lucide-react";
import SEO from "@/components/SEO";

/* ── Brand tokens (matches LandingPage) ── */
const G = {
  gold:      "#D4A847",
  goldDim:   "#A07830",
  goldGlow:  "rgba(212,168,71,0.15)",
  goldBorder:"rgba(212,168,71,0.3)",
  bg:        "#07080F",
  surface:   "#0D0F1E",
  surface2:  "#131527",
  border:    "rgba(255,255,255,0.08)",
  text:      "#F0F0F8",
  textDim:   "rgba(240,240,248,0.55)",
  indigo:    "#6366F1",
};

const font        = "'DM Sans', system-ui, sans-serif";
const headingFont = "'Playfair Display', Georgia, serif";

/* ── Hover helper ── */
function useHover() {
  const [h, set] = useState(false);
  return [h, { onMouseEnter: () => set(true), onMouseLeave: () => set(false) }];
}

/* ── CTA button ── */
function BtnGold({ children, onClick, large }) {
  const [h, hProps] = useHover();
  return (
    <button
      onClick={onClick}
      {...hProps}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        background: h
          ? "linear-gradient(135deg,#E8C060,#C09838)"
          : "linear-gradient(135deg,#D4A847,#B8922A)",
        border: "none", color: "#07080F",
        padding: large ? "14px 30px" : "11px 24px",
        borderRadius: large ? 12 : 9,
        fontSize: large ? 16 : 14,
        fontWeight: 700, cursor: "pointer",
        boxShadow: h ? "0 8px 32px rgba(212,168,71,0.5)" : "0 4px 20px rgba(212,168,71,0.3)",
        transform: h ? "translateY(-2px)" : "none",
        transition: "all 0.2s",
        fontFamily: font, whiteSpace: "nowrap", width: "100%",
        justifyContent: "center",
      }}
    >{children}</button>
  );
}

function BtnOutline({ children, onClick }) {
  const [h, hProps] = useHover();
  return (
    <button
      onClick={onClick}
      {...hProps}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        justifyContent: "center", width: "100%",
        background: "none",
        border: `1px solid ${h ? G.goldBorder : G.border}`,
        color: h ? G.text : G.textDim,
        padding: "11px 24px", borderRadius: 9,
        fontSize: 14, fontWeight: 500, cursor: "pointer",
        transition: "all 0.2s", fontFamily: font,
      }}
    >{children}</button>
  );
}

/* ── Feature row inside a plan card ── */
function Feature({ text }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
      <div style={{
        width: 20, height: 20, borderRadius: "50%", flexShrink: 0, marginTop: 1,
        background: G.goldGlow, border: `1px solid ${G.goldBorder}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Check size={11} color={G.gold} strokeWidth={3} />
      </div>
      <span style={{ fontSize: 14, color: G.textDim, lineHeight: 1.6 }}>{text}</span>
    </div>
  );
}

/* ── FAQ accordion item ── */
function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: G.surface2,
      border: `1px solid ${open ? G.goldBorder : G.border}`,
      borderRadius: 14, overflow: "hidden", transition: "border-color 0.2s",
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", background: "none", border: "none",
          padding: "20px 24px", display: "flex",
          alignItems: "center", justifyContent: "space-between",
          gap: 16, cursor: "pointer", textAlign: "left",
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color: G.text, lineHeight: 1.5 }}>
          {question}
        </span>
        <span style={{
          color: G.gold, flexShrink: 0, fontSize: 22, lineHeight: 1,
          transform: open ? "rotate(45deg)" : "none", transition: "transform 0.2s",
        }}>+</span>
      </button>
      {open && (
        <div style={{ padding: "0 24px 20px", fontSize: 14, color: G.textDim, lineHeight: 1.75 }}>
          {answer}
        </div>
      )}
    </div>
  );
}

/* ── JSON-LD structured data ── */
const pricingSchema = [
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "STEMS AI Pricing",
    "url": "https://stemscsai.in/pricing",
    "description": "Pricing plans for STEMS AI — India's AI-powered ICSI CS exam preparation platform.",
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Is there a free trial?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, STEMS AI offers a 7-day free trial with full platform access. No credit card required to start.",
        },
      },
      {
        "@type": "Question",
        "name": "Can I cancel anytime?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, you can cancel your subscription at any time from your account settings. There are no long-term contracts or cancellation fees.",
        },
      },
      {
        "@type": "Question",
        "name": "Which ICSI levels are covered?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "STEMS AI covers all three ICSI levels: CSEET (foundation), Executive and Professional — all in a single subscription.",
        },
      },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home",    "item": "https://stemscsai.in/" },
      { "@type": "ListItem", "position": 2, "name": "Pricing", "item": "https://stemscsai.in/pricing" },
    ],
  },
];

/* ── Plans data ── */
const plans = [
  {
    name: "Free Trial",
    price: "₹0",
    period: "7 days",
    badge: null,
    desc: "Full platform access, no commitment.",
    cta: "Start Free Trial",
    outline: false,
    features: [
      "AI mentor — unlimited questions",
      "Mock tests with AI evaluation",
      "Drafting simulator",
      "Smart study planner",
      "Performance analytics",
      "Case law database",
    ],
  },
  {
    name: "Monthly",
    price: "₹499",
    period: "per month",
    badge: null,
    desc: "Flexible month-to-month. Cancel anytime.",
    cta: "Get Monthly Plan",
    outline: true,
    features: [
      "Everything in Free Trial",
      "All ICSI levels — CSEET, Executive, Professional",
      "Unlimited mock tests & evaluations",
      "AI-generated study plans updated weekly",
      "Priority AI mentor responses",
      "Progress reports & weak-topic alerts",
    ],
  },
  {
    name: "Annual",
    price: "₹2,999",
    period: "per year",
    badge: "Best Value — Save 50%",
    desc: "Best for serious CS aspirants. One payment, one year.",
    cta: "Get Annual Plan",
    outline: false,
    features: [
      "Everything in Monthly",
      "Full 12-month access",
      "Exam-day readiness score tracker",
      "Personalised revision timetable",
      "Downloadable performance PDF reports",
      "Early access to new features",
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
export default function PricingPage() {
  const navigate = useNavigate();

  const faqItems = [
    {
      q: "Is there a free trial?",
      a: "Yes — STEMS AI gives you 7 days of full platform access with no credit card required. Explore every feature before committing.",
    },
    {
      q: "Can I cancel anytime?",
      a: "Absolutely. Cancel from your account settings at any time. No contracts, no hidden fees, no questions asked.",
    },
    {
      q: "Which ICSI levels are covered in all plans?",
      a: "All plans cover all three ICSI levels — CSEET (foundation), Executive, and Professional — in a single subscription.",
    },
    {
      q: "What payment methods are accepted?",
      a: "We accept all major UPI apps, debit/credit cards, and net banking through our secure payment gateway.",
    },
    {
      q: "Can I switch from Monthly to Annual?",
      a: "Yes. You can upgrade to the Annual plan at any time from your account settings and the remaining balance is adjusted automatically.",
    },
  ];

  return (
    <div style={{ fontFamily: font, background: G.bg, color: G.text, minHeight: "100vh" }}>

      <SEO
        title="ICSI CS Exam Prep Pricing — Free Trial & Plans"
        description="Start free for 7 days. Choose the STEMS AI plan for your ICSI CS exam — CSEET, Executive or Professional. No credit card required."
        canonical="https://stemscsai.in/pricing"
        ogImage="https://stemscsai.in/og-image.png"
        structuredData={pricingSchema}
      />

      {/* Inline responsive CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        @media (max-width: 768px) {
          .pricing-grid { grid-template-columns: 1fr !important; }
          .pricing-hero-pad { padding: 80px 16px 60px !important; }
        }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        height: 64, display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "0 clamp(16px,5vw,80px)",
        background: "rgba(7,8,15,0.95)",
        backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${G.border}`,
      }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{
            width: 36, height: 36,
            background: `linear-gradient(135deg,${G.gold},${G.goldDim})`,
            borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <GraduationCap size={18} color="#07080F" />
          </div>
          <span style={{ fontFamily: headingFont, fontSize: 18, fontWeight: 700, color: G.text }}>
            STEMS AI
          </span>
        </Link>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => navigate("/login")}
            style={{
              background: "none", border: `1px solid ${G.border}`,
              color: G.textDim, padding: "8px 20px", borderRadius: 8,
              fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: font,
            }}
          >Login</button>
          <button
            onClick={() => navigate("/register")}
            style={{
              background: `linear-gradient(135deg,${G.gold},${G.goldDim})`,
              border: "none", color: "#07080F",
              padding: "8px 20px", borderRadius: 8,
              fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: font,
            }}
          >Start Free</button>
        </div>
      </header>

      {/* ── HERO ── */}
      <section
        className="pricing-hero-pad"
        style={{ padding: "110px clamp(16px,5vw,80px) 80px", textAlign: "center", background: G.bg, position: "relative", overflow: "hidden" }}
      >
        {/* Glow orbs */}
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "rgba(99,102,241,0.08)", filter: "blur(120px)", top: -100, left: "50%", transform: "translateX(-50%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 700, margin: "0 auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: G.goldGlow, border: `1px solid ${G.goldBorder}`,
            borderRadius: 20, padding: "5px 14px",
            fontSize: 11, fontWeight: 700, color: G.gold,
            letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 24,
          }}>
            <Star size={10} fill={G.gold} /> Simple, Transparent Pricing
          </div>

          {/* ── H1 ── */}
          <h1
            aria-label="Simple, Transparent Pricing for Your ICSI CS Exam Journey — STEMS AI"
            style={{
              fontFamily: headingFont,
              fontSize: "clamp(32px,4vw,56px)",
              fontWeight: 900, lineHeight: 1.12, color: G.text, marginBottom: 20,
            }}
          >
            Simple, Transparent Pricing<br />
            <span style={{ background: `linear-gradient(135deg,${G.gold},#E8C470)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              for Your CS Exam Journey
            </span>
          </h1>

          <p style={{ fontSize: 17, color: G.textDim, lineHeight: 1.75, fontWeight: 300, marginBottom: 0 }}>
            Start free for 7 days. No credit card required. Full access to every feature —
            AI mentor, mock tests, drafting simulator, and study planner.
          </p>
        </div>
      </section>

      {/* ── PRICING CARDS ── */}
      <section style={{ padding: "0 clamp(16px,5vw,80px) 90px", background: G.bg }}>
        <div
          className="pricing-grid"
          style={{
            maxWidth: 1100, margin: "0 auto",
            display: "grid", gridTemplateColumns: "repeat(3,1fr)",
            gap: 24, alignItems: "start",
          }}
        >
          {plans.map((plan, i) => {
            const isFeatured = i === 2; /* Annual = featured */
            return (
              <div
                key={plan.name}
                style={{
                  background: isFeatured
                    ? "linear-gradient(160deg,#1A1C35,#0D0F1E)"
                    : G.surface,
                  border: `1px solid ${isFeatured ? G.goldBorder : G.border}`,
                  borderRadius: 20, padding: "36px 28px",
                  position: "relative", overflow: "hidden",
                }}
              >
                {/* Top gold bar on featured */}
                {isFeatured && (
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${G.gold},transparent)` }} />
                )}

                {/* Badge */}
                {plan.badge && (
                  <div style={{
                    display: "inline-block",
                    background: G.goldGlow,
                    border: `1px solid ${G.goldBorder}`,
                    color: G.gold, fontSize: 11, fontWeight: 700,
                    padding: "4px 12px", borderRadius: 20,
                    marginBottom: 16, letterSpacing: "0.05em",
                  }}>
                    {plan.badge}
                  </div>
                )}

                <h2 style={{ fontFamily: headingFont, fontSize: 24, fontWeight: 900, color: G.text, marginBottom: 6 }}>
                  {plan.name}
                </h2>
                <p style={{ fontSize: 13, color: G.textDim, marginBottom: 20 }}>{plan.desc}</p>

                {/* Price */}
                <div style={{ marginBottom: 28 }}>
                  <span style={{ fontFamily: headingFont, fontSize: 42, fontWeight: 900, color: isFeatured ? G.gold : G.text }}>
                    {plan.price}
                  </span>
                  <span style={{ fontSize: 14, color: G.textDim, marginLeft: 6 }}>/ {plan.period}</span>
                </div>

                {/* CTA */}
                <div style={{ marginBottom: 28 }}>
                  {plan.outline
                    ? <BtnOutline onClick={() => navigate("/register")}>{plan.cta} <ChevronRight size={14} /></BtnOutline>
                    : <BtnGold onClick={() => navigate("/register")}>{plan.cta} <ChevronRight size={14} /></BtnGold>
                  }
                </div>

                {/* Divider */}
                <div style={{ borderTop: `1px solid ${G.border}`, marginBottom: 24 }} />

                {/* Feature list */}
                <div>
                  {plan.features.map((f, j) => <Feature key={j} text={f} />)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust badges */}
        <div style={{
          maxWidth: 1100, margin: "40px auto 0",
          display: "flex", justifyContent: "center",
          gap: 36, flexWrap: "wrap",
        }}>
          {[
            { icon: <Shield size={15} />, text: "No credit card required" },
            { icon: <Zap size={15} />,    text: "Instant access after signup" },
            { icon: <TrendingUp size={15} />, text: "Cancel anytime" },
          ].map((b, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, color: G.textDim, fontSize: 13 }}>
              <span style={{ color: G.gold }}>{b.icon}</span>{b.text}
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ SECTION ── */}
      <section style={{ padding: "80px clamp(16px,5vw,80px) 90px", background: G.surface }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontSize: 11, fontWeight: 700, color: G.gold,
              textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14,
            }}>
              <span style={{ display: "block", width: 24, height: 2, background: G.gold }} /> FAQ
            </div>
            <h2 style={{ fontFamily: headingFont, fontSize: "clamp(26px,3vw,38px)", fontWeight: 900, color: G.text, lineHeight: 1.2, marginBottom: 12 }}>
              Frequently Asked Questions
            </h2>
            <p style={{ fontSize: 15, color: G.textDim, lineHeight: 1.7 }}>
              Everything you need to know about STEMS AI pricing and plans.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {faqItems.map(({ q, a }, i) => (
              <FAQItem key={i} question={q} answer={a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: "28px clamp(16px,5vw,80px)", borderTop: `1px solid ${G.border}`, background: G.bg, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
          <div style={{ width: 30, height: 30, background: `linear-gradient(135deg,${G.gold},${G.goldDim})`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <GraduationCap size={15} color="#07080F" />
          </div>
          <span style={{ fontFamily: headingFont, fontSize: 15, fontWeight: 700, color: G.text }}>STEMS AI</span>
        </Link>
        <p style={{ fontSize: 12, color: G.textDim, margin: 0 }}>© 2025 STEMS AI. All rights reserved.</p>
        <div style={{ display: "flex", gap: 20 }}>
          {[["Home", "/"], ["Register", "/register"], ["Login", "/login"]].map(([label, href]) => (
            <Link key={label} to={href} style={{ fontSize: 12, color: G.textDim, textDecoration: "none" }}>{label}</Link>
          ))}
        </div>
      </footer>

    </div>
  );
}
