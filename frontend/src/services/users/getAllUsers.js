import {baseURL, deviceId} from '../../utils/baseUrl';
import {loadData} from '../../auth/loadData';

export const getAllUsers = async () => {
  try {
    const auth = await loadData();
    const token = auth.access_token;
    if (!token) {
      throw new Error('❌ Unauthorized: No token found');
    }
    const response = await fetch(baseURL + `/device-user/users/${deviceId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    console.log(data);

    if (!data?.data?.status === 200) {
      console.error('Invalid API response:', data);
      throw new Error(
        'Invalid API response: Expected an array of users within data.data',
      );
    }

    const users = data.data.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      cloud_id: user.cloud_id
    }));

    return users;
  } catch (error) {
    throw error;
  }
};
