import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import BorderAllCameras from "../components/Border/BorderAllCameras";
import BorderNotification from "../components/Border/BorderNotification";
import BorderSensors from "../components/Border/BorderSensors";
import { FaCompress, FaExpand, FaHome } from "react-icons/fa";
import { PiDroneDuotone } from "react-icons/pi";

const BorderSurveillance: React.FC = () => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false); // State to control expanded view

  const handleExit = () => {
    navigate("/"); // Route to Home/Dashboard
  };


  const GoToDroneFeature = () => {
    navigate("/droneFeature"); // Route to Home/Dashboard
  };

  const handleExpandView = () => {
    setIsExpanded((prev) => !prev); // Toggle expanded view
  };

  return (
    <div className="flex flex-col">
      {/* Header Section */}
      <header className="flex items-center justify-between gap-3 px-3 py-2 bg-white border rounded-full shadow 2xl:px-6">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={handleExit}
            className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-customBlue"
          >
            <FaHome />
          </button>
          <h1 className="text-lg font-bold text-gray-800 2xl:text-xl">
            Border Security & Surveillance
          </h1>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            title="Drone Feature"
            onClick={GoToDroneFeature} // Add onClick event to navigate to DroneFeature
            className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-customBlue"
          >
            <PiDroneDuotone size={20} />
          </button>
          <button
            title={isExpanded ? "Minimize View" : "Expand View"}
            onClick={handleExpandView}
            className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-customBlue"
          >
            {isExpanded ? <FaCompress /> : <FaExpand />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-grow gap-4 py-2 2xl:py-4">
        {!isExpanded && (
          <div className="w-1/4">
            <BorderSensors />
          </div>
        )}

        {/* Middle Panel */}
        <div className={isExpanded ? "w-full" : "w-2/4"}>
          <BorderAllCameras />
        </div>

        {/* Right Panel */}
        {!isExpanded && (
          <div className="w-1/4">
            <BorderNotification />
          </div>
        )}
      </div>
    </div>
  );
};

export default BorderSurveillance;
