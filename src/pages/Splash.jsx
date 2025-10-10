import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/attenwell-logo.jpg";

const Splash = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login");
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary via-meditation to-secondary p-4">
      <div className="animate-scale-in">
        <img 
          src={logo} 
          alt="AttenWell Logo" 
          className="w-40 h-40 mb-6 animate-pulse-soft rounded-full"
        />
      </div>
      <h1 className="text-4xl font-headings text-white mb-2 animate-fade-in">
        AttenWell
      </h1>
      <p className="text-white/90 text-lg animate-fade-in">
        Growing Together
      </p>
      <div className="mt-8 flex gap-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: "0ms" }}></div>
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: "150ms" }}></div>
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: "300ms" }}></div>
      </div>
    </div>
  );
};

export default Splash;


