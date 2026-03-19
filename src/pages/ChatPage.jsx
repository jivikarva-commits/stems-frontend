import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useAuth, API } from "../App";
import ChatLayout from "../components/layout/ChatLayout";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { ScrollArea } from "../components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { 
  Send, Image, Download, Loader2, Sparkles, 
  User, Bot, X, Copy, Check, GraduationCap, BookOpen, Trash2, AlertTriangle, BookMarked
} from "lucide-react";
import { jsPDF } from "jspdf";
import AIMentor, { MentorTriggerIcon } from "../components/AIMentor";
import UpgradePopup from "../components/UpgradePopup";

// ── Study Time Tracker ─────────────────────────────────────────────────────
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

const ChatPage = () => {
  const { user } = useAuth();
  const [chatSessions, setChatSessions] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null, chatId: null });
  const [mentorText, setMentorText] = useState("");
  const [activeSpeechText, setActiveSpeechText] = useState("");
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  
  // Academic context
  const [levels, setLevels] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  // ── Usage tracking ─────────────────────────────────────────────────────────
  const [usageData, setUsageData] = useState(null); // { ai_queries_used, ai_queries_limit, plan }

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch levels, chat sessions and usage on mount
  useEffect(() => {
    fetchLevels();
    fetchChatSessions();
    fetchUsage();
  }, []);

  // Refresh usage whenever messages update (after each AI response)
  useEffect(() => {
    if (messages.length > 0) fetchUsage();
  }, [messages.length]);

  const fetchUsage = async () => {
    try {
      const res = await axios.get(`${API}/subscription/usage`, {
        headers: getAuthHeaders(), withCredentials: true,
      });
      setUsageData(res.data);
    } catch {}
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [inputValue]);

  // Fetch subjects when level changes
  useEffect(() => {
    if (selectedLevel) {
      fetchSubjects(selectedLevel);
      setSelectedSubject(""); // Reset subject when level changes
    } else {
      setSubjects([]);
    }
  }, [selectedLevel]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchLevels = async () => {
    try {
      const response = await axios.get(`${API}/syllabus/levels`);
      setLevels(response.data.levels || []);
    } catch (error) {
      console.error("Failed to fetch levels:", error);
    }
  };

  const fetchSubjects = async (level) => {
    try {
      const response = await axios.get(`${API}/syllabus/subjects/${encodeURIComponent(level)}`);
      setSubjects(response.data.subjects || []);
    } catch (error) {
      console.error("Failed to fetch subjects:", error);
    }
  };

  const fetchChatSessions = async () => {
    try {
      const response = await axios.get(`${API}/chats`, {
        headers: getAuthHeaders(),
        withCredentials: true
      });
      setChatSessions(response.data.sessions || []);
    } catch (error) {
      console.error("Failed to fetch chat sessions:", error);
    }
  };

  const createNewChat = async () => {
    try {
      const response = await axios.post(
        `${API}/chats`,
        { title: "New Chat" },
        { headers: getAuthHeaders(), withCredentials: true }
      );
      setChatSessions(prev => [response.data.session, ...prev]);
      setCurrentChatId(response.data.chat_id);
      setMessages([]);
      setInputValue("");
      setUploadedImage(null);
      setImagePreview(null);
    } catch (error) {
      toast.error("Failed to create new chat");
    }
  };

  const selectChat = async (chatId) => {
    setCurrentChatId(chatId);
    try {
      const response = await axios.get(`${API}/chats/${chatId}`, {
        headers: getAuthHeaders(),
        withCredentials: true
      });
      setMessages(response.data.messages || []);
      if (response.data.level) setSelectedLevel(response.data.level);
      if (response.data.subject) setSelectedSubject(response.data.subject);
    } catch (error) {
      toast.error("Failed to load chat");
    }
  };

  const deleteChat = async (chatId) => {
    try {
      await axios.delete(`${API}/chats/${chatId}`, {
        headers: getAuthHeaders(),
        withCredentials: true
      });
      setChatSessions(prev => prev.filter(s => s.chat_id !== chatId));
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([]);
      }
      toast.success("Chat deleted");
    } catch (error) {
      toast.error("Failed to delete chat");
    }
  };

  const clearAllChats = async () => {
    try {
      await Promise.all(
        chatSessions.map(s =>
          axios.delete(`${API}/chats/${s.chat_id}`, {
            headers: getAuthHeaders(),
            withCredentials: true
          })
        )
      );
      setChatSessions([]);
      setCurrentChatId(null);
      setMessages([]);
      toast.success("All chats cleared");
    } catch (error) {
      toast.error("Failed to clear chats");
    }
  };

  const handleConfirmDelete = () => {
    if (confirmDialog.type === "single") {
      deleteChat(confirmDialog.chatId);
    } else if (confirmDialog.type === "all") {
      clearAllChats();
    }
    setConfirmDialog({ open: false, type: null, chatId: null });
  };

  const sendMessage = async () => {
    if (!inputValue.trim() && !uploadedImage) return;

    // ── Frontend pre-check (UX only — backend enforces authoritatively) ──────
    if (usageData && usageData.ai_queries_limit !== -1) {
      if (usageData.ai_queries_used >= usageData.ai_queries_limit) {
        setShowUpgradePopup(true);
        return; // Block before any API call
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    setMentorText("");
    setActiveSpeechText("");
    
    let chatId = currentChatId;
    if (!chatId) {
      try {
        const response = await axios.post(
          `${API}/chats`,
          { title: inputValue.slice(0, 30) || "New Chat" },
          { headers: getAuthHeaders(), withCredentials: true }
        );
        chatId = response.data.chat_id;
        setCurrentChatId(chatId);
        setChatSessions(prev => [response.data.session, ...prev]);
      } catch (error) {
        toast.error("Failed to create chat");
        return;
      }
    }

    const messageContent = inputValue;
    const imageData = uploadedImage;
    
    const tempUserMessage = {
      message_id: `temp_${Date.now()}`,
      role: "user",
      content: messageContent,
      image: imagePreview,
      level: selectedLevel,
      subject: selectedSubject,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempUserMessage]);
    setInputValue("");
    setUploadedImage(null);
    setImagePreview(null);
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API}/chats/${chatId}/messages`,
        { 
          message: messageContent,
          image: imageData,
          level: selectedLevel,
          subject: selectedSubject
        },
        { headers: getAuthHeaders(), withCredentials: true }
      );

      setMessages(prev => {
        const filtered = prev.filter(m => m.message_id !== tempUserMessage.message_id);
        return [...filtered, response.data.user_message, response.data.ai_message];
      });

      if (response.data.ai_message?.content) {
        setMentorText(response.data.ai_message.content);
      }

      fetchChatSessions();
      _logActivity("study", `Studied topic: ${selectedSubject || "General"}${messageContent ? " – " + messageContent.slice(0, 40) : ""}`);
    } catch (error) {
      setMessages(prev => prev.filter(m => m.message_id !== tempUserMessage.message_id));
      if (error?.response?.status === 429) {
        setShowUpgradePopup(true);
      } else {
        const detail = error?.response?.data?.detail;
        toast.error(detail || "Failed to send message. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image size must be less than 5MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      setUploadedImage(base64);
      setImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const copyMessage = async (content, messageId) => {
    await navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const exportToPDF = () => {
    if (messages.length === 0) { toast.error("No messages to export"); return; }
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let yPosition = 20;
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("STEMS AI CS Mentor - Chat Export", margin, yPosition);
    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    if (selectedLevel && selectedSubject) {
      doc.text(`Level: ${selectedLevel} | Subject: ${selectedSubject}`, margin, yPosition);
      yPosition += 7;
    }
    doc.text(`Exported on: ${new Date().toLocaleString()}`, margin, yPosition);
    yPosition += 15;
    doc.setFontSize(11);
    messages.forEach((msg) => {
      if (yPosition > 270) { doc.addPage(); yPosition = 20; }
      doc.setFont("helvetica", "bold");
      doc.text(msg.role === "user" ? "You:" : "AI Mentor:", margin, yPosition);
      yPosition += 7;
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(msg.content, maxWidth);
      lines.forEach((line) => {
        if (yPosition > 270) { doc.addPage(); yPosition = 20; }
        doc.text(line, margin, yPosition);
        yPosition += 6;
      });
      yPosition += 8;
    });
    doc.save(`stems-ai-chat-${Date.now()}.pdf`);
    toast.success("Chat exported to PDF");
  };

  return (
    <ChatLayout
      user={user}
      chatSessions={chatSessions}
      onNewChat={createNewChat}
      onSelectChat={selectChat}
      onDeleteChat={(chatId) => setConfirmDialog({ open: true, type: "single", chatId })}
      onClearAllChats={() => setConfirmDialog({ open: true, type: "all", chatId: null })}
      currentChatId={currentChatId}
      refreshChats={fetchChatSessions}
    >
      <div className="flex-1 flex flex-col bg-slate-800 overflow-hidden" data-testid="chat-page">
        <StudyTimeTracker />
        {/* Academic Context Bar */}
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-900/50 border-b border-slate-700">
          <div className="flex items-center gap-2 text-slate-400">
            <GraduationCap className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">Academic Context:</span>
          </div>
          
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="w-[160px] bg-slate-800 border-slate-600 text-white" data-testid="level-select">
              <SelectValue placeholder="Select Level" />
            </SelectTrigger>
            <SelectContent>
              {levels.map((level) => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedLevel}>
            <SelectTrigger className="w-[220px] bg-slate-800 border-slate-600 text-white" data-testid="subject-select">
              <SelectValue placeholder={selectedLevel ? "Select Subject" : "Select Level first"} />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.name} value={subject.name}>
                  <div className="flex flex-col">
                    <span>{subject.name}</span>
                    <span className="text-xs text-slate-500">{subject.chapter_count} chapters</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {currentChatId && messages.length > 0 && (
            <Button
              onClick={exportToPDF}
              variant="ghost"
              size="sm"
              className="ml-auto text-slate-400 hover:text-white"
              data-testid="export-pdf-btn"
            >
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Export PDF</span>
            </Button>
          )}
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1">
          <div className="max-w-3xl mx-auto px-4 py-6">
            {messages.length === 0 ? (
              <WelcomeScreen 
                selectedLevel={selectedLevel}
                selectedSubject={selectedSubject}
                onSuggestionClick={(suggestion) => {
                  setInputValue(suggestion);
                  textareaRef.current?.focus();
                }} 
              />
            ) : (
              <div className="space-y-6 overflow-x-hidden">
                {messages.map((message, index) => (
                  <MessageBubble
                    key={message.message_id || index}
                    message={message}
                    user={user}
                    onCopy={() => copyMessage(message.content, message.message_id)}
                    isCopied={copiedMessageId === message.message_id}
                    onMentorSpeak={(txt) => {
                      setMentorText(message.content);
                      setActiveSpeechText("");
                      setTimeout(() => setActiveSpeechText(txt || message.content), 30);
                    }}
                    isMentorSpeaking={mentorText === message.content}
                    subject={selectedSubject}
                    level={selectedLevel}
                    chatId={currentChatId}
                    onLimitReached={() => setShowUpgradePopup(true)}
                  />
                ))}
                {isLoading && (
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 bg-slate-700 rounded-2xl rounded-tl-sm p-4">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">STEMS AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-slate-700 p-4">
          <div className="max-w-3xl mx-auto">
            {selectedLevel && selectedSubject && (
              <div className="flex items-center gap-2 mb-2 text-xs text-slate-500">
                <BookOpen className="w-3 h-3" />
                <span>Studying: {selectedLevel} → {selectedSubject}</span>
              </div>
            )}

            {imagePreview && (
              <div className="mb-3 relative inline-block">
                <img src={imagePreview} alt="Upload preview" className="h-20 rounded-lg border border-slate-600" />
                <button onClick={removeImage} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-end gap-2 bg-slate-700 rounded-2xl p-2 border border-slate-600 focus-within:border-indigo-500 transition-colors">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" data-testid="image-upload-input" />
              <Button type="button" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} className="text-slate-400 hover:text-white hover:bg-slate-600 rounded-full p-2" data-testid="upload-image-btn">
                <Image className="w-5 h-5" />
              </Button>

              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  usageData && usageData.ai_queries_limit !== -1 && usageData.ai_queries_used >= usageData.ai_queries_limit
                    ? `Limit of ${usageData.ai_queries_limit} queries reached. Upgrade to continue...`
                    : selectedLevel && selectedSubject ? `Ask about ${selectedSubject}...` : "Select Level & Subject above, then ask your question..."
                }
                className="flex-1 bg-transparent border-0 resize-none text-white placeholder:text-slate-500 focus-visible:ring-0 min-h-[24px] max-h-[200px] py-2"
                rows={1}
                disabled={isLoading || (usageData && usageData.ai_queries_limit !== -1 && usageData.ai_queries_used >= usageData.ai_queries_limit)}
                data-testid="chat-input"
              />

              <Button
                onClick={sendMessage}
                disabled={isLoading || (!inputValue.trim() && !uploadedImage) || (usageData && usageData.ai_queries_limit !== -1 && usageData.ai_queries_used >= usageData.ai_queries_limit)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-2 h-10 w-10"
                data-testid="send-message-btn"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </Button>
            </div>

            {/* ── Usage counter bar ────────────────────────────────────────── */}
            {usageData && usageData.ai_queries_limit !== -1 && (
              <div className="mt-2 px-1">
                {usageData.ai_queries_used >= usageData.ai_queries_limit ? (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-red-400 font-semibold">
                      ⚠️ {usageData.plan === "free" ? "Daily" : "Monthly"} AI limit reached ({usageData.ai_queries_used}/{usageData.ai_queries_limit}) — resets {usageData.plan === "free" ? "midnight UTC" : "on billing cycle"}
                    </p>
                    <a href="/subscription" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline ml-2">
                      Upgrade Plan →
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-slate-600 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min((usageData.ai_queries_used / usageData.ai_queries_limit) * 100, 100)}%`,
                          background: usageData.ai_queries_used / usageData.ai_queries_limit >= 0.8 ? "#ef4444" : "#6366f1"
                        }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 whitespace-nowrap">
                      {usageData.ai_queries_used}/{usageData.ai_queries_limit} queries {usageData.plan === "free" ? "today" : "this month"}
                    </p>
                  </div>
                )}
              </div>
            )}
            {/* ─────────────────────────────────────────────────────────────── */}

            <p className="text-xs text-slate-500 text-center mt-2">
              {selectedLevel && selectedSubject ? "Teaching strictly aligned with official ICSI syllabus" : "Select Level & Subject for syllabus-aligned teaching"}
            </p>
          </div>
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      {confirmDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">
                  {confirmDialog.type === "all" ? "Clear All Chats?" : "Delete this chat?"}
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  {confirmDialog.type === "all" ? "This will permanently delete all your chat history." : "Are you sure you want to delete this chat?"}
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setConfirmDialog({ open: false, type: null, chatId: null })} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleConfirmDelete} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors">
                {confirmDialog.type === "all" ? "Clear All" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AIMentor
        text={mentorText}
        activeSpeechText={activeSpeechText}
        onClose={() => { setMentorText(""); setActiveSpeechText(""); }}
      />
      <UpgradePopup
        open={showUpgradePopup}
        onClose={() => setShowUpgradePopup(false)}
        planName={usageData?.plan || user?.plan}
      />
    </ChatLayout>
  );
};

// Welcome Screen Component
const WelcomeScreen = ({ selectedLevel, selectedSubject, onSuggestionClick }) => {
  const getSuggestions = () => {
    if (!selectedLevel || !selectedSubject) {
      return ["What topics are covered in Business Law?", "Explain the structure of CS Executive course", "What are the elective options in CS Professional?", "How should I prepare for Company Law?"];
    }
    const subjectSuggestions = {
      "Business Law": ["Explain the Indian Contract Act, 1872", "What are the essentials of a valid contract?", "Teach me about Sale of Goods Act", "What is the difference between Partnership and LLP?"],
      "Company Law": ["Explain the types of companies under Companies Act", "What are the duties of directors?", "Teach me about Board Meetings and Resolutions", "What is the process of winding up?"],
      "Tax Laws & Practice": ["Explain the heads of income under Income Tax", "What are Chapter VI-A deductions?", "Teach me about GST Registration", "How does Input Tax Credit work?"],
      "Governance, Risk Management, Compliance & Ethics": ["Explain the Corporate Governance framework", "What are the SEBI LODR requirements?", "Teach me about Board Committees", "What is ESG and BRSR reporting?"]
    };
    return subjectSuggestions[selectedSubject] || [`Teach me ${selectedSubject}`, `What chapters are covered in ${selectedSubject}?`, `Key concepts in ${selectedSubject}`, `Important exam topics for ${selectedSubject}`];
  };

  const suggestions = getSuggestions();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6">
        <Sparkles className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>STEMS AI CS Mentor</h1>
      {selectedLevel && selectedSubject ? (
        <>
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-indigo-600/30 text-indigo-300 rounded-full text-sm">{selectedLevel}</span>
            <span className="text-slate-500">→</span>
            <span className="px-3 py-1 bg-emerald-600/30 text-emerald-300 rounded-full text-sm">{selectedSubject}</span>
          </div>
          <p className="text-slate-400 mb-8 max-w-md">Ask any question about <strong className="text-white">{selectedSubject}</strong>. I'll teach you strictly from the official ICSI syllabus with exam-oriented explanations.</p>
        </>
      ) : (
        <p className="text-slate-400 mb-8 max-w-md">Select your <strong className="text-indigo-400">Level</strong> and <strong className="text-emerald-400">Subject</strong> above to start learning with syllabus-aligned teaching.</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        {suggestions.map((suggestion, index) => (
          <button key={index} onClick={() => onSuggestionClick(suggestion)} className="p-4 text-left text-sm text-slate-300 bg-slate-700/50 hover:bg-slate-700 rounded-xl border border-slate-600 hover:border-indigo-500 transition-all" data-testid={`suggestion-${index}`}>
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

// Message Bubble Component
const MessageBubble = ({ message, user, onCopy, isCopied, onMentorSpeak, isMentorSpeaking, subject, level, chatId, onLimitReached }) => {
  const isUser = message.role === "user";
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSaveNote = async () => {
    if (saving || saved) return;
    if (!subject || !level) {
      toast.error("Select a subject first to save notes");
      return;
    }
    setSaving(true);
    try {
      await axios.post(
        `${API}/revision-notes`,
        {
          content: message.content,
          subject,
          level,
          chat_id: chatId,
          message_id: message.message_id,
        },
        { headers: (() => { const t = localStorage.getItem("token"); return t ? { Authorization: `Bearer ${t}` } : {}; })(), withCredentials: true }
      );
      setSaved(true);
      toast.success("Added to Revision Notes ✓");
    } catch (err) {
      if (err.response?.status === 409) {
        toast.info("Already saved in Revision Notes");
        setSaved(true);
      } else if (err.response?.status === 429) {
        if (onLimitReached) onLimitReached();
      } else {
        toast.error("Failed to save note");
      }
    } finally {
      setSaving(false);
    }
  };

  // Split AI response into clickable sentences
  const renderAIContent = (content) => {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      const baseStyle = {
        cursor: "pointer",
        borderRadius: 4,
        transition: "background 0.15s",
        display: "block",
        padding: "1px 2px",
        margin: "-1px -2px",
      };
      const hoverHandlers = {
        onMouseEnter: e => (e.currentTarget.style.background = "rgba(129,140,248,0.15)"),
        onMouseLeave: e => (e.currentTarget.style.background = "transparent"),
        onClick: () => onMentorSpeak && onMentorSpeak(line),
        title: "Click to listen",
      };

      if (line.startsWith('### ')) return (
        <h4 key={i} className="text-base font-semibold text-white mt-3 mb-1" style={baseStyle} {...hoverHandlers}>
          {line.slice(4)}
        </h4>
      );
      if (line.startsWith('## ')) return (
        <h3 key={i} className="text-lg font-semibold text-white mt-4 mb-2" style={baseStyle} {...hoverHandlers}>
          {line.slice(3)}
        </h3>
      );
      if (line.startsWith('# ')) return (
        <h2 key={i} className="text-xl font-bold text-white mt-4 mb-2" style={baseStyle} {...hoverHandlers}>
          {line.slice(2)}
        </h2>
      );
      if (line.startsWith('- ') || line.startsWith('• ')) return (
        <li key={i} className="ml-4 mb-1" style={baseStyle} {...hoverHandlers}
          dangerouslySetInnerHTML={{ __html: formattedLine.slice(2) }} />
      );
      if (/^\d+\.\s/.test(line)) return (
        <li key={i} className="ml-4 mb-1 list-decimal" style={baseStyle} {...hoverHandlers}
          dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^\d+\.\s/, '') }} />
      );
      return line.trim()
        ? <p key={i} className="mb-2 last:mb-0" style={baseStyle} {...hoverHandlers}
            dangerouslySetInnerHTML={{ __html: formattedLine }} />
        : <br key={i} />;
    });
  };

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-slate-600' : 'bg-indigo-600'}`}>
        {isUser
          ? (user?.picture ? <img src={user.picture} alt="" className="w-8 h-8 rounded-full" /> : <User className="w-4 h-4 text-white" />)
          : <Bot className="w-4 h-4 text-white" />}
      </div>

      <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block text-left rounded-2xl p-4 ${isUser ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-slate-700 text-slate-100 rounded-tl-sm'}`}
          style={{ width: "100%" }}>
          {message.image && (
            <img src={message.image} alt="Uploaded" className="max-w-full rounded-lg mb-3 max-h-64 object-contain" />
          )}
          <div className="prose prose-sm max-w-none prose-invert">
            {isUser
              ? message.content.split('\n').map((line, i) => {
                  const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                  return <p key={i} className="mb-2 last:mb-0" dangerouslySetInnerHTML={{ __html: formattedLine }} />;
                })
              : renderAIContent(message.content)
            }
          </div>
        </div>

        {/* Bottom action row for AI messages */}
        {!isUser && (
          <div className="flex items-center justify-between mt-2 ml-1">
            <div className="flex items-center gap-2">
              <button onClick={onCopy} className="text-slate-500 hover:text-slate-300 p-1 rounded" title="Copy message">
                {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>

              {/* Save to Revision Notes */}
              <button
                onClick={handleSaveNote}
                title={saved ? "Saved to Revision Notes" : "Save to Revision Notes"}
                disabled={saving}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  background: saved ? "rgba(99,102,241,0.2)" : "none",
                  border: saved ? "1px solid rgba(99,102,241,0.35)" : "1px solid transparent",
                  borderRadius: 8, cursor: saving ? "wait" : "pointer",
                  padding: "3px 8px", transition: "all 0.2s",
                  color: saved ? "#818cf8" : "rgba(148,163,184,0.6)",
                  fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
                }}
                onMouseEnter={e => { if (!saved) { e.currentTarget.style.color = "#818cf8"; e.currentTarget.style.border = "1px solid rgba(99,102,241,0.35)"; e.currentTarget.style.background = "rgba(99,102,241,0.1)"; } }}
                onMouseLeave={e => { if (!saved) { e.currentTarget.style.color = "rgba(148,163,184,0.6)"; e.currentTarget.style.border = "1px solid transparent"; e.currentTarget.style.background = "none"; } }}
              >
                {saving
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <BookMarked className="w-3 h-3" />
                }
                {saved ? "SAVED" : "SAVE"}
              </button>
            </div>

            {/* Mentor avatar trigger icon */}
            <div style={{ marginRight: 2, display: "flex", alignItems: "center" }}>
              <MentorTriggerIcon
                onClick={() => onMentorSpeak && onMentorSpeak(message.content)}
                isSpeaking={isMentorSpeaking}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
