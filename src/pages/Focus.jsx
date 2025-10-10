import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Camera, CameraOff } from "lucide-react";
import { toast } from "sonner";

const Focus = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  
  const [totalTime, setTotalTime] = useState("");
  const [studyTime, setStudyTime] = useState(0);
  const [playTime, setPlayTime] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [currentMode, setCurrentMode] = useState("study");
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [showBreakReminder, setShowBreakReminder] = useState(false);
  const [breakSuggestions, setBreakSuggestions] = useState([]);
  const [showModeSwitchConfirmation, setShowModeSwitchConfirmation] = useState(false);
  const [pendingModeSwitch, setPendingModeSwitch] = useState(null);
  const [extendSession, setExtendSession] = useState(false);

  // Break suggestion logic based on focus duration
  const getBreakSuggestions = (focusMinutes) => {
    const suggestions = [];
    
    if (focusMinutes <= 10) {
      suggestions.push(
        { activity: "👀 Look away from screen", duration: "20 seconds", type: "eye-rest" },
        { activity: "🧘 Take 3 deep breaths", duration: "30 seconds", type: "breathing" },
        { activity: "💧 Drink some water", duration: "1 minute", type: "hydration" }
      );
    } else if (focusMinutes <= 20) {
      suggestions.push(
        { activity: "🚶 Walk around the room", duration: "2 minutes", type: "movement" },
        { activity: "👀 Look at something 20 feet away", duration: "20 seconds", type: "eye-rest" },
        { activity: "🤲 Stretch your hands and wrists", duration: "1 minute", type: "stretching" },
        { activity: "💧 Hydrate and snack", duration: "2 minutes", type: "nutrition" }
      );
    } else if (focusMinutes <= 30) {
      suggestions.push(
        { activity: "🚶 Take a short walk", duration: "3-5 minutes", type: "movement" },
        { activity: "🧘 Practice mindfulness", duration: "2 minutes", type: "mental-reset" },
        { activity: "👀 Eye exercises", duration: "1 minute", type: "eye-care" },
        { activity: "🤲 Full body stretch", duration: "3 minutes", type: "stretching" },
        { activity: "💧 Healthy snack and water", duration: "3 minutes", type: "nutrition" }
      );
    } else {
      suggestions.push(
        { activity: "🚶 Go for a walk outside", duration: "5-10 minutes", type: "movement" },
        { activity: "🧘 Meditation or deep breathing", duration: "5 minutes", type: "mental-reset" },
        { activity: "👀 Look at nature or distant objects", duration: "2 minutes", type: "eye-rest" },
        { activity: "🤲 Full body stretching routine", duration: "5 minutes", type: "stretching" },
        { activity: "💧 Healthy meal or substantial snack", duration: "5 minutes", type: "nutrition" },
        { activity: "🎵 Listen to calming music", duration: "3 minutes", type: "relaxation" }
      );
    }
    
    return suggestions;
  };

  const calculateSplit = () => {
    const total = parseInt(totalTime);
    if (!total || total <= 0) {
      toast.error("Please enter a valid time");
      return;
    }
    
    // Human behavior-based focus logic
    let study, play;
    
    if (total <= 15) {
      // Short sessions: 80% focus, 20% break
      study = Math.floor(total * 0.8);
      play = total - study;
    } else if (total <= 30) {
      // Medium sessions: 70% focus, 30% break
      study = Math.floor(total * 0.7);
      play = total - study;
    } else if (total <= 60) {
      // Longer sessions: 60% focus, 40% break
      study = Math.floor(total * 0.6);
      play = total - study;
    } else {
      // Very long sessions: Cap at 45 minutes focus, rest is break
      study = Math.min(45, Math.floor(total * 0.5));
      play = total - study;
    }
    
    // Ensure minimum break time
    if (play < 5) {
      play = 5;
      study = total - play;
    }
    
    setStudyTime(study);
    setPlayTime(play);
    
    // Show human behavior explanation
    let explanation = "";
    if (total <= 15) {
      explanation = "Short sessions work best for quick tasks!";
    } else if (total <= 30) {
      explanation = "Good balance for most learning activities.";
    } else if (total <= 60) {
      explanation = "Longer sessions need more breaks to stay focused.";
    } else {
      explanation = "Extended sessions capped at 45min focus for optimal attention.";
    }
    
    toast.success(`${explanation} Study: ${study} min | Break: ${play} min`);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraEnabled(true);
        toast.success("Camera monitoring started 📹");
      }
    } catch (error) {
      toast.error("Unable to access camera. Please grant permission.");
      console.error("Camera error:", error);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      streamRef.current = null;
      setCameraEnabled(false);
    }
  };

  const startSession = async () => {
    if (studyTime === 0) {
      toast.error("Please calculate the time split first");
      return;
    }
    
    // Start camera monitoring
    await startCamera();
    
    setIsSessionActive(true);
    setCurrentMode("study");
    setTimeLeft(studyTime * 60);
    setIsRunning(true);
    
    // Generate break suggestions based on focus duration
    const suggestions = getBreakSuggestions(studyTime);
    setBreakSuggestions(suggestions);
    
    toast.success("Focus session started! 📚");
  };

  const stopSession = () => {
    setIsRunning(false);
    setIsSessionActive(false);
    stopCamera();
    saveSession();
    setTimeLeft(0);
    setCurrentMode("study");
    setShowModeSwitchConfirmation(false);
    setPendingModeSwitch(null);
    toast.success("Session stopped and saved!");
  };

  const confirmModeSwitch = () => {
    if (pendingModeSwitch === "play") {
      setCurrentMode("play");
      setTimeLeft(playTime * 60);
      setShowBreakReminder(false);
      toast.success("Study time complete! Enjoy your play time! 🎮");
    } else if (pendingModeSwitch === "complete") {
      setIsRunning(false);
      setIsSessionActive(false);
      stopCamera();
      setShowBreakReminder(false);
      toast.success("Session complete! Great work! 🎉");
      saveSession();
    }
    setShowModeSwitchConfirmation(false);
    setPendingModeSwitch(null);
  };

  const cancelModeSwitch = () => {
    setShowModeSwitchConfirmation(false);
    setPendingModeSwitch(null);
    setExtendSession(true);
    // Give 5 more minutes to continue the session
    setTimeLeft(5 * 60); // 5 minutes extension
    setIsRunning(true);
    toast.info("Extended session by 5 minutes. Continue focusing! 📚");
  };

  useEffect(() => {
    let interval;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const minutesLeft = Math.floor(prev / 60);
          
          // Show break reminders at strategic intervals
          if (currentMode === "study") {
            if (minutesLeft === 5 && studyTime > 10) {
              setShowBreakReminder(true);
              toast.info("💡 5 minutes left! Consider a quick eye break");
            } else if (minutesLeft === 10 && studyTime > 20) {
              setShowBreakReminder(true);
              toast.info("💡 10 minutes left! Time for a movement break");
            } else if (minutesLeft === 15 && studyTime > 25) {
              setShowBreakReminder(true);
              toast.info("💡 15 minutes left! Perfect time for a stretch");
            }
          }
          
          if (prev <= 1) {
            if (currentMode === "study") {
              if (extendSession) {
                // Extended session is complete, now switch to play
                setExtendSession(false);
                setCurrentMode("play");
                setTimeLeft(playTime * 60);
                setShowBreakReminder(false);
                toast.success("Extended study time complete! Enjoy your play time! 🎮");
                return playTime * 60;
              } else {
                // Show confirmation to switch to play mode
                setPendingModeSwitch("play");
                setShowModeSwitchConfirmation(true);
                setIsRunning(false);
                return 0;
              }
            } else {
              // Show confirmation to complete session
              setPendingModeSwitch("complete");
              setShowModeSwitchConfirmation(true);
              setIsRunning(false);
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, currentMode, playTime, studyTime]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const saveSession = () => {
    const sessions = JSON.parse(localStorage.getItem("focus_sessions") || "[]");
    sessions.push({
      type: "focus",
      studyTime,
      playTime,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem("focus_sessions", JSON.stringify(sessions));
    
    // Update available play time
    const currentPlayTime = parseInt(localStorage.getItem("available_play_time") || "0");
    localStorage.setItem("available_play_time", (currentPlayTime + playTime).toString());
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/home")}
            className="rounded-full text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold text-blue-600">Focus Time</h1>
        </div>

        {!isSessionActive ? (
          <Card className="bg-white shadow-lg border border-gray-100 rounded-2xl">
            <CardContent className="p-6 md:p-8 space-y-6">
              {/* Input Form */}
              <div className="space-y-3">
                <Label htmlFor="totalTime" className="text-gray-700 font-medium">Total Focus Time (minutes)</Label>
                <div className="flex gap-2">
                  <Input
                    id="totalTime"
                    type="number"
                    placeholder="e.g., 30"
                    value={totalTime}
                    onChange={(e) => setTotalTime(e.target.value)}
                    className="h-12 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 rounded-lg"
                    min="1"
                    max="120"
                  />
                  <Button onClick={calculateSplit} className="h-12 bg-blue-600 hover:bg-blue-700 text-white">
                    Calculate
                  </Button>
                </div>
                
                {/* Human Behavior Tips */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">🧠 Human Focus Guidelines:</h4>
                  <div className="text-xs text-blue-700 space-y-1">
                    <p>• <strong>15 min or less:</strong> 80% focus, 20% break (Quick tasks)</p>
                    <p>• <strong>15-30 min:</strong> 70% focus, 30% break (Optimal learning)</p>
                    <p>• <strong>30-60 min:</strong> 60% focus, 40% break (Longer sessions)</p>
                    <p>• <strong>60+ min:</strong> Max 45min focus, rest is break (Extended work)</p>
                  </div>
                </div>
              </div>

              {/* Time Split Display */}
              {studyTime > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-orange-50 border-orange-200">
                      <CardContent className="p-6 text-center">
                        <p className="text-sm text-gray-600 mb-2">📚 Focus Time</p>
                        <div className="text-4xl font-bold text-orange-600 mb-2">
                          {studyTime}
                        </div>
                        <p className="text-sm text-gray-600">minutes</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-6 text-center">
                        <p className="text-sm text-gray-600 mb-2">🎮 Break Time</p>
                        <div className="text-4xl font-bold text-green-600 mb-2">
                          {playTime}
                        </div>
                        <p className="text-sm text-gray-600">minutes</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Session Recommendation */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">💡 Session Recommendation:</h4>
                    <div className="text-sm text-gray-700">
                      {parseInt(totalTime) <= 15 ? (
                        <p>Perfect for quick tasks! Focus for {studyTime} minutes, then take a {playTime}-minute break.</p>
                      ) : parseInt(totalTime) <= 30 ? (
                        <p>Great for learning! {studyTime} minutes of focused work, then {playTime} minutes to recharge.</p>
                      ) : parseInt(totalTime) <= 60 ? (
                        <p>Longer session ahead! {studyTime} minutes of study with {playTime} minutes of well-deserved break time.</p>
                      ) : (
                        <p>Extended session! Maximum {studyTime} minutes of focus (human attention limit) with {playTime} minutes of break time.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Start Button */}
              {studyTime > 0 && (
                <Button
                  onClick={startSession}
                  size="xl"
                  className="w-full gap-2 bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Camera className="h-5 w-5" />
                  Start Focus Session with Monitoring
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Camera Preview */}
            <Card className="shadow-[var(--shadow-soft)] animate-scale-in overflow-hidden">
              <CardContent className="p-0">
                <div className="relative bg-black aspect-video">
                  {cameraEnabled ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        Monitoring
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <CameraOff className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Mode Switch Confirmation */}
            {showModeSwitchConfirmation && (
              <Card className="bg-blue-50 border-blue-200 shadow-lg animate-pulse">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-4xl mb-4">
                      {pendingModeSwitch === "play" ? "🎮" : "🎉"}
                    </div>
                    <h4 className="text-xl font-bold text-blue-800 mb-2">
                      {pendingModeSwitch === "play" ? "Study Time Complete!" : "Session Complete!"}
                    </h4>
                    <p className="text-blue-700 mb-6">
                      {pendingModeSwitch === "play" 
                        ? `Your ${studyTime}-minute study session is finished. Ready to switch to ${playTime}-minute play time?`
                        : "Your focus session is complete! Great work on staying focused."
                      }
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button
                        onClick={confirmModeSwitch}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                      >
                        {pendingModeSwitch === "play" ? "Switch to Play Mode" : "Complete Session"}
                      </Button>
                      {pendingModeSwitch === "play" && (
                        <Button
                          variant="outline"
                          onClick={cancelModeSwitch}
                          className="border-orange-200 text-orange-600 hover:bg-orange-50 px-6"
                        >
                          Extend Study (+5 min)
                        </Button>
                      )}
                      {pendingModeSwitch === "complete" && (
                        <Button
                          variant="outline"
                          onClick={cancelModeSwitch}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50 px-6"
                        >
                          Continue Current Mode
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Break Reminder */}
            {showBreakReminder && currentMode === "study" && (
              <Card className="bg-yellow-50 border-yellow-200 shadow-lg animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">⏰</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-yellow-800 mb-2">Break Reminder!</h4>
                      <p className="text-sm text-yellow-700 mb-3">
                        You've been focusing for a while. Here are some quick break ideas:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {breakSuggestions.slice(0, 4).map((suggestion, index) => (
                          <div key={index} className="bg-white/50 rounded-lg p-2 text-xs">
                            <div className="font-medium">{suggestion.activity}</div>
                            <div className="text-yellow-600">{suggestion.duration}</div>
                          </div>
                        ))}
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => setShowBreakReminder(false)}
                        className="mt-3 bg-yellow-600 hover:bg-yellow-700 text-white"
                      >
                        Got it, continue focusing
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Session Info */}
            <Card className={`shadow-[var(--shadow-soft)] ${
              currentMode === "study" ? "border-orange-200" : "border-green-200"
            }`}>
              <CardContent className="p-6 md:p-8 space-y-6">
                {/* Current Mode Badge */}
                <div className="text-center">
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                    currentMode === "study" 
                      ? "bg-orange-100 text-orange-800 border border-orange-200" 
                      : "bg-green-100 text-green-800 border border-green-200"
                  }`}>
                    {currentMode === "study" ? "📚 Focus Mode" : "🎮 Break Mode"}
                    {extendSession && currentMode === "study" && (
                      <span className="ml-2 text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full">
                        Extended
                      </span>
                    )}
                  </span>
                </div>

                {/* Timer Display */}
                <div className="text-center">
                  <div className={`text-6xl md:text-7xl font-bold mb-4 ${
                    currentMode === "study" ? "text-orange-600" : "text-green-600"
                  }`}>
                    {formatTime(timeLeft)}
                  </div>
                  <p className="text-gray-600">
                    {currentMode === "study" ? "Stay focused and avoid distractions" : "Take a well-deserved break!"}
                  </p>
                </div>

                {/* Progress Indicator */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Progress</span>
                    <span>
                      {currentMode === "study" 
                        ? `${studyTime - Math.floor(timeLeft / 60)} / ${studyTime} min`
                        : `${playTime - Math.floor(timeLeft / 60)} / ${playTime} min`
                      }
                    </span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        currentMode === "study" ? "bg-orange-500" : "bg-green-500"
                      }`}
                      style={{
                        width: `${currentMode === "study" 
                          ? ((studyTime * 60 - timeLeft) / (studyTime * 60)) * 100
                          : ((playTime * 60 - timeLeft) / (playTime * 60)) * 100
                        }%`
                      }}
                    />
                  </div>
                </div>

                {/* Break Suggestions Panel */}
                {currentMode === "study" && breakSuggestions.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-800 mb-3">💡 Break Ideas for Your {studyTime}-minute Session:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {breakSuggestions.map((suggestion, index) => (
                        <div key={index} className="bg-white rounded-lg p-3 border border-blue-100">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-gray-800">{suggestion.activity}</div>
                            <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                              {suggestion.duration}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      💡 These suggestions are tailored for your {studyTime}-minute focus session
                    </p>
                  </div>
                )}

                {/* Automatic Mode Indicator */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">🔄 Automatic Mode Switching</h4>
                  <p className="text-xs text-blue-600 mb-3">
                    The system will automatically switch between Study and Play modes based on your calculated time split.
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                      currentMode === "study" 
                        ? "bg-orange-100 text-orange-800 border border-orange-200" 
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      <span className="text-lg">📚</span>
                      <span className="text-sm font-medium">Study Mode</span>
                    </div>
                    <div className="text-gray-400">→</div>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                      currentMode === "play" 
                        ? "bg-green-100 text-green-800 border border-green-200" 
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      <span className="text-lg">🎮</span>
                      <span className="text-sm font-medium">Play Mode</span>
                    </div>
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    size="lg"
                    disabled
                    className={`gap-2 ${
                      currentMode === "study" 
                        ? "bg-orange-100 text-orange-800 border border-orange-200" 
                        : "bg-green-100 text-green-800 border border-green-200"
                    }`}
                  >
                    {currentMode === "study" ? "📚 Focusing..." : "🎮 Playing..."}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={stopSession}
                    className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Stop Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Focus;
