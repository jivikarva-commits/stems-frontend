import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useAuth, API } from "../App";
import DashboardLayout from "../components/layout/DashboardLayout";
import {
  BookOpen, Trash2, ChevronDown, ChevronRight,
  Search, RefreshCw, Loader2, FileText, Sparkles,
  Calendar, Volume2, Edit2, Check, X, BookMarked, Scale,
} from "lucide-react";
import AIMentor, { MentorTriggerIcon } from "../components/AIMentor";
import UpgradePopup from "../components/UpgradePopup";

function getAuthHeaders() {
  const token = localStorage.getItem("token") || localStorage.getItem("access_token") || sessionStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
const _logActivity = (type, desc) => {
  try { axios.post(`${API}/activity/log`, { activity_type: type, description: desc }, { headers: getAuthHeaders(), withCredentials: true }).catch(() => {}); } catch {}
};

// ─── Confirm Dialog ──────────────────────────────────────────────────────────
function ConfirmDialog({ open, title, message, confirmLabel = "Delete", onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "linear-gradient(145deg,#0f0a37,#1e1b5a)", border: "1px solid rgba(99,102,241,0.4)", borderRadius: 16, padding: 28, maxWidth: 360, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#e0e7ff", margin: "0 0 8px" }}>{title}</p>
        <p style={{ fontSize: 13, color: "rgba(165,180,252,0.75)", margin: "0 0 24px", lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ padding: "7px 18px", borderRadius: 9, border: "1px solid rgba(99,102,241,0.3)", background: "transparent", color: "#a5b4fc", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding: "7px 18px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Shared content renderer ─────────────────────────────────────────────────
function renderContent(content) {
  if (!content) return null;
  return content.split("\n").map((line, i) => {
    const fmt = line.replace(/\*\*(.*?)\*\*/g, "<strong style='color:#c7d2fe'>$1</strong>");
    if (/^#{4}\s/.test(line)) return <h5 key={i} style={{ color: "#c7d2fe", fontSize: 13, fontWeight: 700, margin: "12px 0 5px" }}>{line.replace(/^#{4}\s/, "")}</h5>;
    if (/^#{3}\s/.test(line)) return <h4 key={i} style={{ color: "#e0e7ff", fontSize: 15, fontWeight: 700, margin: "14px 0 6px" }}>{line.replace(/^#{3}\s/, "")}</h4>;
    if (/^#{2}\s/.test(line)) return <h3 key={i} style={{ color: "#e0e7ff", fontSize: 17, fontWeight: 700, margin: "16px 0 8px" }}>{line.replace(/^#{2}\s/, "")}</h3>;
    if (/^#\s/.test(line)) return <h2 key={i} style={{ color: "#e0e7ff", fontSize: 19, fontWeight: 800, margin: "18px 0 8px" }}>{line.replace(/^#\s/, "")}</h2>;
    if (/^[-•]\s/.test(line)) return <li key={i} style={{ color: "#c7d2fe", fontSize: 13, marginBottom: 5, marginLeft: 18, lineHeight: 1.65 }} dangerouslySetInnerHTML={{ __html: fmt.replace(/^[-•]\s/, "") }} />;
    if (line.trim() === "") return <div key={i} style={{ height: 8 }} />;
    return <p key={i} style={{ color: "#c7d2fe", fontSize: 13, marginBottom: 6, lineHeight: 1.75 }} dangerouslySetInnerHTML={{ __html: fmt }} />;
  });
}

// ─── Note Viewer Modal ───────────────────────────────────────────────────────
function NoteViewer({ note, onClose, onDelete, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(note.title);
  const [saving, setSaving] = useState(false);
  const [mentorText, setMentorText] = useState("");
  const [activeSpeechText, setActiveSpeechText] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;
    setSaving(true);
    await onEdit(note.note_id, { title: editTitle });
    setSaving(false);
    setEditing(false);
  };

  return (
    <>
      <ConfirmDialog open={confirmDel} title="Delete this note?" message={`"${note.title}" will be permanently deleted.`}
        onConfirm={() => { setConfirmDel(false); onDelete(note.note_id); }} onCancel={() => setConfirmDel(false)} />
      <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div style={{ background: "linear-gradient(145deg,#0c0a36,#1a1760)", border: "1px solid rgba(99,102,241,0.45)", borderRadius: 20, width: "100%", maxWidth: 760, maxHeight: "92vh", height: "92vh", display: "flex", flexDirection: "column", boxShadow: "0 28px 70px rgba(0,0,0,0.65)" }}>
          {/* Header */}
          <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid rgba(99,102,241,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
              {editing ? (
                <div style={{ flex: 1, display: "flex", gap: 8, alignItems: "center" }}>
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)} autoFocus onKeyDown={e => e.key === "Enter" && handleSaveEdit()}
                    style={{ flex: 1, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(129,140,248,0.45)", borderRadius: 8, padding: "7px 12px", color: "#e0e7ff", fontSize: 15, fontWeight: 700, outline: "none" }} />
                  <button onClick={handleSaveEdit} disabled={saving} style={{ background: "none", border: "none", cursor: "pointer", color: "#4ade80" }}>
                    {saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={16} />}
                  </button>
                  <button onClick={() => setEditing(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171" }}><X size={16} /></button>
                </div>
              ) : (
                <h2 style={{ fontSize: 17, fontWeight: 800, color: "#e0e7ff", margin: 0, flex: 1, lineHeight: 1.4 }}>{note.title}</h2>
              )}
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(165,180,252,0.55)", padding: 4 }}><X size={19} /></button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#818cf8", background: "rgba(99,102,241,0.22)", borderRadius: 20, padding: "2px 10px" }}>{note.subject}</span>
              <span style={{ fontSize: 11, color: "rgba(165,180,252,0.5)", display: "flex", alignItems: "center", gap: 4 }}><Calendar size={11} />{formatDate(note.created_at)}</span>
              <div style={{ marginLeft: "auto", display: "flex", gap: 7 }}>
                <button onClick={() => setEditing(true)} style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.35)", borderRadius: 8, cursor: "pointer", color: "#a5b4fc", padding: "5px 12px", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                  <Edit2 size={11} /> Edit Title
                </button>
                <MentorTriggerIcon onClick={() => { setMentorText(note.content); setTimeout(() => setActiveSpeechText(note.content), 30); }} isSpeaking={!!mentorText} />
                <button onClick={() => setConfirmDel(true)} style={{ background: "rgba(239,68,68,0.14)", border: "1px solid rgba(239,68,68,0.32)", borderRadius: 8, cursor: "pointer", color: "#f87171", padding: "5px 12px", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                  <Trash2 size={11} /> Delete
                </button>
              </div>
            </div>
          </div>
          {/* Body */}
          <div className="viewer-body" style={{ flex: 1, overflow: "hidden", display: "flex" }}>
            <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px", minWidth: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: "#6366f1", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>Full Explanation</p>
              <div>{renderContent(note.content)}</div>
            </div>
            {note.summary && (
              <div className="viewer-summary viewer-summary-indigo" style={{ borderLeft: "1px solid rgba(99,102,241,0.18)", padding: "18px 16px", overflowY: "auto", background: "rgba(10,8,48,0.6)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                  <Sparkles size={13} style={{ color: "#818cf8" }} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: "#6366f1", letterSpacing: "0.1em", textTransform: "uppercase" }}>AI Revision Summary</span>
                </div>
                {note.summary.split("\n").filter(l => l.trim()).map((line, i) => (
                  <div key={i} style={{ display: "flex", gap: 7, marginBottom: 10, alignItems: "flex-start" }}>
                    <span style={{ color: "#818cf8", fontSize: 13, flexShrink: 0, marginTop: 1 }}>•</span>
                    <span style={{ fontSize: 12, color: "#c7d2fe", lineHeight: 1.6 }}>{line.replace(/^[•\-]\s*/, "")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <AIMentor text={mentorText} activeSpeechText={activeSpeechText} onClose={() => { setMentorText(""); setActiveSpeechText(""); }} />
      </div>
    </>
  );
}

// ─── Case Viewer Modal ───────────────────────────────────────────────────────
function CaseViewer({ caseItem, onClose, onDelete, onEditTitle }) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(caseItem.case_name);
  const [saving, setSaving] = useState(false);
  const [mentorText, setMentorText] = useState("");
  const [activeSpeechText, setActiveSpeechText] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);

  // ── Decide what to show on LEFT (full explanation) ───────────────────────
  // Priority: ai_content (full saved AI text) → fallback to structured content
  const leftContent = caseItem.ai_content && caseItem.ai_content.trim()
    ? caseItem.ai_content
    : [
        `# ${caseItem.case_name}`,
        "",
        caseItem.citation ? `**Citation:** ${caseItem.citation}` : "",
        caseItem.court    ? `**Court:** ${caseItem.court}` : "",
        caseItem.year     ? `**Year:** ${caseItem.year}` : "",
        "",
        "## Key Legal Principle",
        caseItem.key_principle || "",
      ].filter(l => l !== undefined).join("\n");

  // ── Decide what to show on RIGHT (summary bullets) ───────────────────────
  // Priority: ai_summary → key_principle + metadata bullets
  let summaryBullets = [];
  if (caseItem.ai_summary && caseItem.ai_summary.trim()) {
    // Split into sentences / lines — max 8 bullets
    summaryBullets = caseItem.ai_summary
      .split(/\n|(?<=[.!?])\s+/)
      .map(s => s.replace(/^[•\-\d.]\s*/, "").trim())
      .filter(s => s.length > 10)
      .slice(0, 8);
  }
  // Always ensure at least the key principle and metadata appear
  if (summaryBullets.length === 0) {
    summaryBullets = [
      caseItem.key_principle,
      caseItem.citation && `Citation: ${caseItem.citation}`,
      caseItem.court    && `Court: ${caseItem.court}`,
      caseItem.year     && `Year: ${caseItem.year}`,
      ...(caseItem.tags || []).map(t => `Topic: ${t}`),
    ].filter(Boolean);
  }

  const speakText = leftContent;

  const handleSaveTitle = async () => {
    if (!editTitle.trim() || editTitle === caseItem.case_name) { setEditing(false); return; }
    setSaving(true);
    await onEditTitle(caseItem.case_id, editTitle.trim());
    setSaving(false);
    setEditing(false);
  };

  return (
    <>
      <ConfirmDialog open={confirmDel} title="Delete this saved case?"
        message={`"${caseItem.case_name}" will be permanently removed from your library.`}
        onConfirm={() => { setConfirmDel(false); onDelete(caseItem.case_id); onClose(); }}
        onCancel={() => setConfirmDel(false)} />

      <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.78)", backdropFilter: "blur(7px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div style={{ background: "linear-gradient(145deg,#130e2e,#1c1740)", border: "1px solid rgba(245,158,11,0.4)", borderRadius: 20, width: "100%", maxWidth: 820, maxHeight: "92vh", height: "92vh", display: "flex", flexDirection: "column", boxShadow: "0 28px 70px rgba(0,0,0,0.7)" }}>

          {/* ── Header ─────────────────────────────────────────────────── */}
          <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid rgba(245,158,11,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
              {editing ? (
                <div style={{ flex: 1, display: "flex", gap: 8, alignItems: "center" }}>
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)} autoFocus
                    onKeyDown={e => { if (e.key === "Enter") handleSaveTitle(); if (e.key === "Escape") { setEditing(false); setEditTitle(caseItem.case_name); } }}
                    style={{ flex: 1, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.45)", borderRadius: 8, padding: "7px 12px", color: "#fde68a", fontSize: 15, fontWeight: 700, outline: "none" }} />
                  <button onClick={handleSaveTitle} disabled={saving} style={{ background: "none", border: "none", cursor: "pointer", color: "#4ade80" }}>
                    {saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={16} />}
                  </button>
                  <button onClick={() => { setEditing(false); setEditTitle(caseItem.case_name); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171" }}><X size={16} /></button>
                </div>
              ) : (
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <Scale size={16} style={{ color: "#f59e0b", flexShrink: 0 }} />
                    <h2 style={{ fontSize: 17, fontWeight: 800, color: "#fde68a", margin: 0, lineHeight: 1.4 }}>{caseItem.case_name}</h2>
                  </div>
                  {caseItem.citation && <p style={{ fontSize: 12, color: "rgba(245,158,11,0.6)", margin: "2px 0 0 24px", fontStyle: "italic" }}>{caseItem.citation}</p>}
                </div>
              )}
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(253,230,138,0.5)", padding: 4 }}><X size={19} /></button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {caseItem.level && <span style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", background: "rgba(245,158,11,0.18)", borderRadius: 20, padding: "2px 10px" }}>{caseItem.level}</span>}
              {(caseItem.tags || []).slice(0, 4).map((t, i) => (
                <span key={i} style={{ fontSize: 10, color: "rgba(253,230,138,0.55)", background: "rgba(253,230,138,0.08)", borderRadius: 20, padding: "2px 8px" }}>{t}</span>
              ))}
              <span style={{ fontSize: 11, color: "rgba(253,230,138,0.4)", display: "flex", alignItems: "center", gap: 4 }}>
                <Calendar size={11} />Saved {formatDate(caseItem.saved_at)}
              </span>
              <div style={{ marginLeft: "auto", display: "flex", gap: 7 }}>
                <button onClick={() => setEditing(true)} style={{ background: "rgba(245,158,11,0.14)", border: "1px solid rgba(245,158,11,0.35)", borderRadius: 8, cursor: "pointer", color: "#f59e0b", padding: "5px 12px", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                  <Edit2 size={11} /> Edit Title
                </button>
                <MentorTriggerIcon onClick={() => { setMentorText(speakText); setTimeout(() => setActiveSpeechText(speakText), 30); }} isSpeaking={!!mentorText} />
                <button onClick={() => setConfirmDel(true)} style={{ background: "rgba(239,68,68,0.14)", border: "1px solid rgba(239,68,68,0.32)", borderRadius: 8, cursor: "pointer", color: "#f87171", padding: "5px 12px", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                  <Trash2 size={11} /> Delete
                </button>
              </div>
            </div>
          </div>

          {/* ── Body ───────────────────────────────────────────────────── */}
          <div className="viewer-body" style={{ flex: 1, overflow: "hidden", display: "flex" }}>

            {/* LEFT — full AI explanation */}
            <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px", minWidth: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: "#d97706", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
                Full Case Explanation
              </p>
              <div>{renderContent(leftContent)}</div>
            </div>

            {/* RIGHT — AI revision summary */}
            <div className="viewer-summary viewer-summary-amber" style={{ borderLeft: "1px solid rgba(245,158,11,0.15)", padding: "18px 16px", overflowY: "auto", background: "rgba(10,7,30,0.6)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                <Sparkles size={13} style={{ color: "#f59e0b" }} />
                <span style={{ fontSize: 10, fontWeight: 800, color: "#d97706", letterSpacing: "0.1em", textTransform: "uppercase" }}>AI Revision Summary</span>
              </div>
              {summaryBullets.map((line, i) => (
                <div key={i} style={{ display: "flex", gap: 7, marginBottom: 11, alignItems: "flex-start" }}>
                  <span style={{ color: "#f59e0b", fontSize: 13, flexShrink: 0, marginTop: 1 }}>•</span>
                  <span style={{ fontSize: 12, color: "#fde68a", lineHeight: 1.65, opacity: 0.9 }}>{String(line).replace(/^[•\-]\s*/, "")}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
        <AIMentor text={mentorText} activeSpeechText={activeSpeechText} onClose={() => { setMentorText(""); setActiveSpeechText(""); }} />
      </div>
    </>
  );
}

// ─── Note Card ───────────────────────────────────────────────────────────────
function NoteCard({ note, onOpen, onDelete, isSpeaking, onSpeak }) {
  const preview = (note.content?.slice(0, 130).replace(/#{1,6}\s*/g, "").replace(/\*\*/g, "") || "") + "…";
  return (
    <div onClick={() => onOpen(note)} style={{
      background: "linear-gradient(135deg,rgba(30,27,80,0.95),rgba(20,18,60,0.95))",
      border: "1px solid rgba(99,102,241,0.35)",
      borderRadius: 14, padding: "16px 18px", cursor: "pointer",
      transition: "all 0.2s", position: "relative",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(129,140,248,0.7)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(99,102,241,0.25)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.35)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: "#e0e7ff", margin: 0, flex: 1, lineHeight: 1.4 }}>{note.title}</h3>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <button onClick={e => { e.stopPropagation(); onSpeak(note); }} title="Listen"
            style={{ background: isSpeaking ? "rgba(99,102,241,0.2)" : "none", border: "none", cursor: "pointer", padding: 5, borderRadius: 6, color: isSpeaking ? "#a5b4fc" : "rgba(165,180,252,0.5)" }}>
            <Volume2 size={13} />
          </button>
          <button onClick={e => { e.stopPropagation(); if (window.confirm("Delete this note?")) onDelete(note.note_id); }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 5, borderRadius: 6, color: "rgba(239,68,68,0.5)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(239,68,68,0.5)")}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <p style={{ fontSize: 12, color: "rgba(199,210,254,0.7)", margin: "0 0 12px", lineHeight: 1.55 }}>{preview}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#818cf8", background: "rgba(99,102,241,0.25)", borderRadius: 20, padding: "2px 9px" }}>{note.subject}</span>
        <span style={{ fontSize: 10, color: "rgba(165,180,252,0.45)", display: "flex", alignItems: "center", gap: 3 }}>
          <Calendar size={10} />{formatDate(note.created_at)}
        </span>
      </div>
    </div>
  );
}

// ─── Subject Group ───────────────────────────────────────────────────────────
function SubjectGroup({ subject, notes, onOpen, onDelete, speakingNoteId, onSpeak }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ marginBottom: 22 }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "none", border: "none", cursor: "pointer", padding: "8px 4px", marginBottom: open ? 12 : 0 }}>
        <span style={{ color: "#818cf8" }}>{open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
        <BookOpen size={15} style={{ color: "#818cf8" }} />
        <span style={{ fontSize: 13, fontWeight: 800, color: "#c7d2fe", letterSpacing: "0.02em" }}>{subject}</span>
        <span style={{ fontSize: 10, color: "#6366f1", background: "rgba(99,102,241,0.22)", borderRadius: 20, padding: "1px 8px", marginLeft: 4 }}>{notes.length}</span>
      </button>
      {open && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {notes.map(note => (
            <NoteCard key={note.note_id} note={note} onOpen={onOpen} onDelete={onDelete}
              isSpeaking={speakingNoteId === note.note_id} onSpeak={onSpeak} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Saved Case Card ─────────────────────────────────────────────────────────
function SavedCaseCard({ caseItem, onOpen, onDelete, onEditTitle }) {
  const [confirmDel, setConfirmDel] = useState(false);

  return (
    <>
      <ConfirmDialog open={confirmDel} title="Delete this saved case?"
        message={`"${caseItem.case_name}" will be permanently removed from your library.`}
        onConfirm={() => { setConfirmDel(false); onDelete(caseItem.case_id); }}
        onCancel={() => setConfirmDel(false)} />
      <div
        onClick={() => onOpen(caseItem)}
        style={{
          background: "linear-gradient(135deg,rgba(45,30,10,0.95),rgba(35,22,5,0.95))",
          border: "1.5px solid rgba(245,158,11,0.45)",
          borderRadius: 14, padding: "16px 18px", cursor: "pointer",
          transition: "all 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(245,158,11,0.8)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(245,158,11,0.2)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(245,158,11,0.45)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
      >
        {/* Top row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 5 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
              <Scale size={13} style={{ color: "#f59e0b", flexShrink: 0 }} />
              <h3 style={{ fontSize: 13, fontWeight: 800, color: "#fde68a", margin: 0, lineHeight: 1.4 }}>{caseItem.case_name}</h3>
            </div>
            {caseItem.citation && <p style={{ fontSize: 10, color: "rgba(245,158,11,0.6)", margin: "0 0 0 20px", fontStyle: "italic" }}>{caseItem.citation}</p>}
          </div>
          {/* Prevent card click from firing on action buttons */}
          <div style={{ display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
            <button onClick={e => { e.stopPropagation(); setConfirmDel(true); }}
              style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, cursor: "pointer", padding: "4px 6px", color: "#f87171", display: "flex", alignItems: "center" }}
              title="Delete">
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Principle preview */}
        <p style={{
          fontSize: 12, color: "rgba(253,230,138,0.75)", margin: "8px 0 12px", lineHeight: 1.55,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>{caseItem.key_principle}</p>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {caseItem.level && <span style={{ fontSize: 9, fontWeight: 700, color: "#f59e0b", background: "rgba(245,158,11,0.18)", borderRadius: 20, padding: "2px 8px" }}>{caseItem.level}</span>}
          {(caseItem.tags || []).slice(0, 2).map((t, i) => (
            <span key={i} style={{ fontSize: 9, color: "rgba(253,230,138,0.45)", background: "rgba(253,230,138,0.07)", borderRadius: 20, padding: "2px 7px" }}>{t}</span>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 9, color: "rgba(253,230,138,0.35)", display: "flex", alignItems: "center", gap: 3 }}>
            <Calendar size={8} />Saved {formatDate(caseItem.saved_at)}
          </span>
        </div>

        {/* Click hint */}
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(245,158,11,0.12)", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
          <span style={{ fontSize: 10, color: "rgba(245,158,11,0.5)", fontWeight: 600 }}>Click to read full case →</span>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RevisionNotesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("notes");

  // Notes state
  const [grouped, setGrouped] = useState({});
  const [allNotes, setAllNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedNote, setSelectedNote] = useState(null);
  const [mentorText, setMentorText] = useState("");
  const [activeSpeechText, setActiveSpeechText] = useState("");
  const [speakingNoteId, setSpeakingNoteId] = useState(null);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);

  // Cases state
  const [savedCases, setSavedCases] = useState([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);

  const fetchNotes = useCallback(async () => {
    setNotesLoading(true);
    try {
      const res = await axios.get(`${API}/revision-notes`, { headers: getAuthHeaders(), withCredentials: true });
      setAllNotes(res.data.notes || []);
      setGrouped(res.data.grouped || {});
    } catch (err) {
      if (err?.response?.status === 429) {
        setShowUpgradePopup(true);
      } else {
        toast.error("Failed to load revision notes");
      }
    }
    finally { setNotesLoading(false); }
  }, []);

  const fetchSavedCases = useCallback(async () => {
    setCasesLoading(true);
    try {
      const res = await axios.get(`${API}/saved-cases/list`, { headers: getAuthHeaders(), withCredentials: true });
      setSavedCases(res.data.saved_cases || []);
    } catch (err) {
      if (err?.response?.status === 429) setShowUpgradePopup(true);
    }
    finally { setCasesLoading(false); }
  }, []);

  useEffect(() => { fetchNotes(); fetchSavedCases(); }, [fetchNotes, fetchSavedCases]);

  // ── Note handlers ─────────────────────────────────────────────────────────
  const handleDeleteNote = async (noteId) => {
    try {
      await axios.delete(`${API}/revision-notes/${noteId}`, { headers: getAuthHeaders(), withCredentials: true });
      toast.success("Note deleted");
      if (selectedNote?.note_id === noteId) setSelectedNote(null);
      fetchNotes();
    } catch (err) {
      if (err?.response?.status === 429) {
        setShowUpgradePopup(true);
      } else {
        toast.error("Failed to delete note");
      }
    }
  };
  const handleEditNote = async (noteId, updates) => {
    try {
      const res = await axios.put(`${API}/revision-notes/${noteId}`, updates, { headers: getAuthHeaders(), withCredentials: true });
      toast.success("Title updated");
      setSelectedNote(res.data);
      fetchNotes();
    } catch (err) {
      if (err?.response?.status === 429) {
        setShowUpgradePopup(true);
      } else {
        toast.error("Failed to update note");
      }
    }
  };
  const handleSpeak = (note) => {
    setSpeakingNoteId(note.note_id);
    setMentorText(note.content);
    setActiveSpeechText("");
    setTimeout(() => setActiveSpeechText(note.content), 30);
  };

  // ── Case handlers ─────────────────────────────────────────────────────────
  const handleDeleteCase = async (caseId) => {
    try {
      await axios.delete(`${API}/saved-cases/${caseId}`, { headers: getAuthHeaders(), withCredentials: true });
      setSavedCases(prev => prev.filter(c => c.case_id !== caseId));
      setSelectedCase(null);
      toast.success("Case removed from library");
    } catch (err) {
      if (err?.response?.status === 429) {
        setShowUpgradePopup(true);
      } else {
        toast.error("Failed to remove case");
      }
    }
  };
  const handleEditCaseTitle = async (caseId, newTitle) => {
    try {
      await axios.patch(`${API}/saved-cases/${caseId}`, { case_name: newTitle }, { headers: getAuthHeaders(), withCredentials: true });
      setSavedCases(prev => prev.map(c => c.case_id === caseId ? { ...c, case_name: newTitle } : c));
      setSelectedCase(prev => prev ? { ...prev, case_name: newTitle } : prev);
      toast.success("Title updated");
    } catch (err) {
      if (err?.response?.status === 429) {
        setShowUpgradePopup(true);
      } else {
        toast.error("Failed to update title");
      }
    }
  };

  // ── Filtered notes ────────────────────────────────────────────────────────
  const filteredGrouped = {};
  if (search.trim()) {
    const q = search.toLowerCase();
    allNotes.filter(n => n.title?.toLowerCase().includes(q) || n.subject?.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q))
      .forEach(note => {
        const s = note.subject || "General";
        if (!filteredGrouped[s]) filteredGrouped[s] = [];
        filteredGrouped[s].push(note);
      });
  }
  const displayGrouped = search.trim() ? filteredGrouped : grouped;
  const subjects = Object.keys(displayGrouped);
  const tabActive = (id) => activeTab === id;

  return (
    <DashboardLayout>
      <div style={{ padding: "24px", maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <BookMarked size={22} style={{ color: "#818cf8" }} />
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#e0e7ff", margin: 0 }}>Knowledge Library</h1>
            </div>
            <p style={{ fontSize: 13, color: "rgba(165,180,252,0.6)", margin: 0 }}>
              {allNotes.length} revision {allNotes.length === 1 ? "note" : "notes"} · {savedCases.length} saved case {savedCases.length === 1 ? "law" : "laws"}
            </p>
          </div>
          <button onClick={() => { fetchNotes(); fetchSavedCases(); }} style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 10, padding: "8px 14px", cursor: "pointer", color: "#a5b4fc", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600 }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Tab Bar */}
        <div style={{ display: "flex", gap: 4, padding: "5px", background: "rgba(8,6,32,0.9)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 14, marginBottom: 28 }}>
          <button onClick={() => setActiveTab("notes")} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            padding: "11px 18px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 800, transition: "all 0.18s",
            background: tabActive("notes") ? "rgba(99,102,241,0.28)" : "transparent",
            color: tabActive("notes") ? "#a5b4fc" : "rgba(165,180,252,0.4)",
            boxShadow: tabActive("notes") ? "0 2px 16px rgba(99,102,241,0.25)" : "none",
          }}>
            <BookMarked size={15} /> Revision Notes
            <span style={{ fontSize: 10, padding: "1px 8px", borderRadius: 20, background: tabActive("notes") ? "rgba(99,102,241,0.35)" : "rgba(99,102,241,0.12)", color: tabActive("notes") ? "#a5b4fc" : "rgba(165,180,252,0.35)" }}>{allNotes.length}</span>
          </button>
          <button onClick={() => setActiveTab("cases")} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            padding: "11px 18px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 800, transition: "all 0.18s",
            background: tabActive("cases") ? "rgba(245,158,11,0.22)" : "transparent",
            color: tabActive("cases") ? "#f59e0b" : "rgba(245,158,11,0.4)",
            boxShadow: tabActive("cases") ? "0 2px 16px rgba(245,158,11,0.18)" : "none",
          }}>
            <Scale size={15} /> Saved Case Laws
            <span style={{ fontSize: 10, padding: "1px 8px", borderRadius: 20, background: tabActive("cases") ? "rgba(245,158,11,0.32)" : "rgba(245,158,11,0.1)", color: tabActive("cases") ? "#f59e0b" : "rgba(245,158,11,0.35)" }}>{savedCases.length}</span>
          </button>
        </div>

        {/* ═══ REVISION NOTES TAB ════════════════════════════════════════ */}
        {activeTab === "notes" && (
          <>
            <div style={{ position: "relative", marginBottom: 24 }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(165,180,252,0.4)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes by title, subject or content..."
                style={{ width: "100%", background: "rgba(25,22,65,0.8)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 10, padding: "10px 14px 10px 34px", color: "#e0e7ff", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
            {notesLoading ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200, gap: 10, color: "rgba(165,180,252,0.5)" }}>
                <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} /><span style={{ fontSize: 14 }}>Loading notes...</span>
              </div>
            ) : subjects.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 280, gap: 14 }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FileText size={28} style={{ color: "rgba(129,140,248,0.5)" }} />
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#c7d2fe", margin: "0 0 5px", textAlign: "center" }}>{search ? "No notes found" : "No revision notes yet"}</p>
                <p style={{ fontSize: 13, color: "rgba(165,180,252,0.5)", margin: 0, textAlign: "center" }}>{search ? "Try a different search term" : "Save AI responses from chat using the bookmark icon"}</p>
              </div>
            ) : (
              subjects.map(subject => (
                <SubjectGroup key={subject} subject={subject} notes={displayGrouped[subject]}
                  onOpen={note => { setSelectedNote(note); _logActivity("notes", `Reviewed: ${note.title}`); }}
                  onDelete={handleDeleteNote} speakingNoteId={speakingNoteId} onSpeak={handleSpeak} />
              ))
            )}
          </>
        )}

        {/* ═══ SAVED CASE LAWS TAB ═══════════════════════════════════════ */}
        {activeTab === "cases" && (
          <>
            {casesLoading ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200, gap: 10, color: "rgba(253,230,138,0.5)" }}>
                <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} /><span style={{ fontSize: 14 }}>Loading saved cases...</span>
              </div>
            ) : savedCases.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, gap: 14 }}>
                <div style={{ width: 70, height: 70, borderRadius: "50%", background: "rgba(245,158,11,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Scale size={32} style={{ color: "rgba(245,158,11,0.45)" }} />
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#fde68a", margin: "0 0 5px", textAlign: "center" }}>No saved case laws yet</p>
                <p style={{ fontSize: 13, color: "rgba(253,230,138,0.45)", margin: 0, textAlign: "center" }}>Go to Case Laws tab and click the 🔖 bookmark to save cases here</p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 12, color: "rgba(253,230,138,0.45)", marginBottom: 16, fontWeight: 600 }}>
                  {savedCases.length} saved {savedCases.length === 1 ? "case" : "cases"} · click any card to read the full case
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
                  {savedCases.map(c => (
                    <SavedCaseCard key={c.case_id} caseItem={c}
                      onOpen={cs => { setSelectedCase(cs); _logActivity("case", `Opened case: ${cs.case_name}`); }}
                      onDelete={handleDeleteCase}
                      onEditTitle={handleEditCaseTitle} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Note viewer modal */}
      {selectedNote && (
        <NoteViewer note={selectedNote} onClose={() => setSelectedNote(null)}
          onDelete={async id => { await handleDeleteNote(id); setSelectedNote(null); }}
          onEdit={handleEditNote} />
      )}

      {/* Case viewer modal */}
      {selectedCase && (
        <CaseViewer caseItem={selectedCase} onClose={() => setSelectedCase(null)}
          onDelete={handleDeleteCase}
          onEditTitle={handleEditCaseTitle} />
      )}

      {/* Global AIMentor for note speaking */}
      <AIMentor text={mentorText} activeSpeechText={activeSpeechText}
        onClose={() => { setMentorText(""); setActiveSpeechText(""); setSpeakingNoteId(null); }} />
      <UpgradePopup
        open={showUpgradePopup}
        onClose={() => setShowUpgradePopup(false)}
        planName={user?.plan}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Always side-by-side, explanation gets max space ── */
        .viewer-body {
          flex-direction: row;
        }
        .viewer-summary {
          width: 220px;
          flex-shrink: 0;
        }

        /* ── Mobile: narrow summary, wide explanation ── */
        @media (max-width: 600px) {
          .viewer-summary {
            width: 140px !important;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}
