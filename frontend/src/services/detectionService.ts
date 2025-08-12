import { getToken } from './authService';
import { baseURL, deviceId } from '../api/config';

// Cache to store detection status to reduce unnecessary API calls
const detectionStatusCache: Record<string, { enabled: boolean; timestamp: number }> = {};
const CACHE_TTL = 30000; // 30 seconds cache validity

/**
 * Enable detection for a camera on a device
 */
export const enableCameraDetection = async (
  networkId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    console.log(`🔄 Enabling detection for camera with network_id: ${networkId}`);
    
    const token = getToken();
    if (!token) throw new Error('❌ Unauthorized: No token found');

    const response = await fetch(
      `${baseURL}/device-detection/enable/${deviceId}/${networkId}`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error(`❌ Enable detection failed:`, data);
      throw new Error(data.message || 'Enable detection failed');
    }

    console.log(`✅ Detection enabled successfully for network_id: ${networkId}`);
    
    // Update cache on success
    detectionStatusCache[networkId] = {
      enabled: true,
      timestamp: Date.now()
    };

    return {
      success: true,
      message: data.data?.message || 'Detection enabled successfully',
    };
  } catch (error: any) {
    console.error('❌ Error enabling detection:', error);
    return {
      success: false,
      message: error.message || 'Unknown error occurred',
    };
  }
};

/**
 * Disable detection for a camera on a device
 */
export const disableCameraDetection = async (
  networkId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    console.log(`🔄 Disabling detection for camera with network_id: ${networkId}`);
    
    const token = getToken();
    if (!token) throw new Error('❌ Unauthorized: No token found');

    const response = await fetch(
      `${baseURL}/device-detection/disable/${deviceId}/${networkId}`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error(`❌ Disable detection failed:`, data);
      throw new Error(data.message || 'Disable detection failed');
    }

    console.log(`✅ Detection disabled successfully for network_id: ${networkId}`);
    
    // Update cache on success
    detectionStatusCache[networkId] = {
      enabled: false,
      timestamp: Date.now()
    };

    return {
      success: true,
      message: data.data?.message || 'Detection disabled successfully',
    };
  } catch (error: any) {
    console.error('❌ Error disabling detection:', error);
    return {
      success: false,
      message: error.message || 'Unknown error occurred',
    };
  }
};

/**
 * Get detection status for a specific camera
 * Uses cache if available and not expired
 */
export const getCameraDetectionStatus = async (
  networkId: string
): Promise<{ enabled: boolean; message: string }> => {
  // Check cache first for better performance
  const cachedStatus = detectionStatusCache[networkId];
  if (cachedStatus && Date.now() - cachedStatus.timestamp < CACHE_TTL) {
    console.log(`📋 Using cached detection status for network_id: ${networkId} - ${cachedStatus.enabled ? 'Enabled' : 'Disabled'}`);
    return {
      enabled: cachedStatus.enabled,
      message: 'Detection status retrieved from cache',
    };
  }

  try {
    console.log(`🔍 Fetching detection status for camera with network_id: ${networkId}`);
    
    const token = getToken();
    if (!token) throw new Error('❌ Unauthorized: No token found');

    const response = await fetch(
      `${baseURL}/device-detection/status/${deviceId}/${networkId}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    
    if (!response.ok || !data.data?.data) {
      console.error(`❌ Failed to get detection status:`, data);
      throw new Error(data.message || 'Failed to get detection status');
    }

    const enabled = data.data.data.detectionEnabled;
    console.log(`📋 Retrieved detection status for network_id: ${networkId} - ${enabled ? 'Enabled' : 'Disabled'}`);
    
    // Update cache
    detectionStatusCache[networkId] = {
      enabled: enabled,
      timestamp: Date.now()
    };

    return {
      enabled: enabled,
      message: data.data.message || 'Detection status retrieved',
    };
  } catch (error: any) {
    console.error('❌ Error fetching detection status:', error);
    return {
      enabled: false,
      message: error.message || 'Unknown error occurred',
    };
  }
};