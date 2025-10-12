import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Brain, BookOpen, Gamepad2, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/attenwell-logo.jpg";

const Home = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, loading, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const navButtons = [
    { 
      text: "Meditation", 
      icon: Brain, 
      route: "/meditation",
      iconName: "leaf",
      bgColor: "bg-[#FFF9F0]",
      borderColor: "border-[#F5E6D3]",
      iconColor: "text-[#C9A96E]"
    },
    { 
      text: "Focus", 
      icon: BookOpen, 
      route: "/focus",
      iconName: "eye",
      bgColor: "bg-[#F8F9FA]",
      borderColor: "border-[#E8E8E8]",
      iconColor: "text-[#2C3E50]"
    },
    { 
      text: "Game", 
      icon: Gamepad2, 
      route: "/game",
      iconName: "game-controller",
      bgColor: "bg-[#F5F5F5]",
      borderColor: "border-[#E0E0E0]",
      iconColor: "text-[#5D6D7E]"
    },
    { 
      text: "Parent", 
      icon: User, 
      route: "/parent",
      iconName: "people",
      bgColor: "bg-[#FAFAFA]",
      borderColor: "border-[#ECECEC]",
      iconColor: "text-[#95A5A6]"
    },
  ];

  const getSubtext = (text) => {
    switch(text) {
      case "Meditation": return "Find inner peace";
      case "Focus": return "Improve concentration";
      case "Game": return "Fun learning";
      case "Parent": return "Family section";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Elegant Header */}
      <header className="bg-white px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <div className="w-14 h-14 rounded-full bg-gray-50 border-2 border-gray-200 p-0.75 shadow-md">
            <img 
              src={logo} 
              alt="AttenWell" 
              className="w-full h-full rounded-full object-contain"
            />
          </div>

          {/* Center Branding */}
          <div className="flex-1 flex flex-col items-center mx-3">
            <h1 className="text-sm font-bold text-slate-800 tracking-[2.5px] mb-1">
              ATTENWELL
            </h1>
            <div className="w-15 h-0.5 bg-amber-600 rounded mb-1.5" />
            <p className="text-[11px] text-gray-500 font-medium tracking-wide uppercase">
              Your Wellness Journey
            </p>
          </div>

          {/* Hamburger Menu */}
          <button className="w-11 h-11 rounded-full bg-gray-50 border-2 border-gray-200 flex flex-col items-center justify-center gap-0.5">
            <div className="w-4.5 h-0.5 bg-slate-800 rounded" />
            <div className="w-4.5 h-0.5 bg-slate-800 rounded" />
            <div className="w-4.5 h-0.5 bg-slate-800 rounded" />
          </button>
        </div>
      </header>

      {/* Premium Banner */}
      <div className="px-5 pt-5 pb-6">
        <div className="relative h-40 rounded-[20px] overflow-hidden shadow-xl">
          <img 
            src={logo} 
            alt="Banner" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-800 bg-opacity-75" />
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-5">
            <h2 className="text-xl font-light text-white mb-2 tracking-wide text-center">
              Welcome to Your Journey
            </h2>
            <div className="w-12 h-px bg-amber-600 mb-2" />
            <p className="text-xs text-white opacity-90 tracking-widest uppercase font-medium">
              Choose your path to wellness
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-5 pb-3">
        {/* Section Header */}
        <div className="flex items-center mb-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[10px] font-bold text-gray-400 tracking-[1.5px] mx-3">
            SELECT ACTIVITY
          </span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Button Grid - 2x2 */}
        <div className="grid grid-cols-2 gap-3.5 mb-4">
          {navButtons.map((button) => {
            const Icon = button.icon;
            return (
              <div
                key={button.text}
                onClick={() => navigate(button.route)}
                className="relative cursor-pointer bg-white rounded-[18px] border-2 border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] p-5"
              >
                {/* Icon Container */}
                <div className={`w-14 h-14 rounded-full ${button.bgColor} border-2 ${button.borderColor} flex items-center justify-center mb-3 shadow-sm mx-auto`}>
                  <Icon className={`h-7 w-7 ${button.iconColor}`} />
                </div>
                
                {/* Button Text */}
                <h3 className="text-[15px] font-semibold text-slate-800 mb-1 tracking-wide text-center">
                  {button.text}
                </h3>
                
                {/* Subtext */}
                <p className="text-[10px] text-gray-500 text-center tracking-wide font-medium">
                  {getSubtext(button.text)}
                </p>
                
                {/* Bottom Accent */}
                <div className="absolute bottom-0 left-[30%] right-[30%] h-0.75 bg-amber-600 rounded-t-md" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Elegant Logout Button */}
      <div className="px-5 pt-2 pb-5">
        <button
          onClick={handleLogout}
          className="w-full h-16 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 text-[15px] tracking-wide border border-slate-700 flex items-center justify-center gap-2"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Home;