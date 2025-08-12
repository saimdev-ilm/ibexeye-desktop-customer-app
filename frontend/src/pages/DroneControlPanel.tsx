import { useState } from "react";
import {
  FaArrowUp,
  FaArrowDown,
  FaArrowLeft,
  FaArrowRight,
  FaBatteryFull,
  FaMountain,
} from "react-icons/fa";

import DronImg from "../assets/DroneImage.png";
const DroneControlPanel = () => {
  const [droneFeedEnabled, setDroneFeedEnabled] = useState(true);
  const [sensorsEnabled, setSensorsEnabled] = useState(false);
  const [resolution, setResolution] = useState("1920x1080");
  const [battery] = useState(85); // example battery percentage
  const [altitude] = useState(300); // example altitude in meters
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const [zoom] = useState(3); // Default zoom level

  const containerSize = { width: 600, height: 288 }; // Size of the container (in px)
  const imageSize = { width: 1920, height: 1080 }; // Original image size (in px)

  const moveImage = (direction: string) => {
    const step = 50; // Amount of movement

    setPosition((prev) => {
      const maxOffsetX = (imageSize.width * zoom - containerSize.width) / 2;
      const maxOffsetY = (imageSize.height * zoom - containerSize.height) / 2;

      let newX = prev.x;
      let newY = prev.y;

      switch (direction) {
        case "up":
          newY = Math.max(prev.y - step, -maxOffsetY);
          break;
        case "down":
          newY = Math.min(prev.y + step, maxOffsetY);
          break;
        case "left":
          newX = Math.max(prev.x - step, -maxOffsetX);
          break;
        case "right":
          newX = Math.min(prev.x + step, maxOffsetX);
          break;
        default:
          break;
      }

      return { x: newX, y: newY };
    });
  };

  const toggleDroneFeed = () => setDroneFeedEnabled((prev) => !prev);
  const toggleSensors = () => setSensorsEnabled((prev) => !prev);

  return (
    <div className="flex flex-col bg-white shadow rounded-3xl text-customBlue">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b-2 border-opacity-50 border-customBlue">
        <h1 className="text-lg font-bold">Drone Control Panel</h1>
        <div className="flex gap-4 text-sm">
          <div>243.4 km/h</div>
          <div>Rain: 36°C</div>
          <div className="text-green-500">Ongoing: 13°C</div>
          <div>11:43 AM</div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex gap-4 p-4">
        {/* Left Panel */}
        <div className="w-3/4">
          {/* Video Feed */}
          <div className="relative mb-4 overflow-hidden bg-gray-100 border rounded-lg shadow h-72">
            <div
              className="w-full h-full"
              style={{
                transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${zoom})`,
                transition: "transform 0.3s ease",
              }}
            >
              <img
                src={DronImg}
                alt="Drone Feed"
                className="object-cover w-full h-full rounded-lg"
              />
            </div>
          </div>

          {/* Real-Time View */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 border shadow rounded-2xl bg-gray-50">
              <h3 className="font-bold">Speed</h3>
              <p>22 km/h</p>
            </div>
            <div className="p-4 border shadow rounded-2xl bg-gray-50">
              <h3 className="font-bold">Height</h3>
              <p>83 m</p>
            </div>
            <div className="p-4 border shadow rounded-2xl bg-gray-50">
              <h3 className="font-bold">Flight Time</h3>
              <p>5h 34m</p>
            </div>
            {/* Resolution */}
            <div className="p-4 border shadow rounded-2xl bg-gray-50">
              <h2 className="mb-2 font-bold">Resolution</h2>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full py-2 text-black border rounded-lg"
              >
                <option value="1920x1080">1920x1080</option>
                <option value="1280x720">1280x720</option>
                <option value="640x360">640x360</option>
              </select>
            </div>

            {/* Battery and Altitude */}
            <div className="p-4 border shadow rounded-2xl bg-gray-50">
              <h2 className="mb-2 font-bold">Drone Stats</h2>
              <p>Battery: {battery}%</p>
              <p>Altitude: {altitude}m</p>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex flex-col w-1/4 gap-4">
          {/* Controls */}
          <div className="p-4 border shadow rounded-2xl bg-gray-50">
            <div className="flex items-center gap-2 mb-4">
              <FaBatteryFull className="text-lg text-green-500" />
              <span className="text-sm font-semibold">Battery:</span>
              <span className="text-sm">{battery}%</span>
            </div>

            <div className="flex items-center gap-2">
              <FaMountain className="text-lg text-blue-500" />
              <span className="text-sm font-semibold">Altitude:</span>
              <span className="text-sm">{altitude}m</span>
            </div>
          </div>
          <div className="p-4 border shadow rounded-2xl bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Drone Feed</h3>
              <div
                onClick={toggleDroneFeed}
                className={`relative w-14 h-7 rounded-full cursor-pointer transition-colors ${
                  droneFeedEnabled ? "bg-green-500" : "bg-red-500"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 h-5 w-5 bg-white rounded-full shadow transition-transform ${
                    droneFeedEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
                ></span>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Sensors</h3>
              <div
                onClick={toggleSensors}
                className={`relative w-14 h-7 rounded-full cursor-pointer transition-colors ${
                  sensorsEnabled ? "bg-green-500" : "bg-red-500"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 h-5 w-5 bg-white rounded-full shadow transition-transform ${
                    sensorsEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
                ></span>
              </div>
            </div>
          </div>

          <div className="p-4 border shadow rounded-2xl bg-gray-50">
            <h2 className="mb-2 font-bold">Navigation Controls</h2>
            <div className="relative flex items-center justify-center w-48 h-48 mx-auto bg-gray-800 rounded-full">
              <div className="absolute flex items-center justify-center bg-gray-400 rounded-full w-36 h-36"></div>
              {/* Up Button */}
              <button
                className="absolute flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full hover:border-2 hover:bg-gray-300 top-4"
                onClick={() => moveImage("up")}
              >
                <FaArrowUp />
              </button>
              {/* Down Button */}
              <button
                className="absolute flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full hover:border-2 hover:bg-gray-300 bottom-4"
                onClick={() => moveImage("down")}
              >
                <FaArrowDown />
              </button>
              {/* Left Button */}
              <button
                className="absolute flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full hover:border-2 hover:bg-gray-300 left-4"
                onClick={() => moveImage("left")}
              >
                <FaArrowLeft />
              </button>
              {/* Right Button */}
              <button
                className="absolute flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full hover:border-2 hover:bg-gray-300 right-4"
                onClick={() => moveImage("right")}
              >
                <FaArrowRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DroneControlPanel;
