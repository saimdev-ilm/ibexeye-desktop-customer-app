import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// ✅ Updated import - Context se import karo
import { useWebSocketData, useWebSocket } from "../../../contexts/WebSocketContext";
import SolisDiagram from "./SolisDiagram";
import { FaBatteryFull, FaBolt, FaLightbulb } from "react-icons/fa";

interface StatusLabel {
  text: string;
  color: string;
  bg: string;
}

interface CardData {
  title: string;
  label: StatusLabel;
  value: string;
  icon: JSX.Element;
  color: string;
  activeColor: string;
  iconBg: string;
  route: string;
}

const SolarDashboardCards: React.FC = () => {
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // ✅ WebSocket context se data aur connection status lao
  const { isConnected: wsConnected, connectionState } = useWebSocket();
  const solisData = useWebSocketData('solis');

  // ✅ Enhanced connection timeout logic
  useEffect(() => {
  

    // Check both WebSocket connection and data availability
    if (wsConnected && solisData && Object.keys(solisData).length > 0) {
      setIsConnected(true);

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const newTimeoutId = setTimeout(() => {
        setIsConnected(false);
      }, 5000);

      setTimeoutId(newTimeoutId);
    } else {
      // If WebSocket is disconnected or no data, set as disconnected
      setIsConnected(false);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [solisData, wsConnected, connectionState]);

  const getStatusInfo = (type: string): { label: StatusLabel; value: string } => {
    if (!solisData || !isConnected || !wsConnected) {
      return {
        label: { text: "Idle", color: "text-gray-600", bg: "bg-gray-100" },
        value: "--"
      };
    }

    switch (type) {
      case "grid": {
        const gridPower = parseFloat(String(solisData["solis/inverter_1/Total_Grid_Power"] || "0"));
        let label: StatusLabel;

        if (gridPower < 0) {
          label = { text: "Exporting", color: "text-green-600", bg: "bg-green-100" };
        } else if (gridPower > 0) {
          label = { text: "Importing", color: "text-red-600", bg: "bg-red-100" };
        } else {
          label = { text: "Idle", color: "text-gray-600", bg: "bg-gray-100" };
        }

        return {
          label,
          value: `${Math.abs(gridPower)} W`
        };
      }

      case "solar": {
        const solarPower = parseFloat(String(solisData["solis/inverter_1/Total_PV_Output_Power"] || "0"));

        let calculatedPower = solarPower;
        if (solarPower === 0) {
          const voltage = parseFloat(String(solisData["solis/inverter_1/PV_Voltage_3"] || "0"));
          const current = parseFloat(String(solisData["solis/inverter_1/PV_Current_3"] || "0"));
          calculatedPower = voltage * current;
        }

        let label: StatusLabel;
        if (calculatedPower > 0) {
          label = { text: "Producing", color: "text-yellow-600", bg: "bg-yellow-100" };
        } else {
          label = { text: "Idle", color: "text-gray-600", bg: "bg-gray-100" };
        }

        return {
          label,
          value: `${calculatedPower.toFixed(1)} W`
        };
      }

      case "battery": {
        const batteryPower = parseFloat(String(solisData["solis/inverter_1/Battery_Power"] || "0"));
        const batteryVoltage = parseFloat(String(solisData["solis/inverter_1/Battery_Voltage"] || "0"));
        const batteryCurrent = parseFloat(String(solisData["solis/inverter_1/Battery_Current"] || "0"));

        let calculatedPower = batteryPower;
        if (batteryPower === 0 && batteryVoltage > 0 && batteryCurrent !== 0) {
          calculatedPower = batteryVoltage * batteryCurrent;
        }

        const soc = solisData["solis/inverter_1/Battery_Capacity"] || "0%";
        let label: StatusLabel;

        if (calculatedPower < 0) {
          label = { text: "Discharging", color: "text-red-600", bg: "bg-red-100" };
        } else if (calculatedPower > 0) {
          label = { text: "Charging", color: "text-green-600", bg: "bg-green-100" };
        } else {
          label = { text: "Idle", color: "text-gray-600", bg: "bg-gray-100" };
        }

        return {
          label,
          value: `${Math.abs(calculatedPower).toFixed(1)} W (${soc})`
        };
      }

      case "load": {
        const mainLoadPower = parseFloat(String(solisData["solis/inverter_1/Main_Load_Power"] || "0"));
        const backupLoadPower = parseFloat(String(solisData["solis/inverter_1/Backup_Load_Power"] || "0"));
        const loadPower = mainLoadPower + backupLoadPower;

        let label: StatusLabel;
        if (loadPower > 0) {
          label = { text: "Consuming", color: "text-orange-600", bg: "bg-orange-100" };
        } else {
          label = { text: "Idle", color: "text-gray-600", bg: "bg-gray-100" };
        }

        return {
          label,
          value: `${loadPower.toFixed(1)} W`
        };
      }

      default:
        return {
          label: { text: "Unknown", color: "text-gray-600", bg: "bg-gray-100" },
          value: "--"
        };
    }
  };

  const gridInfo = getStatusInfo("grid");
  const solarInfo = getStatusInfo("solar");
  const batteryInfo = getStatusInfo("battery");
  const loadInfo = getStatusInfo("load");

  const cardData: CardData[] = [
    {
      title: "Grid",
      label: gridInfo.label,
      value: gridInfo.value,
      icon: <FaBolt className="w-6 h-6 text-blue-500" />,
      color: "from-blue-50 to-blue-100 border-blue-200",
      activeColor: "bg-blue-500",
      iconBg: "bg-blue-100",
      route: "/gridDashboard",
    },
    {
      title: "Solar",
      label: solarInfo.label,
      value: solarInfo.value,
      icon: (
        <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      ),
      color: "from-yellow-50 to-yellow-100 border-yellow-200",
      activeColor: "bg-yellow-500",
      iconBg: "bg-yellow-100",
      route: "/solarDashboard",
    },
    {
      title: "Battery",
      label: batteryInfo.label,
      value: batteryInfo.value,
      icon: <FaBatteryFull className="w-6 h-6 text-green-500" />,
      color: "from-green-50 to-green-100 border-green-200",
      activeColor: "bg-green-500",
      iconBg: "bg-green-100",
      route: "/batteryDashboard",
    },
    {
      title: "Load",
      label: loadInfo.label,
      value: loadInfo.value,
      icon: <FaLightbulb className="w-6 h-6 text-orange-500" />,
      color: "from-orange-50 to-orange-100 border-orange-200",
      activeColor: "bg-orange-500",
      iconBg: "bg-orange-100",
      route: "/loadDashboard",
    }
  ];

  const handleCardClick = (route: string): void => {
    if (isConnected) {
      navigate(route);
    }
  };

  const getBatteryPercentage = (): number => {
    if (!solisData || !isConnected) return 0;

    const capacityStr = String(solisData["solis/inverter_1/Battery_Capacity"] || "0");
    const percentage = parseFloat(capacityStr.replace('%', ''));
    return isNaN(percentage) ? 0 : Math.min(Math.max(percentage, 0), 100);
  };

  // ✅ Enhanced Connection Status Banner with more info
  const ConnectionStatusBanner = () => {
    if (isConnected && wsConnected) return null;

    let statusMessage = "Solis Inverter Not Connected";
    let statusColor = "red";

    if (!wsConnected) {
      statusMessage = "WebSocket Disconnected";
    } else if (!solisData || Object.keys(solisData).length === 0) {
      statusMessage = "No Solis Data Available";
      statusColor = "yellow";
    }

    return (
      <div className={`p-3 mb-4 border rounded-lg ${statusColor === 'red' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}>
        <div className="flex items-center">
          <svg className={`w-5 h-5 mr-2 ${statusColor === 'red' ? 'text-red-500' : 'text-yellow-500'}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className={`font-medium ${statusColor === 'red' ? 'text-red-700' : 'text-yellow-700'}`}>
            {statusMessage}
          </span>
        </div>
         
      </div>
    );
  };

  return (
    <div className={`flex flex-col gap-4 p-4 md:flex-row ${!isConnected ? 'opacity-50 ' : ''}`}>
      <div className="w-full md:w-[33%]">
        <h2 className="mb-2 text-lg font-bold">Solis Inverter</h2>

        <ConnectionStatusBanner />

        <div className="grid grid-cols-1 gap-3">
          {cardData.map((card, index) => (
            <div
              key={index}
              onClick={() => handleCardClick(card.route)}
              className={`relative overflow-hidden rounded-lg border transition-all duration-300 ${card.color} ${isConnected ? 'cursor-pointer shadow-sm hover:shadow-md hover:translate-y-px' : 'cursor-not-allowed'
                }`}
            >
              <div className="flex items-start p-3">
                <div className={`flex items-center justify-center p-2 rounded-lg mr-3 ${card.iconBg}`}>
                  {card.icon}
                </div>
                <div className="flex-grow">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800">{card.title}</h3>
                    {card.label && (
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${card.label.color} ${card.label.bg}`}>
                        {card.label.text}
                      </span>
                    )}
                  </div>
                  <p className={`mt-1 text-base font-bold ${!isConnected ? 'text-gray-500' : 'text-gray-800'}`}>
                    {card.value}
                  </p>
                </div>
              </div>

              {/* Bottom indicator bar */}
              <div className="w-full h-1">
                <div className={`h-full ${isConnected ? card.activeColor : 'bg-gray-300'}`} style={{
                  width: !isConnected ? "0%" : card.title === "Battery"
                    ? `${getBatteryPercentage()}%`
                    : card.label.text !== "Idle" && card.label.text !== "Disconnected" ? "100%" : "0%"
                }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="w-full overflow-hidden transition-all duration-300 bg-white border shadow-sm md:w-2/3 rounded-xl">
        <div className="p-3 border-b border-blue-100 bg-blue-50">
          <h2 className="text-base font-semibold text-blue-800">System Overview</h2>
        </div>
        <div className="p-2">
          <SolisDiagram />
        </div>
      </div>
    </div>
  );
};

export default SolarDashboardCards;