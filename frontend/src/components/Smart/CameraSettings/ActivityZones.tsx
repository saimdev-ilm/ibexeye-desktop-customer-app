import React, { useState } from "react";
import { FaPlusCircle, FaTrashAlt } from "react-icons/fa";
import Draggable from "react-draggable";
import bgImg from "../../../assets/Camera/Smart/Driveway.png";

const ActivityZones: React.FC = () => {
  const [zones, setZones] = useState<{ id: number; x: number; y: number; width: number; height: number }[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [previewZone, setPreviewZone] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const handleAddZone = () => {
    setIsAdding(true);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (isAdding) {
      const rect = e.currentTarget.getBoundingClientRect();
      setStartPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setPreviewZone({ x: e.clientX - rect.left, y: e.clientY - rect.top, width: 0, height: 0 });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (isAdding && startPos) {
      const rect = e.currentTarget.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      const width = Math.abs(startPos.x - currentX);
      const height = Math.abs(startPos.y - currentY);

      setPreviewZone({
        x: Math.min(startPos.x, currentX),
        y: Math.min(startPos.y, currentY),
        width,
        height,
      });
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (isAdding && startPos && previewZone) {
      const newZone = {
        id: zones.length + 1,
        x: previewZone.x,
        y: previewZone.y,
        width: previewZone.width,
        height: previewZone.height,
      };

      setZones([...zones, newZone]);
      setIsAdding(false);
      setStartPos(null);
      setPreviewZone(null);
    }
  };

  const handleDeleteZone = (id: number) => {
    setZones(zones.filter((zone) => zone.id !== id));
  };

  return (
    <div className="py-4 space-y-3">
      {/* Image with Activity Zones */}
      <div
        className="relative w-full bg-center bg-cover h-96"
        style={{ backgroundImage: `url('${bgImg}')` }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
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

        {/* Preview Zone while drawing */}
        {previewZone && (
          <div
            className="absolute bg-blue-200 bg-opacity-50 border border-blue-600"
            style={{
              left: previewZone.x,
              top: previewZone.y,
              width: previewZone.width,
              height: previewZone.height,
            }}
          />
        )}
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
