import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MotionDetection: React.FC = () => {
  const [motionData, setMotionData] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Replace with your camera IP
  const CAMERA_IP = '192.168.18.39';
  const MOTION_API = `http://${CAMERA_IP}/motion-detection`;

  useEffect(() => {
    const fetchMotionDetection = async () => {
      try {
        setLoading(true);
        const response = await axios.get(MOTION_API, {
          // Add headers or authentication if needed
          auth: {
            username: 'admin', // Replace with your camera username
            password: 'password', // Replace with your camera password
          },
        });
        setMotionData(JSON.stringify(response.data));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching motion detection data:', error);
        setMotionData('Error fetching motion detection data');
        setLoading(false);
      }
    };

    fetchMotionDetection();

    // Optional: Polling every 5 seconds
    const interval = setInterval(fetchMotionDetection, 5000);
    return () => clearInterval(interval);
  }, [MOTION_API]);

  return (
    <div>
      <h1>Motion Detection Status</h1>
      {loading ? (
        <p>Loading motion data...</p>
      ) : (
        <pre>{motionData}</pre>
      )}
    </div>
  );
};

export default MotionDetection;
