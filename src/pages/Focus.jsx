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
  
  const [totalTimeMinutes, setTotalTimeMinutes] = useState("");
  const [parentSettings, setParentSettings] = useState({ studyTimeHours: 0.5, breakTimeHours: 0.25 });
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [currentMode, setCurrentMode] = useState("study");
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  
  // Session tracking
  const [sessionPlan, setSessionPlan] = useState([]);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  const [totalBreakTime, setTotalBreakTime] = useState(0);
  const [actualStudyTime, setActualStudyTime] = useState(0);
  const [actualBreakTime, setActualBreakTime] = useState(0);


  // Load parent settings on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("parent_settings");
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setParentSettings(settings);
    }
  }, []);

  const createSessionPlan = () => {
    const totalMinutes = parseInt(totalTimeMinutes);
    
    // Validate input
    if (!totalMinutes || totalMinutes <= 0 || isNaN(totalMinutes)) {
      toast.error("Please enter a valid time (1-240 minutes)");
      return;
    }
    
    if (totalMinutes > 240) {
      toast.error("Maximum time limit is 240 minutes (4 hours)");
      return;
    }
    
    if (totalMinutes < 1) {
      toast.error("Minimum time is 1 minute");
      return;
    }
    const studyMinutes = parentSettings.studyTimeHours * 60;
    const breakMinutes = parentSettings.breakTimeHours * 60;
    const cycleMinutes = studyMinutes + breakMinutes;
    
    // Create session plan
    const plan = [];
    let remainingTime = totalMinutes;
    let phaseIndex = 0;
    
    // Continue creating cycles until we run out of time
    let maxPhases = Math.ceil(totalMinutes / Math.min(studyMinutes, breakMinutes)) + 10; // Safety limit
    let phaseCount = 0;
    
    while (remainingTime > 0 && phaseCount < maxPhases) {
      phaseCount++;
      
      // Always start with study phase if there's any time left
      if (remainingTime >= studyMinutes) {
        // Add full study phase
        plan.push({
          type: "study",
          duration: studyMinutes,
          index: phaseIndex++
        });
        remainingTime -= studyMinutes;
      } else if (remainingTime > 0) {
        // Add partial study phase
        plan.push({
          type: "study",
          duration: remainingTime,
          index: phaseIndex++
        });
        remainingTime = 0;
        break; // No time left for break
      }
      
      // Add break phase if there's time left
      if (remainingTime >= breakMinutes) {
        plan.push({
          type: "break",
          duration: breakMinutes,
          index: phaseIndex++
        });
        remainingTime -= breakMinutes;
      } else if (remainingTime > 0) {
        // Add partial break phase
        plan.push({
          type: "break",
          duration: remainingTime,
          index: phaseIndex++
        });
        remainingTime = 0;
      }
    }
    
    if (plan.length === 0) {
      toast.error("Time is too short for a complete session. Minimum: " + cycleMinutes + " minutes");
      return;
    }
    
    setSessionPlan(plan);
    setCurrentPhaseIndex(0);
    
    // Calculate totals
    const totalStudy = plan.filter(p => p.type === "study").reduce((sum, p) => sum + p.duration, 0);
    const totalBreak = plan.filter(p => p.type === "break").reduce((sum, p) => sum + p.duration, 0);
    
    setTotalStudyTime(totalStudy);
    setTotalBreakTime(totalBreak);
    
    // Show session breakdown
    let explanation = `Session Plan (${totalMinutes} minutes total):`;
    explanation += `\n• ${Math.round(totalStudy)} minutes study time`;
    explanation += `\n• ${Math.round(totalBreak)} minutes break time`;
    explanation += `\n• ${plan.length} phases total`;
    
    toast.success(explanation);
  };

  const startCamera = async () => {
    try {
      console.log("Starting camera...");
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported in this browser");
      }
      
      // Check if we're on HTTPS or localhost (localhost allows camera on HTTP)
      const isSecure = window.location.protocol === 'https:' || 
                       window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.startsWith('192.168.') ||
                       window.location.hostname.startsWith('10.') ||
                       window.location.hostname.startsWith('172.');
      
      if (!isSecure) {
        console.warn("Camera may not work on non-secure connections. Consider using HTTPS or localhost.");
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false 
      });
      
      console.log("Camera stream obtained:", stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraEnabled(true);
        console.log("Camera enabled and video element updated");
        
        // Simulate face detection with a delay
        setTimeout(() => {
          setFaceDetected(true);
          toast.success("Camera monitoring started 📹");
        }, 1000);
        
        // Start face detection simulation
        startFaceDetectionSimulation();
      } else {
        console.error("Video ref not available");
        throw new Error("Video element not ready");
      }
    } catch (error) {
      console.error("Camera error:", error);
      
      // Provide specific error messages
      if (error.name === 'NotAllowedError') {
        toast.error("Camera permission denied. You can continue without camera monitoring.");
        // Allow session to continue without camera
        setFaceDetected(true); // Simulate face detection for demo
      } else if (error.name === 'NotFoundError') {
        toast.error("No camera found. You can continue without camera monitoring.");
        setFaceDetected(true); // Simulate face detection for demo
      } else if (error.name === 'NotReadableError') {
        toast.error("Camera is being used by another application. You can continue without camera monitoring.");
        setFaceDetected(true); // Simulate face detection for demo
      } else {
        toast.error(`Camera error: ${error.message}. You can continue without camera monitoring.`);
        setFaceDetected(true); // Simulate face detection for demo
      }
      
      setCameraEnabled(false);
    }
  };

  const startFaceDetectionSimulation = () => {
    // Simulate face detection with random intervals
    const detectionInterval = setInterval(() => {
      if (!cameraEnabled) {
        clearInterval(detectionInterval);
        return;
      }
      
      // Simulate face detection (90% chance of detection)
      const isDetected = Math.random() > 0.1;
      setFaceDetected(isDetected);
      
      if (!isDetected && currentMode === "study") {
        // Show warning if face not detected during study
        toast.warning("Please position yourself in front of the camera", {
          duration: 2000
        });
      }
    }, 3000); // Check every 3 seconds
    
    // Store interval ID for cleanup
    streamRef.current?.getTracks().forEach(track => {
      if (track.kind === 'video') {
        track.addEventListener('ended', () => clearInterval(detectionInterval));
      }
    });
  };

  const stopCamera = () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        streamRef.current = null;
        setCameraEnabled(false);
        setFaceDetected(false);
      }
    } catch (error) {
      console.error("Error stopping camera:", error);
    }
  };

  const startSession = async () => {
    if (sessionPlan.length === 0) {
      toast.error("Please create a session plan first");
      return;
    }
    
    try {
      // Start camera monitoring
      await startCamera();
      
      // Reset all session state
      setIsSessionActive(true);
      setCurrentPhaseIndex(0);
      setActualStudyTime(0);
      setActualBreakTime(0);
      setSessionStartTime(Date.now());
      
      // Start with first phase
      const firstPhase = sessionPlan[0];
      setCurrentMode(firstPhase.type);
      setTimeLeft(firstPhase.duration * 60); // Convert minutes to seconds
      setIsRunning(true);
      
      toast.success(`Focus session started! Phase 1 of ${sessionPlan.length} - ${firstPhase.type === "study" ? "📚 Study Time" : "🎮 Break Time"} 🚀`);
    } catch (error) {
      console.error("Error starting session:", error);
      toast.error("Failed to start session. Please try again.");
    }
  };

  const stopSession = () => {
    try {
      // Calculate actual time spent in current mode
      if (sessionStartTime) {
        const timeSpent = Math.floor((Date.now() - sessionStartTime) / 60000); // minutes
        if (currentMode === "study") {
          setActualStudyTime(prev => prev + timeSpent);
        } else {
          setActualBreakTime(prev => prev + timeSpent);
        }
      }
      
      // Save session data
      saveSession();
      
      // Clean up session state
      setIsRunning(false);
      setIsSessionActive(false);
      stopCamera();
      setTimeLeft(0);
      setCurrentMode("study");
      setShowModeSwitchConfirmation(false);
      setPendingModeSwitch(null);
      setShowBreakReminder(false);
      setExtendSession(false);
      setFaceDetected(false);
      
      toast.success("Session stopped and saved!");
    } catch (error) {
      console.error("Error stopping session:", error);
      toast.error("Error saving session data");
    }
  };


  useEffect(() => {
    let interval;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const newTimeLeft = prev - 1;
          
          // Handle timer completion
          if (newTimeLeft <= 0) {
            handlePhaseComplete();
            return 0;
          }
          
          return newTimeLeft;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, currentPhaseIndex, sessionPlan]);

  const handlePhaseComplete = () => {
    // Record actual time spent in current phase
    if (sessionStartTime) {
      const timeSpent = Math.floor((Date.now() - sessionStartTime) / 60000);
      if (currentMode === "study") {
        setActualStudyTime(prev => prev + timeSpent);
      } else {
        setActualBreakTime(prev => prev + timeSpent);
      }
    }
    
    // Check if there are more phases
    const nextPhaseIndex = currentPhaseIndex + 1;
    if (nextPhaseIndex < sessionPlan.length) {
      // Move to next phase
      const nextPhase = sessionPlan[nextPhaseIndex];
      setCurrentPhaseIndex(nextPhaseIndex);
      setCurrentMode(nextPhase.type);
      setTimeLeft(nextPhase.duration * 60);
      setSessionStartTime(Date.now());
      
      const phaseType = nextPhase.type === "study" ? "📚 Study Time" : "🎮 Break Time";
      toast.success(`Phase ${nextPhaseIndex + 1} of ${sessionPlan.length} - ${phaseType} 🚀`);
    } else {
      // All phases complete
      setIsRunning(false);
      setIsSessionActive(false);
      stopCamera();
      saveSession();
      toast.success("All phases complete! Great work! 🎉");
    }
  };

  // Cleanup camera and intervals on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      // Clear any remaining intervals
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          if (track.kind === 'video') {
            track.stop();
          }
        });
      }
    };
  }, []);

  const saveSession = () => {
    try {
      const sessions = JSON.parse(localStorage.getItem("focus_sessions") || "[]");
      
      // Calculate final actual times including current phase
      const finalActualStudyTime = actualStudyTime + (currentMode === "study" && sessionStartTime ? 
        Math.floor((Date.now() - sessionStartTime) / 60000) : 0);
      const finalActualBreakTime = actualBreakTime + (currentMode === "break" && sessionStartTime ? 
        Math.floor((Date.now() - sessionStartTime) / 60000) : 0);
      
      const sessionData = {
        type: "focus",
        studyTimeHours: parentSettings.studyTimeHours,
        breakTimeHours: parentSettings.breakTimeHours,
        totalStudyTime: totalStudyTime,
        totalBreakTime: totalBreakTime,
        actualStudyTime: finalActualStudyTime,
        actualBreakTime: finalActualBreakTime,
        totalPhases: sessionPlan.length,
        completedPhases: currentPhaseIndex + 1,
        sessionPlan: sessionPlan,
        timestamp: new Date().toISOString(),
        totalDuration: finalActualStudyTime + finalActualBreakTime
      };
      
      sessions.push(sessionData);
      localStorage.setItem("focus_sessions", JSON.stringify(sessions));
      
      // Update available break time
      const currentBreakTime = parseInt(localStorage.getItem("available_break_time") || "0");
      localStorage.setItem("available_break_time", (currentBreakTime + finalActualBreakTime).toString());
      
      console.log("Session saved:", sessionData);
    } catch (error) {
      console.error("Error saving session:", error);
      toast.error("Failed to save session data");
    }
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
                <Label htmlFor="totalTimeMinutes" className="text-gray-700 font-medium">Total Time (minutes)</Label>
                <div className="flex gap-2">
                  <Input
                    id="totalTimeMinutes"
                    type="number"
                    step="5"
                    placeholder="e.g., 90"
                    value={totalTimeMinutes}
                    onChange={(e) => setTotalTimeMinutes(String(e.target.value))}
                    className="h-12 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 rounded-lg"
                    min="1"
                    max="240"
                  />
                  <Button onClick={createSessionPlan} className="h-12 bg-blue-600 hover:bg-blue-700 text-white">
                    Create Plan
                  </Button>
                </div>
                
                {/* Parent Settings Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">⚙️ Parent Settings:</h4>
                  <div className="text-xs text-blue-700 space-y-1">
                    <p>• <strong>Study Time:</strong> {Math.round(parentSettings.studyTimeHours * 60)} minutes per phase</p>
                    <p>• <strong>Break Time:</strong> {Math.round(parentSettings.breakTimeHours * 60)} minutes per phase</p>
                    <p>• <strong>Total Cycle:</strong> {Math.round((parentSettings.studyTimeHours + parentSettings.breakTimeHours) * 60)} minutes</p>
                    <p className="text-blue-600 mt-2">💡 Your session will alternate between these parent-set times</p>
                  </div>
                </div>
              </div>

              {/* Session Plan Display */}
              {sessionPlan.length > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-orange-50 border-orange-200">
                      <CardContent className="p-6 text-center">
                        <p className="text-sm text-gray-600 mb-2">📚 Total Study Time</p>
                        <div className="text-4xl font-bold text-orange-600 mb-2">
                          {Math.round(totalStudyTime)}
                        </div>
                        <p className="text-sm text-gray-600">minutes</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-6 text-center">
                        <p className="text-sm text-gray-600 mb-2">🎮 Total Break Time</p>
                        <div className="text-4xl font-bold text-green-600 mb-2">
                          {Math.round(totalBreakTime)}
                        </div>
                        <p className="text-sm text-gray-600">minutes</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Session Plan Details */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">📋 Your Session Plan:</h4>
                    <div className="space-y-2">
                      {sessionPlan.map((phase, index) => (
                        <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                          phase.type === "study" ? "bg-orange-50 border border-orange-200" : "bg-green-50 border border-green-200"
                        }`}>
                          <div className="flex items-center gap-3">
                            <span className="text-lg">
                              {phase.type === "study" ? "📚" : "🎮"}
                            </span>
                            <div>
                              <p className="font-medium text-gray-800">
                                {phase.type === "study" ? "Study Time" : "Break Time"}
                              </p>
                              <p className="text-sm text-gray-600">Phase {index + 1}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">
                              {Math.round(phase.duration)} min
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 mt-3">
                      Total: {Math.round(totalStudyTime + totalBreakTime)} minutes across {sessionPlan.length} phases
                    </p>
                  </div>
                </div>
              )}

              {/* Start Button */}
              {sessionPlan.length > 0 && (
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
                        onLoadedMetadata={() => console.log("Video metadata loaded")}
                        onError={(e) => console.error("Video error:", e)}
                      />
                      <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        Monitoring
                      </div>
                      <div className={`absolute top-4 right-4 flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                        faceDetected ? "bg-green-500 text-white" : "bg-yellow-500 text-white"
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          faceDetected ? "bg-white" : "bg-white animate-pulse"
                        }`} />
                        {faceDetected ? "Face Detected" : "Looking for Face"}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-4">
                      <CameraOff className="h-12 w-12 mb-4" />
                      <p className="text-sm font-medium mb-2">Camera not available</p>
                      <div className="text-xs text-center space-y-1 mb-4">
                        <p>• Grant camera permission when prompted</p>
                        <p>• Make sure you're using HTTPS or localhost</p>
                        <p>• Close other camera applications</p>
                        <p>• Refresh the page if needed</p>
                      </div>
                      <Button 
                        onClick={() => {
                          setFaceDetected(true);
                          toast.success("Continuing without camera monitoring");
                        }}
                        variant="outline" 
                        size="sm"
                        className="text-xs"
                      >
                        Continue Without Camera
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>


            {/* Face Detection Warning */}
            {!faceDetected && currentMode === "study" && (
              <Card className="bg-yellow-50 border-yellow-200 shadow-lg animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">👤</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-yellow-800 mb-2">Face Not Detected!</h4>
                      <p className="text-sm text-yellow-700 mb-3">
                        Please position yourself in front of the camera for proper monitoring during study time.
                      </p>
                      <Button 
                        size="sm" 
                        onClick={() => setFaceDetected(true)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                      >
                        I'm Here - Continue Monitoring
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
                    {currentMode === "study" ? "📚 Study Mode" : "🎮 Break Mode"}
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
                  <p className="text-sm text-blue-600 mt-2">
                    Phase {currentPhaseIndex + 1} of {sessionPlan.length}
                  </p>
                </div>

                {/* Progress Indicator */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Current Phase Progress</span>
                    <span>
                      {Math.floor((sessionPlan[currentPhaseIndex]?.duration * 60 - timeLeft) / 60)} / {Math.round(sessionPlan[currentPhaseIndex]?.duration || 0)} min
                    </span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        currentMode === "study" ? "bg-orange-500" : "bg-green-500"
                      }`}
                      style={{
                        width: `${sessionPlan[currentPhaseIndex] ? 
                          ((sessionPlan[currentPhaseIndex].duration * 60 - timeLeft) / (sessionPlan[currentPhaseIndex].duration * 60)) * 100 : 0
                        }%`
                      }}
                    />
                  </div>
                  
                  {/* Overall Progress */}
                  <div className="flex justify-between text-sm text-gray-600 mt-3">
                    <span>Overall Progress</span>
                    <span>{currentPhaseIndex + 1} / {sessionPlan.length} phases</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all"
                      style={{
                        width: `${((currentPhaseIndex + 1) / sessionPlan.length) * 100}%`
                      }}
                    />
                  </div>
                </div>

                {/* Session Plan Overview */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-3">📋 Session Plan Overview:</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {sessionPlan.map((phase, index) => (
                      <div key={index} className={`p-2 rounded-lg text-center text-xs ${
                        index < currentPhaseIndex ? "bg-green-100 text-green-800" :
                        index === currentPhaseIndex ? (currentMode === "study" ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800") :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        <div className="font-medium">
                          {phase.type === "study" ? "📚" : "🎮"}
                        </div>
                        <div className="text-xs">
                          {Math.round(phase.duration)}m
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    💡 Green = Completed • Orange = Current Study • Gray = Upcoming
                  </p>
                </div>

                {/* Automatic Mode Indicator */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">🔄 Automatic Phase Switching</h4>
                  <p className="text-xs text-blue-600 mb-3">
                    The system will automatically switch between Study and Break phases based on your parent's settings.
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                      currentMode === "study" 
                        ? "bg-orange-100 text-orange-800 border border-orange-200" 
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      <span className="text-lg">📚</span>
                      <span className="text-sm font-medium">Study Phase</span>
                    </div>
                    <div className="text-gray-400">→</div>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                      currentMode === "break" 
                        ? "bg-green-100 text-green-800 border border-green-200" 
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      <span className="text-lg">🎮</span>
                      <span className="text-sm font-medium">Break Phase</span>
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
                    {currentMode === "study" ? "📚 Study Phase..." : "🎮 Break Phase..."}
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
