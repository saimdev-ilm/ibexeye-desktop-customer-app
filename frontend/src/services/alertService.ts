import { getToken } from './authService';
import { baseURL, deviceId } from '../api/config';

// Alert interface based on the response structure
export interface Alert {
  id: number;
  view: number;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  cameraId: string;
  motionType: string | null;
  mediaPath: string | null;
  mediaType: string | null;
  nodeId: string | null;
  deviceId: string | null;
  s3_key: string | null;
  sessionId: string | null;
  orgId: string | null;
  mediaUrl: string | null;
}

// Alert response interface
export interface AlertResponse {
  data: Alert[];
  total: number; // number of items fetched in this response
}

// Pagination and filter parameters interface
export interface AlertQueryParams {
  limit?: number;
  offset?: number;
  type?: string;
  startDate?: string; // Format: YYYY-MM-DD
  endDate?: string;   // Format: YYYY-MM-DD
  search?: string;    // Search query
}

/**
 * Get paginated device alerts with optional filtering
 * @param params Optional pagination and filter parameters
 * @returns Promise with alerts data
 */
export const getAlerts = async (params?: AlertQueryParams): Promise<AlertResponse> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('❌ Unauthorized: No token found');
    }

    let url = `${baseURL}/alert/device/${deviceId}`;

    if (params) {
      const queryParams = new URLSearchParams();
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset !== undefined) queryParams.append('offset', params.offset.toString());
      if (params.type && params.type !== 'all') queryParams.append('type', params.type);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.search) queryParams.append('search', params.search);

      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    console.log("Fetching alerts from:", url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const responseData = await response.json();
    const data = responseData.data || [];

    return {
      data,
      total: data.length
    };
  } catch (error) {
    console.error('Failed to fetch alerts:', error);
    throw error;
  }
};

/**
 * Mark an alert as viewed
 * @param alertId Alert ID
 * @returns Promise with response data
 */
export const markAlertAsViewed = async (alertId: number): Promise<{ success: boolean; message: string }> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('❌ Unauthorized: No token found');
    }

    const response = await fetch(`${baseURL}/alert/device/${alertId}/view`, {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to mark alert as viewed:', error);
    throw error;
  }
};

/**
 * Helper function to determine if alert media is an image
 * @param alert Alert object
 * @returns boolean indicating if the media is an image
 */
export const isImage = (alert: Alert): boolean => {
  if (alert.mediaType?.startsWith("image")) return true;
  if (alert.mediaUrl?.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) return true;
  if (alert.mediaUrl?.includes('s3.') && 
      (alert.mediaUrl.toLowerCase().includes('.jpg') || 
      alert.mediaUrl.toLowerCase().includes('.jpeg') || 
      alert.mediaUrl.toLowerCase().includes('.png'))) return true;
  if (alert.mediaPath?.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) return true;
  if (alert.s3_key?.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) return true;
  if (alert.s3_key?.includes('detected_')) return true;

  return false;
};

/**
 * Helper function to get the correct media URL for an alert
 * @param alert Alert object
 * @returns string URL of the media
 */
export const getMediaUrl = (alert: Alert): string | undefined => {
  if (alert.mediaUrl) return alert.mediaUrl;
  if (alert.s3_key) return `${baseURL}/media/${alert.s3_key}`;
  if (alert.mediaPath) return `${baseURL}/media/${alert.mediaPath}`;
  if (alert.id) return `${baseURL}/alert/media/${alert.id}`;
  return undefined;
};
