import React, { useRef, useEffect, useState } from "react";
import { FaCamera, FaHome, FaPhoneAlt } from "react-icons/fa";
import Notification from "../components/Smart/RecentAlerts";
import { useNavigate, useLocation } from "react-router-dom";
import CameraSettings from "../components/Smart/CameraSettings";

const LiveCam: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { name, isWebcam } = location.state || {
    name: "Unknown",
    isWebcam: false,
  };
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLive, setIsLive] = useState(isWebcam);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [brightness, setBrightness] = useState(100);

  const applyBrightness = () => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (context) {
      context.filter = `brightness(${brightness}%)`;
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    }

    requestAnimationFrame(applyBrightness);
  };

  const stopCurrentStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (isLive && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((mediaStream) => {
          stopCurrentStream();
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.play().catch((err) => console.error("Play error:", err));
          }
        })
        .catch((error) => {
          console.error("Error accessing webcam:", error);
        });
    } else {
      stopCurrentStream();
    }
  }, [isLive]);

  useEffect(() => {
    if (isLive) {
      applyBrightness();
    }
  }, [brightness, isLive]);

  const handleExit = () => {
    navigate("/SecuritySurveillance");
  };

  const GoToCall = () => {
    navigate("/videoCall");
  };

  const handleResolutionChange = async (resolution: string) => {
    if (!stream) return;

    const [width, height] = resolution.split("x").map(Number);
    const videoTrack = stream.getVideoTracks()[0];

    if (!videoTrack) return;

    const capabilities = videoTrack.getCapabilities();
    if (
      capabilities.width &&
      capabilities.width.values &&
      capabilities.height &&
      capabilities.height.values &&
      (!capabilities.width.values.includes(width) || !capabilities.height.values.includes(height))
    ) {
      console.warn(`Resolution ${width}x${height} is not supported by this device.`);
      return;
    }

    const videoConstraints = { width, height };

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints });
      stopCurrentStream();
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().catch((err) => console.error("Play error:", err));
      }
    } catch (error) {
      console.error("Error applying resolution:", error);
    }
  };

  const handleFrameRateChange = async (frameRate: number) => {
    if (!stream) return;

    const videoTrack = stream.getVideoTracks()[0];

    if (!videoTrack) return;

    const capabilities = videoTrack.getCapabilities();
    if (
      capabilities.frameRate &&
      capabilities.frameRate.values &&
      !capabilities.frameRate.values.includes(frameRate)
    ) {
      console.warn(`Frame rate ${frameRate} FPS is not supported by this device.`);
      return;
    }

    const videoConstraints = { frameRate };

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints });
      stopCurrentStream();
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().catch((err) => console.error("Play error:", err));
      }
    } catch (error) {
      console.error("Error applying frame rate:", error);
    }
  };

  const handleBrightnessChange = (newBrightness: number) => {
    setBrightness(newBrightness);
  };

  return (
    <div className="">
      <header className="flex items-center justify-start gap-3 px-3 py-2 bg-white border rounded-full shadow 2xl:px-6 2xl:py-3">
        <button
          onClick={handleExit}
          className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-customBlue"
        >
          <FaHome />
        </button>
        <h1 className="text-lg font-bold text-gray-800 2xl:text-xl">
          Security & Surveillance : {name || "Camera Details"}
        </h1>
      </header>
      <div className="flex flex-grow gap-3 py-3 2xl:gap-4 2xl:py-4">
        <div className="w-1/4">
          <CameraSettings
            onToggleLiveFeed={setIsLive}
            onResolutionChange={handleResolutionChange}
            onFrameRateChange={handleFrameRateChange}
            onBrightnessChange={handleBrightnessChange}
          />
        </div>

        <div className="w-2/4 overflow-hidden">
          <div className="overflow-hidden bg-white border shadow border-customBlue rounded-3xl">
            <div className="relative w-full h-full">
              {isLive ? (
                <>
                  <video ref={videoRef} className="hidden" autoPlay muted></video>
                  <canvas ref={canvasRef} className="object-cover w-full h-[78vh] rounded-3xl"></canvas>
                </>
              ) : (
                <div className="flex items-center justify-center w-full h-[78vh] bg-gray-200 rounded-3xl">
                  <p className="text-lg font-bold text-gray-500">Live Feed Disabled</p>
                </div>
              )}
              <div>
                <p className="absolute flex items-center justify-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-red-700 rounded-full top-3 left-3">
                  <FaCamera /> {isLive ? "Live" : "Offline"}
                </p>
                <button
                  onClick={GoToCall}
                  title="Call"
                  className="absolute flex items-center justify-center w-12 h-12 gap-1 px-3 py-1 text-xs font-semibold text-white bg-green-600 rounded-full shadow hover:bg-green-500 bottom-5 right-5"
                >
                  <FaPhoneAlt size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="w-1/4">
          <Notification />
        </div>
      </div>
    </div>
  );
};

export default LiveCam;
