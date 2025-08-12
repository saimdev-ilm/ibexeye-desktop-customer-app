// src/services/sensorService.ts
import { getToken } from "./authService";
import { baseURL, deviceId } from "../api/config";
import webSocketService from "./socketConnection";

// Sensor interface based on the API response structure
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
  zone: number | Zone | null; // ← now also accepts Zone object
  reading?: Reading | null; // ← optional live reading
}

// API request interface for adding a sensor
export interface AddSensorRequest {
  name: string;
  mqttTopic: string;
  description?: string;
  mqttHost: string;
  mqttPort: number;
  mqttUsername?: string;
  mqttPassword?: string;
  mqttUseTLS?: boolean;
  mqttProtocol?: string;
  dataType: string;
  unit?: string;
  minValue?: number | null;
  maxValue?: number | null;
  active?: boolean;
  notificationsEnabled?: boolean;
  notificationThreshold?: number;
}

// API request interface for updating a sensor
export interface UpdateSensorRequest {
  name?: string;
  mqttTopic?: string;
  description?: string;
  mqttHost?: string;
  mqttPort?: number;
  mqttUsername?: string;
  mqttPassword?: string;
  mqttUseTLS?: boolean;
  mqttProtocol?: string;
  dataType?: string;
  unit?: string;
  minValue?: number | null;
  maxValue?: number | null;
  active?: boolean;
  notificationsEnabled?: boolean;
  notificationThreshold?: number;
  zone?: number | null;
}

// API response interfaces
interface SensorResponse {
  data: {
    type: string;
    command_id: string;
    data: Sensor[];
    status: number;
  };
  deviceId: number;
}

interface SingleSensorResponse {
  data: {
    type: string;
    command_id: string;
    data: Sensor;
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

export interface Zone {
  id: number;
  name: string;
  type: string;
}

export interface Reading {
  id: number;
  name: string;
  topic: string;
  broker: string;
  value: number;
  unit: string;
  timestamp: string;
  type: string;
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
  webSocketService
    .connect()
    .then(() => {
      // Subscribe to sensor data topic
      webSocketService.subscribe("home", (message) => {
        try {
          const data = JSON.parse(message as string);

          // Process incoming sensor data
          if (data.batchMode && Array.isArray(data.messages)) {
            console.log("📡 Home Sensor Data Received via WebSocket:", data);

            // Process the sensor updates
            updateSensorCacheFromWebSocket(data.messages);
          }
        } catch (error) {
          console.error("Error processing WebSocket sensor data:", error);
        }
      });

      websocketInitialized = true;
    })
    .catch((error) => {
      console.error("Failed to initialize WebSocket for sensors:", error);
    });
};

// Update sensor cache from WebSocket data
const updateSensorCacheFromWebSocket = (messages: any[]) => {
  // If we have existing sensors in cache
  if (sensorCache[deviceId]) {
    const existingSensors = new Map(
      sensorCache[deviceId].data.map((sensor) => [sensor.id, sensor])
    );

    // Update sensors with new data
    messages.forEach((msg) => {
      const sensorId = msg.sensorId || msg.id;

      if (sensorId && existingSensors.has(sensorId)) {
        const sensor = existingSensors.get(sensorId)!;

        // Update the sensor with new reading data
        existingSensors.set(sensorId, {
          ...sensor,
          lastReading: msg.value !== undefined ? msg.value : sensor.lastReading,
          lastReadingTimestamp: new Date().toISOString(),
        });
      }
    });

    // Update the cache with merged data
    sensorCache[deviceId] = {
      ...sensorCache[deviceId],
      data: Array.from(existingSensors.values()),
      timestamp: Date.now(),
    };
  }
};

/**
 * Get all sensors from a specific device with WebSocket support
 * @param id Device ID to fetch sensors from
 * @returns Promise with sensor data
 */
export const getSensorsByDeviceId = async (
  id: number = Number(deviceId)
): Promise<Sensor[]> => {
  // Initialize WebSocket if not done yet
  if (!websocketInitialized) {
    initSensorWebSocket();
  }

  // First check if we have valid cached data
  if (sensorCache[id] && Date.now() - sensorCache[id].timestamp < CACHE_TTL) {
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
      throw new Error("❌ Unauthorized: No token found");
    }

    const url = `${baseURL}/device-zone/sensors/${id}`;

    // Reduced logging - only log the first request in a sequence
    if (!sensorCache[id]) {
      console.log(`Fetching sensors for device ${id} from:`, url);
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Sensor API request failed:", response.status, errorData);
      throw new Error(
        `Sensor API request failed with status ${response.status}`
      );
    }

    const apiResponse: SensorResponse = await response.json();

    // Reduced logging
    if (!sensorCache[id]) {
      console.log("Sensor API response status:", apiResponse.data.status);
    }

    if (apiResponse.data.status !== 200) {
      throw new Error(`Sensor API returned status ${apiResponse.data.status}`);
    }

    // Update cache
    sensorCache[id] = {
      data: apiResponse.data.data,
      timestamp: Date.now(),
      deviceId: id,
    };

    return apiResponse.data.data;
  } catch (error) {
    console.error("Failed to fetch sensors:", error);
    throw error;
  }
};

/**
 * Get a specific sensor by ID
 * @param sensorId Sensor ID
 * @param deviceId Device ID
 * @returns Promise with sensor data
 */
export const getSensorById = async (
  sensorId: number,
  devId: number = Number(deviceId)
): Promise<Sensor | null> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("❌ Unauthorized: No token found");
    }

    const url = `${baseURL}/device-zone/sensors/${devId}/${sensorId}`;
    console.log(`Fetching sensor ${sensorId} from device ${devId}:`, url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Sensor API request failed:", response.status, errorData);
      throw new Error(
        `Sensor API request failed with status ${response.status}`
      );
    }

    const apiResponse: SingleSensorResponse = await response.json();
    console.log("Sensor API response status:", apiResponse.data.status);

    if (apiResponse.data.status !== 200) {
      throw new Error(`Sensor API returned status ${apiResponse.data.status}`);
    }

    // If we have a cache, update the specific sensor in the cache
    if (sensorCache[deviceId]) {
      const sensorIndex = sensorCache[deviceId].data.findIndex(
        (s) => s.id === sensorId
      );
      if (sensorIndex >= 0) {
        sensorCache[deviceId].data[sensorIndex] = apiResponse.data.data;
      }
    }

    const sensorFull = apiResponse.data.data;
    if (sensorCache[deviceId]) {
      const idx = sensorCache[deviceId].data.findIndex(
        (s) => s.id === sensorId
      );
      if (idx >= 0) sensorCache[deviceId].data[idx] = sensorFull;
    }
    return sensorFull;
  } catch (error) {
    console.error(
      `Failed to fetch sensor with ID ${sensorId} from device ${deviceId}:`,
      error
    );
    throw error;
  }
};

/**
 * Create a new sensor - FIXED VERSION
 * @param sensorData Sensor data for creation
 * @returns Promise with the created sensor
 */
export const addSensor = async (sensorData: any): Promise<Sensor> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("❌ Unauthorized: No token found");
    }

    // Validate required fields
    if (!sensorData.name) {
      throw new Error("Sensor name is required");
    }
    if (!sensorData.mqttTopic) {
      throw new Error("MQTT topic is required");
    }
    if (!sensorData.mqttHost) {
      throw new Error("MQTT host is required");
    }
    if (!sensorData.dataType) {
      throw new Error("Data type is required");
    }

    const url = `${baseURL}/device-zone/sensors`;
    console.log("Creating sensor:", sensorData);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        deviceId: sensorData.deviceId || deviceId,
        name: sensorData.name,
        mqttTopic: sensorData.mqttTopic,
        description: sensorData.description || "",
        mqttHost: sensorData.mqttHost,
        mqttPort: sensorData.mqttPort,
        mqttUsername: sensorData.mqttUsername || "",
        mqttPassword: sensorData.mqttPassword || "",
        mqttProtocol: sensorData.mqttProtocol || "mqtt",
        dataType: sensorData.dataType,
        unit: sensorData.unit || "",
        active: sensorData.active !== undefined ? sensorData.active : true,
        notificationsEnabled: sensorData.notificationsEnabled || false,
        notificationThreshold: sensorData.notificationThreshold || 0,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        "Add sensor API request failed:",
        response.status,
        errorData
      );
      throw new Error(`API request failed with status ${response.status}`);
    }

    const apiResponse: SingleSensorResponse = await response.json();
    console.log("Sensor create API response:", apiResponse);
    const isSuccess = (code: number) => code >= 200 && code < 300;

    if (!isSuccess(apiResponse.data.status)) {
      throw new Error(
        `API returned status ${apiResponse.data.status}: operation failed`
      );
    }
    // Invalidate cache to force a refresh on next fetch
    delete sensorCache[Number(deviceId)];

    return apiResponse.data.data;
  } catch (error) {
    console.error(`Failed to add sensor:`, error);
    throw error;
  }
};

/**
 * Update an existing sensor
 * @param sensorId Sensor ID to update
 * @param sensorData Sensor data for update
 * @returns Promise with the updated sensor
 */
export const updateSensor = async (
  sensorId: number,
  sensorData: any
): Promise<Sensor> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("❌ Unauthorized: No token found");
    }

    // Create clean payload with only allowed fields for UPDATE API
    const cleanPayload = {
      name: sensorData.name,
      mqttTopic: sensorData.mqttTopic,
      description: sensorData.description || "",
      mqttHost: sensorData.mqttHost,
      mqttPort: sensorData.mqttPort,
      mqttUsername: sensorData.mqttUsername || "",
      mqttPassword: sensorData.mqttPassword || "",
      mqttProtocol: sensorData.mqttProtocol || "mqtt",
      dataType: sensorData.dataType,
      unit: sensorData.unit || "",
      active: sensorData.active,
      notificationsEnabled: sensorData.notificationsEnabled || false,
      notificationThreshold: sensorData.notificationThreshold || 0,
      zoneId: sensorData.zoneId || null,
      // Exclude: id, createdAt, updatedAt, lastReading, lastReadingTimestamp, zone, minValue, maxValue, mqttUseTLS
    };

    const url = `${baseURL}/device-zone/sensors/${deviceId}/${sensorId}`;
    console.log(`Updating sensor ${sensorId}:`, cleanPayload);

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(cleanPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        "Update sensor API request failed:",
        response.status,
        errorData
      );
      throw new Error(`API request failed with status ${response.status}`);
    }

    const apiResponse: SingleSensorResponse = await response.json();
    console.log("Sensor update API response:", apiResponse);
    const isSuccess = (code: number) => code >= 200 && code < 300;

    if (!isSuccess(apiResponse.data.status)) {
      throw new Error(
        `API returned status ${apiResponse.data.status}: operation failed`
      );
    }

    // If we have a cache, update the specific sensor in the cache
    if (sensorCache[Number(deviceId)]) {
      const sensorIndex = sensorCache[Number(deviceId)].data.findIndex(
        (s) => s.id === sensorId
      );
      if (sensorIndex >= 0) {
        sensorCache[Number(deviceId)].data[sensorIndex] = apiResponse.data.data;
      }
    }

    return apiResponse.data.data;
  } catch (error) {
    console.error(`Failed to update sensor ${sensorId}:`, error);
    throw error;
  }
};

/**
 * Delete a sensor
 * @param sensorId Sensor ID to delete
 * @returns Promise with success status
 */
export const deleteSensor = async (sensorId: number): Promise<boolean> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("❌ Unauthorized: No token found");
    }

    const url = `${baseURL}/device-zone/sensors/${deviceId}/${sensorId}`;
    console.log(`Deleting sensor ${sensorId} from:`, url);

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        "Delete sensor API request failed:",
        response.status,
        errorData
      );
      throw new Error(`API request failed with status ${response.status}`);
    }

    // Invalidate cache to force a refresh on next fetch
    delete sensorCache[Number(deviceId)];

    console.log(`Successfully deleted sensor ${sensorId}`);
    return true;
  } catch (error) {
    console.error(`Failed to delete sensor ${sensorId}:`, error);
    throw error;
  }
};

/**
 * Test MQTT connection to a specific topic
 * @param mqttConfig MQTT configuration for testing
 * @returns Promise with connection status
 */
export const testMqttConnection = async (mqttConfig: {
  topic: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  useTLS?: boolean;
}): Promise<{ success: boolean; message: string }> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("❌ Unauthorized: No token found");
    }

    const url = `${baseURL}/device-zone/sensors/test-connection`;
    console.log("Testing MQTT connection:", mqttConfig);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        mqttTopic: mqttConfig.topic,
        mqttHost: mqttConfig.host,
        mqttPort: mqttConfig.port,
        mqttUsername: mqttConfig.username || "",
        mqttPassword: mqttConfig.password || "",
        mqttUseTLS: mqttConfig.useTLS || false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("MQTT test connection failed:", response.status, errorData);
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return {
      success: data.success || false,
      message: data.message || "Connection test completed",
    };
  } catch (error) {
    console.error("Failed to test MQTT connection:", error);
    throw error;
  }
};

/**
 * Add a sensor to a zone - FIXED VERSION
 * @param zoneId Zone ID
 * @param sensorId Sensor ID
 * @returns Promise with operation result
 */
export const addSensorToZone = async (
  zoneId: string,
  sensorId: number
): Promise<{ success: boolean; message: string }> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("❌ Unauthorized: No token found");
    }

    const url = `${baseURL}/device-zone/sensor-zone`;
    console.log(`Adding sensor ${sensorId} to zone ${zoneId}`);

    // Convert zoneId to NUMBER (not string) as required by the API

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        deviceId: deviceId,
        sensorId: sensorId,
        zoneId, // Send as NUMBER, not string
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        "Add sensor to zone API request failed:",
        response.status,
        errorData
      );
      throw new Error(
        `API request failed with status ${response.status}: ${JSON.stringify(
          errorData
        )}`
      );
    }

    const data = await response.json();

    // Invalidate cache to force a refresh on next fetch
    delete sensorCache[Number(deviceId)];

    return {
      success: true,
      message: `Sensor successfully added to zone`,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An error occurred";
    console.error(`Failed to add sensor ${sensorId} to zone ${zoneId}:`, error);
    return {
      success: false,
      message: errorMessage,
    };
  }
};

/**
 * Remove a sensor from a zone
 * @param sensorId Sensor ID to remove from zone
 * @returns Promise with operation result
 */
export const removeSensorFromZone = async (
  sensorId: number
): Promise<{ success: boolean; message: string }> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("❌ Unauthorized: No token found");
    }

    const url = `${baseURL}/device-zone/sensor-zone/remove`;
    console.log(`Removing sensor ${sensorId} from zone`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        deviceId: deviceId,
        sensorId: sensorId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        "Remove sensor from zone API request failed:",
        response.status,
        errorData
      );
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    // Invalidate cache to force a refresh on next fetch
    delete sensorCache[Number(deviceId)];

    return {
      success: true,
      message: `Sensor successfully removed from zone`,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An error occurred";
    console.error(`Failed to remove sensor ${sensorId} from zone:`, error);
    return {
      success: false,
      message: errorMessage,
    };
  }
};

/**
 * Get all sensors in a specific zone
 * @param deviceId Device ID
 * @param zoneId Zone ID
 * @returns Promise with sensor data
 */
export const getSensorsByZone = async (
  zoneId: number,
  deviceId: number = Number(deviceId)
): Promise<Sensor[]> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("❌ Unauthorized: No token found");
    }

    const url = `${baseURL}/device-zone/sensors-by-zone/${deviceId}/${zoneId}`;
    console.log(
      `Fetching sensors in zone ${zoneId} from device ${deviceId}:`,
      url
    );

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        "Sensors by zone API request failed:",
        response.status,
        errorData
      );
      throw new Error(`API request failed with status ${response.status}`);
    }

    const apiResponse: SensorResponse = await response.json();
    console.log(
      "Sensors by zone API response status:",
      apiResponse.data.status
    );

    if (apiResponse.data.status !== 200) {
      throw new Error(`API returned status ${apiResponse.data.status}`);
    }

    return apiResponse.data.data;
  } catch (error) {
    console.error(
      `Failed to fetch sensors in zone ${zoneId} from device ${deviceId}:`,
      error
    );
    throw error;
  }
};

/**
 * Get all unassigned sensors (not in any zone)
 * @param deviceId Device ID
 * @returns Promise with sensor data
 */
export const getUnassignedSensors = async (
  deviceId: number = Number(deviceId)
): Promise<Sensor[]> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("❌ Unauthorized: No token found");
    }

    const url = `${baseURL}/device-zone/unassigned-sensors/${deviceId}`;
    console.log(`Fetching unassigned sensors from device ${deviceId}:`, url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        "Unassigned sensors API request failed:",
        response.status,
        errorData
      );
      throw new Error(`API request failed with status ${response.status}`);
    }

    const apiResponse: SensorResponse = await response.json();
    console.log(
      "Unassigned sensors API response status:",
      apiResponse.data.status
    );

    if (apiResponse.data.status !== 200) {
      throw new Error(`API returned status ${apiResponse.data.status}`);
    }

    return apiResponse.data.data;
  } catch (error) {
    console.error(
      `Failed to fetch unassigned sensors from device ${deviceId}:`,
      error
    );
    throw error;
  }
};

/**
 * Force refresh cache when needed
 * @param id Device ID
 * @returns Promise with sensor data
 */
export const refreshSensorCache = async (
  id: number = Number(deviceId)
): Promise<Sensor[]> => {
  delete sensorCache[id];
  delete pendingRequests[id];
  return getSensorsByDeviceId(id);
};

/**
 * Get the latest reading for a specific sensor
 * This first checks the cache and then falls back to API if needed
 * @param sensorId Sensor ID
 * @returns Promise with latest reading data or null
 */
export const getLatestSensorReading = async (
  sensorId: number
): Promise<{ value: number | null; timestamp: string | null }> => {
  try {
    // Check if the sensor is in cache first
    if (sensorCache[Number(deviceId)]) {
      const cachedSensor = sensorCache[Number(deviceId)].data.find(
        (s) => s.id === sensorId
      );
      if (cachedSensor) {
        return {
          value: cachedSensor.lastReading,
          timestamp: cachedSensor.lastReadingTimestamp,
        };
      }
    }

    // Not in cache, fetch from API
    const sensor = await getSensorById(sensorId);
    if (!sensor) {
      throw new Error(`Sensor with ID ${sensorId} not found`);
    }

    return {
      value: sensor.lastReading,
      timestamp: sensor.lastReadingTimestamp,
    };
  } catch (error) {
    console.error(
      `Failed to get latest reading for sensor ${sensorId}:`,
      error
    );
    throw error;
  }
};

export default {
  getSensorsByDeviceId,
  getSensorById,
  addSensor,
  updateSensor,
  deleteSensor,
  testMqttConnection,
  addSensorToZone,
  removeSensorFromZone,
  getSensorsByZone,
  getUnassignedSensors,
  refreshSensorCache,
  getLatestSensorReading,
};
