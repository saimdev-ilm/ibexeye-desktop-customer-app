// src/services/cameraService.ts
import { getToken } from "./authService";
import { baseURL, deviceId } from "../api/config";

// Camera interface based on the response structure
export interface Camera {
  id: string;
  name: string;
  status: string;
  localHls: string | null;
  cloudHls: string | null;
  network_id: string | undefined;
  isActive: boolean;
  mac?: string;
  is_virtual?: boolean;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  customParameters?: Record<string, unknown> | null;
  workerId?: string;
  streamInputPath?: string;
  streamKey?: string;
  authToken?: string;
  detectionEnabled?: boolean;
  zoneId?: number;
  onvifPort?: number | null;
  fixedWorkerId?: string | null;
  stream_links?:
    | {
        local?: {
          rtmp: string;
          hls: string;
          rtsp: string;
        };
        cloud?: {
          rtmp: string;
          hls: string;
          rtsp: string;
        };
      }
    | {
        rtmp: string;
        hls: string;
        rtsp: string;
      };
  location?: {
    latitude: number;
    longitude: number;
  };
}

// API request interface for add camera
export interface AddCameraRequest {
  name: string;
  is_virtual: boolean;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  streamInputPath?: string;
  detectionEnabled?: boolean;
  streamKey?: string;
  authToken?: string;
  mac?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

// API response interfaces
interface ApiCamera {
  id: number;
  mac: string;
  name: string;
  is_virtual: boolean;
  host: string;
  port: number;
  username: string;
  password: string;
  customParameters: Record<string, unknown> | null;
  isActive: boolean;
  network_id: string;
  workerId: string;
  streamInputPath: string;
  streamKey: string;
  authToken: string;
  detectionEnabled: boolean;
  zoneId: number | null;
  onvifPort: number | null;
  fixedWorkerId: string | null;
  stream_links?:
    | {
        local?: {
          rtmp: string;
          hls: string;
          rtsp: string;
        };
        cloud?: {
          rtmp: string;
          hls: string;
          rtsp: string;
        };
      }
    | {
        rtmp: string;
        hls: string;
        rtsp: string;
      };
  location?: {
    latitude: number;
    longitude: number;
  };
}

// API response interface
interface ApiResponse {
  type: string;
  command_id: string;
  data: ApiCamera[];
  status: number;
}

// Single camera read response interface
interface CameraReadResponse {
  type: string;
  command_id: string;
  message: ApiCamera;
  status: number;
}

// Camera delete response interface
interface CameraDeleteResponse {
  type: string;
  command_id: string;
  message: ApiCamera;
  status: number;
}

// Camera create response interface
interface CameraCreateResponse {
  type: string;
  command_id: string;
  data: {
    id: number;
    network_id: string;
  };
  status: number;
}

/**
 * Get all cameras for the current device
 * @returns Promise with camera data
 */
export const getAllCameras = async (): Promise<Camera[]> => {
  try {
    // Get token from auth service
    const token = getToken();
    if (!token) {
      throw new Error("❌ Unauthorized: No token found");
    }

    // Make the API request to fetch cameras
    const url = `${baseURL}/device/command`;
    console.log("Fetching cameras from:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        deviceId: deviceId,
        commandType: "fetch_cameras",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API request failed:", response.status, errorData);
      throw new Error(`API request failed with status ${response.status}`);
    }

    const apiResponse: ApiResponse = await response.json();
    console.log("Camera API response status:", apiResponse.status);

    if (apiResponse.status !== 200) {
      throw new Error(`API returned status ${apiResponse.status}`);
    }

    if (!apiResponse.data || !Array.isArray(apiResponse.data)) {
      console.error("Invalid API response format:", apiResponse);
      throw new Error("Invalid API response: Expected an array of cameras");
    }

    console.log(`Found ${apiResponse.data.length} cameras in response`);

    // Format the camera data for frontend use
    const formattedCameras = apiResponse.data.map(
      (camera: ApiCamera): Camera => {
        // Handle stream links directly from the API response
        let localHls: string | null = null;
        let cloudHls: string | null = null;

        if (camera.stream_links) {
          if ("local" in camera.stream_links && camera.stream_links.local) {
            localHls = camera.stream_links.local.hls || null;
          }
          if ("cloud" in camera.stream_links && camera.stream_links.cloud) {
            cloudHls = camera.stream_links.cloud.hls || null;
          }
          // Handle case where stream_links is not nested with local/cloud
          if ("hls" in camera.stream_links) {
            // If the URL contains a local IP address or hostname, treat as local
            const hlsUrl = camera.stream_links.hls;
            if (
              hlsUrl.includes("192.168.") ||
              hlsUrl.includes("localhost") ||
              hlsUrl.includes("127.0.0.1")
            ) {
              localHls = hlsUrl;
            } else {
              cloudHls = hlsUrl;
            }
          }
        }

        const formatted: Camera = {
          id: camera.id.toString(),
          name: camera.name || "Unnamed Camera",
          status: camera.isActive ? "Online" : "Offline",

          localHls: localHls,
          cloudHls: cloudHls,
          network_id: camera.network_id,
          isActive: camera.isActive,
          mac: camera.mac,
          is_virtual: camera.is_virtual,
          host: camera.host,
          port: camera.port,
          username: camera.username,
          password: camera.password,
          customParameters: camera.customParameters,
          workerId: camera.workerId,
          streamInputPath: camera.streamInputPath,
          streamKey: camera.streamKey,
          authToken: camera.authToken,
          detectionEnabled: camera.detectionEnabled,
          zoneId: camera.zoneId ?? undefined,
          onvifPort: camera.onvifPort,
          fixedWorkerId: camera.fixedWorkerId,
          stream_links: camera.stream_links,
          location: camera.location ?? undefined, // ✅ this line is essential
        };

        console.log(
          `Formatted camera: ${camera.name}, local stream: ${
            localHls ? "available" : "unavailable"
          }, cloud stream: ${cloudHls ? "available" : "unavailable"}`
        );

        return formatted;
      }
    );

    return formattedCameras;
  } catch (error) {
    console.error("Failed to fetch cameras:", error);
    throw error;
  }
};

/**
 * Add a new camera
 * @param cameraData Camera data for creation
 * @returns Promise with the created camera's ID and network_id
 */
export const addCamera = async (
  cameraData: AddCameraRequest
): Promise<{ id: string; network_id: string }> => {
  try {
    // Get token from auth service
    const token = getToken();
    if (!token) {
      throw new Error("❌ Unauthorized: No token found");
    }

    if (!cameraData.name) {
      throw new Error("Camera name is required");
    }

    // Validate required fields based on camera type
    if (!cameraData.is_virtual) {
      if (!cameraData.host) {
        throw new Error("Host is required for non-virtual cameras");
      }
      if (!cameraData.port) {
        throw new Error("Port is required for non-virtual cameras");
      }
    }

    // Generate a random MAC address if not provided
    if (!cameraData.mac) {
      // Create a random MAC address
      const mac = Array.from({ length: 6 }, () =>
        Math.floor(Math.random() * 256)
          .toString(16)
          .padStart(2, "0")
      )
        .join(":")
        .toUpperCase();

      cameraData.mac = mac;
    }

    // Prepare the request body - exactly matching the example API payload
    const requestBody = {
      deviceId: deviceId,
      commandType: "camera_create",
      body: {
        mac: cameraData.mac,
        name: cameraData.name,
        is_virtual: cameraData.is_virtual,
        host: cameraData.host,
        port: cameraData.port,
        username: cameraData.username || "",
        password: cameraData.password || "",
        streamInputPath: cameraData.streamInputPath || "",
        streamKey: cameraData.streamKey || "",
        authToken: cameraData.authToken || "",
        ...(cameraData.location && {
          location: {
            latitude: cameraData.location.latitude,
            longitude: cameraData.location.longitude,
          },
        }),
      },
    };

    // Make the API request to create a camera
    const url = `${baseURL}/device/command`;
    console.log("Creating camera:", requestBody);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        "Add camera API request failed:",
        response.status,
        errorData
      );
      throw new Error(`API request failed with status ${response.status}`);
    }

    const apiResponse: CameraCreateResponse = await response.json();
    console.log("Camera create API response:", apiResponse);

    if (apiResponse.status !== 200) {
      throw new Error(
        `API returned status ${apiResponse.status}: Failed to create camera`
      );
    }

    if (
      !apiResponse.data ||
      apiResponse.data.id === undefined ||
      !apiResponse.data.network_id
    ) {
      console.error("Invalid API response format:", apiResponse);
      throw new Error("Invalid API response: Missing camera data");
    }

    console.log(
      `Successfully created camera with ID: ${apiResponse.data.id}, network_id: ${apiResponse.data.network_id}`
    );

    return {
      id: apiResponse.data.id.toString(),
      network_id: apiResponse.data.network_id,
    };
  } catch (error) {
    console.error(`Failed to add camera:`, error);
    throw error;
  }
};

/**
 * Get a specific camera by ID
 * @param cameraId Camera ID
 * @returns Promise with camera data
 */
export const getCameraById = async (
  cameraId: string
): Promise<Camera | null> => {
  try {
    const cameras = await getAllCameras();
    const camera = cameras.find((cam) => cam.id === cameraId);
    return camera || null;
  } catch (error) {
    console.error(`Failed to fetch camera with ID ${cameraId}:`, error);
    throw error;
  }
};

/**
 * Get detailed information for a single camera by network_id
 * @param networkId Camera network ID
 * @returns Promise with detailed camera data
 */
export const getCameraByNetworkId = async (
  networkId: string
): Promise<Camera> => {
  try {
    // Get token from auth service
    const token = getToken();
    if (!token) {
      throw new Error("❌ Unauthorized: No token found");
    }

    // Make the API request to fetch specific camera details
    const url = `${baseURL}/device/command`;
    console.log(`Fetching camera with network_id ${networkId} from:`, url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        deviceId: deviceId,
        commandType: "camera_read",
        camera_id: networkId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API request failed:", response.status, errorData);
      throw new Error(`API request failed with status ${response.status}`);
    }

    const apiResponse: CameraReadResponse = await response.json();
    console.log("Camera read API response status:", apiResponse.status);

    if (apiResponse.status !== 200) {
      throw new Error(`API returned status ${apiResponse.status}`);
    }

    if (!apiResponse.message) {
      console.error("Invalid API response format:", apiResponse);
      throw new Error("Invalid API response: Missing camera data");
    }

    const cameraData = apiResponse.message;

    // Process stream links
    let localHls: string | null = null;
    let cloudHls: string | null = null;

    if (cameraData.stream_links) {
      if ("local" in cameraData.stream_links && cameraData.stream_links.local) {
        localHls = cameraData.stream_links.local.hls || null;
      }
      if ("cloud" in cameraData.stream_links && cameraData.stream_links.cloud) {
        cloudHls = cameraData.stream_links.cloud.hls || null;
      }
      // Handle case where stream_links is not nested with local/cloud (direct links)
      if ("hls" in cameraData.stream_links) {
        const hlsUrl = cameraData.stream_links.hls;
        // If the URL contains a local IP address or hostname, treat as local
        if (
          hlsUrl.includes("192.168.") ||
          hlsUrl.includes("localhost") ||
          hlsUrl.includes("127.0.0.1")
        ) {
          localHls = hlsUrl;
        } else {
          cloudHls = hlsUrl;
        }
      }
    }

    // Format the camera data for frontend use
    const formattedCamera: Camera = {
      id: cameraData.id.toString(),
      name: cameraData.name || "Unnamed Camera",
      status: cameraData.isActive ? "Online" : "Offline",
      localHls: localHls,
      cloudHls: cloudHls,
      network_id: cameraData.network_id,
      isActive: cameraData.isActive,
      mac: cameraData.mac,
      is_virtual: cameraData.is_virtual,
      host: cameraData.host,
      port: cameraData.port,
      username: cameraData.username,
      password: cameraData.password,
      customParameters: cameraData.customParameters,
      workerId: cameraData.workerId,
      streamInputPath: cameraData.streamInputPath,
      streamKey: cameraData.streamKey,
      authToken: cameraData.authToken,
      detectionEnabled: cameraData.detectionEnabled,
      zoneId: cameraData.zoneId ?? undefined,
      onvifPort: cameraData.onvifPort,
      fixedWorkerId: cameraData.fixedWorkerId,
      stream_links: cameraData.stream_links,
      location: cameraData.location ?? undefined,
    };

    console.log(`Retrieved detailed info for camera: ${formattedCamera.name}`);

    return formattedCamera;
  } catch (error) {
    console.error(
      `Failed to fetch camera with network_id ${networkId}:`,
      error
    );
    throw error;
  }
};

/**
 * Delete a camera by network_id
 * @param networkId Camera network ID
 * @returns Promise with the deleted camera data
 */
export const deleteCamera = async (networkId: string): Promise<Camera> => {
  try {
    // Get token from auth service
    const token = getToken();
    if (!token) {
      throw new Error("❌ Unauthorized: No token found");
    }

    if (!networkId) {
      throw new Error("Camera network_id is required for deletion");
    }

    // Make the API request to delete the camera
    const url = `${baseURL}/device/command`;
    console.log(`Deleting camera with network_id ${networkId} from:`, url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        deviceId: deviceId,
        commandType: "camera_delete",
        camera_id: networkId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        "Delete camera API request failed:",
        response.status,
        errorData
      );
      throw new Error(`API request failed with status ${response.status}`);
    }

    const apiResponse: CameraDeleteResponse = await response.json();
    console.log("Camera delete API response status:", apiResponse.status);

    if (apiResponse.status !== 200) {
      throw new Error(
        `API returned status ${apiResponse.status}: Failed to delete camera`
      );
    }

    if (!apiResponse.message) {
      console.error("Invalid API response format:", apiResponse);
      throw new Error("Invalid API response: Missing deleted camera data");
    }

    const deletedCameraData = apiResponse.message;

    // Format the deleted camera data for frontend consistency
    const deletedCamera: Camera = {
      id: deletedCameraData.id.toString(),
      name: deletedCameraData.name || "Unnamed Camera",
      status: "Deleted", // Mark specifically as deleted
      localHls: null,
      cloudHls: null,
      network_id: deletedCameraData.network_id,
      isActive: false, // Set to false since it's deleted
      mac: deletedCameraData.mac,
      is_virtual: deletedCameraData.is_virtual,
      host: deletedCameraData.host,
      port: deletedCameraData.port,
      username: deletedCameraData.username,
      password: deletedCameraData.password,
      customParameters: deletedCameraData.customParameters,
      workerId: deletedCameraData.workerId,
      streamInputPath: deletedCameraData.streamInputPath,
      streamKey: deletedCameraData.streamKey,
      authToken: deletedCameraData.authToken,
      detectionEnabled: deletedCameraData.detectionEnabled,
      zoneId: deletedCameraData.zoneId ?? undefined,
      onvifPort: deletedCameraData.onvifPort,
      fixedWorkerId: deletedCameraData.fixedWorkerId,
    };

    console.log(
      `Successfully deleted camera: ${deletedCamera.name} (ID: ${deletedCamera.id})`
    );

    return deletedCamera;
  } catch (error) {
    console.error(
      `Failed to delete camera with network_id ${networkId}:`,
      error
    );
    throw error;
  }
};

/**
 * Get the best available stream URL for a camera
 * @param camera Camera object
 * @returns The best available stream URL or undefined
 */
export const getBestStreamUrl = (camera: Camera): string | undefined => {
  // Prefer cloud HLS stream if available
  if (camera.cloudHls) {
    return camera.cloudHls;
  }

  // Fall back to local HLS stream
  if (camera.localHls) {
    return camera.localHls;
  }

  // Check alternate path in stream_links
  if (camera.stream_links) {
    if ("cloud" in camera.stream_links && camera.stream_links.cloud?.hls) {
      return camera.stream_links.cloud.hls;
    }

    if ("local" in camera.stream_links && camera.stream_links.local?.hls) {
      return camera.stream_links.local.hls;
    }

    // Handle direct stream links (not nested)
    if ("hls" in camera.stream_links) {
      return camera.stream_links.hls;
    }
  }

  // No stream available
  return undefined;
};

/**
 * Enable or disable camera detection
 * @param cameraId Camera ID
 * @param enable Whether to enable or disable detection
 * @returns Promise with response data
 */
export const toggleCameraDetection = async (
  cameraId: string,
  enable: boolean
): Promise<{ success: boolean; message: string }> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("❌ Unauthorized: No token found");
    }

    const response = await fetch(`${baseURL}/device/command`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        deviceId: deviceId,
        commandType: "set_camera_detection",
        parameters: {
          cameraId: cameraId,
          enabled: enable,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return {
      success: data.status === 200,
      message:
        data.status === 200
          ? "Camera detection updated successfully"
          : "Failed to update camera detection",
    };
  } catch (error) {
    console.error(`Failed to toggle detection for camera ${cameraId}:`, error);
    throw error;
  }
};

/**
 * Force refresh streams for a camera
 * @param cameraId Camera ID
 * @returns Promise with response data
 */
export const refreshCameraStreams = async (
  cameraId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("❌ Unauthorized: No token found");
    }

    const response = await fetch(`${baseURL}/device/command`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        deviceId: deviceId,
        commandType: "refresh_camera_streams",
        parameters: {
          cameraId: cameraId,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return {
      success: data.status === 200,
      message:
        data.status === 200
          ? "Camera streams refreshed successfully"
          : "Failed to refresh camera streams",
    };
  } catch (error) {
    console.error(`Failed to refresh streams for camera ${cameraId}:`, error);
    throw error;
  }
};

/**
 * Start camera stream relay
 * @param cameraNetworkId string
 * @returns Promise<void>
 */
export const startCameraStreamRelay = async (
  cameraNetworkId: string
): Promise<void> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("❌ Unauthorized: No token found");
    }

    const response = await fetch(`${baseURL}/device/command`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        deviceId: deviceId,
        commandType: "start_stream_relay",
        camera_id: cameraNetworkId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Start stream relay failed:", errorData);
      throw new Error(`Failed to start stream (status ${response.status})`);
    }
  } catch (error) {
    console.error(
      `Failed to start stream relay for camera ${cameraNetworkId}:`,
      error
    );
    throw error;
  }
};

export const bindCameraToSensor = async (
  cameraId: string,
  sensorId: number
): Promise<{ streamKey: string; authToken: string }> => {
  try {
    const token = getToken();
    if (!token) throw new Error("❌ Unauthorized: No token found");

    const response = await fetch(`${baseURL}/device/bind-camera`, {
      method: "POST",
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        deviceId,
        cameraId,
        sensorId,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("Bind camera failed:", err);
      throw new Error(`Bind failed with status ${response.status}`);
    }

    const data = await response.json();
    return {
      streamKey: data.streamKey,
      authToken: data.authToken,
    };
  } catch (err) {
    console.error("Error binding camera to sensor:", err);
    throw err;
  }
};

/**
 * Stop camera stream relay
 * @param cameraNetworkId string
 * @returns Promise<void>
 */
export const stopCameraStreamRelay = async (
  cameraNetworkId: string
): Promise<void> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("❌ Unauthorized: No token found");
    }

    const response = await fetch(`${baseURL}/device/command`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        deviceId: deviceId,
        commandType: "stop_stream_relay",
        camera_id: cameraNetworkId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Stop stream relay failed:", errorData);
      throw new Error(`Failed to stop stream (status ${response.status})`);
    }
  } catch (error) {
    console.error(
      `Failed to stop stream relay for camera ${cameraNetworkId}:`,
      error
    );
    throw error;
  }
};
