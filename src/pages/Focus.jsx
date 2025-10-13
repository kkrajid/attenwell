import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Camera, CameraOff, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import apiService from "@/services/api";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import logo from "@/assets/attenwell-logo.jpg";

const Focus = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const videoRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const sessionSavedRef = useRef(false);
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
  const [emotion, setEmotion] = useState(null);
  const [attentionLevel, setAttentionLevel] = useState(0);
  const [postureScore, setPostureScore] = useState(0);
  const [useNativeVideo, setUseNativeVideo] = useState(false);
  const nativeVideoRef = useRef(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    if (!isAuthenticated || loading) return;

    const loadParentSettings = async () => {
      try {
        const settingsData = await apiService.getParentSettings();
        setParentSettings({
          studyTimeHours: settingsData.study_time_hours,
          breakTimeHours: settingsData.break_time_hours,
        });
      } catch (error) {
        console.error("Error loading parent settings:", error);
        setParentSettings({ studyTimeHours: 0.5, breakTimeHours: 0.25 });
      }
    };

    loadParentSettings();
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      const viewport = document.querySelector('meta[name=viewport]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      }
      document.body.classList.add('mobile-device');
    }

    const loadFaceDetectionModel = async () => {
      try {
        console.log("Loading face-api.js models...");
        toast.info("Loading AI face detection models...");

        const MODEL_URL = '/models';

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);

        setIsModelLoaded(true);
        console.log("Face-api.js models loaded successfully");
        toast.success("AI face detection ready!");
      } catch (error) {
        console.error("Error loading face detection models:", error);
        setIsModelLoaded(false);
        toast.error("Failed to load face detection models. Using fallback detection.");
      }
    };

    loadFaceDetectionModel();
  }, []);

  const playBeep = useCallback((frequency = 800, duration = 200, type = 'sine') => {
    try {
      if (!audioContextRef.current) return;

      const now = Date.now();
      if (now - lastBeepTimeRef.current < 50) return;
      lastBeepTimeRef.current = now;

      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      const volume = type === 'square' ? 0.6 : 0.3;
      gainNode.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration / 1000);

      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + duration / 1000);
    } catch (error) {
      console.error("Error playing beep:", error);
    }
  }, []);

  const playSuccessSound = useCallback(() => {
    playBeep(523, 150);
    setTimeout(() => playBeep(659, 150), 150);
    setTimeout(() => playBeep(784, 300), 300);
  }, [playBeep]);

  const playWarningSound = useCallback(() => {
    playBeep(600, 200, 'square');
    setTimeout(() => playBeep(600, 200, 'square'), 200);
    setTimeout(() => playBeep(800, 300, 'square'), 400);
  }, [playBeep]);

  const playPhaseChangeSound = useCallback(() => {
    playBeep(600, 200);
    setTimeout(() => playBeep(800, 200), 250);
  }, [playBeep]);

  const createSessionPlan = () => {
    const totalMinutes = parseInt(totalTimeMinutes);

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

    if (!parentSettings.studyTimeHours || !parentSettings.breakTimeHours) {
      toast.error("Parent settings are not configured properly");
      return;
    }

    const studyMinutes = Math.round(parentSettings.studyTimeHours * 60);
    const breakMinutes = Math.round(parentSettings.breakTimeHours * 60);

    if (totalMinutes < Math.min(studyMinutes, breakMinutes)) {
      toast.error(`Minimum time needed: ${Math.min(studyMinutes, breakMinutes)} minutes for one phase`);
      return;
    }

    const plan = [];
    let remainingTime = totalMinutes;
    let phaseIndex = 0;

    const maxPhases = Math.ceil(totalMinutes / Math.min(1, Math.min(studyMinutes, breakMinutes))) + 5;
    let phaseCount = 0;

    while (remainingTime > 0 && phaseCount < maxPhases) {
      phaseCount++;

      if (remainingTime >= studyMinutes) {
        plan.push({
          type: "study",
          duration: studyMinutes,
          index: phaseIndex++
        });
        remainingTime -= studyMinutes;
      } else if (remainingTime > 0) {
        plan.push({
          type: "study",
          duration: Math.max(1, remainingTime),
          index: phaseIndex++
        });
        remainingTime = 0;
        break;
      }

      if (remainingTime >= breakMinutes) {
        plan.push({
          type: "break",
          duration: breakMinutes,
          index: phaseIndex++
        });
        remainingTime -= breakMinutes;
      } else if (remainingTime > 0) {
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
    
    const totalStudy = plan.filter(p => p.type === "study").reduce((sum, p) => sum + p.duration, 0);
    const totalBreak = plan.filter(p => p.type === "break").reduce((sum, p) => sum + p.duration, 0);
    
    setTotalStudyTime(totalStudy);
    setTotalBreakTime(totalBreak);
    
    let explanation = `Session Plan (${totalMinutes} minutes total):`;
    explanation += `\n• ${Math.round(totalStudy)} minutes study time`;
    explanation += `\n• ${Math.round(totalBreak)} minutes break time`;
    explanation += `\n• ${plan.length} phases total`;
    
    toast.success(explanation);
  };

  const startCamera = async () => {
    try {
      console.log("Starting camera...");

      const isSecure = window.location.protocol === 'https:' ||
                       window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.startsWith('192.168.') ||
                       window.location.hostname.startsWith('10.') ||
                       window.location.hostname.startsWith('172.');

      console.log("Connection secure:", isSecure);
      console.log("Protocol:", window.location.protocol);
      console.log("Hostname:", window.location.hostname);

      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      // Check if HTTPS is required but not being used
      if (isMobile && !isSecure) {
        toast.error("⚠️ HTTPS required for mobile camera. Please use a secure connection.");
        console.error("Mobile device detected but not using secure connection");
        setCameraEnabled(false);
        return;
      }

      // Check if mediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("❌ Camera API not supported on this browser");
        console.error("getUserMedia not supported");
        setCameraEnabled(false);
        return;
      }

      if (isMobile) {
        toast.info("📱 Mobile camera mode - using native video");
        setUseNativeVideo(true);
      }

      // Try to start native video stream directly for mobile
      if (isMobile) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'user',
              width: { min: 320, ideal: 640, max: 1280 },
              height: { min: 240, ideal: 480, max: 720 }
            },
            audio: false
          });

          if (nativeVideoRef.current) {
            nativeVideoRef.current.srcObject = stream;
            await nativeVideoRef.current.play();
            setCameraEnabled(true);
            toast.success("📹 Camera started!");
            setTimeout(() => startFaceDetectionSimulation(), 1500);
          }
        } catch (err) {
          console.error("Native video error:", err);
          if (err.name === 'NotAllowedError') {
            toast.error("❌ Camera permission denied. Please allow camera access in browser settings.");
          } else if (err.name === 'NotFoundError') {
            toast.error("❌ No camera found on this device");
          } else if (err.name === 'NotReadableError') {
            toast.error("❌ Camera is being used by another app");
          } else {
            toast.error("❌ Camera error: " + err.message);
          }
          setCameraEnabled(false);
          setUseNativeVideo(false);
        }
      } else {
        // Desktop: use Webcam component
        setCameraEnabled(true);
      }

    } catch (error) {
      console.error("Camera error:", error);
      if (error.name === 'NotAllowedError') {
        toast.error("❌ Camera permission denied");
      } else if (error.name === 'NotFoundError') {
        toast.error("❌ No camera found");
        setFaceDetected(true);
      } else {
        toast.error("❌ Camera error: " + error.message);
      }
      setCameraEnabled(false);
      setUseNativeVideo(false);
    }
  };

  const startFaceDetectionSimulation = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    const hasVideo = useNativeVideo ? nativeVideoRef.current : (videoRef.current && videoRef.current.video);

    if (isModelLoaded && hasVideo) {
      const detectFaces = async () => {
        try {
          const videoElement = useNativeVideo ? nativeVideoRef.current : (videoRef.current ? videoRef.current.video : null);
          if (!videoElement || videoElement.videoWidth === 0 || videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) return;

          // Detect faces with face-api.js
          const detections = await faceapi
            .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions({
              inputSize: 224,
              scoreThreshold: 0.5
            }))
            .withFaceLandmarks()
            .withFaceExpressions();

          const isDetected = detections && detections.length > 0;
          const currentTime = Date.now();

          if (isDetected) {
            setFaceDetected(true);
            setNoFaceDetectedTime(0);
            setLastFaceDetectionTime(currentTime);

            // Extract emotion
            const detection = detections[0];
            const expressions = detection.expressions;
            const highestEmotion = Object.keys(expressions).reduce((a, b) =>
              expressions[a] > expressions[b] ? a : b
            );
            setEmotion(highestEmotion);

            // Calculate basic attention metrics
            const landmarks = detection.landmarks.positions;

            // Simple head pose estimation (yaw from eye positions)
            const leftEye = landmarks[36];
            const rightEye = landmarks[45];
            const nose = landmarks[30];

            if (leftEye && rightEye && nose) {
              const eyeCenter = (leftEye.x + rightEye.x) / 2;
              const yaw = Math.abs(nose.x - eyeCenter);
              const isLookingForward = yaw < 40;

              // Simple posture score (0-100)
              const posture = Math.max(0, 100 - yaw * 2);
              setPostureScore(Math.round(posture));

              // Simple attention level based on emotion and posture
              const emotionScore = ['neutral', 'happy', 'surprised'].includes(highestEmotion) ? 100 : 50;
              const attention = Math.round(emotionScore * 0.5 + posture * 0.5);
              setAttentionLevel(attention);

              // Draw detection on canvas
              if (canvasRef.current) {
                const canvas = canvasRef.current;
                const displaySize = { width: videoElement.videoWidth, height: videoElement.videoHeight };
                faceapi.matchDimensions(canvas, displaySize);

                const resizedDetections = faceapi.resizeResults(detections, displaySize);
                const context = canvas.getContext('2d');
                context.clearRect(0, 0, canvas.width, canvas.height);

                // Draw face box
                const box = resizedDetections[0].detection.box;
                context.strokeStyle = isLookingForward ? '#00ff00' : '#ff9900';
                context.lineWidth = 3;
                context.strokeRect(box.x, box.y, box.width, box.height);

                // Draw status text
                context.font = 'bold 16px Arial';
                context.fillStyle = 'rgba(0, 0, 0, 0.8)';
                context.fillRect(box.x, box.y - 40, 180, 35);
                context.fillStyle = isLookingForward ? '#00ff00' : '#ff9900';
                context.fillText(
                  isLookingForward ? '✓ FOCUSED' : '⚠ LOOK FORWARD',
                  box.x + 10,
                  box.y - 15
                );
              }
            }
          } else {
            setFaceDetected(false);
            setEmotion(null);
            const timeSinceLastDetection = Math.floor((currentTime - lastFaceDetectionTime) / 1000);
            setNoFaceDetectedTime(timeSinceLastDetection);

            // Clear canvas
            if (canvasRef.current) {
              const context = canvasRef.current.getContext('2d');
              context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
          }

          if (!isDetected && currentMode === "study") {
            const noFaceTime = Math.floor((currentTime - lastFaceDetectionTime) / 1000);

            if (noFaceTime >= 5 && noFaceTime < 8) {
              playWarningSound();
              toast.warning("⚠️ No face detected", { duration: 3000 });
            } else if (noFaceTime >= 10 && noFaceTime < 13) {
              playWarningSound();
              toast.error("🚨 Please return!", { duration: 4000 });
            } else if (noFaceTime >= 15) {
              playWarningSound();
              toast.error("⚠️ CRITICAL: Return now!", { duration: 2000 });
            }
          }
        } catch (error) {
          console.error("Face detection error:", error);
        }
      };

      detectionIntervalRef.current = setInterval(detectFaces, 500);
      setTimeout(detectFaces, 1500);
    } else {
      // Fallback simulation
      detectionIntervalRef.current = setInterval(() => {
        const isDetected = Math.random() > 0.1;
        const currentTime = Date.now();

        if (isDetected) {
          setFaceDetected(true);
          setNoFaceDetectedTime(0);
          setLastFaceDetectionTime(currentTime);
        } else {
          setFaceDetected(false);
          const timeSinceLastDetection = Math.floor((currentTime - lastFaceDetectionTime) / 1000);
          setNoFaceDetectedTime(timeSinceLastDetection);
        }
      }, 1000);
    }
  };

  const stopCamera = useCallback(() => {
    try {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }

      // Stop native video stream if using it
      if (nativeVideoRef.current && nativeVideoRef.current.srcObject) {
        const stream = nativeVideoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        nativeVideoRef.current.srcObject = null;
      }

      setCameraEnabled(false);
      setFaceDetected(false);
      setUseNativeVideo(false);
    } catch (error) {
      console.error("Error stopping camera:", error);
    }
  }, []);

  const saveSession = useCallback(async (status = "completed", isSuddenClosure = false) => {
    try {
      if (sessionSavedRef.current) return;
      sessionSavedRef.current = true;

      let finalActualStudyTime = actualStudyTime;
      let finalActualBreakTime = actualBreakTime;
      
      if (sessionStartTime) {
        const currentPhaseTime = Math.floor((Date.now() - sessionStartTime) / 60000);
        if (currentMode === "study") {
          finalActualStudyTime += currentPhaseTime;
        } else if (currentMode === "break") {
          finalActualBreakTime += currentPhaseTime;
        }
      }

      const isProperlyCompleted = status === "completed" && currentPhaseIndex >= sessionPlan.length - 1;

      const sessionData = {
        total_time_minutes: totalStudyTime + totalBreakTime,
        total_study_time: totalStudyTime,
        total_break_time: totalBreakTime,
        actual_study_time: finalActualStudyTime,
        actual_break_time: finalActualBreakTime,
        session_plan: sessionPlan,
        total_phases: sessionPlan.length,
        completed_phases: currentPhaseIndex + 1,
        is_sudden_closure: isSuddenClosure,
        status: isSuddenClosure ? "sudden_closure" : (isProperlyCompleted ? "completed" : "cancelled"),
        completion_percentage: Math.round(((currentPhaseIndex + 1) / sessionPlan.length) * 100)
      };

      await apiService.createFocusSession(sessionData);
      toast.success("Session saved!");

      if (isProperlyCompleted) {
        try {
          await apiService.updateBreakTime(finalActualBreakTime);
        } catch (error) {
          console.error("Error updating break time:", error);
        }
      }
    } catch (error) {
      console.error("Error saving session:", error);
      toast.error("Failed to save session");
    }
  }, [actualStudyTime, actualBreakTime, currentMode, sessionStartTime, totalStudyTime, totalBreakTime, sessionPlan, currentPhaseIndex]);

  const stopSession = useCallback((reason = "manual") => {
    try {
      if (sessionStartTime) {
        const timeSpent = Math.floor((Date.now() - sessionStartTime) / 60000);
        if (currentMode === "study") {
          setActualStudyTime(prev => prev + timeSpent);
        } else {
          setActualBreakTime(prev => prev + timeSpent);
        }
      }
      
      saveSession(reason === "manual" ? "cancelled" : "completed");
      
      setIsRunning(false);
      setIsSessionActive(false);
      stopCamera();
      setTimeLeft(0);
      setCurrentMode("study");
      setFaceDetected(false);
      setNoFaceDetectedTime(0);
      
      toast.success("Session stopped!");
    } catch (error) {
      console.error("Error stopping session:", error);
      toast.error("Error saving session");
    }
  }, [sessionStartTime, currentMode, saveSession, stopCamera]);

  const handlePhaseComplete = useCallback(() => {
    if (sessionStartTime) {
      const timeSpent = Math.floor((Date.now() - sessionStartTime) / 60000);
      if (currentMode === "study") {
        setActualStudyTime(prev => prev + timeSpent);
      } else {
        setActualBreakTime(prev => prev + timeSpent);
      }
    }

    const nextPhaseIndex = currentPhaseIndex + 1;
    if (nextPhaseIndex < sessionPlan.length) {
      const nextPhase = sessionPlan[nextPhaseIndex];
      setCurrentPhaseIndex(nextPhaseIndex);
      setCurrentMode(nextPhase.type);
      setTimeLeft(nextPhase.duration * 60);
      setSessionStartTime(Date.now());

      playPhaseChangeSound();
      toast.success(`Phase ${nextPhaseIndex + 1} of ${sessionPlan.length}`);
    } else {
      setIsRunning(false);
      playSuccessSound();

      const finalStudyTime = actualStudyTime + (currentMode === "study" ? Math.floor((Date.now() - sessionStartTime) / 60000) : 0);
      const finalBreakTime = actualBreakTime + (currentMode === "break" ? Math.floor((Date.now() - sessionStartTime) / 60000) : 0);

      setTimeout(() => {
        stopSession("completed");
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
          if (newTimeLeft <= 10 && newTimeLeft > 0) {
            if (newTimeLeft <= 3) {
              playBeep(1000, 150);
            } else {
              playBeep(600, 100);
            }
          }
          if (newTimeLeft <= 0) {
            handlePhaseComplete();
            return 0;
          }
          return newTimeLeft;
        });
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isRunning, timeLeft, handlePhaseComplete, playBeep]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isSessionActive && isRunning && !sessionSavedRef.current) {
        event.preventDefault();
        event.returnValue = "Session in progress";
        return "Session in progress";
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isSessionActive, isRunning]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  useEffect(() => {
    if (!isSessionActive || !isRunning) return;

    const handlePopState = (event) => {
      event.preventDefault();
      playWarningSound();
      setShowNavigationWarning(true);
      setPendingNavigation({ type: 'popstate' });
      window.history.pushState(null, '', window.location.pathname);
    };

    window.history.pushState(null, '', window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isSessionActive, isRunning, playWarningSound]);

  const handleCancelNavigation = () => {
    setShowNavigationWarning(false);
    setPendingNavigation(null);
    toast.info("Continuing session...");
  };

  const handleConfirmNavigation = () => {
    stopSession("manual");
    setShowNavigationWarning(false);
    setTimeout(() => {
      if (pendingNavigation?.type === 'popstate') {
        window.history.back();
      } else {
        navigate('/home');
      }
      setPendingNavigation(null);
    }, 100);
  };

  const startSession = async () => {
    if (sessionPlan.length === 0) {
      toast.error("Please create a session plan first");
      return;
    }

    try {
      await startCamera();
      sessionSavedRef.current = false;
      setIsSessionActive(true);
      setCurrentPhaseIndex(0);
      setActualStudyTime(0);
      setActualBreakTime(0);
      setSessionStartTime(Date.now());

      const firstPhase = sessionPlan[0];
      setCurrentMode(firstPhase.type);
      setTimeLeft(firstPhase.duration * 60);
      setIsRunning(true);

      playPhaseChangeSound();
      toast.success(`Session started! Phase 1 of ${sessionPlan.length}`);
    } catch (error) {
      console.error("Error starting session:", error);
      toast.error("Failed to start session");
    }
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
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Elegant Header - Sticky */}
      <header className="sticky top-0 z-50 bg-white px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button
            onClick={() => {
              if (isSessionActive && isRunning) {
                setShowNavigationWarning(true);
              } else {
                navigate("/home");
              }
            }}
            className={`w-11 h-11 rounded-full bg-gray-50 border-2 border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors ${
              isSessionActive && isRunning ? 'border-red-300 bg-red-50' : ''
            }`}
          >
            <ArrowLeft className="h-5.5 w-5.5 text-slate-800" />
          </button>
          
          <div className="flex-1 flex flex-col items-center">
            <h1 className="text-[13px] font-bold text-slate-800 tracking-[2.5px]">
              FOCUS
            </h1>
            <div className="w-10 h-0.5 bg-amber-600 rounded mt-1" />
          </div>
          
          <div className="w-11" />
        </div>
      </header>

      {!isSessionActive ? (
        <>
          {/* Premium Banner */}
          <div className="px-5 pt-5 pb-6">
            <div className="relative h-40 rounded-[20px] overflow-hidden shadow-xl max-w-2xl mx-auto">
              <img 
                src={logo} 
                alt="Banner" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-slate-800 bg-opacity-75" />
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-5">
                <h2 className="text-xl font-light text-white mb-2 tracking-wide text-center">
                  Build Your Focus Habit
                </h2>
                <div className="w-12 h-px bg-amber-600 mb-2" />
                <p className="text-xs text-white opacity-90 tracking-widest uppercase font-medium">
                  Create your study session
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 px-5 pb-20">
            <div className="max-w-2xl mx-auto space-y-3.5">
              {/* Input Card */}
              <div className="bg-white rounded-[18px] border-2 border-gray-100 shadow-md p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">Session Time</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-gray-600 mb-2 block">Total Time (minutes)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="5"
                        placeholder="e.g., 90"
                        value={totalTimeMinutes}
                        onChange={(e) => setTotalTimeMinutes(String(e.target.value))}
                        className="h-[54px] bg-gray-50 border-2 border-gray-200 rounded-[14px] text-slate-800 font-medium flex-1"
                        min="1"
                        max="240"
                      />
                      <button
                        onClick={createSessionPlan}
                        className="h-[54px] bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-2xl shadow-xl transition-all duration-300 px-6 border border-slate-700"
                      >
                        Create Plan
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-[14px] p-4">
                    <p className="text-xs text-blue-800 font-medium mb-2">⚙️ Parent Settings</p>
                    <div className="text-xs text-blue-700 space-y-1">
                      <p>• Study: {Math.round(parentSettings.studyTimeHours * 60)} min/phase</p>
                      <p>• Break: {Math.round(parentSettings.breakTimeHours * 60)} min/phase</p>
                      <p>• Cycle: {Math.round((parentSettings.studyTimeHours + parentSettings.breakTimeHours) * 60)} min total</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Session Plan Display */}
              {sessionPlan.length > 0 && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-[18px] border-2 border-gray-100 shadow-md p-5 text-center">
                      <p className="text-xs text-gray-600 mb-2">📚 Study Time</p>
                      <p className="text-3xl font-bold text-slate-800 mb-1">{Math.round(totalStudyTime)}</p>
                      <p className="text-xs text-gray-500">minutes</p>
                    </div>

                    <div className="bg-white rounded-[18px] border-2 border-gray-100 shadow-md p-5 text-center">
                      <p className="text-xs text-gray-600 mb-2">🎮 Break Time</p>
                      <p className="text-3xl font-bold text-slate-800 mb-1">{Math.round(totalBreakTime)}</p>
                      <p className="text-xs text-gray-500">minutes</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-[18px] border-2 border-gray-100 shadow-md p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-slate-800">📋 Session Plan</h4>
                      {sessionPlan.length > 6 && (
                        <button
                          onClick={() => setIsSessionPlanExpanded(!isSessionPlanExpanded)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          {isSessionPlanExpanded ? "Show Less ▲" : "Show All ▼"}
                        </button>
                      )}
                    </div>

                    {sessionPlan.length > 6 && !isSessionPlanExpanded ? (
                      <div className="space-y-3">
                        <div className="flex gap-2 flex-wrap">
                          {sessionPlan.slice(0, 6).map((phase, index) => (
                            <div key={index} className="flex items-center">
                              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                phase.type === "study"
                                  ? "bg-orange-100 text-orange-800 border border-orange-200"
                                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              }`}>
                                {phase.type === "study" ? "📚" : "🎮"} {Math.round(phase.duration)}m
                              </span>
                              {index < Math.min(sessionPlan.length - 1, 5) && (
                                <span className="mx-1 text-gray-400">→</span>
                              )}
                            </div>
                          ))}
                          {sessionPlan.length > 6 && (
                            <span className="text-xs text-gray-500">... +{sessionPlan.length - 6}</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {sessionPlan.map((phase, index) => (
                          <div key={index} className={`p-2 rounded-[10px] text-center text-xs border ${
                            phase.type === "study"
                              ? "bg-orange-50 border-orange-200"
                              : "bg-emerald-50 border-emerald-200"
                          }`}>
                            <div className="font-medium">{phase.type === "study" ? "📚" : "🎮"}</div>
                            <div className="text-xs">{Math.round(phase.duration)}m</div>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-gray-500 mt-3 text-center">
                      {sessionPlan.length} phases • {Math.round(totalStudyTime + totalBreakTime)} min total
                    </p>
                  </div>

                  <button
                    onClick={startSession}
                    className="w-full h-16 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-2xl shadow-xl transition-all duration-300 text-[15px] tracking-wide border border-slate-700 flex items-center justify-center gap-2"
                  >
                    <Camera className="h-5 w-5" />
                    Start Focus Session
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto px-5 pb-20">
          <div className="max-w-2xl mx-auto space-y-3.5 py-5">
            {/* Camera Preview */}
            <div className="bg-white rounded-[18px] border-2 border-gray-100 shadow-md overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${faceDetected ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></div>
                    <span className="text-xs font-medium text-gray-700">
                      {faceDetected ? 'Face Detected' : 'No Face'}
                    </span>
                  </div>
                  {noFaceDetectedTime > 0 && (
                    <span className="text-xs text-red-600">{noFaceDetectedTime}s</span>
                  )}
                </div>
              </div>
              <div className="relative bg-black aspect-video">
                {cameraEnabled ? (
                  <>
                    {useNativeVideo ? (
                      <video
                        ref={nativeVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform scale-x-[-1]"
                        style={{ transform: 'scaleX(-1)' }}
                      />
                    ) : (
                      <Webcam
                        ref={videoRef}
                        audio={false}
                        width={640}
                        height={480}
                        className="w-full h-full object-cover"
                        onUserMedia={() => {
                          toast.success("Camera started 📹");
                          setTimeout(() => startFaceDetectionSimulation(), 1000);
                        }}
                        onUserMediaError={(error) => {
                          console.error("Webcam error:", error);
                          if (error?.name === 'NotAllowedError' || error?.message?.includes('Permission')) {
                            toast.error("❌ Camera permission denied. Please allow camera access.");
                          } else if (error?.name === 'NotFoundError') {
                            toast.error("❌ No camera found on this device");
                          } else if (error?.name === 'NotReadableError' || error?.message?.includes('Could not start')) {
                            toast.error("❌ Camera is being used by another app. Please close other apps.");
                          } else {
                            toast.error("❌ Camera failed: " + (error?.message || "Unknown error"));
                          }
                          setCameraEnabled(false);
                        }}
                        videoConstraints={{
                          facingMode: 'user',
                          width: { min: 320, ideal: 640, max: 1280 },
                          height: { min: 240, ideal: 480, max: 720 },
                          aspectRatio: { ideal: 1.33333 }
                        }}
                        mirrored={true}
                      />
                    )}
                    <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      <span>{isModelLoaded ? "AI" : "Mon"}</span>
                    </div>
                    <div className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                      faceDetected ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                    }`}>
                      <span>{faceDetected ? "✓" : "⚠"}</span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-4">
                    <CameraOff className="h-12 w-12 mb-4" />
                    <p className="text-sm mb-2">Camera not available</p>
                    <button
                      onClick={() => setFaceDetected(true)}
                      className="text-xs text-blue-600"
                    >
                      Continue Without Camera
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* AI Metrics Display */}
            {faceDetected && isModelLoaded && (
              <div className="bg-white rounded-[18px] border-2 border-blue-100 shadow-md p-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <span>🤖</span> AI Analysis
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                    <p className="text-xs text-purple-600 mb-1">Emotion</p>
                    <p className="text-sm font-bold text-purple-800 capitalize">
                      {emotion || 'detecting...'}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <p className="text-xs text-green-600 mb-1">Attention</p>
                    <p className="text-sm font-bold text-green-800">
                      {attentionLevel}%
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <p className="text-xs text-blue-600 mb-1">Posture</p>
                    <p className="text-sm font-bold text-blue-800">
                      {postureScore}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Face Warning */}
            {!faceDetected && currentMode === "study" && (
              <div className={`rounded-[18px] border-2 shadow-md p-4 ${
                noFaceDetectedTime > 20 ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"
              }`}>
                <div className="flex items-start gap-3">
                  <div className="text-xl">{noFaceDetectedTime > 20 ? "🚨" : "⚠️"}</div>
                  <div className="flex-1">
                    <h4 className={`text-sm font-semibold mb-1 ${
                      noFaceDetectedTime > 20 ? "text-red-800" : "text-yellow-800"
                    }`}>
                      Position Yourself
                    </h4>
                    <p className={`text-xs mb-2 ${
                      noFaceDetectedTime > 20 ? "text-red-700" : "text-yellow-700"
                    }`}>
                      Please position yourself in front of the camera.
                    </p>
                    <button
                      onClick={() => {
                        setFaceDetected(true);
                        setNoFaceDetectedTime(0);
                        setLastFaceDetectionTime(Date.now());
                      }}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
                        noFaceDetectedTime > 20 ? "bg-red-600 text-white" : "bg-yellow-600 text-white"
                      }`}
                    >
                      I'm Here
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Session Info */}
            <div className="bg-white rounded-[18px] border-2 border-gray-100 shadow-md p-5">
              <div className="text-center mb-4">
                <span className={`inline-block px-4 py-2 rounded-full text-xs font-medium border ${
                  currentMode === "study"
                    ? "bg-orange-50 text-orange-800 border-orange-200"
                    : "bg-emerald-50 text-emerald-800 border-emerald-200"
                }`}>
                  {currentMode === "study" ? "📚 Study Mode" : "🎮 Break Mode"}
                </span>
              </div>

              <div className="text-center mb-4">
                <div className={`text-6xl font-bold mb-2 ${
                  currentMode === "study" ? "text-orange-600" : "text-emerald-600"
                }`}>
                  {formatTime(timeLeft)}
                </div>
                <p className="text-xs text-gray-600">
                  Phase {currentPhaseIndex + 1} of {sessionPlan.length}
                </p>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Current Phase</span>
                  <span>{Math.floor((sessionPlan[currentPhaseIndex]?.duration * 60 - timeLeft) / 60)} / {Math.round(sessionPlan[currentPhaseIndex]?.duration || 0)} min</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      currentMode === "study" ? "bg-orange-500" : "bg-emerald-500"
                    }`}
                    style={{
                      width: `${sessionPlan[currentPhaseIndex] ?
                        ((sessionPlan[currentPhaseIndex].duration * 60 - timeLeft) / (sessionPlan[currentPhaseIndex].duration * 60)) * 100 : 0
                      }%`
                    }}
                  />
                </div>

                <div className="flex justify-between text-xs text-gray-600 mt-2">
                  <span>Overall</span>
                  <span>{currentPhaseIndex + 1} / {sessionPlan.length}</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${((currentPhaseIndex + 1) / sessionPlan.length) * 100}%` }}
                  />
                </div>
              </div>

              <button
                onClick={stopSession}
                className="w-full h-14 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-2xl border-2 border-red-200 transition-all duration-300 no-block"
              >
                Stop Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && completionStats && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[20px] max-w-md w-full p-6 shadow-2xl">
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">🎉</div>
              <h2 className="text-2xl font-bold text-emerald-600 mb-1">Congratulations!</h2>
              <p className="text-sm text-gray-700">Focus session completed!</p>
            </div>

            <div className="space-y-2 mb-4">
              <div className="bg-blue-50 rounded-[14px] p-3 border border-blue-200">
                <div className="flex items-center gap-2">
                  <div className="text-2xl">✅</div>
                  <div>
                    <p className="text-xs text-blue-600">Phases</p>
                    <p className="text-lg font-bold text-blue-800">{completionStats.totalPhases}</p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 rounded-[14px] p-3 border border-orange-200">
                <div className="flex items-center gap-2">
                  <div className="text-2xl">📚</div>
                  <div>
                    <p className="text-xs text-orange-600">Study</p>
                    <p className="text-lg font-bold text-orange-800">{completionStats.studyTime} min</p>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 rounded-[14px] p-3 border border-emerald-200">
                <div className="flex items-center gap-2">
                  <div className="text-2xl">🎮</div>
                  <div>
                    <p className="text-xs text-emerald-600">Break</p>
                    <p className="text-lg font-bold text-emerald-800">{completionStats.breakTime} min</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowSuccessModal(false);
                navigate("/home");
              }}
              className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl shadow-xl transition-all duration-300 no-block"
            >
              Back to Home 🏠
            </button>
          </div>
        </div>
      )}

      {/* Navigation Warning Modal */}
      {showNavigationWarning && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[20px] max-w-md w-full p-6 shadow-2xl border-2 border-red-300">
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="h-7 w-7 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-red-600 mb-1">Session Active!</h2>
              <p className="text-sm text-gray-700">Active focus session running</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-[14px] p-3 mb-4">
              <p className="text-xs text-yellow-800 font-medium mb-1">⚠️ If you leave:</p>
              <ul className="text-xs text-yellow-700 space-y-0.5">
                <li>• Session will be cancelled</li>
                <li>• Progress will be saved</li>
                <li>• Timer will stop</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-[14px] p-3 mb-4">
              <div className="flex justify-between text-xs">
                <span className="text-blue-700">Phase:</span>
                <span className="font-bold text-blue-900">{currentPhaseIndex + 1} / {sessionPlan.length}</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-blue-700">Time:</span>
                <span className="font-bold text-blue-900">{formatTime(timeLeft)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCancelNavigation}
                className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl no-block"
              >
                Stay
              </button>
              <button
                onClick={handleConfirmNavigation}
                className="h-12 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl border-2 border-red-200 no-block"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Focus;