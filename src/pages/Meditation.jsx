import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Play, Pause, Square, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import apiService from "@/services/api";
import meditationScene from "@/assets/meditation-scene.png";
import audio5min from "@/assets/5min_audio.mp3";
import audio10min from "@/assets/10m_audio.mp3";
import audio15min from "@/assets/15m_audio.mp3";
import audio20min from "@/assets/20m_audio.mp3";

const Meditation = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const audioRef = useRef(null);
  const [selectedTime, setSelectedTime] = useState(10);
  const [timeLeft, setTimeLeft] = useState(10 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [backgroundMusic] = useState(true);
  const [musicVolume] = useState(0.3);

  const timeOptions = [5, 10, 15, 20];

  const getAudioFile = (minutes) => {
    switch (minutes) {
      case 5: return audio5min;
      case 10: return audio10min;
      case 15: return audio15min;
      case 20: return audio20min;
      default: return audio10min;
    }
  };

  const saveSession = useCallback(async () => {
    const completedMinutes = Math.floor((selectedTime * 60 - timeLeft) / 60);
    if (completedMinutes > 0) {
      try {
        await apiService.createMeditationSession({
          duration: selectedTime,
          actual_duration: completedMinutes,
          status: "completed"
        });
        toast.success("Meditation session saved!");
      } catch (error) {
        console.error("Error saving meditation session:", error);
        toast.error("Failed to save meditation session");
      }
    }
  }, [selectedTime, timeLeft]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    let interval;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if (backgroundMusic && audioRef.current) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
            }
            toast.success("Great job! Meditation session complete! 🧘");
            saveSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, saveSession, backgroundMusic]);

  useEffect(() => {
    if (audioRef.current && backgroundMusic) {
      audioRef.current.src = getAudioFile(selectedTime);
      audioRef.current.load();
    }
  }, [selectedTime, backgroundMusic]);

  const handleTimeSelect = (minutes) => {
    if (!isRunning) {
      setSelectedTime(minutes);
      setTimeLeft(minutes * 60);
    }
  };

  const handlePlay = () => {
    setIsRunning(true);
    setIsPaused(false);
    if (backgroundMusic && audioRef.current) {
      audioRef.current.play().catch(error => {
        console.error("Error playing audio:", error);
        toast.error("Could not play background music");
      });
      toast.info("🎵 Meditation started with background music");
    }
  };

  const handlePause = () => {
    setIsRunning(false);
    setIsPaused(true);
    if (backgroundMusic && audioRef.current) {
      audioRef.current.pause();
      toast.info("🎵 Meditation paused - music paused");
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    if (backgroundMusic && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    saveSession();
    setTimeLeft(selectedTime * 60);
    if (backgroundMusic) {
      toast.success("🎵 Meditation session complete!");
    }
  };

  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsRunning(false);
    setIsPaused(false);
    setSelectedTime(5);
    setTimeLeft(5 * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading meditation...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Hidden Background Music */}
      {backgroundMusic && (
        <audio
          ref={audioRef}
          src={getAudioFile(selectedTime)}
          loop
          volume={musicVolume}
          preload="auto"
          className="hidden"
        />
      )}

      {/* Elegant Header */}
      <header className="bg-white px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button
            onClick={() => navigate("/home")}
            className="w-11 h-11 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-slate-800" />
          </button>
          
          <div className="flex flex-col items-center">
            <h1 className="text-[13px] font-bold text-slate-800 tracking-[2.5px]">
              MEDITATION
            </h1>
            <div className="w-10 h-0.5 bg-amber-600 rounded mt-1" />
          </div>
          
          <div className="w-11" />
        </div>
      </header>

      {/* Main Content - Vertical Space Between */}
      <div className="flex-1 flex flex-col justify-between px-5 py-5 max-w-2xl mx-auto w-full pb-12">
        {/* Album Art Section */}
        <div className="flex flex-col items-center pt-2">
          <div className="relative w-[200px] h-[200px] mb-3 flex items-center justify-center">
            {/* Animated Glow Rings */}
            {isRunning && (
              <>
                <div className="absolute w-[180px] h-[180px] rounded-full border border-amber-600 animate-ping-slow" />
                <div className="absolute w-[200px] h-[200px] rounded-full border border-amber-600 animate-ping-slower" />
                <div className="absolute w-[220px] h-[220px] rounded-full bg-amber-600 opacity-10 animate-pulse-glow" />
              </>
            )}
            
            {/* Premium Album Art */}
            <div className={`relative z-10 w-[160px] h-[160px] rounded-full bg-white p-0.75 shadow-2xl border border-gray-100 ${isRunning ? 'animate-pulse-breath' : ''}`}>
              <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-50 to-white p-0.5 border border-gray-200">
                <img 
                  src={meditationScene}
                  alt="Deep Meditation" 
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Track Info */}
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-light text-slate-800 tracking-wide mb-1.5">
              Deep Meditation
            </h2>
            <div className="w-12 h-px bg-amber-600 mb-1.5" />
            <p className="text-[11px] text-gray-500 font-medium tracking-widest uppercase">
              {selectedTime} Minute Journey
            </p>
            
            {isRunning && (
              <div className="flex items-center gap-1.5 bg-gray-50 px-3.5 py-1.5 rounded-full mt-2 border border-gray-200">
                <div className="flex items-center justify-center w-3 h-3 rounded-full bg-amber-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-pulse" />
                </div>
                <span className="text-[9px] font-bold text-slate-700 tracking-wider">
                  NOW PLAYING
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Duration Selection */}
        <div className="py-1">
          <div className="flex items-center mb-2.5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[9px] font-bold text-gray-400 tracking-[1.5px] mx-3">
              SELECT DURATION
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          
          <div className="flex gap-2.5">
            {timeOptions.map((time) => (
              <button
                key={time}
                onClick={() => handleTimeSelect(time)}
                disabled={isRunning}
                className={`relative flex-1 flex flex-col items-center py-3 rounded-[14px] border-2 transition-all duration-300 ${
                  selectedTime === time
                    ? 'bg-slate-800 border-slate-800 shadow-lg'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className={`text-xl font-semibold ${
                  selectedTime === time ? 'text-white' : 'text-slate-700'
                }`}>
                  {time}
                </span>
                <span className={`text-[8px] font-bold tracking-wider ${
                  selectedTime === time ? 'text-gray-300' : 'text-gray-400'
                }`}>
                  MIN
                </span>
                {selectedTime === time && (
                  <div className="absolute -bottom-0.5 w-6 h-0.5 bg-amber-600 rounded-t" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Progress Section */}
        <div className="py-1">
          <div className="mb-2.5">
            <div className="relative h-0.75 bg-gray-100 rounded-full overflow-visible">
              <div 
                className="absolute h-full bg-gradient-to-r from-amber-600 to-yellow-500 rounded-full transition-all duration-300"
                style={{ width: `${((selectedTime * 60 - timeLeft) / (selectedTime * 60)) * 100}%` }}
              />
              {timeLeft < selectedTime * 60 && (
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-[18px] h-[18px] bg-white rounded-full border-[3px] border-amber-600 shadow-md"
                  style={{ left: `${((selectedTime * 60 - timeLeft) / (selectedTime * 60)) * 100}%`, marginLeft: '-9px' }}
                />
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between px-1">
            <div className="flex flex-col items-center flex-1">
              <span className="text-[8px] font-bold text-gray-400 tracking-wider mb-1">
                CURRENT
              </span>
              <span className="text-base font-semibold text-slate-800 tracking-wide">
                {formatTime(selectedTime * 60 - timeLeft)}
              </span>
            </div>
            <div className="w-px h-[26px] bg-gray-200 mx-3" />
            <div className="flex flex-col items-center flex-1">
              <span className="text-[8px] font-bold text-gray-400 tracking-wider mb-1">
                TOTAL
              </span>
              <span className="text-base font-semibold text-slate-800 tracking-wide">
                {formatTime(selectedTime * 60)}
              </span>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-4 py-1">
          <button
            onClick={handleReset}
            className="flex flex-col items-center justify-center w-[60px] h-[60px] bg-gray-50 rounded-full border-2 border-gray-200 hover:bg-gray-100 transition-colors shadow-sm"
          >
            <RotateCcw className="w-5 h-5 text-slate-700 mb-0.5" />
            <span className="text-[7px] font-bold text-gray-500 tracking-wide">
              RESET
            </span>
          </button>

          <button
            onClick={isRunning ? handlePause : handlePlay}
            className="w-[78px] h-[78px] bg-slate-800 hover:bg-slate-900 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 border-[3px] border-slate-700"
          >
            {isRunning ? (
              <Pause className="h-[42px] w-[42px] text-white" />
            ) : (
              <Play className="h-[42px] w-[42px] text-white ml-1" />
            )}
          </button>

          <button
            onClick={handleStop}
            className="flex flex-col items-center justify-center w-[60px] h-[60px] bg-gray-50 rounded-full border-2 border-gray-200 hover:bg-gray-100 transition-colors shadow-sm"
          >
            <Square className="w-5 h-5 text-slate-700 fill-slate-700 mb-0.5" />
            <span className="text-[7px] font-bold text-gray-500 tracking-wide">
              STOP
            </span>
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 0.15;
          }
          50% {
            transform: scale(1.15);
            opacity: 0;
          }
          100% {
            transform: scale(1.2);
            opacity: 0;
          }
        }

        @keyframes ping-slower {
          0% {
            transform: scale(1.1);
            opacity: 0.1;
          }
          50% {
            transform: scale(1.3);
            opacity: 0;
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }

        @keyframes pulse-breath {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.08);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.08;
          }
          50% {
            opacity: 0.18;
          }
        }

        .animate-ping-slow {
          animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .animate-ping-slower {
          animation: ping-slower 4s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .animate-pulse-breath {
          animation: pulse-breath 6s ease-in-out infinite;
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Meditation;