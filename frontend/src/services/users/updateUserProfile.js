import {baseURL, deviceId} from '../../utils/baseUrl';
import {loadData} from '../../auth/loadData';

export const updateUserProfile = async (firstName, lastName, email, password, user_id) => {
  try {
    const auth = await loadData();
    const token = auth.access_token;
    if (!token) {
      throw new Error('❌ Unauthorized: No token found');
    }
    const response = await fetch(baseURL + `/device-user/profile`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deviceId: deviceId,
        targetUserId: user_id,
        profile:{  
          firstName: firstName,
          lastName: lastName,
          email: email
      }
      })
    });

    const data = await response.json();
    console.log(data);

    if (!data?.data?.status === 200) {
      console.error('Invalid API response:', data);
      throw new Error(
        'Invalid API response: Expected an array of users within data.data',
      );
    }

    const user = data.data.status;
    if(password){
        const passwordResponse = await fetch(baseURL + `/admin/reset-user-password`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            newPassword: password,
            org_id:1
          })
        });

        console.log(passwordResponse);
    }
    return user;
  } catch (error) {
    throw error;
  }
};
