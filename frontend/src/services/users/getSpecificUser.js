import {baseURL, deviceId} from '../../utils/baseUrl';
import {loadData} from '../../auth/loadData';

export const getSpecificUser = async (cloud_id) => {
  try {
    const auth = await loadData();
    const token = auth.access_token;
    if (!token) {
      throw new Error('❌ Unauthorized: No token found');
    }
    const response = await fetch(baseURL + `/device-user/users/${deviceId}/${cloud_id}`, {
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

    const user = data.data.data;

    return user;
  } catch (error) {
    throw error;
  }
};
