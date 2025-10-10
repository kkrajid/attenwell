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
    
    const todayStart = new Date().setHours(0, 0, 0, 0);
    
    // Calculate today's stats with safe property access
    const todayMeditation = meditationSessions
      .filter((s) => s.timestamp && new Date(s.timestamp).getTime() >= todayStart)
      .reduce((sum, s) => {
        const duration = s.actualDuration || s.duration || 0;
        return sum + (typeof duration === 'number' ? duration : 0);
      }, 0);
    
    const todayStudy = focusSessions
      .filter((s) => s.timestamp && new Date(s.timestamp).getTime() >= todayStart)
      .reduce((sum, s) => {
        const studyTime = s.actualStudyTime || s.totalStudyTime || 0;
        return sum + (typeof studyTime === 'number' ? studyTime : 0);
      }, 0);
    
    const todayPlay = focusSessions
      .filter((s) => s.timestamp && new Date(s.timestamp).getTime() >= todayStart)
      .reduce((sum, s) => {
        const breakTime = s.actualBreakTime || s.totalBreakTime || 0;
        return sum + (typeof breakTime === 'number' ? breakTime : 0);
      }, 0);
    
    setMeditationTime(Math.round(todayMeditation));
    setStudyTime(Math.round(todayStudy));
    setPlayTime(Math.round(todayPlay));
    
    // Combine all sessions with proper data structure
    const allSessions = [
      ...meditationSessions
        .filter(s => s.timestamp)
        .map((s) => ({ 
          ...s, 
          activity: "Meditation",
          duration: s.actualDuration || s.duration || 0
        })),
      ...focusSessions
        .filter(s => s.timestamp)
        .map((s) => ({ 
          ...s, 
          activity: "Focus Session",
          duration: (s.actualStudyTime || s.totalStudyTime || 0) + (s.actualBreakTime || s.totalBreakTime || 0)
        }))
    ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);
    
    setSessions(allSessions);
  }, []);

  const handleSaveSettings = () => {
    // Validate settings before saving
    const validatedSettings = {
      studyTimeHours: settings.studyTimeHours !== null && settings.studyTimeHours !== undefined 
        ? Math.max(0.016, Math.min(2, settings.studyTimeHours)) 
        : 0.5,
      breakTimeHours: settings.breakTimeHours !== null && settings.breakTimeHours !== undefined 
        ? Math.max(0.016, Math.min(1, settings.breakTimeHours)) 
        : 0.25,
    };
    
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
      if (isNaN(minutes)) {
        numValue = 0; // Fallback for invalid non-empty input
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
                      <p className="text-sm text-muted-foreground">Study Time</p>
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
                      <p className="text-sm text-muted-foreground">Play Time</p>
                      <p className="text-2xl font-headings">{playTime} min</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="shadow-[var(--shadow-soft)]">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest sessions and progress</CardDescription>
              </CardHeader>
              <CardContent>
                {sessions.length > 0 ? (
                  <div className="space-y-3">
                    {sessions.map((session, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div>
                          <p className="font-medium">{session.activity}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(session.timestamp)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{session.duration} min</p>
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
          <TabsContent value="reports">
            <Card className="shadow-[var(--shadow-soft)]">
              <CardHeader>
                <CardTitle>Activity Reports</CardTitle>
                <CardDescription>View detailed activity history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    Detailed reports and analytics coming soon!
                  </p>
                  <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                    <div className="p-6 rounded-lg bg-muted/50">
                      <p className="text-3xl font-headings mb-2">{sessions.length}</p>
                      <p className="text-sm text-muted-foreground">Total Sessions</p>
                    </div>
                    <div className="p-6 rounded-lg bg-muted/50">
                      <p className="text-3xl font-headings mb-2">{meditationTime + studyTime + playTime}</p>
                      <p className="text-sm text-muted-foreground">Total Minutes Today</p>
                    </div>
                    <div className="p-6 rounded-lg bg-muted/50">
                      <p className="text-3xl font-headings mb-2">
                        {sessions.length > 0 ? Math.round((meditationTime + studyTime + playTime) / sessions.length) : 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Avg Session Length</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Parent;

