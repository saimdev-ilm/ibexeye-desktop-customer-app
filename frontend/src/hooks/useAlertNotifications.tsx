// Fixed useAlertNotifications.tsx
import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useWebSocket } from '../contexts/WebSocketContext';

interface AlertData {
  type: string;
  title: string;
  description: string;
  cameraId: string;
  timestamp: string;
  mediaPath?: string | null;
  mediaUrl?: string;
  networkId?: string;
  nodeId: string;
  deviceId: number;
}

export const useAlertNotifications = () => {
  const { subscribeToTopic, data } = useWebSocket();
  const processedAlerts = useRef(new Set<string>());
  const lastDataSnapshot = useRef<string>('');

  useEffect(() => {
    subscribeToTopic('alert');
  }, [subscribeToTopic]);

  useEffect(() => {
    const alertData = data['alert'];
    if (!alertData) return;

    // Create a snapshot of current data to detect changes
    const currentSnapshot = JSON.stringify(alertData);
    if (currentSnapshot === lastDataSnapshot.current) return;
    
    lastDataSnapshot.current = currentSnapshot;

    // Get the latest alert (highest key value)
    const keys = Object.keys(alertData);
    if (keys.length === 0) return;
    
    const latestKey = keys[keys.length - 1];
    const rawAlert = alertData[latestKey];
    
    if (!rawAlert || typeof rawAlert !== 'object') return;

    const alert = rawAlert as AlertData;
    const alertId = `${alert.cameraId}-${alert.timestamp}-${alert.type}`;
    
    // Skip if already processed
    if (processedAlerts.current.has(alertId)) return;

    // Mark as processed
    processedAlerts.current.add(alertId);
    
    // Clean old entries
    if (processedAlerts.current.size > 50) {
      const entries = Array.from(processedAlerts.current);
      processedAlerts.current.clear();
      entries.slice(-25).forEach(id => processedAlerts.current.add(id));
    }

    // Show toast with proper type heading
    const getTypeHeading = (type: string) => {
      switch (type) {
        case 'detection_enabled': return 'Detection Enabled';
        case 'detection_disabled': return 'Detection Disabled';
        case 'motion_detection': return 'Motion Detection';
        case 'intrusion_detected': return 'Intrusion Detected';
        default: return 'Alert Notification';
      }
    };

 

    const CustomToastContent = ({   heading, description }: {  heading: string, description: string }) => (
      <div className="flex flex-col">
        <div className="flex items-center mb-2">
           <span className="text-sm font-semibold">{heading}</span>
        </div>
        <p className="text-xs text-gray-600">{description}</p>
      </div>
    );

    const baseToastOptions = {
      position: 'top-right' as const,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      toastId: alertId,
    };

    const typeHeading = getTypeHeading(alert.type);
 
    switch (alert.type) {
      case 'detection_enabled':
        toast.success(
          <CustomToastContent  heading={typeHeading} description={alert.description} />,
          { ...baseToastOptions, autoClose: 5000, style: { backgroundColor: '#f0f9ff', borderLeft: '4px solid #10b981' } }
        );
        break;
      case 'detection_disabled':
        toast.warning(
          <CustomToastContent  heading={typeHeading} description={alert.description} />,
          { ...baseToastOptions, autoClose: 5000, style: { backgroundColor: '#fffbeb', borderLeft: '4px solid #f59e0b' } }
        );
        break;
      case 'motion_detection':
        toast.info(
          <CustomToastContent  heading={typeHeading} description={alert.description} />,
          { ...baseToastOptions, autoClose: 8000, style: { backgroundColor: '#eff6ff', borderLeft: '4px solid #3b82f6' } }
        );
        break;
      case 'intrusion_detected':
        toast.error(
          <CustomToastContent  heading={typeHeading} description={alert.description} />,
          { ...baseToastOptions, autoClose: false, style: { backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444' } }
        );
        break;
      default:
        toast.info(
          <CustomToastContent  heading={typeHeading} description={alert.description} />,
          { ...baseToastOptions, autoClose: 5000, style: { backgroundColor: '#f8fafc', borderLeft: '4px solid #6b7280' } }
        );
    }

    // Store in localStorage
    const storedAlerts = JSON.parse(localStorage.getItem('alerts') || '[]');
    const newAlert = { ...alert, id: alertId, read: false };
    storedAlerts.unshift(newAlert);
    
    if (storedAlerts.length > 50) {
      storedAlerts.splice(50);
    }
    
    localStorage.setItem('alerts', JSON.stringify(storedAlerts));
    window.dispatchEvent(new CustomEvent('newAlert', { detail: newAlert }));
    
    console.log('🔔 Alert processed:', alert);
  }, [data]);
};