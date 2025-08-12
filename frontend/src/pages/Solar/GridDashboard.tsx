import React, { useState } from "react";
import { FaCamera, FaChevronLeft, FaCompress, FaExpand } from "react-icons/fa";
import SolarNotification from "../../components/Smart/Solar/SolarNotifications";
import InverterDiagram from "../../components/Smart/Solar/SolisDiagram";
import SolarDashboardCards from "../../components/Smart/Solar/SolarDashboardCards";
import { useNavigate } from "react-router-dom";


const GridDashboard: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const navigate = useNavigate();
    const handleExpandView = () => {
        setIsExpanded((prev) => !prev);
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
              Grid Dashboard
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
          <div className="flex flex-grow w-full gap-4">
            {/* Left Panel */}
            {!isExpanded && (
              <div className="w-1/4 transition-all duration-300">
                <InverterDiagram />
              </div>
            )}

            {/* Middle Panel (Solar Dashboard) */}
            <div className={`transition-all duration-300 ${isExpanded ? "w-full" : "w-2/4"}`}>
              <SolarDashboardCards />
            </div>

            {/* Right Panel (Solar Notifications) */}
            {!isExpanded && (
              <div className="w-1/4 transition-all duration-300">
                <SolarNotification />
              </div>
            )}
          </div>

        
        </div>
        </div>
    );
};

export default GridDashboard;
