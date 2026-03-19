import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useAuth } from "../App";
import { API } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  BookOpen, FileText, PenTool, Calendar, BarChart3,
  Clock, Flame, Target, CheckCircle, Scale, CreditCard,
  MessageSquare, PlayCircle, BookMarked,
} from "lucide-react";

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Format minutes → "1h 23m" or "45m" or "0m"
const fmtMinutes = (mins) => {
  if (!mins || mins < 1) return "0m";
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const calcReadiness = (analytics) => {
  if (!analytics) return 0;
  const score =
    (analytics.tests_taken || 0) * 10 +
    ((analytics.total_study_time_minutes || 0) / 60) * 2 +
    (analytics.drafts_submitted || 0) * 5;
  return Math.min(Math.round(score), 100);
};

/* ─── logActivity — exported for use in other pages ─────────────────────── */
export const logActivity = async (activityType, description) => {
  try {
    await axios.post(
      `${API}/activity/log`,
      { activity_type: activityType, description },
      { headers: getAuthHeaders(), withCredentials: true }
    );
  } catch {}
};

/* ─── StudyTimeTracker — mount on any learning page ─────────────────────── */
export const StudyTimeTracker = ({ subject = "", activityLabel = "Studied topic" }) => {
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
    return () => {
      const elapsedMinutes = (Date.now() - startRef.current) / 60000;
      if (elapsedMinutes < 0.25) return;

      const headers = getAuthHeaders();
      const minutes = parseFloat(elapsedMinutes.toFixed(2));

      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          `${API}/analytics/study-time`,
          new Blob([JSON.stringify({ minutes })], { type: "application/json" })
        );
      } else {
        axios.post(`${API}/analytics/study-time`, { minutes }, { headers, withCredentials: true }).catch(() => {});
      }

      // Log the activity for Recent Activity feed
      axios.post(
        `${API}/activity/log`,
        { activity_type: "study", description: `${activityLabel}${subject ? ": " + subject : ""}` },
        { headers, withCredentials: true }
      ).catch(() => {});
    };
  }, []);

  return null;
};

/* ─── Dashboard ─────────────────────────────────────────────────────────── */
const Dashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    recordDailyActivity();
    fetchDashboardData();
  }, []);

  const recordDailyActivity = async () => {
    try {
      await axios.post(
        `${API}/analytics/activity`,
        { activity_type: "dashboard_visit" },
        { headers: getAuthHeaders(), withCredentials: true }
      );
    } catch {}
  };

  const fetchDashboardData = async () => {
    try {
      const [dashRes, activityRes] = await Promise.all([
        axios.get(`${API}/analytics/dashboard`, { headers: getAuthHeaders(), withCredentials: true }),
        axios.get(`${API}/activity/recent`,      { headers: getAuthHeaders(), withCredentials: true }),
      ]);
      setAnalytics({
        ...dashRes.data.analytics,
        recent_activity: activityRes.data.activities || [],
      });
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const readinessScore = analytics
    ? (analytics.readiness_score ?? calcReadiness(analytics))
    : 0;

  // Daily study time — resets to 0 each new calendar day (handled in backend)
  const dailyMinutes = analytics?.daily_study_minutes ?? 0;

  const statsCards = [
    {
      title:    "Today's Study",
      value:    fmtMinutes(dailyMinutes),
      subtitle: "Resets each day",
      icon:     <Clock    className="w-5 h-5" />,
      color:    "text-indigo-600",
      bg:       "bg-indigo-50",
    },
    {
      title: "Tests Taken",
      value: analytics?.tests_taken || 0,
      icon:  <FileText  className="w-5 h-5" />,
      color: "text-emerald-600",
      bg:    "bg-emerald-50",
    },
    {
      title: "Drafts Submitted",
      value: analytics?.drafts_submitted || 0,
      icon:  <PenTool   className="w-5 h-5" />,
      color: "text-amber-600",
      bg:    "bg-amber-50",
    },
    {
      title: "Study Streak",
      value: analytics?.study_streak_days || 0,
      unit:  "days",
      icon:  <Flame     className="w-5 h-5" />,
      color: "text-rose-600",
      bg:    "bg-rose-50",
    },
  ];

  const quickActions = [
    { title: "Start Learning",  description: "Ask AI to teach you any topic",   icon: <BookOpen   className="w-5 h-5" />, path: "/learn",          color: "bg-indigo-500"  },
    { title: "Video Lectures",  description: "Watch recorded lecture videos",    icon: <PlayCircle className="w-5 h-5" />, path: "/lectures",       color: "bg-purple-500"  },
    { title: "Take Mock Test",  description: "Practice with AI-generated tests", icon: <FileText   className="w-5 h-5" />, path: "/tests",          color: "bg-emerald-500" },
    { title: "Drafting Lab",    description: "Practice corporate documents",     icon: <PenTool    className="w-5 h-5" />, path: "/drafting",       color: "bg-amber-500"   },
    { title: "Study Planner",   description: "Create your exam schedule",        icon: <Calendar   className="w-5 h-5" />, path: "/planner",        color: "bg-rose-500"    },
    { title: "Case Laws",       description: "Explore landmark judgements",      icon: <Scale      className="w-5 h-5" />, path: "/caselaws",       color: "bg-violet-500"  },
    { title: "Revision Notes",  description: "Review your saved AI notes",      icon: <BookMarked className="w-5 h-5" />, path: "/revision-notes", color: "bg-teal-500"    },
    { title: "Analytics",       description: "Track your performance",           icon: <BarChart3  className="w-5 h-5" />, path: "/analytics",      color: "bg-cyan-500"    },
    { title: "Subscription",    description: "Manage your plan",                 icon: <CreditCard className="w-5 h-5" />, path: "/subscription",   color: "bg-slate-500"   },
  ];

  const iconMap = {
    test:    <FileText      className="w-4 h-4 text-emerald-500" />,
    study:   <BookOpen      className="w-4 h-4 text-indigo-500"  />,
    draft:   <PenTool       className="w-4 h-4 text-amber-500"   />,
    case:    <Scale         className="w-4 h-4 text-violet-500"  />,
    chat:    <MessageSquare className="w-4 h-4 text-cyan-500"    />,
    video:   <PlayCircle    className="w-4 h-4 text-purple-500"  />,
    notes:   <BookMarked    className="w-4 h-4 text-teal-500"    />,
    planner: <Calendar      className="w-4 h-4 text-rose-500"    />,
  };

  if (isLoading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const recentActivity = analytics?.recent_activity || [];

  return (
    <DashboardLayout user={user}>
      <div className="space-y-8 animate-fade-in" data-testid="student-dashboard">

        {/* ── Welcome Banner ── */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-5 sm:p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2" style={{ fontFamily: "Outfit" }}>
                Welcome back, {user?.name?.split(" ")[0] || "Student"}! 👋
              </h2>
              <p className="text-indigo-100">
                Ready to continue your {user?.level || "Executive"} preparation?
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-indigo-200">Readiness Score</p>
                <p className="text-3xl font-bold">{readinessScore}%</p>
                <p className="text-xs text-indigo-300 mt-0.5">
                  {readinessScore < 30 ? "Keep going!" : readinessScore < 60 ? "Good progress" : readinessScore < 85 ? "Almost there!" : "Exam ready 🎯"}
                </p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                <Target className="w-8 h-8" />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${readinessScore}%` }} />
            </div>
            <p className="text-xs text-indigo-200 mt-1">
              Score = Tests × 10 + Study hours × 2 + Drafts × 5 (max 100)
            </p>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {statsCards.map((stat, index) => (
            <Card key={index} className="card-base card-hover">
              <CardContent className="pt-6">
                <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                  {stat.icon}
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {stat.value}
                  {stat.unit && (
                    <span className="text-sm font-normal text-slate-500 ml-1">{stat.unit}</span>
                  )}
                </p>
                <p className="text-sm text-slate-500">{stat.title}</p>
                {stat.subtitle && (
                  <p className="text-xs text-slate-400 mt-0.5">{stat.subtitle}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Quick Actions ── */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4" style={{ fontFamily: "Outfit" }}>
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.path}>
                <Card className="card-interactive h-full group" data-testid={`quick-action-${action.path.slice(1)}`}>
                  <CardContent className="pt-6">
                    <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                      {action.icon}
                    </div>
                    <h4 className="font-semibold text-slate-900 mb-1">{action.title}</h4>
                    <p className="text-sm text-slate-500">{action.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Recent Activity ── */}
        <Card className="card-base">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ fontFamily: "Outfit" }}>
              <Clock className="w-5 h-5 text-indigo-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-500">No activity yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Start learning, watching lectures, or taking tests — it'll all appear here!
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {iconMap[activity.activity_type] || <CheckCircle className="w-4 h-4 text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{activity.description}</p>
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0 ml-2 whitespace-nowrap">{activity.time}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Streak card ── */}
        {(analytics?.study_streak_days || 0) > 0 && (
          <Card className="card-base border-rose-100 bg-gradient-to-r from-rose-50 to-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center">
                  <Flame className="w-7 h-7 text-rose-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    🔥 {analytics.study_streak_days}-day streak!
                  </p>
                  <p className="text-sm text-slate-500">
                    Study every day to keep your streak alive. Missing a day resets it to 0.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
