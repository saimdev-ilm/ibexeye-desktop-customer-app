import React from "react";
import { FaRegLightbulb, FaSlidersH, FaExpand } from "react-icons/fa";

type VideoSettingsProps = {
  onResolutionChange: (resolution: string) => void;
  onFrameRateChange: (frameRate: number) => void;
  onBrightnessChange: (brightness: number) => void;
};

const VideoSettings: React.FC<VideoSettingsProps> = ({
  onResolutionChange,
  onFrameRateChange,
  onBrightnessChange,
}) => {
  const handleResolutionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onResolutionChange(e.target.value);
  };

  const handleFrameRateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFrameRateChange(Number(e.target.value));
  };

  const handleBrightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onBrightnessChange(Number(e.target.value));
  };

  return (
    <div className="py-4 space-y-6">
      {/* Resolution */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
          <FaExpand className="text-gray-500" /> Resolution
        </label>
        <select onChange={handleResolutionChange} className="p-2 text-sm border rounded">
          <option value="1280x720">1MP : 1280x720</option>
          <option value="1920x1080">2MP (HD) : 1920x1080</option>
          <option value="2560x1440">4MP (2K) : 2560x1440</option>
          <option value="3840x2160">8MP (4K) : 3840x2160</option>
        </select>
      </div>

      {/* Frame Rate */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
          <FaSlidersH className="text-gray-500" /> Frame Rate
        </label>
        <select onChange={handleFrameRateChange} className="p-2 text-sm border rounded">
          <option value="30">30 FPS</option>
          <option value="60">60 FPS</option>
        </select>
      </div>

      {/* Brightness */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
          <FaRegLightbulb className="text-gray-500" /> Brightness
        </label>
        <input
          type="range"
          min="0"
          max="100"
          onChange={handleBrightnessChange}
          className="w-24 accent-customBlue"
        />
      </div>
    </div>
  );
};

export default VideoSettings;
