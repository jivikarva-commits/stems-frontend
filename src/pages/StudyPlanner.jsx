import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useAuth } from "../App";
import { API } from "../App";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
  Calendar as CalendarIcon, Loader2, Target, BookOpen,
  Clock, CheckCircle, Sparkles, AlertCircle, GraduationCap,
  Brain, Download, Plus, BookMarked, Trash2, ChevronDown,
  ChevronUp, FolderOpen, History, RefreshCw
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import UpgradePopup from "../components/UpgradePopup";

// ─── Activity Logger ──────────────────────────────────────────────────────────
const _logActivity = (activityType, description) => {
  try {
    const token = localStorage.getItem("token");
    axios.post(`${API}/activity/log`, { activity_type: activityType, description }, {
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      withCredentials: true,
    }).catch(() => {});
  } catch {}
};

// ─── Auth Headers ─────────────────────────────────────────────────────────────
function getAuthHeaders() {
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// ─── PDF Download ─────────────────────────────────────────────────────────────
const downloadPlanAsPDF = (plan) => {
  const level = plan.level || "";
  const planSubjects = Array.isArray(plan.subjects) ? plan.subjects : [];
  const start_date = plan.start_date || "";
  const exam_date = plan.exam_date || "";
  const study_days = plan.study_days || 0;
  const daily_hours = plan.daily_hours || 4;
  const plan_type = plan.plan_type || "Study Plan";
  const slots = Array.isArray(plan.slots) ? plan.slots : [];
  const weak_areas = Array.isArray(plan.weak_areas) ? plan.weak_areas : [];
  const total_chapters = plan.total_chapters || 0;
  const plan_id = plan.plan_id || "";

  // ── Replicate the same day-distribution logic used in the UI ──────────────
  const pdfParseDateRange = (range) => {
    if (!range) return [];
    const parts = range.split(" to ");
    if (parts.length !== 2) return [];
    const d0 = new Date(parts[0].trim()), d1 = new Date(parts[1].trim());
    return (!isNaN(d0) && !isNaN(d1)) ? [d0, d1] : [];
  };
  const pdfBuildDayPlan = (studyTopics, revisionTopics, numDays, hasMock) => {
    const contentDays = hasMock ? Math.max(numDays - 1, 1) : numDays;
    const days = Array.from({ length: numDays }, () => ({ study: [], revision: [], isMockDay: false }));
    studyTopics.forEach((t, i) => days[i % contentDays].study.push(t));
    if (revisionTopics.length > 0) {
      const revDaysNeeded = Math.ceil(revisionTopics.length / 2);
      const revStart = Math.max(0, contentDays - revDaysNeeded);
      revisionTopics.forEach((t, i) => {
        const di = Math.min(revStart + Math.floor(i / 2), contentDays - 1);
        days[di].revision.push(t);
      });
    }
    if (hasMock) days[numDays - 1].isMockDay = true;
    return days;
  };
  const pdfFmtDay = (d) => d ? d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "";

  // ── Build all week HTML blocks ─────────────────────────────────────────────
  let globalDay = 0;
  const weekBlocks = slots.map((slot) => {
    const studyTopics    = Array.isArray(slot.study)    ? slot.study    : [];
    const revisionTopics = Array.isArray(slot.revision) ? slot.revision : [];
    const [rangeStart, rangeEnd] = pdfParseDateRange(slot.date_range || "");
    const numDays = (rangeStart && rangeEnd)
      ? Math.min(Math.round((rangeEnd - rangeStart) / 86400000) + 1, 7)
      : 7;
    const dayPlans = pdfBuildDayPlan(studyTopics, revisionTopics, numDays, !!slot.mock);

    const dayCards = Array.from({ length: numDays }, (_, di) => {
      const dayNum = globalDay + di + 1;
      const date   = rangeStart ? new Date(rangeStart.getTime() + di * 86400000) : null;
      const dp     = dayPlans[di];
      const topicRows = [
        ...dp.study.map(t => `<div class="topic study-topic">☐ ${t}</div>`),
        ...dp.revision.map(t => `<div class="topic rev-topic">☐ 🔁 ${t}</div>`),
        ...(dp.isMockDay && slot.mock ? [`<div class="topic mock-topic">☐ 📝 ${slot.mock}</div>`] : []),
      ];
      const badge = dp.isMockDay ? '<span class="badge mock-badge">MOCK</span>'
                  : (dp.revision.length > 0 && dp.study.length === 0) ? '<span class="badge rev-badge">REV</span>'
                  : '';
      return `
      <div class="day-card">
        <div class="day-header">
          <span class="day-num">Day ${dayNum}</span>${badge}
        </div>
        <div class="day-date">${pdfFmtDay(date)}</div>
        <div class="day-topics">
          ${topicRows.length ? topicRows.join("") : '<div class="rest">Rest day</div>'}
        </div>
      </div>`;
    }).join("");

    globalDay += numDays;

    return `
    <div class="week-block">
      <div class="week-header">
        <div class="week-left">
          <span class="week-label">${slot.label || `WEEK`}</span>
          <span class="week-dates">${slot.date_range || ""}</span>
        </div>
        <span class="week-hours">⏱ ${slot.hours || daily_hours}h/day</span>
      </div>
      <div class="days-grid" style="grid-template-columns:repeat(${Math.min(numDays,7)},1fr)">
        ${dayCards}
      </div>
    </div>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>CS Study Plan - ${level}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #1e293b; padding: 24px; }
  .header { background: linear-gradient(135deg,#4f46e5,#7c3aed); color:white; border-radius:10px; padding:20px 24px; margin-bottom:16px; }
  .header h1 { font-size:18px; font-weight:700; margin-bottom:3px; }
  .header p  { opacity:0.82; font-size:11px; }
  .meta-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:16px; }
  .meta-box  { background:#f1f5f9; border-radius:8px; padding:8px; text-align:center; }
  .meta-box .val { font-size:15px; font-weight:700; color:#4f46e5; }
  .meta-box .lbl { font-size:9px; color:#64748b; margin-top:2px; }
  .section-title { font-size:13px; font-weight:700; color:#1e293b; margin-bottom:10px; padding-bottom:4px; border-bottom:2px solid #e2e8f0; }
  /* Week block */
  .week-block  { margin-bottom:16px; page-break-inside:avoid; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:12px; }
  .week-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
  .week-left   { display:flex; align-items:center; gap:8px; }
  .week-label  { background:#ede9fe; color:#5b21b6; padding:2px 10px; border-radius:20px; font-size:10px; font-weight:800; }
  .week-dates  { color:#64748b; font-size:10px; }
  .week-hours  { background:#f0fdf4; color:#166534; padding:2px 8px; border-radius:6px; font-size:9px; font-weight:700; border:1px solid #bbf7d0; }
  /* Days grid */
  .days-grid { display:grid; gap:6px; }
  .day-card  { background:white; border:1px solid #e2e8f0; border-radius:8px; padding:8px; min-height:60px; }
  .day-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:2px; }
  .day-num    { font-size:9px; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:0.05em; }
  .day-date   { font-size:10px; font-weight:600; color:#94a3b8; margin-bottom:5px; }
  .badge      { font-size:7px; font-weight:800; padding:1px 4px; border-radius:3px; }
  .rev-badge  { background:#fef3c7; color:#d97706; }
  .mock-badge { background:#fce7f3; color:#9d174d; }
  .day-topics { display:flex; flex-direction:column; gap:3px; }
  .topic      { font-size:9px; line-height:1.35; }
  .study-topic { color:#1d4ed8; }
  .rev-topic   { color:#92400e; }
  .mock-topic  { color:#9d174d; font-style:italic; }
  .rest        { font-size:9px; color:#cbd5e1; text-align:center; padding:6px 0; }
  /* Tips */
  .tips { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px; margin-top:12px; }
  .tip  { padding:3px 0; font-size:10px; color:#475569; border-bottom:1px solid #f1f5f9; }
  .tip:last-child { border:none; }
  .footer { text-align:center; margin-top:16px; color:#94a3b8; font-size:8px; }
  @media print {
    body { padding:12px; }
    .week-block { page-break-inside:avoid; }
    .day-card   { page-break-inside:avoid; }
  }
</style>
</head>
<body>
<div class="header">
  <h1>📚 CS Study Plan — ${level}</h1>
  <p>${plan_type} &nbsp;|&nbsp; ${planSubjects.join(", ")} &nbsp;|&nbsp; ${start_date} → ${exam_date}</p>
</div>
<div class="meta-grid">
  <div class="meta-box"><div class="val">${study_days}</div><div class="lbl">Study Days</div></div>
  <div class="meta-box"><div class="val">${daily_hours}h</div><div class="lbl">Daily Hours</div></div>
  <div class="meta-box"><div class="val">${slots.length}</div><div class="lbl">Weeks</div></div>
  <div class="meta-box"><div class="val">${total_chapters || "—"}</div><div class="lbl">Chapters</div></div>
</div>
<div class="section-title">📅 Day-by-Day Schedule</div>
${weekBlocks}
<div class="tips">
  <div class="section-title">📌 Revision Tips</div>
  <div class="tip">✅ Study ${daily_hours} hours daily without fail</div>
  <div class="tip">✅ Spend first 15 min each day revising previous topics</div>
  <div class="tip">✅ Solve past exam questions after every chapter</div>
  <div class="tip">✅ Take a mock test after every 2–3 chapters</div>
  ${weak_areas && weak_areas.length > 0 ? `<div class="tip">⚠️ Extra focus on: ${weak_areas.join(", ")}</div>` : ""}
</div>
<div class="footer">Generated by STEMS AI CS Mentor &nbsp;|&nbsp; Plan ID: ${plan_id || "—"}</div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) setTimeout(() => win.print(), 800);
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseDateRange(range) {
  if (!range) return [];
  const parts = range.split(" to ");
  if (parts.length !== 2) return [];
  const parse = (s) => { const d = new Date(s.trim()); return isNaN(d) ? null : d; };
  return [parse(parts[0]), parse(parts[1])].filter(Boolean);
}

function isToday(d) {
  if (!d || isNaN(d)) return false;
  const t = new Date();
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
}

function fmtDay(d) {
  if (!d || isNaN(d)) return "";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

// ── Balanced distribution ─────────────────────────────────────────────────────
// Spreads both study AND revision topics across all days in a week.
// Rules:
//   1. Study topics fill days evenly from the front.
//   2. Revision topics fill days evenly from the back, mixed in with study if needed.
//   3. No single day should have more than ~3 topics combined (hard cap = 4).
//   4. Mock test only goes on the very last day.
function buildDayPlan(studyTopics, revisionTopics, numDays, hasMock) {
  // Total days available for content (last day reserved for mock if present)
  const contentDays = hasMock ? Math.max(numDays - 1, 1) : numDays;
  const lastDay = numDays - 1;

  // Days per topic bucket (capped)
  const MAX_PER_DAY = 3;
  const days = Array.from({ length: numDays }, () => ({ study: [], revision: [] }));

  // Distribute study topics across first contentDays
  studyTopics.forEach((t, i) => {
    const di = i % contentDays;
    days[di].study.push(t);
  });

  // Distribute revision topics across contentDays (from the back to spread)
  if (revisionTopics.length > 0) {
    const revDaysNeeded = Math.ceil(revisionTopics.length / 2); // 2 revision topics per day
    const revStart = Math.max(0, contentDays - revDaysNeeded);
    revisionTopics.forEach((t, i) => {
      const di = revStart + Math.floor(i / 2);
      const safeDi = Math.min(di, contentDays - 1);
      days[safeDi].revision.push(t);
    });
  }

  // Attach mock to last day
  if (hasMock) {
    days[lastDay].isMockDay = true;
  }

  return days;
}

// ─── Day Card ─────────────────────────────────────────────────────────────────
const DayCard = ({ dayNum, date, study, revision, isMockDay, mockLabel, checked, onToggle }) => {
  const today = isToday(date);
  const hasContent = study.length > 0 || revision.length > 0 || isMockDay;
  const isRevisionOnly = revision.length > 0 && study.length === 0 && !isMockDay;

  return (
    <div style={{
      background: today ? "linear-gradient(135deg, rgba(79,70,229,0.08), rgba(124,58,237,0.05))" : "white",
      border: today ? "2px solid rgba(99,102,241,0.55)" : "1.5px solid #e2e8f0",
      borderRadius: 14, padding: "12px 11px", minWidth: 0,
      boxShadow: today ? "0 0 0 3px rgba(99,102,241,0.1)" : "none",
      position: "relative", transition: "box-shadow 0.2s",
    }}>
      {today && (
        <div style={{
          position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
          background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
          color: "white", fontSize: 9, fontWeight: 800,
          padding: "2px 8px", borderRadius: 20, letterSpacing: "0.06em", whiteSpace: "nowrap",
        }}>TODAY</div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 7 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 1 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: today ? "#4f46e5" : "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Day {dayNum}
          </span>
          {isRevisionOnly && !isMockDay && (
            <span style={{ fontSize: 9, fontWeight: 700, color: "#d97706", background: "#fef3c7", borderRadius: 4, padding: "1px 5px" }}>REV</span>
          )}
          {isMockDay && (
            <span style={{ fontSize: 9, fontWeight: 700, color: "#9d174d", background: "#fce7f3", borderRadius: 4, padding: "1px 5px" }}>MOCK</span>
          )}
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: today ? "#4f46e5" : "#94a3b8" }}>{fmtDay(date)}</div>
      </div>

      {hasContent ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {study.map((t, i) => (
            <label key={`s${i}`} style={{ display: "flex", alignItems: "flex-start", gap: 5, cursor: "pointer" }}>
              <input type="checkbox"
                checked={!!(checked?.[`s-${dayNum}-${i}`])}
                onChange={() => onToggle(`s-${dayNum}-${i}`)}
                style={{ marginTop: 2, accentColor: "#4f46e5", flexShrink: 0, cursor: "pointer" }} />
              <span style={{
                fontSize: 11, lineHeight: 1.4,
                color: checked?.[`s-${dayNum}-${i}`] ? "#94a3b8" : "#334155",
                textDecoration: checked?.[`s-${dayNum}-${i}`] ? "line-through" : "none",
              }}>{t}</span>
            </label>
          ))}
          {revision.map((t, i) => (
            <label key={`r${i}`} style={{ display: "flex", alignItems: "flex-start", gap: 5, cursor: "pointer" }}>
              <input type="checkbox"
                checked={!!(checked?.[`r-${dayNum}-${i}`])}
                onChange={() => onToggle(`r-${dayNum}-${i}`)}
                style={{ marginTop: 2, accentColor: "#d97706", flexShrink: 0, cursor: "pointer" }} />
              <span style={{
                fontSize: 11, lineHeight: 1.4,
                color: checked?.[`r-${dayNum}-${i}`] ? "#94a3b8" : "#92400e",
                textDecoration: checked?.[`r-${dayNum}-${i}`] ? "line-through" : "none",
              }}>🔁 {t}</span>
            </label>
          ))}
          {isMockDay && (
            <label style={{ display: "flex", alignItems: "flex-start", gap: 5, cursor: "pointer" }}>
              <input type="checkbox"
                checked={!!(checked?.[`m-${dayNum}`])}
                onChange={() => onToggle(`m-${dayNum}`)}
                style={{ marginTop: 2, accentColor: "#9d174d", flexShrink: 0, cursor: "pointer" }} />
              <span style={{
                fontSize: 11, lineHeight: 1.4, fontStyle: "italic",
                color: checked?.[`m-${dayNum}`] ? "#94a3b8" : "#9d174d",
                textDecoration: checked?.[`m-${dayNum}`] ? "line-through" : "none",
              }}>📝 {mockLabel || "Mock Test"}</span>
            </label>
          )}
        </div>
      ) : (
        <div style={{ fontSize: 11, color: "#cbd5e1", textAlign: "center", padding: "6px 0" }}>Rest day</div>
      )}
    </div>
  );
};

// ─── Week Block ───────────────────────────────────────────────────────────────
const WeekBlock = ({ slot, weekIndex, globalDayOffset, checked, onToggle }) => {
  if (!slot) return null;
  const studyTopics    = Array.isArray(slot.study)    ? slot.study    : [];
  const revisionTopics = Array.isArray(slot.revision) ? slot.revision : [];
  const [rangeStart, rangeEnd] = parseDateRange(slot.date_range || "");

  const numDays = (rangeStart && rangeEnd)
    ? Math.min(Math.round((rangeEnd - rangeStart) / 86400000) + 1, 7)
    : 7;

  const dayPlans = buildDayPlan(studyTopics, revisionTopics, numDays, !!slot.mock);

  const days = Array.from({ length: numDays }, (_, di) => ({
    dayNum: globalDayOffset + di + 1,
    date: rangeStart ? new Date(rangeStart.getTime() + di * 86400000) : null,
    ...dayPlans[di],
    mockLabel: slot.mock || null,
  }));

  const weekHasToday = days.some(d => d.date && isToday(d.date));

  return (
    <div style={{
      background: weekHasToday ? "rgba(238,242,255,0.5)" : "#f8fafc",
      border: weekHasToday ? "1.5px solid rgba(99,102,241,0.25)" : "1.5px solid #e2e8f0",
      borderRadius: 18, padding: "16px 16px 18px", marginBottom: 20,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            padding: "3px 12px", borderRadius: 20,
            background: weekHasToday ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "#ede9fe",
            color: weekHasToday ? "white" : "#5b21b6",
            fontSize: 12, fontWeight: 800, letterSpacing: "0.04em",
          }}>{slot.label || `WEEK ${weekIndex + 1}`}</span>
          <span style={{ fontSize: 13, color: "#64748b" }}>{slot.date_range || ""}</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#059669", background: "#f0fdf4", padding: "3px 10px", borderRadius: 8, border: "1px solid #bbf7d0" }}>
          ⏱ {slot.hours || 4}h/day
        </span>
      </div>

      <div className="sp-day-grid" style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(numDays, 7)}, 1fr)`, gap: 8 }}>
        {days.map((day, di) => (
          <DayCard
            key={di}
            dayNum={day.dayNum}
            date={day.date}
            study={day.study || []}
            revision={day.revision || []}
            isMockDay={!!day.isMockDay}
            mockLabel={day.mockLabel}
            checked={checked}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
};

// ─── Plans Drawer ──────────────────────────────────────────────────────────────
const PlansDrawer = ({ plans, activePlanId, onOpen, onDelete, onClose, loading }) => {
  const [confirmDelete, setConfirmDelete] = useState(null);
  const sorted = [...plans].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const fmtDate = (iso) => {
    if (!iso) return "—";
    try { return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
    catch { return iso; }
  };

  return (
    <div style={{
      background: "white",
      border: "1.5px solid #e2e8f0",
      borderRadius: 16,
      boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      overflow: "hidden",
      marginBottom: 16,
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
        padding: "13px 18px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <History size={15} style={{ color: "white" }} />
          <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>My Study Plans</span>
          <span style={{
            background: "rgba(255,255,255,0.25)", color: "white",
            borderRadius: 12, padding: "1px 8px", fontSize: 11, fontWeight: 800,
          }}>{plans.length}</span>
        </div>
        <button onClick={onClose} style={{
          background: "rgba(255,255,255,0.18)", border: "none", color: "white",
          borderRadius: 8, padding: "4px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700,
        }}>✕ Close</button>
      </div>

      {/* Body */}
      <div style={{ padding: "12px 14px", maxHeight: 440, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 28, color: "#94a3b8", fontSize: 13 }}>
            <div style={{ display: "inline-block", width: 20, height: 20, border: "2px solid #e2e8f0", borderTopColor: "#6366f1", borderRadius: "50%", animation: "splspin 0.8s linear infinite", marginBottom: 8 }} />
            <div>Loading plans…</div>
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: "28px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
            <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>No previous plans yet</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Generate your first plan to get started</div>
          </div>
        ) : sorted.map((plan) => {
          const isActive = plan.plan_id === activePlanId;
          const subjects = Array.isArray(plan.subjects) ? plan.subjects : [];

          return (
            <div key={plan.plan_id || Math.random()} style={{
              border: `2px solid ${isActive ? "rgba(99,102,241,0.45)" : "#e2e8f0"}`,
              background: isActive ? "linear-gradient(135deg,rgba(238,242,255,0.8),rgba(245,243,255,0.8))" : "white",
              borderRadius: 12, padding: "12px 14px",
              transition: "all 0.15s",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Title row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    {isActive && (
                      <span style={{
                        fontSize: 9, fontWeight: 800, letterSpacing: "0.05em",
                        color: "white", background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
                        borderRadius: 4, padding: "2px 7px",
                      }}>✓ ACTIVE</span>
                    )}
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                      {plan.level || "CS Plan"}
                    </span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>·</span>
                    <span style={{ fontSize: 11, color: "#64748b" }}>{plan.plan_type || "Study Plan"}</span>
                  </div>

                  {/* Date row */}
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>
                    📅 {plan.start_date} → {plan.exam_date}
                    <span style={{ marginLeft: 8, color: "#94a3b8" }}>Created {fmtDate(plan.created_at)}</span>
                  </div>

                  {/* Subject chips */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {subjects.slice(0, 3).map((s, i) => (
                      <span key={i} style={{
                        fontSize: 10, background: isActive ? "#ede9fe" : "#f1f5f9",
                        color: isActive ? "#5b21b6" : "#475569",
                        borderRadius: 5, padding: "2px 7px", fontWeight: 600,
                      }}>
                        {s.length > 22 ? s.slice(0, 20) + "…" : s}
                      </span>
                    ))}
                    {subjects.length > 3 && (
                      <span style={{ fontSize: 10, color: "#94a3b8", padding: "2px 0" }}>+{subjects.length - 3} more</span>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: 5, flexShrink: 0 }}>
                  {isActive ? (
                    <button onClick={() => onOpen(plan)} style={{
                      padding: "6px 12px", borderRadius: 8,
                      border: "1.5px solid rgba(99,102,241,0.5)",
                      background: "linear-gradient(135deg,rgba(79,70,229,0.12),rgba(124,58,237,0.08))",
                      color: "#4f46e5",
                      fontSize: 11, fontWeight: 700, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
                    }}>
                      <BookOpen size={11} /> View Plan
                    </button>
                  ) : (
                    <button onClick={() => onOpen(plan)} style={{
                      padding: "6px 12px", borderRadius: 8,
                      border: "1.5px solid rgba(99,102,241,0.4)",
                      background: "rgba(99,102,241,0.07)", color: "#4f46e5",
                      fontSize: 11, fontWeight: 700, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
                    }}>
                      <FolderOpen size={11} /> Open
                    </button>
                  )}
                  {confirmDelete === plan.plan_id ? (
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => { onDelete(plan.plan_id); setConfirmDelete(null); }} style={{
                        padding: "5px 9px", borderRadius: 7, border: "none",
                        background: "#ef4444", color: "white", fontSize: 11, fontWeight: 700, cursor: "pointer",
                      }}>Delete</button>
                      <button onClick={() => setConfirmDelete(null)} style={{
                        padding: "5px 9px", borderRadius: 7, border: "1.5px solid #e2e8f0",
                        background: "white", color: "#64748b", fontSize: 11, cursor: "pointer",
                      }}>Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(plan.plan_id)} style={{
                      padding: "5px 9px", borderRadius: 7,
                      border: "1.5px solid rgba(239,68,68,0.25)",
                      background: "rgba(239,68,68,0.05)", color: "#ef4444",
                      fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                    }}>
                      <Trash2 size={11} /> Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const StudyPlanner = () => {
  const { user } = useAuth();
  const [view, setView]               = useState("form"); // "form" | "plan"
  const [currentPlan, setCurrentPlan] = useState(null);
  const [allPlans, setAllPlans]       = useState([]);
  const [showPlans, setShowPlans]     = useState(false);
  const [plansLoading, setPlansLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [levels, setLevels]           = useState([]);
  const [subjects, setSubjects]       = useState([]);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [startDate, setStartDate]     = useState(null);
  const [endDate, setEndDate]         = useState(null);
  const [dailyHours, setDailyHours]   = useState("4");
  const [weakAreas, setWeakAreas]     = useState("");
  const [checked, setChecked]         = useState({});

  const toggleChecked = (key) => setChecked(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    fetchLevels();
    fetchCurrentPlan();
    fetchAllPlans();
  }, []);

  useEffect(() => {
    if (selectedLevel) { fetchSubjects(selectedLevel); setSelectedSubjects([]); }
  }, [selectedLevel]);

  const fetchLevels = async () => {
    try {
      const res = await axios.get(`${API}/syllabus/levels`);
      setLevels(res.data.levels || []);
    } catch {}
  };

  const fetchSubjects = async (level) => {
    try {
      const res = await axios.get(`${API}/syllabus/subjects/${level}`);
      setSubjects(res.data.subjects || []);
    } catch {}
  };

  const fetchCurrentPlan = async () => {
    try {
      const res = await axios.get(`${API}/planner/current`, {
        headers: getAuthHeaders(), withCredentials: true,
      });
      if (res.data.plan) {
        setCurrentPlan(res.data.plan);
        setView("plan");
      }
    } catch {}
  };

  const fetchAllPlans = async (delay = 0) => {
    if (delay) await new Promise(r => setTimeout(r, delay));
    setPlansLoading(true);
    try {
      const res = await axios.get(`${API}/planner/all`, {
        headers: getAuthHeaders(), withCredentials: true,
      });
      setAllPlans(res.data.plans || []);
    } catch (e) {
      console.error("fetchAllPlans:", e);
    } finally {
      setPlansLoading(false);
    }
  };

  // Always ensure currentPlan appears in the list (handles the case where
  // the generate response returns the plan before DB fetch completes)
  const mergedPlans = (() => {
    if (!currentPlan?.plan_id) return allPlans;
    const inList = allPlans.some(p => p.plan_id === currentPlan.plan_id);
    if (inList) {
      // Make sure the active one is flagged correctly
      return allPlans.map(p => ({
        ...p,
        is_active: p.plan_id === currentPlan.plan_id,
      }));
    }
    // Not yet in DB list (freshly generated) — prepend it
    return [{ ...currentPlan, is_active: true }, ...allPlans.map(p => ({ ...p, is_active: false }))];
  })();

  const toggleSubject = (name) =>
    setSelectedSubjects(prev => prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]);

  const handleGeneratePlan = async () => {
    if (!startDate || !endDate || !selectedLevel || selectedSubjects.length === 0) {
      toast.error("Please fill all required fields"); return;
    }
    const days = differenceInDays(endDate, startDate);
    if (days < 1) { toast.error("Exam date must be after start date"); return; }

    setIsGenerating(true);
    try {
      const res = await axios.post(
        `${API}/planner/generate`,
        {
          level: selectedLevel,
          subjects: selectedSubjects,
          start_date: format(startDate, "yyyy-MM-dd"),
          exam_date: format(endDate, "yyyy-MM-dd"),
          daily_hours: parseInt(dailyHours),
          weak_areas: weakAreas.split(",").map(a => a.trim()).filter(Boolean),
        },
        { headers: getAuthHeaders(), withCredentials: true }
      );
      setCurrentPlan(res.data);
      setView("plan");
      setChecked({});
      toast.success("Study plan generated!");
      _logActivity("planner", `Generated new study plan: ${selectedLevel}${selectedSubjects?.length ? " – " + selectedSubjects.slice(0, 2).join(", ") : ""}`);
      // Small delay to ensure DB write completes before fetching list
      fetchAllPlans(600);
    } catch (e) {
      if (e?.response?.status === 429) {
        setShowUpgradePopup(true);
      } else {
        toast.error("Failed to generate plan");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenPlan = async (plan) => {
    // If it's already the active plan, just switch to plan view
    if (plan.plan_id === currentPlan?.plan_id) {
      setView("plan");
      setShowPlans(false);
      return;
    }
    try {
      const res = await axios.post(
        `${API}/planner/activate/${plan.plan_id}`,
        {},
        { headers: getAuthHeaders(), withCredentials: true }
      );
      setCurrentPlan(res.data.plan || plan);
      setChecked({});
      setView("plan");
      setShowPlans(false);
      toast.success("Plan activated");
      fetchAllPlans();
    } catch {
      // Fallback: just display it locally
      setCurrentPlan(plan);
      setChecked({});
      setView("plan");
      setShowPlans(false);
    }
  };

  const handleDeletePlan = async (planId) => {
    try {
      await axios.delete(`${API}/planner/${planId}`, {
        headers: getAuthHeaders(), withCredentials: true,
      });
      toast.success("Plan deleted");
      const updated = allPlans.filter(p => p.plan_id !== planId);
      setAllPlans(updated);
      // If deleted plan was the active one, fall back to next
      if (currentPlan?.plan_id === planId) {
        const next = updated.find(p => p.is_active) || updated[0] || null;
        if (next) { setCurrentPlan(next); setView("plan"); }
        else { setCurrentPlan(null); setView("form"); }
      }
    } catch {
      toast.error("Failed to delete plan");
    }
  };

  const studyDays = startDate && endDate ? differenceInDays(endDate, startDate) : 0;
  const totalChapters = subjects.filter(s => selectedSubjects.includes(s.name)).reduce((sum, s) => sum + (s.chapter_count || 0), 0);

  // ── PLAN VIEW ─────────────────────────────────────────────────────────────
  if (view === "plan" && currentPlan) {
    const plan_type     = currentPlan.plan_type || "Study Plan";
    const level         = currentPlan.level || "";
    const ps            = Array.isArray(currentPlan.subjects) ? currentPlan.subjects : [];
    const start_date    = currentPlan.start_date || "";
    const exam_date     = currentPlan.exam_date || "";
    const study_days    = currentPlan.study_days || 0;
    const daily_hours   = currentPlan.daily_hours || 4;
    const slots         = Array.isArray(currentPlan.slots) ? currentPlan.slots : [];
    const weak_areas    = Array.isArray(currentPlan.weak_areas) ? currentPlan.weak_areas : [];
    const total_chapters = currentPlan.total_chapters || 0;
    const daysLeft      = exam_date ? Math.max(0, differenceInDays(new Date(exam_date), new Date())) : 0;
    // ── extract plan fields ──

    return (
      <DashboardLayout user={user} headerAction={
        <button onClick={() => downloadPlanAsPDF(currentPlan)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg" title="Export PDF">
          <Download className="w-5 h-5" />
        </button>
      }>
        <style>{`
          @keyframes splspin { to { transform: rotate(360deg); } }
          @media (max-width: 640px) { .sp-day-grid { grid-template-columns: 1fr !important; } }
          @media (min-width: 641px) and (max-width: 900px) { .sp-day-grid { grid-template-columns: repeat(3, 1fr) !important; } }
        `}</style>

        <div className="max-w-4xl mx-auto space-y-5 px-2 sm:px-0" data-testid="study-planner">

          {/* ── Plan switcher bar ── */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => { const op = !showPlans; setShowPlans(op); if (op) fetchAllPlans(); }}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "8px 14px", borderRadius: 10,
                background: showPlans ? "linear-gradient(135deg,rgba(79,70,229,0.12),rgba(124,58,237,0.08))" : "white",
                border: `1.5px solid ${showPlans ? "rgba(99,102,241,0.5)" : "#e2e8f0"}`,
                color: showPlans ? "#4f46e5" : "#475569",
                fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
              }}
            >
              <History size={14} />
              My Plans
              <span style={{ background: "#ede9fe", color: "#5b21b6", borderRadius: 12, padding: "1px 7px", fontSize: 11, fontWeight: 800 }}>
                {mergedPlans.length}
              </span>
              {showPlans ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            <button
              onClick={() => { setView("form"); setShowPlans(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 10,
                background: "white", border: "1.5px solid #e2e8f0",
                color: "#475569", fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}
            >
              <Plus size={14} /> New Plan
            </button>

            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>Active:</span>
              <span style={{
                background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
                color: "white", borderRadius: 8, padding: "4px 10px",
                fontSize: 12, fontWeight: 700,
              }}>{level} · {ps.slice(0, 2).join(", ")}{ps.length > 2 ? ` +${ps.length - 2}` : ""}</span>
            </div>
          </div>

          {/* ── Plans panel ── */}
          {showPlans && (
            <PlansDrawer
              plans={mergedPlans}
              activePlanId={currentPlan.plan_id}
              onOpen={handleOpenPlan}
              onDelete={handleDeletePlan}
              onClose={() => setShowPlans(false)}
              loading={plansLoading}
            />
          )}

          {/* ── Banner ── */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-5 sm:p-7 text-white">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-0 justify-between">
                <div>
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-semibold">{plan_type}</span>
                  <h1 className="text-2xl font-bold mt-2 mb-1" style={{ fontFamily: "Outfit" }}>Your CS Study Plan</h1>
                  <p className="opacity-80 text-sm">{level} &nbsp;·&nbsp; {ps.join(", ")}</p>
                </div>
                <div className="text-center bg-white/20 rounded-2xl px-5 py-3">
                  <CalendarIcon className="w-6 h-6 mx-auto mb-1" />
                  <p className="text-xs opacity-75">Study Period</p>
                  <p className="font-bold text-sm">{start_date} → {exam_date}</p>
                </div>
              </div>
            </div>
            <CardContent className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5">
                {[
                  { icon: <Clock className="w-5 h-5 text-indigo-500" />, val: `${daily_hours}h`, lbl: "Daily Study" },
                  { icon: <BookOpen className="w-5 h-5 text-purple-500" />, val: ps.length, lbl: "Subjects" },
                  { icon: <Target className="w-5 h-5 text-emerald-500" />, val: daysLeft, lbl: "Days Left" },
                  { icon: <Brain className="w-5 h-5 text-amber-500" />, val: total_chapters || "—", lbl: "Chapters" },
                ].map((s, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-4 text-center">
                    <div className="flex justify-center mb-1">{s.icon}</div>
                    <div className="text-2xl font-bold text-slate-900">{s.val}</div>
                    <div className="text-xs text-slate-500">{s.lbl}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {ps.map((s, i) => <span key={i} className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">{s}</span>)}
                {weak_areas.map((w, i) => <span key={i} className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">⚠️ {w}</span>)}
              </div>
            </CardContent>
          </Card>

          {/* ── Schedule ── */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-lg" style={{ fontFamily: "Outfit" }}>
                <BookMarked className="w-5 h-5 text-indigo-600" />
                {study_days <= 7 ? "Day-by-Day" : "Week-by-Week"} Schedule
              </CardTitle>
              <CardDescription>
                {slots.length} {study_days <= 7 ? "days" : "weeks"} · {study_days} total study days · {start_date} → {exam_date}
                <span style={{ marginLeft: 8, fontSize: 11, color: "#6366f1", fontWeight: 600 }}>
                  ✓ Check off topics as you complete them
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-2">
              {slots.map((slot, i) => {
                const prevDays = slots.slice(0, i).reduce((sum, s) => {
                  const [rs, re] = (() => {
                    const parts = (s.date_range || "").split(" to ");
                    if (parts.length !== 2) return [];
                    return [new Date(parts[0].trim()), new Date(parts[1].trim())];
                  })();
                  if (rs && re && !isNaN(rs) && !isNaN(re)) return sum + Math.min(Math.round((re - rs) / 86400000) + 1, 7);
                  return sum + 7;
                }, 0);
                return (
                  <WeekBlock
                    key={i}
                    slot={slot}
                    weekIndex={i}
                    globalDayOffset={prevDays}
                    checked={checked}
                    onToggle={toggleChecked}
                  />
                );
              })}

              {/* Tips */}
              <div className="mt-4 p-5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" /> Revision Tips
                </h4>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex gap-2"><span className="text-indigo-500">✓</span> Study {daily_hours} hours daily without fail</li>
                  <li className="flex gap-2"><span className="text-indigo-500">✓</span> Spend first 15 min revising yesterday's topics</li>
                  <li className="flex gap-2"><span className="text-indigo-500">✓</span> Solve past exam questions after every chapter</li>
                  <li className="flex gap-2"><span className="text-indigo-500">✓</span> Take a mock test after every 2–3 chapters</li>
                  {weak_areas.length > 0 && (
                    <li className="flex gap-2"><span className="text-amber-500">⚠</span> Extra focus on: {weak_areas.join(", ")}</li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>

        </div>
        <UpgradePopup
          open={showUpgradePopup}
          onClose={() => setShowUpgradePopup(false)}
          planName={user?.plan}
        />
      </DashboardLayout>
    );
  }

  // ── FORM VIEW ─────────────────────────────────────────────────────────────
  return (
    <DashboardLayout user={user}>
      <div className="w-full max-w-2xl mx-auto px-0 sm:px-0" data-testid="study-planner">

        {/* Previous plans button in form view */}
        {mergedPlans.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <button
              onClick={() => { const op = !showPlans; setShowPlans(op); if (op) fetchAllPlans(); }}
              style={{
                display: "flex", alignItems: "center", gap: 7, width: "100%",
                padding: "10px 16px", borderRadius: 12,
                background: showPlans ? "rgba(238,242,255,0.8)" : "white",
                border: `1.5px solid ${showPlans ? "rgba(99,102,241,0.4)" : "#e2e8f0"}`,
                color: showPlans ? "#4f46e5" : "#475569",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                justifyContent: "space-between", transition: "all 0.15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <History size={15} style={{ color: showPlans ? "#4f46e5" : "#6366f1" }} />
                <span>My Saved Plans</span>
                <span style={{ background: "#ede9fe", color: "#5b21b6", borderRadius: 12, padding: "1px 7px", fontSize: 11, fontWeight: 800 }}>
                  {mergedPlans.length}
                </span>
              </div>
              {showPlans ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showPlans && (
              <div style={{ marginTop: 10 }}>
                <PlansDrawer
                  plans={mergedPlans}
                  activePlanId={currentPlan?.plan_id}
                  onOpen={handleOpenPlan}
                  onDelete={handleDeletePlan}
                  onClose={() => setShowPlans(false)}
                  loading={plansLoading}
                />
              </div>
            )}
          </div>
        )}

        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardTitle className="flex items-center gap-2 text-xl" style={{ fontFamily: "Outfit" }}>
              <GraduationCap className="w-6 h-6 text-indigo-600" />
              Create Study Plan
            </CardTitle>
            <CardDescription>Fill all details to generate your personalized study schedule</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">

            {/* Step 1 */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                Select Your CS Level *
              </label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="h-12" data-testid="level-select">
                  <SelectValue placeholder="Choose your CS Level" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Step 2 */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                Select Subjects *
                {selectedSubjects.length > 0 && <span className="ml-auto text-xs text-emerald-600 font-medium">✓ {selectedSubjects.length} selected</span>}
              </label>
              {!selectedLevel ? (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-400 text-sm border border-dashed">
                  Select your CS Level first
                </div>
              ) : (
                <div className="space-y-2">
                  {subjects.map((subject, idx) => (
                    <button key={idx} onClick={() => toggleSubject(subject.name)}
                      className={`w-full p-3 text-left rounded-xl border-2 transition-all flex items-center justify-between ${selectedSubjects.includes(subject.name) ? "bg-indigo-50 border-indigo-300" : "bg-white border-slate-200 hover:border-indigo-200"}`}
                      data-testid={`subject-${idx}`}>
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{subject.name}</p>
                        <p className="text-xs text-slate-500">{subject.chapter_count} chapters</p>
                      </div>
                      {selectedSubjects.includes(subject.name) && <CheckCircle className="w-5 h-5 text-indigo-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Step 3 */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                Study Period *
              </label>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">📚 Study Start Date</label>
                  <input type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={startDate ? format(startDate, "yyyy-MM-dd") : ""}
                    onChange={e => {
                      if (e.target.value) { const d = new Date(e.target.value + "T00:00:00"); setStartDate(d); if (endDate && d >= endDate) setEndDate(null); }
                      else setStartDate(null);
                    }}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white"
                    data-testid="start-date-input" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">🎯 Exam Date</label>
                  <input type="date"
                    min={startDate ? format(new Date(startDate.getTime() + 86400000), "yyyy-MM-dd") : new Date().toISOString().split("T")[0]}
                    value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
                    onChange={e => { if (e.target.value) setEndDate(new Date(e.target.value + "T00:00:00")); else setEndDate(null); }}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-white"
                    data-testid="end-date-input" />
                </div>
              </div>
              {startDate && endDate && studyDays > 0 && (
                <div className="mt-2 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100 flex items-center justify-between">
                  <span className="text-sm text-indigo-700 font-medium">📅 {format(startDate, "dd MMM yyyy")} → {format(endDate, "dd MMM yyyy")}</span>
                  <span className="text-purple-700 font-bold text-sm">{studyDays} days · {Math.round(studyDays * parseInt(dailyHours))}h total</span>
                </div>
              )}
              {startDate && endDate && studyDays > 0 && totalChapters > 0 && (() => {
                if (studyDays <= 3) return (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm font-semibold text-red-700 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Only {studyDays} day(s) for {totalChapters} chapters — very tight!</p>
                    <p className="text-xs text-red-600 mt-1">Emergency plan — only critical exam topics.</p>
                  </div>
                );
                if (studyDays <= 7) return (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-sm font-semibold text-amber-700 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {studyDays} days for {totalChapters} chapters — short on time</p>
                    <p className="text-xs text-amber-600 mt-1">Crash course — high-weightage topics only.</p>
                  </div>
                );
                return null;
              })()}
            </div>

            {/* Step 4 */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">4</span>
                Daily Study Hours
              </label>
              <Select value={dailyHours} onValueChange={setDailyHours}>
                <SelectTrigger className="h-12" data-testid="hours-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 hours (Light)</SelectItem>
                  <SelectItem value="3">3 hours (Moderate)</SelectItem>
                  <SelectItem value="4">4 hours (Standard)</SelectItem>
                  <SelectItem value="5">5 hours (Intensive)</SelectItem>
                  <SelectItem value="6">6 hours (Full-time)</SelectItem>
                  <SelectItem value="8">8 hours (Exam Mode)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Step 5 */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-400 text-white text-xs flex items-center justify-center font-bold">5</span>
                Weak Areas <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <Input placeholder="e.g., Board Meetings, Company Formation" value={weakAreas} onChange={e => setWeakAreas(e.target.value)} className="h-12" data-testid="weak-areas-input" />
              <p className="text-xs text-slate-500 mt-1">Comma separated. Extra time will be allocated.</p>
            </div>

            {/* Generate */}
            <Button onClick={handleGeneratePlan}
              disabled={isGenerating || !startDate || !endDate || selectedSubjects.length === 0 || !selectedLevel}
              size="lg" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-14 text-base"
              data-testid="create-plan-btn">
              {isGenerating
                ? <><Loader2 className="w-5 h-5 animate-spin mr-2" />Generating Your Plan...</>
                : <><Sparkles className="w-5 h-5 mr-2" />Generate Study Plan</>}
            </Button>

            {(!selectedLevel || selectedSubjects.length === 0 || !startDate || !endDate) && (
              <p className="text-xs text-center text-slate-400">
                {!selectedLevel ? "⬆ Select your CS Level" : selectedSubjects.length === 0 ? "⬆ Select at least one subject" : "⬆ Select study start and exam date"}
              </p>
            )}

          </CardContent>
        </Card>
      </div>
      <UpgradePopup
        open={showUpgradePopup}
        onClose={() => setShowUpgradePopup(false)}
        planName={user?.plan}
      />
    </DashboardLayout>
  );
};

export default StudyPlanner;
