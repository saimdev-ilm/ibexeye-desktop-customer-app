import { useMemo, useState, useEffect } from 'react';
// ✅ Updated import - Use Context instead of direct service
import { useWebSocketData, useWebSocket } from "../../../contexts/WebSocketContext";
import InverterImage from "../../../assets/images/solar-inverter.png"
import LoadImage from "../../../assets/images/bulbicon.png"
import GridImage from "../../../assets/images/gridicon2.png"
import SolarImage from "../../../assets/images/brightnessIcon.png"
import BatteryImage from "../../../assets/images/batteryicon2.png"

const SolisDiagram = () => {
  // ✅ Use WebSocket Context
  const { isConnected: wsConnected } = useWebSocket();
  const solisData = useWebSocketData('solis');
  const [isConnected, setIsConnected] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // ✅ Enhanced connection timeout logic with Context awareness
  useEffect(() => {
    console.log('🔍 SolisDiagram - Context Data:', {
      solisData: solisData ? Object.keys(solisData) : 'null',
      wsConnected,
      dataLength: solisData ? Object.keys(solisData).length : 0
    });

    if (wsConnected && solisData && Object.keys(solisData).length > 0) {
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
    } else {
      // If WebSocket is disconnected or no data, set as disconnected
      setIsConnected(false);
    }

    // Cleanup timeout on unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [solisData, wsConnected]);

  // Calculate all data and statuses based on solisData
  const { solarData, statuses, flowStatus } = useMemo(() => {
    if (!solisData || !isConnected || !wsConnected) {
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
    const gridPower = parseFloat(String(solisData['solis/inverter_1/Total_Grid_Power'] || '0'));

    // Solar data
    const solarPower = parseFloat(String(solisData['solis/inverter_1/Total_PV_Output_Power'] || '0'));

    // Battery data
    const batteryPower = parseFloat(String(solisData['solis/inverter_1/Battery_Power'] || '0'));
    const batterySoc = solisData['solis/inverter_1/Battery_Capacity'] || '0%';

    // Load data
    const mainLoadPower = parseFloat(String(solisData['solis/inverter_1/Main_Load_Power'] || '0'));
    const backupLoadPower = parseFloat(String(solisData['solis/inverter_1/Backup_Load_Power'] || '0'));
    const loadPower = mainLoadPower + backupLoadPower;

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
  }, [solisData, isConnected, wsConnected]);

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
            {Math.abs(solarData.gridPower).toFixed(1)} KW
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
              {solarData.solarPower.toFixed(1)} W
            </div>
            <div className={`mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${statuses.solarStatus.bg} ${statuses.solarStatus.color}`}>
              {statuses.solarStatus.text}
            </div>
          </div>
        </div>
      </div>

      {/* Battery - Bottom */}
      <div className="absolute transform -translate-x-1/2 bottom-4 left-1/2">
        <div className="flex flex-col items-center">
          <div className={`flex items-center justify-center w-12 h-12 rounded-full ${statuses.batteryStatus.text !== 'Idle' ? statuses.batteryStatus.bg : 'bg-gray-100'} border border-gray-200 shadow-sm`}>
            <img src={BatteryImage} alt="" />
          </div>
          <div className="absolute right-16 bottom-2">
            <div className="text-xs font-bold text-center text-gray-800 ">
              {Math.abs(solarData.batteryPower).toFixed(1)} W
              <span className="ml-1 text-gray-600 text-nowrap">({String(solarData.batterySoc)})</span>
              <span className={`ml-1 ${statuses.batteryStatus.color}`}>
                {solarData.batteryPower > 0 ? '(CHG)' : solarData.batteryPower < 0 ? '(DCHG)' : ''}
              </span>
            </div>
            <div className="mt-1 text-xs font-semibold text-center text-gray-700">BATTERY</div>
            <div className={`mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${statuses.batteryStatus.bg} ${statuses.batteryStatus.color}`}>
              {statuses.batteryStatus.text}
            </div>
          </div>
        </div>
      </div>

      {/* Home/Load - Left */}
      <div className="absolute transform -translate-y-1/2 left-16 top-1/2">
        <div className="flex flex-col items-center">
          <div className={`flex items-center justify-center w-12 h-12 rounded-full ${statuses.loadStatus.text !== 'Idle' ? statuses.loadStatus.bg : 'bg-gray-100'} border border-gray-200 shadow-sm`}>
            <img src={LoadImage} alt="" />
          </div>
          <div className="mt-1 text-xs font-semibold text-center text-gray-700">LOAD</div>
          <div className="text-xs font-bold text-center text-gray-800">
            {solarData.loadPower.toFixed(1)} W
            <span className={`ml-1 ${statuses.loadStatus.color}`}>
              {solarData.loadPower > 0 ? '(USING)' : ''}
            </span>
          </div>
          <div className={`mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${statuses.loadStatus.bg} ${statuses.loadStatus.color}`}>
            {statuses.loadStatus.text}
          </div>
        </div>
      </div>

      {/* ✅ Restored Original Flow Animation with Proper Alignment */}
      <svg className="absolute inset-0 w-full h-full" strokeWidth="2">
        {/* Grid to/from Inverter - Horizontal Line */}
        <line
          x1="76%" y1="50%" x2="50%" y2="50%"
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
              : flowStatus.gridToInverter
                ? { animation: "flowAnimation 1s linear infinite reverse" }
                : {}
          }
        />

        {/* Grid export flow animation - Inverter to Grid */}
        {flowStatus.inverterToGrid && (
          <>
            <circle cx="60%" cy="50%" r="3" className="fill-green-500 animate-pulse">
              <animate
                attributeName="cx"
                from="50%"
                to="76%"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="65%" cy="50%" r="2" className="fill-green-500 animate-pulse">
              <animate
                attributeName="cx"
                from="50%"
                to="76%"
                dur="1.7s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="70%" cy="50%" r="2.5" className="fill-green-500 animate-pulse">
              <animate
                attributeName="cx"
                from="58%"
                to="76%"
                dur="2.3s"
                repeatCount="indefinite"
              />
            </circle>
          </>
        )}

        {/* Grid import flow animation - Grid to Inverter */}
        {flowStatus.gridToInverter && (
          <>
            <circle cx="70%" cy="50%" r="3" className="fill-red-500 animate-pulse">
              <animate
                attributeName="cx"
                from="76%"
                to="50%"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="68%" cy="50%" r="2" className="fill-red-500 animate-pulse">
              <animate
                attributeName="cx"
                from="76%"
                to="50%"
                dur="1.7s"
                repeatCount="indefinite"
              />
            </circle>
          </>
        )}

        {/* Solar to Inverter - Vertical Line */}
        <line
          x1="50%" y1="18%" x2="50%" y2="42%"
          className={flowStatus.solarToInverter ? "stroke-yellow-500" : "stroke-gray-300"}
          strokeDasharray={flowStatus.solarToInverter ? "4 2" : "none"}
          style={
            flowStatus.solarToInverter
              ? { animation: "flowAnimation 1s linear infinite" }
              : {}
          }
        />

        {/* Solar flow animation */}
        {flowStatus.solarToInverter && (
          <>
            <circle cx="50%" cy="25%" r="3" className="fill-yellow-500">
              <animate
                attributeName="cy"
                from="18%"
                to="42%"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="50%" cy="32%" r="2" className="fill-yellow-500">
              <animate
                attributeName="cy"
                from="18%"
                to="42%"
                dur="1.7s"
                repeatCount="indefinite"
              />
            </circle>
          </>
        )}

        {/* Battery to/from Inverter - Vertical Line */}
        <line
          x1="50%" y1="82%" x2="50%" y2="58%"
          className={flowStatus.batteryToInverter ? "stroke-red-500" : flowStatus.inverterToBattery ? "stroke-green-500" : "stroke-gray-300"}
          strokeDasharray={flowStatus.batteryToInverter || flowStatus.inverterToBattery ? "4 2" : "none"}
          style={
            flowStatus.batteryToInverter
              ? { animation: "flowAnimation 1s linear infinite" }
              : flowStatus.inverterToBattery
                ? { animation: "flowAnimation 1s linear infinite reverse" }
                : {}
          }
        />

        {/* Battery discharge flow animation */}
        {flowStatus.batteryToInverter && (
          <>
            <circle cx="50%" cy="75%" r="3" className="fill-red-500">
              <animate
                attributeName="cy"
                from="82%"
                to="58%"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="50%" cy="68%" r="2" className="fill-red-500">
              <animate
                attributeName="cy"
                from="82%"
                to="58%"
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
                from="58%"
                to="82%"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="50%" cy="75%" r="2" className="fill-green-500">
              <animate
                attributeName="cy"
                from="58%"
                to="82%"
                dur="1.7s"
                repeatCount="indefinite"
              />
            </circle>
          </>
        )}

        {/* Inverter to Home/Load - Horizontal Line */}
        <line
          x1="48%" y1="50%" x2="24%" y2="50%"
          className={flowStatus.inverterToHome ? "stroke-orange-500" : "stroke-gray-300"}
          strokeDasharray={flowStatus.inverterToHome ? "4 2" : "none"}
          style={
            flowStatus.inverterToHome
              ? { animation: "flowAnimation 1s linear infinite" }
              : {}
          }
        />

        {/* Load flow animation */}
        {flowStatus.inverterToHome && (
          <>
            <circle cx="38%" cy="50%" r="3" className="fill-orange-500">
              <animate
                attributeName="cx"
                from="48%"
                to="24%"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="30%" cy="50%" r="2" className="fill-orange-500">
              <animate
                attributeName="cx"
                from="48%"
                to="24%"
                dur="1.7s"
                repeatCount="indefinite"
              />
            </circle>
          </>
        )}
      </svg>

      {/* ✅ Original CSS Animation */}
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

export default SolisDiagram;