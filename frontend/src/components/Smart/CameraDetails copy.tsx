import React, { useEffect, useState } from "react";
import { FaBell, FaCamera, FaGamepad, FaHome, FaPhoneAlt } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import Notification from "./RecentAlerts";
import CameraSettings from "../../components/Smart/CameraSettings";
import HlsPlayer from "react-hls-player";
import { fetchCameraByIdService } from "../../services/apiService";
import { CSSProperties } from "react";

const CameraDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [camera, setCamera] = useState<any>(null);
  const [showNotification, setShowNotification] = useState(true);
  const [showSettings, setShowSettings] = useState(true);

  // ✅ Fetch Camera Data When Component Loads
  useEffect(() => {
    if (!id) return;
    const fetchCameraDetails = async () => {
      try {
        const cameraData = await fetchCameraByIdService(id);
        setCamera(cameraData);
      } catch (error) {
        console.error("❌ Error fetching camera details:", error);
      }
    };
    fetchCameraDetails();
  }, [id]);

  const handleHomeDasboard = () => navigate("/");

  const GoToCall = () => navigate("/videoCall");

  const toggleNotification = () => setShowNotification((prev) => !prev);

  const toggleSettings = () => setShowSettings((prev) => !prev);




  const handleToggleLiveFeed = (isEnabled: boolean) => {
    console.log("Live feed toggle:", isEnabled);
  };

  const handleResolutionChange = (resolution: string) => {
    console.log("Resolution changed:", resolution);
  };

  const handleFrameRateChange = (frameRate: number) => {
    console.log("Frame rate changed:", frameRate);
  };

  const handleBrightnessChange = (brightness: number) => {
    console.log("Brightness changed:", brightness);
  };



  // ✅ Ensure camera object exists before rendering details
  const getCameraViewWidth = () => {
    if (!showNotification && !showSettings) return "w-full";
    if (!showNotification || !showSettings) return "w-3/4";
    return "w-2/4";
  };

  // ✅ Get ROI Coordinates
  const roi = camera?.detectionConfig?.roi;
  // const roi = { start_x: 0, start_y: 0, current_x: 30, current_y: 100 };
  // const roi = { start_x: 50, start_y: 50, current_x: 400, current_y: 300 };


  const hasROI =
    roi &&
    roi.start_x !== undefined &&
    roi.start_y !== undefined &&
    roi.current_x !== undefined &&
    roi.current_y !== undefined;

  console.log("📍 ROI Data:", roi); // Debugging ROI values

  // ✅ Ensure values are relative to video width/height
  const roiStyle: CSSProperties = hasROI
    ? {
      position: "absolute",
      left: `${roi.start_x / 100 * 100}%`, // Normalize to percentage
      top: `${roi.start_y / 100 * 100}%`,
      width: `${(roi.current_x - roi.start_x) / 100 * 100}%`,
      height: `${(roi.current_y - roi.start_y) / 100 * 100}%`,
      border: "3px solid red", // ✅ ROI Border
      backgroundColor: "rgba(255, 0, 0, 0.2)", // ✅ Semi-transparent overlay
      pointerEvents: "none",
      zIndex: 9999999, // ✅ Ensure it's above the video
    }
    : {};


  return (
    <div className="">
      <header className="flex items-center justify-start gap-3 px-3 py-2 bg-white border rounded-full shadow 2xl:px-6 2xl:py-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleHomeDasboard}
              className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-customBlue"
            >
              <FaHome />
            </button>
            <h1 className="text-lg font-bold text-gray-800 2xl:text-xl">
              Security & Surveillance : {camera?.name || "Camera Details"}
            </h1>
            {/* ✅ Display Camera Info */}
            <div className="flex gap-5 text-gray-600">
              <p>📸 Camera ID: <span className="font-semibold">{id}</span></p>
              <p>🟢 Status: <span className={`font-semibold ${camera?.status === "Online" ? "text-green-500" : "text-red-500"}`}>{camera?.status || "N/A"}</span></p>

              {/* ✅ Add Null Check for Detection Config */}
              {camera?.detectionConfig && (
                <div className="flex gap-4">
                  <p>📍 ROI: ({camera.detectionConfig.roi?.start_x}, {camera.detectionConfig.roi?.start_y}) → ({camera.detectionConfig.roi?.current_x}, {camera.detectionConfig.roi?.current_y})</p>
                  <p>🎯 Sensitivity: {camera.detectionConfig.sensitivity ?? "N/A"}</p>
                  <p>🌀 Blur: {camera.detectionConfig.blur ?? "N/A"}</p>
                  <p>🧩 Morphology: {camera.detectionConfig.morphology ?? "N/A"}</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              title={showSettings ? "Hide Settings" : "Show Settings"}
              onClick={toggleSettings}
              className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-customBlue"
            >
              <FaGamepad />
            </button>
            <button
              title={showNotification ? "Hide Notifications" : "Show Notifications"}
              onClick={toggleNotification}
              className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-customBlue"
            >
              <FaBell />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-grow gap-3 py-3 2xl:gap-4 2xl:py-4">
        {showSettings && (
          <div className="w-1/4 transition-all duration-300">
            <CameraSettings
              onToggleLiveFeed={handleToggleLiveFeed}
              onResolutionChange={handleResolutionChange}
              onFrameRateChange={handleFrameRateChange}
              onBrightnessChange={handleBrightnessChange}
            />
          </div>
        )}

        <div className={`${getCameraViewWidth()} overflow-hidden transition-all duration-300`}>
          <div className="overflow-hidden bg-white shadow rounded-3xl">
            <div className="relative w-full h-full">
              {camera?.localHls ? (
                <>
                  <HlsPlayer
                    src={camera.localHls}
                    autoPlay
                    controls={false}
                    className="object-contain h-[78vh] w-full bg-black rounded-3xl"
                  />
                  {hasROI && <div style={roiStyle}></div>} {/* ✅ ROI Box Drawn on Video */}
                </>
              ) : (
                <div className="flex items-center justify-center w-full h-[78vh] text-gray-500 bg-gray-200 rounded-3xl">
                  No Live Feed Available
                </div>
              )}
              <div className="absolute flex items-center justify-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-red-700 rounded-full top-3 left-3">
                <FaCamera /> Live
              </div>
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

        {showNotification && (
          <div className="w-1/4 transition-all duration-300">
            <Notification />
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraDetails;
