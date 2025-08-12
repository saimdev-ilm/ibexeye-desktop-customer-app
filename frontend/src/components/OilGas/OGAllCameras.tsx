import React, { useState } from "react";
import { FaPlus, FaEdit, FaSearch, FaCamera } from "react-icons/fa";
import AddNewCameraModal from "../Modals/AddNewCameraModal"; // Import the modal component
import MainGateImg from "../../assets/Camera/OilGas/MainGate.png";
import AccessPointImg from "../../assets/Camera/OilGas/AccessPoint.png";
import OuterFenceImg from "../../assets/Camera/OilGas/OuterFence.png";
import PipelineWatchImg from "../../assets/Camera/OilGas/PipelineWatch.png";
import ValveStationImg from "../../assets/Camera/OilGas/ValveStation.png";
import DrillPointImg from "../../assets/Camera/OilGas/DrillPoint.png";
import RigViewImg from "../../assets/Camera/OilGas/RigView.png";
import OilTowerImg from "../../assets/Camera/OilGas/OilTower.png";
import GasFieldImg from "../../assets/Camera/OilGas/GasField.png";
import SiteCheckImg from "../../assets/Camera/OilGas/SiteCheck.png";
import ControlRoomImg from "../../assets/Camera/OilGas/ControlRoom.png";
import PowerHubImg from "../../assets/Camera/OilGas/PowerHub.png";
import FlowStationImg from "../../assets/Camera/OilGas/FlowStation.png";
import PumpHouseImg from "../../assets/Camera/OilGas/PumpHouse.png";
import SafetyPostImg from "../../assets/Camera/OilGas/SafetyPost.png";
import { useNavigate } from "react-router-dom";

const OGAllCameras: React.FC = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const [cameras, setCameras] = useState([
    {
      name: "Main Gate",
      imgSrc: MainGateImg,
      status: "80%",
      category: "Facility Perimeter",
    },
    {
      name: "Access Point",
      imgSrc: AccessPointImg,
      status: "80%",
      category: "Facility Perimeter",
    },
    {
      name: "Outer Fence",
      imgSrc: OuterFenceImg,
      status: "80%",
      category: "Facility Perimeter",
    },
    {
      name: "Pipeline Watch",
      imgSrc: PipelineWatchImg,
      status: "80%",
      category: "Facility Perimeter",
    },
    {
      name: "Valve Station",
      imgSrc: ValveStationImg,
      status: "80%",
      category: "Facility Perimeter",
    },

    {
      name: "Drill Point",
      imgSrc: DrillPointImg,
      status: "80%",
      category: "Extraction Sites",
    },
    {
      name: "Rig View",
      imgSrc: RigViewImg,
      status: "80%",
      category: "Extraction Sites",
    },
    {
      name: "Oil Tower",
      imgSrc: OilTowerImg,
      status: "80%",
      category: "Extraction Sites",
    },
    {
      name: "Gas Field",
      imgSrc: GasFieldImg,
      status: "80%",
      category: "Extraction Sites",
    },
    {
      name: "Site Check",
      imgSrc: SiteCheckImg,
      status: "80%",
      category: "Extraction Sites",
    },

    {
      name: "Control Room",
      imgSrc: ControlRoomImg,
      status: "80%",
      category: "Critical Infrastructure",
    },
    {
      name: "Power Hub",
      imgSrc: PowerHubImg,
      status: "80%",
      category: "Critical Infrastructure",
    },
    {
      name: "Flow Station",
      imgSrc: FlowStationImg,
      status: "80%",
      category: "Critical Infrastructure",
    },
    {
      name: "Pump House",
      imgSrc: PumpHouseImg,
      status: "80%",
      category: "Critical Infrastructure",
    },
    {
      name: "Safety Post",
      imgSrc: SafetyPostImg,
      status: "80%",
      category: "Critical Infrastructure",
    },
  ]);

  const [activeTab, setActiveTab] = useState("All Cameras");

  const handleSaveCamera = (camera: {
    name: string;
    ip: string;
    resolution: string;
  }) => {
    setCameras([
      ...cameras,
      {
        name: camera.name,
        imgSrc: "",
        status: "Online",
        category: "",
      },
    ]);
  };

  const GotoDetailsViews = (camera: { name: string; imgSrc: string }) => {
    navigate("/OilGasCameraDetails", {
      state: { name: camera.name, imgSrc: camera.imgSrc },
    });
  };

  const toggleEditMode = () => setIsEditMode(!isEditMode);

  const tabs = [
    "All Cameras",
    "Facility Perimeter",
    "Extraction Sites",
    "Critical Infrastructure",
  ];

  const handleTabChange = (tab: string) => setActiveTab(tab);

  const filteredCameras = cameras.filter(
    (camera) =>
      camera.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (activeTab === "All Cameras" || camera.category === activeTab)
  );

  return (
    <div className="flex flex-col h-full p-2 2xl:p-3">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4 2xl:mb-6">
        {/* Search Input */}
        <div className="relative flex-grow mr-4">
          <input
            type="text"
            placeholder="Search here..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 text-sm border rounded-full shadow 2xl:py-3 focus:outline-none focus:ring-1 focus:ring-customBlue"
          />
          <FaSearch
            size={16}
            className="absolute text-gray-400 -translate-y-1/2 cursor-pointer top-1/2 right-3 hover:text-gray-600"
          />
        </div>

        {/* Edit Layout Button */}
        <button
          onClick={toggleEditMode}
          className={`flex items-center px-5 py-2 text-sm font-semibold rounded-full shadow transition ${
            isEditMode
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-customBlue text-white hover:bg-customBlueHover"
          }`}
        >
          <FaEdit className="mr-2" />
          {isEditMode ? "Stop Editing" : "Edit Layout"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex pb-2 mb-6 space-x-4 border-b-2 border-opacity-50 border-customBlue">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-5 py-2 text-xs 2xl:text-sm font-semibold rounded-full transition ${
              activeTab === tab
                ? "bg-customBlue text-white shadow"
                : "bg-white border border-customBlue text-customBlue hover:bg-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="h-[61vh] 2xl:h-[56vh] overflow-y-auto pe-3 2xl:pe-5 pb-3 overflow-hidden custom-scrollbar2">
        {/* Cameras Grid */}
        <div
          className="grid gap-3 2xl:gap-6 auto-rows-fr"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          }}
        >
          {" "}
          {filteredCameras.map((camera, index) => (
            <div key={index} className="relative group">
              <div
                className="overflow-hidden bg-gray-200 shadow-md cursor-pointer rounded-3xl"
                onClick={() => GotoDetailsViews(camera)}
              >
                {camera.imgSrc ? (
                  <img
                    src={camera.imgSrc}
                    alt={camera.name}
                    className="object-cover w-full h-48 group-hover:opacity-90"
                  />
                ) : (
                  <div className="flex items-center justify-center h-48 bg-gray-300">
                    <FaCamera size={30} className="text-gray-500" />
                  </div>
                )}

                <div className="absolute px-2 py-1 text-xs font-semibold text-white bg-gray-800 rounded-md top-2 left-2 bg-opacity-70">
                  {camera.status}
                </div>
              </div>
              <div className="mt-3 text-sm font-semibold text-center text-blue-600">
                {camera.name}
              </div>
            </div>
          ))}
          {/* Add New Camera Placeholder */}
          <div
            onClick={() => setShowModal(true)}
            className="flex flex-col items-center justify-center transition-colors duration-300 bg-gray-100 shadow-md cursor-pointer rounded-3xl h-36 hover:bg-gray-200"
          >
            <FaPlus size={28} className="text-gray-500" />
            <span className="mt-2 text-sm font-semibold text-gray-600">
              Add New Camera
            </span>
          </div>
        </div>
      </div>

      {/* Add New Camera Modal */}
      {showModal && (
        <AddNewCameraModal
          onClose={() => setShowModal(false)}
          onSave={handleSaveCamera}
        />
      )}
    </div>
  );
};

export default OGAllCameras;
