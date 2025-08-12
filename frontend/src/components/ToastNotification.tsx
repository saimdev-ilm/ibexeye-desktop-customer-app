// Updated ToastNotification.jsx
import React, { useEffect, useState } from 'react';
import { FaCheck, FaTimes, FaInfoCircle, FaExclamationTriangle, FaBell, FaBellSlash } from "react-icons/fa";

/**
 * Toast notification component for showing status messages
 * 
 * @param {Object} props - Component props
 * @param {string} props.message - Message to display
 * @param {string} props.type - Type of toast: 'success', 'error', 'info', 'warning', 'detection-enabled', 'detection-disabled'
 * @param {boolean} props.show - Whether to show the toast
 * @param {Function} props.onClose - Function to call when toast is closed
 * @param {number} props.duration - Duration in ms before toast auto-closes (default: 3000)
 */
const ToastNotification = ({ message, type = 'info', show, onClose, duration = 3000 }: { message: string; type?: string; show: boolean; onClose: () => void; duration?: number }) => {
  const [isLeaving, setIsLeaving] = useState(false);
  
  useEffect(() => {
    if (show) {
      setIsLeaving(false);
      const timer = setTimeout(() => {
        // Start exit animation
        setIsLeaving(true);
        
        // After animation completes, actually close the toast
        setTimeout(() => {
          onClose();
        }, 300); // Match this with animation duration
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [show, onClose, duration]);

  if (!show && !isLeaving) return null;

  // Define styles and icons based on type
  const getToastStyles = () => {
    switch(type) {
      case 'success':
        return {
          bgColor: 'bg-green-500',
          icon: <FaCheck />,
          borderColor: 'border-green-600'
        };
      case 'error':
        return {
          bgColor: 'bg-red-500',
          icon: <FaTimes />,
          borderColor: 'border-red-600'
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-500',
          icon: <FaExclamationTriangle />,
          borderColor: 'border-yellow-600'
        };
      case 'detection-enabled':
        return {
          bgColor: 'bg-green-500',
          icon: <FaBell />,
          borderColor: 'border-green-600'
        };
      case 'detection-disabled':
        return {
          bgColor: 'bg-red-500',
          icon: <FaBellSlash />,
          borderColor: 'border-red-600'
        };
      case 'info':
      default:
        return {
          bgColor: 'bg-blue-500',
          icon: <FaInfoCircle />,
          borderColor: 'border-blue-600'
        };
    }
  };

  const { bgColor, icon, borderColor } = getToastStyles();

  return (
    <div className={`fixed top-4 right-4 z-50 flex ${isLeaving ? 'animate-fade-out-up' : 'animate-fade-in-down'}`}>
      <div className={`flex items-center p-3 rounded-md shadow-lg ${bgColor} text-white border-l-4 ${borderColor}`}>
        <div className="mr-3">
          {icon}
        </div>
        <div className="flex-1 mr-3 font-medium">
          {message}
        </div>
        <button 
          onClick={() => setIsLeaving(true)}
          className="text-white hover:text-gray-200 focus:outline-none"
        >
          <FaTimes size={16} />
        </button>
      </div>
    </div>
  );
};

export default ToastNotification;