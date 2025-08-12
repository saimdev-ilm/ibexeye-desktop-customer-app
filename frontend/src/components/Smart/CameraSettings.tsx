import React, { useState } from "react";
import { FaCamera, FaAngleRight, FaChevronLeft, FaBatteryHalf } from "react-icons/fa";
import VideoSettings from "./CameraSettings/VideoSettings";
import AudioSettings from "./CameraSettings/AudioSettings";
import FeaturesSettings from "./CameraSettings/FeaturesSettings";
import ActivityZones from "./CameraSettings/ActivityZones";
import PowerManagement from "./CameraSettings/PowerManagement";
import Scheduling from "./CameraSettings/Scheduling";

type SettingType = {
  name: string;
  component: JSX.Element;
};

type CameraSettingsProps = {
  onToggleLiveFeed: (isEnabled: boolean) => void;
  onResolutionChange: (resolution: string) => void;
  onFrameRateChange: (frameRate: number) => void;
  onBrightnessChange: (brightness: number) => void;
};

const CameraSettings: React.FC<CameraSettingsProps> = ({
  onResolutionChange,
  onFrameRateChange,
  onBrightnessChange,
  onToggleLiveFeed
}) => {
  const [deviceControl, setDeviceControl] = useState(true);
  const [activeSetting, setActiveSetting] = useState<SettingType | null>(null);

  const settings: SettingType[] = [
    {
      name: "Video Settings", component: <VideoSettings onResolutionChange={onResolutionChange}
        onFrameRateChange={onFrameRateChange}
        onBrightnessChange={onBrightnessChange} />
    },
    { name: "Audio Settings", component: <AudioSettings /> },
    { name: "Features Settings", component: <FeaturesSettings /> },
    { name: "Activity Zones", component: <ActivityZones /> },
    { name: "Power Management", component: <PowerManagement /> },
    { name: "Scheduling", component: <Scheduling /> },
  ];

  const toggleDeviceControl = () => {
    setDeviceControl(!deviceControl);
    onToggleLiveFeed(!deviceControl); // Notify parent component about the toggle state
  };

  return (
    <div className="">
      <div className="bg-white shadow rounded-3xl h-[35vh] overflow-hidden overflow-y-auto custom-scrollbar2 pe-2">
        {activeSetting === null ? (
          <>
            <div className="p-4 border-b">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-50">
                  <FaCamera size={24} className="text-blue-600" />
                </div>
                <div className="ml-3">
                  <h2 className="text-lg font-bold text-gray-700">Backyard</h2>
                  <p className="text-xs text-gray-500">
                    Connected to CAM-234324
                  </p>
                </div>
              </div>
            </div>

            {/* Device Control */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-base font-extrabold text-gray-600">
                  Live Feed
                </p>
                <button
                  onClick={toggleDeviceControl}
                  className={`w-14 2xl:h-7 h-6 flex items-center rounded-full p-1 transition duration-300 ${deviceControl ? "bg-customBlue" : "bg-gray-300"
                    }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow-md transform transition duration-300 ${deviceControl ? "translate-x-7" : ""
                      }`}
                  />
                </button>
              </div>

              {/* Battery Status */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm font-semibold text-gray-600">
                  Battery Status
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-500"><FaBatteryHalf size={20} /></p>
                  <p className="text-sm font-bold text-gray-800">80%</p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <hr className="border-gray-200" />

            {/* Settings List */}
            <div className="p-4 space-y-2">
              {settings.map((setting, index) => (
                <div
                  key={index}
                  onClick={() => setActiveSetting(setting)}
                  className="flex items-center justify-between pb-2 mb-2 transition border-b-2 cursor-pointer"
                >
                  <p className="text-sm font-semibold text-gray-700">
                    {setting.name}
                  </p>
                  <FaAngleRight className="text-gray-400" />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="p-4">
            {/* Back Button */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b-2">
              <button
                onClick={() => setActiveSetting(null)}
                className="flex items-center justify-center w-8 h-8 font-semibold text-customBlue"
              >
                <FaChevronLeft size={20} />
              </button>
              <div className="font-bold">{activeSetting.name}</div>
            </div>

            {/* Setting Content */}
            <div>{activeSetting.component}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraSettings;
