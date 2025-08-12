import {baseURL, deviceId} from '../../utils/baseUrl';
import {loadData} from '../../auth/loadData';

export const updateRole = async (email, role_id) => {
  console.log(email, role_id)
  try {
    const auth = await loadData();
    const token = auth.access_token;
    if (!token) {
      throw new Error('❌ Unauthorized: No token found');
    }
    const response = await fetch(baseURL + `/device-user/role`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        deviceId: deviceId,
        targetUserEmail: String(email),
        newRole: role_id
      })
    });

    console.log(response);
    if(!response.ok){
      return 401;
    }
    const data = await response.json();
    console.log(data);

    if (!data?.data?.status === 200) {
      console.error('Invalid API response:', data);
      throw new Error(
        'Invalid API response: Expected an array of users within data.data',
      );
    }

    const user = data.data.status;

    return user;
  } catch (error) {
    throw error;
  }
};
