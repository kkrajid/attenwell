import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Brain, BookOpen, Gamepad2, User } from "lucide-react";
import logo from "@/assets/attenwell-logo.jpg";

const Home = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const user = localStorage.getItem("attenwell_user");
    if (!user) {
      navigate("/login");
    } else {
      setUserData(JSON.parse(user));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("attenwell_user");
    navigate("/login");
  };

  if (!userData) return null;

  const navButtons = [
    { text: "Meditation", icon: Brain, route: "/meditation", bgColor: "bg-blue-500", textColor: "text-white" },
    { text: "Focus", icon: BookOpen, route: "/focus", bgColor: "bg-orange-500", textColor: "text-white" },
    { text: "Games", icon: Gamepad2, route: "/game", bgColor: "bg-teal-500", textColor: "text-white" },
    { text: "Parent", icon: User, route: "/parent", bgColor: "bg-gray-700", textColor: "text-white" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100 p-4 md:p-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-200">
            <img src={logo} alt="AttenWell" className="w-8 h-8 rounded-full" />
          </div>
          <h1 className="text-2xl font-bold text-blue-600">AttenWell</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-200">
            <span className="text-blue-600 font-semibold text-sm">
              {userData.parentName?.charAt(0) || "P"}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-700">{userData.parentName}</p>
            <p className="text-xs text-gray-500">{userData.email}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-gray-600 hover:text-gray-800">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Profile Cards */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8 max-w-4xl mx-auto">
        <Card className="bg-white shadow-lg border border-gray-100 rounded-xl hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-200">
                <span className="text-blue-600 font-bold text-2xl">
                  {userData.parentName?.charAt(0) || "P"}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Parent</p>
                <h3 className="text-xl font-bold text-gray-800">{userData.parentName}</h3>
                <p className="text-sm text-gray-500">{userData.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border border-gray-100 rounded-xl hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center border-2 border-green-200">
                <span className="text-green-600 font-bold text-2xl">
                  {userData.childName?.charAt(0) || "C"}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Child</p>
                <h3 className="text-xl font-bold text-gray-800">{userData.childName}</h3>
                <p className="text-sm text-gray-500">{userData.age} years old</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {navButtons.map((button, index) => {
          const Icon = button.icon;
          return (
            <Card
              key={button.text}
              className={`cursor-pointer ${button.bgColor} shadow-lg hover:shadow-xl transition-all hover:scale-105 rounded-xl`}
              onClick={() => navigate(button.route)}
            >
              <CardContent className="p-6 flex flex-col items-center justify-center gap-3 text-center min-h-[140px]">
                <div className={`p-3 rounded-full ${button.bgColor} bg-opacity-20`}>
                  <Icon className={`h-8 w-8 ${button.textColor}`} />
                </div>
                <h3 className={`text-lg font-bold ${button.textColor}`}>{button.text}</h3>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Home;
