import { useMemo, useState, useEffect } from 'react';
import { useWebSocketData, useWebSocket } from "../../../contexts/WebSocketContext";
import InverterImage from "../../../assets/images/solar-inverter.png"
import LoadImage from "../../../assets/images/bulbicon.png"
import GridImage from "../../../assets/images/gridicon2.png"
import SolarImage from "../../../assets/images/brightnessIcon.png"
import BatteryImage from "../../../assets/images/batteryicon2.png"

const KnoxDiagram = () => {
  const { isConnected: wsConnected } = useWebSocket();
  const knoxData = useWebSocketData('knox');
  const [isConnected, setIsConnected] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Connection timeout logic
  useEffect(() => {
    console.log('🔍 KnoxDiagram - Context Data:', {
      knoxData: knoxData ? Object.keys(knoxData) : 'null',
      wsConnected,
      dataLength: knoxData ? Object.keys(knoxData).length : 0
    });


    if (knoxData && Object.keys(knoxData).length > 0) {
      // Data received - inverter is connected
      setIsConnected(true);

      // Clear existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Set new timeout for 5 seconds
      const newTimeoutId = setTimeout(() => {
        setIsConnected(false);
      }, 5000);

      setTimeoutId(newTimeoutId);
    }

    // Cleanup timeout on unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [knoxData]); // Only depend on knoxData, not timeoutId

  // Calculate all data and statuses based on knoxData
  const { solarData, statuses, flowStatus } = useMemo(() => {
    if (!knoxData || !isConnected) {
      return {
        solarData: {
          gridPower: 0,
          solarPower: 0,
          batteryPower: 0,
          loadPower: 0,
          batterySoc: '0%'
        },
        statuses: {
          gridStatus: { text: 'Idle', color: 'text-gray-600', bg: 'bg-gray-100' },
          solarStatus: { text: 'Idle', color: 'text-gray-600', bg: 'bg-gray-100' },
          batteryStatus: { text: 'Idle', color: 'text-gray-600', bg: 'bg-gray-100' },
          loadStatus: { text: 'Idle', color: 'text-gray-600', bg: 'bg-gray-100' }
        },
        flowStatus: {
          gridToInverter: false,
          inverterToGrid: false,
          solarToInverter: false,
          batteryToInverter: false,
          inverterToBattery: false,
          inverterToHome: false
        }
      };
    }

    // Grid data
    const gridPower = parseFloat(String(knoxData["knox/inverter_1/ac_input_total_active_power"] || "0"));

    // Solar data
    const solarPower1 = parseFloat(String(knoxData["knox/inverter_1/solar_input_power_1"] || "0"));
    const solarPower2 = parseFloat(String(knoxData["knox/inverter_1/solar_input_power_2"] || "0"));
    const solarPower = solarPower1 + solarPower2;

    // Battery data
    const batteryVoltage = parseFloat(String(knoxData["knox/inverter_1/battery_voltage"] || "0"));
    const batteryCurrent = parseFloat(String(knoxData["knox/inverter_1/battery_current"] || "0"));
    const batteryPower = parseFloat((batteryVoltage * batteryCurrent).toFixed(1));
    const batterySoc = String(knoxData["knox/inverter_1/battery_capacity"] || "0%").replace(/\s+/g, "");

    // Load data
    const loadPower = parseFloat(String(knoxData["knox/inverter_1/ac_output_total_active_power"] || "0"));

    // Grid Status
    const gridStatus = gridPower < 0
      ? { text: 'Exporting', color: 'text-green-600', bg: 'bg-green-100' }
      : gridPower > 0
        ? { text: 'Importing', color: 'text-red-600', bg: 'bg-red-100' }
        : { text: 'Idle', color: 'text-gray-600', bg: 'bg-gray-100' };

    // Solar Status
    const solarStatus = solarPower > 0
      ? { text: 'Producing', color: 'text-yellow-600', bg: 'bg-yellow-100' }
      : { text: 'Idle', color: 'text-gray-600', bg: 'bg-gray-100' };

    // Battery Status
    const batteryStatus = batteryPower < 0
      ? { text: 'Discharging', color: 'text-red-600', bg: 'bg-red-100' }
      : batteryPower > 0
        ? { text: 'Charging', color: 'text-green-600', bg: 'bg-green-100' }
        : { text: 'Idle', color: 'text-gray-600', bg: 'bg-gray-100' };

    // Load Status
    const loadStatus = loadPower > 0
      ? { text: 'Consuming', color: 'text-orange-600', bg: 'bg-orange-100' }
      : { text: 'Idle', color: 'text-gray-600', bg: 'bg-gray-100' };

    // Flow status for animations
    const flowStatusObj = {
      gridToInverter: gridPower > 0,
      inverterToGrid: gridPower < 0,
      solarToInverter: solarPower > 0,
      batteryToInverter: batteryPower < 0,
      inverterToBattery: batteryPower > 0,
      inverterToHome: loadPower > 0
    };

    return {
      solarData: {
        gridPower,
        solarPower,
        batteryPower,
        loadPower,
        batterySoc
      },
      statuses: {
        gridStatus,
        solarStatus,
        batteryStatus,
        loadStatus
      },
      flowStatus: flowStatusObj
    };
  }, [knoxData, isConnected]);

  // Always show diagram - remove loading state check


  return (
    <div className="relative w-full overflow-hidden h-96 rounded-xl">
      {/* Connection Status Indicator */}
    <div className="absolute z-20 top-2 right-2">
        <div className={`flex items-center gap-2 px-3 py-1 border rounded-full ${isConnected && wsConnected
          ? 'border-green-200 bg-green-50'
          : 'border-red-200 bg-red-50'
          }`}>
          <div className={`w-2 h-2 rounded-full ${isConnected && wsConnected
            ? 'bg-green-500 animate-pulse'
            : 'bg-red-500'
            }`}></div>
          <span className={`text-xs font-medium ${isConnected && wsConnected
            ? 'text-green-700'
            : 'text-red-700'
            }`}>
            {isConnected && wsConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Inverter - Center */}
      <div className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center w-14 h-14">
            <img src={InverterImage} alt="" />
          </div>
          <div className="mt-1 text-xs font-semibold text-center text-gray-700">INVERTER</div>
        </div>
      </div>

      {/* Grid - Right */}
      <div className="absolute transform -translate-y-1/2 right-20 top-1/2">
        <div className="flex flex-col items-center">
          <div className={`flex items-center justify-center w-12 h-12 rounded-full ${statuses.gridStatus.text !== 'Idle' ? statuses.gridStatus.bg : 'bg-gray-100'} border border-gray-200 shadow-sm`}>
            <img src={GridImage} alt="" />
          </div>
          <div className="mt-1 text-xs font-semibold text-center text-gray-700">GRID</div>
          <div className="text-xs font-bold text-center text-gray-800">
            {Math.abs(solarData.gridPower)} KW
            <span className={`ml-1 ${statuses.gridStatus.color}`}>
              {solarData.gridPower > 0 ? '(IN)' : solarData.gridPower < 0 ? '(OUT)' : ''}
            </span>
          </div>
          <div className={`mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${statuses.gridStatus.bg} ${statuses.gridStatus.color}`}>
            {statuses.gridStatus.text}
          </div>
        </div>
      </div>

      {/* Solar Panel - Top */}
      <div className="absolute transform -translate-x-1/2 top-4 left-1/2">
        <div className="flex flex-col items-center">
          <div className={`flex items-center justify-center rounded-full ${statuses.solarStatus.text !== 'Idle' ? statuses.solarStatus.bg : 'bg-gray-100'} border border-gray-200 shadow-sm mb-2`}>
            <img src={SolarImage} alt="Solar" className="w-10 h-10" />
          </div>
          <div className="absolute text-center left-14">
            <div className="text-xs font-semibold text-gray-700">SOLAR</div>
            <div className="text-sm font-bold text-gray-800">
              {solarData.solarPower} W
            </div>
            <div className={`mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${statuses.solarStatus.bg} ${statuses.solarStatus.color}`}>
              {statuses.solarStatus.text}
            </div>
          </div>
        </div>
      </div>

      {/* Battery - Bottom */}
      <div className="absolute bottom-0 transform -translate-x-1/2 left-1/2">
        <div className="flex flex-col items-center">
          <div className={`flex items-center justify-center w-12 h-12 rounded-full ${statuses.batteryStatus.text !== 'Idle' ? statuses.batteryStatus.bg : 'bg-gray-100'} border border-gray-200 shadow-sm`}>
            <img src={BatteryImage} alt="" />
          </div>
          <div className="absolute right-16 bottom-2">
            <div className="text-xs font-bold text-center text-gray-800">
              {Math.abs(solarData.batteryPower)} W
              <span className="ml-1 text-gray-600">({solarData.batterySoc})</span>
              
            </div>
            <div className="mt-1 text-xs font-semibold text-center text-gray-700">BATTERY</div>
            <div className={`mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${statuses.batteryStatus.bg} ${statuses.batteryStatus.color}`}>
              {statuses.batteryStatus.text}
            </div>
          </div>
        </div>
      </div>

      {/* Home/Load - Left */}
      <div className="absolute transform -translate-y-1/2 left-20 top-1/2">
        <div className="flex flex-col items-center">
          <div className={`flex items-center justify-center w-12 h-12 rounded-full ${statuses.loadStatus.text !== 'Idle' ? statuses.loadStatus.bg : 'bg-gray-100'} border border-gray-200 shadow-sm`}>
            <img src={LoadImage} alt="" />
          </div>
          <div className="mt-1 text-xs font-semibold text-center text-gray-700">LOAD</div>
          <div className="text-xs font-bold text-center text-gray-800">
            {solarData.loadPower} W
           
          </div>
          <div className={`mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${statuses.loadStatus.bg} ${statuses.loadStatus.color}`}>
            {statuses.loadStatus.text}
          </div>
        </div>
      </div>

      {/* Connection Lines with Flow Animation */}
      <svg className="absolute inset-0 w-full h-full" strokeWidth="2">
        {/* Grid to/from Inverter */}
        <line
          x1="80%"
          y1="49%"
          x2="49%"
          y2="49%"
          className={
            flowStatus.gridToInverter
              ? "stroke-red-500"
              : flowStatus.inverterToGrid
                ? "stroke-green-500"
                : "stroke-gray-300"
          }
          strokeDasharray={flowStatus.gridToInverter || flowStatus.inverterToGrid ? "4 2" : "none"}
          style={
            flowStatus.inverterToGrid
              ? { animation: "flowAnimation 1s linear infinite" }
              : {}
          }
        />

        {/* Grid export flow animation */}
        {flowStatus.inverterToGrid && (
          <>
            <circle cx="55%" cy="50%" r="3" className="fill-green-500 animate-pulse">
              <animate
                attributeName="cx"
                from="50%"
                to="85%"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="60%" cy="50%" r="2" className="fill-green-500 animate-pulse">
              <animate
                attributeName="cx"
                from="50%"
                to="85%"
                dur="1.7s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="65%" cy="50%" r="2.5" className="fill-green-500 animate-pulse">
              <animate
                attributeName="cx"
                from="50%"
                to="85%"
                dur="2.3s"
                repeatCount="indefinite"
              />
            </circle>
          </>
        )}

        {/* Grid import flow animation */}
        {flowStatus.gridToInverter && (
          <>
            <circle cx="60%" cy="50%" r="3" className="fill-red-500 animate-pulse">
              <animate
                attributeName="cx"
                from="85%"
                to="50%"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="70%" cy="50%" r="2" className="fill-red-500 animate-pulse">
              <animate
                attributeName="cx"
                from="85%"
                to="50%"
                dur="1.7s"
                repeatCount="indefinite"
              />
            </circle>
          </>
        )}

        {/* Solar to Inverter */}
        <line
          x1="50%"
          y1="15.5%"
          x2="50%"
          y2="40%"
          className={flowStatus.solarToInverter ? "stroke-yellow-500" : "stroke-gray-300"}
          strokeDasharray={flowStatus.solarToInverter ? "4 2" : "none"}
        />

        {/* Solar flow animation */}
        {flowStatus.solarToInverter && (
          <>
            <circle cx="50%" cy="25%" r="3" className="fill-yellow-500">
              <animate
                attributeName="cy"
                from="17%"
                to="40%"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="50%" cy="32%" r="2" className="fill-yellow-500">
              <animate
                attributeName="cy"
                from="17%"
                to="40%"
                dur="1.7s"
                repeatCount="indefinite"
              />
            </circle>
          </>
        )}

        {/* Battery to/from Inverter */}
        <line
          x1="50%"
          y1="87%"
          x2="50%"
          y2="60%"
          className={flowStatus.batteryToInverter ? "stroke-red-500" : flowStatus.inverterToBattery ? "stroke-green-500" : "stroke-gray-300"}
          strokeDasharray={flowStatus.batteryToInverter || flowStatus.inverterToBattery ? "4 2" : "none"}
        />

        {/* Battery discharge flow animation */}
        {flowStatus.batteryToInverter && (
          <>
            <circle cx="50%" cy="75%" r="3" className="fill-red-500">
              <animate
                attributeName="cy"
                from="80%"
                to="60%"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="50%" cy="68%" r="2" className="fill-red-500">
              <animate
                attributeName="cy"
                from="80%"
                to="60%"
                dur="1.7s"
                repeatCount="indefinite"
              />
            </circle>
          </>
        )}

        {/* Battery charge flow animation */}
        {flowStatus.inverterToBattery && (
          <>
            <circle cx="50%" cy="68%" r="3" className="fill-green-500">
              <animate
                attributeName="cy"
                from="60%"
                to="80%"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="50%" cy="75%" r="2" className="fill-green-500">
              <animate
                attributeName="cy"
                from="60%"
                to="80%"
                dur="1.7s"
                repeatCount="indefinite"
              />
            </circle>
          </>
        )}

        {/* Inverter to Home/Load */}
        <line
          x1="49%"
          y1="49%"
          x2="22%"
          y2="49%"
          className={flowStatus.inverterToHome ? "stroke-orange-500" : "stroke-gray-300"}
          strokeDasharray={flowStatus.inverterToHome ? "4 2" : "none"}
        />

        {/* Load flow animation */}
        {flowStatus.inverterToHome && (
          <>
            <circle cx="25%" cy="49%" r="3" className="fill-orange-500">
              <animate
                attributeName="cx"
                from="50%"
                to="22%"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="25%" cy="49%" r="2" className="fill-orange-500">
              <animate
                attributeName="cx"
                from="48%"
                to="22%"
                dur="1.9s"
                repeatCount="indefinite"
              />
            </circle>
          </>
        )}
      </svg>

      {/* CSS Animation */}
      <style>{`
        @keyframes flowAnimation {
          from {
            stroke-dashoffset: 0;
          }
          to {
            stroke-dashoffset: -6;
          }
        }
      `}</style>
    </div>
  );
};

export default KnoxDiagram;