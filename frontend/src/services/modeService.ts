// src/services/modeService.ts
import { getToken } from "./authService";
import { baseURL, deviceId } from "../api/config";

// Mode interface
export interface Camera {
  id: number;
  networkId: string;
  name: string;
  host: string;
  cloudHls?: string | null;
  localHls?: string | null;
}

export interface Sensor {
  id: number;
  name: string;
  type: string;
  mqttTopic: string;
}

export enum ModeType {
  ARM_AWAY = "ARM_AWAY",
  ARM_HOME = "ARM_HOME",
  STANDBY = "STANDBY",
  CUSTOM = "CUSTOM",
}

export interface Mode {
  id: number;
  name: string;
  isActive: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
  linkedCameras: string[];
  linkedSensors: string[];
  cameras: Camera[];
  sensors: Sensor[];
  modeType?: ModeType; // Added modeType property
}

// API response interfaces
interface ModeResponse {
  data: {
    type: string;
    command_id: string;
    data: {
      modes: Mode[];
    };
    status: number;
  };
  deviceId: number;
}

interface ModeActivateResponse {
  message: string;
  data: {
    type: string;
    command_id: string;
    message: string;
    mode: Mode;
    status: number;
  };
}

/**
 * Determine mode type based on the mode name
 * @param mode The mode object
 * @returns The mode type
 */
const determineModeType = (mode: Mode): ModeType => {
  const name = mode.name.trim().toLowerCase();

  if (name === "arm away") {
    return ModeType.ARM_AWAY;
  } else if (name === "arm home") {
    return ModeType.ARM_HOME;
  } else if (name === "standby") {
    return ModeType.STANDBY;
  } else {
    return ModeType.CUSTOM;
  }
};


/**
 * Get all modes for the device
 * @returns Promise with modes data
 */
export const getAllModes = async (): Promise<Mode[]> => {
  try {
    // Get token from auth service
    const token = getToken();
    if (!token) {
      throw new Error("❌ Unauthorized: No token found");
    }

    // Make the API request to fetch modes
    const url = `${baseURL}/device-mode/modes/${deviceId}`;
    console.log("Fetching modes from:", url);

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

    const apiResponse: ModeResponse = await response.json();
    console.log("Mode API response status:", apiResponse.data.status);

    if (apiResponse.data.status !== 200) {
      throw new Error(`API returned status ${apiResponse.data.status}`);
    }

    if (!apiResponse.data.data || !apiResponse.data.data.modes) {
      console.error("Invalid API response format:", apiResponse);
      throw new Error("Invalid API response: Expected modes data");
    }

    const modes = apiResponse.data.data.modes;
    console.log(`Found ${modes.length} modes in response`);

    // Ensure each mode has cameras and sensors arrays and determine mode type
    return modes.map((mode) => ({
      ...mode,
      cameras: Array.isArray(mode.cameras) ? mode.cameras : [],
      sensors: Array.isArray(mode.sensors) ? mode.sensors : [],
      modeType: determineModeType(mode),
    }));
  } catch (error) {
    console.error("Failed to fetch modes:", error);
    throw error;
  }
};

/**
 * Get a specific mode by ID
 * @param modeId Mode ID
 * @returns Promise with mode data
 */
export const getModeById = async (modeId: number): Promise<Mode | null> => {
  try {
    const modes = await getAllModes();
    const mode = modes.find((m) => m.id === modeId);
    return mode || null;
  } catch (error) {
    console.error(`Failed to fetch mode with ID ${modeId}:`, error);
    throw error;
  }
};

/**
 * Check if the mode is editable based on its type
 * @param mode The mode to check
 * @returns Boolean indicating if the mode is editable
 */
// Update this function in modeService.ts
export const isModeEditable = (mode: Mode): boolean => {
  // Only CUSTOM modes are editable
  return mode.modeType === ModeType.CUSTOM;
};

/**
 * Check if the mode is deletable based on its type
 * @param mode The mode to check
 * @returns Boolean indicating if the mode is deletable
 */
export const isModeDeletable = (mode: Mode): boolean => {
  // Only CUSTOM modes are deletable
  return mode.modeType === ModeType.CUSTOM;
};

/**
 * Set active mode for the device using direct mode activation endpoint
 * IMPORTANT: This response format follows exactly what the API returns
 * @param modeId Mode ID to set as active
 * @returns Promise with ModeActivateResponse structure
 */
export const setActiveMode = async (
  modeId: number
): Promise<{
  success: boolean;
  message: string;
  apiResponse?: ModeActivateResponse;
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

    // Use the new direct mode activation endpoint
    const url = `${baseURL}/device-mode/modes/${deviceId}/${modeId}/activate`;
    console.log(`Activating mode ${modeId} using direct endpoint:`, url);

    // Set a timeout to handle connection issues
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      // Clear the timeout since the request completed
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API request failed:", response.status, errorData);
        return {
          success: false,
          message: `API request failed with status ${response.status}`,
        };
      }

      const apiResponse: ModeActivateResponse = await response.json();
      console.log("Mode activation response:", apiResponse);

      // Check if the response has the expected format
      if (apiResponse && apiResponse.data && apiResponse.data.status === 200) {
        return {
          success: true,
          message: apiResponse.message || "Mode activated successfully",
          apiResponse: apiResponse,
        };
      } else {
        console.error("Invalid API response format:", apiResponse);
        return {
          success: false,
          message: "Invalid API response format",
          apiResponse: apiResponse,
        };
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        console.error("Request timed out:", fetchError);
        return {
          success: false,
          message: "Request timed out. Please try again.",
        };
      }
      console.error(`Fetch error activating mode ${modeId}:`, fetchError);
      return {
        success: false,
        message: "Network error occurred. Please check your connection.",
      };
    }
  } catch (error) {
    console.error(`Failed to set active mode ${modeId}:`, error);
    return {
      success: false,
      message: `Error: ${
        error instanceof Error ? error.message : "Unknown error occurred"
      }`,
    };
  }
};

/**
 * Create a new custom mode
 * @param {string} name - Name of the new mode
 * @param {string} description - Description of the new mode
 * @param {boolean} isActive - Whether the mode should be activated immediately
 * @returns Promise with creation response
 */
export const createMode = async (
  name: string,
  description: string,
  isActive: boolean = false
): Promise<{
  success: boolean;
  message: string;
  mode?: Mode;
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

    // Prepare request body
    const requestBody = {
      deviceId,
      name,
      description,
      isActive,
    };

    // Make the API request to create a new mode
    const url = `${baseURL}/device-mode/modes`;
    console.log("Creating new mode at:", url, requestBody);

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
        message: `Failed to create mode: ${response.status} ${
          errorData.message || ""
        }`,
      };
    }

    // Parse the successful response
    const responseData = await response.json();
    console.log("Mode creation response:", responseData);

    // Typically, the API would return the newly created mode
    // For now, we'll create a mock return with the input data
    return {
      success: true,
      message: "Mode created successfully",
      mode: {
        id: responseData.id || Math.floor(Math.random() * 1000), // Temporary ID if API doesn't return one
        name,
        description,
        isActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        linkedCameras: [],
        linkedSensors: [],
        cameras: [],
        sensors: [],
        modeType: ModeType.CUSTOM, // New modes are always CUSTOM type
      },
    };
  } catch (error) {
    console.error("Failed to create mode:", error);
    return {
      success: false,
      message: `Error: ${
        error instanceof Error ? error.message : "Unknown error occurred"
      }`,
    };
  }
};

// Add this function to your existing modeService.ts file

/**
 * Delete a mode
 * @param {number} modeId - ID of the mode to delete
 * @returns Promise with deletion response
 */
export const deleteMode = async (
  modeId: number
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

    // Make the API request to delete the mode
    const url = `${baseURL}/device-mode/modes/${deviceId}/${modeId}`;
    console.log("Deleting mode:", url);

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
        message: `Failed to delete mode: ${response.status} ${
          errorData.message || ""
        }`,
      };
    }

    // Parse the successful response
    const responseData = await response.json();
    console.log("Mode deletion response:", responseData);

    return {
      success: true,
      message: responseData.message || "Mode deleted successfully",
    };
  } catch (error) {
    console.error("Failed to delete mode:", error);
    return {
      success: false,
      message: `Error: ${
        error instanceof Error ? error.message : "Unknown error occurred"
      }`,
    };
  }
};

// In modeService.ts
export const removeComponentFromMode = async (
  modeId: number,
  componentType: 'camera' | 'sensor',
  componentId: string
): Promise<boolean> => {
  const token = getToken();
  if (!token) throw new Error("Unauthorized");

  const response = await fetch(`${baseURL}/device-mode/modes/components/remove`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      deviceId,
      modeId: modeId.toString(),
      componentType,
      componentId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to remove component");
  }

  return true;
};


