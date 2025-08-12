import {baseURL, deviceId} from '../../utils/baseUrl';
import {loadData} from '../auth/loadData';

interface Role {
  id: string | number;
  name: string;
  permissions: unknown;
}

interface RolesResponse {
  data: {
    status: number;
    data: {
      id: string | number;
      name: string;
      permissions: unknown;
    }[];
  };
}

export const getAllRoles = async (): Promise<Role[]> => {
  try {
    const auth = await loadData();
    if (!auth) {
      throw new Error('❌ Unauthorized: Auth data is null');
    }
    const token = auth.access_token;
    if (!token) {
      throw new Error('❌ Unauthorized: No token found');
    }
    
    const response = await fetch(baseURL + `/device-user/roles/${deviceId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: RolesResponse = await response.json();
    console.log(data);

    if (data?.data?.status !== 200) {
      console.error('Invalid API response:', data);
      throw new Error(
        'Invalid API response: Expected an array of users within data.data',
      );
    }

    const roles = data.data.data.map(role => ({
      id: role.id,
      name: role.name,
      permissions: role.permissions
    }));

    return roles;
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
};