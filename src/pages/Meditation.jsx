import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Play, Pause, Square } from "lucide-react";
import { toast } from "sonner";
import meditationScene from "@/assets/meditation-scene.png";

const Meditation = () => {
  const navigate = useNavigate();
  const [selectedTime, setSelectedTime] = useState(10);
  const [timeLeft, setTimeLeft] = useState(10 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [backgroundMusic, setBackgroundMusic] = useState(true);
  const [musicVolume, setMusicVolume] = useState(0.3);

  const timeOptions = [5, 10, 15, 20];

  const saveSession = useCallback(() => {
    const sessions = JSON.parse(localStorage.getItem("meditation_sessions") || "[]");
    const completedMinutes = Math.floor((selectedTime * 60 - timeLeft) / 60);
    if (completedMinutes > 0) {
      sessions.push({
        type: "meditation",
        duration: completedMinutes,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem("meditation_sessions", JSON.stringify(sessions));
    }
  }, [selectedTime, timeLeft]);

  useEffect(() => {
    let interval;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            toast.success("Great job! Meditation session complete! 🧘");
            saveSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, saveSession]);

  const handleTimeSelect = (minutes) => {
    if (!isRunning) {
      setSelectedTime(minutes);
      setTimeLeft(minutes * 60);
    }
  };

  const handlePlay = () => {
    setIsRunning(true);
    setIsPaused(false);
    if (backgroundMusic) {
      toast.info("🎵 Meditation started with background music");
    }
  };

  const handlePause = () => {
    setIsRunning(false);
    setIsPaused(true);
    if (backgroundMusic) {
      toast.info("🎵 Meditation paused - music continues");
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100 p-4">
      {/* Hidden Background Music - Auto-sync with timer */}
      {backgroundMusic && (
        <div className="fixed -top-96 -left-96 opacity-0 pointer-events-none">
          <iframe
            width="1"
            height="1"
            src={`https://www.youtube.com/embed/a98zkXRKeCs?autoplay=${isRunning ? 1 : 0}&loop=1&playlist=a98zkXRKeCs&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&fs=0&cc_load_policy=0&start=0&end=0&volume=30`}
            title="Meditation Background Music"
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        </div>
      )}

      <div className="max-w-2xl mx-auto">
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
            <h1 className="text-3xl font-bold text-blue-600">Meditation</h1>
          </div>
          <div className="flex items-center gap-2">
            {backgroundMusic && (
              <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-lg">
                <span className="text-sm">🎵</span>
                <span className="text-sm font-medium">
                  {isRunning ? "Music Playing" : isPaused ? "Music Paused" : "Music Ready"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main Card */}
        <Card className="bg-white shadow-lg border border-gray-100 rounded-2xl">
          <CardContent className="p-6 md:p-8 space-y-6">
            {/* Meditation Image */}
            <div className="rounded-2xl overflow-hidden bg-blue-50 p-4">
              <img
                src={meditationScene}
                alt="Peaceful meditation"
                className="w-full h-auto rounded-xl"
              />
            </div>

            {/* Timer Display */}
            <div className="text-center">
              <div className="text-6xl md:text-7xl font-bold text-blue-600 mb-4">
                {formatTime(timeLeft)}
              </div>
              <p className="text-gray-600">
                {isRunning ? "Session in progress..." : isPaused ? "Paused" : "Ready to meditate"}
              </p>
              {backgroundMusic && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center justify-center gap-2 text-blue-700">
                    <span className="text-lg">🎵</span>
                    <span className="text-sm font-medium">
                      {isRunning ? "Background music is playing" : isPaused ? "Music paused with meditation" : "Music ready to play"}
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Music automatically syncs with your meditation timer
                  </p>
                </div>
              )}
            </div>

            {/* Time Selector */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-center text-gray-700">Select Duration (minutes)</p>
              <div className="grid grid-cols-4 gap-2">
                {timeOptions.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    onClick={() => handleTimeSelect(time)}
                    disabled={isRunning}
                    className={`h-12 ${selectedTime === time ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-gray-200 text-gray-700 hover:bg-blue-50'}`}
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
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Play className="h-5 w-5" />
                Play
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handlePause}
                disabled={!isRunning}
                className="gap-2 border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                <Pause className="h-5 w-5" />
                Pause
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleStop}
                disabled={!isRunning && !isPaused}
                className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
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

