import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Camera, CameraOff, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import Webcam from "react-webcam";
import * as tf from "@tensorflow/tfjs";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";

const Focus = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const sessionSavedRef = useRef(false); // Flag to prevent duplicate saving
  const audioContextRef = useRef(null);
  const lastBeepTimeRef = useRef(0);
  const faceDetectorRef = useRef(null);
  const canvasRef = useRef(null);

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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [completionStats, setCompletionStats] = useState(null);
  const [isSessionPlanExpanded, setIsSessionPlanExpanded] = useState(false);
  const [showNavigationWarning, setShowNavigationWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [noFaceDetectedTime, setNoFaceDetectedTime] = useState(0);
  const [lastFaceDetectionTime, setLastFaceDetectionTime] = useState(Date.now());


  // Load parent settings and initialize face detection model on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("parent_settings");
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setParentSettings(settings);
    }

    // Initialize audio context
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();

    // Mobile-specific optimizations
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      // Prevent zoom on input focus for mobile
      const viewport = document.querySelector('meta[name=viewport]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      }
      
      // Add mobile-specific CSS class
      document.body.classList.add('mobile-device');
    }

    // Load face detection model
    const loadFaceDetectionModel = async () => {
      try {
        console.log("Loading face detection model...");
        toast.info("Loading face detection AI model...");
        await tf.ready();
        const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
        const detectorConfig = {
          runtime: 'tfjs',
          refineLandmarks: false,
          maxFaces: 1,
          // Mobile-optimized settings
          modelUrl: undefined, // Use default model
          enableSmoothing: true,
          enableSegmentation: false
        };
        faceDetectorRef.current = await faceLandmarksDetection.createDetector(model, detectorConfig);
        setIsModelLoaded(true);
        console.log("Face detection model loaded successfully");
        toast.success("Face detection model ready!");
      } catch (error) {
        console.error("Error loading face detection model:", error);
        setIsModelLoaded(false);
        toast.error("Failed to load face detection model. Using fallback detection.");
      }
    };

    loadFaceDetectionModel();
  }, []);

  // Sound/Beep functions
  const playBeep = useCallback((frequency = 800, duration = 200, type = 'sine') => {
    try {
      if (!audioContextRef.current) return;

      // Prevent too frequent beeps (debounce)
      const now = Date.now();
      if (now - lastBeepTimeRef.current < 100) return;
      lastBeepTimeRef.current = now;

      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration / 1000);

      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + duration / 1000);
    } catch (error) {
      console.error("Error playing beep:", error);
    }
  }, []);

  const playSuccessSound = useCallback(() => {
    // Play a pleasant success melody
    playBeep(523, 150); // C
    setTimeout(() => playBeep(659, 150), 150); // E
    setTimeout(() => playBeep(784, 300), 300); // G
  }, [playBeep]);

  const playWarningSound = useCallback(() => {
    // Play a warning beep
    playBeep(400, 100);
    setTimeout(() => playBeep(400, 100), 150);
  }, [playBeep]);

  const playPhaseChangeSound = useCallback(() => {
    // Play a gentle phase change notification
    playBeep(600, 200);
    setTimeout(() => playBeep(800, 200), 250);
  }, [playBeep]);

  const createSessionPlan = () => {
    const totalMinutes = parseInt(totalTimeMinutes);

    // Validate input
    if (!totalTimeMinutes || totalTimeMinutes === "" || isNaN(totalMinutes)) {
      toast.error("Please enter a valid time");
      return;
    }

    if (totalMinutes <= 0) {
      toast.error("Time must be greater than 0 minutes");
      return;
    }

    if (totalMinutes > 240) {
      toast.error("Maximum time limit is 240 minutes (4 hours)");
      return;
    }

    // Validate parent settings
    if (!parentSettings.studyTimeHours || !parentSettings.breakTimeHours) {
      toast.error("Parent settings are not configured properly");
      return;
    }

    const studyMinutes = Math.round(parentSettings.studyTimeHours * 60);
    const breakMinutes = Math.round(parentSettings.breakTimeHours * 60);

    // Check if total time is too short for even one phase
    if (totalMinutes < Math.min(studyMinutes, breakMinutes)) {
      toast.error(`Minimum time needed: ${Math.min(studyMinutes, breakMinutes)} minutes for one phase`);
      return;
    }

    // Create session plan
    const plan = [];
    let remainingTime = totalMinutes;
    let phaseIndex = 0;

    // Safety limit to prevent infinite loops
    const maxPhases = Math.ceil(totalMinutes / Math.min(1, Math.min(studyMinutes, breakMinutes))) + 5;
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
        // Add partial study phase with at least 1 minute
        plan.push({
          type: "study",
          duration: Math.max(1, remainingTime),
          index: phaseIndex++
        });
        remainingTime = 0;
        break; // No time left for break
      }

      // Add break phase if there's time left and it makes sense
      if (remainingTime >= breakMinutes) {
        plan.push({
          type: "break",
          duration: breakMinutes,
          index: phaseIndex++
        });
        remainingTime -= breakMinutes;
      } else if (remainingTime > 0) {
        // Only add partial break if it's at least 1 minute
        if (remainingTime >= 1) {
          plan.push({
            type: "break",
            duration: Math.max(1, remainingTime),
            index: phaseIndex++
          });
        }
        remainingTime = 0;
      }
    }

    if (plan.length === 0) {
      toast.error("Unable to create session plan. Please check your settings.");
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
      console.log("Starting camera with Webcam component...");
      
      // Check if we're on HTTPS or localhost (localhost allows camera on HTTP)
      const isSecure = window.location.protocol === 'https:' ||
                       window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.startsWith('192.168.') ||
                       window.location.hostname.startsWith('10.') ||
                       window.location.hostname.startsWith('172.');

      console.log("Connection secure:", isSecure);
      console.log("Protocol:", window.location.protocol);
      console.log("Hostname:", window.location.hostname);

      // Check if mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      console.log("Mobile device detected:", isMobile);

      if (!isSecure) {
        console.warn("Camera may not work on non-secure connections. Consider using HTTPS or localhost.");
      }

      if (isMobile) {
        console.log("Mobile device detected - using mobile-optimized camera settings");
        toast.info("📱 Mobile camera mode activated");
      }

      // Enable camera - the Webcam component will handle the rest
      setCameraEnabled(true);
      console.log("Camera enabled - Webcam component will handle stream acquisition");
      
    } catch (error) {
      console.error("Camera error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });

      // Provide specific error messages with mobile-specific guidance
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast.error("❌ Camera permission denied. On mobile: Go to browser settings → Site permissions → Camera → Allow");
        console.log("Camera permission was denied by user or browser");
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        toast.error("❌ No camera found on this device. You can continue without camera monitoring.");
        setFaceDetected(true); // Simulate face detection for demo
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        toast.error("❌ Camera is being used by another app. Close camera apps and try again.");
        console.log("Camera is in use by another application");
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        toast.error("❌ Camera settings not supported. Trying fallback mode...");
        setFaceDetected(true);
      } else if (error.message.includes('secure')) {
        toast.error("❌ Camera requires HTTPS. Use localhost or HTTPS connection.");
        console.log("Insecure connection - camera blocked");
      } else {
        toast.error(`❌ Camera error: ${error.message}. You can continue without camera monitoring.`);
        console.log("Unknown camera error:", error);
      }

      setCameraEnabled(false);
    }
  };

  const startFaceDetectionSimulation = () => {
    // Clear any existing interval first
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    // Use real face detection if model is loaded, otherwise fallback to simulation
    if (faceDetectorRef.current && videoRef.current) {
      console.log("Starting real-time face detection...");

      const detectFaces = async () => {
        try {
          if (!videoRef.current || !faceDetectorRef.current) return;

          // Get the video element from the Webcam component
          const videoElement = videoRef.current.video;
          if (!videoElement) {
            console.log("Video element not ready yet");
            return;
          }

          // Check if video is ready and has dimensions
          if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
            console.log("Video not ready - no dimensions");
            return;
          }

          // Detect faces in the video with mobile-optimized settings
          const faces = await faceDetectorRef.current.estimateFaces(videoElement, {
            flipHorizontal: false,
            predictIrisesAndPupils: false,
            refineLandmarks: false
          });

          const isDetected = faces && faces.length > 0;
          const currentTime = Date.now();
          
          if (isDetected) {
            // Face detected - reset counters
            setFaceDetected(true);
            setNoFaceDetectedTime(0);
            setLastFaceDetectionTime(currentTime);
          } else {
            // No face detected - track time
            setFaceDetected(false);
            const timeSinceLastDetection = Math.floor((currentTime - lastFaceDetectionTime) / 1000);
            setNoFaceDetectedTime(timeSinceLastDetection);
          }

          // Draw face landmarks on canvas if available
          if (canvasRef.current && faces.length > 0) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const video = videoElement;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw bounding box for detected face
            faces.forEach(face => {
              const keypoints = face.keypoints;
              if (keypoints && keypoints.length > 0) {
                // Calculate bounding box
                const xCoords = keypoints.map(kp => kp.x);
                const yCoords = keypoints.map(kp => kp.y);
                const minX = Math.min(...xCoords);
                const maxX = Math.max(...xCoords);
                const minY = Math.min(...yCoords);
                const maxY = Math.max(...yCoords);

                // Draw rectangle
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 3;
                ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);

                // Draw text
                ctx.fillStyle = '#00ff00';
                ctx.font = '16px Arial';
                ctx.fillText('Face Detected', minX, minY - 10);
              }
            });
          }

          // Show warnings based on how long no face has been detected
          if (!isDetected && currentMode === "study") {
            const noFaceTime = Math.floor((currentTime - lastFaceDetectionTime) / 1000);
            
            if (noFaceTime >= 10 && noFaceTime < 15) {
              // First warning after 10 seconds
              playWarningSound();
              toast.warning("⚠️ No face detected for 10 seconds. Please position yourself in front of the camera", {
                duration: 3000
              });
            } else if (noFaceTime >= 20 && noFaceTime < 25) {
              // Second warning after 20 seconds
              playWarningSound();
              toast.error("🚨 No face detected for 20 seconds! Please return to your study position", {
                duration: 4000
              });
            } else if (noFaceTime >= 30) {
              // Auto-stop session after 30 seconds
              playWarningSound();
              toast.error("🚨 SESSION STOPPED: No face detected for 30+ seconds. Session automatically stopped.", {
                duration: 8000
              });
              
              // Stop the session automatically
              setTimeout(() => {
                stopSession("auto_stop_no_face");
              }, 2000); // Give user 2 seconds to see the message
            }
          }
        } catch (error) {
          console.error("Face detection error:", error);
        }
      };

      // Run detection every 3 seconds (more mobile-friendly)
      detectionIntervalRef.current = setInterval(detectFaces, 3000);

      // Run first detection after a delay to ensure video is ready
      setTimeout(() => {
        detectFaces();
      }, 1500);
    } else {
      console.log("Using fallback face detection simulation...");

      // Fallback to simulation if model not loaded
      detectionIntervalRef.current = setInterval(() => {
        // Simulate face detection (90% chance of detection)
        const isDetected = Math.random() > 0.1;
        const currentTime = Date.now();
        
        if (isDetected) {
          // Face detected - reset counters
          setFaceDetected(true);
          setNoFaceDetectedTime(0);
          setLastFaceDetectionTime(currentTime);
        } else {
          // No face detected - track time
          setFaceDetected(false);
          const timeSinceLastDetection = Math.floor((currentTime - lastFaceDetectionTime) / 1000);
          setNoFaceDetectedTime(timeSinceLastDetection);
        }

        // Show warnings based on how long no face has been detected
        if (!isDetected && currentMode === "study") {
          const noFaceTime = Math.floor((currentTime - lastFaceDetectionTime) / 1000);
          
          if (noFaceTime >= 10 && noFaceTime < 15) {
            // First warning after 10 seconds
            playWarningSound();
            toast.warning("⚠️ No face detected for 10 seconds. Please position yourself in front of the camera", {
              duration: 3000
            });
          } else if (noFaceTime >= 20 && noFaceTime < 25) {
            // Second warning after 20 seconds
            playWarningSound();
            toast.error("🚨 No face detected for 20 seconds! Please return to your study position", {
              duration: 4000
            });
          } else if (noFaceTime >= 30) {
            // Auto-stop session after 30 seconds
            playWarningSound();
            toast.error("🚨 SESSION STOPPED: No face detected for 30+ seconds. Session automatically stopped.", {
              duration: 8000
            });
            
            // Stop the session automatically
            setTimeout(() => {
              stopSession("auto_stop_no_face");
            }, 2000); // Give user 2 seconds to see the message
          }
        }
      }, 3000); // Check every 3 seconds
    }
  };

  const stopCamera = useCallback(() => {
    try {
      // Clear face detection interval
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }

      // Stop camera and reset state
      setCameraEnabled(false);
      setFaceDetected(false);
      
      // The Webcam component will handle stopping the stream automatically
      console.log("Camera stopped");
    } catch (error) {
      console.error("Error stopping camera:", error);
    }
  }, []);

  const startSession = async () => {
    if (sessionPlan.length === 0) {
      toast.error("Please create a session plan first");
      return;
    }

    try {
      // Start camera monitoring
      await startCamera();

      // Reset all session state
      sessionSavedRef.current = false; // Reset save flag for new session
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

      // Play start sound
      playPhaseChangeSound();

      toast.success(`Focus session started! Phase 1 of ${sessionPlan.length} - ${firstPhase.type === "study" ? "📚 Study Time" : "🎮 Break Time"} 🚀`);
    } catch (error) {
      console.error("Error starting session:", error);
      toast.error("Failed to start session. Please try again.");
    }
  };

  const saveSession = useCallback((status = "completed", isSuddenClosure = false) => {
    try {
      // Prevent duplicate saving
      if (sessionSavedRef.current) {
        console.log("Session already saved, skipping duplicate save");
        return;
      }

      sessionSavedRef.current = true;

      const sessions = JSON.parse(localStorage.getItem("focus_sessions") || "[]");

      // Calculate final actual times including current phase
      const finalActualStudyTime = actualStudyTime + (currentMode === "study" && sessionStartTime ?
        Math.floor((Date.now() - sessionStartTime) / 60000) : 0);
      const finalActualBreakTime = actualBreakTime + (currentMode === "break" && sessionStartTime ?
        Math.floor((Date.now() - sessionStartTime) / 60000) : 0);

      // Determine if session was properly completed
      const isProperlyCompleted = status === "completed" &&
        currentPhaseIndex >= sessionPlan.length - 1;

      console.log("Session status debug:", {
        status,
        currentPhaseIndex,
        totalPhases: sessionPlan.length,
        isProperlyCompleted,
        finalStatus: isProperlyCompleted ? "completed" : "cancelled",
        isSuddenClosure
      });

      const sessionData = {
        type: isSuddenClosure ? "focus_sudden_closure" : "focus",
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
        totalDuration: finalActualStudyTime + finalActualBreakTime,
        status: status === "auto_stopped_no_face" ? "auto_stopped_no_face" : 
                 isProperlyCompleted ? "completed" : "cancelled",
        completionPercentage: Math.round(((currentPhaseIndex + 1) / sessionPlan.length) * 100),
        cancellationReason: status === "auto_stopped_no_face" ? "No face detected for 30+ seconds" : null
      };

      sessions.push(sessionData);
      localStorage.setItem("focus_sessions", JSON.stringify(sessions));

      // Update available break time only for completed sessions
      if (isProperlyCompleted) {
        const currentBreakTime = parseInt(localStorage.getItem("available_break_time") || "0");
        localStorage.setItem("available_break_time", (currentBreakTime + finalActualBreakTime).toString());
      }

      console.log("Session saved:", sessionData);
    } catch (error) {
      console.error("Error saving session:", error);
      toast.error("Failed to save session data");
    }
  }, [actualStudyTime, actualBreakTime, currentMode, sessionStartTime, parentSettings, totalStudyTime, totalBreakTime, sessionPlan, currentPhaseIndex]);

  const stopSession = useCallback((reason = "manual") => {
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
      
      // Save session data with appropriate status
      const sessionStatus = reason === "auto_stop_no_face" ? "auto_stopped_no_face" : 
                           reason === "manual" ? "cancelled" : "completed";
      saveSession(sessionStatus);
      
      // Clean up session state
      setIsRunning(false);
      setIsSessionActive(false);
      stopCamera();
      setTimeLeft(0);
      setCurrentMode("study");
      setFaceDetected(false);
      setNoFaceDetectedTime(0);
      
      // Show appropriate message based on reason
      if (reason === "auto_stop_no_face") {
        toast.error("Session automatically stopped due to no face detection!");
      } else {
        toast.success("Session stopped and saved!");
      }
    } catch (error) {
      console.error("Error stopping session:", error);
      toast.error("Error saving session data");
    }
  }, [sessionStartTime, currentMode, saveSession, stopCamera]);

  const handlePhaseComplete = useCallback(() => {
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

      // Play phase change sound
      playPhaseChangeSound();

      const phaseType = nextPhase.type === "study" ? "📚 Study Time" : "🎮 Break Time";
      toast.success(`Phase ${nextPhaseIndex + 1} of ${sessionPlan.length} - ${phaseType} 🚀`);
    } else {
      // All phases complete - stop timer first to prevent re-entry
      setIsRunning(false);
      console.log("All phases completed, calling stopSession with 'completed' reason");

      // Play success sound
      playSuccessSound();

      // Calculate final stats
      const finalStudyTime = actualStudyTime + (currentMode === "study" ? Math.floor((Date.now() - sessionStartTime) / 60000) : 0);
      const finalBreakTime = actualBreakTime + (currentMode === "break" ? Math.floor((Date.now() - sessionStartTime) / 60000) : 0);

      // Use setTimeout to ensure state updates complete before stopping
      setTimeout(() => {
        stopSession("completed");

        // Show success modal with stats
        setCompletionStats({
          totalPhases: sessionPlan.length,
          studyTime: finalStudyTime,
          breakTime: finalBreakTime,
          totalTime: finalStudyTime + finalBreakTime
        });
        setShowSuccessModal(true);
      }, 100);
    }
  }, [sessionStartTime, currentMode, currentPhaseIndex, sessionPlan, stopSession, actualStudyTime, actualBreakTime, playPhaseChangeSound, playSuccessSound]);

  useEffect(() => {
    let interval;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const newTimeLeft = prev - 1;

          // Play countdown beeps for last 10 seconds
          if (newTimeLeft <= 10 && newTimeLeft > 0) {
            if (newTimeLeft <= 3) {
              // More urgent beep for last 3 seconds
              playBeep(1000, 150);
            } else {
              // Gentle beep for 10-4 seconds
              playBeep(600, 100);
            }
          }

          // Handle timer completion
          if (newTimeLeft <= 0) {
            handlePhaseComplete();
            return 0;
          }

          return newTimeLeft;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, timeLeft, handlePhaseComplete, playBeep]);

  // Track sudden session closures
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isSessionActive && isRunning && !sessionSavedRef.current) {
        // Calculate exact time spent before sudden closure
        const currentTime = Date.now();
        const timeSpent = Math.floor((currentTime - sessionStartTime) / 1000); // seconds
        const timeSpentMinutes = Math.floor(timeSpent / 60);

        // Save sudden closure data
        const suddenClosureData = {
          type: "sudden_closure",
          sessionStartTime: sessionStartTime,
          closureTime: currentTime,
          timeSpentSeconds: timeSpent,
          timeSpentMinutes: timeSpentMinutes,
          currentMode: currentMode,
          currentPhaseIndex: currentPhaseIndex,
          totalPhases: sessionPlan.length,
          actualStudyTime: actualStudyTime + (currentMode === "study" ? timeSpentMinutes : 0),
          actualBreakTime: actualBreakTime + (currentMode === "break" ? timeSpentMinutes : 0),
          timestamp: new Date().toISOString(),
          wasActive: true
        };

        // Save to localStorage immediately
        try {
          sessionSavedRef.current = true; // Mark as saved to prevent duplicates

          const suddenClosures = JSON.parse(localStorage.getItem("sudden_closures") || "[]");
          suddenClosures.push(suddenClosureData);
          localStorage.setItem("sudden_closures", JSON.stringify(suddenClosures));

          // Save as a special session record (only one entry, not duplicate)
          const sessions = JSON.parse(localStorage.getItem("focus_sessions") || "[]");
          const sessionData = {
            type: "focus_sudden_closure",
            studyTimeHours: parentSettings.studyTimeHours,
            breakTimeHours: parentSettings.breakTimeHours,
            totalStudyTime: totalStudyTime,
            totalBreakTime: totalBreakTime,
            actualStudyTime: actualStudyTime + (currentMode === "study" ? timeSpentMinutes : 0),
            actualBreakTime: actualBreakTime + (currentMode === "break" ? timeSpentMinutes : 0),
            totalPhases: sessionPlan.length,
            completedPhases: currentPhaseIndex + 1,
            sessionPlan: sessionPlan,
            timestamp: new Date().toISOString(),
            totalDuration: timeSpentMinutes,
            status: "cancelled",
            completionPercentage: Math.round(((currentPhaseIndex + 1) / sessionPlan.length) * 100),
            currentMode: currentMode,
            currentPhaseIndex: currentPhaseIndex
          };
          sessions.push(sessionData);
          localStorage.setItem("focus_sessions", JSON.stringify(sessions));
        } catch (error) {
          console.error("Error saving sudden closure data:", error);
        }

        // Show warning to user
        event.preventDefault();
        event.returnValue = "Are you sure you want to leave? Your session will be marked as suddenly closed.";
        return "Are you sure you want to leave? Your session will be marked as suddenly closed.";
      }
    };

    const handleVisibilityChange = () => {
      if (isSessionActive && isRunning && document.hidden) {
        // Session is still active but tab is hidden - this might be a sudden closure
        console.log("Session tab became hidden while active");
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSessionActive, isRunning, sessionStartTime, currentMode, currentPhaseIndex, sessionPlan, actualStudyTime, actualBreakTime, totalStudyTime, totalBreakTime, parentSettings.studyTimeHours, parentSettings.breakTimeHours]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Custom navigation blocker using popstate and click handlers
  useEffect(() => {
    if (!isSessionActive || !isRunning) return;

    // Handle back/forward browser navigation
    const handlePopState = (event) => {
      event.preventDefault();
      playWarningSound(); // Play warning sound
      setShowNavigationWarning(true);
      setPendingNavigation({ type: 'popstate' });
      // Push current state back to prevent immediate navigation
      window.history.pushState(null, '', window.location.pathname);
    };

    // Handle link clicks
    const handleClick = (event) => {
      // Check if it's a navigation link
      const link = event.target.closest('a, button');
      if (link && !link.classList.contains('no-block')) {
        const href = link.getAttribute('href');
        const onClick = link.getAttribute('onClick');

        // Check if it's a navigation action
        if (href || (onClick && (onClick.includes('navigate') || onClick.includes('history')))) {
          event.preventDefault();
          event.stopPropagation();
          playWarningSound(); // Play warning sound
          setShowNavigationWarning(true);
          setPendingNavigation({ type: 'click', href });
        }
      }
    };

    // Push initial state
    window.history.pushState(null, '', window.location.pathname);

    // Add event listeners
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('click', handleClick, true);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleClick, true);
    };
  }, [isSessionActive, isRunning, playWarningSound]);

  // Handle navigation confirmation
  const handleCancelNavigation = () => {
    setShowNavigationWarning(false);
    setPendingNavigation(null);
    toast.info("Continuing session...");
  };

  const handleConfirmNavigation = () => {
    // Stop and save the session
    stopSession("manual");

    // Reset warning state
    setShowNavigationWarning(false);

    // Allow some time for session to save
    setTimeout(() => {
      if (pendingNavigation) {
        if (pendingNavigation.type === 'popstate') {
          // Go back in history
          window.history.back();
        } else if (pendingNavigation.href) {
          // Navigate to the href
          navigate(pendingNavigation.href);
        } else {
          // Default to home
          navigate('/home');
        }
      }
      setPendingNavigation(null);
    }, 100);

    toast.info("Session cancelled due to navigation");
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

                  {/* Session Plan Details - Smart Display */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">📋 Your Session Plan:</h4>

                    {/* Pattern Summary - Always show for more than 3 phases */}
                    {sessionPlan.length > 3 ? (
                      <div className="space-y-3">
                        {/* Pattern Overview */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm font-medium text-blue-800 mb-2">Session Pattern:</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {sessionPlan.slice(0, 6).map((phase, index) => (
                              <div key={index} className="flex items-center">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  phase.type === "study"
                                    ? "bg-orange-200 text-orange-800"
                                    : "bg-green-200 text-green-800"
                                }`}>
                                  {phase.type === "study" ? "📚" : "🎮"} {Math.round(phase.duration)}m
                                </span>
                                {index < Math.min(sessionPlan.length - 1, 5) && (
                                  <span className="mx-1 text-gray-400">→</span>
                                )}
                              </div>
                            ))}
                            {sessionPlan.length > 6 && (
                              <span className="text-xs text-gray-500">... ({sessionPlan.length - 6} more)</span>
                            )}
                          </div>
                        </div>

                        {/* Cycle Summary if pattern repeats */}
                        {(() => {
                          const studyPhases = sessionPlan.filter(p => p.type === "study");
                          const breakPhases = sessionPlan.filter(p => p.type === "break");
                          const hasPattern = studyPhases.length > 1 && breakPhases.length > 1;

                          if (hasPattern) {
                            return (
                              <div className="grid grid-cols-2 gap-2">
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
                                  <p className="text-xs text-orange-600 mb-1">📚 Study Phases</p>
                                  <p className="text-lg font-bold text-orange-800">{studyPhases.length}×</p>
                                  <p className="text-xs text-orange-600">{Math.round(studyPhases[0].duration)}m each</p>
                                </div>
                                <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                                  <p className="text-xs text-green-600 mb-1">🎮 Break Phases</p>
                                  <p className="text-lg font-bold text-green-800">{breakPhases.length}×</p>
                                  <p className="text-xs text-green-600">{Math.round(breakPhases[0].duration)}m each</p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Compact phase list - show first 3 and last 1 if more than 4 phases */}
                        <div className="space-y-2">
                          {sessionPlan.slice(0, 3).map((phase, index) => (
                            <div key={index} className={`flex items-center justify-between p-2 rounded-lg ${
                              phase.type === "study" ? "bg-orange-50 border border-orange-200" : "bg-green-50 border border-green-200"
                            }`}>
                              <div className="flex items-center gap-2">
                                <span className="text-base">{phase.type === "study" ? "📚" : "🎮"}</span>
                                <div>
                                  <p className="text-sm font-medium text-gray-800">
                                    {phase.type === "study" ? "Study" : "Break"} - Phase {index + 1}
                                  </p>
                                </div>
                              </div>
                              <p className="font-bold text-sm">{Math.round(phase.duration)} min</p>
                            </div>
                          ))}

                          {sessionPlan.length > 4 && (
                            <div className="text-center py-2">
                              <p className="text-xs text-gray-500">... {sessionPlan.length - 4} more phases ...</p>
                            </div>
                          )}

                          {sessionPlan.length > 3 && (
                            <div className={`flex items-center justify-between p-2 rounded-lg ${
                              sessionPlan[sessionPlan.length - 1].type === "study"
                                ? "bg-orange-50 border border-orange-200"
                                : "bg-green-50 border border-green-200"
                            }`}>
                              <div className="flex items-center gap-2">
                                <span className="text-base">
                                  {sessionPlan[sessionPlan.length - 1].type === "study" ? "📚" : "🎮"}
                                </span>
                                <div>
                                  <p className="text-sm font-medium text-gray-800">
                                    {sessionPlan[sessionPlan.length - 1].type === "study" ? "Study" : "Break"} - Phase {sessionPlan.length}
                                  </p>
                                </div>
                              </div>
                              <p className="font-bold text-sm">
                                {Math.round(sessionPlan[sessionPlan.length - 1].duration)} min
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Show all phases if 3 or fewer */
                      <div className="space-y-2">
                        {sessionPlan.map((phase, index) => (
                          <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                            phase.type === "study" ? "bg-orange-50 border border-orange-200" : "bg-green-50 border border-green-200"
                          }`}>
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{phase.type === "study" ? "📚" : "🎮"}</span>
                              <div>
                                <p className="font-medium text-gray-800">
                                  {phase.type === "study" ? "Study Time" : "Break Time"}
                                </p>
                                <p className="text-sm text-gray-600">Phase {index + 1}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">{Math.round(phase.duration)} min</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-gray-600 mt-3 text-center">
                      📊 Total: {Math.round(totalStudyTime + totalBreakTime)} minutes • {sessionPlan.length} phases
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
                <div className="relative bg-black aspect-video touch-none">
                  {cameraEnabled ? (
                    <>
                      <Webcam
                        ref={videoRef}
                        audio={false}
                        width={640}
                        height={480}
                        className="w-full h-full object-cover"
                        onUserMedia={() => {
                          console.log("Webcam user media loaded");
                          toast.success("Camera monitoring started 📹");
                          // Start face detection after webcam is ready
                          setTimeout(() => {
                            startFaceDetectionSimulation();
                          }, 1000); // Increased delay for mobile
                        }}
                        onUserMediaError={(error) => {
                          console.error("Webcam error:", error);
                          toast.error("Camera access failed. You can continue without monitoring.");
                          setCameraEnabled(false);
                        }}
                        videoConstraints={{
                          facingMode: 'user',
                          width: { 
                            min: 320,
                            ideal: 640,
                            max: 1280
                          },
                          height: { 
                            min: 240,
                            ideal: 480,
                            max: 720
                          },
                          frameRate: { ideal: 15, max: 30 }
                        }}
                        screenshotFormat="image/jpeg"
                        screenshotQuality={0.8}
                        mirrored={true}
                      />
                      <canvas
                        ref={canvasRef}
                        className="absolute top-0 left-0 w-full h-full pointer-events-none"
                        style={{ mixBlendMode: 'normal' }}
                      />
                      <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        {isModelLoaded ? "AI Monitoring" : "Monitoring"}
                      </div>
                      <div className={`absolute top-4 right-4 flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                        faceDetected ? "bg-green-500 text-white" : noFaceDetectedTime > 20 ? "bg-red-500 text-white" : "bg-yellow-500 text-white"
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          faceDetected ? "bg-white" : "bg-white animate-pulse"
                        }`} />
                        {faceDetected ? "✓ Face Detected" : noFaceDetectedTime > 0 ? `⚠ No Face ${noFaceDetectedTime}s` : "⚠ Looking for Face"}
                      </div>
                      {isModelLoaded && (
                        <div className="absolute bottom-4 left-4 bg-blue-500/80 text-white px-2 py-1 rounded text-xs">
                          🤖 TensorFlow.js Active
                        </div>
                      )}
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
                      <div className="space-y-2">
                        <Button 
                          onClick={() => {
                            setFaceDetected(true);
                            toast.success("Continuing without camera monitoring");
                          }}
                          variant="outline" 
                          size="sm"
                          className="text-xs w-full"
                        >
                          Continue Without Camera
                        </Button>
                        <Button 
                          onClick={() => {
                            window.location.reload();
                          }}
                          variant="outline" 
                          size="sm"
                          className="text-xs w-full bg-blue-50 border-blue-200 text-blue-600"
                        >
                          🔄 Retry Camera
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>


            {/* Face Detection Warning */}
            {!faceDetected && currentMode === "study" && (
              <Card className={`shadow-lg animate-pulse ${
                noFaceDetectedTime > 20 ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{noFaceDetectedTime > 20 ? "🚨" : "👤"}</div>
                    <div className="flex-1">
                      <h4 className={`font-semibold mb-2 ${
                        noFaceDetectedTime > 20 ? "text-red-800" : "text-yellow-800"
                      }`}>
                        {noFaceDetectedTime > 20 ? "CRITICAL: No Face Detected!" : "Face Not Detected!"}
                      </h4>
                      <p className={`text-sm mb-3 ${
                        noFaceDetectedTime > 20 ? "text-red-700" : "text-yellow-700"
                      }`}>
                        {noFaceDetectedTime > 0 
                          ? `No face detected for ${noFaceDetectedTime} seconds. Please position yourself in front of the camera for proper monitoring during study time.`
                          : "Please position yourself in front of the camera for proper monitoring during study time."
                        }
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => {
                            setFaceDetected(true);
                            setNoFaceDetectedTime(0);
                            setLastFaceDetectionTime(Date.now());
                          }}
                          className={`${
                            noFaceDetectedTime > 20 
                              ? "bg-red-600 hover:bg-red-700 text-white" 
                              : "bg-yellow-600 hover:bg-yellow-700 text-white"
                          }`}
                        >
                          I'm Here - Continue Monitoring
                        </Button>
                        {noFaceDetectedTime > 20 && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setFaceDetected(true);
                              setNoFaceDetectedTime(0);
                              setLastFaceDetectionTime(Date.now());
                              toast.success("Monitoring resumed - please stay in position!");
                            }}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            Resume Monitoring
                          </Button>
                        )}
                      </div>
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
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-blue-800">📋 Session Plan Overview:</h4>
                    {sessionPlan.length > 6 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsSessionPlanExpanded(!isSessionPlanExpanded)}
                        className="text-xs text-blue-600 hover:text-blue-800 h-auto py-1 px-2"
                      >
                        {isSessionPlanExpanded ? "Show Less ▲" : "Show All ▼"}
                      </Button>
                    )}
                  </div>

                  {/* Compact view for many phases */}
                  {sessionPlan.length > 6 && !isSessionPlanExpanded ? (
                    <div className="space-y-3">
                      {/* Show first 4 phases */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {sessionPlan.slice(0, 4).map((phase, index) => (
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

                      {/* Show ellipsis */}
                      <div className="text-center py-1">
                        <p className="text-xs text-gray-500">... {sessionPlan.length - 6} more phases ...</p>
                      </div>

                      {/* Show last 2 phases */}
                      <div className="grid grid-cols-2 gap-2">
                        {sessionPlan.slice(-2).map((phase, index) => {
                          const actualIndex = sessionPlan.length - 2 + index;
                          return (
                            <div key={actualIndex} className={`p-2 rounded-lg text-center text-xs ${
                              actualIndex < currentPhaseIndex ? "bg-green-100 text-green-800" :
                              actualIndex === currentPhaseIndex ? (currentMode === "study" ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800") :
                              "bg-gray-100 text-gray-600"
                            }`}>
                              <div className="font-medium">
                                {phase.type === "study" ? "📚" : "🎮"}
                              </div>
                              <div className="text-xs">
                                {Math.round(phase.duration)}m
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* Full grid view */
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
                  )}

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
                    className="gap-2 border-red-200 text-red-600 hover:bg-red-50 no-block"
                  >
                    Stop Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Success Completion Modal */}
        {showSuccessModal && completionStats && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-300">
            <Card className="max-w-lg w-full mx-4 shadow-2xl animate-in zoom-in duration-500">
              <CardContent className="p-8">
                {/* Celebration Header */}
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4 animate-bounce">🎉</div>
                  <h2 className="text-3xl font-bold text-green-600 mb-2">
                    Congratulations!
                  </h2>
                  <p className="text-lg text-gray-700">
                    You've successfully completed your focus session!
                  </p>
                </div>

                {/* Stats Cards */}
                <div className="space-y-4 mb-6">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border-2 border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">✅</div>
                        <div>
                          <p className="text-sm text-blue-600 font-medium">Total Phases</p>
                          <p className="text-2xl font-bold text-blue-800">{completionStats.totalPhases}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border-2 border-orange-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">📚</div>
                        <div>
                          <p className="text-sm text-orange-600 font-medium">Study Time</p>
                          <p className="text-2xl font-bold text-orange-800">{completionStats.studyTime} min</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border-2 border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">🎮</div>
                        <div>
                          <p className="text-sm text-green-600 font-medium">Break Time</p>
                          <p className="text-2xl font-bold text-green-800">{completionStats.breakTime} min</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border-2 border-purple-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">⏱️</div>
                        <div>
                          <p className="text-sm text-purple-600 font-medium">Total Session Time</p>
                          <p className="text-2xl font-bold text-purple-800">{completionStats.totalTime} min</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Motivational Message */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-center text-yellow-800 font-medium">
                    🌟 Amazing work! You stayed focused and completed all phases. Keep up the great habit! 🌟
                  </p>
                </div>

                {/* Action Button */}
                <Button
                  onClick={() => {
                    setShowSuccessModal(false);
                    navigate("/home");
                  }}
                  size="lg"
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold text-lg py-6 no-block"
                >
                  Back to Home 🏠
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation Warning Modal */}
        {showNavigationWarning && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in duration-300">
            <Card className="max-w-md w-full mx-4 shadow-2xl animate-in zoom-in duration-300 border-2 border-red-300">
              <CardContent className="p-6">
                {/* Warning Header */}
                <div className="text-center mb-6">
                  <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-red-600 mb-2">
                    Session in Progress!
                  </h2>
                  <p className="text-gray-700">
                    You have an active focus session running.
                  </p>
                </div>

                {/* Warning Message */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="text-xl">⚠️</div>
                    <div className="flex-1">
                      <p className="text-sm text-yellow-800 font-medium mb-2">
                        If you leave this page:
                      </p>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Your current session will be cancelled</li>
                        <li>• Progress will be saved up to this point</li>
                        <li>• The timer will stop immediately</li>
                        <li>• Camera monitoring will end</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Session Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-700">Current Phase:</span>
                    <span className="font-bold text-blue-900">
                      {currentPhaseIndex + 1} of {sessionPlan.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-blue-700">Time Remaining:</span>
                    <span className="font-bold text-blue-900">
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleCancelNavigation}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-white no-block"
                  >
                    Stay Here
                  </Button>
                  <Button
                    onClick={handleConfirmNavigation}
                    variant="outline"
                    size="lg"
                    className="border-red-300 text-red-600 hover:bg-red-50 no-block"
                  >
                    Leave & Cancel
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
