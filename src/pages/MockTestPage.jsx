import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useAuth } from "../App";
import { API } from "../App";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { ScrollArea } from "../components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Label } from "../components/ui/label";
import { Progress } from "../components/ui/progress";
import { 
  FileText, Clock, Play, CheckCircle, Brain, 
  Loader2, Timer, AlertCircle, Trophy, ArrowRight,
  XCircle, Target, TrendingUp, BookOpen, GraduationCap
} from "lucide-react";
import UpgradePopup from "../components/UpgradePopup";


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

const MockTestPage = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  
  // Test configuration
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState("10");
  const [timerMinutes, setTimerMinutes] = useState("15");
  const [customTimer, setCustomTimer] = useState("");
  
  // Syllabus data
  const [levels, setLevels] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  // Test states
  const [testPhase, setTestPhase] = useState("setup"); // setup, taking, results
  const [questions, setQuestions] = useState([]);
  const [currentTestId, setCurrentTestId] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState(null);
  
  // Results
  const [testResults, setTestResults] = useState(null);
  
  // History
  const [testHistory, setTestHistory] = useState([]);

  useEffect(() => {
    fetchLevels();
    fetchTestHistory();
  }, []);

  useEffect(() => {
    if (selectedLevel) {
      fetchSubjects(selectedLevel);
    }
  }, [selectedLevel]);

  useEffect(() => {
    let timer;
    if (testPhase === "taking" && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [testPhase, timeLeft]);

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
      const response = await axios.get(`${API}/syllabus/subjects/${level}`);
      setSubjects(response.data.subjects || []);
      setSelectedSubject("");
    } catch (error) {
      console.error("Failed to fetch subjects:", error);
    }
  };

  const fetchTestHistory = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(`${API}/tests/history`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true
      });
      setTestHistory(response.data.history || []);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }
  };

  const generateTest = async () => {
    if (!selectedLevel || !selectedSubject || !topic) {
      toast.error("Please select Level, Subject, and enter a Topic");
      return;
    }

    setIsGenerating(true);
    const token = localStorage.getItem("token");

    try {
      const response = await axios.post(
        `${API}/tests/generate-mcq`,
        {
          level: selectedLevel,
          subject: selectedSubject,
          topic: topic,
          num_questions: parseInt(numQuestions)
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true
        }
      );

      const generatedQuestions = response.data.questions || [];
      
      if (generatedQuestions.length === 0) {
        toast.error("Failed to generate questions. Please try again.");
        return;
      }

      setQuestions(generatedQuestions);
      setCurrentTestId(response.data.test_id);
      setUserAnswers({});
      const mins = timerMinutes === "custom" ? (parseInt(customTimer) || 15) : parseInt(timerMinutes);
      setTimeLeft(mins * 60);
      setStartTime(Date.now());
      setTopic("");
      setTestPhase("taking");
      toast.success(`${generatedQuestions.length} questions generated!`);
      _logActivity("test", `Started mock test: ${selectedSubject || "General"}${topic ? " – " + topic : ""}`);
    } catch (error) {
      if (error?.response?.status === 429) {
        setShowUpgradePopup(true);
      } else {
        const detail = error?.response?.data?.detail;
        toast.error(detail || "Failed to generate test");
        console.error(error);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerSelect = (questionIndex, answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const handleSubmitTest = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    const timeTaken = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

    try {
      const response = await axios.post(
        `${API}/tests/submit-mcq`,
        {
          test_id: currentTestId,
          answers: userAnswers,
          time_taken_seconds: timeTaken
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true
        }
      );

      setTestResults(response.data);
      setTestPhase("results");
      toast.success("Test submitted successfully!");
      _logActivity("test", `Completed mock test: ${selectedSubject || "General"} – ${Math.round(response.data.percentage || 0)}% score`);
    } catch (error) {
      toast.error("Failed to submit test");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetTest = () => {
    setTestPhase("setup");
    setQuestions([]);
    setUserAnswers({});
    setTestResults(null);
    setCurrentTestId(null);
    fetchTestHistory();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Test Taking View
  if (testPhase === "taking") {
    const answeredCount = Object.keys(userAnswers).length;
    const progress = (answeredCount / questions.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" data-testid="mock-test-taking">
        <StudyTimeTracker />
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Outfit' }}>
                  {selectedSubject} - MCQ Test
                </h1>
                <p className="text-sm text-slate-500 truncate max-w-xs">
                  {topic.length > 200 ? "Custom Content Test" : topic}
                </p>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono ${
                timeLeft < 300 ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'
              }`}>
                <Timer className="w-5 h-5" />
                <span className="font-bold text-lg">{formatTime(timeLeft)}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Progress value={progress} className="flex-1 h-2" />
              <span className="text-sm text-slate-600 font-medium">{answeredCount}/{questions.length}</span>
              <Button 
                onClick={handleSubmitTest}
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6"
                data-testid="submit-test-btn"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Test"}
              </Button>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="max-w-4xl mx-auto pt-32 pb-8 px-4">
          <div className="space-y-6 overflow-x-hidden">
            {questions.map((q, index) => (
              <Card key={index} className={`border-2 transition-all ${
                userAnswers[index] ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200'
              }`} data-testid={`question-${index}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      userAnswers[index] ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-slate-900 font-medium leading-relaxed">{q.question}</p>
                      {q.difficulty && (
                        <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${
                          q.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                          q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {q.difficulty}
                        </span>
                      )}
                    </div>
                  </div>

                  <RadioGroup
                    value={userAnswers[index] || ""}
                    onValueChange={(value) => handleAnswerSelect(index, value)}
                    className="space-y-3 ml-0 sm:ml-12"
                  >
                    {q.options?.map((option, optIndex) => {
                      const optionLetter = option.charAt(0);
                      return (
                        <div 
                          key={optIndex}
                          className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${
                            userAnswers[index] === optionLetter 
                              ? 'border-indigo-500 bg-indigo-50' 
                              : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                          }`}
                          onClick={() => handleAnswerSelect(index, optionLetter)}
                        >
                          <RadioGroupItem value={optionLetter} id={`q${index}-opt${optIndex}`} />
                          <Label htmlFor={`q${index}-opt${optIndex}`} className="flex-1 cursor-pointer text-slate-700">
                            {option}
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Button 
              onClick={handleSubmitTest}
              disabled={isLoading}
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-12"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />Evaluating...</>
              ) : (
                <><CheckCircle className="w-4 h-4 mr-2" />Submit Test</>
              )}
            </Button>
          </div>
        </div>
        <UpgradePopup
          open={showUpgradePopup}
          onClose={() => setShowUpgradePopup(false)}
          planName={user?.plan}
        />
      </div>
    );
  }

  // Results View
  if (testPhase === "results" && testResults) {
    const percentage = testResults.percentage || 0;
    const performanceLevel = percentage >= 80 ? "Excellent" : percentage >= 60 ? "Good" : percentage >= 40 ? "Needs Improvement" : "Requires Practice";
    const performanceColor = percentage >= 80 ? "text-emerald-600" : percentage >= 60 ? "text-blue-600" : percentage >= 40 ? "text-yellow-600" : "text-red-600";

    return (
      <DashboardLayout user={user}>
        <div className="max-w-4xl mx-auto space-y-6" data-testid="test-results">
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-white text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 opacity-90" />
              <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Outfit' }}>Test Completed!</h1>
              <p className="opacity-80">{selectedSubject} - {topic.length > 200 ? "Custom Content Test" : topic}</p>
            </div>
            <CardContent className="p-4 sm:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="text-center p-6 bg-slate-50 rounded-xl">
                  <div className="text-4xl font-bold text-indigo-600 mb-2">{testResults.score}/{testResults.total}</div>
                  <p className="text-slate-600">Correct Answers</p>
                </div>
                <div className="text-center p-6 bg-slate-50 rounded-xl">
                  <div className={`text-4xl font-bold mb-2 ${performanceColor}`}>{percentage.toFixed(1)}%</div>
                  <p className="text-slate-600">Score</p>
                </div>
                <div className="text-center p-6 bg-slate-50 rounded-xl">
                  <div className={`text-xl font-bold mb-2 ${performanceColor}`}>{performanceLevel}</div>
                  <p className="text-slate-600">Performance</p>
                </div>
              </div>

              {testResults.weak_topics && testResults.weak_topics.length > 0 && (
                <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-xl">
                  <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5" />Areas to Improve
                  </h3>
                  <ul className="space-y-2">
                    {testResults.weak_topics.map((topic, i) => (
                      <li key={i} className="text-amber-700 text-sm flex items-start gap-2">
                        <span className="text-amber-500">•</span>{topic}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {testResults.analysis && (
                <div className="mb-8 p-6 bg-slate-50 rounded-xl">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />Performance Analysis
                  </h3>
                  <div className="prose prose-sm max-w-none text-slate-700">
                    {testResults.analysis.split('\n').map((line, i) => <p key={i} className="mb-2">{line}</p>)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Outfit' }}>
                <BookOpen className="w-5 h-5 text-indigo-600" />Question-wise Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testResults.results?.map((result, index) => (
                  <div key={index} className={`p-4 rounded-xl border-2 ${result.is_correct ? 'border-emerald-200 bg-emerald-50/50' : 'border-red-200 bg-red-50/50'}`}>
                    <div className="flex items-start gap-3 mb-3">
                      {result.is_correct ? (
                        <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 mb-2">Q{index + 1}: {result.question}</p>
                        <div className="grid md:grid-cols-2 gap-2 text-sm">
                          <div className={`p-2 rounded ${result.is_correct ? 'bg-emerald-100' : 'bg-red-100'}`}>
                            <span className="text-slate-600">Your answer: </span>
                            <span className={result.is_correct ? 'text-emerald-700 font-medium' : 'text-red-700 font-medium'}>{result.user_answer || "Not answered"}</span>
                          </div>
                          {!result.is_correct && (
                            <div className="p-2 rounded bg-emerald-100">
                              <span className="text-slate-600">Correct answer: </span>
                              <span className="text-emerald-700 font-medium">{result.correct_answer}</span>
                            </div>
                          )}
                        </div>
                        {result.explanation && (
                          <p className="mt-3 text-sm text-slate-600 bg-white/50 p-3 rounded-lg">
                            <strong>Explanation:</strong> {result.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button onClick={resetTest} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700">
              <ArrowRight className="w-4 h-4 mr-2 rotate-180" />Back to Tests
            </Button>
            <Button onClick={() => { setTestPhase("setup"); setTestResults(null); }} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
              <Play className="w-4 h-4 mr-2" />Take New Test
            </Button>
          </div>
        </div>
        <UpgradePopup
          open={showUpgradePopup}
          onClose={() => setShowUpgradePopup(false)}
          planName={user?.plan}
        />
      </DashboardLayout>
    );
  }

  // Setup View (Default)
  return (
    <DashboardLayout user={user}>
      <div className="max-w-5xl mx-auto space-y-6" data-testid="mock-test-page">
        <StudyTimeTracker />
        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="mb-6 bg-slate-100 p-1 rounded-xl">
            <TabsTrigger value="generate" className="rounded-lg">
              <Brain className="w-4 h-4 mr-2" />Generate Test
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg">
              <Clock className="w-4 h-4 mr-2" />Test History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate">
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                <CardTitle className="flex items-center gap-2 text-2xl" style={{ fontFamily: 'Outfit' }}>
                  <GraduationCap className="w-7 h-7 text-indigo-600" />AI-Powered MCQ Test Generator
                </CardTitle>
                <CardDescription className="text-base">
                  Generate syllabus-aligned MCQ tests for your CS exam preparation
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-2 block">Select Level *</label>
                      <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                        <SelectTrigger className="h-12" data-testid="level-select">
                          <SelectValue placeholder="Choose your CS Level" />
                        </SelectTrigger>
                        <SelectContent>
                          {levels.map((level) => <SelectItem key={level} value={level}>{level}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-2 block">Select Subject *</label>
                      <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedLevel}>
                        <SelectTrigger className="h-12" data-testid="subject-select">
                          <SelectValue placeholder={selectedLevel ? "Choose your subject" : "Select level first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subject) => <SelectItem key={subject.name} value={subject.name}>{subject.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-2 block">Topic / Chapter *</label>
                      <Textarea
                        placeholder={"Option 1 — Topic name:\ne.g. Doctrine of Indoor Management\n\nOption 2 — Paste custom questions:\nQ1. What is...?\nA) ...\nB) ...\nC) ...\nD) ...\nAnswer: A\n\nOption 3 — Paste study notes / material:\nPaste any text and AI will generate MCQs from it"}
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="min-h-[120px] resize-y text-sm"
                        data-testid="topic-input"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        {topic.length > 200
                          ? "📄 Custom content detected — MCQs will be generated strictly from your pasted material"
                          : "💡 Enter a topic name · paste custom Q&A · or paste your own study notes"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-2 block">Number of Questions</label>
                      <Select value={numQuestions} onValueChange={setNumQuestions}>
                        <SelectTrigger className="h-12" data-testid="questions-select"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 Questions (Quick)</SelectItem>
                          <SelectItem value="10">10 Questions (Standard)</SelectItem>
                          <SelectItem value="15">15 Questions (Extended)</SelectItem>
                          <SelectItem value="20">20 Questions (Full)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-2 block">Timer Duration</label>
                      <Select value={timerMinutes} onValueChange={(val) => { setTimerMinutes(val); setCustomTimer(""); }}>
                        <SelectTrigger className="h-12" data-testid="timer-select"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 Minutes</SelectItem>
                          <SelectItem value="15">15 Minutes (Default)</SelectItem>
                          <SelectItem value="20">20 Minutes</SelectItem>
                          <SelectItem value="30">30 Minutes</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      {timerMinutes === "custom" && (
                        <input
                          type="number" min="1" max="120"
                          placeholder="Enter minutes (e.g. 25)"
                          value={customTimer}
                          onChange={(e) => setCustomTimer(e.target.value)}
                          className="mt-2 w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                          data-testid="custom-timer-input"
                        />
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-2xl p-6">
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-indigo-600" />What You'll Get
                    </h3>
                    <ul className="space-y-3 text-slate-700">
                      <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" /><span>AI-generated MCQs strictly from ICSI syllabus</span></li>
                      <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" /><span>Mixed difficulty levels (Easy, Medium, Hard)</span></li>
                      <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" /><span>Instant auto-evaluation with score</span></li>
                      <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" /><span>Detailed explanations for each question</span></li>
                      <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" /><span>Weak topic identification</span></li>
                      <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" /><span>Performance analysis & recommendations</span></li>
                    </ul>
                    {selectedLevel && selectedSubject && (
                      <div className="mt-6 p-4 bg-white rounded-xl border border-indigo-100">
                        <p className="text-sm text-indigo-700 font-medium">Selected: {selectedLevel} → {selectedSubject}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100">
                  <Button 
                    onClick={generateTest}
                    disabled={isGenerating || !selectedLevel || !selectedSubject || !topic}
                    size="lg"
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-14 text-lg"
                    data-testid="generate-test-btn"
                  >
                    {isGenerating ? (
                      <><Loader2 className="w-5 h-5 animate-spin mr-2" />Generating Questions...</>
                    ) : (
                      <><Brain className="w-5 h-5 mr-2" />Generate MCQ Test</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Outfit' }}>
                  <Clock className="w-5 h-5 text-indigo-600" />Test History
                </CardTitle>
                <CardDescription>Your previous test attempts and scores</CardDescription>
              </CardHeader>
              <CardContent>
                {testHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No Tests Yet</h3>
                    <p className="text-slate-500 mb-4">Generate your first MCQ test to start practicing</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {testHistory.map((test, index) => (
                      <div key={index} className="p-4 bg-slate-50 rounded-xl flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-slate-900">{test.subject || "MCQ Test"}</h4>
                          <p className="text-sm text-slate-500 truncate max-w-xs">{test.topic || "General"}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-indigo-600">{test.score_percentage?.toFixed(1) || 0}%</div>
                          <p className="text-xs text-slate-500">{new Date(test.submitted_at).toLocaleDateString()}</p>
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

export default MockTestPage;
