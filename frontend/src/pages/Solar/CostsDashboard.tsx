import { FaChevronLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const CostsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [offPeakRate, setOffPeakRate] = useState<number>(22.42);
  const [peakRate, setPeakRate] = useState<number>(41.89);
  const [gridPower, setGridPower] = useState<number>(0);
  const [operationType, setOperationType] = useState<string>("import"); 
  const [startTime, setStartTime] = useState<string>("19:00");
  const [endTime, setEndTime] = useState<string>("23:00");
  const [currentTime, setCurrentTime] = useState<string>("");
  const [userSelectedTime, setUserSelectedTime] = useState<string>("");
  const [calculatedCost, setCalculatedCost] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [costLabel, setCostLabel] = useState<string>("");

useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,  
        timeZone: "Asia/Karachi",
      };
      setCurrentTime(new Intl.DateTimeFormat("en-US", options).format(now));
    };
  
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);
  

  const handleCostCalculation = () => {
    setErrorMessage("");
    const startHour = parseInt(startTime.split(":")[0]);
    const endHour = parseInt(endTime.split(":")[0]);

    if (startHour >= endHour) {
      setErrorMessage("Start time must be earlier than end time!");
      return;
    }

    const selectedTime = userSelectedTime || currentTime;
    const selectedHour = parseInt(selectedTime.split(":")[0]);
    const isPeakTime = selectedHour >= startHour && selectedHour < endHour;
    const rate = isPeakTime ? peakRate : offPeakRate;
    const cost = operationType === "import" ? gridPower * rate : -gridPower * rate;
    setCalculatedCost(cost);
    setCostLabel(operationType === "import" ? "Buying (Import)" : "Selling (Export)");
  };


  const HandleBack = () => {
    navigate("/");
  }

  return (
    <div className="flex flex-col w-full h-full p-4">
      <header className="flex items-center justify-between px-4 py-3 bg-white border rounded-full shadow-lg">
        <div className="flex items-center gap-2">
          <button onClick={HandleBack} className="text-gray-600">
            <FaChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-800">Cost Dashboard</h1>
        </div>
      </header>
      <div className="flex flex-col items-center w-full gap-4 p-4">
        <div className="w-full p-4 text-center bg-white rounded-lg shadow-md">
          <h2 className="text-lg font-semibold">Current Time (Islamabad)</h2>
          <p className="mt-1 text-xl font-bold text-blue-600">{currentTime}</p>
        </div>
        <div className="w-full p-4 bg-white rounded-lg shadow-md">
          <h2 className="text-lg font-semibold">Select Time for Cost Calculation</h2>
          <input
            type="time"
            value={userSelectedTime}
            onChange={(e) => setUserSelectedTime(e.target.value)}
            className="w-full px-2 py-1 mt-2 border rounded-md"
          />
        </div>
        <div className="w-full p-4 bg-white rounded-lg shadow-md">
          <h2 className="text-lg font-semibold">Define Peak Time</h2>
          <div className="flex gap-4 mt-2">
            <div className="flex flex-col">
              <label className="text-gray-700">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="px-2 py-1 border rounded-md"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-gray-700">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="px-2 py-1 border rounded-md"
              />
            </div>
          </div>
        </div>
        <div className="w-full p-4 bg-white rounded-lg shadow-md">
          <h2 className="text-lg font-semibold">Unit Price (PKR)</h2>
          <div className="flex gap-4 mt-2">
            <div className="flex flex-col">
              <label className="text-gray-700">Off Peak</label>
              <input
                type="number"
                value={offPeakRate}
                onChange={(e) => setOffPeakRate(Number(e.target.value))}
                className="px-2 py-1 border rounded-md"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-gray-700">Peak</label>
              <input
                type="number"
                value={peakRate}
                onChange={(e) => setPeakRate(Number(e.target.value))}
                className="px-2 py-1 border rounded-md"
              />
            </div>
          </div>
        </div>
        <div className="w-full p-4 bg-white rounded-lg shadow-md">
          <h2 className="text-lg font-semibold">Grid Power & Operation</h2>
          <div className="flex gap-4 mt-2">
            <div className="flex flex-col w-1/2">
              <label className="text-gray-700">Grid Power (kW)</label>
              <input
                type="number"
                value={gridPower}
                onChange={(e) => setGridPower(Number(e.target.value))}
                className="px-2 py-1 border rounded-md"
              />
            </div>
            <div className="flex flex-col w-1/2">
              <label className="text-gray-700">Operation</label>
              <select
                value={operationType}
                onChange={(e) => setOperationType(e.target.value)}
                className="px-2 py-1 border rounded-md"
              >
                <option value="import">Import</option>
                <option value="export">Export</option>
              </select>
            </div>
          </div>
        </div>
         <div className="w-full p-4 bg-white rounded-lg shadow-md">
          <button
            onClick={handleCostCalculation}
            className="w-full py-2 text-white rounded-full bg-customBlue"
          >
            Calculate Cost
          </button>
          {errorMessage && (
            <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
          )}

          {calculatedCost !== null && (
            <div className="mt-3 text-lg font-semibold">
              <p className="text-gray-700">
                {costLabel}:{" "}
                <span className={operationType === "import" ? "text-green-600" : "text-red-600"}>
                  {calculatedCost.toFixed(2)} PKR
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CostsDashboard;
