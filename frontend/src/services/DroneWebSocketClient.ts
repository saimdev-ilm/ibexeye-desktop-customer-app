// DroneWebSocketClient.ts - Enhanced version for dynamic coordinates

interface DroneWebSocketCallbacks {
  onConnect: () => void;
  onDisconnect: () => void;
  onError: (error: unknown) => void;
  onMessage: (message: unknown) => void;
}

class DroneWebSocketClient {
  private url: string;
  private socket: WebSocket | null = null;
  private callbacks: DroneWebSocketCallbacks;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private intentionalDisconnect: boolean = false;
  private disableAutoReconnect: boolean = false;
  private connecting: boolean = false;
  private reconnectTimeouts: NodeJS.Timeout[] = [];

  constructor(serverUrl: string, callbacks: DroneWebSocketCallbacks) {
    this.url = serverUrl;
    this.callbacks = callbacks;
  }

  public preventAutoReconnect(): void {
    this.disableAutoReconnect = true;
    this.cancelReconnectAttempts();
  }

  public async connect(): Promise<void> {
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.CONNECTING ||
        this.socket.readyState === WebSocket.OPEN)
    ) {
      console.log("Connection already exists");
      return;
    }

    if (this.connecting) {
      console.log("Already attempting to connect");
      return;
    }

    this.cancelReconnectAttempts();
    this.connecting = true;
    this.intentionalDisconnect = false;
    this.reconnectAttempts = 0;

    return new Promise<void>((resolve, reject) => {
      try {
        this.cleanup();
        this.socket = new WebSocket(this.url);

        const connectionTimeout = setTimeout(() => {
          if (this.socket && this.socket.readyState !== WebSocket.OPEN) {
            this.connecting = false;
            this.cleanup();
            reject(new Error("Connection timeout"));
          }
        }, 10000);

        this.socket.onopen = () => {
          clearTimeout(connectionTimeout);
          this.connecting = false;
          console.log("WebSocket connection established");

          this.sendIdentity();
          this.startHeartbeat();
          this.callbacks.onConnect();
          resolve();
        };

        this.socket.onclose = (event) => {
          clearTimeout(connectionTimeout);
          this.connecting = false;
          console.log(
            `WebSocket connection closed: ${event.code} - ${event.reason}, intentionalDisconnect=${this.intentionalDisconnect}, disableAutoReconnect=${this.disableAutoReconnect}`
          );
          this.cleanup();

          if (!this.intentionalDisconnect && !this.disableAutoReconnect) {
            this.handleReconnect();
          } else {
            this.callbacks.onDisconnect();
          }
        };

        this.socket.onerror = (error) => {
          clearTimeout(connectionTimeout);
          this.connecting = false;
          console.error("WebSocket error:", error);
          this.callbacks.onError(error);
          reject(error);
        };

        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.callbacks.onMessage(message);
          } catch (error) {
            console.error("Error parsing message:", error);
          }
        };
      } catch (error) {
        this.connecting = false;
        console.error("Error creating WebSocket:", error);
        reject(error);
      }
    });
  }

  public disconnect(): void {
    this.intentionalDisconnect = true;
    this.disableAutoReconnect = true;
    this.cancelReconnectAttempts();
    this.cleanup();
    this.callbacks.onDisconnect();
  }

  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  // ENHANCED: Send command with dynamic coordinates support
  public async sendCommand(
    command: string,
    params: Record<string, unknown> = {}
  ): Promise<void> {
    if (!this.isConnected()) {
      throw new Error("Not connected to server");
    }

    const message = { type: command, ...params };
    try {
      this.socket!.send(JSON.stringify(message));
      console.log("Sent command:", message);
    } catch (error) {
      console.error("Error sending command:", error);
      throw error;
    }
  }

  // NEW: Send navigation command with dynamic coordinates
  public async sendGoToLocation(
    latitude: number,
    longitude: number,
    altitude: number = 15
  ): Promise<void> {
    if (!this.isConnected()) {
      throw new Error("Not connected to server");
    }

    // Validate coordinates
    if (!latitude || !longitude || latitude === 0 || longitude === 0) {
      throw new Error("Invalid coordinates provided");
    }

    if (altitude < 0 || altitude > 500) {
      throw new Error("Altitude must be between 0 and 500 meters");
    }

    const navigationCommand = {
      type: "go_to_location",
      latitude: parseFloat(latitude.toFixed(6)),
      longitude: parseFloat(longitude.toFixed(6)),
      altitude: Math.round(altitude),
      timestamp: Date.now(),
      commandId: `goto_${Date.now()}`,
    };

    try {
      this.socket!.send(JSON.stringify(navigationCommand));
      console.log("🚁 Sent navigation command:", navigationCommand);
    } catch (error) {
      console.error("Error sending navigation command:", error);
      throw error;
    }
  }

  // NEW: Send waypoints mission with dynamic coordinates
  public async sendExecuteWaypoints(waypoints: any[]): Promise<void> {
    if (!this.isConnected()) {
      throw new Error("Not connected to server");
    }

    if (waypoints.length < 2) {
      throw new Error("At least 2 waypoints required");
    }

    const waypointsCommand = {
      type: "execute_waypoints",
      waypoints: waypoints.map((wp, index) => ({
        id: wp.id,
        name: wp.name,
        latitude: parseFloat(wp.latitude.toFixed(6)),
        longitude: parseFloat(wp.longitude.toFixed(6)),
        altitude: Math.round(wp.altitude || 15),
        order: index,
        isHome: wp.isHome || false,
      })),
      totalWaypoints: waypoints.length,
      timestamp: Date.now(),
      commandId: `waypoints_${Date.now()}`,
    };

    try {
      this.socket!.send(JSON.stringify(waypointsCommand));
      console.log("🗺️ Sent waypoints mission:", waypointsCommand);
    } catch (error) {
      console.error("Error sending waypoints:", error);
      throw error;
    }
  }

  private sendIdentity(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(
          JSON.stringify({ type: "CLIENT_IDENTITY", clientType: "electron" })
        );
      } catch (error) {
        console.error("Error sending identity:", error);
      }
    }
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        try {
          this.socket.send(JSON.stringify({ type: "ping" }));
        } catch (error) {
          console.error("Error sending heartbeat:", error);
        }
      } else {
        console.warn("Heartbeat: socket not open, skipping ping");
      }
    }, 15000);
  }

  private handleReconnect(): void {
    if (
      this.reconnectAttempts < this.maxReconnectAttempts &&
      !this.intentionalDisconnect &&
      !this.disableAutoReconnect
    ) {
      this.reconnectAttempts++;
      console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
      );

      this.callbacks.onMessage({
        type: "reconnect_attempt",
        attempt: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts,
      });

      const timeout = setTimeout(() => {
        const index = this.reconnectTimeouts.indexOf(timeout);
        if (index !== -1) {
          this.reconnectTimeouts.splice(index, 1);
          if (
            !this.isConnected() &&
            !this.connecting &&
            !this.intentionalDisconnect &&
            !this.disableAutoReconnect
          ) {
            this.connect().catch((error) =>
              console.error("Reconnect failed:", error)
            );
          }
        }
      }, 2000 * this.reconnectAttempts);

      this.reconnectTimeouts.push(timeout);
    } else {
      console.log("Max reconnect attempts reached or reconnect disabled");
      this.callbacks.onDisconnect();
    }
  }

  private cancelReconnectAttempts(): void {
    console.log(
      `Canceling ${this.reconnectTimeouts.length} pending reconnect attempts`
    );
    this.reconnectTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.reconnectTimeouts = [];
  }

  private cleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onclose = null;
      this.socket.onerror = null;
      this.socket.onmessage = null;

      if (
        this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING
      ) {
        try {
          if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type: "disconnect" }));
          }
          this.socket.close(1000, "Normal closure");
        } catch (error) {
          console.error("Error closing socket:", error);
        }
      }
      this.socket = null;
    }
  }
}

export default DroneWebSocketClient;
