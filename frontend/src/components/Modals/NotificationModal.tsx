import React, { useEffect, useState } from 'react';
import { FaTimes, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaExclamationCircle } from 'react-icons/fa';

interface NotificationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    onClose: () => void;
    autoClose?: boolean;
    autoCloseDelay?: number;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ 
    isOpen, 
    title, 
    message, 
    type, 
    onClose,
    autoClose = false,
    autoCloseDelay = 3000
}) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            
            // Auto close functionality
            if (autoClose) {
                const timer = setTimeout(() => {
                    handleClose();
                }, autoCloseDelay);

                return () => clearTimeout(timer);
            }
        }
    }, [isOpen, autoClose, autoCloseDelay]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose();
        }, 300); // Wait for animation to complete
    };

    const getIcon = () => {
        switch (type) {
            case 'success': 
                return <FaCheckCircle className="text-2xl text-green-600" />;
            case 'error': 
                return <FaExclamationCircle className="text-2xl text-red-600" />;
            case 'warning': 
                return <FaExclamationTriangle className="text-2xl text-yellow-600" />;
            case 'info': 
                return <FaInfoCircle className="text-2xl text-blue-600" />;
            default: 
                return <FaInfoCircle className="text-2xl text-blue-600" />;
        }
    };

    const getColorClasses = () => {
        switch (type) {
            case 'success': 
                return {
                    container: 'border-green-200 bg-gradient-to-br from-green-50 to-green-100',
                    header: 'text-green-800',
                    message: 'text-green-700',
                    button: 'bg-green-600 hover:bg-green-700 text-white'
                };
            case 'error': 
                return {
                    container: 'border-red-200 bg-gradient-to-br from-red-50 to-red-100',
                    header: 'text-red-800',
                    message: 'text-red-700',
                    button: 'bg-red-600 hover:bg-red-700 text-white'
                };
            case 'warning': 
                return {
                    container: 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100',
                    header: 'text-yellow-800',
                    message: 'text-yellow-700',
                    button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
                };
            case 'info': 
                return {
                    container: 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100',
                    header: 'text-blue-800',
                    message: 'text-blue-700',
                    button: 'bg-blue-600 hover:bg-blue-700 text-white'
                };
            default: 
                return {
                    container: 'border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100',
                    header: 'text-gray-800',
                    message: 'text-gray-700',
                    button: 'bg-gray-600 hover:bg-gray-700 text-white'
                };
        }
    };

    const getEmoji = () => {
        switch (type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            case 'info': return 'ℹ️';
            default: return 'ℹ️';
        }
    };

    if (!isOpen) return null;

    const colors = getColorClasses();

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className={`absolute inset-0 bg-black transition-opacity duration-300 ${
                    isVisible ? 'bg-opacity-50' : 'bg-opacity-0'
                }`}
                onClick={handleClose}
            />

            {/* Modal */}
            <div 
                className={`relative max-w-md w-full mx-4 transform transition-all duration-300 ${
                    isVisible 
                        ? 'scale-100 opacity-100 translate-y-0' 
                        : 'scale-95 opacity-0 translate-y-4'
                }`}
            >
                <div className={`p-6 rounded-2xl shadow-2xl border-2 ${colors.container}`}>
                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
                    >
                        <FaTimes className="text-gray-500 hover:text-gray-700" />
                    </button>

                    {/* Header */}
                    <div className="flex items-center mb-4">
                        <div className="mr-3">
                            {getIcon()}
                        </div>
                        <div>
                            <h3 className={`text-lg font-bold ${colors.header} flex items-center`}>
                                <span className="mr-2 text-xl">{getEmoji()}</span>
                                {title}
                            </h3>
                        </div>
                    </div>

                    {/* Message */}
                    <div className={`mb-6 ${colors.message}`}>
                        <p className="text-sm leading-relaxed whitespace-pre-line">
                            {message}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3">
                        {autoClose && (
                            <div className="flex items-center text-xs text-gray-500">
                                <div className="mr-2">Auto-closing...</div>
                                <div className="w-16 h-1 bg-gray-300 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gray-500 rounded-full animate-pulse"
                                        style={{
                                            animation: `shrink ${autoCloseDelay}ms linear forwards`
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                        
                        <button
                            onClick={handleClose}
                            className={`px-6 py-2 rounded-lg font-medium transition-colors ${colors.button}`}
                        >
                            OK
                        </button>
                    </div>
                </div>
            </div>

            {/* Custom CSS for animations */}
            <style jsx>{`
                @keyframes shrink {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </div>
    );
};

export default NotificationModal;

// Usage Examples:
export const useNotification = () => {
    const [notification, setNotification] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'success' | 'error' | 'info' | 'warning';
        autoClose?: boolean;
        autoCloseDelay?: number;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    const showNotification = (
        title: string, 
        message: string, 
        type: 'success' | 'error' | 'info' | 'warning' = 'info',
        autoClose: boolean = false,
        autoCloseDelay: number = 3000
    ) => {
        setNotification({
            isOpen: true,
            title,
            message,
            type,
            autoClose,
            autoCloseDelay
        });
    };

    const closeNotification = () => {
        setNotification(prev => ({ ...prev, isOpen: false }));
    };

    const showSuccess = (title: string, message: string, autoClose = true) => {
        showNotification(title, message, 'success', autoClose);
    };

    const showError = (title: string, message: string, autoClose = false) => {
        showNotification(title, message, 'error', autoClose);
    };

    const showWarning = (title: string, message: string, autoClose = false) => {
        showNotification(title, message, 'warning', autoClose);
    };

    const showInfo = (title: string, message: string, autoClose = true) => {
        showNotification(title, message, 'info', autoClose);
    };

    return {
        notification,
        showNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        closeNotification,
        NotificationComponent: () => (
            <NotificationModal
                isOpen={notification.isOpen}
                title={notification.title}
                message={notification.message}
                type={notification.type}
                onClose={closeNotification}
                autoClose={notification.autoClose}
                autoCloseDelay={notification.autoCloseDelay}
            />
        )
    };
};