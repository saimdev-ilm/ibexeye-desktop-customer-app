// Add this to your userService.ts file or create a new file

import { baseURL } from "../api/config";
import { getToken } from "./authService";
 
/**
 * Update a user using the device-user/profile endpoint
 * @param deviceId Device ID the user belongs to
 * @param userId User ID to update
 * @param userData User data to update (firstName, lastName, email)
 * @returns Promise with status code
 */
export const updateDeviceUser = async (
  deviceId: string | number,
  userId: number,
  userData: {
    firstName: string;
    lastName: string;
    email: string;
  }
): Promise<number> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("❌ Unauthorized: No token found");
    }

    const response = await fetch(`${baseURL}/device-user/profile`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        deviceId: Number(deviceId),
        targetUserId: userId,
        profile: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log("Update user response:", data);
    
    // Return status code from response or 200 if successful
    return data?.data?.status || 200;
  } catch (error) {
    console.error(`Error updating user ${userId}:`, error);
    throw error;
  }
};

/**
 * Update a user's role
 * @param deviceId Device ID
 * @param email User email
 * @param newRole New role ID
 * @returns Promise with status code
 */
export const updateUserRole = async (
  deviceId: string | number,
  email: string,
  newRole: number
): Promise<number> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("❌ Unauthorized: No token found");
    }

    const response = await fetch(`${baseURL}/device-user/role`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        deviceId: Number(deviceId),
        targetUserEmail: email,
        newRole: newRole,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log("Update role response:", data);
    
    return data?.data?.status || 200;
  } catch (error) {
    console.error(`Error updating role for user ${email}:`, error);
    throw error;
  }
};

/**
 * Reset a user's password
 * @param email User email
 * @param newPassword New password
 * @param orgId Organization ID
 * @returns Promise with status code
 */
export const resetUserPassword = async (
  email: string,
  newPassword: string,
  orgId: number = 1
): Promise<number> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("❌ Unauthorized: No token found");
    }

    const response = await fetch(`${baseURL}/admin/reset-user-password`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: email,
        newPassword: newPassword,
        org_id: orgId,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log("Password reset response:", data);
    
    return data?.data?.status || 200;
  } catch (error) {
    console.error(`Error resetting password for user ${email}:`, error);
    throw error;
  }
};