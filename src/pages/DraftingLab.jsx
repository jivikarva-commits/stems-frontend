import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useAuth } from "../App";
import { API } from "../App";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import UpgradePopup from "../components/UpgradePopup";
import {
  PenTool, FileText, CheckCircle, Loader2,
  ClipboardList, AlertCircle, History, Send,
  Award, Target, BookOpen, MessageSquare, XCircle,
  Lightbulb, ArrowRight, Scale, FileCheck, Sparkles,
  Trash2, FolderOpen, RotateCcw, X
} from "lucide-react";

// ── Activity Logger ───────────────────────────────────────────────────────────
const _logActivity = (activityType, description) => {
  try {
    const token = localStorage.getItem("token");
    axios.post(`${API}/activity/log`, { activity_type: activityType, description }, {
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      withCredentials: true,
    }).catch(() => {});
  } catch {}
};

// ── Study Time Tracker ────────────────────────────────────────────────────────
const StudyTimeTracker = () => {
  const startRef = useRef(Date.now());
  const API_BASE = API;
  useEffect(() => {
    startRef.current = Date.now();
    return () => {
      const minutes = (Date.now() - startRef.current) / 60000;
      if (minutes < 0.25) return;
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const body = JSON.stringify({ minutes: parseFloat(minutes.toFixed(1)) });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(`${API_BASE}/analytics/study-time`, new Blob([body], { type: "application/json" }));
      } else {
        fetch(`${API_BASE}/analytics/study-time`, { method: "POST", headers, body, keepalive: true }).catch(() => {});
      }
    };
  }, []);
  return null;
};

// ── Confirmation Dialog ───────────────────────────────────────────────────────
const ConfirmDialog = ({ open, title, message, confirmLabel = "Confirm", confirmColor = "#ef4444", onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: "white", borderRadius: 16, padding: 28, maxWidth: 380, width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        <div style={{ marginBottom: 8, fontSize: 15, fontWeight: 700, color: "#1e293b" }}>{title}</div>
        <div style={{ marginBottom: 24, fontSize: 13, color: "#64748b", lineHeight: 1.55 }}>{message}</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{
            padding: "8px 18px", borderRadius: 9, border: "1.5px solid #e2e8f0",
            background: "white", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            padding: "8px 18px", borderRadius: 9, border: "none",
            background: confirmColor, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const DraftingLab = () => {
  const { user } = useAuth();
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [selectedDraftType, setSelectedDraftType] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [submittedDraftContent, setSubmittedDraftContent] = useState(""); // ← stores draft at submit time
  const [currentDraftId, setCurrentDraftId] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("practice");

  // Follow-up chat
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [followUpResponse, setFollowUpResponse] = useState("");
  const [isAskingFollowUp, setIsAskingFollowUp] = useState(false);

  // AI Chat during drafting
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);

  // Confirmation dialogs
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDeleteDraft, setConfirmDeleteDraft] = useState(null); // draft_id

  const draftTypes = [
    { value: "board_resolution", label: "Board Resolution", icon: "📋" },
    { value: "meeting_notice", label: "Meeting Notice (AGM/EGM)", icon: "📢" },
    { value: "minutes", label: "Meeting Minutes", icon: "📝" },
    { value: "legal_notice", label: "Legal Notice", icon: "⚖️" },
    { value: "shareholders_agreement", label: "Shareholders Agreement", icon: "🤝" },
    { value: "compliance_certificate", label: "Compliance Certificate", icon: "✅" },
  ];

  useEffect(() => {
    fetchScenarios();
    fetchHistory();
  }, []);

  useEffect(() => {
    if (selectedDraftType && selectedDraftType !== "all") {
      fetchScenarios(selectedDraftType);
    } else {
      fetchScenarios();
    }
  }, [selectedDraftType]);

  const authHeaders = () => {
    const t = localStorage.getItem("token");
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const fetchScenarios = async (draftType = "") => {
    try {
      const url = draftType ? `${API}/drafting/scenarios?draft_type=${draftType}` : `${API}/drafting/scenarios`;
      const res = await axios.get(url, { headers: authHeaders(), withCredentials: true });
      setScenarios(res.data.scenarios || []);
    } catch {}
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API}/drafting/history`, { headers: authHeaders(), withCredentials: true });
      setHistory(res.data.drafts || []);
    } catch {}
  };

  // ── Submit draft ────────────────────────────────────────────────────────────
  const handleSubmitDraft = async () => {
    if (!draftContent.trim()) {
      toast.error("Please write your draft before submitting"); return;
    }
    if (draftContent.length < 100) {
      toast.error("Your draft seems too short. Please write a more detailed draft."); return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(
        `${API}/drafting/evaluate`,
        {
          scenario_id: selectedScenario?.scenario_id || null,
          draft_type: selectedScenario?.draft_type || "custom_scenario",
          title: draftTitle || selectedScenario?.title || "Custom Scenario",
          content: draftContent,
        },
        { headers: authHeaders(), withCredentials: true }
      );

      setSubmittedDraftContent(draftContent); // ← save the text before clearing view
      setEvaluationResult({ evaluation: res.data.evaluation, score: res.data.score, draft_id: res.data.draft_id });
      setCurrentDraftId(res.data.draft_id);
      toast.success("Draft evaluated successfully!");
      fetchHistory();
      const label = draftTypes.find(d => d.value === selectedDraftType)?.label || selectedDraftType?.replace(/_/g, " ") || "Document";
      _logActivity("draft", `Generated legal draft: ${label}`);
    } catch (err) {
      if (err?.response?.status === 429) {
        setShowUpgradePopup(true);
      } else {
        const detail = err?.response?.data?.detail;
        toast.error(detail || "Failed to evaluate draft");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Revise this draft — load submitted text back into editor ────────────────
  const handleReviseDraft = () => {
    setDraftContent(submittedDraftContent); // restore the submitted text
    setEvaluationResult(null);
    setShowFollowUp(false);
    setFollowUpQuestion("");
    setFollowUpResponse("");
  };

  // ── New draft — completely empty ────────────────────────────────────────────
  const handleNewDraft = () => {
    setSelectedScenario(null);
    setDraftContent("");
    setDraftTitle("");
    setEvaluationResult(null);
    setCurrentDraftId(null);
    setSubmittedDraftContent("");
    setShowFollowUp(false);
    setFollowUpQuestion("");
    setFollowUpResponse("");
    setChatMessages([]);
  };

  // ── Open a history item — load content into editor ─────────────────────────
  const handleOpenHistoryItem = (draft) => {
    // Find matching scenario if possible
    const match = scenarios.find(s => s.scenario_id === draft.scenario_id);
    if (match) setSelectedScenario(match);
    else {
      // Create a minimal pseudo-scenario so the editor renders correctly
      setSelectedScenario({
        scenario_id: draft.scenario_id || draft.draft_id,
        title: draft.title,
        draft_type: draft.draft_type,
        scenario_description: "",
        instructions: [],
        key_points: [],
      });
    }
    setDraftContent(draft.content || "");
    setDraftTitle(draft.title || "");
    setEvaluationResult(null);
    setSubmittedDraftContent(draft.content || "");
    setChatMessages([]);
    setActiveTab("practice");
    toast.success("Draft loaded into editor");
  };

  // ── Delete history item ─────────────────────────────────────────────────────
  const handleDeleteDraft = async (draftId) => {
    try {
      await axios.delete(`${API}/drafting/${draftId}`, { headers: authHeaders(), withCredentials: true });
      setHistory(prev => prev.filter(d => d.draft_id !== draftId));
      toast.success("Draft deleted");
    } catch {
      toast.error("Failed to delete draft");
    }
    setConfirmDeleteDraft(null);
  };

  // ── Follow-up ───────────────────────────────────────────────────────────────
  const handleFollowUp = async () => {
    if (!followUpQuestion.trim() || !currentDraftId) return;
    setIsAskingFollowUp(true);
    try {
      const res = await axios.post(`${API}/drafting/followup`,
        { draft_id: currentDraftId, question: followUpQuestion },
        { headers: authHeaders(), withCredentials: true }
      );
      setFollowUpResponse(res.data.response);
      setFollowUpQuestion("");
    } catch (err) {
      if (err?.response?.status === 429) {
        setShowUpgradePopup(true);
      } else {
        const detail = err?.response?.data?.detail;
        toast.error(detail || "Failed to get response");
      }
    } finally {
      setIsAskingFollowUp(false);
    }
  };

  // ── AI chat during drafting ─────────────────────────────────────────────────
  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsChatting(true);
    try {
      const context = selectedScenario
        ? `Context: The student is drafting a "${selectedScenario.draft_type?.replace(/_/g, " ")}" document. Scenario: ${selectedScenario.scenario_description}. Instructions: ${selectedScenario.instructions?.join(", ")}. Key points: ${selectedScenario.key_points?.join(", ")}.`
        : "Context: General corporate drafting assistance.";
      const res = await axios.post(`${API}/ai/drafting-chat`,
        { question: userMsg, draft_type: selectedScenario?.draft_type || null, context },
        { headers: authHeaders(), withCredentials: true }
      );
      setChatMessages(prev => [...prev, { role: "assistant", content: res.data.response }]);
    } catch (err) {
      if (err?.response?.status === 429) {
        setShowUpgradePopup(true);
      }
      const detail = err?.response?.data?.detail;
      setChatMessages(prev => [...prev, { role: "assistant", content: detail || "Sorry, I couldn't process your question. Please try again." }]);
    } finally {
      setIsChatting(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreBg = (score) => {
    if (score >= 80) return "bg-emerald-100";
    if (score >= 60) return "bg-blue-100";
    if (score >= 40) return "bg-amber-100";
    return "bg-red-100";
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Needs Improvement";
    return "Requires Practice";
  };

  return (
    <DashboardLayout user={user}>
      <div className="max-w-7xl mx-auto space-y-6 px-2 sm:px-0" data-testid="drafting-lab">
        <StudyTimeTracker />

        {/* Confirmation Dialogs */}
        <ConfirmDialog
          open={confirmClear}
          title="Clear Draft?"
          message="Are you sure you want to clear the entire draft? This cannot be undone."
          confirmLabel="Clear All"
          confirmColor="#ef4444"
          onConfirm={() => { setDraftContent(""); setConfirmClear(false); toast.success("Draft cleared"); }}
          onCancel={() => setConfirmClear(false)}
        />
        <ConfirmDialog
          open={!!confirmDeleteDraft}
          title="Delete Submission?"
          message="Delete this draft submission? This action cannot be undone."
          confirmLabel="Delete"
          confirmColor="#ef4444"
          onConfirm={() => handleDeleteDraft(confirmDeleteDraft)}
          onCancel={() => setConfirmDeleteDraft(null)}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 bg-slate-100 p-1 rounded-xl w-full overflow-x-auto">
            <TabsTrigger value="practice" className="rounded-lg">
              <PenTool className="w-4 h-4 mr-2" /> Practice Drafting
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg">
              <History className="w-4 h-4 mr-2" /> Submission History
              {history.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">{history.length}</span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ══ PRACTICE TAB ══ */}
          <TabsContent value="practice">

            {/* ── Evaluation result view ── */}
            {evaluationResult ? (
              <div className="space-y-6 overflow-x-hidden">
                <Card className="border-0 shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "Outfit" }}>
                          Draft Evaluation Complete
                        </h1>
                        <p className="opacity-80">{selectedScenario?.title}</p>
                      </div>
                      <div className="text-center">
                        <div className="text-6xl font-bold">{evaluationResult.score}</div>
                        <p className="text-white/80 text-sm">out of 100</p>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-8">
                      <div className="p-4 bg-slate-50 rounded-xl text-center">
                        <Award className={`w-8 h-8 mx-auto mb-2 ${getScoreColor(evaluationResult.score)}`} />
                        <div className={`text-2xl font-bold ${getScoreColor(evaluationResult.score)}`}>
                          {getScoreLabel(evaluationResult.score)}
                        </div>
                        <p className="text-sm text-slate-500">Performance Level</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl text-center">
                        <FileCheck className="w-8 h-8 mx-auto mb-2 text-indigo-600" />
                        <div className="text-2xl font-bold text-slate-900">
                          {submittedDraftContent.split(/\s+/).filter(Boolean).length}
                        </div>
                        <p className="text-sm text-slate-500">Words Written</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl text-center">
                        <Scale className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                        <div className="text-lg font-bold text-slate-900">
                          {selectedScenario?.draft_type?.replace(/_/g, " ")}
                        </div>
                        <p className="text-sm text-slate-500">Document Type</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-6 mb-6">
                      <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                        Detailed AI Evaluation
                      </h3>
                      <ScrollArea className="h-64 sm:h-[400px] pr-4">
                        <div className="prose prose-sm max-w-none text-slate-700">
                          {evaluationResult.evaluation?.split("\n").map((line, i) => {
                            if (line.startsWith("##")) return <h3 key={i} className="text-lg font-semibold text-slate-900 mt-4 mb-2">{line.replace("##", "").trim()}</h3>;
                            if (line.startsWith("###")) return <h4 key={i} className="text-md font-semibold text-slate-800 mt-3 mb-1">{line.replace("###", "").trim()}</h4>;
                            if (line.startsWith("-")) return <li key={i} className="ml-4">{line.replace("-", "").trim()}</li>;
                            if (line.includes("Score:") || /\/\d+/.test(line)) return <p key={i} className="font-medium text-indigo-700 bg-indigo-50 px-3 py-1 rounded inline-block my-1">{line}</p>;
                            return line.trim() ? <p key={i} className="mb-2">{line}</p> : null;
                          })}
                        </div>
                      </ScrollArea>
                    </div>

                    {/* Follow-up */}
                    <div className="border-t border-slate-200 pt-6">
                      <Button variant="outline" onClick={() => setShowFollowUp(!showFollowUp)} className="mb-4">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        {showFollowUp ? "Hide Follow-up Chat" : "Ask Follow-up Questions"}
                      </Button>
                      {showFollowUp && (
                        <div className="space-y-4 bg-slate-50 rounded-xl p-4">
                          <div className="flex gap-2 sm:gap-3">
                            <Input
                              placeholder="Ask about your draft, suggestions for improvement, or clarifications..."
                              value={followUpQuestion}
                              onChange={e => setFollowUpQuestion(e.target.value)}
                              onKeyPress={e => e.key === "Enter" && handleFollowUp()}
                              className="flex-1"
                            />
                            <Button onClick={handleFollowUp} disabled={isAskingFollowUp || !followUpQuestion.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                              {isAskingFollowUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </Button>
                          </div>
                          {followUpResponse && (
                            <div className="bg-white rounded-lg p-4 border border-slate-200">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                  <Lightbulb className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div className="text-sm text-slate-700">
                                  {followUpResponse.split("\n").map((line, i) => <p key={i} className="mb-2">{line}</p>)}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Action buttons */}
                <div className="flex flex-col xs:flex-row gap-3 sm:gap-4">
                  <Button
                    onClick={handleNewDraft}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                    New Draft
                  </Button>
                  <Button
                    onClick={handleReviseDraft}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Revise This Draft
                  </Button>
                </div>
              </div>

            ) : (
              /* ── Drafting editor view ── */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left — scenario picker */}
                <div className="lg:col-span-3">
                  <Card className="border-0 shadow-lg sticky top-24">
                    <CardHeader className="border-b border-slate-100">
                      <CardTitle className="text-lg flex items-center gap-2" style={{ fontFamily: "Outfit" }}>
                        <ClipboardList className="w-5 h-5 text-indigo-600" />
                        Select Scenario
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="mb-4">
                        <label className="text-sm font-medium text-slate-700 mb-2 block">Filter by Type</label>
                        <Select value={selectedDraftType || "all"} onValueChange={val => setSelectedDraftType(val === "all" ? "" : val)}>
                          <SelectTrigger data-testid="draft-type-select">
                            <SelectValue placeholder="All Document Types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Document Types</SelectItem>
                            {draftTypes.map(t => (
                              <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <ScrollArea className="h-48 sm:h-64 lg:h-[400px] pr-2">
                        <div className="space-y-3">
                          {scenarios.map((scenario, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setSelectedScenario(scenario);
                                setDraftContent("");
                                setDraftTitle(scenario.title);
                                setEvaluationResult(null);
                                setChatMessages([]);
                              }}
                              className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                                selectedScenario?.scenario_id === scenario.scenario_id
                                  ? "bg-indigo-50 border-indigo-300 shadow-md"
                                  : "bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50"
                              }`}
                              data-testid={`scenario-${scenario.scenario_id}`}
                            >
                              <h4 className="font-medium text-slate-900 text-sm mb-2">{scenario.title}</h4>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  scenario.difficulty === "easy" ? "bg-green-100 text-green-700" :
                                  scenario.difficulty === "medium" ? "bg-amber-100 text-amber-700" :
                                  "bg-red-100 text-red-700"
                                }`}>{scenario.difficulty || "medium"}</span>
                                <span className="text-xs text-slate-500">{scenario.draft_type?.replace(/_/g, " ")}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>

                {/* Right — editor */}
                <div className="lg:col-span-9 space-y-6">
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="border-b border-slate-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2" style={{ fontFamily: "Outfit" }}>
                            <PenTool className="w-5 h-5 text-indigo-600" />
                            Draft Your Document
                          </CardTitle>
                          <CardDescription>
                            Write your draft below and use AI help for guidance on structure, clauses, or formatting.
                          </CardDescription>
                        </div>
                        <MessageSquare className="w-5 h-5 text-slate-400" />
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">

                      {/* Textarea */}
                      <Textarea
                        placeholder={selectedScenario
                          ? `Start drafting your ${selectedScenario.draft_type?.replace(/_/g, " ")} here...`
                          : "Start drafting your document here... (optionally select a scenario from the left for guided practice)"}
                        value={draftContent}
                        onChange={e => setDraftContent(e.target.value)}
                        className="min-h-[200px] sm:min-h-[400px] font-mono text-sm border-2 focus:border-indigo-300 resize-y"
                        data-testid="draft-textarea"
                      />

                      {/* Bottom bar: stats + Clear + Submit */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between pt-2 border-t border-slate-100">
                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span>{draftContent.length} characters</span>
                          <span>{draftContent.split(/\s+/).filter(Boolean).length} words</span>
                          {draftContent.length < 100 && draftContent.length > 0 && (
                            <span className="text-amber-600 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" /> Draft is too short
                            </span>
                          )}
                        </div>

                        {/* Buttons */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Clear All */}
                          <Button
                            variant="outline"
                            onClick={() => draftContent.trim() ? setConfirmClear(true) : null}
                            disabled={!draftContent.trim()}
                            className="border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                          >
                            <X className="w-4 h-4 mr-1.5" /> Clear All
                          </Button>

                          {/* Submit */}
                          <Button
                            onClick={handleSubmitDraft}
                            disabled={isSubmitting || draftContent.length < 100}
                            size="lg"
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6"
                            data-testid="submit-draft-btn"
                          >
                            {isSubmitting
                              ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Evaluating…</>
                              : <><Send className="w-4 h-4 mr-2" />Submit for AI Evaluation</>}
                          </Button>
                        </div>
                      </div>

                      {/* AI Chat */}
                      <div>
                        <p className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-3">
                          <Sparkles className="w-4 h-4 text-indigo-500" />
                          Ask AI for Drafting Help
                        </p>
                        {chatMessages.length > 0 && (
                          <ScrollArea className="h-[200px] mb-4 pr-4">
                            <div className="space-y-4">
                              {chatMessages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                  <div className={`max-w-[85%] p-3 rounded-2xl ${
                                    msg.role === "user" ? "bg-indigo-600 text-white rounded-br-md" : "bg-slate-100 text-slate-700 rounded-bl-md"
                                  }`}>
                                    {msg.role === "assistant" && (
                                      <div className="flex items-center gap-2 mb-1">
                                        <Sparkles className="w-4 h-4 text-indigo-600" />
                                        <span className="text-xs font-medium text-indigo-600">AI Mentor</span>
                                      </div>
                                    )}
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                  </div>
                                </div>
                              ))}
                              {isChatting && (
                                <div className="flex justify-start">
                                  <div className="bg-slate-100 p-3 rounded-2xl rounded-bl-md">
                                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                                  </div>
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        )}
                        <div className="flex gap-2 sm:gap-3">
                          <Input
                            placeholder="Ask about clauses, format, legal requirements..."
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            onKeyPress={e => e.key === "Enter" && !isChatting && handleChatSubmit()}
                            className="flex-1"
                            data-testid="drafting-chat-input"
                          />
                          <Button
                            onClick={handleChatSubmit}
                            disabled={isChatting || !chatInput.trim()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4"
                            data-testid="drafting-chat-send"
                          >
                            {isChatting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          </Button>
                        </div>
                        {chatMessages.length === 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-slate-500 mb-2">Suggested questions:</p>
                            <div className="flex flex-wrap gap-2">
                              {["What clauses should I include?", "Show me the proper format", "What are common mistakes to avoid?"].map((q, i) => (
                                <button key={i} onClick={() => setChatInput(q)} className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors">{q}</button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ══ HISTORY TAB ══ */}
          <TabsContent value="history">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ fontFamily: "Outfit" }}>
                  <History className="w-5 h-5 text-indigo-600" />
                  Your Draft Submissions
                </CardTitle>
                <CardDescription>Track your progress and review past evaluations</CardDescription>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <div className="text-center py-16">
                    <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No Drafts Yet</h3>
                    <p className="text-slate-500 mb-4">Submit your first draft to start tracking your progress</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((draft, index) => (
                      <div key={index} className="p-5 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-200 transition-all">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-900 mb-1 truncate">{draft.title}</h4>
                            <p className="text-sm text-slate-500 mb-3">
                              {draft.draft_type?.replace(/_/g, " ")} • Submitted {new Date(draft.submitted_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                            </p>
                            {/* Action buttons */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenHistoryItem(draft)}
                                style={{
                                  display: "flex", alignItems: "center", gap: 5,
                                  padding: "6px 12px", borderRadius: 8,
                                  border: "1.5px solid rgba(99,102,241,0.4)",
                                  background: "rgba(99,102,241,0.07)", color: "#4f46e5",
                                  fontSize: 12, fontWeight: 700, cursor: "pointer",
                                }}
                              >
                                <FolderOpen size={13} /> Open in Editor
                              </button>
                              <button
                                onClick={() => setConfirmDeleteDraft(draft.draft_id)}
                                style={{
                                  display: "flex", alignItems: "center", gap: 5,
                                  padding: "6px 12px", borderRadius: 8,
                                  border: "1.5px solid rgba(239,68,68,0.3)",
                                  background: "rgba(239,68,68,0.06)", color: "#ef4444",
                                  fontSize: 12, fontWeight: 700, cursor: "pointer",
                                }}
                              >
                                <Trash2 size={13} /> Delete
                              </button>
                            </div>
                          </div>
                          {draft.score !== undefined && (
                            <div className={`text-center px-4 py-2 rounded-xl flex-shrink-0 ${getScoreBg(draft.score)}`}>
                              <div className={`text-2xl font-bold ${getScoreColor(draft.score)}`}>{draft.score}</div>
                              <p className="text-xs text-slate-600">Score</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <UpgradePopup
        open={showUpgradePopup}
        onClose={() => setShowUpgradePopup(false)}
        planName={user?.plan}
      />
    </DashboardLayout>
  );
};

export default DraftingLab;
