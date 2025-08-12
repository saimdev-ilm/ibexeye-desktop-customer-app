// src/services/authService.ts
import axios from "axios";
import { baseURL } from "../api/config";

// Define types for user data
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  currentOrg: {
    id: number;
    name: string;
    s3_label: string;
  };
  org_id: number;
  team: unknown; // Replace with a specific type if the structure of 'team' is known
  password_reset_required: boolean;
  access_token: string;
  profileImage?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Create axios instance with base configuration
const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add interceptor to automatically add the token to requests
api.interceptors.request.use((config) => {
  const token = getToken();
  
  // 🛠 Don't attach token for /user/login
  if (
    token &&
    config.headers &&
    config.url &&
    !config.url.includes("/user/login")
  ) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


// Token management functions
export const setToken = (token: string): void => {
  localStorage.setItem("authToken", token);
};

export const getToken = (): string | null => {
  return localStorage.getItem("authToken");
};

export const removeToken = (): void => {
  localStorage.removeItem("authToken");
};

// User data management
export const setUserData = (user: User): void => {
  localStorage.setItem("userData", JSON.stringify(user));
  
  // Also set legacy individual fields for backward compatibility
  localStorage.setItem("userId", String(user.id));
  localStorage.setItem("firstName", user.firstName);
  localStorage.setItem("lastName", user.lastName);
  localStorage.setItem("userEmail", user.email);
  localStorage.setItem("userName", `${user.firstName} ${user.lastName}`);
  
  // Create and store profile data format
  const profileData = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    team: user.team,
    org: user.currentOrg,
    org_id: user.org_id,
    profileImage: user.profileImage
  };
  
  localStorage.setItem("profileData", JSON.stringify(profileData));
};

export const getUserData = (): User | null => {
  const userData = localStorage.getItem("userData");
  if (userData) {
    return JSON.parse(userData);
  }
  
  // Try to reconstruct from legacy storage if userData not found
  const userId = localStorage.getItem("userId");
  const firstName = localStorage.getItem("firstName");
  const lastName = localStorage.getItem("lastName");
  const email = localStorage.getItem("userEmail");
  const token = localStorage.getItem("authToken");
  const profileDataStr = localStorage.getItem("profileData");
  
  if (userId && firstName && lastName && email && token) {
    // Basic user data from individual fields
    const basicUser: User = {
      id: Number(userId),
      firstName,
      lastName,
      email,
      access_token: token,
      password_reset_required: false,
      currentOrg: { id: 0, name: "", s3_label: "" },
      org_id: 0,
      team: null
    };
    
    // If profile data exists, enhance with that
    if (profileDataStr) {
      const profileData = JSON.parse(profileDataStr);
      return {
        ...basicUser,
        currentOrg: profileData.org || basicUser.currentOrg,
        org_id: profileData.org_id || basicUser.org_id,
        team: profileData.team || basicUser.team,
        profileImage: profileData.profileImage
      };
    }
    
    return basicUser;
  }
  
  return null;
};

export const removeUserData = (): void => {
  // Remove new storage
  localStorage.removeItem("userData");
  
  // Also remove legacy storage
  localStorage.removeItem("userId");
  localStorage.removeItem("firstName");
  localStorage.removeItem("lastName");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userName");
  localStorage.removeItem("profileData");
};

// Legacy function for backward compatibility
export const loginUser = async (email: string, password: string): Promise<User> => {
  return login({ email, password });
};

// Authentication functions
export const login = async (credentials: LoginCredentials): Promise<User> => {
  try {
    const response = await api.post<User>("/user/login", credentials);
    const userData = response.data;
    
    // Store token and user data
    setToken(userData.access_token);
    setUserData(userData);
    
    return userData;
  } catch (error: unknown) {
    if (error instanceof Error && axios.isAxiosError(error) && error.response) {
      console.error("Login error:", error.response.data);
      throw new Error(error.response.data.message || "Login failed");
    } else {
      if (error instanceof Error) {
        console.error("Error during login:", error.message);
      } else {
        console.error("Error during login:", error);
      }
      throw new Error("Network error. Please try again.");
    }
  }
};

export const logout = (): void => {
  removeToken();
  removeUserData();
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// Function to get authenticated API instance
export const getAuthenticatedApi = () => {
  return api;
};

// Function to get user profile data in a simpler format
export const getProfileData = (): {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  team?: unknown; // Replace 'unknown' with a specific type if the structure of 'team' is known
  org?: {
    id: number;
    name: string;
    s3_label: string;
  };
  org_id?: number;
  profileImage?: string;
} | null => {
  // First try to get from profileData in localStorage
  const profileDataStr = localStorage.getItem("profileData");
  if (profileDataStr) {
    return JSON.parse(profileDataStr);
  }
  
  // If not found, try to get from userData
  const userData = getUserData();
  if (!userData) return null;
  
  return {
    id: userData.id,
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    team: userData.team,
    org: userData.currentOrg,
    org_id: userData.org_id,
    profileImage: userData.profileImage
  };
};

// Function to fetch profile data (legacy approach - returns promise)
export const fetchProfileData = async (): Promise<{
  id: number | string;
  firstName: string;
  lastName: string;
  email?: string;
  profileImage?: string;
}> => {
  try {
    // First try to get from localStorage
    const profileData = getProfileData();

    if (profileData) {
      return profileData;
    }

    // If profileData doesn't exist, try to construct from individual items
    const firstName =
      localStorage.getItem("firstName") ||
      localStorage.getItem("userName")?.split(" ")[0] || "";
    const lastName =
      localStorage.getItem("lastName") ||
      localStorage.getItem("userName")?.split(" ")[1] ||
      "";
    const userId = localStorage.getItem("userId") || "";
    const email = localStorage.getItem("userEmail") || undefined;

    if (firstName) {
      // Construct basic profile from available data
      const profileData = {
        id: userId,
        firstName,
        lastName,
        email,
      };

      // Store for future use
      localStorage.setItem("profileData", JSON.stringify(profileData));
      return profileData;
    }

    // If still no profile data, throw error to be caught
    throw new Error("Profile data not found in local storage.");
  } catch (error) {
    console.error("Error fetching profile data:", error);
    throw error;
  }
};

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const authToken = getToken();
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
};