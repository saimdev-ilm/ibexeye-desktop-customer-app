import React from 'react';
import { FaSlidersH, FaTachometerAlt, FaHdd } from 'react-icons/fa';

const RecordingQuality: React.FC = () => {
  return (
    <div className="py-4 space-y-6">

      {/* Video Resolution */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
          <FaSlidersH className="text-gray-500" /> Video Resolution
        </label>
        <select className="p-2 text-sm border rounded">
          <option>4K</option>
          <option>1080p</option>
          <option>720p</option>
          <option>480p</option>
        </select>
      </div>

      {/* Bitrate */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
          <FaTachometerAlt className="text-gray-500" /> Bitrate
        </label>
        <select className="p-2 text-sm border rounded">
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
          <option>Custom</option>
        </select>
      </div>

      {/* Frame Rate */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
          <FaSlidersH className="text-gray-500" /> Frame Rate
        </label>
        <select className="p-2 text-sm border rounded">
          <option>30 FPS</option>
          <option>60 FPS</option>
          <option>120 FPS</option>
        </select>
      </div>

      {/* Storage Usage */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
          <FaHdd className="text-gray-500" /> Storage Usage
        </label>
        <p className="text-sm font-medium text-gray-700">50% Used</p>
      </div>

      {/* Recording Duration */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
          <FaSlidersH className="text-gray-500" /> Max Recording Duration
        </label>
        <select className="p-2 text-sm border rounded">
          <option>10 Minutes</option>
          <option>30 Minutes</option>
          <option>1 Hour</option>
          <option>Unlimited</option>
        </select>
      </div>
    </div>
  );
};

export default RecordingQuality;
