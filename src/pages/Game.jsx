import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Timer } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import apiService from "@/services/api";

const Game = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const [availableTime, setAvailableTime] = useState(0);
  const [loadingTime, setLoadingTime] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || loading) return;

    const loadBreakTime = async () => {
      try {
        const breakTimeData = await apiService.getAvailableBreakTime();
        setAvailableTime(breakTimeData.minutes_available);
      } catch (error) {
        console.error("Error loading break time:", error);
        toast.error("Failed to load break time");
      } finally {
        setLoadingTime(false);
      }
    };

    loadBreakTime();
  }, [isAuthenticated, loading]);

  // Authentication check
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, loading, navigate]);

  const games = [
    { 
      name: "Noise Ninjas", 
      icon: "🎮", 
      type: "auditory attention", 
      color: "focus-study",
      description: "Train selective auditory attention and filter distractions",
      skills: ["🎧 Selective listening", "🧠 Focus under noise", "🎯 Cognitive control"]
    },
    { 
      name: "Memory Match Game", 
      icon: "🃏", 
      type: "memory training", 
      color: "game",
      description: "Strengthen short-term memory and cognitive flexibility",
      skills: ["🧠 Visual memory", "🔄 Focus switching", "📏 Attention span"]
    },
    { 
      name: "Track the Ball", 
      icon: "⚽", 
      type: "visual tracking", 
      color: "secondary",
      description: "Improve concentration, visual tracking, and sustained attention",
      skills: ["👀 Visual tracking", "🧠 Sustained attention", "🎯 Concentration accuracy"]
    },
    { 
      name: "Simple Puzzle", 
      icon: "🧩", 
      type: "problem solving", 
      color: "meditation",
      description: "Improve problem-solving and planning skills",
      skills: ["🧩 Problem-solving", "📏 Spatial reasoning", "🗂 Planning ability"]
    },
    { 
      name: "Catch the Right One", 
      icon: "🎯", 
      type: "selective attention", 
      color: "primary",
      description: "Enhance selective visual attention",
      skills: ["🎯 Target discrimination", "👁 Visual focus", "❌ Inhibition"]
    },
  ];

  const handleGameClick = async (gameName, gameType, skills) => {
    if (availableTime <= 0) {
      toast.error("No play time available. Complete a focus session to earn play time!");
      return;
    }

    // For now, just show coming soon, but in the future this would create a game session
    toast.info(`${gameName} - Coming Soon! 🚀`);
    
    // Future implementation:
    // try {
    //   await apiService.createGameSession({
    //     game_name: gameName,
    //     game_type: gameType,
    //     duration: 15, // Default 15 minutes
    //     skills_trained: skills,
    //     status: "completed"
    //   });
    //   toast.success("Game session started!");
    // } catch (error) {
    //   toast.error("Failed to start game session");
    // }
  };

  if (loading || loadingTime) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading games...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/home")}
              className="rounded-full text-slate-600 hover:text-slate-800 hover:bg-slate-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">Focus Training Games</h1>
          </div>
        </div>

        {/* Available Time Banner */}
        <Card className="mb-6 bg-gradient-to-r from-emerald-500 to-emerald-600 border-0 shadow-xl rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <Timer className="h-8 w-8" />
                <div>
                  <p className="text-sm opacity-90">Play Time Remaining</p>
                  <p className="text-3xl font-bold">{availableTime} minutes</p>
                </div>
              </div>
              {availableTime <= 0 && (
                <Button
                  variant="outline"
                  onClick={() => navigate("/focus")}
                  className="bg-white/20 border-white/40 text-white hover:bg-white/30 rounded-xl"
                >
                  Earn More Time
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game, index) => (
            <Card
              key={game.name}
              className="cursor-pointer bg-white shadow-xl border border-slate-200 hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-2xl backdrop-blur-sm"
              onClick={() => handleGameClick(game.name, game.type, game.skills)}
            >
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <div className="text-5xl mb-3">{game.icon}</div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{game.name}</h3>
                  <p className="text-sm text-slate-600 mb-3">{game.description}</p>
                  <span className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-700 font-medium shadow-sm">
                    {game.type}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-700 mb-2">Skills Trained:</p>
                  <div className="flex flex-wrap gap-1">
                    {game.skills.map((skill, skillIndex) => (
                      <span 
                        key={skillIndex}
                        className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 text-slate-600 shadow-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {availableTime <= 0 && (
          <Card className="mt-6 bg-gray-50 border-dashed border-gray-200">
            <CardContent className="p-6 text-center">
              <p className="text-gray-600">
                💡 Complete a focus session to unlock focus training games and earn play time!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Game;

