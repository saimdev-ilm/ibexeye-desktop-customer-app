// src/services/zoneService.ts
import { getToken } from "./authService";
import { baseURL, deviceId } from "../api/config";
import { getAllCameras } from "./cameraService";

// Zone and Sensor interfaces
export interface Camera {
  id: number;
  networkId?: string;
  name: string;
  host?: string;
  cloudHls?: string | null;
  localHls?: string | null;
}

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
  relatedCamera: any | null;
  reading: {
    id: number;
    name: string;
    topic: string;
    broker: string;
    value: number;
    unit: string;
    timestamp: string;
    type: string;
  } | null;
}

export interface Zone {
  id: number;
  name: string;
  description: string;
  type: string;
  isActive: boolean;
  cameras: Camera[];
  sensors: Sensor[];
}

// API response interfaces
interface ZoneResponse {
  data: {
    type: string;
    command_id: string;
    data: {
      zones: Zone[];
    };
    status: number;
  };
  deviceId: number;
}

interface ZoneCreateResponse {
  data: {
    type: string;
    command_id: string;
    data: {
      zone: Zone;
    };
    status: number;
  };
  deviceId: number;
}

interface ZoneUpdateResponse {
  data: {
    type: string;
    command_id: string;
    data: {
      zone: Zone;
    };
    status: number;
  };
  deviceId: number;
}

interface ZoneDeleteResponse {
  data: {
    type: string;
    command_id: string;
    message: string;
    status: number;
  };
  deviceId: number;
}

interface CameraZoneResponse {
  data: any;
  deviceId: number;
  cameraId: string;
}

/**
 * Get all zones for the device
 * @returns Promise with zones data
 */
export const getAllZones = async (): Promise<Zone[]> => {
  try {
    // Get token from auth service
    const token = getToken();
    if (!token) {
      throw new Error("❌ Unauthorized: No token found");
    }

    // Make the API request to fetch zones
    const url = `${baseURL}/device-zone/zones/${deviceId}`;
    console.log("Fetching zones from:", url);

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
      console.error("API request failed:", response.status, errorData);
      throw new Error(`API request failed with status ${response.status}`);
    }

    const apiResponse: ZoneResponse = await response.json();
    console.log("Zone API response status:", apiResponse.data.status);

    if (apiResponse.data.status !== 200) {
      throw new Error(`API returned status ${apiResponse.data.status}`);
    }

    if (!apiResponse.data.data || !apiResponse.data.data.zones) {
      console.error("Invalid API response format:", apiResponse);
      throw new Error("Invalid API response: Expected zones data");
    }

    const zones = apiResponse.data.data.zones;
    console.log(`Found ${zones.length} zones in response`);

    // Ensure each zone has cameras and sensors arrays
    return zones.map((zone) => ({
      ...zone,
      cameras: Array.isArray(zone.cameras) ? zone.cameras : [],
      sensors: Array.isArray(zone.sensors) ? zone.sensors : [],
    }));
  } catch (error) {
    console.error("Failed to fetch zones:", error);
    throw error;
  }
};

/**
 * Get a specific zone by ID
 * @param zoneId Zone ID
 * @returns Promise with zone data
 */
export const getZoneById = async (zoneId: number | string): Promise<Zone | null> => {
  try {
    const zones = await getAllZones();
    const zone = zones.find((z) => z.id === Number(zoneId));
    return zone || null;
  } catch (error) {
    console.error(`Failed to fetch zone with ID ${zoneId}:`, error);
    throw error;
  }
};

/**
 * Create a new zone
 * @param {string} name - Name of the new zone
 * @param {string} description - Description of the new zone
 * @param {string} type - Type of zone (e.g., "factory", "office-building", etc.)
 * @returns Promise with creation response
 */
export const createZone = async (
  name: string,
  description: string,
  type: string
): Promise<{
  success: boolean;
  message: string;
  zone?: Zone;
}> => {
  try {
    // Get token from auth service
    const token = getToken();
    if (!token) {
      return {
        success: false,
        message: "Unauthorized: No token found",
      };
    }

    // Prepare request body - updated to match API spec
    const requestBody = {
      deviceId,
      name,
      description,
      type,
    };

    // Make the API request to create a new zone
    const url = `${baseURL}/device-zone/zones`;
    console.log("Creating new zone at:", url, requestBody);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API request failed:", response.status, errorData);
      return {
        success: false,
        message: `Failed to create zone: ${response.status} ${
          errorData.message || ""
        }`,
      };
    }

    // Parse the successful response
    const responseData: ZoneCreateResponse = await response.json();
    console.log("Zone creation response:", responseData);

    if (responseData.data.status !== 201) { // Updated status code to 201 per API spec
      return {
        success: false,
        message: "Invalid API response: Expected 201 status code",
      };
    }

    return {
      success: true,
      message: "Zone created successfully",
      zone: responseData.data.data?.zone,
    };
  } catch (error) {
    console.error("Failed to create zone:", error);
    return {
      success: false,
      message: `Error: ${
        error instanceof Error ? error.message : "Unknown error occurred"
      }`,
    };
  }
};

/**
 * Update an existing zone
 * @param {number|string} zoneId - ID of the zone to update
 * @param {Partial<Zone>} zoneData - Partial zone data for update
 * @returns Promise with update response
 */
export const updateZone = async (
  zoneId: number | string,
  zoneData: Partial<Zone>
): Promise<{
  success: boolean;
  message: string;
  zone?: Zone;
}> => {
  try {
    // Get token from auth service
    const token = getToken();
    if (!token) {
      return {
        success: false,
        message: "Unauthorized: No token found",
      };
    }

    // Extract only allowed fields to update per API spec
    const { name, description, type } = zoneData;
    const requestBody = { name, description, type };

    // Make the API request to update the zone
    const url = `${baseURL}/device-zone/zones/${deviceId}/${zoneId}`;
    console.log("Updating zone:", url, requestBody);

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API request failed:", response.status, errorData);
      return {
        success: false,
        message: `Failed to update zone: ${response.status} ${
          errorData.message || ""
        }`,
      };
    }

    // Parse the successful response
    const responseData: ZoneUpdateResponse = await response.json();
    console.log("Zone update response:", responseData);

    if (responseData.data.status !== 200 || !responseData.data.data?.zone) {
      return {
        success: false,
        message: "Invalid API response: Expected zone data",
      };
    }

    return {
      success: true,
      message: "Zone updated successfully",
      zone: responseData.data.data.zone,
    };
  } catch (error) {
    console.error(`Failed to update zone ${zoneId}:`, error);
    return {
      success: false,
      message: `Error: ${
        error instanceof Error ? error.message : "Unknown error occurred"
      }`,
    };
  }
};

/**
 * Delete a zone
 * @param {number|string} zoneId - ID of the zone to delete
 * @returns Promise with deletion response
 */
export const deleteZone = async (
  zoneId: number | string
): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    // Get token from auth service
    const token = getToken();
    if (!token) {
      return {
        success: false,
        message: "Unauthorized: No token found",
      };
    }

    // Make the API request to delete the zone
    const url = `${baseURL}/device-zone/zones/${deviceId}/${zoneId}`;
    console.log("Deleting zone:", url);

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
      console.error("API request failed:", response.status, errorData);
      return {
        success: false,
        message: `Failed to delete zone: ${response.status} ${
          errorData.message || ""
        }`,
      };
    }

    // Parse the successful response
    const responseData: ZoneDeleteResponse = await response.json();
    console.log("Zone deletion response:", responseData);

    if (responseData.data.status !== 200) {
      return {
        success: false,
        message: responseData.data.message || "Failed to delete zone",
      };
    }

    return {
      success: true,
      message: responseData.data.message || "Zone deleted successfully",
    };
  } catch (error) {
    console.error(`Failed to delete zone ${zoneId}:`, error);
    return {
      success: false,
      message: `Error: ${
        error instanceof Error ? error.message : "Unknown error occurred"
      }`,
    };
  }
};

 
/**
 * Add a camera to a zone
 * @param {number|string} zoneId - ID of the zone
 * @param {number|string} cameraId - ID of the camera to add (local ID)
 * @returns Promise with response
 */
export const addCameraToZone = async (
  zoneId: number | string,
  cameraId: number | string
): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    // Get token from auth service
    const token = getToken();
    if (!token) {
      return {
        success: false,
        message: "Unauthorized: No token found",
      };
    }

    // First, find the camera to get its network_id
    const cameras = await getAllCameras();
    // Convert both to strings for comparison to avoid type issues
    const cameraIdStr = String(cameraId);
    const camera = cameras.find(c => String(c.id) === cameraIdStr);
    
    if (!camera) {
      return {
        success: false,
        message: "Camera not found",
      };
    }
    
    if (!camera.network_id) {
      return {
        success: false,
        message: "Camera does not have a network_id",
      };
    }

    // Prepare request body
    const requestBody = {
      deviceId,
      cameraId: camera.network_id, // Use network_id instead of id
      zoneId: String(zoneId) // Ensure zoneId is a string as per API spec
    };

    // Make the API request to add camera to zone
    const url = `${baseURL}/device-zone/camera-zone`;
    console.log("Adding camera to zone:", url, requestBody);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API request failed:", response.status, errorData);
      return {
        success: false,
        message: `Failed to add camera to zone: ${response.status} ${
          errorData.message || ""
        }`,
      };
    }

    // Parse the successful response
    const responseData = await response.json();
    console.log("Add camera to zone response:", responseData);

    return {
      success: true,
      message: "Camera added to zone successfully",
    };
  } catch (error) {
    console.error(`Failed to add camera ${cameraId} to zone ${zoneId}:`, error);
    return {
      success: false,
      message: `Error: ${
        error instanceof Error ? error.message : "Unknown error occurred"
      }`,
    };
  }
};


/**
 * Remove a camera from a zone
 * @param {number|string} cameraId - ID of the camera to remove (local ID)
 * @returns Promise with response
 */
export const removeCameraFromZone = async (
  cameraId: number | string
): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    // Get token from auth service
    const token = getToken();
    if (!token) {
      return {
        success: false,
        message: "Unauthorized: No token found",
      };
    }

    // First, find the camera to get its network_id
    const cameras = await getAllCameras();
    // Convert both to strings for comparison to avoid type issues
    const cameraIdStr = String(cameraId);
    const camera = cameras.find(c => String(c.id) === cameraIdStr);
    
    if (!camera) {
      return {
        success: false,
        message: "Camera not found",
      };
    }
    
    if (!camera.network_id) {
      return {
        success: false,
        message: "Camera does not have a network_id",
      };
    }

    // Prepare request body - updated to match API spec
    const requestBody = {
      deviceId,
      cameraId: camera.network_id // Use network_id instead of id
    };

    // Make the API request to remove camera from zone
    const url = `${baseURL}/device-zone/camera-zone/remove`;
    console.log("Removing camera from zone:", url, requestBody);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API request failed:", response.status, errorData);
      return {
        success: false,
        message: `Failed to remove camera from zone: ${response.status} ${
          errorData.message || ""
        }`,
      };
    }

    // Parse the successful response
    const responseData = await response.json();
    console.log("Remove camera from zone response:", responseData);

    return {
      success: true,
      message: "Camera removed from zone successfully",
    };
  } catch (error) {
    console.error(`Failed to remove camera ${cameraId} from zone:`, error);
    return {
      success: false,
      message: `Error: ${
        error instanceof Error ? error.message : "Unknown error occurred"
      }`,
    };
  }
};

// First, let's create proper addSensorToZone and removeSensorFromZone functions:

/**
 * Add a sensor to a zone
 * @param {number|string} zoneId - ID of the zone
 * @param {number|string} sensorId - ID of the sensor to add
 * @returns Promise with response
 */
export const addSensorToZone = async (
  zoneId: number | string,
  sensorId: number | string
): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    // Get token from auth service
    const token = getToken();
    if (!token) {
      return {
        success: false,
        message: "Unauthorized: No token found",
      };
    }

    // Prepare request body - using the same API as camera-zone
    const requestBody = {
      deviceId,
      cameraId: String(sensorId), // Using sensorId in the cameraId field
      zoneId: String(zoneId)
    };

    // Make the API request to add sensor to zone - using the camera zone endpoint
    const url = `${baseURL}/device-zone/camera-zone`;
    console.log("Adding sensor to zone:", url, requestBody);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API request failed:", response.status, errorData);
      return {
        success: false,
        message: `Failed to add sensor to zone: ${response.status} ${
          errorData.message || ""
        }`,
      };
    }

    // Parse the successful response
    const responseData = await response.json();
    console.log("Add sensor to zone response:", responseData);

    return {
      success: true,
      message: "Sensor added to zone successfully",
    };
  } catch (error) {
    console.error(`Failed to add sensor ${sensorId} to zone ${zoneId}:`, error);
    return {
      success: false,
      message: `Error: ${
        error instanceof Error ? error.message : "Unknown error occurred"
      }`,
    };
  }
};

/**
 * Remove a sensor from a zone
 * @param {number|string} sensorId - ID of the sensor to remove
 * @returns Promise with response
 */
export const removeSensorFromZone = async (
  sensorId: number | string
): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    // Get token from auth service
    const token = getToken();
    if (!token) {
      return {
        success: false,
        message: "Unauthorized: No token found",
      };
    }

    // Prepare request body - using the same API as camera-zone
    const requestBody = {
      deviceId,
      cameraId: String(sensorId) // Using sensorId in the cameraId field
    };

    // Make the API request to remove sensor from zone - using the camera zone endpoint
    const url = `${baseURL}/device-zone/camera-zone/remove`;
    console.log("Removing sensor from zone:", url, requestBody);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API request failed:", response.status, errorData);
      return {
        success: false,
        message: `Failed to remove sensor from zone: ${response.status} ${
          errorData.message || ""
        }`,
      };
    }

    // Parse the successful response
    const responseData = await response.json();
    console.log("Remove sensor from zone response:", responseData);

    return {
      success: true,
      message: "Sensor removed from zone successfully",
    };
  } catch (error) {
    console.error(`Failed to remove sensor ${sensorId} from zone:`, error);
    return {
      success: false,
      message: `Error: ${
        error instanceof Error ? error.message : "Unknown error occurred"
      }`,
    };
  }
};



/**
 * Get camera zone information
 * @param {number|string} cameraId - ID of the camera
 * @returns Promise with camera zone info
 */
export const getCameraZoneInfo = async (
  cameraId: number | string
): Promise<any> => {
  try {
    // Get token from auth service
    const token = getToken();
    if (!token) {
      throw new Error("❌ Unauthorized: No token found");
    }

    // Make the API request to fetch camera zone info
    const url = `${baseURL}/device-zone/camera-zone/${deviceId}/${cameraId}`;
    console.log("Fetching camera zone info from:", url);

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
      console.error("API request failed:", response.status, errorData);
      throw new Error(`API request failed with status ${response.status}`);
    }

    const apiResponse: CameraZoneResponse = await response.json();
    console.log("Camera zone info API response:", apiResponse);

    return apiResponse.data;
  } catch (error) {
    console.error(`Failed to fetch camera zone info for camera ${cameraId}:`, error);
    throw error;
  }
};

/**
 * Get all cameras in a specific zone
 * @param {number|string} zoneId - ID of the zone
 * @returns Promise with cameras data
 */
export const getCamerasInZone = async (zoneId: number | string): Promise<Camera[]> => {
  try {
    // Get token from auth service
    const token = getToken();
    if (!token) {
      throw new Error("❌ Unauthorized: No token found");
    }

    // Make the API request to fetch cameras in zone
    const url = `${baseURL}/device-zone/cameras/${deviceId}/${zoneId}`;
    console.log("Fetching cameras in zone from:", url);

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
      console.error("API request failed:", response.status, errorData);
      throw new Error(`API request failed with status ${response.status}`);
    }

    const apiResponse = await response.json();
    console.log("Cameras in zone API response:", apiResponse);

    // Extract cameras from response
    const cameras = apiResponse.data || [];
    return cameras;
  } catch (error) {
    console.error(`Failed to fetch cameras in zone ${zoneId}:`, error);
    throw error;
  }
};

/**
 * Get all unassigned cameras (not in any zone)
 * @returns Promise with unassigned cameras data
 */
export const getUnassignedCameras = async (): Promise<Camera[]> => {
  try {
    // Get token from auth service
    const token = getToken();
    if (!token) {
      throw new Error("❌ Unauthorized: No token found");
    }

    // Make the API request to fetch unassigned cameras
    const url = `${baseURL}/device-zone/unassigned-cameras/${deviceId}`;
    console.log("Fetching unassigned cameras from:", url);

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
      console.error("API request failed:", response.status, errorData);
      throw new Error(`API request failed with status ${response.status}`);
    }

    const apiResponse = await response.json();
    console.log("Unassigned cameras API response:", apiResponse);

    // Extract unassigned cameras from response
    const cameras = apiResponse.data || [];
    return cameras;
  } catch (error) {
    console.error("Failed to fetch unassigned cameras:", error);
    throw error;
  }
};