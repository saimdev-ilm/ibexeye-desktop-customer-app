// src/services/recordingService.ts
import { getToken } from "./authService";
import { baseURL, deviceId } from "../api/config";

// Zone interface
export interface Zone {
  id: number;
  name: string;
  type: string;
}

// Recording interface
export interface Recording {
  id: string;
  deviceId: string;
  filename: string;
  path: string;
  size: number;
  duration: number | null;
  createdAt: string;
  url: string;
  cameraName: string;
  cameraId: number;
  networkId: string;
  zone: Zone;
}

// Pagination interface
export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Filters interface
export interface Filters {
  devices: {
    id: string;
    date: string;
  }[];
  sessions: string[];
}

// API response interface
interface RecordingsResponse {
  data: {
    type: string;
    command_id: string;
    data: {
      data: Recording[];
      filters: Filters;
      pagination: Pagination;
    };
    status: number;
  };
  deviceId: number;
}

// Query params interface
export interface RecordingsQueryParams {
  page?: number;
  limit?: number;
  sessionId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Get recordings from the device with optional filters
 * @param queryParams Optional query parameters for filtering recordings
 * @returns Promise with recordings data, filters, and pagination
 */
export const getRecordings = async (
  queryParams?: RecordingsQueryParams
): Promise<{
  recordings: Recording[];
  filters: Filters;
  pagination: Pagination;
}> => {
  try {
    // Get token from auth service
    const token = getToken();
    if (!token) {
      throw new Error("❌ Unauthorized: No token found");
    }

    // Build query string
    let queryString = "";
    if (queryParams) {
      const params = new URLSearchParams();
      if (queryParams.page) params.append("page", queryParams.page.toString());
      if (queryParams.limit)
        params.append("limit", queryParams.limit.toString());
      if (queryParams.sessionId)
        params.append("sessionId", queryParams.sessionId);
      if (queryParams.startDate)
        params.append("startDate", queryParams.startDate);
      if (queryParams.endDate) params.append("endDate", queryParams.endDate);

      queryString = params.toString() ? `?${params.toString()}` : "";
    } else {
      // Default pagination
      queryString = "?page=1&limit=20";
    }

    // Make the API request to fetch recordings
    const url = `${baseURL}/device-recordings/${deviceId}${queryString}`;
    console.log("Fetching recordings from:", url);

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

    const apiResponse: RecordingsResponse = await response.json();
    console.log("Recordings API response status:", apiResponse.data.status);

    if (apiResponse.data.status !== 200) {
      throw new Error(`API returned status ${apiResponse.data.status}`);
    }

    if (!apiResponse.data.data) {
      console.error("Invalid API response format:", apiResponse);
      throw new Error("Invalid API response: Expected recordings data");
    }

    return {
      recordings: apiResponse.data.data.data,
      filters: apiResponse.data.data.filters,
      pagination: apiResponse.data.data.pagination,
    };
  } catch (error) {
    console.error("Failed to fetch recordings:", error);
    throw error;
  }
};

/**
 * Get streaming URL for a recording with authentication token
 * @param recordingId ID of the recording or full URL
 * @returns Full URL to stream the recording with authentication token
 */
export const getRecordingStreamUrl = (
  recordingId: string | Recording
): string => {
  const token = getToken();

  if (!token) {
    console.error("Authentication token is missing");
    // Return a URL that will trigger an auth error to make it obvious there's an issue
    return `${baseURL}/device-recordings/serve/1/${
      typeof recordingId === "string" ? recordingId : recordingId.id
    }`;
  }

  // Extract the ID if a Recording object was passed
  const id = typeof recordingId === "string" ? recordingId : recordingId.id;

  // Build the authenticated URL
  const streamUrl = `${baseURL}/device-recordings/serve/1/${id}?token=${token}`;

  return streamUrl;
};

/**
 * Format file size in bytes to human-readable format
 * @param bytes File size in bytes
 * @returns Formatted size string (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Format date string to a readable format
 * @param dateString ISO date string
 * @returns Formatted date string
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString();
};
