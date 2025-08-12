import { baseURL } from "../api/config";
import { getToken } from "./authService";

// Updated User interface to match the API response
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: number;
  cloud_id: number;
  account_disabled: boolean;
}

// API response interface for device users
export interface DeviceUsersResponse {
  data: User[];
  deviceId: number;
}

/**
 * Get all users for a specific device
 * @param deviceId Device ID to fetch users from
 * @returns Promise with array of users
 */
export const getDeviceUsers = async (
  deviceId: string | number
): Promise<User[]> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("❌ Unauthorized: No token found");
    }

    const response = await fetch(`${baseURL}/device-user/users/${deviceId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data: DeviceUsersResponse = await response.json();
    return data.data || [];
  } catch (error) {
    console.error(`Error fetching users for device ${deviceId}:`, error);
    throw error;
  }
};

/**
 * Get the currently logged-in user (with graceful error handling)
 * @returns Promise with current user data or null if not available
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const token = getToken();
    if (!token) {
      console.log("No token found when fetching current user");
      return null;
    }

    // Try to get the current user, but don't throw if the endpoint is not available
    try {
      const response = await fetch(`${baseURL}/users/me`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.warn(`Current user endpoint returned ${response.status}`);
        return null;
      }

      const data = await response.json();
      return data.user || null;
    } catch (error) {
      console.warn(
        "Error fetching current user, continuing without current user info:",
        error
      );
      return null;
    }
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    return null;
  }
};

/**
 * Get a specific user by ID
 * @param userId User ID to fetch
 * @returns Promise with user data
 */
export const getUserById = async (userId: number): Promise<User> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("❌ Unauthorized: No token found");
    }

    const response = await fetch(`${baseURL}/users/${userId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    throw error;
  }
};

/**
 * Create a new user
 * @param userData User data to create
 * @returns Promise with created user
 */
export const createUser = async (userData: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: number;
  deviceId?: number; // Optional device ID to associate user with
}): Promise<User> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("❌ Unauthorized: No token found");
    }

    const response = await fetch(`${baseURL}/users`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

/**
 * Update an existing user
 * @param userId User ID to update
 * @param userData Updated user data
 * @returns Promise with updated user
 */
export const updateUser = async (
  userId: number,
  userData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    role?: number;
  }
): Promise<User> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("❌ Unauthorized: No token found");
    }

    const response = await fetch(`${baseURL}/users/${userId}`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error(`Error updating user ${userId}:`, error);
    throw error;
  }
};

/**
 * Toggle user account status (enable/disable)
 * @param userId User ID to update
 * @param disabled New disabled status
 * @returns Promise with updated user
 */
export const toggleUserStatus = async (
  userId: number,
  disabled: boolean
): Promise<User> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("❌ Unauthorized: No token found");
    }

    const response = await fetch(`${baseURL}/users/${userId}/toggle-status`, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ account_disabled: disabled }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error(`Error toggling status for user ${userId}:`, error);
    throw error;
  }
};

// services/userService.ts

export const addUserToDevice = async (
  userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: number;
  },
  deviceId: string
): Promise<User> => {
  const token = getToken();
  if (!token) throw new Error("❌ Unauthorized: No token found");

  if (!deviceId) throw new Error("❌ deviceId is missing");

  console.log("Device ID being synced:", deviceId);

  // 1. Signup
  const signupRes = await fetch(`${baseURL}/user/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role_id: userData.role,
    }),
  });

  if (!signupRes.ok) {
    const err = await signupRes.json();
    throw new Error(err.message || "Signup failed");
  }

  // 2. Sync User to Device
  const syncRes = await fetch(`${baseURL}/device/sync-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      deviceId: Number(deviceId), // ✅ force number just in case
      email: userData.email,
    }),
  });
  
  if (!syncRes.ok) {
    const errorText = await syncRes.text(); // Not always JSON
    console.error("❌ sync-user failed:", errorText); // Log full raw response
    throw new Error("❌ Sync failed: " + errorText);
  }
  

  if (!syncRes.ok) {
    const err = await syncRes.json();
    throw new Error(
      err.message || "❌ Sync failed: Device may not be connected"
    );
  }

  // 3. Assign Role
  const roleRes = await fetch(`${baseURL}/device-user/role`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      deviceId: Number(deviceId), // ✅ always number
      targetUserEmail: userData.email, // or userId if needed
      newRole: userData.role,
    }),
  });
  
  if (!roleRes.ok) {
    const errorText = await roleRes.text();
    console.error("❌ Role update failed:", errorText);
    throw new Error(errorText || "❌ Role assignment failed");
  }
  

  if (!roleRes.ok) {
    const err = await roleRes.json();
    throw new Error(err.message || "❌ Role assignment failed");
  }

  return {
    ...userData,
    id: Date.now(),
    cloud_id: 0,
    account_disabled: false,
  };
};

/**
 * Delete a user
 * @param userId User ID to delete
 * @returns Promise with success status
 */
export const deleteUser = async (userId: number): Promise<boolean> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("❌ Unauthorized: No token found");
    }

    const response = await fetch(`${baseURL}/users/${userId}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
    throw error;
  }
};

/**
 * Helper function to get role name from role number
 * @param roleNumber Role number
 * @returns Role name as string
 */
export const getRoleName = (roleNumber: number): string => {
  switch (roleNumber) {
    case 0:
      return "Admin";
    case 1:
      return "Sensor Viewer";
    case 2:
      return "Sensor Manager";
    case 3:
      return "Camera Viewer";
    case 4:
      return "Camera Manager";
    case 5:
      return "Basic User";
    default:
      return "Basic User";
  }
};
