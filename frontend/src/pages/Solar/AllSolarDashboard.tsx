import React, { useState } from "react";
import { FaCamera, FaChevronLeft, FaCompress, FaExpand } from "react-icons/fa";
import SolarDashboardCards from "../../components/Smart/Solar/SolarDashboardCards";
import { useNavigate } from "react-router-dom";
import KnoxSolarDashboardCards from "../../components/Smart/Solar/KnoxSolarDashboard";
import SolarRecentAlerts from "../../components/Smart/SolarRecentAlerts";

const AllSolarDashboard: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false); // State to control expanded view
  const navigate = useNavigate();
  const handleExpandView = () => {
    setIsExpanded((prev) => !prev); // Toggle expanded view
  };

  const handleAllCameraDashboard = () => {
    navigate("/allCameraDashboard")
  }
  const handleHomeDasboard = () => {
    navigate("/")
  }

  return (
    <div className="flex flex-col w-full h-full">
      {/* Header Section */}
      <header className="flex items-center justify-between gap-3 px-3 py-2 bg-white border rounded-full shadow 2xl:px-6 2xl:py-3">
        <div className="flex items-center justify-center gap-2">
          <button
            title={isExpanded ? "Minimize View" : "Expand View"}
            onClick={handleHomeDasboard}
            className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-customBlue"
          >
            <FaChevronLeft />
          </button>
          <h1 className="text-lg font-bold text-gray-800 2xl:text-xl">
            Solar Dashboard
          </h1>
        </div>
        <div className="flex items-center justify-center gap-3">

          <button
            title={isExpanded ? "Minimize View" : "Expand View"}
            onClick={handleAllCameraDashboard}
            className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-customBlue"
          >
            <FaCamera />
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

      <div className="flex flex-col items-center justify-center w-full gap-4 p-3 2xl:p-3">
        {/* Main Content */}



        <div className="w-full">
          <div className="flex gap-4">

            <div className="w-3/4 bg-white rounded-2xl shadow-3xl">
              <KnoxSolarDashboardCards />
            </div>
            <div className="w-1/4 transition-all duration-300">
              <SolarRecentAlerts />
            </div>
          </div>
        </div>
        <div className="w-full">
          <div className="flex gap-4">

            <div className="w-3/4 bg-white rounded-2xl shadow-3xl">
              <SolarDashboardCards />
            </div>
            <div className="w-1/4 transition-all duration-300">
              <SolarRecentAlerts />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllSolarDashboard;
