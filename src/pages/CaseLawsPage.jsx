import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useAuth } from "../App";
import { API } from "../App";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
import { 
  Scale, Search, BookOpen, Loader2, 
  MessageSquare, Send, Sparkles, Bookmark, BookmarkCheck
} from "lucide-react";
import UpgradePopup from "../components/UpgradePopup";

// ── Study Time Tracker ─────────────────────────────────────────────────────
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
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon(`${API_BASE}/analytics/study-time`, blob);
      } else {
        fetch(`${API_BASE}/analytics/study-time`, {
          method: "POST", headers, body, keepalive: true
        }).catch(() => {});
      }
    };
  }, []);

  return null;
};
// ───────────────────────────────────────────────────────────────────────────


// ── Activity Logger ──────────────────────────────────────────────────────────
const _logActivity = (activityType, description) => {
  // fire-and-forget — does not block UI
  try {
    const token = localStorage.getItem("token");
    axios.post(
      `${API}/activity/log`,
      { activity_type: activityType, description },
      {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        withCredentials: true,
      }
    ).catch(() => {}); // swallow network errors only
  } catch {}
};
// ─────────────────────────────────────────────────────────────────────────────

const CaseLawsPage = () => {
  const { user } = useAuth();
  const [caseLaws, setCaseLaws] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCase, setSelectedCase] = useState(null);
  
  // Unified AI state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [customCaseText, setCustomCaseText] = useState("");
  const [inputMode, setInputMode] = useState("ask"); // "ask" | "write"
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);

  const [savedCaseIds, setSavedCaseIds] = useState(new Set());
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    fetchCaseLaws();
    fetchSavedIds();
  }, []);

  // Load which cases this user has already saved (from DB + local cache)
  const fetchSavedIds = async () => {
    const token = localStorage.getItem("token") || localStorage.getItem("access_token") || sessionStorage.getItem("token");
    try {
      const res = await axios.get(`${API}/saved-cases/list`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      });
      const ids = new Set((res.data.saved_cases || []).map(c => c.case_id));
      setSavedCaseIds(ids);
      // Persist locally so UI stays correct across refreshes
      localStorage.setItem("stems_saved_case_ids", JSON.stringify([...ids]));
    } catch {
      // Fallback: use local cache if server not reachable
      try {
        const local = JSON.parse(localStorage.getItem("stems_saved_case_ids") || "[]");
        setSavedCaseIds(new Set(local));
      } catch {}
    }
  };

  // Save a case law card to the Saved Case Laws collection
  const handleSaveCase = async (caseLaw, e) => {
    e?.stopPropagation();
    const token = localStorage.getItem("token") || localStorage.getItem("access_token") || sessionStorage.getItem("token");
    const caseId = caseLaw.case_id || caseLaw._id || caseLaw.case_name?.replace(/\s+/g, "_");
    if (!caseId) { toast.error("Cannot identify this case"); return; }

    // Already saved — just confirm
    if (savedCaseIds.has(caseId)) {
      toast("Already saved to Case Laws ✓");
      return;
    }

    setSavingId(caseId);
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    // Build full AI content from all chat messages
    const aiReplies = chatMessages
      .filter(m => m.role === "assistant" && m.content?.trim())
      .map(m => m.content.trim())
      .join("\n\n---\n\n");

    const aiContent = aiReplies
      ? `# ${caseLaw.case_name}\n\n**Citation:** ${caseLaw.citation || ""}\n**Court:** ${caseLaw.court || ""}\n**Year:** ${caseLaw.year || ""}\n\n## Key Legal Principle\n${caseLaw.key_principle || ""}\n\n## AI Legal Analysis\n${aiReplies}`
      : `# ${caseLaw.case_name}\n\n**Citation:** ${caseLaw.citation || ""}\n**Court:** ${caseLaw.court || ""}\n**Year:** ${caseLaw.year || ""}\n\n## Key Legal Principle\n${caseLaw.key_principle || ""}`;

    // First assistant reply used as revision summary
    const firstAiReply = chatMessages.find(m => m.role === "assistant")?.content || "";
    const aiSummary = firstAiReply
      ? firstAiReply.slice(0, 800).replace(/#{1,6}\s*/g, "").replace(/\*\*/g, "").trim()
      : caseLaw.key_principle || "";

    try {
      const res = await axios.post(
        `${API}/saved-cases/save`,
        {
          case_id:       caseId,
          case_name:     caseLaw.case_name,
          citation:      caseLaw.citation      || "",
          key_principle: caseLaw.key_principle || "",
          court:         caseLaw.court         || "",
          year:          caseLaw.year          || "",
          level:         caseLaw.level         || "",
          tags:          caseLaw.tags          || [],
          ai_content:    aiContent,
          ai_summary:    aiSummary,
        },
        { headers, withCredentials: true }
      );

      const alreadySaved = res.data?.already_saved;
      // Update local state + cache
      const updated = new Set([...savedCaseIds, caseId]);
      setSavedCaseIds(updated);
      localStorage.setItem("stems_saved_case_ids", JSON.stringify([...updated]));

      if (alreadySaved) toast("Already in your Saved Case Laws ✓");
      else toast.success("Saved to Case Laws! View in Knowledge Library → Saved Case Laws tab 📚");

    } catch (err) {
      const status  = err?.response?.status;
      const detail  = err?.response?.data?.detail || "";
      console.error("Save case error:", status, detail);

      if (status === 409 || (typeof detail === "string" && detail.toLowerCase().includes("already"))) {
        const updated = new Set([...savedCaseIds, caseId]);
        setSavedCaseIds(updated);
        localStorage.setItem("stems_saved_case_ids", JSON.stringify([...updated]));
        toast("Already in your Saved Case Laws ✓");
      } else if (status === 429) {
        setShowUpgradePopup(true);
      } else if (status === 401) {
        toast.error("Session expired — please refresh and try again");
      } else if (status === 404) {
        toast.error("Save endpoint not found — please restart your server with the latest server.py");
      } else {
        toast.error("Unable to save. Please try again.");
      }
    } finally {
      setSavingId(null);
    }
  };

  // Auto-fill chatInput with formatted case details when a case is selected
  useEffect(() => {
    if (selectedCase) {
      const formatted = `Case: ${selectedCase.case_name}
Citation: ${selectedCase.citation}
Court: ${selectedCase.court || "N/A"}
Year: ${selectedCase.year || "N/A"}
Key Principle:
${selectedCase.key_principle}`;
      setChatInput(formatted);
    } else {
      setChatInput("");
    }
  }, [selectedCase]);

  const fetchCaseLaws = async () => {
    const token = localStorage.getItem("token");
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("query", searchQuery);
      const response = await axios.get(`${API}/caselaws?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true
      });
      setCaseLaws(response.data.case_laws || []);
    } catch (error) {
      console.error("Failed to fetch case laws:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    fetchCaseLaws();
  };

  const explainCase = (caseLaw) => {
    setSelectedCase(caseLaw);
    setCustomCaseText("");
    setChatMessages([]);
    _logActivity("case", `Viewed case law: ${caseLaw.case_name || "Case Law"}`);
  };

  const handleChatSubmit = async () => {
    const messageText = chatInput.trim();
    if (!messageText) return;
    
    const hasContext = selectedCase || customCaseText;
    
    if (!hasContext && chatMessages.length === 0) {
      setCustomCaseText(messageText);
    }

    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: messageText }]);
    setIsChatting(true);
    
    const token = localStorage.getItem("token");
    
    try {
      let context = "";
      if (selectedCase) {
        context = `Context: Discussing the case "${selectedCase.case_name}" (${selectedCase.citation}). Key principle: ${selectedCase.key_principle}. Exam relevance: ${selectedCase.exam_relevance || ""}. `;
      } else if (customCaseText || chatMessages.length === 0) {
        const caseContext = customCaseText || messageText;
        context = `Context: User has provided this custom case/legal scenario: "${caseContext}". `;
      } else {
        context = "Context: General case law discussion. ";
      }

      const systemInstruction = inputMode === "write"
        ? `You are a legal writing assistant for CS (Company Secretary) students. Help write legal content, arguments, answers and analysis. Be structured, use proper legal terminology. ${context}`
        : `You are an AI legal mentor for CS students. Answer questions clearly, reference relevant sections of Companies Act 2013 where applicable. ${context}`;

      const response = await axios.post(
        `${API}/ai/case-law-chat`,
        { 
          question: messageText,
          case_name: selectedCase?.case_name || null,
          context: systemInstruction
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true
        }
      );
      
      setChatMessages(prev => [...prev, { role: "assistant", content: response.data.response }]);
    } catch (error) {
      if (error?.response?.status === 429) {
        setShowUpgradePopup(true);
      } else {
        const detail = error?.response?.data?.detail;
        toast.error(detail || "Failed to get response");
      }
      const detail = error?.response?.data?.detail;
      setChatMessages(prev => [...prev, { role: "assistant", content: detail || "Sorry, I couldn't process your question. Please try again." }]);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6 overflow-x-hidden" data-testid="caselaws-page">
        <StudyTimeTracker />
        {/* Search and Filters */}
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6 pb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search case laws by name, principle, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
                data-testid="case-search-input"
              />
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Case Laws List */}
          <div className="lg:col-span-4">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Outfit' }}>
                  <Scale className="w-5 h-5 text-indigo-600" />Case Law Database
                </CardTitle>
                <CardDescription>{caseLaws.length} cases found</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  </div>
                ) : (
                  <ScrollArea className="h-64 sm:h-96 lg:h-[550px] pr-4">
                    <div className="space-y-3">
                      {caseLaws.map((caseLaw, index) => (
                        <button
                          key={index}
                          onClick={() => explainCase(caseLaw)}
                          className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                            selectedCase?.case_id === caseLaw.case_id
                              ? 'bg-indigo-50 border-indigo-300 shadow-md'
                              : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                          }`}
                          data-testid={`case-${caseLaw.case_id}`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-slate-900 text-sm leading-snug flex-1">{caseLaw.case_name}</h4>
                            <button
                              onClick={(e) => handleSaveCase(caseLaw, e)}
                              title={savedCaseIds.has(caseLaw.case_id) ? "Already in Saved Case Laws" : "Save to Case Laws"}
                              className="flex-shrink-0 p-1 rounded-lg transition-all"
                              style={{
                                background: savedCaseIds.has(caseLaw.case_id) ? "rgba(99,102,241,0.1)" : "transparent",
                                border: "none", cursor: "pointer",
                              }}
                            >
                              {savingId === caseLaw.case_id
                                ? <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                                : savedCaseIds.has(caseLaw.case_id)
                                  ? <BookmarkCheck className="w-4 h-4 text-indigo-600" />
                                  : <Bookmark className="w-4 h-4 text-slate-400 hover:text-indigo-500" />
                              }
                            </button>
                          </div>
                          <p className="text-sm text-slate-500 mb-2">{caseLaw.citation}</p>
                          <p className="text-sm text-slate-600 line-clamp-2 mb-3">{caseLaw.key_principle}</p>
                          <div className="flex flex-wrap gap-2">
                            <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium">{caseLaw.level}</span>
                            {caseLaw.tags?.slice(0, 2).map((tag, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{tag}</span>
                            ))}
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Case Detail + AI Chat */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2" style={{ fontFamily: 'Outfit' }}>
                      <BookOpen className="w-5 h-5 text-indigo-600" />AI Legal Assistant
                    </CardTitle>
                    <CardDescription>
                      {selectedCase 
                        ? `Ask anything about ${selectedCase.case_name} or get writing help`
                        : customCaseText
                          ? "Discussing your custom case"
                          : "Select a case or type your own case below to get started"
                      }
                    </CardDescription>
                  </div>
                  <MessageSquare className="w-5 h-5 text-slate-400" />
                </div>

                {/* Mode Toggle */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    onClick={() => setInputMode("ask")}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                      inputMode === "ask" ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <MessageSquare className="w-3 h-3" />Ask / Analyze
                  </button>
                  <button
                    onClick={() => setInputMode("write")}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                      inputMode === "write" ? "bg-purple-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />Writing Help
                  </button>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                {customCaseText && !selectedCase && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <span className="text-amber-600 text-xs mt-0.5">📄</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-amber-800 mb-0.5">Custom Case Context</p>
                      <p className="text-xs text-amber-700 line-clamp-2">{customCaseText}</p>
                    </div>
                    <button
                      onClick={() => { setCustomCaseText(""); setChatMessages([]); }}
                      className="text-amber-400 hover:text-amber-600 text-xs shrink-0"
                    >✕</button>
                  </div>
                )}

                {chatMessages.length > 0 && (
                  <ScrollArea className="h-40 sm:h-[250px] pr-4">
                    <div className="space-y-4">
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                            msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-md' : 'bg-slate-100 text-slate-700 rounded-bl-md'
                          }`}>
                            {msg.role === 'assistant' && (
                              <div className="flex items-center gap-2 mb-1">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                <span className="text-xs font-medium text-indigo-600">AI Mentor</span>
                              </div>
                            )}
                            <p className="whitespace-pre-wrap">{msg.content}</p>
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
                      {/* Save to Revision button — appears below last AI reply */}
                      {selectedCase && chatMessages.length > 0 && chatMessages[chatMessages.length - 1]?.role === 'assistant' && !isChatting && (
                        <div className="flex justify-start pl-1 pt-1">
                          <button
                            onClick={(e) => handleSaveCase(selectedCase, e)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            style={{
                              background: savedCaseIds.has(selectedCase.case_id) ? "rgba(99,102,241,0.1)" : "white",
                              border: `1.5px solid ${savedCaseIds.has(selectedCase.case_id) ? "#6366f1" : "rgba(99,102,241,0.35)"}`,
                              color: savedCaseIds.has(selectedCase.case_id) ? "#4f46e5" : "#6366f1",
                              cursor: "pointer",
                              boxShadow: "0 1px 4px rgba(99,102,241,0.08)",
                            }}
                          >
                            {savingId === selectedCase.case_id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : savedCaseIds.has(selectedCase.case_id)
                                ? <><BookmarkCheck className="w-3.5 h-3.5" /> Saved ✓</>
                                : <><Bookmark className="w-3.5 h-3.5" /> Save to Case Laws</>
                            }
                          </button>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                )}

                {chatMessages.length === 0 && (
                  <div className="text-center py-6 text-slate-400">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">
                      {selectedCase
                        ? `Ask anything about "${selectedCase.case_name}" or request writing help`
                        : "Type your question, or paste a case fact scenario below to analyze it"
                      }
                    </p>
                  </div>
                )}

                {/* Unified Input Box */}
                <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                  <textarea
                    placeholder={
                      inputMode === "write"
                        ? selectedCase
                          ? `Ask for writing help on ${selectedCase.case_name}...`
                          : "Describe your case or legal scenario and ask for writing help..."
                        : selectedCase
                          ? `Ask anything about ${selectedCase.case_name}...`
                          : "Type your question, paste a case scenario, or describe a legal situation to analyze..."
                    }
                    value={chatInput}
                    onChange={(e) => {
                      setChatInput(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (!isChatting && chatInput.trim()) handleChatSubmit();
                      }
                    }}
                    rows={2}
                    className="w-full px-4 pt-3 pb-2 text-sm text-slate-700 placeholder:text-slate-400 resize-none outline-none border-0 bg-white"
                    data-testid="case-chat-input"
                    style={{ minHeight: 60, maxHeight: 150 }}
                  />
                  <div className="flex items-center justify-between px-3 pb-2 bg-white">
                    <p className="text-xs text-slate-400">
                      {!selectedCase && !customCaseText 
                        ? "💡 No case selected — you can type your own case directly" 
                        : selectedCase 
                          ? `📌 Context: ${selectedCase.case_name}`
                          : "📄 Using your custom case context"
                      }
                    </p>
                    <Button
                      onClick={handleChatSubmit}
                      disabled={isChatting || !chatInput.trim()}
                      size="sm"
                      className={`px-4 ${inputMode === "write" ? "bg-purple-600 hover:bg-purple-700" : "bg-indigo-600 hover:bg-indigo-700"} text-white`}
                      data-testid="case-chat-send"
                    >
                      {isChatting 
                        ? <Loader2 className="w-4 h-4 animate-spin" /> 
                        : <><Send className="w-3.5 h-3.5 mr-1.5" />Send</>
                      }
                    </Button>
                  </div>
                </div>

                {chatMessages.length === 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-2">Suggested:</p>
                    <div className="flex flex-wrap gap-2">
                      {(inputMode === "write" ? [
                        "Write a case note for exam",
                        "Draft a short answer on this principle",
                        "Write key arguments for both sides",
                      ] : [
                        "How is this case applied in practice?",
                        "What are similar cases?",
                        "Important exam questions from this case?",
                      ]).map((q, i) => (
                        <button
                          key={i}
                          onClick={() => setChatInput(q)}
                          className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-full transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <UpgradePopup
        open={showUpgradePopup}
        onClose={() => setShowUpgradePopup(false)}
        planName={user?.plan}
      />
    </DashboardLayout>
  );
};

export default CaseLawsPage;
