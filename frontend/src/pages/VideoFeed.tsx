import React, { useState, useEffect } from 'react';
import {
  FaCamera,
  FaPlay,
  FaStop,
  FaSyncAlt,
  FaRuler,
  FaTachometerAlt,
  FaSignal,
  FaBatteryThreeQuarters
} from 'react-icons/fa';

interface VideoFeedProps {
  droneInfo: {
    isConnected: boolean;
    model?: string;
    serialNumber?: string;
    firmwareVersion?: string;
    batteryPercentage?: number;
    isFlying?: boolean;
  };
  droneStats: {
    batteryLevel: number;
    altitude: number;
    speed: number;
    horizontalSpeed?: number;
    verticalSpeed?: number;
    gps?: number;
    signalStrength?: number;
    flying?: boolean;
    flightMode?: string;
    heading?: number;
    pitch?: number;
    roll?: number;
    yaw?: number;
    position?: {
      latitude: number;
      longitude: number;
    };
  };
  streamingStats: {
    status: "inactive" | "starting" | "active" | "stopping" | "error";
    message: string;
    bitRate?: number;
    resolution?: string;
  };
  videoActive: boolean;
  loadingStream: boolean;
  loadingCountdown: number;
  videoFeedUrl: string;
  customUrlInput: string;
  onCustomUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStartCustomStream: () => void;
  onStartLiveStream: () => void;
  onStopLiveStream: () => void;
  controlsDisabled: boolean;
}

const VideoFeed: React.FC<VideoFeedProps> = ({
  droneInfo,
  droneStats,
  streamingStats,
  videoActive,
  loadingStream,
  loadingCountdown,
  videoFeedUrl,
  customUrlInput,
  onCustomUrlChange,
  onStartCustomStream,
  onStartLiveStream,
  onStopLiveStream,
  controlsDisabled
}) => {
  const [selectedMode, setSelectedMode] = useState<string>('4K');
  const [selectedView, setSelectedView] = useState<string>('Lidar');
  const [recordingActive, setRecordingActive] = useState<boolean>(false);
  const [streamDuration, setStreamDuration] = useState<string>('00:00:00');
  
  // Update streaming duration when active
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (videoActive && streamingStats.status === 'active') {
      let seconds = 0;
      let minutes = 0;
      let hours = 0;
      
      timer = setInterval(() => {
        seconds++;
        if (seconds >= 60) {
          seconds = 0;
          minutes++;
        }
        if (minutes >= 60) {
          minutes = 0;
          hours++;
        }
        
        const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        setStreamDuration(formattedTime);
      }, 1000);
    } else {
      setStreamDuration('00:00:00');
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [videoActive, streamingStats.status]);

  // Handle mode change
  const handleModeChange = (mode: string) => {
    setSelectedMode(mode);
  };
  
  // Handle view change
  const handleViewChange = (view: string) => {
    setSelectedView(view);
  };
  
  // Toggle recording
  const handleToggleRecording = () => {
    setRecordingActive(prev => !prev);
  };

  // Get streaming badge classes
  const getStreamingBadgeClasses = () => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium flex items-center";
    
    switch (streamingStats.status) {
      case 'active':
        return `${baseClasses} bg-customBlue text-gray-200`;
      case 'starting':
        return `${baseClasses} bg-customBlue text-gray-200`;
      case 'stopping':
        return `${baseClasses} bg-customBlue text-gray-200`;
      case 'error':
        return `${baseClasses} bg-customBlue text-gray-200`;
      default:
        return `${baseClasses} bg-customBlue text-gray-200`;
    }
  };

  return (
    <div className="overflow-hidden bg-gray-100 border rounded-lg shadow-md">
      {/* Header with title and status */}
      <div className="flex items-center justify-between px-4 py-3 text-white bg-customBlue">
        <h2 className="flex items-center text-lg font-semibold">
          <FaCamera className="mr-2" /> Live Video Feed
        </h2>
        <div className="flex items-center space-x-4">
          {droneInfo.isConnected && (
            <>
              <div className="flex items-center text-sm">
                <FaBatteryThreeQuarters className={`mr-1 ${droneStats.batteryLevel < 20 ? 'text-red-400' : 'text-green-400'}`} />
                <span>{droneStats.batteryLevel}%</span>
              </div>
              <div className="flex items-center text-sm">
                <FaSignal className={`mr-1 ${droneStats.signalStrength && droneStats.signalStrength < 30 ? 'text-red-400' : 'text-green-400'}`} />
                <span>{droneStats.signalStrength || 0}%</span>
              </div>
            </>
          )}
          <span className={getStreamingBadgeClasses()}>
            {streamingStats.status === 'active' && (
              <span className="w-2 h-2 mr-1 bg-green-500 rounded-full animate-pulse"></span>
            )}
            {streamingStats.status.charAt(0).toUpperCase() + streamingStats.status.slice(1)}
          </span>
        </div>
      </div>
      
      {/* Video mode controls */}
      <div className="flex items-center justify-between p-2 text-gray-200 bg-gray-700">
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <button 
              onClick={() => handleModeChange('4K')}
              className={`px-2 py-1 text-xs rounded-l ${selectedMode === '4K' ? 'bg-blue-600 text-white' : 'bg-gray-600'}`}
            >
              4K
            </button>
            <button 
              onClick={() => handleModeChange('HD')}
              className={`px-2 py-1 text-xs ${selectedMode === 'HD' ? 'bg-blue-600 text-white' : 'bg-gray-600'}`}
            >
              HD
            </button>
            <button 
              onClick={() => handleModeChange('Thermal')}
              className={`px-2 py-1 text-xs rounded-r ${selectedMode === 'Thermal' ? 'bg-blue-600 text-white' : 'bg-gray-600'}`}
            >
              Thermal
            </button>
          </div>
          
          <div className="w-px h-6 bg-gray-500"></div>
          
          <div className="flex items-center">
            <button 
              onClick={() => handleViewChange('Lidar')}
              className={`px-2 py-1 text-xs rounded-l ${selectedView === 'Lidar' ? 'bg-blue-600 text-white' : 'bg-gray-600'}`}
            >
              Lidar
            </button>
            <button 
              onClick={() => handleViewChange('Standard')}
              className={`px-2 py-1 text-xs rounded-r ${selectedView === 'Standard' ? 'bg-blue-600 text-white' : 'bg-gray-600'}`}
            >
              Standard
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {recordingActive && (
            <div className="flex items-center">
              <span className="w-2 h-2 mr-1 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-medium text-red-400">REC</span>
            </div>
          )}
          <span className="text-sm font-semibold">{streamDuration}</span>
        </div>
      </div>

      {/* Video display container */}
      <div className="relative flex items-center justify-center h-[45vh] bg-black">
        {loadingStream ? (
          <div className="flex flex-col items-center justify-center text-white">
            <svg className="w-12 h-12 mb-4 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mb-1 text-lg">Starting live stream, please wait...</p>
            <p className="text-xl">
              Stream will be available in <span className="font-bold text-gray-400">{loadingCountdown}</span> seconds
            </p>
          </div>
        ) : videoActive ? (
          <>
            <iframe
              src={videoFeedUrl}
              className="w-full h-full border-0"
              title="Drone Live Feed"
            ></iframe>
            
            {/* Overlay elements */}
            <div className="absolute flex flex-col items-start space-y-1 text-xs text-white top-4 left-4">
              <div className="px-2 py-1 bg-black bg-opacity-50 rounded-md">
                <span className="font-mono">{selectedMode}</span>
              </div>
              <div className="px-2 py-1 bg-black bg-opacity-50 rounded-md">
                <span className="font-mono">{selectedView}</span>
              </div>
            </div>
            
            {/* Altitude indicator */}
            <div className="absolute flex flex-col items-center justify-center px-1 py-2 bg-black rounded-md top-4 left-16 bottom-4 bg-opacity-30">
              <div className="mb-1 text-xs text-white">
                <span className="font-mono">300</span>
              </div>
              <div className="relative w-6 h-40 bg-black rounded-full bg-opacity-30">
                <div 
                  className="absolute inset-x-0 bottom-0 bg-blue-400 rounded-full" 
                  style={{ height: `${(droneStats.altitude / 300) * 100}%` }}
                ></div>
              </div>
              <div className="mt-1 text-xs text-white">
                <span className="font-mono">0</span>
              </div>
            </div>
            
            {/* Compass */}
            <div className="absolute flex items-center justify-center w-16 h-16 text-white bg-black bg-opacity-50 rounded-full bottom-4 left-4">
              <div className="absolute">
                <div className="text-xs font-bold">N</div>
              </div>
              <div className="absolute rotate-90 translate-x-5">
                <div className="text-xs font-bold">E</div>
              </div>
              <div className="absolute rotate-180 translate-y-5">
                <div className="text-xs font-bold">S</div>
              </div>
              <div className="absolute -rotate-90 -translate-x-5">
                <div className="text-xs font-bold">W</div>
              </div>
              <div 
                className="absolute w-1 h-4 -translate-y-2 bg-red-500" 
                style={{ transform: `rotate(${droneStats.heading || 45}deg) translateY(-8px)` }}
              ></div>
            </div>
            
            {/* Info elements at bottom */}
            <div className="absolute flex space-x-8 text-sm text-white transform -translate-x-1/2 bottom-4 left-1/2">
              <div className="flex items-center px-3 py-1 bg-black bg-opacity-50 rounded-md">
                <FaRuler className="mr-2" /> 
                <span className="font-mono">D: {droneStats.position ? 
                  Math.round(
                    Math.sqrt(
                      Math.pow((droneStats.position.latitude - 40.7128) * 111, 2) + 
                      Math.pow((droneStats.position.longitude - (-74.0060)) * 111 * Math.cos(droneStats.position.latitude * Math.PI/180), 2)
                    ) * 1000
                  ) : 
                  2532} m</span>
              </div>
              <div className="flex items-center px-3 py-1 bg-black bg-opacity-50 rounded-md">
                <FaTachometerAlt className="mr-2" /> 
                <span className="font-mono">S: {droneStats.speed || 20} km/h</span>
              </div>
            </div>
            
            {/* Navigation controls */}
            <div className="absolute -translate-y-1/2 bg-black bg-opacity-50 rounded-full right-4 top-1/2">
              <div className="p-1">
                <div className="grid grid-cols-3 gap-1 p-1">
                  <div className="w-8 h-8"></div>
                  <button className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <div className="w-8 h-8"></div>
                  <button className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button className="flex items-center justify-center w-8 h-8 text-white bg-gray-600 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
                      <circle cx="12" cy="12" r="2" fill="currentColor" />
                    </svg>
                  </button>
                  <button className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <div className="w-8 h-8"></div>
                  <button className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="w-8 h-8"></div>
                </div>
              </div>
            </div>
            
            {/* Info button */}
            <div className="absolute flex items-center justify-center w-8 h-8 text-white bg-blue-500 rounded-full cursor-pointer right-4 top-4">
              <span className="text-lg">i</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-white">
            <FaCamera className="mb-3 text-6xl opacity-30" />
            <p className="text-lg opacity-60">Video Feed Off</p>
            <p className="mt-2 text-sm opacity-40">Click 'Start Stream' to begin</p>
          </div>
        )}
      </div>

      {/* Control panel */}
      <div className="p-4 bg-gray-900">
        {droneInfo.isConnected && (
          <div className="mb-3">
            <div className="flex items-center mb-2">
              <input
                type="text"
                value={customUrlInput}
                onChange={onCustomUrlChange}
                placeholder="Custom stream URL"
                className="flex-1 px-3 py-2 text-gray-300 bg-gray-800 border border-customBlue rounded-l-md focus:outline-none focus:ring-2 focus:ring-customBlue focus:border-customBlue"
              />
              <button
                onClick={onStartCustomStream}
                disabled={videoActive || loadingStream || !customUrlInput.trim()}
                className="px-4 py-2 text-white bg-customBlue rounded-r-md hover:bg-customBlue disabled:bg-gray-900 disabled:text-gray-300"
              >
                <FaPlay className="inline mr-1" /> Use URL
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={onStartLiveStream}
            disabled={controlsDisabled || videoActive || loadingStream}
            className="flex items-center justify-center px-4 py-2 font-semibold text-white rounded-md bg-customBlue hover:bg-customBlue disabled:bg-gray-900 disabled:text-gray-300"
          >
            <FaPlay className="mr-2" /> Start Stream
          </button>
          <button
            onClick={onStopLiveStream}
            disabled={!videoActive || loadingStream}
            className="flex items-center justify-center px-4 py-2 font-semibold text-white rounded-md bg-customBlue hover:bg-customBlue disabled:bg-gray-900 disabled:text-gray-300"
          >
            <FaStop className="mr-2" /> Stop Stream
          </button>
          <button
            onClick={handleToggleRecording}
            disabled={!videoActive || loadingStream}
            className={`flex items-center justify-center px-4 py-2 font-semibold text-white rounded-md ${recordingActive ? 'bg-red-600 hover:bg-red-700' : 'bg-customBlue hover:bg-customBlue'} disabled:bg-gray-900 disabled:text-gray-300`}
          >
            <span className={`w-2 h-2 mr-2 rounded-full ${recordingActive ? 'bg-white animate-pulse' : 'bg-white'}`}></span>
            {recordingActive ? 'Stop Rec' : 'Record'}
          </button>
        </div>

        <div className="flex justify-between mt-3 text-sm text-gray-400">
          {streamingStats.bitRate && streamingStats.resolution && (
            <>
              <span>
                <FaSyncAlt className="inline mr-1" /> Bitrate: {streamingStats.bitRate} kbps
              </span>
              <span>
                <FaCamera className="inline mr-1" /> Resolution: {streamingStats.resolution}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoFeed;
  