import React, { useState } from "react";
import { FaCamera, FaExpand, FaHome } from "react-icons/fa";
import Notification from "./BorderNotification";
import { useNavigate, useLocation } from "react-router-dom";
import RadarImg from "../../assets/Camera/Border/Rdar.png";
import LidarImg from "../../assets/Camera/Border/lidar.png";
import CameraImg from "../../assets/Camera/Border/camera.png";
import DroneImg from "../../assets/drone.jpg";
import Parameters from "./Parameters";

const BorderCameraDetails: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { name } = location.state || { name: "Unknown", imgSrc: "" };
  const cameras = [
    { id: "Camera", label: "Camera", src: CameraImg }, // Replace with your source
    { id: "Radar", label: "Radar", src: RadarImg },
    { id: "Lidar", label: "Lidar", src: LidarImg },
    { id: "Drone", label: "Drone", src: DroneImg },
  ];

  const [expandedCamera, setExpandedCamera] = useState(cameras[0]); // Default expanded camera

  const handleExit = () => {
    navigate("/borderSurveillance"); // Route to Home/Dashboard
  };

  const handleExpand = (camera: any) => {
    setExpandedCamera(camera); // Set the clicked camera as expanded
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
          Border Security & Surveillance : {name || "Camera Details"}{" "}
          {/* Dynamically show the camera name */}
        </h1>
      </header>
      <div className="flex flex-grow gap-3 pt-3 2xl:gap-4 2xl:py-4">
        {/* Camera Details Panel */}
        <div className="w-1/4">
          <Parameters />
        </div>

        {/* Live Camera Feeds */}
        <div className="w-2/4 overflow-hidden">
          <div className="shadow rounded-3xl ">
            <div className="relative h-[350px]">
              <img
                src={expandedCamera.src} // Expanded camera feed source
                alt={expandedCamera.label}
                className="object-cover w-full h-full rounded-3xl"
              />
              <p className="absolute flex items-center justify-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-red-700 rounded-full top-2 left-2">
                <FaCamera /> {expandedCamera.label}
              </p>
            </div>
          </div>

          {/* Smaller Camera Views */}
          <div className="grid grid-cols-2 gap-4 mt-4 md:grid-cols-3">
            {cameras
              .filter((camera) => camera.id !== expandedCamera.id)
              .map((camera) => (
                <div
                  key={camera.id}
                  className="overflow-hidden bg-white shadow rounded-3xl"
                >
                  <div className="relative h-[240px]">
                    <img
                      src={camera.src} // Live camera feed source
                      alt={camera.label}
                      className="object-cover w-full h-full rounded-3xl"
                    />
                    <p className="absolute flex items-center justify-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-red-700 rounded-full top-2 left-2">
                      <FaCamera /> {camera.label}
                    </p>
                    {/* Expand Icon */}
                    <button
                      onClick={() => handleExpand(camera)}
                      title="Expend View"
                      className="absolute flex items-center justify-center w-8 h-8 bg-white border rounded-full border-customBlue text-customBlue bottom-2 right-2 hover:bg-customBlue hover:text-white hover:border-white"
                    >
                      <FaExpand />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Notification Panel */}
        <div className="w-1/4">
          <Notification />
        </div>
      </div>
    </div>
  );
};

export default BorderCameraDetails;
