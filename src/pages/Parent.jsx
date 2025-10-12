import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Brain, BookOpen, Gamepad2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import apiService from "@/services/api";
import logo from "@/assets/attenwell-logo.jpg";

const Parent = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();
  const [meditationTime, setMeditationTime] = useState(0);
  const [studyTime, setStudyTime] = useState(0);
  const [playTime, setPlayTime] = useState(0);
  const [sessions, setSessions] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [suddenClosures, setSuddenClosures] = useState([]);
  const [totalSessionsCount, setTotalSessionsCount] = useState(0);
  const [completedSessionsCount, setCompletedSessionsCount] = useState(0);
  const [cancelledSessionsCount, setCancelledSessionsCount] = useState(0);
  const [suddenClosuresCount, setSuddenClosuresCount] = useState(0);
  const [settings, setSettings] = useState({
    studyTimeHours: 0.5,
    breakTimeHours: 0.25,
  });
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!isAuthenticated || loading) return;

    const loadDashboardData = async () => {
      try {
        setDashboardLoading(true);
        
        const settingsData = await apiService.getParentSettings();
        setSettings({
          studyTimeHours: settingsData.study_time_hours,
          breakTimeHours: settingsData.break_time_hours,
        });

        const dashboardData = await apiService.getParentDashboard();
        
        setMeditationTime(dashboardData.meditation_time);
        setStudyTime(dashboardData.study_time);
        setPlayTime(dashboardData.play_time);
        setTotalSessionsCount(dashboardData.total_sessions);
        setCompletedSessionsCount(dashboardData.completed_sessions);
        setCancelledSessionsCount(dashboardData.cancelled_sessions);
        setSuddenClosuresCount(dashboardData.sudden_closures);
        setRecentSessions(dashboardData.recent_sessions);
        setSuddenClosures(dashboardData.sudden_closures_list);

        const [meditationSessions, focusSessions] = await Promise.all([
          apiService.getMeditationSessions(),
          apiService.getFocusSessions()
        ]);

        const meditationData = Array.isArray(meditationSessions) ? meditationSessions : (meditationSessions.results || []);
        const focusData = Array.isArray(focusSessions) ? focusSessions : (focusSessions.results || []);

        const allSessions = [
          ...meditationData.map(s => ({
            ...s,
            activity: "Meditation",
            duration: s.actual_duration,
            isSuddenClosure: false
          })),
          ...focusData.map(s => ({
            ...s,
            activity: s.is_sudden_closure ? "Focus Session (Sudden Closure)" : "Focus Session",
            duration: s.actual_study_time + s.actual_break_time,
            isSuddenClosure: s.is_sudden_closure,
            status: s.is_sudden_closure ? "sudden_closure" : s.status,
            completionPercentage: s.completion_percentage
          }))
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        setSessions(allSessions);
        
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setDashboardLoading(false);
      }
    };

    loadDashboardData();
  }, [isAuthenticated, loading]);

  const handleSaveSettings = async () => {
    if (settings.studyTimeHours === null || settings.studyTimeHours === undefined) {
      toast.error("Please enter a valid study time");
      return;
    }
    if (settings.breakTimeHours === null || settings.breakTimeHours === undefined) {
      toast.error("Please enter a valid break time");
      return;
    }

    const validatedSettings = {
      studyTimeHours: Math.max(0.016, Math.min(2, settings.studyTimeHours)),
      breakTimeHours: Math.max(0.016, Math.min(1, settings.breakTimeHours)),
    };

    if (validatedSettings.studyTimeHours < 0.016) {
      toast.error("Study time must be at least 1 minute");
      return;
    }
    if (validatedSettings.breakTimeHours < 0.016) {
      toast.error("Break time must be at least 1 minute");
      return;
    }

    try {
      await apiService.updateParentSettings({
        study_time_hours: validatedSettings.studyTimeHours,
        break_time_hours: validatedSettings.breakTimeHours,
      });
      
      setSettings(validatedSettings);
      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    }
  };

  const handleSettingsChange = (field, stringValue) => {
    let numValue;
    if (stringValue === "" || stringValue === null || stringValue === undefined) {
      numValue = null;
    } else {
      const minutes = parseFloat(stringValue);
      if (isNaN(minutes) || minutes < 0) {
        toast.error("Please enter a valid positive number");
        return;
      } else if (minutes === 0) {
        toast.error("Time must be greater than 0 minutes");
        return;
      } else if (field === 'studyTimeHours' && minutes > 120) {
        toast.error("Study time cannot exceed 120 minutes (2 hours)");
        return;
      } else if (field === 'breakTimeHours' && minutes > 60) {
        toast.error("Break time cannot exceed 60 minutes (1 hour)");
        return;
      } else {
        numValue = minutes / 60;
      }
    }

    setSettings(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading || dashboardLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Elegant Header - Sticky */}
      <header className="sticky top-0 z-50 bg-white px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <button
            onClick={() => navigate("/home")}
            className="w-11 h-11 rounded-full bg-gray-50 border-2 border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5.5 w-5.5 text-slate-800" />
          </button>
          
          <div className="flex-1 flex flex-col items-center">
            <h1 className="text-[13px] font-bold text-slate-800 tracking-[2.5px]">
              PARENT
            </h1>
            <div className="w-10 h-0.5 bg-amber-600 rounded mt-1" />
          </div>
          
          <div className="w-11" />
        </div>
      </header>

      {/* Premium Banner */}
      <div className="px-5 pt-5 pb-6">
        <div className="relative h-40 rounded-[20px] overflow-hidden shadow-xl max-w-5xl mx-auto">
          <img 
            src={logo} 
            alt="Banner" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-800 bg-opacity-75" />
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-5">
            <h2 className="text-xl font-light text-white mb-2 tracking-wide text-center">
              Track Your Child's Progress
            </h2>
            <div className="w-12 h-px bg-amber-600 mb-2" />
            <p className="text-xs text-white opacity-90 tracking-widest uppercase font-medium">
              Monitor activities and settings
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-5 pb-3">
        {/* Tab Buttons - Like Game Cards Style */}
        <div className="flex items-center mb-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[10px] font-bold text-gray-400 tracking-[1.5px] mx-3">
            SELECT VIEW
          </span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Tab Selection Cards - 3 Cards in Row */}
        <div className="grid grid-cols-3 gap-3.5 mb-4 max-w-5xl mx-auto">
          <div
            onClick={() => setActiveTab("overview")}
            className={`relative cursor-pointer bg-white rounded-[18px] border-2 shadow-md hover:shadow-xl transition-all duration-300 p-4 min-h-[100px] flex flex-col items-center justify-center ${
              activeTab === "overview" ? "border-slate-800 bg-slate-50" : "border-gray-100"
            }`}
          >
            <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center mb-2 shadow-sm ${
              activeTab === "overview" ? "bg-slate-800 border-slate-700" : "bg-gray-50 border-gray-200"
            }`}>
              <svg className={`w-6 h-6 ${activeTab === "overview" ? "text-white" : "text-slate-700"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className={`text-[13px] font-semibold text-center tracking-wide ${
              activeTab === "overview" ? "text-slate-800" : "text-slate-700"
            }`}>
              Overview
            </h3>
            {activeTab === "overview" && (
              <div className="absolute bottom-0 left-[30%] right-[30%] h-0.75 bg-amber-600 rounded-t-md" />
            )}
          </div>

          <div
            onClick={() => setActiveTab("settings")}
            className={`relative cursor-pointer bg-white rounded-[18px] border-2 shadow-md hover:shadow-xl transition-all duration-300 p-4 min-h-[100px] flex flex-col items-center justify-center ${
              activeTab === "settings" ? "border-slate-800 bg-slate-50" : "border-gray-100"
            }`}
          >
            <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center mb-2 shadow-sm ${
              activeTab === "settings" ? "bg-slate-800 border-slate-700" : "bg-gray-50 border-gray-200"
            }`}>
              <svg className={`w-6 h-6 ${activeTab === "settings" ? "text-white" : "text-slate-700"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className={`text-[13px] font-semibold text-center tracking-wide ${
              activeTab === "settings" ? "text-slate-800" : "text-slate-700"
            }`}>
              Settings
            </h3>
            {activeTab === "settings" && (
              <div className="absolute bottom-0 left-[30%] right-[30%] h-0.75 bg-amber-600 rounded-t-md" />
            )}
          </div>

          <div
            onClick={() => setActiveTab("reports")}
            className={`relative cursor-pointer bg-white rounded-[18px] border-2 shadow-md hover:shadow-xl transition-all duration-300 p-4 min-h-[100px] flex flex-col items-center justify-center ${
              activeTab === "reports" ? "border-slate-800 bg-slate-50" : "border-gray-100"
            }`}
          >
            <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center mb-2 shadow-sm ${
              activeTab === "reports" ? "bg-slate-800 border-slate-700" : "bg-gray-50 border-gray-200"
            }`}>
              <svg className={`w-6 h-6 ${activeTab === "reports" ? "text-white" : "text-slate-700"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className={`text-[13px] font-semibold text-center tracking-wide ${
              activeTab === "reports" ? "text-slate-800" : "text-slate-700"
            }`}>
              Reports
            </h3>
            {activeTab === "reports" && (
              <div className="absolute bottom-0 left-[30%] right-[30%] h-0.75 bg-amber-600 rounded-t-md" />
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="max-w-5xl mx-auto pb-20">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-3.5">
              {/* Stats Cards - 3 in Row */}
              <div className="grid sm:grid-cols-3 gap-3.5">
                <div className="bg-white rounded-[18px] border-2 border-gray-100 shadow-md p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-[#FFF9F0] border-2 border-[#F5E6D3] flex items-center justify-center shadow-sm">
                      <Brain className="h-7 w-7 text-[#C9A96E]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-medium tracking-wide mb-0.5">Meditation</p>
                      <p className="text-2xl font-semibold text-slate-800">{meditationTime}<span className="text-sm text-gray-500 ml-1">min</span></p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[18px] border-2 border-gray-100 shadow-md p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-[#F8F9FA] border-2 border-[#E8E8E8] flex items-center justify-center shadow-sm">
                      <BookOpen className="h-7 w-7 text-[#2C3E50]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-medium tracking-wide mb-0.5">Study Time</p>
                      <p className="text-2xl font-semibold text-slate-800">{studyTime}<span className="text-sm text-gray-500 ml-1">min</span></p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[18px] border-2 border-gray-100 shadow-md p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-[#F5F5F5] border-2 border-[#E0E0E0] flex items-center justify-center shadow-sm">
                      <Gamepad2 className="h-7 w-7 text-[#5D6D7E]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-medium tracking-wide mb-0.5">Play Time</p>
                      <p className="text-2xl font-semibold text-slate-800">{playTime}<span className="text-sm text-gray-500 ml-1">min</span></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sudden Closures Alert */}
              {suddenClosures.length > 0 && (
                <div className="bg-red-50 border-2 border-red-200 rounded-[18px] p-5 shadow-md">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">⚠️</div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-red-800 mb-1.5">
                        Sudden Session Closures ({suddenClosures.length})
                      </h3>
                      <p className="text-xs text-red-700 mb-3">
                        Your child closed sessions suddenly. They may need support.
                      </p>
                      <div className="space-y-2">
                        {suddenClosures.slice(0, 3).map((closure, index) => (
                          <div key={index} className="bg-white border border-red-200 rounded-[14px] p-3 text-xs">
                            <div className="flex justify-between">
                              <span className="text-red-800 font-medium">{closure.timeSpentMinutes} min</span>
                              <span className="text-red-600">{closure.currentMode === "study" ? "📚" : "🎮"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Session Status */}
              <div className="bg-white rounded-[18px] border-2 border-gray-100 shadow-md p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Session Status</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-4 rounded-[14px] bg-emerald-50 border border-emerald-200">
                    <p className="text-2xl font-bold text-emerald-700">{completedSessionsCount}</p>
                    <p className="text-[9px] text-emerald-600 font-medium tracking-wide mt-0.5">COMPLETED</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {totalSessionsCount > 0 ? Math.round((completedSessionsCount / totalSessionsCount) * 100) : 0}%
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-[14px] bg-orange-50 border border-orange-200">
                    <p className="text-2xl font-bold text-orange-700">{cancelledSessionsCount}</p>
                    <p className="text-[9px] text-orange-600 font-medium tracking-wide mt-0.5">STOPPED</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {totalSessionsCount > 0 ? Math.round((cancelledSessionsCount / totalSessionsCount) * 100) : 0}%
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-[14px] bg-red-50 border border-red-200">
                    <p className="text-2xl font-bold text-red-700">{suddenClosuresCount}</p>
                    <p className="text-[9px] text-red-600 font-medium tracking-wide mt-0.5">CLOSURES</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {totalSessionsCount > 0 ? Math.round((suddenClosuresCount / totalSessionsCount) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-[18px] border-2 border-gray-100 shadow-md p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Recent Activity</h3>
                {recentSessions.length > 0 ? (
                  <div className="space-y-2">
                    {recentSessions.slice(0, 5).map((session, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-[14px] border ${
                          session.isSuddenClosure 
                            ? "bg-red-50 border-red-200" 
                            : session.status === "cancelled"
                            ? "bg-orange-50 border-orange-200"
                            : "bg-emerald-50 border-emerald-200"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            session.isSuddenClosure ? "bg-red-500" : 
                            session.status === "cancelled" ? "bg-orange-500" : "bg-emerald-500"
                          }`} />
                          <div>
                            <p className={`text-xs font-medium ${
                              session.isSuddenClosure ? "text-red-800" : 
                              session.status === "cancelled" ? "text-orange-800" : "text-emerald-800"
                            }`}>
                              {session.activity}
                            </p>
                          </div>
                        </div>
                        <p className={`text-sm font-semibold ${
                          session.isSuddenClosure ? "text-red-700" : 
                          session.status === "cancelled" ? "text-orange-700" : "text-emerald-700"
                        }`}>
                          {session.duration} min
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4 text-xs">No activity yet</p>
                )}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-3.5">
              <div className="bg-white rounded-[18px] border-2 border-gray-100 shadow-md p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">Session Time Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-gray-600 mb-2 block">Study Time (minutes)</Label>
                    <Input
                      type="number"
                      step="5"
                      value={settings.studyTimeHours !== null ? Math.round(settings.studyTimeHours * 60) : ""}
                      onChange={(e) => handleSettingsChange('studyTimeHours', e.target.value)}
                      className="h-[54px] bg-gray-50 border-2 border-gray-200 rounded-[14px] text-slate-800 font-medium"
                      min="1"
                      max="120"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-gray-600 mb-2 block">Break Time (minutes)</Label>
                    <Input
                      type="number"
                      step="5"
                      value={settings.breakTimeHours !== null ? Math.round(settings.breakTimeHours * 60) : ""}
                      onChange={(e) => handleSettingsChange('breakTimeHours', e.target.value)}
                      className="h-[54px] bg-gray-50 border-2 border-gray-200 rounded-[14px] text-slate-800 font-medium"
                      min="1"
                      max="60"
                    />
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-[14px] p-4">
                    <p className="text-xs text-blue-800 font-medium mb-1">📚 Example</p>
                    <p className="text-xs text-blue-700">
                      {Math.round((settings.studyTimeHours || 0.5) * 60)} min study + {Math.round((settings.breakTimeHours || 0.25) * 60)} min break per cycle
                    </p>
                  </div>

                  <button
                    onClick={handleSaveSettings}
                    className="w-full h-16 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-2xl shadow-xl transition-all duration-300 text-[15px] tracking-wide border border-slate-700"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === "reports" && (
            <div className="space-y-3.5">
              {/* Summary Stats */}
              <div className="bg-white rounded-[18px] border-2 border-gray-100 shadow-md p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Activity Summary</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-4 rounded-[14px] bg-gray-50 border border-gray-200">
                    <p className="text-2xl font-bold text-slate-800">{totalSessionsCount}</p>
                    <p className="text-[9px] text-gray-600 font-medium tracking-wide mt-1">TOTAL</p>
                  </div>
                  <div className="text-center p-4 rounded-[14px] bg-gray-50 border border-gray-200">
                    <p className="text-2xl font-bold text-slate-800">{meditationTime + studyTime + playTime}</p>
                    <p className="text-[9px] text-gray-600 font-medium tracking-wide mt-1">MINUTES</p>
                  </div>
                  <div className="text-center p-4 rounded-[14px] bg-gray-50 border border-gray-200">
                    <p className="text-2xl font-bold text-slate-800">
                      {totalSessionsCount > 0 ? Math.round(sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / totalSessionsCount) : 0}
                    </p>
                    <p className="text-[9px] text-gray-600 font-medium tracking-wide mt-1">AVG</p>
                  </div>
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="bg-white rounded-[18px] border-2 border-gray-100 shadow-md p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Status Breakdown</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-[14px] bg-emerald-50 border border-emerald-200 text-center">
                    <p className="text-2xl font-bold text-emerald-700">{completedSessionsCount}</p>
                    <p className="text-[9px] text-emerald-600 font-medium mt-0.5 tracking-wide">COMPLETED</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {totalSessionsCount > 0 ? Math.round((completedSessionsCount / totalSessionsCount) * 100) : 0}%
                    </p>
                  </div>
                  <div className="p-4 rounded-[14px] bg-orange-50 border border-orange-200 text-center">
                    <p className="text-2xl font-bold text-orange-700">{cancelledSessionsCount}</p>
                    <p className="text-[9px] text-orange-600 font-medium mt-0.5 tracking-wide">STOPPED</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {totalSessionsCount > 0 ? Math.round((cancelledSessionsCount / totalSessionsCount) * 100) : 0}%
                    </p>
                  </div>
                  <div className="p-4 rounded-[14px] bg-red-50 border border-red-200 text-center">
                    <p className="text-2xl font-bold text-red-700">{suddenClosuresCount}</p>
                    <p className="text-[9px] text-red-600 font-medium mt-0.5 tracking-wide">CLOSURES</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {totalSessionsCount > 0 ? Math.round((suddenClosuresCount / totalSessionsCount) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Sudden Closures Detail or Success */}
              {suddenClosures.length > 0 ? (
                <div className="bg-red-50 border-2 border-red-200 rounded-[18px] p-5 shadow-md">
                  <h3 className="text-sm font-semibold text-red-800 mb-3">⚠️ Closure Details</h3>
                  <div className="space-y-2">
                    {suddenClosures.slice(0, 5).map((closure, index) => (
                      <div key={index} className="bg-white border border-red-200 rounded-[14px] p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-xs font-medium text-red-800">Session #{suddenClosures.length - index}</p>
                            <p className="text-xs text-red-600">{formatDate(closure.timestamp)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-red-700">{closure.timeSpentMinutes} min</p>
                            <p className="text-xs text-red-600">{closure.currentMode === "study" ? "📚" : "🎮"}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-[18px] p-6 text-center shadow-md">
                  <div className="text-3xl mb-2">✅</div>
                  <h3 className="text-sm font-semibold text-emerald-800 mb-1">No Sudden Closures</h3>
                  <p className="text-xs text-emerald-600">Your child completes sessions properly!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Parent;