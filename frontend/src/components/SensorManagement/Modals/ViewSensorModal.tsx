import React, { useState, useEffect } from 'react';
import { FaTimes, FaExclamationTriangle, FaInfoCircle, FaChartLine, FaSpinner, FaWifi, FaBell, FaMapMarkerAlt } from 'react-icons/fa';
import { Sensor, getSensorById } from '../../../services/sensorService';

interface ViewSensorModalProps {
    sensor: Sensor;
    onClose: () => void;
}

const ViewSensorModal: React.FC<ViewSensorModalProps> = ({ sensor, onClose }) => {
    const [sensorDetails, setSensorDetails] = useState<Sensor>(sensor);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [latestReading, setLatestReading] = useState<number | null>(sensor.lastReading);
    const [readingTimestamp, setReadingTimestamp] = useState<string | null>(sensor.lastReadingTimestamp);

    const getZoneInfo = () => {
        const z = (sensorDetails as any).zone;
        if (!z) return null;
        if (typeof z === "object" && z.id) return z;
        if (typeof z === "number") return { id: z, name: `Zone ${z}`, type: "unknown" };
        return null;
    };
    const zoneInfo = getZoneInfo();

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setLoading(true);
                const fresh = await getSensorById(sensor.id);
                if (!fresh) {
                    setError("Sensor not found");
                    return;
                }
                setSensorDetails(fresh);
                setLatestReading(fresh.reading?.value ?? fresh.lastReading);
                setReadingTimestamp(fresh.reading?.timestamp ?? fresh.lastReadingTimestamp);
                setError(null);
            } catch (err) {
                console.error(err);
                setError("Failed to fetch latest reading");
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
        const id = setInterval(fetchDetails, 10_000);
        return () => clearInterval(id);
    }, [sensor.id]);

    const formatSensorValue = () =>
        latestReading === null
            ? "No data"
            : `${Math.round(latestReading * 100) / 100}${sensorDetails.unit ? ` ${sensorDetails.unit}` : ""}`;

    const formatTimestamp = () =>
        readingTimestamp ? new Date(readingTimestamp).toLocaleString() : "Never";

    const getReadingStatusColor = () => {
        if (latestReading === null) return "text-gray-400";
        const min = sensorDetails.minValue ?? -Infinity;
        const max = sensorDetails.maxValue ?? Infinity;
        if (latestReading < min || latestReading > max) return "text-red-500";
        return "text-emerald-500";
    };

    const getStatusBadge = (active: boolean) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
        }`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${active ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            {active ? 'Active' : 'Inactive'}
        </span>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                            <FaChartLine className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">{sensor.name}</h3>
                            <p className="text-sm text-gray-500">Sensor Overview</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 transition-colors rounded-lg hover:text-gray-600 hover:bg-gray-100"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <FaSpinner className="w-8 h-8 mb-3 text-blue-500 animate-spin" />
                            <p className="text-gray-600">Loading sensor data...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-12 text-red-500">
                            <FaExclamationTriangle className="w-8 h-8 mb-3" />
                            <p className="font-medium">{error}</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Current Reading */}
                            <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl">
                                <div className="text-center">
                                    <div className="flex items-center justify-center mb-3">
                                        <div className="w-2 h-2 mr-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-sm font-medium text-gray-600">Live Reading</span>
                                    </div>
                                    <div className={`text-3xl font-bold mb-2 ${getReadingStatusColor()}`}>
                                        {formatSensorValue()}
                                    </div>
                                    <p className="text-xs text-gray-500">{formatTimestamp()}</p>
                                    
                                    {/* Range indicator */}
                                    {(sensor.minValue !== null || sensor.maxValue !== null) && (
                                        <div className="p-3 mt-4 rounded-lg bg-white/70">
                                            <span className="text-xs font-medium text-gray-700">
                                                Normal Range: {sensor.minValue ?? '∞'} - {sensor.maxValue ?? '∞'}
                                                {sensor.unit && ` ${sensor.unit}`}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {/* Basic Info */}
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center mb-3">
                                        <FaInfoCircle className="w-4 h-4 mr-2 text-blue-500" />
                                        <h4 className="font-medium text-gray-900">Details</h4>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Status</span>
                                            {getStatusBadge(sensor.active)}
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Type</span>
                                            <span className="text-sm font-medium text-gray-900 capitalize">{sensor.dataType}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Unit</span>
                                            <span className="text-sm font-medium text-gray-900">{sensor.unit || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Created</span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {new Date(sensor.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Zone Info */}
                                <div className="p-4 bg-purple-50 rounded-xl">
                                    <div className="flex items-center mb-3">
                                        <FaMapMarkerAlt className="w-4 h-4 mr-2 text-purple-500" />
                                        <h4 className="font-medium text-gray-900">Zone</h4>
                                    </div>
                                    {zoneInfo ? (
                                        <div className="space-y-2">
                                            <p className="font-medium text-purple-700">{zoneInfo.name}</p>
                                            <p className="text-sm text-gray-600">ID: {zoneInfo.id}</p>
                                            <p className="text-sm text-gray-600 capitalize">Type: {zoneInfo.type.replace('-', ' ')}</p>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500">No zone assigned</p>
                                    )}
                                </div>
                            </div>

                            {/* MQTT & Notifications */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {/* MQTT */}
                                <div className="p-4 bg-green-50 rounded-xl">
                                    <div className="flex items-center mb-3">
                                        <FaWifi className="w-4 h-4 mr-2 text-green-500" />
                                        <h4 className="font-medium text-gray-900">MQTT</h4>
                                    </div>
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-xs text-gray-600">Topic</span>
                                            <p className="px-2 py-1 mt-1 font-mono text-sm text-gray-900 rounded bg-white/70">
                                                {sensor.mqttTopic}
                                            </p>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Host</span>
                                            <span className="font-medium text-gray-900">{sensor.mqttHost}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Port</span>
                                            <span className="font-medium text-gray-900">{sensor.mqttPort}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">TLS</span>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                sensor.mqttUseTLS ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                                {sensor.mqttUseTLS ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Notifications */}
                                <div className="p-4 bg-yellow-50 rounded-xl">
                                    <div className="flex items-center mb-3">
                                        <FaBell className="w-4 h-4 mr-2 text-yellow-500" />
                                        <h4 className="font-medium text-gray-900">Notifications</h4>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Status</span>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                sensor.notificationsEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                                {sensor.notificationsEnabled ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </div>
                                        {sensor.notificationsEnabled && (
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Threshold</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {sensor.notificationThreshold}{sensor.unit && ` ${sensor.unit}`}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            {sensor.description && (
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <h4 className="mb-2 font-medium text-gray-900">Description</h4>
                                    <p className="text-sm text-gray-600">{sensor.description}</p>
                                </div>
                            )}

                            {/* Auto-refresh notice */}
                            <div className="flex items-center justify-center p-3 text-xs text-blue-600 rounded-lg bg-blue-50">
                                <div className="w-2 h-2 mr-2 bg-blue-500 rounded-full animate-pulse"></div>
                                Auto-refreshes every 10 seconds
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end p-4 border-t border-gray-100 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewSensorModal;