import React, { useState, useEffect, useRef } from 'react';
import { useMode } from '../contexts/ModeContext';
import { Mode, ModeType } from '../services/modeService';
import toast from 'react-hot-toast'; // For notifications

interface ModeProperties {
  label: string;
  icon: React.ReactNode;
  color: string;
  textColor: string;
  degree: number;
  modeType: ModeType;
}

 
interface ModesToggleButtonProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  distance?: number;
}

const ModesToggleButton: React.FC<ModesToggleButtonProps> = ({
  position = 'bottom-right',
  distance = 180
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activating, setActivating] = useState<boolean>(false);
  const [notification, setNotification] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Get modes from context
  const { modes, activeMode, activateMode } = useMode();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node) && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Hide notification after 3 seconds
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification(prev => ({...prev, show: false}));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  const toggleModes = (): void => {
    setIsOpen(!isOpen);
  };

  const selectMode = async (mode: Mode): Promise<void> => {
    if (mode.id === activeMode?.id) {
      setIsOpen(false);
      return;
    }
    
    setActivating(true);
    try {
      const result = await activateMode(mode.id);
      
      if (result.success) {
        // Show success notification
        setNotification({
          show: true,
          message: `Activated ${mode.name}`,
          type: 'success'
        });
        // Also show toast notification
        toast.success(`${mode.name} activated successfully`);
      } else {
        // Show error notification
        setNotification({
          show: true,
          message: result.message,
          type: 'error'
        });
        // Also show toast notification
        toast.error(result.message);
      }
    } catch {
      // Show error notification
      setNotification({
        show: true,
        message: 'Failed to activate mode',
        type: 'error'
      });
      toast.error('Failed to activate mode');
    } finally {
      setActivating(false);
      setIsOpen(false);
    }
  };

  // Create mapping between ModeType and UI properties
  const getModeProperties = (mode: Mode): ModeProperties => {
    switch(mode.modeType) {
      case ModeType.ARM_AWAY:
        return {
          label: mode.name,
          icon: (
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
              <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 14.97c-2.87-1.33-5-4.51-5-7.93V7.26L12 5l5 2.26v3.78c0 3.42-2.13 6.6-5 7.93z"/>
              <path d="M12 9L8 13l1.41 1.39L12 11.83l2.59 2.56L16 13z"/>
            </svg>
          ),
          color: 'bg-cyan-400',
          textColor: 'text-gray-700',
          degree: -12,
          modeType: ModeType.ARM_AWAY
        };
      case ModeType.ARM_HOME:
        return {
          label: mode.name,
          icon: (
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          ),
          color: 'bg-yellow-500',
          textColor: 'text-gray-700',
          degree: -55,
          modeType: ModeType.ARM_HOME
        };
      case ModeType.STANDBY:
        return {
          label: mode.name,
          icon: (
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
              <path d="M7 12c1.66 0 3-1.34 3-3S8.66 6 7 6s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v8H3V6H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z" />
            </svg>
          ),
          color: 'bg-blue-500',
          textColor: 'text-gray-700',
          degree: -85,
          modeType: ModeType.STANDBY
        };
      case ModeType.CUSTOM:
      default:
        return {
          label: mode.name,
          icon: (
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
              <path d="M18 4h-4V2h-4v2H6C3.8 2 2 3.8 2 6v12c0 2.2 1.8 4 4 4h12c2.2 0 4-1.8 4-4V6c0-2.2-1.8-2-4-2zm-6 16c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zm6-12h-2V6h2v2z" />
            </svg>
          ),
          color: 'bg-purple-500',
          textColor: 'text-gray-700',
          degree: mode.id % 2 === 0 ? -115 : -145, // Stagger custom mode positions
          modeType: ModeType.CUSTOM
        };
    }
  };

  // Calculate position based on degree
  const getPositionFromDegree = (degree: number, dist: number) => {
    const radian = (degree * Math.PI) / 180;
    const x = Math.sin(radian) * dist;
    const y = -Math.cos(radian) * dist;
    return { x, y };
  };

  // Determine positioning class based on the position prop
  const getPositionClass = () => {
    switch (position) {
      case 'bottom-right':
        return 'bottom-6 right-6';
      case 'bottom-left':
        return 'bottom-6 left-6';
      case 'top-right':
        return 'top-6 right-6';
      case 'top-left':
        return 'top-6 left-6';
      default:
        return 'bottom-6 right-6';
    }
  };

  // Get the currently active mode properties to display
  const activeProperties = activeMode ? getModeProperties(activeMode) : null;

  return (
    <div className={`fixed z-50 ${getPositionClass()}`} ref={containerRef}>
      {/* Notification popup */}
      {notification.show && (
        <div 
          className={`absolute bottom-20 right-0 px-4 py-2 rounded-lg shadow-lg transition-opacity duration-300 ${
            notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Radial blur backdrop when menu is open */}
      {isOpen && (
        <div 
          className="absolute inset-0 transition-opacity duration-300 rounded-full bg-black/10 backdrop-blur-sm"
          style={{ 
            width: distance * 2.5, 
            height: distance * 2.5, 
            transform: `translate(-${distance * 1.25 - 28}px, -${distance * 1.25 - 28}px)`,
            opacity: isOpen ? 1 : 0 
          }}
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Mode buttons positioned at specific degrees */}
      {modes.map((mode) => {
        const properties = getModeProperties(mode);
        const { x, y } = getPositionFromDegree(properties.degree, distance);
        
        // Skip showing the already active mode in the radial menu
        if (mode.id === activeMode?.id && !isOpen) {
          return null;
        }
        
        return (
          <div
            key={mode.id}
            className={`absolute flex items-center transition-all duration-300 ${
              isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
            }`}
            style={{
              transform: `translate(${x}px, ${y}px)`,
              bottom: 0,
              right: 0,
              // Add a slight delay for staggered animation
              transitionDelay: isOpen ? `${modes.indexOf(mode) * 50}ms` : '0ms'
            }}
          >
            <div className="flex items-center bg-white rounded-full py-1.5 px-3 shadow-lg mr-2">
              <span className={`${properties.textColor} font-medium text-sm whitespace-nowrap`}>{properties.label}</span>
            </div>
            
            <button
              onClick={() => selectMode(mode)}
              disabled={activating}
              className={`flex items-center justify-center w-12 h-12 rounded-full shadow-lg text-white ${properties.color} transition-transform hover:scale-105 ${
                activating ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {properties.icon}
            </button>
          </div>
        );
      })}

      {/* Main toggle button */}
      <button
        onClick={toggleModes}
        disabled={activating}
        className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg text-white ${
          activeProperties ? activeProperties.color : 'bg-gray-500'
        } transition-all duration-300 z-50 relative hover:shadow-xl ${
          activeMode?.isActive ? 'ring-2 ring-white ring-opacity-70' : ''
        }`}
      >
        {isOpen ? (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          activeProperties ? activeProperties.icon : (
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
              <path d="M12 10.9c-.61 0-1.1.49-1.1 1.1s.49 1.1 1.1 1.1c.61 0 1.1-.49 1.1-1.1s-.49-1.1-1.1-1.1zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.19 12.19L6 18l3.81-8.19L18 6l-3.81 8.19z" />
            </svg>
          )
        )}
        
        {/* Active indicator dot */}
        {activeMode && !isOpen && (
          <div className="absolute w-4 h-4 bg-green-500 border-2 border-white rounded-full -top-1 -right-1 animate-pulse"></div>
        )}
      </button>
    </div>
  );
};

export default ModesToggleButton;