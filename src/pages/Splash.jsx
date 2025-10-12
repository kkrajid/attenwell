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
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-amber-600 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-slate-800 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Elegant Logo with Animation */}
        <div className="mb-8 animate-scale-in">
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-white border-[3px] border-gray-100 p-1.5 shadow-2xl animate-pulse-soft">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-amber-50 to-slate-50 p-1">
              <img 
                src={logo} 
                alt="AttenWell Logo" 
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </div>
          
          {/* Decorative ring animation */}
          <div className="absolute inset-0 rounded-full border-2 border-amber-600/20 animate-ping-slow"></div>
        </div>

        {/* Brand Identity */}
        <div className="flex flex-col items-center mb-3 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 tracking-[4px] mb-3">
            ATTENWELL
          </h1>
          <div className="w-16 h-[2px] bg-amber-600 rounded mb-3 animate-expand"></div>
          <p className="text-sm sm:text-base text-gray-500 font-medium tracking-[1.5px] uppercase animate-fade-in-delayed">
            Your Wellness Journey
          </p>
        </div>

        {/* Tagline */}
        <p className="text-lg sm:text-xl text-slate-700 font-light tracking-wide mb-12 animate-fade-in-delayed-2">
          Growing Together
        </p>

        {/* Loading Dots */}
        <div className="flex gap-2.5 animate-fade-in-delayed-3">
          <div 
            className="w-2.5 h-2.5 bg-slate-800 rounded-full animate-bounce-smooth" 
            style={{ animationDelay: "0ms" }}
          ></div>
          <div 
            className="w-2.5 h-2.5 bg-amber-600 rounded-full animate-bounce-smooth" 
            style={{ animationDelay: "150ms" }}
          ></div>
          <div 
            className="w-2.5 h-2.5 bg-slate-800 rounded-full animate-bounce-smooth" 
            style={{ animationDelay: "300ms" }}
          ></div>
        </div>

        {/* Version Number */}
        <div className="absolute bottom-8 animate-fade-in-delayed-3">
          <p className="text-xs text-gray-400 font-medium tracking-wider">
            Version 1.0.0
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes pulse-soft {
          0%, 100% {
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
          }
          50% {
            box-shadow: 0 0 40px rgba(217, 119, 6, 0.2);
          }
        }

        @keyframes fade-in {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in-delayed {
          0%, 33% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in-delayed-2 {
          0%, 50% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in-delayed-3 {
          0%, 66% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes expand {
          0% {
            width: 0;
            opacity: 0;
          }
          100% {
            width: 4rem;
            opacity: 1;
          }
        }

        @keyframes bounce-smooth {
          0%, 100% {
            transform: translateY(0);
            opacity: 1;
          }
          50% {
            transform: translateY(-8px);
            opacity: 0.7;
          }
        }

        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.1);
            opacity: 0;
          }
          100% {
            transform: scale(1.2);
            opacity: 0;
          }
        }

        .animate-scale-in {
          animation: scale-in 0.8s ease-out;
        }

        .animate-pulse-soft {
          animation: pulse-soft 2s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out 0.3s both;
        }

        .animate-fade-in-delayed {
          animation: fade-in-delayed 1.5s ease-out both;
        }

        .animate-fade-in-delayed-2 {
          animation: fade-in-delayed-2 1.8s ease-out both;
        }

        .animate-fade-in-delayed-3 {
          animation: fade-in-delayed-3 2s ease-out both;
        }

        .animate-expand {
          animation: expand 0.8s ease-out 0.5s both;
        }

        .animate-bounce-smooth {
          animation: bounce-smooth 1s ease-in-out infinite;
        }

        .animate-ping-slow {
          animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default Splash;