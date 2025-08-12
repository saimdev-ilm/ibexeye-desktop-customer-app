import React, { useState, FormEvent, useEffect } from 'react';
import { FaTimes, FaExclamationTriangle, FaSpinner, FaCheckCircle } from 'react-icons/fa';
import { Sensor, updateSensor } from '../../../services/sensorService';
import { getAllZones, Zone } from '../../../services/zoneService';

interface EditSensorModalProps {
    sensor: Sensor;
    onClose: () => void;
    onSave: (updatedSensor: Sensor) => void;
}

// Enhanced Sensor interface to handle zone object from API
interface SensorWithZone extends Sensor {
    zone?: {
        id: number;
        name: string;
        type: string;
    } | number | null;
}

const EditSensorModal: React.FC<EditSensorModalProps> = ({ sensor, onClose, onSave }) => {
    // Debug: Check what's in the sensor object
    console.log('Sensor object in EditModal:', sensor);

    // Initialize form data with proper zone handling
    const [formData, setFormData] = useState<Sensor>(() => {
        // Extract zone ID from different possible structures
        let zoneValue = null;

        // Handle zone as object {id, name, type}
        if (typeof (sensor as any).zone === 'object' && (sensor as any).zone?.id) {
            zoneValue = (sensor as any).zone.id;
        }
        // Handle zone as number
        else if (typeof (sensor as any).zone === 'number') {
            zoneValue = (sensor as any).zone;
        }
        // Handle direct zone field
        else if (sensor.zone) {
            zoneValue = sensor.zone;
        }

        console.log('Extracted zone value:', zoneValue);

        return {
            ...sensor,
            zone: zoneValue
        };
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [zones, setZones] = useState<Zone[]>([]);
    const [zonesLoading, setZonesLoading] = useState<boolean>(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState<boolean>(false);

    // Fetch zones on component mount
    useEffect(() => {
        const fetchZones = async () => {
            setZonesLoading(true);
            try {
                const zonesData = await getAllZones();
                setZones(zonesData);
            } catch (error) {
                console.error('Failed to fetch zones:', error);
                setErrors(prev => ({ ...prev, zones: 'Failed to load zones' }));
            } finally {
                setZonesLoading(false);
            }
        };

        fetchZones();
    }, []);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Basic validation rules
        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.dataType.trim()) {
            newErrors.dataType = 'Data Type is required';
        }

        if (!formData.mqttTopic.trim()) {
            newErrors.mqttTopic = 'MQTT Topic is required';
        }

        if (!formData.mqttHost.trim()) {
            newErrors.mqttHost = 'MQTT Host is required';
        }

        if (!formData.mqttPort || formData.mqttPort <= 0) {
            newErrors.mqttPort = 'Valid MQTT Port is required';
        }

        // Validate min/max values consistency
        if (formData.minValue !== undefined && formData.minValue !== null &&
            formData.maxValue !== undefined && formData.maxValue !== null &&
            formData.minValue >= formData.maxValue) {
            newErrors.minValue = 'Min value must be less than max value';
            newErrors.maxValue = 'Max value must be greater than min value';
        }

        // Validate notification threshold if notifications are enabled
        if (formData.notificationsEnabled &&
            (formData.notificationThreshold === undefined || formData.notificationThreshold < 0)) {
            newErrors.notificationThreshold = 'Please provide a valid notification threshold';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        // Handle different input types appropriately
        if (type === 'number') {
            // For number inputs, convert to number type but handle empty string as null
            const numberValue = value.trim() === '' ? null : Number(value);
            setFormData((prev) => ({ ...prev, [name]: numberValue }));
        } else if (type === 'checkbox') {
            // For checkbox inputs, toggle boolean value
            const isChecked = (e.target as HTMLInputElement).checked;
            setFormData((prev) => ({ ...prev, [name]: isChecked }));
        } else if (name === 'zone') {
            // Handle zone selection - convert to number or null
            const zoneValue = value === '' ? null : Number(value);
            setFormData((prev) => ({ ...prev, [name]: zoneValue }));
        } else {
            // For all other inputs, use string value
            setFormData((prev) => ({ ...prev, [name]: value }));
        }

        // Clear error when field is edited
        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            // Prepare the payload according to the UPDATE API structure
            const updatePayload = {
                name: formData.name,
                mqttTopic: formData.mqttTopic,
                description: formData.description || '',
                mqttHost: formData.mqttHost,
                mqttPort: formData.mqttPort,
                mqttUsername: formData.mqttUsername || '',
                mqttPassword: formData.mqttPassword || '',
                mqttProtocol: formData.mqttProtocol || 'mqtt',
                dataType: 'number', // API expects 'number' as string
                unit: formData.unit || '',
                active: formData.active,
                notificationsEnabled: formData.notificationsEnabled || false,
                notificationThreshold: formData.notificationThreshold || 0,
                zoneId: formData.zone ? String(formData.zone) : null // Convert zone to zoneId string, null if no zone
            };

            // Call the updateSensor API
            const updatedSensor = await updateSensor(sensor.id, updatePayload);

            // Show success popup
            setShowSuccessPopup(true);

            // Auto-hide success popup after 2 seconds and close modal
            setTimeout(() => {
                setShowSuccessPopup(false);
                onSave(updatedSensor);
                onClose();
            }, 2000);
        } catch (error) {
            console.error("Error updating sensor:", error);
            // Set a general form error
            setErrors({
                form: error instanceof Error ? error.message : 'Failed to update sensor'
            });
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto bg-black bg-opacity-50 outline-none focus:outline-none">
                <div className="relative w-full max-w-2xl mx-auto my-6">
                    <div className="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-lg outline-none focus:outline-none">
                        {/* Header */}
                        <div className="flex items-start justify-between p-5 border-b border-gray-200 rounded-t">
                            <h3 className="text-xl font-semibold">
                                Edit Sensor: {sensor.name}
                            </h3>
                            <button
                                className="float-right p-1 ml-auto text-3xl font-semibold leading-none text-gray-500 bg-transparent border-0 outline-none focus:outline-none"
                                onClick={onClose}
                                disabled={isLoading}
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="relative flex-auto p-6 overflow-y-auto max-h-[70vh]">
                            {/* General error message */}
                            {errors.form && (
                                <div className="p-3 mb-4 text-red-700 bg-red-100 border border-red-200 rounded-lg">
                                    <div className="flex items-center">
                                        <FaExclamationTriangle className="mr-2" />
                                        <span>{errors.form}</span>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Basic Information Section */}
                                <div>
                                    <h4 className="mb-4 text-lg font-semibold">Basic Information</h4>
                                    <div className="space-y-4">
                                        {/* Sensor Name */}
                                        <div>
                                            <label className="block mb-1 text-sm font-medium text-gray-700">
                                                Sensor Name
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                className={`w-full px-3 py-2 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                placeholder="Dining Room Temperature"
                                                required
                                            />
                                            {errors.name && (
                                                <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                                            )}
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label className="block mb-1 text-sm font-medium text-gray-700">
                                                Description
                                            </label>
                                            <input
                                                type="text"
                                                name="description"
                                                value={formData.description || ''}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                placeholder="DHT22 temperature sensor in the dining room"
                                            />
                                        </div>

                                        {/* Type */}
                                        <div>
                                            <label className="block mb-1 text-sm font-medium text-gray-700">
                                                Type
                                            </label>
                                            <select
                                                name="dataType"
                                                value={formData.dataType}
                                                onChange={handleChange}
                                                className={`w-full px-3 py-2 border rounded-md ${errors.dataType ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                required
                                            >
                                                <option value="">Select Type</option>
                                                <option value="temperature">temperature</option>
                                                <option value="humidity">humidity</option>
                                                <option value="pressure">pressure</option>
                                                <option value="light">light</option>
                                                <option value="motion">motion</option>
                                                <option value="contact">contact</option>
                                                <option value="voltage">voltage</option>
                                                <option value="current">current</option>
                                                <option value="power">power</option>
                                                <option value="energy">energy</option>
                                                <option value="custom">custom</option>
                                            </select>
                                            {errors.dataType && (
                                                <p className="mt-1 text-xs text-red-500">{errors.dataType}</p>
                                            )}
                                        </div>

                                        {/* Unit */}
                                        <div>
                                            <label className="block mb-1 text-sm font-medium text-gray-700">
                                                Unit
                                            </label>
                                            <input
                                                type="text"
                                                name="unit"
                                                value={formData.unit || ''}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                placeholder="C"
                                            />
                                        </div>

                                        {/* Threshold Value (maps to notificationThreshold) */}
                                        <div>
                                            <label className="block mb-1 text-sm font-medium text-gray-700">
                                                Threshold Value
                                            </label>
                                            <input
                                                type="number"
                                                name="notificationThreshold"
                                                value={formData.notificationThreshold || ''}
                                                onChange={handleChange}
                                                className={`w-full px-3 py-2 border rounded-md ${errors.notificationThreshold ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                placeholder="100"
                                                step="any"
                                            />
                                            {errors.notificationThreshold && (
                                                <p className="mt-1 text-xs text-red-500">{errors.notificationThreshold}</p>
                                            )}
                                        </div>

                                        {/* Zone Selection */}
                                        <div>
                                            <label className="block mb-1 text-sm font-medium text-gray-700">
                                                Zone (Optional)
                                            </label>
                                            <select
                                                name="zone"
                                                value={formData.zone || ''}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                disabled={zonesLoading}
                                            >
                                                <option value="">No Zone Selected</option>
                                                {zones.map((zone) => (
                                                    <option key={zone.id} value={zone.id}>
                                                        {zone.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {zonesLoading && (
                                                <p className="mt-1 text-xs text-gray-500">Loading zones...</p>
                                            )}
                                            {errors.zones && (
                                                <p className="mt-1 text-xs text-red-500">{errors.zones}</p>
                                            )}
                                            <p className="mt-1 text-xs text-gray-500">
                                                {formData.zone
                                                    ? `Currently assigned to: ${zones.find(z => z.id === formData.zone)?.name || `Zone ID ${formData.zone}`}`
                                                    : 'No zone currently assigned. Select a zone to assign it.'
                                                }
                                            </p>
                                        </div>

                                        {/* Active Status */}
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="active"
                                                name="active"
                                                checked={formData.active}
                                                onChange={handleChange}
                                                className="w-4 h-4 mr-2 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <label htmlFor="active" className="text-sm font-medium text-gray-700">
                                                Active
                                            </label>
                                        </div>

                                        {/* Notifications Enabled */}
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="notificationsEnabled"
                                                name="notificationsEnabled"
                                                checked={formData.notificationsEnabled || false}
                                                onChange={handleChange}
                                                className="w-4 h-4 mr-2 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <label htmlFor="notificationsEnabled" className="text-sm font-medium text-gray-700">
                                                Enable Notifications
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Authentication Section */}
                                <div>
                                    <h4 className="mb-4 text-lg font-semibold">Authentication</h4>
                                    <div className="space-y-4">
                                        {/* MQTT Topic */}
                                        <div>
                                            <label className="block mb-1 text-sm font-medium text-gray-700">
                                                MQTT Topic
                                            </label>
                                            <input
                                                type="text"
                                                name="mqttTopic"
                                                value={formData.mqttTopic}
                                                onChange={handleChange}
                                                className={`w-full px-3 py-2 border rounded-md ${errors.mqttTopic ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                placeholder="home/dht22/temperature"
                                                required
                                            />
                                            {errors.mqttTopic && (
                                                <p className="mt-1 text-xs text-red-500">{errors.mqttTopic}</p>
                                            )}
                                        </div>

                                        {/* MQTT Host */}
                                        <div>
                                            <label className="block mb-1 text-sm font-medium text-gray-700">
                                                MQTT Host
                                            </label>
                                            <input
                                                type="text"
                                                name="mqttHost"
                                                value={formData.mqttHost}
                                                onChange={handleChange}
                                                className={`w-full px-3 py-2 border rounded-md ${errors.mqttHost ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                placeholder="192.168.18.62"
                                                required
                                            />
                                            {errors.mqttHost && (
                                                <p className="mt-1 text-xs text-red-500">{errors.mqttHost}</p>
                                            )}
                                        </div>

                                        {/* MQTT Port */}
                                        <div>
                                            <label className="block mb-1 text-sm font-medium text-gray-700">
                                                MQTT Port
                                            </label>
                                            <input
                                                type="number"
                                                name="mqttPort"
                                                value={formData.mqttPort || ''}
                                                onChange={handleChange}
                                                className={`w-full px-3 py-2 border rounded-md ${errors.mqttPort ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                placeholder="1883"
                                                required
                                                min="1"
                                                max="65535"
                                            />
                                            {errors.mqttPort && (
                                                <p className="mt-1 text-xs text-red-500">{errors.mqttPort}</p>
                                            )}
                                        </div>

                                        {/* MQTT Protocol */}
                                        <div>
                                            <label className="block mb-1 text-sm font-medium text-gray-700">
                                                MQTT Protocol
                                            </label>
                                            <select
                                                name="mqttProtocol"
                                                value={formData.mqttProtocol || 'mqtt'}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                            >
                                                <option value="mqtt">mqtt</option>
                                                <option value="mqtts">mqtts</option>
                                                <option value="ws">ws</option>
                                                <option value="wss">wss</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end p-4 border-t border-gray-200 rounded-b">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isLoading}
                                className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <FaSpinner className="inline mr-2 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    'Update Sensor'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Popup */}
            {showSuccessPopup && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
                    <div className="w-full max-w-sm p-6 mx-4 transform bg-white rounded-lg shadow-xl animate-pulse">
                        <div className="flex flex-col items-center text-center">
                            <div className="flex items-center justify-center w-16 h-16 mb-4 bg-green-100 rounded-full">
                                <FaCheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="mb-2 text-lg font-semibold text-gray-900">
                                Success!
                            </h3>
                            <p className="text-sm text-gray-600">
                                Sensor updated successfully
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default EditSensorModal;