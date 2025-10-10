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
    screenLimit: 120,
    studyPlayRatio: "60:40",
  });

  useEffect(() => {
    // Load meditation sessions
    const meditationSessions = JSON.parse(localStorage.getItem("meditation_sessions") || "[]");
    const focusSessions = JSON.parse(localStorage.getItem("focus_sessions") || "[]");
    
    const todayStart = new Date().setHours(0, 0, 0, 0);
    
    // Calculate today's stats
    const todayMeditation = meditationSessions
      .filter((s) => new Date(s.timestamp).getTime() >= todayStart)
      .reduce((sum, s) => sum + s.duration, 0);
    
    const todayStudy = focusSessions
      .filter((s) => new Date(s.timestamp).getTime() >= todayStart)
      .reduce((sum, s) => sum + s.studyTime, 0);
    
    const todayPlay = focusSessions
      .filter((s) => new Date(s.timestamp).getTime() >= todayStart)
      .reduce((sum, s) => sum + s.playTime, 0);
    
    setMeditationTime(todayMeditation);
    setStudyTime(todayStudy);
    setPlayTime(todayPlay);
    
    // Combine all sessions
    const allSessions = [
      ...meditationSessions.map((s) => ({ ...s, activity: "Meditation" })),
      ...focusSessions.map((s) => ({ 
        ...s, 
        activity: "Focus Session",
        duration: s.studyTime + s.playTime 
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    setSessions(allSessions.slice(0, 10));
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem("parent_settings", JSON.stringify(settings));
    toast.success("Settings saved successfully!");
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
                <div className="space-y-2">
                  <Label htmlFor="screenLimit">Daily Screen Time Limit (minutes)</Label>
                  <Input
                    id="screenLimit"
                    type="number"
                    value={settings.screenLimit}
                    onChange={(e) => setSettings({ ...settings, screenLimit: parseInt(e.target.value) })}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ratio">Study/Play Time Ratio</Label>
                  <Select
                    value={settings.studyPlayRatio}
                    onValueChange={(value) => setSettings({ ...settings, studyPlayRatio: value })}
                  >
                    <SelectTrigger id="ratio" className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="70:30">70% Study / 30% Play</SelectItem>
                      <SelectItem value="60:40">60% Study / 40% Play</SelectItem>
                      <SelectItem value="50:50">50% Study / 50% Play</SelectItem>
                    </SelectContent>
                  </Select>
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

