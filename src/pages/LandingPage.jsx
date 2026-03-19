import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Brain, FileText, BookOpen, Calendar, BarChart3, Scale,
  ArrowRight, GraduationCap, Sparkles, Trophy, Users,
  Star, ChevronRight, Zap, Shield, TrendingUp, Menu, X,
  CheckCircle
} from "lucide-react";

const G = {
  gold:     "#D4A847",
  goldDim:  "#A07830",
  goldGlow: "rgba(212,168,71,0.15)",
  goldBorder:"rgba(212,168,71,0.3)",
  bg:       "#07080F",
  surface:  "#0D0F1E",
  surface2: "#131527",
  border:   "rgba(255,255,255,0.08)",
  text:     "#F0F0F8",
  textDim:  "rgba(240,240,248,0.55)",
  indigo:   "#6366F1",
};

/* ── tiny reusable style objects ── */
const S = {
  section: (bg = G.bg) => ({
    background: bg,
    padding: "90px clamp(16px,5vw,80px)",
    position: "relative",
  }),
  inner: {
    maxWidth: 1160,
    margin: "0 auto",
  },
  label: {
    display: "flex", alignItems: "center", gap: 8,
    fontSize: 11, fontWeight: 700, color: G.gold,
    textTransform: "uppercase", letterSpacing: "0.1em",
    marginBottom: 14,
  },
  h2: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "clamp(28px,3.5vw,46px)",
    fontWeight: 900, color: G.text,
    lineHeight: 1.15, marginBottom: 16,
  },
  sub: {
    fontSize: 16, color: G.textDim,
    lineHeight: 1.75, fontWeight: 300,
    maxWidth: 520, marginBottom: 0,
  },
};

/* ── Hover helper hook ── */
function useHover() {
  const [hovered, setHovered] = useState(false);
  return [hovered, { onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false) }];
}

/* ── Button components ── */
function BtnGold({ children, onClick, large }) {
  const [h, hProps] = useHover();
  return (
    <button onClick={onClick} {...hProps} style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      background: h ? "linear-gradient(135deg,#E8C060,#C09838)" : "linear-gradient(135deg,#D4A847,#B8922A)",
      border: "none", color: "#07080F",
      padding: large ? "14px 30px" : "9px 22px",
      borderRadius: large ? 12 : 8,
      fontSize: large ? 16 : 14,
      fontWeight: 700, cursor: "pointer",
      boxShadow: h ? "0 8px 32px rgba(212,168,71,0.5)" : "0 4px 20px rgba(212,168,71,0.3)",
      transform: h ? "translateY(-2px)" : "none",
      transition: "all 0.2s",
      fontFamily: "'DM Sans',system-ui,sans-serif",
      whiteSpace: "nowrap",
    }}>{children}</button>
  );
}

function BtnOutline({ children, onClick, large }) {
  const [h, hProps] = useHover();
  return (
    <button onClick={onClick} {...hProps} style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      background: "none",
      border: `1px solid ${h ? G.goldBorder : G.border}`,
      color: h ? G.text : G.textDim,
      padding: large ? "14px 30px" : "9px 22px",
      borderRadius: large ? 12 : 8,
      fontSize: large ? 16 : 14,
      fontWeight: 500, cursor: "pointer",
      transition: "all 0.2s",
      fontFamily: "'DM Sans',system-ui,sans-serif",
      whiteSpace: "nowrap",
    }}>{children}</button>
  );
}

/* ── Feature Card ── */
function FeatureCard({ icon, title, desc }) {
  const [h, hProps] = useHover();
  return (
    <div {...hProps} style={{
      background: h ? G.surface2 : G.surface,
      border: `1px solid ${h ? G.goldBorder : G.border}`,
      borderRadius: 16, padding: 28,
      transition: "all 0.25s", cursor: "default",
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12, marginBottom: 18,
        background: h ? G.gold : G.goldGlow,
        border: `1px solid ${h ? G.gold : G.goldBorder}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: h ? "#07080F" : G.gold, transition: "all 0.25s",
      }}>{icon}</div>
      <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 18, fontWeight: 700, color: G.text, marginBottom: 10 }}>{title}</div>
      <div style={{ fontSize: 14, color: G.textDim, lineHeight: 1.7, fontWeight: 300 }}>{desc}</div>
    </div>
  );
}

/* ── Level Card ── */
function LevelCard({ num, name, subjects, desc }) {
  const [h, hProps] = useHover();
  return (
    <div {...hProps} style={{
      background: G.surface,
      border: `1px solid ${h ? G.goldBorder : G.border}`,
      borderRadius: 20, padding: "36px 28px",
      textAlign: "center", transition: "all 0.3s",
      transform: h ? "translateY(-4px)" : "none",
      position: "relative", overflow: "hidden",
    }}>
      {/* top gold line */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${G.gold},transparent)`, opacity: h ? 1 : 0, transition: "opacity 0.3s" }} />
      <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 52, fontWeight: 900, color: G.gold, opacity: 0.12, lineHeight: 1, marginBottom: -8 }}>{num}</div>
      <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 26, fontWeight: 900, color: G.text, marginBottom: 10 }}>{name}</div>
      <div style={{ fontSize: 14, color: G.textDim, lineHeight: 1.65, marginBottom: 20 }}>{desc}</div>
      <span style={{ display: "inline-block", background: G.goldGlow, border: `1px solid ${G.goldBorder}`, color: G.gold, fontSize: 12, fontWeight: 600, padding: "4px 14px", borderRadius: 20 }}>{subjects} Subjects</span>
    </div>
  );
}

/* ── Testimonial Card ── */
function TestiCard({ name, level, text }) {
  const [h, hProps] = useHover();
  return (
    <div {...hProps} style={{
      background: G.surface,
      border: `1px solid ${h ? G.goldBorder : G.border}`,
      borderRadius: 20, padding: 28, transition: "border-color 0.25s",
    }}>
      <div style={{ display: "flex", gap: 3, marginBottom: 16 }}>
        {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={G.gold} color={G.gold} />)}
      </div>
      <p style={{ fontSize: 15, color: G.textDim, lineHeight: 1.75, fontStyle: "italic", fontWeight: 300, marginBottom: 20 }}>"{text}"</p>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg,${G.gold},${G.goldDim})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#07080F" }}>{name[0]}</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: G.text }}>{name}</div>
          <div style={{ fontSize: 12, color: G.textDim, marginTop: 2 }}>{level} Level</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const features = [
    { icon: <Brain size={22} />, title: "AI Teaching Engine", desc: "Personalised explanations in beginner, exam-oriented or practical mode — with real CS examples and step-by-step breakdowns." },
    { icon: <FileText size={22} />, title: "Mock Test Engine", desc: "MCQs, descriptive and case study questions with AI evaluation, scoring rubrics and improvement feedback after each test." },
    { icon: <BookOpen size={22} />, title: "Drafting Simulator", desc: "Practice board resolutions, meeting notices, annual filings, and compliance documents with live AI evaluation scores." },
    { icon: <Calendar size={22} />, title: "Smart Study Planner", desc: "AI-generated timetable based on your exam date, weak areas and available study hours — updated as you progress." },
    { icon: <BarChart3 size={22} />, title: "Performance Analytics", desc: "Track progress across subjects, identify weak topics, and get AI-powered improvement roadmaps every week." },
    { icon: <Scale size={22} />, title: "Case Law Database", desc: "Searchable landmark cases with simplified summaries, exam relevance tags, and a built-in AI legal assistant." },
  ];

  const levels = [
    { num: "01", name: "CSEET", subjects: 4, desc: "Foundation level — Business Communication, Legal Aptitude, Economics and Current Affairs." },
    { num: "02", name: "Executive", subjects: 5, desc: "Professional foundation — Company Law, Tax, Contracts and Economic & Commercial Laws." },
    { num: "03", name: "Professional", subjects: 6, desc: "Advanced secretaryship — Governance, Restructuring, Resolution of Corporate Disputes." },
  ];

  const testimonials = [
    { name: "Priya S.", level: "Executive", text: "The AI explanations are incredibly clear — it explains exactly the way the examiner expects. Passed with distinction!" },
    { name: "Rahul M.", level: "Professional", text: "The Drafting Simulator changed everything. I finally understood what a board resolution should look like instead of memorising templates." },
    { name: "Anjali K.", level: "CSEET", text: "The personalised study planner kept me consistent for 3 months straight. I never felt lost about what to study next." },
  ];

  const font = "'DM Sans',system-ui,sans-serif";

  return (
    <div style={{ fontFamily: font, background: G.bg, color: G.text, minHeight: "100vh", overflowX: "hidden" }}>

      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        html { scroll-behavior: smooth; }
        *, *::before, *::after { box-sizing: border-box; }

        /* Mobile — hero */
        @media (max-width: 768px) {
          .lp-hero-grid   { grid-template-columns: 1fr !important; gap: 0 !important; }
          .lp-hero-mockup { display: none !important; }
          .lp-hero-left   { text-align: center; }
          .lp-hero-cta    { justify-content: center !important; }
          .lp-hero-stats  { justify-content: center !important; gap: 20px !important; }
          .lp-hero-badge  { margin: 0 auto 20px !important; }
        }
        /* Mobile — section grids */
        @media (max-width: 768px) {
          .lp-grid-3 { grid-template-columns: 1fr !important; }
          .lp-grid-features { grid-template-columns: 1fr !important; }
          .lp-section-pad { padding: 60px 16px !important; }
          .lp-h2 { font-size: 28px !important; }
          .lp-cta-box { padding: 48px 20px !important; }
        }
        /* Desktop nav hidden on mobile */
        @media (max-width: 768px) {
          .lp-desktop-nav { display: none !important; }
          .lp-desktop-btns { display: none !important; }
          .lp-mobile-btn { display: block !important; }
        }
        @media (min-width: 769px) {
          .lp-mobile-btn { display: none !important; }
        }
      `}</style>

      {/* ── HEADER ────────────────────────────────────────────── */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        height: 68, display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "0 clamp(16px,5vw,80px)",
        background: scrolled ? "rgba(7,8,15,0.96)" : "rgba(7,8,15,0.75)",
        backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${G.border}`,
        transition: "background 0.3s",
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 38, height: 38, background: `linear-gradient(135deg,${G.gold},${G.goldDim})`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <GraduationCap size={20} color="#07080F" />
          </div>
          <span style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 19, fontWeight: 700, color: G.text }}>STEMS AI</span>
        </Link>

        {/* Desktop nav */}
        <nav className="lp-desktop-nav" style={{ display: "flex", gap: 36, alignItems: "center" }}>
          {["features", "levels", "testimonials", "pricing"].map(id => (
            <a key={id} href={`#${id}`} style={{ color: G.textDim, textDecoration: "none", fontSize: 14, fontWeight: 500, textTransform: "capitalize", transition: "color 0.2s" }}
              onMouseEnter={e => (e.target.style.color = G.gold)} onMouseLeave={e => (e.target.style.color = G.textDim)}>
              {id === "testimonials" ? "Reviews" : id.charAt(0).toUpperCase() + id.slice(1)}
            </a>
          ))}
        </nav>

        {/* CTA buttons */}
        <div className="lp-desktop-btns" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BtnOutline onClick={() => navigate("/login")}>Login</BtnOutline>
          <BtnGold onClick={() => navigate("/register")}>Get Started</BtnGold>
        </div>
        <button className="lp-mobile-btn" onClick={() => setMobileOpen(true)} style={{ background: "none", border: "none", color: G.textDim, cursor: "pointer", padding: 4 }}>
          <Menu size={24} />
        </button>
      </header>

      {/* ── MOBILE MENU ────────────────────────────────────────── */}
      {mobileOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: G.bg, display: "flex", flexDirection: "column", padding: 24, gap: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
            <span style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 20, fontWeight: 700, color: G.text }}>STEMS AI</span>
            <button onClick={() => setMobileOpen(false)} style={{ background: "none", border: "none", color: G.textDim, cursor: "pointer" }}><X size={26} /></button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 28, marginBottom: 48 }}>
            {["Features", "Courses", "Reviews", "Pricing"].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setMobileOpen(false)}
                style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 28, fontWeight: 700, color: G.text, textDecoration: "none" }}>{l}</a>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <BtnOutline large onClick={() => navigate("/login")}>Login</BtnOutline>
            <BtnGold large onClick={() => navigate("/register")}>Get Started Free <ArrowRight size={16} /></BtnGold>
          </div>
        </div>
      )}

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", padding: "100px clamp(16px,5vw,80px) 80px", background: G.bg, position: "relative", overflow: "hidden" }}>
        {/* Background orbs */}
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "rgba(99,102,241,0.1)", filter: "blur(120px)", top: -100, right: -100, pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "rgba(212,168,71,0.07)", filter: "blur(100px)", bottom: 0, left: -80, pointerEvents: "none" }} />

        <div className="lp-hero-grid" style={{ maxWidth: 1160, margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center", position: "relative", zIndex: 1 }}>

          {/* Left */}
          <div className="lp-hero-left">
            {/* Badge */}
            <div className="lp-hero-badge" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: G.goldGlow, border: `1px solid ${G.goldBorder}`, borderRadius: 20, padding: "5px 14px", fontSize: 11, fontWeight: 700, color: G.gold, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 24 }}>
              <Sparkles size={10} /> AI-Powered CS Education
            </div>

            {/* H1 */}
            <h1 className="lp-h2" style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: "clamp(36px,4.5vw,62px)", fontWeight: 900, lineHeight: 1.1, color: G.text, marginBottom: 22 }}>
              Your 24/7 AI<br />
              <span style={{ background: `linear-gradient(135deg,${G.gold},#E8C470)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Company Secretary
              </span><br />
              Mentor
            </h1>

            <p style={{ fontSize: 17, color: G.textDim, lineHeight: 1.75, marginBottom: 34, fontWeight: 300, maxWidth: 480 }}>
              Master the full ICSI curriculum with an AI that teaches, tests, evaluates your drafts, and builds a personalised study plan — all in one place.
            </p>

            <div className="lp-hero-cta" style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <BtnGold large onClick={() => navigate("/register")}>Start Free Trial <ArrowRight size={17} /></BtnGold>
              <BtnOutline large onClick={() => navigate("/login")}>Sign In</BtnOutline>
            </div>

            {/* Stats */}
            <div className="lp-hero-stats" style={{ display: "flex", gap: 36, marginTop: 44, paddingTop: 36, borderTop: `1px solid ${G.border}`, flexWrap: "wrap" }}>
              {[{ val: "10K+", label: "Active Students" }, { val: "3", label: "ICSI Levels" }, { val: "24/7", label: "AI Available" }].map(s => (
                <div key={s.label}>
                  <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 28, fontWeight: 700, color: G.gold }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: G.textDim, fontWeight: 500, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — dashboard mockup */}
          <div className="lp-hero-mockup" style={{ position: "relative" }}>
            {/* Float badges */}
            <div style={{ position: "absolute", top: -18, right: -18, zIndex: 2, background: G.surface, border: `1px solid ${G.goldBorder}`, borderRadius: 12, padding: "9px 14px", display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 600, color: G.gold, boxShadow: "0 8px 30px rgba(0,0,0,0.4)" }}>
              <Sparkles size={12} color={G.gold} /> AI Grading Active
            </div>
            <div style={{ position: "absolute", bottom: -14, left: -18, zIndex: 2, background: G.surface, border: "1px solid rgba(74,222,128,0.3)", borderRadius: 12, padding: "9px 14px", display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 600, color: "#4ADE80", boxShadow: "0 8px 30px rgba(0,0,0,0.4)" }}>
              <CheckCircle size={12} color="#4ADE80" /> Score: 92/100
            </div>

            {/* Card */}
            <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 20, padding: 24, boxShadow: "0 32px 80px rgba(0,0,0,0.5)" }}>
              {/* Titlebar dots */}
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 20 }}>
                {["#FF5F57","#FFBD2E","#28C840"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
                <span style={{ marginLeft: 10, fontSize: 12, color: G.textDim }}>STEMS AI — Executive Level</span>
              </div>

              {/* AI message */}
              <div style={{ background: G.surface2, border: `1px solid ${G.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: G.gold, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                  <Sparkles size={10} /> AI Mentor
                </div>
                <div style={{ fontSize: 13, color: G.textDim, lineHeight: 1.65 }}>
                  Under Section 2(20) of the Companies Act, 2013, a company is a body corporate. The <strong style={{ color: G.text }}>Salomon v. Salomon</strong> principle establishes separate legal identity from its members...
                </div>
              </div>

              {/* Draft eval message */}
              <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: G.indigo, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                  <Zap size={10} /> Draft Evaluation
                </div>
                <div style={{ fontSize: 13, color: G.textDim, lineHeight: 1.65 }}>
                  Your board resolution is structurally sound. Add DIN numbers for each director under Section 174.
                </div>
              </div>

              {/* Score chips */}
              <div style={{ display: "flex", gap: 10 }}>
                {[{ num: "92", label: "Draft Score" }, { num: "87", label: "Test Score" }, { num: "14", label: "Day Streak" }].map(s => (
                  <div key={s.label} style={{ flex: 1, background: G.surface2, border: `1px solid ${G.border}`, borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 22, fontWeight: 700, color: G.gold }}>{s.num}</div>
                    <div style={{ fontSize: 10, color: G.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────── */}
      <section id="features" className="lp-section-pad" style={{ background: G.bg, padding: "90px clamp(16px,5vw,80px)" }}>
        <div style={S.inner}>
          <div style={S.label}><span style={{ display: "block", width: 24, height: 2, background: G.gold }} /> Platform Features</div>
          <h2 className="lp-h2" style={S.h2}>Everything You Need<br />to Excel in ICSI Exams</h2>
          <p style={S.sub}>A complete AI learning ecosystem built specifically for CS exam preparation — not a generic study tool.</p>
          <div className="lp-grid-features" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 16, marginTop: 52 }}>
            {features.map((f, i) => <FeatureCard key={i} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── LEVELS ─────────────────────────────────────────────── */}
      <section id="levels" className="lp-section-pad" style={{ background: G.surface, padding: "90px clamp(16px,5vw,80px)" }}>
        <div style={S.inner}>
          <div style={S.label}><span style={{ display: "block", width: 24, height: 2, background: G.gold }} /> Curriculum</div>
          <h2 className="lp-h2" style={S.h2}>Complete ICSI<br />Curriculum Coverage</h2>
          <p style={S.sub}>All three levels mapped to the official ICSI syllabus — from CSEET foundation to Professional level.</p>
          <div className="lp-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24, marginTop: 52 }}>
            {levels.map((l, i) => <LevelCard key={i} {...l} />)}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────────── */}
      <section id="testimonials" className="lp-section-pad" style={{ background: G.bg, padding: "90px clamp(16px,5vw,80px)" }}>
        <div style={S.inner}>
          <div style={S.label}><span style={{ display: "block", width: 24, height: 2, background: G.gold }} /> Student Reviews</div>
          <h2 className="lp-h2" style={S.h2}>What CS Students Say</h2>
          <div className="lp-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24, marginTop: 52 }}>
            {testimonials.map((t, i) => <TestiCard key={i} {...t} />)}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: "60px clamp(16px,5vw,80px) 90px", background: G.bg }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div className="lp-cta-box" style={{ background: "linear-gradient(135deg,#1A1C35,#0D0F1E)", border: `1px solid ${G.goldBorder}`, borderRadius: 24, padding: "72px clamp(24px,6vw,80px)", textAlign: "center", position: "relative", overflow: "hidden" }}>
            {/* Gold glow behind */}
            <div style={{ position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)", width: 400, height: 400, background: `radial-gradient(${G.goldGlow},transparent 70%)`, pointerEvents: "none" }} />

            <div style={{ position: "relative" }}>
              <div style={S.label} ><span style={{ display: "block", width: 24, height: 2, background: G.gold, margin: "0 auto 8px" }} /></div>
              <h2 style={{ ...S.h2, marginBottom: 14 }}>Ready to Transform<br />Your CS Journey?</h2>
              <p style={{ fontSize: 17, color: G.textDim, marginBottom: 36, fontWeight: 300 }}>Start with a free trial. No credit card required. Full access for 7 days.</p>

              <BtnGold large onClick={() => navigate("/register")}>Begin Free Trial <ChevronRight size={18} /></BtnGold>

              <div style={{ display: "flex", justifyContent: "center", gap: 32, marginTop: 36, flexWrap: "wrap" }}>
                {[{ icon: <Shield size={15} />, text: "No credit card" }, { icon: <Zap size={15} />, text: "Instant access" }, { icon: <TrendingUp size={15} />, text: "Cancel anytime" }].map((b, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, color: G.textDim, fontSize: 13 }}>
                    <span style={{ color: G.gold }}>{b.icon}</span>{b.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer style={{ padding: "36px clamp(16px,5vw,80px)", borderTop: `1px solid ${G.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, background: G.bg }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, background: `linear-gradient(135deg,${G.gold},${G.goldDim})`, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <GraduationCap size={18} color="#07080F" />
          </div>
          <span style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 16, fontWeight: 700, color: G.text }}>STEMS AI</span>
        </div>
        <p style={{ fontSize: 13, color: G.textDim }}>© 2025 STEMS AI. Designed for ICSI aspirants.</p>
        <div style={{ display: "flex", gap: 24 }}>
          {["Privacy", "Terms", "Contact"].map(l => (
            <a key={l} href="#" style={{ fontSize: 13, color: G.textDim, textDecoration: "none" }}
              onMouseEnter={e => (e.target.style.color = G.gold)} onMouseLeave={e => (e.target.style.color = G.textDim)}>{l}</a>
          ))}
        </div>
      </footer>

    </div>
  );
}
