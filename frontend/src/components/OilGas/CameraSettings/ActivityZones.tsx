import React, { useState } from "react";
import { FaPlusCircle, FaTrashAlt } from "react-icons/fa";
import Draggable from "react-draggable";

const ActivityZones: React.FC = () => {
  const [zones, setZones] = useState<{ id: number; x: number; y: number; width: number; height: number }[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);

  const handleAddZone = () => {
    setIsAdding(true);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (isAdding) {
      const rect = e.currentTarget.getBoundingClientRect();
      setStartPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (isAdding && startPos) {
      const rect = e.currentTarget.getBoundingClientRect();
      const endX = e.clientX - rect.left;
      const endY = e.clientY - rect.top;

      const newZone = {
        id: zones.length + 1,
        x: Math.min(startPos.x, endX),
        y: Math.min(startPos.y, endY),
        width: Math.abs(startPos.x - endX),
        height: Math.abs(startPos.y - endY),
      };

      setZones([...zones, newZone]);
      setIsAdding(false);
      setStartPos(null);
    }
  };

  const handleDeleteZone = (id: number) => {
    setZones(zones.filter((zone) => zone.id !== id));
  };

  return (
    <div className="py-4 space-y-6">
      {/* Image with Activity Zones */}
      <div
        className="relative w-full bg-gray-200 border h-96"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        {zones.map((zone) => (
          <Draggable key={zone.id}>
            <div
              className="absolute bg-blue-100 bg-opacity-50 border border-blue-500"
              style={{
                left: zone.x,
                top: zone.y,
                width: zone.width,
                height: zone.height,
              }}
            >
              <button
                className="absolute top-0 right-0 text-red-500 bg-white rounded-full"
                onClick={() => handleDeleteZone(zone.id)}
              >
                <FaTrashAlt size={12} />
              </button>
            </div>
          </Draggable>
        ))}
      </div>

      {/* Zones List */}
      <div className="space-y-4">
        {zones.map((zone) => (
          <div
            key={zone.id}
            className="flex items-center justify-between p-3 transition border shadow-sm rounded-3xl hover:shadow-md"
          >
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Zone {zone.id}</h3>
              <p className="text-xs text-gray-500">
                X: {zone.x.toFixed(1)}, Y: {zone.y.toFixed(1)}, Width: {zone.width.toFixed(1)}, Height:{" "}
                {zone.height.toFixed(1)}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="text-red-500 hover:text-red-600" onClick={() => handleDeleteZone(zone.id)}>
                <FaTrashAlt size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Zone */}
      <div className="flex items-center justify-end p-3 border-t">
        <button className="flex items-center gap-2 text-customBlue hover:text-blue-600" onClick={handleAddZone}>
          <FaPlusCircle size={20} /> <span className="text-sm">Add Zone</span>
        </button>
      </div>
    </div>
  );
};

export default ActivityZones;
