import React, { useEffect, useState } from "react";
import { FaBell, FaCamera, FaGamepad, FaHome, FaPhoneAlt, FaCheckCircle, FaPen, FaStopCircle } from "react-icons/fa";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Notification from "./RecentAlerts";
import CameraSettings from "../../components/Smart/CameraSettings";
import HlsPlayer from "react-hls-player";
import AllCameras from "./AllCameras";
import { getCameraById } from "../../services/cameraService";

// Create a new component for the AllCameras section with a custom onClick handler
const CameraGrid = ({ onCameraSelect }: { onCameraSelect: (camera: any) => void }) => {
  // This wrapper component passes the custom onCameraSelect function to AllCameras
  return (
    <div className="bg-white border shadow-md rounded-3xl">
      <h2 className="p-3 text-lg font-semibold text-gray-800 border-b">All Cameras</h2>
      <CustomCameraList onCameraSelect={onCameraSelect} />
    </div>
  );
};

// Custom component that extends AllCameras with a custom onClick handler
const CustomCameraList = ({ onCameraSelect }: { onCameraSelect: (camera: any) => void }) => {
  // In this component, we'll override the normal navigation behavior
  const navigate = useNavigate();

  // We're creating a new function that will call onCameraSelect instead of navigating
  const handleCameraClick = (camera: any) => {
    // Instead of navigating to a new page, we'll call the parent's onCameraSelect function
    onCameraSelect(camera);

    // Update the URL without triggering a full navigation
    navigate(`/camera/${camera.id}`, {
      state: { camera },
      replace: true // Replace current history entry instead of adding a new one
    });
  };

  // Render the AllCameras component with our custom props
  return <AllCameras onCameraSelect={handleCameraClick} />;
};

const CameraDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [camera, setCamera] = useState(location.state?.camera || null);
  const [showNotification, setShowNotification] = useState(true);
  const [showSettings, setShowSettings] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);

  interface Roi {
    start_x: number;
    start_y: number;
    current_x: number;
    current_y: number;
  }

  const [roi2, setRoi2] = useState<Roi | null>(null);
  const [isDrawingEnabled, setIsDrawingEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // Function to update the current camera
  const handleCameraSelect = (selectedCamera: any) => {
    console.log("Camera selected:", selectedCamera);
    setCamera(selectedCamera);
    // Reset the ROI when changing cameras
    setRoi2(null);
    setIsDrawingEnabled(false);
  };

  // Fetch Camera Data When Component Loads
  useEffect(() => {
    // Skip fetch if we already have camera from navigation state
    if (camera) return;
    if (!id) return;

    const fetchCameraDetails = async () => {
      try {
        const cameraData = await getCameraById(id);
        if (cameraData) {
          setCamera(cameraData);
          console.log("✅ Camera data loaded:", cameraData);
        } else {
          console.error("❌ Camera not found");
          // Redirect to all cameras if camera not found
          navigate("/");
        }
      } catch (error) {
        console.error("❌ Error fetching camera details:", error);
      }
    };

    fetchCameraDetails();
  }, [id, navigate, camera]);

  const handleHomeDasboard = () => navigate("/");

  const GoToCall = () => navigate("/videoCall");

  const toggleNotification = () => setShowNotification((prev) => !prev);

  const toggleSettings = () => setShowSettings((prev) => !prev);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawingEnabled) return; // Allow drawing only when enabled

    const rect = e.currentTarget.getBoundingClientRect();
    const startX = ((e.clientX - rect.left) / rect.width) * 100; // Normalize to percentage
    const startY = ((e.clientY - rect.top) / rect.height) * 100;

    setIsDrawing(true);
    setRoi2({ start_x: startX, start_y: startY, current_x: startX, current_y: startY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !roi2) return;

    const rect = e.currentTarget.getBoundingClientRect();
    let currentX = ((e.clientX - rect.left) / rect.width) * 100;
    let currentY = ((e.clientY - rect.top) / rect.height) * 100;

    // Ensure values stay between 0 and 100
    currentX = Math.min(100, Math.max(0, currentX));
    currentY = Math.min(100, Math.max(0, currentY));

    setRoi2(prev => prev ? { ...prev, current_x: currentX, current_y: currentY } : null);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

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

  // Save ROI
  const saveRoi = () => {
    if (!roi2) return;

    setIsSaving(true);

    // Simulate API call to save ROI
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccessPopup(true);

      // Hide success message after 2 seconds
      setTimeout(() => {
        setShowSuccessPopup(false);
      }, 2000);
    }, 1500);
  };

  const SavingPopup = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="z-50 flex items-center px-6 py-4 bg-white rounded-lg shadow-lg">
        <div className="w-8 h-8 mr-3 border-t-4 border-blue-500 border-solid rounded-full loader animate-spin"></div>
        <span className="text-lg font-semibold">Saving Region of Interest...</span>
      </div>
    </div>
  );

  const SuccessPopup = () => (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black bg-opacity-50">
      <div className="z-50 flex items-center gap-3 px-6 py-4 bg-white rounded-lg shadow-lg">
        <FaCheckCircle className="text-3xl text-green-500" />
        <span className="text-lg font-semibold text-gray-800">ROI 2 Saved Successfully!</span>
      </div>
    </div>
  );

  // Get ROI Coordinates from camera data
  const roi = camera?.detectionConfig?.roi;

  const hasROI =
    roi &&
    roi.start_x !== undefined &&
    roi.start_y !== undefined &&
    roi.current_x !== undefined &&
    roi.current_y !== undefined;

  // ROI style for display
  const roiStyle: React.CSSProperties = hasROI
    ? {
      position: "absolute",
      left: `${roi.start_x}%`,
      top: `${roi.start_y}%`,
      width: `${roi.current_x - roi.start_x}%`,
      height: `${roi.current_y - roi.start_y}%`,
      border: "3px solid red",
      backgroundColor: "rgba(255, 0, 0, 0.2)",
      pointerEvents: "none",
      zIndex: 40,
    }
    : {};

  // Get video feed URL - Check both cloudHls and localHls
  const getVideoFeedUrl = () => {
    if (!camera) return null;
    return camera.cloudHls || camera.localHls || null;
  };

  const videoFeedUrl = getVideoFeedUrl();

  // If camera is still loading, show loading state
  if (!camera) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
        <span className="ml-3 text-xl font-semibold">Loading camera details...</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <header className="flex items-center justify-start gap-3 px-3 py-2 mb-4 bg-white border rounded-full shadow 2xl:px-6 2xl:py-3">
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
            {/* Display Camera Info */}
            <div className="flex flex-wrap gap-5 text-gray-600">
              <p>📸 Camera ID: <span className="font-semibold">{camera.id}</span></p>
              <p>🟢 Status: <span className={`font-semibold ${camera.cloudHls ? "text-green-500" : "text-red-500"}`}>
                {camera.cloudHls ? "Active" : "Offline"}
              </span></p>
              {camera.location?.latitude && camera.location?.longitude && (
                      <p>
                      📍 Location:{" "}
                      <span className="font-semibold">
                        {camera.location.latitude.toFixed(5)}, {camera.location.longitude.toFixed(5)}
                      </span>
                    </p>
                )}
            </div>


          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setIsDrawingEnabled(!isDrawingEnabled)}
              className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-customBlue"
            >
              {isDrawingEnabled ? <FaStopCircle /> : <FaPen />}
            </button>
            {roi2 && isDrawingEnabled && (
              <button
                onClick={saveRoi}
                className="z-50 px-4 py-2 text-white bg-green-600 rounded-lg"
              >
                Save ROI 2
              </button>
            )}
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

      <div className="grid grid-cols-12 gap-4">
        {/* Left sidebar */}
        {(showSettings || showNotification) && (
          <div className="col-span-3">
            <div className="flex flex-col gap-4">
              {showSettings && (
                <div className="w-full transition-all duration-300">
                  <CameraSettings
                    onToggleLiveFeed={handleToggleLiveFeed}
                    onResolutionChange={handleResolutionChange}
                    onFrameRateChange={handleFrameRateChange}
                    onBrightnessChange={handleBrightnessChange}
                  />
                </div>
              )}
              {showNotification && (
                <div className="w-full transition-all duration-300">
                  <Notification height="h-[35vh]" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main content area */}
        <div className={`${(showSettings || showNotification) ? 'col-span-9' : 'col-span-12'}`}>
          <div className="flex flex-col gap-6">
            {/* Main camera feed */}
            <div className="overflow-hidden bg-white shadow rounded-3xl">
              <div
                className="relative w-full h-full"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                {videoFeedUrl ? (
                  <>
                    <HlsPlayer
                      src={videoFeedUrl}
                      autoPlay
                      controls={false}
                      className="object-contain h-[50vh] w-full bg-black rounded-3xl"
                      playerRef={React.createRef<HTMLVideoElement>()}
                      onError={(e) => console.error("HLS Player Error:", e)}
                    />
                    {hasROI && <div style={roiStyle}></div>}
                    {roi2 && (
                      <div
                        style={{
                          position: "absolute",
                          left: `${roi2.start_x}%`,
                          top: `${roi2.start_y}%`,
                          width: `${roi2.current_x - roi2.start_x}%`,
                          height: `${roi2.current_y - roi2.start_y}%`,
                          border: "3px solid blue",
                          backgroundColor: "rgba(0, 0, 255, 0.2)",
                          pointerEvents: "none",
                          zIndex: 10,
                        }}
                      ></div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center w-full h-[50vh] text-gray-500 bg-gray-200 rounded-3xl">
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

            {/* All other cameras section - using our custom component that handles camera selection */}
            <CameraGrid onCameraSelect={handleCameraSelect} />
          </div>
        </div>
      </div>

      {isSaving && <SavingPopup />}
      {showSuccessPopup && <SuccessPopup />}
    </div>
  );
};

export default CameraDetails;