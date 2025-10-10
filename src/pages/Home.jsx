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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const navButtons = [
    { text: "Meditation", icon: Brain, route: "/meditation", bgColor: "bg-gradient-to-br from-violet-500 to-violet-600", textColor: "text-white", shadowColor: "shadow-violet-200" },
    { text: "Focus", icon: BookOpen, route: "/focus", bgColor: "bg-gradient-to-br from-amber-500 to-amber-600", textColor: "text-white", shadowColor: "shadow-amber-200" },
    { text: "Games", icon: Gamepad2, route: "/game", bgColor: "bg-gradient-to-br from-emerald-500 to-emerald-600", textColor: "text-white", shadowColor: "shadow-emerald-200" },
    { text: "Parent", icon: User, route: "/parent", bgColor: "bg-gradient-to-br from-slate-600 to-slate-700", textColor: "text-white", shadowColor: "shadow-slate-200" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center border-2 border-amber-300 shadow-xl">
              <img src={logo} alt="AttenWell" className="w-8 h-8 rounded-full" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">AttenWell</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center border-2 border-slate-300 shadow-md">
              <span className="text-slate-700 font-semibold text-sm">
                {user.parent_name?.charAt(0) || "P"}
              </span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-700">{user.parent_name}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-full">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

        {/* Profile Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Card className="bg-white shadow-xl border border-slate-200 rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center border-2 border-slate-300 shadow-lg">
                  <span className="text-slate-700 font-bold text-2xl">
                    {user.parent_name?.charAt(0) || "P"}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Parent</p>
                  <h3 className="text-xl font-bold text-slate-800">{user.parent_name}</h3>
                  <p className="text-sm text-slate-500">{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

          <Card className="bg-white shadow-xl border border-slate-200 rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center border-2 border-emerald-300 shadow-lg">
                  <span className="text-emerald-700 font-bold text-2xl">
                    {user.child_name?.charAt(0) || "C"}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Child</p>
                  <h3 className="text-xl font-bold text-slate-800">{user.child_name}</h3>
                  <p className="text-sm text-slate-500">{user.child_age} years old</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

        {/* Navigation Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {navButtons.map((button) => {
            const Icon = button.icon;
            return (
              <Card
                key={button.text}
                className={`cursor-pointer ${button.bgColor} shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-2xl border-0 ${button.shadowColor}`}
                onClick={() => navigate(button.route)}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center gap-3 text-center min-h-[140px]">
                  <div className={`p-4 rounded-full bg-white bg-opacity-20 backdrop-blur-sm shadow-lg flex items-center justify-center`}>
                    <Icon className={`h-8 w-8 ${button.textColor}`} />
                  </div>
                  <h3 className={`text-lg font-bold ${button.textColor} drop-shadow-sm`}>{button.text}</h3>
                </CardContent>
              </Card>
          );
        })}
        </div>
      </div>
    </div>
  );
};

export default Home;
