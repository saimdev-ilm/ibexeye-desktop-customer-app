// Enhanced WebSocketContext.tsx with better theft_detection handling
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import webSocketService from '../services/socketConnection';

interface WebSocketMessage {
    topic?: string;
    message?: unknown;
}

interface BatchMessage {
    batchMode: boolean;
    messages: WebSocketMessage[];
}

type MessageData = WebSocketMessage | BatchMessage;

interface DataState {
    [key: string]: unknown;
}

interface WebSocketContextType {
    // Data for all topics
    data: { [topic: string]: DataState | null };

    // Connection state
    isConnected: boolean;
    connectionState: {
        isConnected: boolean;
        listenersCount: number;
        topics: string[];
    };

    // Methods
    subscribeToTopic: (topic: string) => void;
    unsubscribeFromTopic: (topic: string) => void;
    getTopicData: (topic: string) => DataState | null;

    // Reconnection info
    reconnectAttempts: number;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
    children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
    const [data, setData] = useState<{ [topic: string]: DataState | null }>({});
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [reconnectAttempts,] = useState<number>(0);
    const [connectionState, setConnectionState] = useState({
        isConnected: false,
        listenersCount: 0,
        topics: []
    });

    // Store active subscriptions
    const [activeTopics] = useState<Set<string>>(new Set());

    // Initialize WebSocket connection
    useEffect(() => {
        const initializeConnection = async () => {
            try {
                console.log('🔌 WebSocketProvider: Initializing connection...');
                const connected = await webSocketService.connect();
                setIsConnected(connected);

                if (connected) {
                    console.log('✅ WebSocketProvider: Connected successfully');
                    updateConnectionState();
                }
            } catch (error) {
                console.error('❌ WebSocketProvider: Connection failed:', error);
                setIsConnected(false);
            }
        };

        initializeConnection();

        // Monitor connection state
        const stateInterval = setInterval(() => {
            updateConnectionState();
        }, 5000); // Check every 5 seconds

        return () => {
            clearInterval(stateInterval);
        };
    }, []);

    const updateConnectionState = () => {
        const state = webSocketService.getConnectionState();
        setConnectionState(state);
        setIsConnected(state.isConnected);
    };

    const createDataHandler = (topic: string) => {
        return (rawMessage: unknown): void => {
            console.log(`📨 WebSocketProvider: Received data for topic "${topic}":`, rawMessage);
            
            try {
                let parsedMessage: MessageData;

                // Handle different message formats
                if (Array.isArray(rawMessage)) {
                    if (rawMessage.length >= 2 && typeof rawMessage[1] === 'string') {
                        parsedMessage = JSON.parse(rawMessage[1]);
                    } else {
                        console.warn(`❌ Unexpected array format for ${topic}:`, rawMessage);
                        return;
                    }
                } else if (typeof rawMessage === 'string') {
                    parsedMessage = JSON.parse(rawMessage);
                } else if (typeof rawMessage === 'object' && rawMessage !== null) {
                    parsedMessage = rawMessage as MessageData;
                } else {
                    console.warn(`❌ Unexpected message format for ${topic}:`, rawMessage);
                    return;
                }

                console.log(`📦 WebSocketProvider: Parsed message for ${topic}:`, parsedMessage);

                // Special handling for theft_detection topic
                if (topic === 'theft_detection') {
                    console.log('🚨 WebSocketProvider: Processing theft detection data');
                    
                    // For theft_detection, store the data directly with timestamp
                    const alertId = `theft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    setData(prevData => {
                        const newData = {
                            ...prevData,
                            [topic]: {
                                ...prevData[topic],
                                [alertId]: parsedMessage
                            }
                        };
                        console.log('🔄 WebSocketProvider: Updated theft_detection data:', newData[topic]);
                        return newData;
                    });
                    return;
                }

                // Special handling for alert topic
                if (topic === 'alert') {
                    // For alerts, store the parsed alert directly
                    const alertId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                    setData(prevData => ({
                        ...prevData,
                        [topic]: {
                            ...prevData[topic],
                            [alertId]: parsedMessage
                        }
                    }));
                    return;
                }

                // Handle batch mode messages for other topics
                if ('batchMode' in parsedMessage && parsedMessage.batchMode && Array.isArray(parsedMessage.messages)) {
                    const batchData: DataState = {};
                    parsedMessage.messages.forEach(msg => {
                        if (msg.topic && msg.message !== undefined) {
                            batchData[msg.topic] = msg.message;
                        }
                    });

                    setData(prevData => ({
                        ...prevData,
                        [topic]: { ...prevData[topic], ...batchData }
                    }));
                }
                // Handle single message for other topics
                else if ('topic' in parsedMessage && parsedMessage.topic && parsedMessage.message !== undefined) {
                    setData(prevData => ({
                        ...prevData,
                        [topic]: {
                            ...prevData[topic],
                            [String(parsedMessage.topic)]: parsedMessage.message
                        }
                    }));
                } else {
                    // If it doesn't match expected patterns, store directly
                    console.log(`📋 WebSocketProvider: Storing raw data for ${topic}`);
                    const dataId = `${topic}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    setData(prevData => ({
                        ...prevData,
                        [topic]: {
                            ...prevData[topic],
                            [dataId]: parsedMessage
                        }
                    }));
                }
            } catch (err) {
                console.error(`❌ WebSocketProvider: Failed to parse ${topic} message:`, err, rawMessage);
            }
        };
    };

    const subscribeToTopic = (topic: string) => {
        console.log(`🔔 WebSocketProvider: Attempting to subscribe to "${topic}"`);
        
        if (activeTopics.has(topic)) {
            console.log(`⚠️ WebSocketProvider: Already subscribed to "${topic}"`);
            return;
        }

        const handler = createDataHandler(topic);
        webSocketService.subscribe(topic, handler);
        activeTopics.add(topic);

        // Initialize data for this topic if not exists
        setData(prevData => ({
            ...prevData,
            [topic]: prevData[topic] || {}
        }));

        console.log(`✅ WebSocketProvider: Successfully subscribed to "${topic}"`);
    };

    const unsubscribeFromTopic = (topic: string) => {
        console.log(`🔕 WebSocketProvider: Unsubscribing from "${topic}"`);
        
        if (!activeTopics.has(topic)) {
            console.log(`⚠️ WebSocketProvider: Not subscribed to "${topic}"`);
            return;
        }

        // We can't easily remove the specific handler, so we'll let the service handle it
        activeTopics.delete(topic);

        // Optionally clear data for this topic
        setData(prevData => {
            const newData = { ...prevData };
            delete newData[topic];
            return newData;
        });

        console.log(`✅ WebSocketProvider: Unsubscribed from "${topic}"`);
    };

    const getTopicData = (topic: string): DataState | null => {
        const result = data[topic] || null;
        console.log(`📤 WebSocketProvider: getTopicData("${topic}"):`, result);
        return result;
    };

    // Debug logging for data changes
    useEffect(() => {
        console.log('🔄 WebSocketProvider: Data state updated:', {
            topics: Object.keys(data),
            isConnected,
            activeTopics: Array.from(activeTopics)
        });
    }, [data, isConnected]);

    const value: WebSocketContextType = {
        data,
        isConnected,
        connectionState,
        subscribeToTopic,
        unsubscribeFromTopic,
        getTopicData,
        reconnectAttempts
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};

// Custom hook to use WebSocket context
export const useWebSocket = (): WebSocketContextType => {
    const context = useContext(WebSocketContext);
    if (context === undefined) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};

// Custom hook for specific topic (replacement for your existing useWebSocketData)
export const useWebSocketData = (topic: string): DataState | null => {
    const { subscribeToTopic, getTopicData, isConnected } = useWebSocket();
    const [topicData, setTopicData] = useState<DataState | null>(null);

    useEffect(() => {
        subscribeToTopic(topic);

        // Set up a listener for data changes
        const interval = setInterval(() => {
            const currentData = getTopicData(topic);
            setTopicData(currentData);
        }, 100); // Check for updates every 100ms

        return () => {
            clearInterval(interval);
        };
    }, [topic, subscribeToTopic, getTopicData]);

    // Also update data when connection state changes
    useEffect(() => {
        const currentData = getTopicData(topic);
        setTopicData(currentData);
    }, [isConnected, topic, getTopicData]);

    return topicData;
};