// src/services/auth/loadData.ts

interface UserData {
  access_token: string;
  user_id?: string;
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  [key: string]: unknown;
}

/**
 * Loads user authentication data from localStorage
 * @returns Promise<UserData | null> The user data or null if not found
 */
export const loadData = async (): Promise<UserData | null> => {
  try {
    // Get user data from localStorage
    const userDataString = localStorage.getItem('userData');
    
    if (!userDataString) {
      console.log('No user data found in localStorage');
      return null;
    }
    
    // Parse the user data
    const userData = JSON.parse(userDataString) as UserData;
    
    // Verify that the access token exists
    if (!userData.access_token) {
      console.error('User data exists but no access token found');
      return null;
    }
    
    // Log successful data retrieval
    console.log('Successfully loaded auth data from localStorage');
    return userData;
  } catch (error) {
    console.error('Error loading user data:', error);
    return null;
  }
};

/**
 * Clears user authentication data from localStorage
 */
export const clearAuthData = (): void => {
  try {
    localStorage.removeItem('userData');
    console.log('Auth data cleared from localStorage');
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};