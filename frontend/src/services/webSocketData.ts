import { useState, useEffect } from "react";
import webSocketService from "./socketConnection";

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

export function useWebSocketData(topic: string): DataState | null {
  const [data, setData] = useState<DataState | null>(null);

  useEffect(() => {
    const handleData = (rawMessage: unknown): void => {
      try {
        let parsedMessage: MessageData;

        // Handle different message formats
        if (Array.isArray(rawMessage)) {
          // Socket.IO sends messages as arrays: [eventName, data]
          if (rawMessage.length >= 2 && typeof rawMessage[1] === "string") {
            parsedMessage = JSON.parse(rawMessage[1]);
          } else {
            console.warn(
              `❌ Unexpected array format for ${topic}:`,
              rawMessage
            );
            return;
          }
        } else if (typeof rawMessage === "string") {
          // Direct string message
          parsedMessage = JSON.parse(rawMessage);
        } else if (typeof rawMessage === "object" && rawMessage !== null) {
          // Already parsed object
          parsedMessage = rawMessage as MessageData;
        } else {
          console.warn(
            `❌ Unexpected message format for ${topic}:`,
            rawMessage
          );
          return;
        }

        // Handle batch mode messages
        if (
          "batchMode" in parsedMessage &&
          parsedMessage.batchMode &&
          Array.isArray(parsedMessage.messages)
        ) {
          const batchData: DataState = {};
          parsedMessage.messages.forEach((msg) => {
            if (msg.topic && msg.message !== undefined) {
              batchData[msg.topic] = msg.message;
            }
          });

          setData((prevData) => ({ ...prevData, ...batchData }));
        }
        // Handle single message
        else if (
          "topic" in parsedMessage &&
          parsedMessage.topic &&
          parsedMessage.message !== undefined
        ) {
          setData((prevData) => ({
            ...prevData,
            [String(parsedMessage.topic)]: parsedMessage.message,
          }));
        } else {
          console.warn(
            `❌ Message doesn't match expected format for ${topic}:`,
            parsedMessage
          );
        }
      } catch (err) {
        console.error(
          `❌ Failed to parse ${topic} WebSocket message:`,
          err,
          "Raw message:",
          rawMessage
        );
      }
    };

    const initializeConnection = async () => {
      try {
        const connected = await webSocketService.connect();

        if (connected) {
          webSocketService.subscribe(topic, handleData);
        } else {
          console.error(`❌ Failed to connect WebSocket for topic: ${topic}`);
        }
      } catch (error) {
        console.error(
          `❌ Error connecting WebSocket for topic ${topic}:`,
          error
        );
      }
    };

    // Initialize connection and subscribe
    initializeConnection();

    // Cleanup subscription on unmount
    return () => {
      webSocketService.unsubscribe(topic, handleData);
    };
  }, [topic]);

  return data;
}
