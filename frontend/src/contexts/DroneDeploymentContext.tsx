import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DeploymentLocation {
    latitude: number;
    longitude: number;
    altitude?: number;
    alertId?: string;
    cameraId?: string;
    description?: string;
}

interface DroneDeploymentContextType {
    deploymentRequest: DeploymentLocation | null;
    requestDeployment: (location: DeploymentLocation) => void;
    clearDeployment: () => void;
    isDeploymentPending: boolean;
    lastRequestId: string | null; // ✅ Add unique ID tracking
}

const DroneDeploymentContext = createContext<DroneDeploymentContextType | null>(null);

export const DroneDeploymentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [deploymentRequest, setDeploymentRequest] = useState<DeploymentLocation | null>(null);
    const [lastRequestId, setLastRequestId] = useState<string | null>(null);

    const requestDeployment = (location: DeploymentLocation) => {
        const requestId = `deployment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log('🚨 New deployment request:', location, 'ID:', requestId);

        setDeploymentRequest({
            ...location,
            requestId // ✅ Add unique ID to request
        } as DeploymentLocation & { requestId: string });
        setLastRequestId(requestId);
    };

    const clearDeployment = () => {
        console.log('🧹 Clearing deployment request');
        setDeploymentRequest(null);
        // Don't clear lastRequestId to prevent re-processing
    };

    const isDeploymentPending = deploymentRequest !== null;

    return (
        <DroneDeploymentContext.Provider value={{
            deploymentRequest,
            requestDeployment,
            clearDeployment,
            isDeploymentPending,
            lastRequestId
        }}>
            {children}
        </DroneDeploymentContext.Provider>
    );
};

export const useDroneDeployment = () => {
    const context = useContext(DroneDeploymentContext);
    if (!context) {
        throw new Error('useDroneDeployment must be used within DroneDeploymentProvider');
    }
    return context;
};