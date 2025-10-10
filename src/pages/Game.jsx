import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Timer } from "lucide-react";
import { toast } from "sonner";

const Game = () => {
  const navigate = useNavigate();
  const [availableTime, setAvailableTime] = useState(0);

  useEffect(() => {
    const playTime = parseInt(localStorage.getItem("available_break_time") || "0");
    setAvailableTime(playTime);
  }, []);

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

  const handleGameClick = (gameName) => {
    if (availableTime <= 0) {
      toast.error("No play time available. Complete a focus session to earn play time!");
      return;
    }
    toast.info(`${gameName} - Coming Soon! 🚀`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/home")}
              className="rounded-full text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold text-blue-600">Focus Training Games</h1>
          </div>
        </div>

        {/* Available Time Banner */}
        <Card className="mb-6 bg-gradient-to-r from-teal-500 to-teal-600 border-0 shadow-lg">
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
                  className="bg-white/20 border-white/40 text-white hover:bg-white/30"
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
              className="cursor-pointer bg-white shadow-lg border border-gray-100 hover:shadow-xl transition-all hover:scale-105 rounded-xl"
              onClick={() => handleGameClick(game.name)}
            >
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <div className="text-5xl mb-3">{game.icon}</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{game.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{game.description}</p>
                  <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                    {game.type}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Skills Trained:</p>
                  <div className="flex flex-wrap gap-1">
                    {game.skills.map((skill, skillIndex) => (
                      <span 
                        key={skillIndex}
                        className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600"
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

