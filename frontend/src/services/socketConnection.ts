import { io, Socket } from "socket.io-client";
import { loadData } from "../services/auth/loadData";
import { SOCKET_URL } from "../utils/baseUrl";

type CallbackFunction<T = unknown> = (data: T) => void;

interface Listeners {
  [topic: string]: CallbackFunction[];
}

class WebSocketService {
  private socket: Socket | null;
  private listeners: Listeners;
  private isConnected: boolean;
  private reconnectAttempts: number;
  private maxReconnectAttempts: number;
  private connectionPromise: Promise<boolean> | null;

  constructor() {
    this.socket = null;
    this.listeners = {};
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.connectionPromise = null;
  }

  async connect(): Promise<boolean> {
    console.log("📡 WebSocketService.connect() called");

    if (this.socket && this.isConnected) {
      console.log("✅ Already connected, returning true");
      return Promise.resolve(true);
    }

    if (this.connectionPromise) {
      console.log("⏳ Connection in progress, waiting...");
      return this.connectionPromise;
    }

    this.connectionPromise = this.establishConnection();
    return this.connectionPromise;
  }

  private async establishConnection(): Promise<boolean> {
    try {
      console.log("🔌 Establishing WebSocket connection...");
      const auth = await loadData();

      if (!auth) {
        throw new Error("No authentication data found");
      }

      const token = auth.access_token;

      return new Promise<boolean>((resolve, reject) => {
        if (!token) {
          return reject(new Error("⚠️ No auth token found."));
        }

        console.log("🔌 Creating socket connection...");

        this.socket = io(`${SOCKET_URL}?token=${token}`, {
          transports: ["websocket"],
          forceNew: true,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          timeout: 10000,
        });

        this.socket.on("connect", () => {
          console.log("✅ WebSocket Connected successfully");
          console.log(
            "Socket transport:",
            this.socket?.io.engine.transport.name
          );
          console.log("Socket URL:", this.socket?.io.uri);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.connectionPromise = null;
          this.setupReconnectionListeners();
          this.resubscribeToTopics();
          resolve(true);
        });

        this.socket.on("connect_error", (error) => {
          console.error("❌ WebSocket Connection Error:", error);
          this.isConnected = false;
          this.connectionPromise = null;
          reject(error);
        });

        this.socket.on("disconnect", (reason) => {
          console.warn("⚠️ WebSocket Disconnected:", reason);
          this.isConnected = false;
          this.connectionPromise = null;
        });
      });
    } catch (error) {
      console.error("❌ Error connecting to WebSocket:", error);
      this.connectionPromise = null;
      throw error;
    }
  }

  setupReconnectionListeners(): void {
    if (!this.socket) return;

    this.socket.io.on("reconnect", (attempt: number) => {
      console.log(`🔄 Reconnected on attempt ${attempt}`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.connectionPromise = null;
      this.resubscribeToTopics();
    });

    this.socket.io.on("reconnect_attempt", (attempt: number) => {
      this.reconnectAttempts = attempt;
      console.log(`🔄 Reconnection attempt ${attempt}`);
    });

    this.socket.io.on("reconnect_error", (error: Error) => {
      console.error("❌ Reconnection error:", error);
    });

    this.socket.io.on("reconnect_failed", () => {
      console.error("❌ Could not reconnect to the server");
      this.isConnected = false;
      this.connectionPromise = null;
    });
  }

  subscribe(topic: string, callback: CallbackFunction): void {
    console.log(`🔔 Subscribing to topic: ${topic}`);

    if (!this.listeners[topic]) {
      this.listeners[topic] = [];
    }

    this.listeners[topic].push(callback);
    console.log(
      `📝 Stored callback for ${topic}. Total callbacks: ${this.listeners[topic].length}`
    );

    if (this.isConnected && this.socket) {
      console.log(`🔗 Setting up socket listener for ${topic}`);
      this.socket.on(topic, callback);
      console.log(`✅ Successfully set up socket listener for ${topic}`);
    } else {
      console.log(`⏳ Socket not connected, subscription for ${topic} queued`);
    }
  }

  unsubscribe(topic: string, callback: CallbackFunction): void {
    console.log(`🔕 Unsubscribing from topic: ${topic}`);

    if (this.listeners[topic]) {
      this.listeners[topic] = this.listeners[topic].filter(
        (cb) => cb !== callback
      );

      if (this.socket) {
        this.socket.off(topic, callback);
        console.log(`✅ Removed socket listener for ${topic}`);
      }

      if (this.listeners[topic].length === 0) {
        delete this.listeners[topic];
        console.log(`🧹 Cleaned up empty listeners array for ${topic}`);
      }
    }
  }

  // FIXED: Remove all listeners before resubscribing
  resubscribeToTopics(): void {
    console.log("🔄 Resubscribing to all topics...");
    console.log(
      `📊 Topics to resubscribe: ${Object.keys(this.listeners).join(", ")}`
    );

    if (!this.socket) return;

    // CRITICAL FIX: Remove all existing listeners first
    Object.keys(this.listeners).forEach((topic) => {
      this.socket?.off(topic);
    });

    // Now resubscribe with fresh listeners
    Object.keys(this.listeners).forEach((topic) => {
      console.log(
        `🔄 Resubscribing to ${topic} with ${this.listeners[topic].length} callbacks`
      );
      this.listeners[topic].forEach((callback) => {
        if (this.socket) {
          this.socket.on(topic, callback);
          console.log(`✅ Resubscribed to ${topic}`);
        }
      });
    });
  }

  on(event: string, callback: CallbackFunction): void {
    console.log(`🔗 Setting up direct listener for event: ${event}`);
    if (this.socket) {
      this.socket.on(event, callback);
      console.log(`✅ Direct listener set up for ${event}`);
    } else {
      console.warn(
        `⚠️ Cannot set listener for "${event}" - socket not connected`
      );
    }
  }

  emit<T>(event: string, data: T): void {
    console.log(`📤 Emitting event: ${event}`, data);
    if (this.isConnected && this.socket) {
      this.socket.emit(event, data);
      console.log(`✅ Event ${event} emitted successfully`);
    } else {
      console.warn("⚠️ Socket not connected. Cannot emit event.");
    }
  }

  disconnect(): void {
    console.log("🔌 Disconnecting WebSocket...");

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners = {};
      this.connectionPromise = null;
      console.log("✅ WebSocket disconnected and cleaned up");
    }
  }

  getConnectionState(): {
    isConnected: boolean;
    listenersCount: number;
    topics: string[];
  } {
    return {
      isConnected: this.isConnected,
      listenersCount: Object.keys(this.listeners).length,
      topics: Object.keys(this.listeners),
    };
  }
}

const webSocketService = new WebSocketService();
export default webSocketService;
