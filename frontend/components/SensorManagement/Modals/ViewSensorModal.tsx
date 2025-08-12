import React, { useState, useEffect } from 'react';
import { FaTimes, FaExclamationTriangle, FaInfoCircle, FaChartLine, FaSpinner } from 'react-icons/fa';
import { Sensor, getLatestSensorReading } from '../../../src/services/sensorService'; // Adjust the import path as necessary

interface ViewSensorModalProps {
    sensor: Sensor;
    onClose: () => void;
}

const ViewSensorModal: React.FC<ViewSensorModalProps> = ({ sensor, onClose }) => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [latestReading, setLatestReading] = useState<number | null>(sensor.lastReading);
    const [readingTimestamp, setReadingTimestamp] = useState<string | null>(sensor.lastReadingTimestamp);

    useEffect(() => {
        const fetchLatestReading = async () => {
            try {
                setLoading(true);
                const data = await getLatestSensorReading(sensor.id);
                setLatestReading(data.value);
                setReadingTimestamp(data.timestamp);
                setError(null);
            } catch (error) {
                console.error("Failed to fetch latest reading:", error);
                setError("Failed to fetch latest reading");
            } finally {
                setLoading(false);
            }
        };

        fetchLatestReading();

        // Set up polling for real-time updates
        const intervalId = setInterval(fetchLatestReading, 10000); // Poll every 10 seconds

        return () => {
            clearInterval(intervalId); // Clean up interval on unmount
        };
    }, [sensor.id]);

    // Format sensor value with unit
    const formatSensorValue = (): string => {
        if (latestReading === null) return 'No data';
        
        let value = latestReading;
        // Round to 2 decimal places if it's a number
        if (typeof value === 'number') {
            value = Math.round(value * 100) / 100;
        }
        
        return `${value}${sensor.unit ? ' ' + sensor.unit : ''}`;
    };

    // Format timestamp to readable format
    const formatTimestamp = (): string => {
        if (!readingTimestamp) return 'Never';
        
        const date = new Date(readingTimestamp);
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    };

    // Function to determine if the reading is within normal range
    const getReadingStatusColor = (): string => {
        if (latestReading === null) return 'text-gray-500';
        
        const minValue = sensor.minValue !== null ? sensor.minValue : Number.NEGATIVE_INFINITY;
        const maxValue = sensor.maxValue !== null ? sensor.maxValue : Number.POSITIVE_INFINITY;
        
        if (latestReading < minValue) return 'text-red-500';
        if (latestReading > maxValue) return 'text-red-500';
        return 'text-green-500';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto bg-black bg-opacity-50 outline-none focus:outline-none">
            <div className="relative w-full max-w-2xl mx-auto my-6">
                {/* Modal content */}
                <div className="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-lg outline-none focus:outline-none">
                    {/* Header */}
                    <div className="flex items-start justify-between p-5 border-b border-gray-200 rounded-t">
                        <h3 className="text-xl font-semibold">
                            Sensor Details: {sensor.name}
                        </h3>
                        <button
                            className="float-right p-1 ml-auto text-3xl font-semibold leading-none text-gray-500 bg-transparent border-0 outline-none focus:outline-none"
                            onClick={onClose}
                        >
                            <FaTimes />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="relative flex-auto p-6">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-10">
                                <FaSpinner className="w-12 h-12 mb-4 text-blue-500 animate-spin" />
                                <p>Loading latest sensor data...</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-10 text-red-500">
                                <FaExclamationTriangle className="w-12 h-12 mb-4" />
                                <p>{error}</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Reading display card */}
                                <div className="p-6 rounded-lg shadow-sm bg-gray-50">
                                    <div className="flex flex-col items-center text-center">
                                        <FaChartLine className="w-12 h-12 mb-2 text-blue-500" />
                                        <h4 className="mb-1 text-lg font-bold">Current Reading</h4>
                                        <div className={`text-4xl font-bold my-2 ${getReadingStatusColor()}`}>
                                            {formatSensorValue()}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Last updated: {formatTimestamp()}
                                        </div>
                                        
                                        {/* Range indicators if min/max values are set */}
                                        {(sensor.minValue !== null || sensor.maxValue !== null) && (
                                            <div className="mt-3 text-sm">
                                                <span className="font-semibold">Normal Range: </span>
                                                {sensor.minValue !== null ? sensor.minValue : 'No min'} 
                                                {' - '} 
                                                {sensor.maxValue !== null ? sensor.maxValue : 'No max'}
                                                {sensor.unit && ` ${sensor.unit}`}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Sensor configuration details */}
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="p-4 border rounded-lg">
                                        <h4 className="mb-2 text-lg font-semibold">Sensor Information</h4>
                                        <div className="space-y-2">
                                            <div>
                                                <span className="font-medium">Description: </span>
                                                {sensor.description || 'No description'}
                                            </div>
                                            <div>
                                                <span className="font-medium">Data Type: </span>
                                                {sensor.dataType}
                                            </div>
                                            <div>
                                                <span className="font-medium">Status: </span>
                                                <span className={sensor.active ? 'text-green-500' : 'text-red-500'}>
                                                    {sensor.active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="font-medium">Zone: </span>
                                                {sensor.zone !== null ? sensor.zone : 'Not assigned'}
                                            </div>
                                            <div>
                                                <span className="font-medium">Created: </span>
                                                {new Date(sensor.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 border rounded-lg">
                                        <h4 className="mb-2 text-lg font-semibold">MQTT Configuration</h4>
                                        <div className="space-y-2">
                                            <div>
                                                <span className="font-medium">Topic: </span>
                                                {sensor.mqttTopic}
                                            </div>
                                            <div>
                                                <span className="font-medium">Host: </span>
                                                {sensor.mqttHost}
                                            </div>
                                            <div>
                                                <span className="font-medium">Port: </span>
                                                {sensor.mqttPort}
                                            </div>
                                            <div>
                                                <span className="font-medium">Protocol: </span>
                                                {sensor.mqttProtocol}
                                            </div>
                                            <div>
                                                <span className="font-medium">TLS: </span>
                                                {sensor.mqttUseTLS ? 'Enabled' : 'Disabled'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Notification settings */}
                                <div className="p-4 border rounded-lg">
                                    <h4 className="mb-2 text-lg font-semibold">Notification Settings</h4>
                                    <div className="space-y-2">
                                        <div>
                                            <span className="font-medium">Notifications: </span>
                                            <span className={sensor.notificationsEnabled ? 'text-green-500' : 'text-red-500'}>
                                                {sensor.notificationsEnabled ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </div>
                                        {sensor.notificationsEnabled && (
                                            <div>
                                                <span className="font-medium">Threshold: </span>
                                                {sensor.notificationThreshold}{sensor.unit && ` ${sensor.unit}`}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Note about real-time updates */}
                                <div className="flex items-center p-3 text-sm text-blue-700 rounded-lg bg-blue-50">
                                    <FaInfoCircle className="mr-2" />
                                    <span>Data automatically refreshes every 10 seconds</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end p-4 border-t border-gray-200 rounded-b">
                        <button
                            className="px-6 py-2 mb-1 text-sm font-bold text-white uppercase transition-all duration-150 ease-linear rounded shadow outline-none bg-customBlue hover:bg-blue-600 hover:shadow-lg focus:outline-none"
                            type="button"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewSensorModal;