import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Timer, Headphones, Layers, Circle, Puzzle, Target, Eye } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import apiService from "@/services/api";
import logo from "@/assets/attenwell-logo.jpg";

const Game = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const [availableTime, setAvailableTime] = useState(0);
  const [loadingTime, setLoadingTime] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);

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
      id: 1,
      title: "Noise Ninjas",
      icon: Headphones,
      iconName: "headset",
      goal: "Train selective auditory attention and help children filter distractions.",
      howToPlay: "Listen to an environment full of sounds. Tap only when the target 'signal sound' (e.g., a bird chirp or bell) is heard. Ignore background noises like chatter, alarms, or music.",
      skills: ["🎧 Selective listening", "🧠 Focus under noise", "🎯 Cognitive control"],
      color: "#C9A96E"
    },
    {
      id: 2,
      title: "Memory Match Game",
      icon: Layers,
      iconName: "layers",
      goal: "Strengthen short-term memory and cognitive flexibility.",
      howToPlay: "Flip over one card at a time to find matching pairs. Remember positions while avoiding distraction cards.",
      skills: ["🧠 Visual memory", "🔄 Focus switching", "📏 Attention span"],
      color: "#2C3E50"
    },
    {
      id: 3,
      title: "Track the Ball",
      icon: Circle,
      iconName: "basketball",
      goal: "Improve concentration, visual tracking, and sustained attention.",
      howToPlay: "The child is shown several identical balls on the screen. They are told to focus on one specific ball. The balls move around the screen randomly. After movement stops, the child points to the ball they were tracking.",
      skills: ["👀 Visual tracking", "🧠 Sustained attention", "🎯 Concentration accuracy"],
      color: "#5D6D7E"
    },
    {
      id: 4,
      title: "Simple Puzzle",
      icon: Puzzle,
      iconName: "extension-puzzle",
      goal: "Improve problem-solving and planning skills.",
      howToPlay: "Arrange pieces to complete a picture or fit shapes into slots.",
      skills: ["🧩 Problem-solving", "📏 Spatial reasoning", "🗂 Planning ability"],
      color: "#95A5A6"
    },
    {
      id: 5,
      title: "Catch the Right One",
      icon: Target,
      iconName: "radio-button-on",
      goal: "Enhance selective visual attention.",
      howToPlay: "Objects fall from the top of the screen. Tap everything except the forbidden object. Background movement adds challenge.",
      skills: ["🎯 Target discrimination", "👁 Visual focus", "❌ Inhibition"],
      color: "#D4AF37"
    },
    {
      id: 6,
      title: "Focus Builder",
      icon: Eye,
      iconName: "eye",
      goal: "Develop sustained attention and concentration skills.",
      howToPlay: "Focus on a specific object while ignoring distractions. The object changes color and you must tap when it turns green. Distractions appear around it.",
      skills: ["🔍 Sustained attention", "🎯 Focus control", "🧠 Concentration"],
      color: "#7F8C8D"
    }
  ];

  const handleGameClick = (game) => {
    if (availableTime <= 0) {
      toast.error("No play time available. Complete a focus session to earn play time!");
      return;
    }
    setSelectedGame(game);
  };

  const handlePlayGame = () => {
    toast.info(`${selectedGame.title} - Coming Soon! 🚀`);
  };

  const handleBackToGames = () => {
    setSelectedGame(null);
  };

  if (loading || loadingTime) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading games...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Game Details View
  if (selectedGame) {
    const GameIcon = selectedGame.icon;
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Elegant Header - Sticky */}
        <header className="sticky top-0 z-50 bg-white px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <button
              onClick={handleBackToGames}
              className="w-11 h-11 rounded-full bg-gray-50 border-2 border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5.5 w-5.5 text-slate-800" />
            </button>
            
            <div className="flex-1 flex flex-col items-center">
              <h1 className="text-[13px] font-bold text-slate-800 tracking-[2.5px]">
                GAME DETAILS
              </h1>
              <div className="w-10 h-0.5 bg-amber-600 rounded mt-1" />
            </div>
            
            <div className="w-11" />
          </div>
        </header>

        {/* Game Details Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-5 py-5 pb-20">
            {/* Game Header */}
            <div className="bg-white rounded-[20px] p-6 flex flex-col items-center mb-5 shadow-md border-2 border-gray-100">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center mb-4 border-3 shadow-md"
                style={{ 
                  backgroundColor: selectedGame.color + '15',
                  borderColor: selectedGame.color + '30'
                }}
              >
                <GameIcon className="h-10 w-10" style={{ color: selectedGame.color }} />
              </div>
              <h2 className="text-[22px] font-light text-slate-800 text-center tracking-wide mb-2">
                {selectedGame.title}
              </h2>
              <div className="w-15 h-0.5 bg-amber-600 rounded" />
            </div>

            {/* Goal Section */}
            <div className="mb-4.5">
              <div className="flex items-center mb-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mr-2.5" />
                <h3 className="text-[11px] font-bold text-gray-400 tracking-[1.5px]">
                  GOAL
                </h3>
              </div>
              <div className="bg-gray-50 rounded-[14px] p-4 border border-gray-100">
                <p className="text-sm text-gray-600 leading-5.5 tracking-wide">
                  {selectedGame.goal}
                </p>
              </div>
            </div>

            {/* How to Play Section */}
            <div className="mb-4.5">
              <div className="flex items-center mb-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mr-2.5" />
                <h3 className="text-[11px] font-bold text-gray-400 tracking-[1.5px]">
                  HOW TO PLAY
                </h3>
              </div>
              <div className="bg-gray-50 rounded-[14px] p-4 border border-gray-100">
                <p className="text-sm text-gray-600 leading-5.5 tracking-wide">
                  {selectedGame.howToPlay}
                </p>
              </div>
            </div>

            {/* Skills Trained Section */}
            <div className="mb-4.5">
              <div className="flex items-center mb-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mr-2.5" />
                <h3 className="text-[11px] font-bold text-gray-400 tracking-[1.5px]">
                  SKILLS TRAINED
                </h3>
              </div>
              <div className="bg-white rounded-[14px] p-1 border-2 border-gray-100">
                {selectedGame.skills.map((skill, index) => (
                  <div 
                    key={index}
                    className="flex items-center bg-gray-50 p-3 rounded-[10px] mb-0.5 last:mb-0 border border-gray-50"
                  >
                    <div className="w-1 h-1 rounded-full bg-amber-600 mr-2.5" />
                    <span className="text-[13px] text-slate-800 font-medium tracking-wide flex-1">
                      {skill}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Play Button */}
            <button
              onClick={handlePlayGame}
              className="w-full h-16 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 text-[15px] tracking-wide border border-slate-700 flex items-center justify-center gap-2 mt-2"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M10 8l6 4-6 4V8z"/>
              </svg>
              Start Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Games List View
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Elegant Header - Sticky */}
      <header className="sticky top-0 z-50 bg-white px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button
            onClick={() => navigate("/home")}
            className="w-11 h-11 rounded-full bg-gray-50 border-2 border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5.5 w-5.5 text-slate-800" />
          </button>
          
          <div className="flex-1 flex flex-col items-center">
            <h1 className="text-[13px] font-bold text-slate-800 tracking-[2.5px]">
              GAMES
            </h1>
            <div className="w-10 h-0.5 bg-amber-600 rounded mt-1" />
          </div>
          
          <div className="w-11" />
        </div>
      </header>

      {/* Premium Banner */}
      <div className="px-5 pt-5 pb-5">
        <div className="relative h-[140px] rounded-[20px] overflow-hidden shadow-xl max-w-4xl mx-auto">
          <img 
            src={logo} 
            alt="Banner" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-800 bg-opacity-75" />
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
            <h2 className="text-lg font-light text-white mb-1.5 tracking-wide text-center">
              Educational Games
            </h2>
            <div className="w-10 h-px bg-amber-600 mb-1.5" />
            <p className="text-[11px] text-white opacity-90 tracking-widest uppercase font-medium">
              Fun learning activities for focus
            </p>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-5 pb-20">
          {/* Section Header */}
          <div className="flex items-center mb-5 mt-1">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[10px] font-bold text-gray-400 tracking-[1.5px] mx-3">
              SELECT GAME
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Games Grid */}
          <div className="grid grid-cols-2 gap-3.5">
            {games.map((game) => {
              const GameIcon = game.icon;
              return (
                <div
                  key={game.id}
                  onClick={() => handleGameClick(game)}
                  className="relative cursor-pointer bg-white rounded-[18px] border-2 border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] p-4.5 min-h-[140px] flex flex-col items-center justify-center"
                >
                  {/* Icon Container */}
                  <div 
                    className="w-14 h-14 rounded-full flex items-center justify-center mb-3 border-2 shadow-sm"
                    style={{ 
                      backgroundColor: game.color + '15',
                      borderColor: game.color + '30'
                    }}
                  >
                    <GameIcon className="h-7 w-7" style={{ color: game.color }} />
                  </div>
                  
                  {/* Game Title */}
                  <h3 className="text-[13px] font-semibold text-slate-800 text-center tracking-wide">
                    {game.title}
                  </h3>
                  
                  {/* Bottom Accent */}
                  <div 
                    className="absolute bottom-0 left-[30%] right-[30%] h-0.75 rounded-t-md"
                    style={{ backgroundColor: game.color }}
                  />
                </div>
              );
            })}
          </div>

          {/* No Time Available Message */}
          {availableTime <= 0 && (
            <div className="mt-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[18px] p-5 text-center">
              <p className="text-sm text-gray-600">
                💡 Complete a focus session to unlock focus training games and earn play time!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Game;