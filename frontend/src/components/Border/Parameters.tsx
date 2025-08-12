import { useState } from "react";
import { FaChevronLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function Parameters() {
  const [activeTab, setActiveTab] = useState("Camera");
  const navigate = useNavigate();

  const renderParameters = () => {
    switch (activeTab) {
      case "Camera":
        return (
          <div className="space-y-3">
            <ParameterSlider
              label="Lower FOV"
              min="-90"
              max="90"
              step="1"
              value={-30}
            />
            <ParameterSlider
              label="Horizontal FOV"
              min="0"
              max="360"
              step="1"
              value={360}
            />
            <ParameterSlider
              label="Rotation Speed"
              min="0"
              max="100"
              step="1"
              value={10}
            />
            <ParameterSlider
              label="Aperture Size"
              min="1.4"
              max="22"
              step="0.1"
              value={8}
            />
            <ParameterSlider
              label="ISO Sensitivity"
              min="100"
              max="3200"
              step="100"
              value={400}
            />
            <ParameterSlider
              label="Shutter Speed (ms)"
              min="0.1"
              max="1000"
              step="0.1"
              value={50}
            />
            <ParameterSlider
              label="White Balance (K)"
              min="2000"
              max="10000"
              step="100"
              value={5600}
            />
            <ParameterSlider
              label="Focus Distance (m)"
              min="0.1"
              max="100"
              step="0.1"
              value={5}
            />
          </div>
        );
      case "Lidar":
        return (
          <div className="space-y-3">
            <ParameterSlider
              label="Channels"
              min="0"
              max="64"
              step="1"
              value={32}
            />
            <ParameterSlider
              label="Atmosphere Attenuation Rate"
              min="0"
              max="1"
              step="0.001"
              value={0.004}
            />
            <ParameterSlider
              label="Dropoff General Rate"
              min="0"
              max="1"
              step="0.01"
              value={0.45}
            />
            <ParameterSlider
              label="Range Resolution (m)"
              min="0.1"
              max="10"
              step="0.1"
              value={5}
            />
            <ParameterSlider
              label="Field Overlap (%)"
              min="0"
              max="100"
              step="1"
              value={50}
            />
            <ParameterSlider
              label="Point Density"
              min="0"
              max="5000"
              step="100"
              value={2000}
            />
            <ParameterSlider
              label="Max Range (m)"
              min="10"
              max="500"
              step="10"
              value={250}
            />
            <ParameterSlider
              label="Scan Angle"
              min="-45"
              max="45"
              step="1"
              value={30}
            />
          </div>
        );
      case "Radar":
        return (
          <div className="space-y-3">
            <ParameterSlider
              label="Dropoff Intensity Limit"
              min="0"
              max="1"
              step="0.01"
              value={0.8}
            />
            <ParameterSlider
              label="Dropoff Zero Intensity"
              min="0"
              max="1"
              step="0.01"
              value={0.4}
            />
            <ParameterSlider
              label="Velocity Threshold (m/s)"
              min="0"
              max="100"
              step="1"
              value={30}
            />
            <ParameterSlider
              label="Frequency Band (GHz)"
              min="24"
              max="77"
              step="1"
              value={60}
            />
            <ParameterSlider
              label="Signal-to-Noise Ratio"
              min="0"
              max="50"
              step="1"
              value={25}
            />
            <ParameterSlider
              label="Object Tracking Rate (Hz)"
              min="1"
              max="60"
              step="1"
              value={30}
            />
            <ParameterSlider
              label="Range Accuracy (m)"
              min="0.1"
              max="5"
              step="0.1"
              value={2}
            />
            <ParameterSlider
              label="Doppler Shift (Hz)"
              min="0"
              max="2000"
              step="10"
              value={1000}
            />
          </div>
        );
      case "Environmental":
        return (
          <div className="space-y-3">
            <ParameterSlider
              label="Temperature (°C)"
              min="-40"
              max="60"
              step="1"
              value={22}
            />
            <ParameterSlider
              label="Humidity (%)"
              min="0"
              max="100"
              step="1"
              value={45}
            />
            <ParameterSlider
              label="Air Pressure (hPa)"
              min="900"
              max="1100"
              step="1"
              value={1013}
            />
            <ParameterSlider
              label="Wind Speed (m/s)"
              min="0"
              max="50"
              step="1"
              value={5}
            />
            <ParameterSlider
              label="CO2 Concentration (ppm)"
              min="0"
              max="2000"
              step="1"
              value={400}
            />
            <ParameterSlider
              label="PM2.5 (µg/m³)"
              min="0"
              max="500"
              step="1"
              value={20}
            />
          </div>
        );
      default:
        return null;
    }
  };

  const handleBack = () => {
    navigate("/borderSurveillance");
  };

  return (
    <div className="px-4 py-3 bg-white shadow rounded-3xl">
      <div className="flex items-center justify-between gap-2 pb-2 mb-3 border-b-2 border-customBlue">
        <button
          className="flex items-center justify-center w-8 h-8 border rounded-full hover:border-customBlue"
          onClick={handleBack}
        >
          <FaChevronLeft />
        </button>
        <h1 className="font-semibold">Parameters</h1>
      </div>
      <div className="flex justify-start mb-3 space-x-4 text-xs 2xl:text-base">
        {["Camera", "Lidar", "Radar", "Environmental"].map((tab) => (
          <button
            key={tab}
            className={`px-2 py-2 rounded-full font-medium transition-colors ${
              activeTab === tab
                ? "bg-customBlue text-white shadow border"
                : "border-customBlue text-customBlue border hover:bg-customBlue hover:text-white"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="h-[63vh] overflow-hidden overflow-y-auto pe-2 custom-scrollbar2 ">
        {renderParameters()}
      </div>
    </div>
  );
}

const ParameterSlider = ({ label, min, max, step, value }) => {
  const [sliderValue, setSliderValue] = useState(value);

  return (
    <div className="">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <div className="flex items-center pb-2 space-x-4 border-b-2">
          <input
            type="range"
            className="w-full accent-customBlue"
            min={min}
            max={max}
            step={step}
            value={sliderValue}
            onChange={(e) => setSliderValue(e.target.value)}
          />
          <span className="w-12 text-sm font-medium text-right text-gray-600">
            {sliderValue}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Parameters;
