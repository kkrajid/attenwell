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

const Parent = () => {
  const navigate = useNavigate();
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
    studyTimeHours: 0.5, // 30 minutes in hours
    breakTimeHours: 0.25, // 15 minutes in hours
  });

  useEffect(() => {
    // Load saved settings with validation
    const savedSettings = localStorage.getItem("parent_settings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        // Validate settings and set defaults if invalid
        setSettings({
          studyTimeHours: parsed.studyTimeHours !== null && parsed.studyTimeHours !== undefined 
            ? Math.max(0.016, Math.min(2, parsed.studyTimeHours)) 
            : 0.5, // 1 min to 2 hours, default 30 min
          breakTimeHours: parsed.breakTimeHours !== null && parsed.breakTimeHours !== undefined 
            ? Math.max(0.016, Math.min(1, parsed.breakTimeHours)) 
            : 0.25, // 1 min to 1 hour, default 15 min
        });
      } catch (error) {
        console.error("Error parsing parent settings:", error);
        // Use default settings
      }
    }

    // Load meditation sessions with error handling
    let meditationSessions = [];
    try {
      meditationSessions = JSON.parse(localStorage.getItem("meditation_sessions") || "[]");
    } catch (error) {
      console.error("Error parsing meditation sessions:", error);
    }

    // Load focus sessions with error handling
    let focusSessions = [];
    try {
      focusSessions = JSON.parse(localStorage.getItem("focus_sessions") || "[]");
    } catch (error) {
      console.error("Error parsing focus sessions:", error);
    }

    // Load sudden closures with error handling
    let suddenClosuresData = [];
    try {
      suddenClosuresData = JSON.parse(localStorage.getItem("sudden_closures") || "[]");
    } catch (error) {
      console.error("Error parsing sudden closures:", error);
    }
    
    const todayStart = new Date().setHours(0, 0, 0, 0);

    // Calculate today's stats with safe property access
    const todayMeditation = meditationSessions
      .filter((s) => {
        if (!s.timestamp) return false;
        try {
          return new Date(s.timestamp).getTime() >= todayStart;
        } catch (error) {
          console.error("Invalid timestamp in meditation session:", s);
          return false;
        }
      })
      .reduce((sum, s) => {
        const duration = s.actualDuration || s.duration || 0;
        return sum + (typeof duration === 'number' && !isNaN(duration) ? duration : 0);
      }, 0);

    const todayStudy = focusSessions
      .filter((s) => {
        if (!s.timestamp) return false;
        try {
          const isToday = new Date(s.timestamp).getTime() >= todayStart;
          const isCompleted = s.status === "completed";
          const notSuddenClosure = s.type !== "focus_sudden_closure";
          return isToday && isCompleted && notSuddenClosure;
        } catch (error) {
          console.error("Invalid timestamp in focus session:", s);
          return false;
        }
      })
      .reduce((sum, s) => {
        const studyTime = s.actualStudyTime || s.totalStudyTime || 0;
        return sum + (typeof studyTime === 'number' && !isNaN(studyTime) ? studyTime : 0);
      }, 0);

    const todayPlay = focusSessions
      .filter((s) => {
        if (!s.timestamp) return false;
        try {
          const isToday = new Date(s.timestamp).getTime() >= todayStart;
          const isCompleted = s.status === "completed";
          const notSuddenClosure = s.type !== "focus_sudden_closure";
          return isToday && isCompleted && notSuddenClosure;
        } catch (error) {
          console.error("Invalid timestamp in focus session:", s);
          return false;
        }
      })
      .reduce((sum, s) => {
        const breakTime = s.actualBreakTime || s.totalBreakTime || 0;
        return sum + (typeof breakTime === 'number' && !isNaN(breakTime) ? breakTime : 0);
      }, 0);
    
    setMeditationTime(Math.round(todayMeditation));
    setStudyTime(Math.round(todayStudy));
    setPlayTime(Math.round(todayPlay));

    // Combine ALL sessions (not just recent 10)
    const allSessions = [
      ...meditationSessions
        .filter(s => s.timestamp)
        .map((s) => ({
          ...s,
          activity: "Meditation",
          duration: typeof s.actualDuration === 'number' ? s.actualDuration : (s.duration || 0),
          isSuddenClosure: false
        })),
      ...focusSessions
        .filter(s => s.timestamp)
        .map((s) => {
          const actualStudy = typeof s.actualStudyTime === 'number' ? s.actualStudyTime : (s.totalStudyTime || 0);
          const actualBreak = typeof s.actualBreakTime === 'number' ? s.actualBreakTime : (s.totalBreakTime || 0);
          return {
            ...s,
            activity: s.type === "focus_sudden_closure" ? "Focus Session (Sudden Closure)" : "Focus Session",
            duration: actualStudy + actualBreak,
            isSuddenClosure: s.type === "focus_sudden_closure",
            status: s.status || "completed",
            completionPercentage: typeof s.completionPercentage === 'number' ? s.completionPercentage : 100
          };
        })
    ]
    .filter(s => {
      try {
        // Validate timestamp and duration
        return s.timestamp && !isNaN(new Date(s.timestamp).getTime()) && typeof s.duration === 'number';
      } catch (error) {
        console.error("Invalid session data:", s);
        return false;
      }
    })
    .sort((a, b) => {
      try {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } catch (error) {
        return 0;
      }
    });

    // Calculate session counts from ALL sessions
    const completedCount = allSessions.filter(s => s.status === "completed" && !s.isSuddenClosure).length;
    const cancelledCount = allSessions.filter(s => s.status === "cancelled" && !s.isSuddenClosure).length;
    const suddenClosureCount = allSessions.filter(s => s.isSuddenClosure).length;

    setTotalSessionsCount(allSessions.length);
    setCompletedSessionsCount(completedCount);
    setCancelledSessionsCount(cancelledCount);
    setSuddenClosuresCount(suddenClosureCount);

    // Store all sessions and recent 10 separately
    setSessions(allSessions);
    setRecentSessions(allSessions.slice(0, 10));
    setSuddenClosures(suddenClosuresData);
  }, []);

  const handleSaveSettings = () => {
    // Validate settings before saving
    if (settings.studyTimeHours === null || settings.studyTimeHours === undefined) {
      toast.error("Please enter a valid study time");
      return;
    }
    if (settings.breakTimeHours === null || settings.breakTimeHours === undefined) {
      toast.error("Please enter a valid break time");
      return;
    }

    const validatedSettings = {
      studyTimeHours: Math.max(0.016, Math.min(2, settings.studyTimeHours)), // 1 min to 2 hours
      breakTimeHours: Math.max(0.016, Math.min(1, settings.breakTimeHours)), // 1 min to 1 hour
    };

    // Additional validation: ensure values are reasonable
    if (validatedSettings.studyTimeHours < 0.016) {
      toast.error("Study time must be at least 1 minute");
      return;
    }
    if (validatedSettings.breakTimeHours < 0.016) {
      toast.error("Break time must be at least 1 minute");
      return;
    }

    setSettings(validatedSettings);
    localStorage.setItem("parent_settings", JSON.stringify(validatedSettings));
    toast.success("Settings saved successfully!");
  };

  const handleSettingsChange = (field, stringValue) => {
    let numValue;
    if (stringValue === "" || stringValue === null || stringValue === undefined) {
      numValue = null; // Allow empty input
    } else {
      const minutes = parseFloat(stringValue);
      if (isNaN(minutes) || minutes < 0) {
        toast.error("Please enter a valid positive number");
        return; // Don't update state with invalid values
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
        numValue = minutes / 60; // Convert minutes to hours for storage
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/home")}
            className="rounded-full text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold text-blue-600">Parent Dashboard</h1>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid sm:grid-cols-3 gap-4">
              <Card className="shadow-[var(--shadow-soft)] animate-scale-in">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-meditation/20">
                      <Brain className="h-6 w-6 text-meditation" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Today's Meditation</p>
                      <p className="text-2xl font-headings">{meditationTime} min</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-[var(--shadow-soft)] animate-scale-in" style={{ animationDelay: "100ms" }}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-focus-study/20">
                      <BookOpen className="h-6 w-6 text-focus-study" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Study Time (Completed)</p>
                      <p className="text-2xl font-headings">{studyTime} min</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-[var(--shadow-soft)] animate-scale-in" style={{ animationDelay: "200ms" }}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-focus-play/20">
                      <Gamepad2 className="h-6 w-6 text-focus-play" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Play Time (Completed)</p>
                      <p className="text-2xl font-headings">{playTime} min</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sudden Closures Alert */}
            {suddenClosures.length > 0 && (
              <Card className="shadow-[var(--shadow-soft)] border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-red-100">
                      <span className="text-2xl">⚠️</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-red-800 mb-2">
                        Sudden Session Closures Detected
                      </h3>
                      <p className="text-sm text-red-700 mb-3">
                        Your child has closed {suddenClosures.length} session{suddenClosures.length > 1 ? 's' : ''} suddenly. 
                        This may indicate they need support or are having difficulty with the session.
                      </p>
                      <div className="space-y-2">
                        {suddenClosures.slice(0, 3).map((closure, index) => (
                          <div key={index} className="bg-white border border-red-200 rounded-lg p-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-sm font-medium text-red-800">
                                  Session closed after {closure.timeSpentMinutes} minutes
                                </p>
                                <p className="text-xs text-red-600">
                                  {formatDate(closure.timestamp)} • Phase {closure.currentPhaseIndex + 1} of {closure.totalPhases}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-red-700">
                                  {closure.currentMode === "study" ? "📚 Study" : "🎮 Break"}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {suddenClosures.length > 3 && (
                          <p className="text-xs text-red-600">
                            +{suddenClosures.length - 3} more sudden closure{suddenClosures.length - 3 > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Session Completion Summary */}
            <Card className="shadow-[var(--shadow-soft)]">
              <CardHeader>
                <CardTitle>Session Completion Summary</CardTitle>
                <CardDescription>Overview of session completion rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
                    <p className="text-2xl font-bold text-green-700 mb-1">
                      {completedSessionsCount}
                    </p>
                    <p className="text-sm text-green-600">Completed Sessions</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-orange-50 border border-orange-200">
                    <p className="text-2xl font-bold text-orange-700 mb-1">
                      {cancelledSessionsCount}
                    </p>
                    <p className="text-sm text-orange-600">Stopped Early</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-2xl font-bold text-red-700 mb-1">
                      {suddenClosuresCount}
                    </p>
                    <p className="text-sm text-red-600">Sudden Closures</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="shadow-[var(--shadow-soft)]">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest 10 sessions and progress</CardDescription>
              </CardHeader>
              <CardContent>
                {recentSessions.length > 0 ? (
                  <div className="space-y-3">
                    {recentSessions.map((session, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          session.isSuddenClosure 
                            ? "bg-red-50 border border-red-200" 
                            : session.status === "cancelled"
                            ? "bg-orange-50 border border-orange-200"
                            : "bg-green-50 border border-green-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            session.isSuddenClosure 
                              ? "bg-red-500" 
                              : session.status === "cancelled"
                              ? "bg-orange-500"
                              : "bg-green-500"
                          }`} />
                          <div>
                            <p className={`font-medium ${
                              session.isSuddenClosure ? "text-red-800" : 
                              session.status === "cancelled" ? "text-orange-800" : "text-green-800"
                            }`}>
                              {session.activity}
                              {session.isSuddenClosure && " ⚠️"}
                              {session.status === "cancelled" && !session.isSuddenClosure && " ❌"}
                              {session.status === "completed" && !session.isSuddenClosure && " ✅"}
                            </p>
                            <p className={`text-sm ${
                              session.isSuddenClosure ? "text-red-600" : 
                              session.status === "cancelled" ? "text-orange-600" : "text-green-600"
                            }`}>
                              {formatDate(session.timestamp)}
                              {session.completionPercentage && session.status === "cancelled" && (
                                <span className="ml-2">• {session.completionPercentage}% complete</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${
                            session.isSuddenClosure ? "text-red-700" : 
                            session.status === "cancelled" ? "text-orange-700" : "text-green-700"
                          }`}>
                            {session.duration} min
                          </p>
                          <p className={`text-xs ${
                            session.isSuddenClosure ? "text-red-600" : 
                            session.status === "cancelled" ? "text-orange-600" : "text-green-600"
                          }`}>
                            {session.isSuddenClosure ? "Sudden closure" : 
                             session.status === "cancelled" ? "Stopped early" : "Completed"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No activity yet. Start a session to see data here!
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="shadow-[var(--shadow-soft)]">
              <CardHeader>
                <CardTitle>Parental Settings</CardTitle>
                <CardDescription>Customize your child's experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studyTimeMinutes">Study Time (minutes)</Label>
                    <Input
                      id="studyTimeMinutes"
                      type="number"
                      step="5"
                      value={settings.studyTimeHours !== null ? Math.round(settings.studyTimeHours * 60) : ""}
                      onChange={(e) => handleSettingsChange('studyTimeHours', e.target.value)}
                      className="h-12"
                      min="1"
                      max="120"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="breakTimeMinutes">Break Time (minutes)</Label>
                    <Input
                      id="breakTimeMinutes"
                      type="number"
                      step="5"
                      value={settings.breakTimeHours !== null ? Math.round(settings.breakTimeHours * 60) : ""}
                      onChange={(e) => handleSettingsChange('breakTimeHours', e.target.value)}
                      className="h-12"
                      min="1"
                      max="60"
                    />
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">📚 Focus Session Example:</h4>
                  <p className="text-sm text-blue-700">
                    If your child enters 60 minutes total, they will have:
                  </p>
                  <div className="mt-2 text-sm text-blue-600">
                    <p>• Multiple cycles of {Math.round((settings.studyTimeHours || 0.5) * 60)} minutes study + {Math.round((settings.breakTimeHours || 0.25) * 60)} minutes break</p>
                    <p>• Each cycle: {Math.round(((settings.studyTimeHours || 0.5) + (settings.breakTimeHours || 0.25)) * 60)} minutes</p>
                    <p>• Total cycles: {Math.floor(60 / Math.round(((settings.studyTimeHours || 0.5) + (settings.breakTimeHours || 0.25)) * 60))} complete cycles</p>
                  </div>
                </div>

                <Button onClick={handleSaveSettings} variant="parent" size="lg" className="w-full">
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            {/* Activity Summary */}
            <Card className="shadow-[var(--shadow-soft)]">
              <CardHeader>
                <CardTitle>Activity Summary</CardTitle>
                <CardDescription>Overview of all activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-4 mb-6">
                  <div className="p-6 rounded-lg bg-muted/50">
                    <p className="text-3xl font-headings mb-2">{totalSessionsCount}</p>
                    <p className="text-sm text-muted-foreground">Total Sessions (All Time)</p>
                  </div>
                  <div className="p-6 rounded-lg bg-muted/50">
                    <p className="text-3xl font-headings mb-2">{meditationTime + studyTime + playTime}</p>
                    <p className="text-sm text-muted-foreground">Total Minutes Today (Completed Only)</p>
                  </div>
                  <div className="p-6 rounded-lg bg-muted/50">
                    <p className="text-3xl font-headings mb-2">
                      {totalSessionsCount > 0 ? Math.round(sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / totalSessionsCount) : 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Avg Session Length (All Time)</p>
                  </div>
                </div>

                {/* Session Status Breakdown */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Session Status Breakdown:</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                      <p className="text-2xl font-bold text-green-700">{completedSessionsCount}</p>
                      <p className="text-xs text-green-600">Completed</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {totalSessionsCount > 0 ? Math.round((completedSessionsCount / totalSessionsCount) * 100) : 0}%
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                      <p className="text-2xl font-bold text-orange-700">{cancelledSessionsCount}</p>
                      <p className="text-xs text-orange-600">Stopped Early</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {totalSessionsCount > 0 ? Math.round((cancelledSessionsCount / totalSessionsCount) * 100) : 0}%
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-2xl font-bold text-red-700">{suddenClosuresCount}</p>
                      <p className="text-xs text-red-600">Sudden Closures</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {totalSessionsCount > 0 ? Math.round((suddenClosuresCount / totalSessionsCount) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sudden Closures Report */}
            {suddenClosures.length > 0 && (
              <Card className="shadow-[var(--shadow-soft)] border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-800">⚠️ Sudden Session Closures Report</CardTitle>
                  <CardDescription>Detailed analysis of interrupted sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4 mb-6">
                      <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                        <p className="text-2xl font-bold text-red-800 mb-1">{suddenClosures.length}</p>
                        <p className="text-sm text-red-600">Total Sudden Closures</p>
                      </div>
                      <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                        <p className="text-2xl font-bold text-red-800 mb-1">
                          {suddenClosures.length > 0 ? Math.round(suddenClosures.reduce((sum, c) => sum + (c.timeSpentMinutes || 0), 0) / suddenClosures.length) : 0}
                        </p>
                        <p className="text-sm text-red-600">Avg Time Before Closure</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold text-red-800 mb-3">Recent Sudden Closures:</h4>
                      {suddenClosures.slice(0, 5).map((closure, index) => (
                        <div key={index} className="bg-white border border-red-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium text-red-800">
                                Session #{suddenClosures.length - index}
                              </p>
                              <p className="text-sm text-red-600">
                                {formatDate(closure.timestamp)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-red-700">
                                {closure.timeSpentMinutes} min
                              </p>
                              <p className="text-xs text-red-600">
                                {closure.currentMode === "study" ? "📚 Study Phase" : "🎮 Break Phase"}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Phase Progress:</p>
                              <p className="font-medium">Phase {closure.currentPhaseIndex + 1} of {closure.totalPhases}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Time Breakdown:</p>
                              <p className="font-medium">
                                Study: {closure.actualStudyTime || 0}min, Break: {closure.actualBreakTime || 0}min
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {suddenClosures.length > 5 && (
                        <p className="text-sm text-red-600 text-center">
                          +{suddenClosures.length - 5} more sudden closures
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Sudden Closures Message */}
            {suddenClosures.length === 0 && (
              <Card className="shadow-[var(--shadow-soft)] border-green-200 bg-green-50">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">✅</div>
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    No Sudden Closures Detected
                  </h3>
                  <p className="text-green-600">
                    Great! Your child is completing their sessions properly without sudden interruptions.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Parent;

