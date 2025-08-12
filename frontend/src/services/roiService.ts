// Updated roiService.js with better error handling, retry logic, and corrected API response handling
import { baseURL, deviceId } from '../api/config';
import { getToken } from './authService';

// Maximum number of retries for API calls
const MAX_RETRIES = 3;
// Delay between retries (in ms)
const RETRY_DELAY = 1000;

/**
 * Helper function to sleep for a given time
 * @param ms - Time to sleep in milliseconds
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Make API request with retry logic
 * @param url - API endpoint URL
 * @param options - Fetch options
 * @param retries - Number of retries attempted
 * @returns Promise with the API response
 */
const makeRequestWithRetry = async (url: string, options: RequestInit, retries = 0) => {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      // For 500 errors, we might want to retry
      if (response.status === 500 && retries < MAX_RETRIES) {
        console.log(`Received 500 error, retrying (${retries + 1}/${MAX_RETRIES})...`);
        await sleep(RETRY_DELAY); // Wait before retrying
        return makeRequestWithRetry(url, options, retries + 1);
      }
      
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }
    
    return response;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Failed to fetch') && retries < MAX_RETRIES) {
      console.log(`Network error, retrying (${retries + 1}/${MAX_RETRIES})...`);
      await sleep(RETRY_DELAY); // Wait before retrying
      return makeRequestWithRetry(url, options, retries + 1);
    }
    throw error;
  }
};

/**
 * Save Regions of Interest (ROI) for a specific camera
 * 
 * @param networkId - The network ID of the camera
 * @param rois - Array of ROI data in format [width, height, [centerX, centerY], frameWidth, frameHeight]
 * @param sensitivity - Sensitivity parameter (default: 1000)
 * @param blur - Blur parameter (default: 20)
 * @param morphology - Morphology parameter (default: 20)
 * @returns Promise that resolves when the API call completes
 */
export const saveROI = async (
  networkId: string,
  rois: [number, number, [number, number], number, number][],
  sensitivity = 1000,
  blur = 20,
  morphology = 20,
) => {
  try {
    const token = getToken();

    if (!token) {
      throw new Error('❌ Unauthorized: No token found');
    }
    
    const requestBody = {
      rois: rois.length > 0 ? rois : [[0, 0, [0, 0], 0, 0]], // Fallback if empty
      sensitivity,
      blur,
      morphology,
    };

    console.log(`Saving ROI for network_id ${networkId} with request body:`, requestBody);

    const response = await makeRequestWithRetry(
      `${baseURL}/device-detection/config/${deviceId}/${networkId}`,
      {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    const result = await response.json();
    console.log('ROI save response:', result);
    
    return result;
  } catch (error) {
    console.error('ROI SAVING ERROR:', error);
    throw error;
  }
};

/**
 * Get the detection status and ROI configuration for a camera
 * 
 * @param networkId - The network ID of the camera
 * @returns Promise with the detection status and configuration
 */
export const getDetectionStatus = async (networkId: string) => {
  try {
    const token = getToken();

    if (!token) {
      throw new Error('❌ Unauthorized: No token found');
    }

    console.log(`Fetching detection status for network_id ${networkId}`);

    const response = await makeRequestWithRetry(
      `${baseURL}/device-detection/status/${deviceId}/${networkId}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();
    console.log(`Detection status retrieved for network_id ${networkId}:`, result);
    
    // The API returns nested data structure as shown in your example
    // We're extracting the important parts for easier use in the application
    if (result && result.data && result.data.data) {
      const detectionData = result.data.data;
      return {
        cameraId: detectionData.cameraId,
        networkId: detectionData.networkId,
        name: detectionData.name,
        enabled: detectionData.detectionEnabled,
        isActive: detectionData.isActive,
        config: detectionData.config || {}
      };
    }
    
    return result; // Return original response if structure is different
  } catch (error) {
    console.error(`Error fetching detection status for network_id ${networkId}:`, error);
    throw error;
  }
};

/**
 * Enable motion detection for a camera
 * 
 * @param networkId - The network ID of the camera
 * @returns Promise with the result
 */
export const enableDetection = async (networkId: string) => {
  try {
    const token = getToken();

    if (!token) {
      throw new Error('❌ Unauthorized: No token found');
    }

    console.log(`Enabling detection for network_id ${networkId}`);

    // First check the current status to avoid unnecessary enabling
    try {
      const status = await getDetectionStatus(networkId);
      if (status && status.enabled === true) {
        console.log(`Detection already enabled for network_id ${networkId}`);
        return { message: "Detection already enabled", data: { status: 200 } };
      }
    } catch (statusError) {
      console.warn(`Could not check current detection status: ${statusError}`);
      // Continue with enable attempt even if status check fails
    }

    const response = await makeRequestWithRetry(
      `${baseURL}/device-detection/enable/${deviceId}/${networkId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();
    console.log(`Detection enabled for network_id ${networkId}`);
    return result;
  } catch (error) {
    console.error(`Error enabling detection for network_id ${networkId}:`, error);
    throw error;
  }
};

/**
 * Disable motion detection for a camera
 * 
 * @param networkId - The network ID of the camera
 * @returns Promise with the result
 */
export const disableDetection = async (networkId: string)  => {
  try {
    const token = getToken();

    if (!token) {
      throw new Error('❌ Unauthorized: No token found');
    }

    console.log(`Disabling detection for network_id ${networkId}`);

    // First check the current status to avoid unnecessary disabling
    try {
      const status = await getDetectionStatus(networkId);
      if (status && status.enabled === false) {
        console.log(`Detection already disabled for network_id ${networkId}`);
        return { message: "Detection already disabled", data: { status: 200 } };
      }
    } catch (statusError) {
      console.warn(`Could not check current detection status: ${statusError}`);
      // Continue with disable attempt even if status check fails
    }

    const response = await makeRequestWithRetry(
      `${baseURL}/device-detection/disable/${deviceId}/${networkId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();
    console.log(`Detection disabled for network_id ${networkId}`);
    return result;
  } catch (error) {
    console.error(`Error disabling detection for network_id ${networkId}:`, error);
    throw error;
  }
};

/**
 * Get all cameras with their detection status
 * 
 * @returns Promise with the list of cameras and their detection status
 */
export const getAllCamerasWithDetection = async () => {
  try {
    const token = getToken();

    if (!token) {
      throw new Error('❌ Unauthorized: No token found');
    }

    console.log('Fetching all cameras with detection status');

    const response = await makeRequestWithRetry(
      `${baseURL}/device-detection/cameras/${deviceId}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();
    console.log('All cameras with detection status retrieved');
    
    // Process the result to match the expected format if needed
    if (result && result.data && Array.isArray(result.data.data)) {
      return result.data.data.map(camera => ({
        cameraId: camera.cameraId,
        networkId: camera.networkId,
        name: camera.name,
        enabled: camera.detectionEnabled,
        isActive: camera.isActive,
        config: camera.config || {}
      }));
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching all cameras with detection status:', error);
    throw error;
  }
};

/**
 * Get all active detections on a device
 * 
 * @returns Promise with the list of active detections
 */
export const getActiveDetections = async () => {
  try {
    const token = getToken();

    if (!token) {
      throw new Error('❌ Unauthorized: No token found');
    }

    console.log('Fetching all active detections');

    const response = await makeRequestWithRetry(
      `${baseURL}/device-detection/active-detections/${deviceId}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();
    console.log('Active detections retrieved');
    
    // Process the result to match the expected format if needed
    if (result && result.data && result.data.data) {
      return result.data.data;
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching active detections:', error);
    throw error;
  }
};

/**
 * Get a single frame from a camera
 * 
 * @param networkId - The network ID of the camera
 * @returns Promise with the frame data
 */
export const getCameraFrame = async (networkId: string)  => {
  try {
    const token = getToken();

    if (!token) {
      throw new Error('❌ Unauthorized: No token found');
    }

    console.log(`Fetching frame for network_id ${networkId}`);

    const response = await makeRequestWithRetry(
      `${baseURL}/device-detection/frame/${deviceId}/${networkId}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();
    console.log(`Frame retrieved for network_id ${networkId}`);
    
    // Process the result to match the expected format if needed
    if (result && result.data && result.data.data) {
      return result.data.data;
    }
    
    return result;
  } catch (error) {
    console.error(`Error fetching frame for network_id ${networkId}:`, error);
    throw error;
  }
};