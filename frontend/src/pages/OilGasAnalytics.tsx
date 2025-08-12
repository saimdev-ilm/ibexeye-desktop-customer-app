import React from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronLeft } from "react-icons/fa";
import OilGasNotification from "../components/OilGas/OilGasNotification";
import DataAnalytics from "../components/OilGas/DataAnalytics";

const OilGasAnalytics: React.FC = () => {
  const navigate = useNavigate();

  const handleExit = () => {
    navigate("/borderSurveillance");
  };

  return (
    <div className="flex flex-col">
      {/* Header Section */}
      <header className="flex items-center justify-between gap-3 px-3 py-2 bg-white border rounded-full shadow 2xl:px-6 2xl:py-3">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={handleExit}
            title="Back to Home"
            className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-customBlue"
          >
            <FaChevronLeft />
          </button>
          <h1 className="text-lg font-bold text-gray-800 2xl:text-xl">
            Data Analytics
          </h1>
        </div>
      </header>
      {/* Main Content */}
      <div className="flex flex-grow gap-4 py-2 2xl:py-4 ">
        {/* Left Panel */}
        <div className="w-3/4">
          {/* Drone Control Panel Section */}
          <DataAnalytics />
        </div>

        {/* Right Panel (Notifications) */}
        <div className="w-1/4">
          {/* Replace with your Notification component */}
          <OilGasNotification />
        </div>
      </div>
    </div>
  );
};

export default OilGasAnalytics;
