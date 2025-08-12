import React from "react";
import { FaHome } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import OilGasCameraSettings from "./OilGasCameraSettings";
import OilGasNotification from "./OilGasNotification";

const OilGasCameraDetails: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { name, imgSrc } = location.state || { name: "Unknown", imgSrc: "" };

  const handleExit = () => {
    navigate("/OilGasSurveillance"); // Route to Home/Dashboard
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
          Oil & Gas Surveillance : {name || "Camera Details"}{" "}
          {/* Dynamically show the camera name */}
        </h1>
      </header>
      <div className="flex flex-grow gap-3 pt-3 pb-2 2xl:gap-4 2xl:py-4">
        {/* Camera Details Panel */}
        <div className="w-1/4">
          <OilGasCameraSettings />
        </div>

        {/* Live Camera Feed */}
        <div className="w-2/4 overflow-hidden">
          <div className="p-4 overflow-hidden bg-white shadow rounded-3xl ">
            <div className="relative w-full h-full">
              <img
                src={imgSrc} // Replace with live camera feed
                alt="Live Camera"
                className="object-cover w-full h-[73vh] rounded-3xl"
              />
              <p className="absolute px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded-full top-2 left-2">
                Live
              </p>
            </div>
          </div>
        </div>

        {/* Notification Panel */}
        <div className="w-1/4">
          <OilGasNotification />
        </div>
      </div>
    </div>
  );
};

export default OilGasCameraDetails;
