import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Play, Pause, Square } from "lucide-react";
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

  // Authentication check
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

  // Update audio source when selected time changes
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


  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading meditation...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 p-4">
      {/* Hidden Background Music - Auto-sync with timer */}
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

      <div className="max-w-2xl mx-auto">
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">Meditation</h1>
          </div>
          <div className="flex items-center gap-2">
            {backgroundMusic && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-violet-100 to-violet-200 text-violet-800 px-3 py-1 rounded-xl shadow-sm">
                <span className="text-sm">🎵</span>
                <span className="text-sm font-medium">
                  {isRunning ? "Music Playing" : isPaused ? "Music Paused" : "Music Ready"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main Card */}
        <Card className="bg-white shadow-xl border border-slate-200 rounded-3xl backdrop-blur-sm">
          <CardContent className="p-6 md:p-8 space-y-6">
            {/* Meditation Image */}
            <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-violet-50 to-violet-100 p-4 shadow-sm">
              <img
                src={meditationScene}
                alt="Peaceful meditation"
                className="w-full h-auto rounded-xl"
              />
            </div>

            {/* Timer Display */}
            <div className="text-center">
              <div className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-violet-600 to-violet-800 bg-clip-text text-transparent mb-4">
                {formatTime(timeLeft)}
              </div>
              <p className="text-slate-600">
                {isRunning ? "Session in progress..." : isPaused ? "Paused" : "Ready to meditate"}
              </p>
              {backgroundMusic && (
                <div className="mt-4 bg-gradient-to-r from-violet-50 to-violet-100 border border-violet-200 rounded-xl p-3 shadow-sm">
                  <div className="flex items-center justify-center gap-2 text-violet-700">
                    <span className="text-lg">🎵</span>
                    <span className="text-sm font-medium">
                      {isRunning ? "Background music is playing" : isPaused ? "Music paused with meditation" : "Music ready to play"}
                    </span>
                  </div>
                  <p className="text-xs text-violet-600 mt-1">
                    Music automatically syncs with your meditation timer
                  </p>
                </div>
              )}
            </div>

            {/* Time Selector */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-center text-slate-700">Select Duration (minutes)</p>
              <div className="grid grid-cols-4 gap-2">
                {timeOptions.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    onClick={() => handleTimeSelect(time)}
                    disabled={isRunning}
                    className={`h-12 rounded-xl ${selectedTime === time ? 'bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white shadow-lg' : 'border-slate-200 text-slate-700 hover:bg-violet-50 hover:border-violet-300'}`}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>

            {/* Control Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <Button
                size="lg"
                onClick={handlePlay}
                disabled={isRunning}
                className="gap-2 bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Play className="h-5 w-5" />
                Play
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handlePause}
                disabled={!isRunning}
                className="gap-2 border-slate-200 text-slate-700 hover:bg-violet-50 hover:border-violet-300 rounded-xl"
              >
                <Pause className="h-5 w-5" />
                Pause
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleStop}
                disabled={!isRunning && !isPaused}
                className="gap-2 border-red-200 text-red-600 hover:bg-red-50 rounded-xl"
              >
                <Square className="h-5 w-5" />
                Stop
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Meditation;

