import { useEffect, useRef, useState, useCallback } from "react";

// ─── Text preprocessing ───────────────────────────────────────────────────────

export function cleanTextForSpeech(text) {
  return text
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*\*(.+?)\*\*/gs, "$1")
    .replace(/\*(.+?)\*/gs, "$1")
    .replace(/__(.+?)__/gs, "$1")
    .replace(/_(.+?)_/gs, "$1")
    .replace(/~~(.+?)~~/gs, "$1")
    .replace(/`{1,3}[\s\S]*?`{1,3}/g, "")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/!?\[.*?\]\(.*?\)/g, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^>\s*/gm, "")
    .replace(/[-]{3,}/g, "")
    .replace(/[|]/g, ", ")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function convertNumbersForSpeech(text) {
  const ones = ["", "one", "two", "three", "four", "five", "six", "seven",
    "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen",
    "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty",
    "sixty", "seventy", "eighty", "ninety"];

  function twoDigit(n) {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    const t = tens[Math.floor(n / 10)];
    const o = ones[n % 10];
    return o ? `${t} ${o}` : t;
  }

  function spellYear(n) {
    const high = Math.floor(n / 100);
    const low  = n % 100;
    if (low === 0) return `${twoDigit(high)} hundred`;
    return `${twoDigit(high)} ${twoDigit(low)}`;
  }

  return text.replace(/\b(1[5-9]\d{2}|20[0-9]{2})\b/g, (_, n) => spellYear(parseInt(n)));
}

export function prepareTextForSpeech(text) {
  return convertNumbersForSpeech(cleanTextForSpeech(text));
}

// ─── Shared avatar SVG ────────────────────────────────────────────────────────

export function AvatarSVG({ talking = false, frame = 0, size = 80 }) {
  const gId     = talking ? "av-t" : "av-i";
  const faceClr = talking ? "#e0e7ff" : "#c7d2fe";
  const bg0     = talking ? "#a5b4fc" : "#818cf8";
  const bg1     = talking ? "#4f46e5" : "#3730a3";
  const eyeY    = talking ? 31 : 32;
  const hlY     = talking ? 29.8 : 30.8;
  const mouths  = [
    <ellipse key="a" cx="40" cy="41" rx="6"   ry="3.5" fill="#3730a3" />,
    <ellipse key="b" cx="40" cy="41" rx="7"   ry="5.5" fill="#3730a3" />,
    <ellipse key="c" cx="40" cy="41" rx="5"   ry="2"   fill="#3730a3" />,
    <ellipse key="d" cx="40" cy="41" rx="7.5" ry="4.5" fill="#3730a3" />,
  ];
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg"
      width={size} height={size} style={{ display: "block" }}>
      <defs>
        <radialGradient id={gId} cx="45%" cy="38%" r="62%">
          <stop offset="0%" stopColor={bg0} />
          <stop offset="100%" stopColor={bg1} />
        </radialGradient>
      </defs>
      <circle cx="40" cy="40" r="38" fill={`url(#${gId})`} />
      <circle cx="40" cy="35" r="17" fill={faceClr} />
      <circle cx="34" cy={eyeY} r="3.5" fill="#3730a3" />
      <circle cx="46" cy={eyeY} r="3.5" fill="#3730a3" />
      <circle cx="35.2" cy={hlY} r="1.2" fill="white" />
      <circle cx="47.2" cy={hlY} r="1.2" fill="white" />
      {talking
        ? mouths[frame % 4]
        : <path d="M34 40 Q40 44.5 46 40" stroke="#4338ca" strokeWidth="2" strokeLinecap="round" fill="none" />}
      <ellipse cx="40" cy="60" rx="14" ry="8" fill="white" fillOpacity="0.1" />
    </svg>
  );
}

// ─── Bubble trigger icon (ONE per AI message, at bottom-right of bubble) ──────

export function MentorTriggerIcon({ onClick, isSpeaking }) {
  const [sz, setSz] = useState(34);

  useEffect(() => {
    const update = () => setSz(window.innerWidth < 768 ? 30 : 34);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <>
      <style>{`
        @keyframes triggerPulse {
          0%,100% { box-shadow: 0 0 0 3px rgba(129,140,248,0.65); }
          50%      { box-shadow: 0 0 0 8px rgba(129,140,248,0); }
        }
      `}</style>
      <button
        onClick={onClick}
        title="Listen with AI Mentor"
        style={{
          width: sz,
          height: sz,
          borderRadius: "50%",
          border: "none",
          padding: 0,
          cursor: "pointer",
          overflow: "hidden",
          display: "block",
          flexShrink: 0,
          background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
          boxShadow: isSpeaking
            ? "0 0 0 3px rgba(129,140,248,0.75), 0 0 14px rgba(129,140,248,0.55)"
            : "0 2px 10px rgba(79,70,229,0.5)",
          animation: isSpeaking ? "triggerPulse 1s ease-in-out infinite" : "none",
          transition: "transform 0.18s, box-shadow 0.3s",
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.13)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
      >
        <AvatarSVG talking={isSpeaking} size={sz} />
      </button>
    </>
  );
}

// ─── Wave bars ────────────────────────────────────────────────────────────────

function WaveBar({ delay }) {
  return (
    <span style={{
      display: "inline-block", width: 3, borderRadius: 2,
      background: "linear-gradient(to top,#6366f1,#a5b4fc)",
      animation: "mentorWave 0.7s ease-in-out infinite",
      animationDelay: delay,
    }} />
  );
}

// ─── Speech builder ───────────────────────────────────────────────────────────

function buildUtterance(text, onStart, onEnd) {
  const clean = prepareTextForSpeech(text);
  const utter = new SpeechSynthesisUtterance(clean);
  utter.lang   = "en-IN";
  utter.rate   = 0.85;   // slower = clearer
  utter.pitch  = 1.08;
  utter.volume = 1;

  // Voice selection: prefer en-IN, then female en, then any en
  const tryVoices = () => {
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find(v => v.lang === "en-IN" && v.localService) ||
      voices.find(v => v.lang === "en-IN") ||
      voices.find(v => v.lang === "en-GB" && v.name.toLowerCase().includes("female")) ||
      voices.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes("female")) ||
      voices.find(v => v.lang.startsWith("en"))
    );
  };

  const voice = tryVoices();
  if (voice) utter.voice = voice;

  utter.onstart = onStart;
  utter.onend   = onEnd;
  utter.onerror = onEnd;
  return utter;
}

// ─── Floating panel ───────────────────────────────────────────────────────────

export default function AIMentor({ text, activeSpeechText, onClose }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [frame,      setFrame]      = useState(0);
  const [pos,        setPos]        = useState(null);
  const [dragging,   setDragging]   = useState(false);

  const containerRef = useRef(null);
  const frameTimer   = useRef(null);
  const dragOffset   = useRef({ x: 0, y: 0 });

  const mobile = () => window.innerWidth < 768;

  // Set initial position bottom-right, clear of input bar
  useEffect(() => {
    if (!text) return;
    const mob    = window.innerWidth < 768;
    const panelW = mob ? Math.min(window.innerWidth * 0.9, 270) : 244;
    // On mobile, sit 160px from bottom (above the input bar ~90px + 70px gap)
    // On desktop, 215px from bottom
    setPos({
      x: window.innerWidth  - panelW - (mob ? 8 : 20),
      y: window.innerHeight - (mob ? 200 : 215),
    });
  }, [text]);

  const startAnim = useCallback(() => {
    clearInterval(frameTimer.current);
    setIsSpeaking(true);
    frameTimer.current = setInterval(() => setFrame(f => (f + 1) % 4), 130);
  }, []);

  const stopAnim = useCallback(() => {
    clearInterval(frameTimer.current);
    setIsSpeaking(false);
  }, []);

  const stopSpeech = useCallback(() => {
    window.speechSynthesis?.cancel();
    stopAnim();
  }, [stopAnim]);

  // New question → stop speech
  useEffect(() => { stopSpeech(); }, [text]);
  // Cleanup on unmount
  useEffect(() => () => stopSpeech(), []);

  // Sentence click → speak that segment
  useEffect(() => {
    if (!activeSpeechText) return;
    stopSpeech();
    // Small delay so cancel takes effect before new utterance
    const t = setTimeout(() => {
      const utter = buildUtterance(activeSpeechText, startAnim, stopAnim);
      window.speechSynthesis.speak(utter);
    }, 80);
    return () => clearTimeout(t);
  }, [activeSpeechText]);

  const handleSpeak = useCallback(() => {
    if (isSpeaking) { stopSpeech(); return; }
    if (!text) return;
    const t = setTimeout(() => {
      const utter = buildUtterance(text, startAnim, stopAnim);
      window.speechSynthesis.speak(utter);
    }, 80);
    return () => clearTimeout(t);
  }, [text, isSpeaking, stopSpeech, startAnim, stopAnim]);

  // Drag – mouse
  const onMouseDown = useCallback((e) => {
    if (e.target.closest("button")) return;
    e.preventDefault();
    const r = containerRef.current.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    setDragging(true);
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const move = (e) => {
      const w = containerRef.current?.offsetWidth  || 244;
      const h = containerRef.current?.offsetHeight || 170;
      setPos({
        x: Math.max(0, Math.min(e.clientX - dragOffset.current.x, window.innerWidth  - w)),
        y: Math.max(0, Math.min(e.clientY - dragOffset.current.y, window.innerHeight - h)),
      });
    };
    const up = () => setDragging(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup",   up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [dragging]);

  // Drag – touch
  const onTouchStart = useCallback((e) => {
    if (e.target.closest("button")) return;
    const t = e.touches[0];
    const r = containerRef.current.getBoundingClientRect();
    dragOffset.current = { x: t.clientX - r.left, y: t.clientY - r.top };
  }, []);

  const onTouchMove = useCallback((e) => {
    e.preventDefault();
    const t = e.touches[0];
    const w = containerRef.current?.offsetWidth  || 244;
    const h = containerRef.current?.offsetHeight || 170;
    setPos({
      x: Math.max(0, Math.min(t.clientX - dragOffset.current.x, window.innerWidth  - w)),
      y: Math.max(0, Math.min(t.clientY - dragOffset.current.y, window.innerHeight - h)),
    });
  }, []);

  // Don't render if no text, no position, or closed
  if (!text || !pos) return null;

  const isMob  = window.innerWidth < 768;
  const panelW = isMob ? Math.min(window.innerWidth * 0.9, 270) : 244;

  return (
    <>
      <style>{`
        @keyframes mentorWave {
          0%,100% { height:4px; opacity:0.5; }
          50%      { height:16px; opacity:1; }
        }
        @keyframes mentorFadeIn {
          from { opacity:0; transform:scale(0.9) translateY(10px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes mentorGlow {
          0%,100% { box-shadow:0 0 0 0 rgba(129,140,248,0.35); }
          50%      { box-shadow:0 0 0 9px rgba(129,140,248,0); }
        }
        @keyframes mentorFloat {
          0%,100% { transform:translateY(0); }
          50%      { transform:translateY(-4px); }
        }
      `}</style>

      <div
        ref={containerRef}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        style={{
          position: "fixed",
          left: pos.x,
          top: pos.y,
          zIndex: 1000,
          width: panelW,
          cursor: dragging ? "grabbing" : "grab",
          userSelect: "none",
          animation: "mentorFadeIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards",
        }}
      >
        <div style={{
          background: "linear-gradient(145deg, rgba(12,10,55,0.98), rgba(35,32,105,0.96))",
          border: `1.5px solid ${isSpeaking ? "rgba(165,180,252,0.6)" : "rgba(99,102,241,0.35)"}`,
          borderRadius: 20,
          padding: "11px 14px 13px",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: isSpeaking
            ? "0 14px 44px rgba(99,102,241,0.55), 0 0 0 1px rgba(165,180,252,0.1)"
            : "0 8px 32px rgba(0,0,0,0.5)",
          transition: "border-color 0.3s, box-shadow 0.3s",
        }}>

          {/* Top row: drag pill + close */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div style={{ width:26, height:3, borderRadius:3, background:"rgba(129,140,248,0.28)" }} />
            <button
              onClick={() => { stopSpeech(); onClose && onClose(); }}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(129,140,248,0.2)",
                borderRadius: 8,
                cursor: "pointer",
                color: "rgba(165,180,252,0.7)",
                padding: "2px 7px",
                fontSize: 13,
                lineHeight: 1.4,
                fontFamily: "system-ui,sans-serif",
                transition: "background 0.2s, color 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.12)"; e.currentTarget.style.color="#e0e7ff"; }}
              onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.06)"; e.currentTarget.style.color="rgba(165,180,252,0.7)"; }}
              title="Close AI Mentor"
            >✕</button>
          </div>

          {/* Avatar + info */}
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:11 }}>
            <div style={{
              width: 54, height: 54,
              borderRadius: "50%",
              overflow: "hidden",
              flexShrink: 0,
              animation: isSpeaking
                ? "mentorGlow 0.9s ease-in-out infinite"
                : "mentorFloat 3.5s ease-in-out infinite",
              filter: isSpeaking
                ? "drop-shadow(0 0 9px rgba(165,180,252,0.85))"
                : "drop-shadow(0 0 5px rgba(99,102,241,0.45))",
              transition: "filter 0.3s",
            }}>
              <AvatarSVG talking={isSpeaking} frame={frame} size={54} />
            </div>

            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4 }}>
                <span style={{
                  fontSize: 13, fontWeight: 700,
                  color: "#e0e7ff",
                  fontFamily: "system-ui,sans-serif",
                  letterSpacing: "0.02em",
                }}>AI Mentor</span>
                {isSpeaking && (
                  <span style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: "#a5b4fc",
                    animation: "mentorGlow 0.9s ease-in-out infinite",
                    display: "inline-block",
                    flexShrink: 0,
                  }} />
                )}
              </div>

              <div style={{ height: 18, display:"flex", alignItems:"center" }}>
                {isSpeaking ? (
                  <div style={{ display:"flex", alignItems:"flex-end", gap:3 }}>
                    {[0, 0.08, 0.16, 0.08, 0].map((d, i) => (
                      <WaveBar key={i} delay={`${d}s`} />
                    ))}
                  </div>
                ) : (
                  <span style={{
                    fontSize: 10,
                    color: "rgba(165,180,252,0.55)",
                    fontFamily: "system-ui,sans-serif",
                  }}>
                    {isMob ? "tap to speak" : "Ready · drag to move"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Speak / Stop button */}
          <button
            onClick={handleSpeak}
            style={{
              width: "100%",
              padding: "8px 0",
              borderRadius: 11,
              border: "none",
              cursor: "pointer",
              fontFamily: "system-ui,sans-serif",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.07em",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              background: isSpeaking
                ? "linear-gradient(135deg,#b91c1c,#dc2626)"
                : "linear-gradient(135deg,#4338ca,#7c3aed)",
              color: "white",
              boxShadow: isSpeaking
                ? "0 4px 16px rgba(185,28,28,0.4)"
                : "0 4px 16px rgba(67,56,202,0.45)",
              transition: "transform 0.15s, box-shadow 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.03)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
          >
            {isSpeaking ? (
              <>
                <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                  <rect x="4" y="3" width="4" height="14" rx="1.5" />
                  <rect x="12" y="3" width="4" height="14" rx="1.5" />
                </svg>
                STOP
              </>
            ) : (
              <>
                <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                SPEAK
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
