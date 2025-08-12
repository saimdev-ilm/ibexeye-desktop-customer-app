// src/services/sensorService.ts

import { getToken } from './authService';
import { baseURL, deviceId } from '../api/config';
import webSocketService from './socketConnection';

// Sensor interface
export interface Sensor {
  id: number;
  name: string;
  mqttTopic: string;
  description: string;
  mqttHost: string;
  mqttPort: number;
  mqttUsername: string;
  mqttPassword: string;
  mqttUseTLS: boolean;
  mqttProtocol: string;
  dataType: string;
  unit: string;
  minValue: number | null;
  maxValue: number | null;
  active: boolean;
  notificationsEnabled: boolean;
  notificationThreshold: number;
  lastReading: number | null;
  lastReadingTimestamp: string | null;
  createdAt: string;
  updatedAt: string;
  zone: string | null;
}

interface SensorResponse {
  data: {
    type: string;
    command_id: string;
    data: Sensor[];
    status: number;
  };
  deviceId: number;
}

// Cache implementation
interface SensorCache {
  data: Sensor[];
  timestamp: number;
  deviceId: number;
}

// Cache configuration
const CACHE_TTL = 300000; // 5 minutes in milliseconds
const sensorCache: Record<number, SensorCache> = {};
const pendingRequests: Record<number, Promise<Sensor[]>> = {};
let websocketInitialized = false;

// Initialize the WebSocket for sensor data
const initSensorWebSocket = () => {
  if (websocketInitialized) return;
  
  // Connect WebSocket
  webSocketService.connect().then(() => {
    // Subscribe to sensor data topic
    webSocketService.subscribe('home', (message) => {
      try {
        const data = JSON.parse(message as string);
        
        // Process incoming sensor data
        if (data.batchMode && Array.isArray(data.messages)) {
          console.log('📡 Home Sensor Data Received via WebSocket:', data);
          
          // Process the sensor updates
          updateSensorCacheFromWebSocket(data.messages);
        }
      } catch (error) {
        console.error('Error processing WebSocket sensor data:', error);
      }
    });
    
    websocketInitialized = true;
  }).catch(error => {
    console.error('Failed to initialize WebSocket for sensors:', error);
  });
};

// Update sensor cache from WebSocket data
const updateSensorCacheFromWebSocket = (messages: any[]) => {
  // If we have existing sensors in cache
  if (sensorCache[deviceId]) {
    const existingSensors = new Map(sensorCache[deviceId].data.map(sensor => [sensor.id, sensor]));
    
    // Update sensors with new data
    messages.forEach(msg => {
      const sensorId = msg.sensorId || msg.id;
      
      if (sensorId && existingSensors.has(sensorId)) {
        const sensor = existingSensors.get(sensorId)!;
        
        // Update the sensor with new reading data
        existingSensors.set(sensorId, {
          ...sensor,
          lastReading: msg.value !== undefined ? msg.value : sensor.lastReading,
          lastReadingTimestamp: new Date().toISOString()
        });
      }
    });
    
    // Update the cache with merged data
    sensorCache[deviceId] = {
      ...sensorCache[deviceId],
      data: Array.from(existingSensors.values()),
      timestamp: Date.now()
    };
  }
};

// Get sensors with WebSocket priority
export const getSensorsByDeviceId = async (id: number = deviceId): Promise<Sensor[]> => {
  // Initialize WebSocket if not done yet
  if (!websocketInitialized) {
    initSensorWebSocket();
  }
  
  // First check if we have valid cached data
  if (sensorCache[id] && (Date.now() - sensorCache[id].timestamp) < CACHE_TTL) {
    return sensorCache[id].data;
  }
  
  // Check for pending requests to avoid duplicates
  if (Object.prototype.hasOwnProperty.call(pendingRequests, id)) {
    return pendingRequests[id];
  }
  
  // No valid cache, make API request
  try {
    pendingRequests[id] = fetchSensorsFromAPI(id);
    const sensors = await pendingRequests[id];
    delete pendingRequests[id];
    return sensors;
  } catch (error) {
    delete pendingRequests[id];
    throw error;
  }
};

// Fetch from API (with reduced logging)
const fetchSensorsFromAPI = async (id: number): Promise<Sensor[]> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('❌ Unauthorized: No token found');
    }

    const url = `${baseURL}/device-zone/sensors/${id}`;
    
    // Reduced logging - only log the first request in a sequence
    if (!sensorCache[id]) {
      console.log(`Fetching sensors for device ${id} from:`, url);
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Sensor API request failed:', response.status, errorData);
      throw new Error(`Sensor API request failed with status ${response.status}`);
    }

    const apiResponse: SensorResponse = await response.json();
    
    // Reduced logging
    if (!sensorCache[id]) {
      console.log('Sensor API response status:', apiResponse.data.status);
    }

    if (apiResponse.data.status !== 200) {
      throw new Error(`Sensor API returned status ${apiResponse.data.status}`);
    }

    // Update cache
    sensorCache[id] = {
      data: apiResponse.data.data,
      timestamp: Date.now(),
      deviceId: id
    };

    return apiResponse.data.data;
  } catch (error) {
    console.error('Failed to fetch sensors:', error);
    throw error;
  }
};

// Force refresh cache when needed
export const refreshSensorCache = async (id: number = deviceId): Promise<Sensor[]> => {
  delete sensorCache[id];
  delete pendingRequests[id];
  return getSensorsByDeviceId(id);
};