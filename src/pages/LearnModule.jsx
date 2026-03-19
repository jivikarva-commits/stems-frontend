import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useAuth } from "../App";
import { API } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { ScrollArea } from "../components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { 
  Send, BookOpen, Brain, Sparkles, GraduationCap, 
  ChevronRight, Loader2, History, BookMarked
} from "lucide-react";

const LearnModule = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [teachingMode, setTeachingMode] = useState("beginner");
  const [topic, setTopic] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchSubjects();
  }, [user?.level]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchSubjects = async () => {
    try {
      const response = await axios.get(`${API}/subjects?level=${user?.level || 'Executive'}`);
      setSubjects(response.data.subjects || []);
    } catch (error) {
      console.error("Failed to fetch subjects:", error);
    }
  };

  const handleTeach = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic to learn");
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem("token");
    
    // Add user message
    setMessages(prev => [...prev, {
      role: "user",
      content: `Teach me about: ${topic}`,
      timestamp: new Date()
    }]);

    try {
      const response = await axios.post(
        `${API}/ai/teach`,
        {
          topic,
          mode: teachingMode,
          level: user?.level || "Executive"
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true
        }
      );

      setMessages(prev => [...prev, {
        role: "assistant",
        content: response.data.response,
        timestamp: new Date()
      }]);
      setTopic("");
    } catch (error) {
      if (error?.response?.status === 429) {
        const detail = error?.response?.data?.detail;
        const message = typeof detail === "string" ? detail : detail?.message;
        toast.error(message || "Usage limit reached.");
      } else {
        const detail = error?.response?.data?.detail;
        toast.error(detail || "Failed to get response. Please try again.");
      }
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;

    setIsLoading(true);
    const token = localStorage.getItem("token");
    
    setMessages(prev => [...prev, {
      role: "user",
      content: chatInput,
      timestamp: new Date()
    }]);

    const userMessage = chatInput;
    setChatInput("");

    try {
      const response = await axios.post(
        `${API}/ai/chat`,
        { message: userMessage },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true
        }
      );

      setMessages(prev => [...prev, {
        role: "assistant",
        content: response.data.response,
        timestamp: new Date()
      }]);
    } catch (error) {
      if (error?.response?.status === 429) {
        const detail = error?.response?.data?.detail;
        const message = typeof detail === "string" ? detail : detail?.message;
        toast.error(message || "Usage limit reached.");
      } else {
        const detail = error?.response?.data?.detail;
        toast.error(detail || "Failed to send message");
      }
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const modeDescriptions = {
    beginner: "Simple explanations with basic examples",
    exam_oriented: "Focus on exam patterns and important keywords",
    practical: "Real-world corporate scenarios and applications"
  };

  return (
    <DashboardLayout user={user}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" data-testid="learn-module">
        {/* Sidebar - Subject Navigation */}
        <div className="lg:col-span-3">
          <Card className="card-base lg:sticky lg:top-24">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2" style={{ fontFamily: 'Outfit' }}>
                <BookMarked className="w-5 h-5 text-indigo-600" />
                Subjects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48 sm:h-64 lg:h-[400px] pr-4">
                <div className="space-y-2">
                  {subjects.map((subject, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedSubject(subject);
                        setTopic(subject.name);
                      }}
                      className={`w-full p-3 text-left rounded-lg transition-all ${
                        selectedSubject?.code === subject.code 
                          ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                      data-testid={`subject-${subject.code}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{subject.name}</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                      <span className="text-xs text-slate-500">{subject.chapters} chapters</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - AI Learning Interface */}
        <div className="lg:col-span-9 space-y-6">
          {/* Topic Input Card */}
          <Card className="card-base">
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Outfit' }}>
                <Brain className="w-5 h-5 text-indigo-600" />
                Learn with AI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      Topic to Learn
                    </label>
                    <Input
                      placeholder="e.g., Board Meetings, Section 173, ROC Filing..."
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleTeach()}
                      data-testid="topic-input"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      Teaching Mode
                    </label>
                    <Select value={teachingMode} onValueChange={setTeachingMode}>
                      <SelectTrigger data-testid="mode-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" />
                            Beginner Mode
                          </div>
                        </SelectItem>
                        <SelectItem value="exam_oriented">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Exam-Oriented
                          </div>
                        </SelectItem>
                        <SelectItem value="practical">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Practical Mode
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-sm text-slate-500">
                  {modeDescriptions[teachingMode]}
                </p>
                <Button 
                  onClick={handleTeach} 
                  disabled={isLoading || !topic.trim()}
                  className="btn-primary"
                  data-testid="teach-btn"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Brain className="w-4 h-4 mr-2" />
                  )}
                  Teach Me
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Chat/Response Area */}
          <Card className="card-base">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-lg" style={{ fontFamily: 'Outfit' }}>
                <History className="w-5 h-5 text-indigo-600" />
                Learning Session
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-72 sm:h-96 lg:h-[500px] p-4 sm:p-6">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                      <Sparkles className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Start Learning</h3>
                    <p className="text-slate-500 max-w-sm">
                      Enter a topic above and select your preferred teaching mode. 
                      The AI mentor will explain concepts in a structured format.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-xl p-4 ${
                            message.role === 'user'
                              ? 'bg-indigo-600 text-white'
                              : 'ai-message'
                          }`}
                        >
                          {message.role === 'assistant' && (
                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-indigo-100">
                              <Brain className="w-4 h-4 text-indigo-600" />
                              <span className="text-sm font-medium text-indigo-700">AI Mentor</span>
                            </div>
                          )}
                          <div className={message.role === 'assistant' ? 'markdown-content' : ''}>
                            {message.content.split('\n').map((line, i) => (
                              <p key={i} className={message.role === 'user' ? '' : 'mb-2'}>
                                {line}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="ai-message max-w-[85%] rounded-xl p-4">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                            <span className="text-sm text-slate-500">AI is thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Chat Input */}
              {messages.length > 0 && (
                <div className="border-t border-slate-100 p-4">
                  <div className="flex gap-2 sm:gap-3">
                    <Input
                      placeholder="Ask a follow-up question..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleChat()}
                      disabled={isLoading}
                      data-testid="chat-input"
                    />
                    <Button 
                      onClick={handleChat} 
                      disabled={isLoading || !chatInput.trim()}
                      className="btn-primary"
                      data-testid="send-chat-btn"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LearnModule;
