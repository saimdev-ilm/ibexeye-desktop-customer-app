// Updated SecuritySurveillance.tsx with Mode-Zone-Camera hierarchy
import React, { useState, useEffect } from "react";
import SolarDashboardCards from "../components/Smart/Solar/SolarDashboardCards";
import { useNavigate } from "react-router-dom";
import KnoxSolarDashboard from "../components/Smart/Solar/KnoxSolarDashboard";
import RecentAlerts from "../components/Smart/RecentAlerts";
import ModesToggleButton from "../components/ModesToggleButton";
import HierarchicalPanel from "../components/Smart/HierarchicalPanel";
import SensorIcon from "../assets/sensor-on.png";
import ZoneIcon from "../assets/safety-zone.png";
import SolarIcon from "../assets/solar-panel.png";
import ModesIcon from "../assets/dark-mode.png";
import CameraIcon from "../assets/round-cctv.png";
import UsersIcon from "../assets/users-alt.png";
import DroneIcon from "../assets/drone.png";
import ROIIcon from "../assets/location-crosshairs.png";
import RecordingIcon from "../assets/video-recording.png";
import { FiLogOut } from "react-icons/fi";
import Blue from '../assets/White.png'

const SecuritySurveillance: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const handleAllCameraDashboard = () => navigate("/allCameraDashboard");
  const handleModesManagement = () => navigate("/modesManagemenet");
  const handleAllSolarDashboard = () => navigate("/allSolarDashboard");
  const handleDroneDashboard = () => navigate("/droneManagement");
  const handleAllRecordings = () => navigate("/AllRecordings");
  const handleROIManager = () => navigate("/rOIManager");
  const handleUsersManagement = () => navigate("/usersManagement");
  const handleZonesManagement = () => navigate("/zoneManagement");
  const handleSensorsManagement = () => navigate("/sensorsManagement");

  const handleLogout = () => {
    window.localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className="flex h-full gap-3">
        {/* Sidebar Navigation */}
        <div className="w-[4%] h-full">
          <div className="flex flex-col items-center justify-between h-full gap-4 px-4 py-6 border shadow-lg bg-customBlue rounded-2xl">
            <div className="flex flex-col items-center justify-center gap-6">
              <div className="mb-8">
                <img src={Blue} alt="Product Logo" style={{ width: '4vw' }} />
              </div>

              {/* Navigation Sections */}
              <div className="flex flex-col items-center gap-3">
                <button title="Camera Dashboard" onClick={handleAllCameraDashboard} className="p-3 transition-colors rounded-lg bg-white/10 hover:bg-white/20">
                  <img src={CameraIcon} alt="Camera" style={{ width: '1.2vw' }} />
                </button>
                <button title="Drone Dashboard" onClick={handleDroneDashboard} className="p-3 transition-colors rounded-lg bg-white/10 hover:bg-white/20">
                  <img src={DroneIcon} alt="Drone" style={{ width: '1.2vw' }} />
                </button>
                <button title="Sensors Dashboard" onClick={handleSensorsManagement} className="p-3 transition-colors rounded-lg bg-white/10 hover:bg-white/20">
                  <img src={SensorIcon} alt="Sensors" style={{ width: '1.2vw' }} />
                </button>
                <button title="Solar Dashboard" onClick={handleAllSolarDashboard} className="p-3 transition-colors rounded-lg bg-white/10 hover:bg-white/20">
                  <img src={SolarIcon} alt="Solar" style={{ width: '1.2vw' }} />
                </button>
              </div>

              <div className="w-8 h-px bg-white/20"></div>

              <div className="flex flex-col items-center gap-3">
                <button title="ROI Management" onClick={handleROIManager} className="p-3 transition-colors rounded-lg bg-white/10 hover:bg-white/20">
                  <img src={ROIIcon} alt="ROI" style={{ width: '1.2vw' }} />
                </button>
                <button title="Modes Dashboard" onClick={handleModesManagement} className="p-3 transition-colors rounded-lg bg-white/10 hover:bg-white/20">
                  <img src={ModesIcon} alt="Modes" style={{ width: '1.2vw' }} />
                </button>
                <button title="Zones Dashboard" onClick={handleZonesManagement} className="p-3 transition-colors rounded-lg bg-white/10 hover:bg-white/20">
                  <img src={ZoneIcon} alt="Zones" style={{ width: '1.2vw' }} />
                </button>
              </div>

              <div className="w-8 h-px bg-white/20"></div>

              <div className="flex flex-col items-center gap-3">
                <button title="Users Management" onClick={handleUsersManagement} className="p-3 transition-colors rounded-lg bg-white/10 hover:bg-white/20">
                  <img src={UsersIcon} alt="Users" style={{ width: '1.2vw' }} />
                </button>
                <button title="All Recording" onClick={handleAllRecordings} className="p-3 transition-colors rounded-lg bg-white/10 hover:bg-white/20">
                  <img src={RecordingIcon} alt="Recording" style={{ width: '1.2vw' }} />
                </button>
              </div>
            </div>

            <button title="Logout" onClick={handleLogout} className="p-3 transition-colors bg-red-100 rounded-lg hover:bg-red-200">
              <FiLogOut className="text-red-600" size={24} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-[95%]">
          <div className="flex flex-col gap-4">
            {/* Solar Dashboard Section */}
            <div className="flex gap-4">
              <div className="w-1/2 bg-white rounded-2xl shadow-3xl">
                <SolarDashboardCards />
              </div>
              <div className="w-1/2 bg-white rounded-2xl shadow-3xl">
                <KnoxSolarDashboard />
              </div>
            </div>

            {/* Hierarchical Content Section */}
            <div className="flex flex-grow w-full gap-4">
              {!isExpanded && (
                <div className="w-3/4 transition-all duration-300">
                  <HierarchicalPanel />
                </div>
              )}

              {!isExpanded && (
                <div className="w-1/4 transition-all duration-300">
                  <RecentAlerts />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ModesToggleButton position="bottom-right" distance={180} />
    </div>
  );
};

export default SecuritySurveillance;