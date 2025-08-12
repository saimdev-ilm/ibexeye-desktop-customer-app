import React, { useState, useEffect } from "react";
import { FaBolt, FaBatteryFull, FaLightbulb, FaExclamationTriangle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useWebSocketData } from "../../../services/webSocketData";
import KnoxDiagram from "./KnoxDiagram";

interface StatusLabel {
  text: string;
  color: string;
  bg: string;
}

const KnoxSolarDashboardCards: React.FC = () => {
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  interface KnoxData {
    [key: string]: string | number | undefined;
  }

  const knoxData = useWebSocketData('knox') as KnoxData;

  // Connection timeout logic
  useEffect(() => {
    if (knoxData && Object.keys(knoxData).length > 0) {
      setIsConnected(true);

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const newTimeoutId = setTimeout(() => {
        setIsConnected(false);
      }, 5000);

      setTimeoutId(newTimeoutId);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [knoxData]);

  const getStatusInfo = (type: string): { label: StatusLabel; value: string } => {
    if (!knoxData || !isConnected) {
      return {
        label: { text: "Idle", color: "text-gray-600", bg: "bg-gray-100" },
        value: "--"
      };
    }

    switch (type) {
      case "grid": {
        const gridPower = parseFloat(String(knoxData["knox/inverter_1/ac_input_total_active_power"] || "0"));
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
          value: `${Math.abs(gridPower)} KW`
        };
      }

      case "solar": {
        const pv1 = parseFloat(String(knoxData["knox/inverter_1/solar_input_power_1"] || "0"));
        const pv2 = parseFloat(String(knoxData["knox/inverter_1/solar_input_power_2"] || "0"));
        const solarPower = pv1 + pv2;
        let label: StatusLabel;

        if (solarPower > 0) {
          label = { text: "Producing", color: "text-yellow-600", bg: "bg-yellow-100" };
        } else {
          label = { text: "Idle", color: "text-gray-600", bg: "bg-gray-100" };
        }

        return {
          label,
          value: `${solarPower} W`
        };
      }

      case "battery": {
        const batteryVoltage = parseFloat(String(knoxData["knox/inverter_1/battery_voltage"] || "0"));
        const batteryCurrent = parseFloat(String(knoxData["knox/inverter_1/battery_current"] || "0"));
        const batteryPower = parseFloat((batteryVoltage * batteryCurrent).toFixed(1));
        const soc = String(knoxData["knox/inverter_1/battery_capacity"] || "0%").replace(/\s+/g, "");
        let label: StatusLabel;

        if (batteryPower < 0) {
          label = { text: "Discharging", color: "text-red-600", bg: "bg-red-100" };
        } else if (batteryPower > 0) {
          label = { text: "Charging", color: "text-green-600", bg: "bg-green-100" };
        } else {
          label = { text: "Idle", color: "text-gray-600", bg: "bg-gray-100" };
        }

        return {
          label,
          value: `${Math.abs(batteryPower)} W (${soc})`
        };
      }

      case "load": {
        const loadPower = parseFloat(String(knoxData["knox/inverter_1/ac_output_total_active_power"] || "0"));
        let label: StatusLabel;

        if (loadPower > 0) {
          label = { text: "Consuming", color: "text-orange-600", bg: "bg-orange-100" };
        } else {
          label = { text: "Idle", color: "text-gray-600", bg: "bg-gray-100" };
        }

        return {
          label,
          value: `${loadPower} W`
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

  const cardData = [
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
      ), color: "from-yellow-50 to-yellow-100 border-yellow-200",
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

  const handleCardClick = (route: string) => {
    if (isConnected) {
      navigate(route);
    }
  };

  const ConnectionStatusBanner = () => {
    if (isConnected) return null;

    return (
      <div className="p-3 mb-4 border border-red-200 rounded-lg bg-red-50">
        <div className="flex items-center">
          <FaExclamationTriangle className="w-5 h-5 mr-2 text-red-500" />
          <span className="font-medium text-red-700">Knox Inverter Not Connected</span>
        </div>

      </div>
    );
  };

  return (
    <div className={`flex flex-col gap-4 p-4 md:flex-row ${!isConnected ? 'opacity-50' : ''}`}>
      <div className="w-full md:w-[33%]">
        <h2 className="mb-2 text-lg font-bold">Knox Inverter</h2>

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
                    ? batteryInfo.value.includes('%')
                      ? batteryInfo.value.split('(')[1].replace('%)', '')
                      : '0%'
                    : card.label.text !== "Idle" ? "100%" : "0%"
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
          <KnoxDiagram />
        </div>
      </div>
    </div>
  );
};

export default KnoxSolarDashboardCards;