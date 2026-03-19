import { useState, useEffect } from "react";
import axios from "axios";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useAuth } from "../App";
import { API } from "../App";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { 
  BarChart3, Clock, FileText, PenTool, Flame, 
  Target, TrendingUp, Brain, Award, AlertCircle,
  CheckCircle, BookOpen, GraduationCap
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell 
} from "recharts";

const AnalyticsPage = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [subjectPerformance, setSubjectPerformance] = useState([]);
  const [performanceTrend, setPerformanceTrend] = useState([]);
  const [recentTests, setRecentTests] = useState([]);
  const [recentDrafts, setRecentDrafts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(`${API}/analytics/dashboard`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true
      });
      setAnalytics(response.data.analytics);
      setSubjectPerformance(response.data.subject_performance || []);
      setPerformanceTrend(response.data.performance_trend || []);
      setRecentTests(response.data.recent_tests || []);
      setRecentDrafts(response.data.recent_drafts || []);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Default chart data if no real data
  const defaultTrend = [
    { test: "Test 1", score: 0 },
    { test: "Test 2", score: 0 },
    { test: "Test 3", score: 0 }
  ];

  const defaultSubjects = [
    { subject: "Company Law", score: 0 },
    { subject: "Tax Laws", score: 0 }
  ];

  const studyDistribution = [
    { name: "Mock Tests", value: analytics?.tests_taken || 0, color: "#4f46e5" },
    { name: "Drafting", value: analytics?.drafts_submitted || 0, color: "#10b981" },
    { name: "Study Time", value: Math.round((analytics?.total_study_time_minutes || 0) / 60), color: "#f59e0b" }
  ];

  const statsCards = [
    { 
      title: "Total Study Time", 
      value: `${Math.round((analytics?.total_study_time_minutes || 0) / 60)}h`,
      subtext: `${analytics?.total_study_time_minutes || 0} minutes`,
      icon: <Clock className="w-5 h-5" />,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100"
    },
    { 
      title: "Tests Completed", 
      value: analytics?.tests_taken || 0,
      subtext: `Avg: ${analytics?.average_test_score || 0}%`,
      icon: <FileText className="w-5 h-5" />,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100"
    },
    { 
      title: "Drafts Submitted", 
      value: analytics?.drafts_submitted || 0,
      subtext: `Avg: ${analytics?.average_draft_score || 0}/100`,
      icon: <PenTool className="w-5 h-5" />,
      color: "text-amber-600",
      bgColor: "bg-amber-100"
    },
    { 
      title: "Study Streak", 
      value: `${analytics?.study_streak_days || 0} days`,
      subtext: analytics?.study_streak_days > 0 ? "Keep it up!" : "Start studying!",
      icon: <Flame className="w-5 h-5" />,
      color: "text-rose-600",
      bgColor: "bg-rose-100"
    }
  ];

  if (isLoading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  const readinessScore = analytics?.readiness_score || 0;
  const hasData = (analytics?.tests_taken || 0) > 0 || (analytics?.drafts_submitted || 0) > 0;

  return (
    <DashboardLayout user={user}>
      <div className="max-w-7xl mx-auto space-y-6 px-0" data-testid="analytics-page">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((stat, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center ${stat.color} mb-4`}>
                  {stat.icon}
                </div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.title}</p>
                <p className="text-xs text-slate-400 mt-1">{stat.subtext}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Readiness Score */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className={`p-8 text-white ${
            readinessScore >= 70 ? 'bg-gradient-to-r from-emerald-600 to-emerald-700' :
            readinessScore >= 40 ? 'bg-gradient-to-r from-indigo-600 to-indigo-700' :
            'bg-gradient-to-r from-amber-600 to-amber-700'
          }`}>
            <div className="flex flex-col gap-4 sm:gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Target className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-medium opacity-90">Exam Readiness Score</h3>
                  <p className="text-3xl sm:text-5xl font-bold">{readinessScore}%</p>
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <div className="bg-white/20 rounded-full h-4 overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${readinessScore}%` }}
                  />
                </div>
                <p className="text-sm opacity-80 mt-2">
                  {readinessScore >= 80 ? "🎉 Excellent! You're well prepared for your exam!" :
                   readinessScore >= 60 ? "📈 Good progress! Keep practicing to improve." :
                   readinessScore >= 40 ? "💪 You're on track. More practice needed." :
                   "🚀 Start taking tests and drafting to build your score!"}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Trend */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Outfit' }}>
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Test Performance Trend
              </CardTitle>
              <CardDescription>
                {performanceTrend.length > 0 ? "Your recent test scores" : "Complete tests to see your trend"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {performanceTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="test" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                        formatter={(value) => [`${value}%`, 'Score']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#4f46e5" 
                        strokeWidth={3}
                        dot={{ fill: '#4f46e5', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-center">
                    <div>
                      <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">Take mock tests to see your progress</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Subject Performance */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Outfit' }}>
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Subject-wise Performance
              </CardTitle>
              <CardDescription>
                {subjectPerformance.length > 0 ? "Average scores by subject" : "Test different subjects to compare"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {subjectPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectPerformance} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" domain={[0, 100]} />
                      <YAxis dataKey="subject" type="category" tick={{ fontSize: 11 }} stroke="#94a3b8" width={120} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                        formatter={(value) => [`${value}%`, 'Avg Score']}
                      />
                      <Bar dataKey="score" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-center">
                    <div>
                      <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">Complete tests in different subjects</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Activity Distribution */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Outfit' }}>
                <Brain className="w-5 h-5 text-indigo-600" />
                Activity Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasData ? (
                <>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={studyDistribution.filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {studyDistribution.filter(d => d.value > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4 mt-2">
                    {studyDistribution.filter(d => d.value > 0).map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-slate-600">{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-48 flex items-center justify-center text-center">
                  <div>
                    <Brain className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">No activity yet</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weak Areas */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700" style={{ fontFamily: 'Outfit' }}>
                <AlertCircle className="w-5 h-5" />
                Areas to Improve
              </CardTitle>
              <CardDescription>Topics that need more practice</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(analytics?.weak_areas?.length > 0 ? analytics.weak_areas : []).map((area, index) => (
                  <div key={index} className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <p className="text-sm font-medium text-amber-800">{area}</p>
                  </div>
                ))}
                {(!analytics?.weak_areas || analytics.weak_areas.length === 0) && (
                  <div className="text-center py-6">
                    <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">
                      {hasData ? "No weak areas identified!" : "Take tests to identify weak areas"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Strong Areas */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-700" style={{ fontFamily: 'Outfit' }}>
                <Award className="w-5 h-5" />
                Strong Areas
              </CardTitle>
              <CardDescription>Topics you're doing well in</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(analytics?.strong_areas?.length > 0 ? analytics.strong_areas : []).map((area, index) => (
                  <div key={index} className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <p className="text-sm font-medium text-emerald-800">{area}</p>
                  </div>
                ))}
                {(!analytics?.strong_areas || analytics.strong_areas.length === 0) && (
                  <div className="text-center py-6">
                    <Target className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">
                      {hasData ? "Keep practicing!" : "Take tests to discover your strengths"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        {(recentTests.length > 0 || recentDrafts.length > 0) && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Outfit' }}>
                <Clock className="w-5 h-5 text-indigo-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recent Tests */}
                <div>
                  <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Recent Tests
                  </h4>
                  {recentTests.length > 0 ? (
                    <div className="space-y-2">
                      {recentTests.slice(0, 3).map((test, i) => (
                        <div key={i} className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{test.subject || test.topic || "MCQ Test"}</p>
                            <p className="text-xs text-slate-500">{test.topic}</p>
                          </div>
                          <span className={`text-sm font-bold ${
                            (test.score_percentage || 0) >= 70 ? 'text-emerald-600' :
                            (test.score_percentage || 0) >= 50 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {test.score_percentage?.toFixed(1) || 0}%
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">No tests taken yet</p>
                  )}
                </div>

                {/* Recent Drafts */}
                <div>
                  <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <PenTool className="w-4 h-4" /> Recent Drafts
                  </h4>
                  {recentDrafts.length > 0 ? (
                    <div className="space-y-2">
                      {recentDrafts.slice(0, 3).map((draft, i) => (
                        <div key={i} className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{draft.draft_type?.replace(/_/g, ' ')}</p>
                            <p className="text-xs text-slate-500">
                              {new Date(draft.submitted_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`text-sm font-bold ${
                            (draft.score || 0) >= 70 ? 'text-emerald-600' :
                            (draft.score || 0) >= 50 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {draft.score || 0}/100
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">No drafts submitted yet</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
