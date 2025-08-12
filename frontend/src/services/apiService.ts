import axios, { AxiosError } from "axios";

// const API_URL = "http://raspberrypi.local:8080";
const API_URL = "https://stream-tst-sbx.ibexvision.ai";

// Function to log in a user and store profile data
export const loginUser = async (email: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/user/login`, {
      email,
      password,
    });

    const data = response.data;

    if (data.access_token) {
      // Save the token and other user details to localStorage
      localStorage.setItem("authToken", data.access_token);
      localStorage.setItem("userId", data.id);
      localStorage.setItem("userName", `${data.firstName} ${data.lastName}`);
      localStorage.setItem("userEmail", data.email);
      localStorage.setItem("profileData", JSON.stringify(data)); // Save profile data
    }

    return data;
  } catch (error: any) {
    // Handle Axios and non-Axios errors
    if (axios.isAxiosError(error) && error.response) {
      console.error("Login error:", error.response.data);
    } else {
      console.error("Error during login:", error.message);
    }
    throw error;
  }
};


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

// Pagination interface
export interface Pagination {
  total: number;
  page: number;
  limit: number;
}

// Alert response interface
export interface AlertResponse {
  data: Alert[];
  pagination: Pagination;
}

/**
 * Get alerts with pagination
 * @param page Page number
 * @param limit Number of items per page
 * @param priority Optional priority filter
 * @param status Optional status filter
 * @returns Promise with alerts data
 */
export const getAlerts = async (
  page: number = 1, 
  limit: number = 20,
  priority?: string,
  status?: string
): Promise<AlertResponse> => {
  try {

    const authToken = localStorage.getItem("authToken");
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
    
    // Build query parameters
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (priority) {
      params.append('priority', priority);
    }
    
    if (status) {
      params.append('status', status);
    }
    
    // Make the API request to the correct endpoint: /alert/customer
    const response = await axios.get(`${API_URL}/alert/customer`, { params, headers });
    
    // Return the data
    return response.data;
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
export const markAlertAsViewed = async (alertId: number): Promise<any> => {
  try {
    const authToken = localStorage.getItem("authToken");
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
    
    const response = await axios.put(`${API_URL}/alert/customer/${alertId}/view`, (headers));
    return response.data;
  } catch (error) {
    console.error('Failed to mark alert as viewed:', error);
    throw error;
  }
};


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

// Enhanced camera object with derived properties for the UI
export interface EnhancedCamera extends Camera {
  status: string;
  localHls?: string;
  cloudHls?: string;
}



 
/**
 * Get a single alert by ID
 */
export const getAlertById = async (alertId: number): Promise<Alert> => {
  try {
    const authToken = localStorage.getItem("authToken");
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
    
    const response = await axios.get(`${API_URL}/alert/${alertId}`, { headers });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch alert ${alertId}:`, error);
    throw error;
  }
};

 

// Function to fetch cameras from API
export const fetchCamerasService = async (): Promise<EnhancedCamera[]> => {
  try {
    // Get auth token from localStorage
    const authToken = localStorage.getItem("authToken");
    
    // Make request with authorization header if token exists
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
    const response = await axios.get(`${API_URL}/camera`, { headers });
    
    // Transform camera data for UI use
    const cameras: EnhancedCamera[] = response.data.data.map((camera: Camera) => {
      return {
        ...camera,
        // Derive camera status based on isActive
        status: camera.isActive ? "Online" : "Offline",
        // Extract HLS streams for easy access
        localHls: camera.stream_links.local?.hls || null,
        cloudHls: camera.stream_links.cloud?.hls || null
      };
    });
    
    return cameras;
  } catch (error) {
    console.error("Failed to fetch cameras:", error);
    throw error;
  }
};

// Function to add a new camera
export const addCameraService = async (cameraData: Partial<Camera>): Promise<Camera> => {
  try {
    const authToken = localStorage.getItem("authToken");
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
    
    const response = await axios.post(`${API_URL}/camera`, cameraData, { headers });
    return response.data;
  } catch (error) {
    console.error("Failed to add camera:", error);
    throw error;
  }
};

// Function to update an existing camera
export const updateCameraService = async (cameraId: number, cameraData: Partial<Camera>): Promise<Camera> => {
  try {
    const authToken = localStorage.getItem("authToken");
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
    
    const response = await axios.put(`${API_URL}/camera/${cameraId}`, cameraData, { headers });
    return response.data;
  } catch (error) {
    console.error(`Failed to update camera ${cameraId}:`, error);
    throw error;
  }
};

// Function to delete a camera
export const deleteCameraService = async (cameraId: number): Promise<void> => {
  try {
    const authToken = localStorage.getItem("authToken");
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
    
    await axios.delete(`${API_URL}/camera/${cameraId}`, { headers });
  } catch (error) {
    console.error(`Failed to delete camera ${cameraId}:`, error);
    throw error;
  }
};




// Function to allow a user to listen to a device
export const listenToDevice = async (userId: number, deviceId: number) => {
  try {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      throw new Error("User is not authenticated");
    }

    const response = await axios.post(
      `${API_URL}/device/listen`,
      {
        userId,
        deviceId,
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("Listen error:", error.response.data);
    } else {
      console.error("Error listening to device:", error.message);
    }
    throw error;
  }
};



// Function to sign up a new user
export const signupUser = async (userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  org_id: string;
  role_id: string;
}) => {
  try {
    const response = await axios.post(`${API_URL}/user/signup`, userData);
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("Signup error:", error.response.data);
      throw new Error(error.response.data.message || "Signup failed.");
    } else {
      console.error("Error during signup:", error.message);
      throw new Error("An unexpected error occurred.");
    }
  }
};

// Function to fetch all cameras with authentication token
// export const fetchAllCameras = async () => {
//   try {
//     const token = localStorage.getItem("authToken"); // Get token from localStorage
//     if (!token) {
//       throw new Error("Unauthorized: No token found");
//     }

//     const response = await axios.get(`${API_URL}/camera`, {
//       headers: {
//         Accept: "application/json",
//         Authorization: `Bearer ${token}`, // Add token to headers
//       },
//     });

//     return response.data; // Return the data containing cameras info
//   } catch (error: any) {
//     if (axios.isAxiosError(error) && error.response) {
//       console.error("Fetch all cameras error:", error.response.data);
//     } else {
//       console.error("Error during API call:", error.message);
//     }
//     throw error; // Re-throw error for further handling
//   }
// };


// Function to fetch user devices
export const fetchUserDevices = async () => {
  try {
    const token = localStorage.getItem("authToken"); // Get token from localStorage
    if (!token) {
      throw new Error("Unauthorized: No token found");
    }

    const response = await axios.get(`${API_URL}/device/my-devices`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`, // Add token to headers
      },
    });

    return response.data; // Return the data containing devices info
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("Fetch user devices error:", error.response.data);
    } else {
      console.error("Error during API call:", error.message);
    }
    throw error; // Re-throw error for further handling
  }
};

// Function to fetch user areas
export const fetchUserAreas = async () => {
  try {
    const token = localStorage.getItem("authToken"); // Get token from localStorage
    if (!token) {
      throw new Error("Unauthorized: No token found");
    }

    const response = await axios.get(`${API_URL}/site/user`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`, // Add token to headers
      },
    });

    return response.data; // Return the data containing areas info
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("Fetch user areas error:", error.response.data);
    } else {
      console.error("Error during API call:", error.message);
    }
    throw error; // Re-throw error for further handling
  }
};

export const fetchAlertsBySensor = async (limit = 10, offset = 0) => {
  try {
    const sensorId = 4; // ✅ Hardcoded Sensor ID
    const token = localStorage.getItem("authToken"); // ✅ Get stored auth token
    if (!token) throw new Error("Unauthorized: No token found");

    const response = await axios.get(`${API_URL}/alert/sensor/${sensorId}`, {
      params: { limit, offset },
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`, // ✅ Include auth token
      },
    });

    if (!response.data?.data) {
      throw new Error("Invalid API response: No alert data found");
    }

    return response.data.data; // Return the array of alerts
  } catch (error: any) {
    console.error("❌ Error fetching alerts:", error.message);
    throw error;
  }
};

export const saveROI2Service = async (deviceId: number, cameraId: number, roi: any) => {
  try {
    const token = localStorage.getItem("authToken"); // Get token from localStorage
    if (!token) {
      throw new Error("Unauthorized: No token found");
    }

    const response = await axios.post(
      `${API_URL}/device/command`,
      {
        deviceId,
        commandType: "camera_detection_config",
        camera_id: cameraId,
        body: { roi },
      },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("✅ ROI 2 saved successfully:", response.data);
    return response.data; // Return API response
  } catch (error: any) {
    console.error("❌ Error saving ROI 2:", error.response?.data || error.message);
    throw error;
  }
};


// Function to create a new site
export const createSite = async (siteLabel: string) => {
  try {
    const token = localStorage.getItem("authToken"); // Get token from localStorage

    if (!token) {
      throw new Error("Unauthorized: No token found.");
    }

    const response = await axios.post(
      `${API_URL}/Site`,
      { site_label: siteLabel },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.site; // Return the created site data
  } catch (error: any) {
    console.error("❌ Error creating site:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Error creating site.");
  }
};

 

 
// Service function to fetch all cameras
// export const fetchCamerasService = async () => {
//   try {
//     const token = localStorage.getItem("authToken");
//     if (!token) {
//       throw new Error("Unauthorized: No token found");
//     }

//     const response = await axios.post(
//       `${API_URL}/device/command`,
//       {
//         deviceId: 1,
//         commandType: "camera_read",
//       },
//       {
//         headers: {
//           Accept: "application/json",
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );

//     if (!response.data?.data || !Array.isArray(response.data.data)) {
//       throw new Error("Invalid API response: Expected an array of cameras");
//     }

//     // Process and return formatted camera data
//     return response.data.data.map((camera: any) => {
//       const localHls = camera.stream_links?.local?.hls || null; // ✅ Get local HLS or set to null
//       const detectionConfig = camera.detectionConfig || {};

//       console.log(`🎥 Camera: ${camera.name} | HLS: ${localHls ? "✅ Found" : "❌ Not Available"}`);

//       return {
//         id: camera.id ?? Math.random(), // Use existing ID or fallback to random
//         name: camera.name || "Unnamed Camera",
//         status: camera.isActive ? "Online" : "Offline",
//         localHls,
//         detectionConfig, // ✅ Include detectionConfig

//       };
//     });
//   } catch (error: any) {
//     console.error("❌ Error fetching cameras:", error.message);
//     throw error;
//   }
// };


// Function to create a new camera
export const createCameraService = async (cameraData: {
  host: string;
  port: number;
  username: string;
  password: string;
  name: string;
  is_virtual: boolean;
  streamInputPath: string;
}) => {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) {
      throw new Error("Unauthorized: No token found");
    }

    const response = await axios.post(
      `${API_URL}/device/command`,
      {
        deviceId: 1,
        commandType: "camera_create",
        body: cameraData,
      },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ✅ Auth token included
        },
      }
    );

    console.log("✅ Camera created successfully:", response.data);
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("❌ Camera creation error:", error.response.data);
    } else {
      console.error("❌ Error:", error.message);
    }
    throw error;
  }
};


export const fetchCameraByIdService = async (cameraId: number) => {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) {
      throw new Error("Unauthorized: No token found");
    }

    const response = await axios.post(
      `${API_URL}/device/command`,
      {
        deviceId: 1, // Adjust if necessary
        commandType: "camera_read",
        camera_id: cameraId, // ✅ Correct placement
      },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.data?.data) {
      throw new Error("Invalid API response: Camera data missing");
    }

    const camera = response.data.data; // ✅ Get single camera data

    return {
      id: camera.id ?? Math.random(),
      name: camera.name || "Unnamed Camera",
      status: camera.isActive ? "Online" : "Offline",
      localHls: camera.stream_links?.local?.hls || null, // ✅ Ensure HLS exists
      detectionConfig: camera.detectionConfig || {}, // ✅ Ensure detection config exists
    };
  } catch (error: any) {
    console.error("❌ Error fetching camera by ID:", error.message);
    throw error;
  }
};


// export const updateCameraService = async (cameraId: number, updatedData: any) => {
//   try {
//     const token = localStorage.getItem("authToken");
//     if (!token) {
//       throw new Error("Unauthorized: No token found");
//     }

//     const response = await axios.put(
//       `${API_URL}/camera/${cameraId}`, // ✅ Assuming the update API is PUT /camera/{id}
//       updatedData,
//       {
//         headers: {
//           Accept: "application/json",
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );

//     return response.data; // ✅ Return updated camera data
//   } catch (error: any) {
//     console.error("❌ Error updating camera:", error.message);
//     throw error;
//   }
// };


// Function to add a new camera with authentication token



export const addCamera = async (cameraData: {
  host: string;
  port: number;
  username: string;
  password: string;
  name: string;
  isActive: boolean;
  lastSeen: string;
  authToken: string;
  streamKey: string;
  streamInputPath: string;
}) => {
  try {
    // Get the auth token from localStorage
    const token = localStorage.getItem("authToken");
    if (!token) {
      throw new Error("Unauthorized: No token found");
    }

    const response = await axios.post(
      `${API_URL}/camera`,
      {
        host: cameraData.host,
        port: cameraData.port,
        username: cameraData.username,
        password: cameraData.password,
        name: cameraData.name,
        isActive: cameraData.isActive,
        lastSeen: cameraData.lastSeen,
        authToken: cameraData.authToken,
        streamKey: cameraData.streamKey,
        streamInputPath: cameraData.streamInputPath,
      },
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`, // Add token to headers
        },
      }
    );

    return response.data; // Return the response data containing the new camera info
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("Add camera error:", error.response.data);
    } else {
      console.error("Error during API call:", error.message);
    }
    throw error; // Re-throw error for further handling
  }
};

// Function to start a camera stream
export const startCameraStream = async (cameraId: number) => {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) {
      throw new Error("Unauthorized: No token found");
    }

    console.log("Starting stream with cameraId:", cameraId); // Debug log

    const response = await axios.post(
      `${API_URL}/camera/start-stream`,
      { cameraId },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("Stream started API response:", response.data); // Debug log
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("Start camera stream error response:", error.response.data);
    }
    throw error;
  }
};

// Function to delete a camera by ID
export const deleteCamera = async (id: number) => {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) {
      throw new Error("Unauthorized: No token found");
    }

    const response = await axios.delete(`${API_URL}/camera/${id}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data; // Return the success message after deletion
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("Delete camera error:", error.response.data);
    } else {
      console.error("Error during API call:", error.message);
    }
    throw error;
  }
};

// Function to fetch active camera streams with authentication token
export const fetchActiveStreams = async () => {
  try {
    const token = localStorage.getItem("authToken"); // Get token from localStorage
    if (!token) {
      throw new Error("Unauthorized: No token found");
    }

    const response = await axios.get(`${API_URL}/camera/active-streams`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`, // Add token to headers
      },
    });

    return response.data; // Return the data containing active streams info
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("Fetch active streams error:", error.response.data);
    } else {
      console.error("Error during API call:", error.message);
    }
    throw error; // Re-throw error for further handling
  }
};

// Function to handle password change
export const changePassword = async (
  oldPassword: string,
  newPassword: string
) => {
  try {
    const token = localStorage.getItem("authToken"); // Add token if needed for authentication
    const { data } = await axios.post(
      `${API_URL}/user/change-pass`,
      {
        old_password: oldPassword,
        new_password: newPassword,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Include token if required
        },
      }
    );
    return data;
  } catch (error: unknown) {
    handleAxiosError(error); // Handle errors
    throw error;
  }
};

// Function to fetch profile data from local storage
export const fetchProfileData = () => {
  try {
    const profileData = localStorage.getItem("profileData");
    if (profileData) {
      return JSON.parse(profileData);
    } else {
      throw new Error("Profile data not found in local storage.");
    }
  } catch (error) {
    console.error("Error fetching profile data:", (error as Error).message);
    throw error;
  }
};

// Function to check if the user is an admin
export const checkAdminStatus = async (): Promise<boolean> => {
  try {
    const token = localStorage.getItem("authToken");
    await axios.get(`${API_URL}/admin/is-admin`, {
      headers: {
        Authorization: `Bearer ${token}`, // Pass the token in headers
      },
    });

    return true; // If the request succeeds, the user is an admin
  } catch (error: unknown) {
    const axiosError = error as AxiosError;

    // If the status is 401, the user is not an admin
    if (axiosError.response && axiosError.response.status === 401) {
      return false;
    }

    handleAxiosError(error);
    throw error;
  }
};

// Helper function to handle and log Axios errors
const handleAxiosError = (error: unknown): void => {
  if (axios.isAxiosError(error)) {
    // Axios error with response
    if (error.response) {
      console.error(`Error ${error.response.status}:`, error.response.data);
    } else if (error.request) {
      // Request was made, but no response was received
      console.error("No response received:", error.request);
    } else {
      // Something happened while setting up the request
      console.error("Axios error:", error.message);
    }
  } else {
    // Non-Axios error
    console.error("Error:", error);
  }
};

// Fetch roles function
export const fetchRoles = async () => {
  try {
    const token = localStorage.getItem("authToken");
    const { data } = await axios.get(`${API_URL}/admin/roles`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return data.data;
  } catch (error: unknown) {
    handleAxiosError(error);
    throw error;
  }
};

// Function to add a new role
export const addRole = async (name: string, level: number, orgId: number) => {
  try {
    const token = localStorage.getItem("authToken"); // Add token if needed for authentication
    const { data } = await axios.post(
      `${API_URL}/admin/role`,
      { name, level, org_id: orgId },
      {
        headers: {
          Authorization: `Bearer ${token}`, // Include the token in the request header if required
        },
      }
    );
    return data;
  } catch (error: unknown) {
    handleAxiosError(error);
    throw error;
  }
};

// Function to create a new user
export const createUser = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  team: string,
  orgId: string,
  roleId: string
) => {
  try {
    const token = localStorage.getItem("authToken"); // Retrieve auth token if needed
    const { data } = await axios.post(
      `${API_URL}/admin/new-user`,
      {
        email,
        password,
        firstName,
        lastName,
        team,
        org_id: orgId, // Organization ID
        role_id: roleId, // Role ID
      },
      {
        headers: {
          Authorization: `Bearer ${token}`, // Include the token in the request header if needed
        },
      }
    );
    return data; // Return response data (e.g., the created user)
  } catch (error: unknown) {
    handleAxiosError(error); // Use the error handling helper
    throw error; // Rethrow the error for the calling function to handle
  }
};
