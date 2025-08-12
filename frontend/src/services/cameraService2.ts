import axios from "axios";
import { baseURL } from "../api/config";
import { getAuthHeaders } from "./authService";

// Camera interfaces
export interface Camera {
  id: number;
  mac: string;
  name: string;
  is_virtual: boolean;
  host: string;
  port: number;
  username: string;
  password: string;
  customParameters: any;
  isActive: boolean;
  network_id: string;
  workerId: string;
  streamInputPath: string;
  streamKey: string;
  authToken: string;
  detectionEnabled: boolean;
  zoneId: number;
  onvifPort: number | null;
  stream_links: {
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
  };
}

// Enhanced camera with additional properties for frontend use
export interface EnhancedCamera extends Camera {
  status: string;
  localHls?: string;
  cloudHls?: string;
}

/**
 * Fetch cameras from the API and enhance them with additional properties
 * @returns Promise with array of enhanced cameras
 */
export const fetchCamerasService = async (): Promise<EnhancedCamera[]> => {
  try {
    const headers = getAuthHeaders();
    
    // Make the API request to the device command endpoint
    const response = await axios.post(
      `${API_URL}/device/command`, 
      {
        deviceId: 1,
        commandType: "fetch_cameras"
      },
      { headers }
    );
    
    // Check if the response has the expected structure
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      // Extract the camera data
      const camerasData: Camera[] = response.data.data;
      
      // Enhance each camera with additional properties
      const enhancedCameras: EnhancedCamera[] = camerasData.map(camera => {
        // Determine camera status (for example purposes)
        const status = camera.isActive ? "Online" : "Offline";
        
        // Extract HLS stream URLs for easier access
        const localHls = camera.stream_links.local?.hls || null;
        const cloudHls = camera.stream_links.cloud?.hls || null;
        
        return {
          ...camera,
          status,
          localHls,
          cloudHls
        };
      });
      
      return enhancedCameras;
    } else {
      throw new Error("Invalid response format");
    }
  } catch (error) {
    console.error("Failed to fetch cameras:", error);
    throw error;
  }
};

/**
 * Add a new camera
 * @param cameraData New camera data
 * @returns Promise with the newly created camera
 */
export const addCameraService = async (cameraData: Partial<Camera>): Promise<Camera> => {
  try {
    const headers = getAuthHeaders();
    
    // Make the API request to add a new camera
    const response = await axios.post(
      `${API_URL}/device/camera`, 
      cameraData,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error("Failed to add camera:", error);
    throw error;
  }
};

/**
 * Update an existing camera
 * @param cameraId Camera ID
 * @param cameraData Updated camera data
 * @returns Promise with the updated camera
 */
export const updateCameraService = async (cameraId: number, cameraData: Partial<Camera>): Promise<Camera> => {
  try {
    const headers = getAuthHeaders();
    
    // Make the API request to update the camera
    const response = await axios.put(
      `${API_URL}/device/camera/${cameraId}`, 
      cameraData,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error(`Failed to update camera ${cameraId}:`, error);
    throw error;
  }
};

/**
 * Delete a camera
 * @param cameraId Camera ID
 * @returns Promise with the response data
 */
export const deleteCameraService = async (cameraId: number): Promise<any> => {
  try {
    const headers = getAuthHeaders();
    
    // Make the API request to delete the camera
    const response = await axios.delete(
      `${API_URL}/device/camera/${cameraId}`,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error(`Failed to delete camera ${cameraId}:`, error);
    throw error;
  }
};