interface VideoStreamCallbacks {
  onConnect: () => void;
  onDisconnect: () => void;
  onError: (error: any) => void;
  onFrame: (frameData: ArrayBuffer, timestamp: number) => void;
  onStats: (stats: VideoStreamStats) => void;
}

interface VideoStreamStats {
  framesReceived: number;
  resolution: string;
  frameSize: number;
  dataRate: number;
  fps: number;
  latency: number;
}

class VideoWebSocketClient {
  private url: string;
  private socket: WebSocket | null = null;
  private callbacks: VideoStreamCallbacks;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private intentionalDisconnect: boolean = false;
  private connecting: boolean = false;
  private reconnectTimeouts: NodeJS.Timeout[] = [];
  private statsUpdateInterval: NodeJS.Timeout | null = null;

  // Performance tracking - optimized
  private framesReceived: number = 0;
  private framesDropped: number = 0;
  private resolution: string = "-";
  private fpsArray: number[] = [];
  private lastFrameTime: number = 0;
  private totalBytes: number = 0;
  private bytesLastSecond: number = 0;
  private lastBytesResetTime: number = 0;
  private latencyValues: number[] = [];

  // Frame processing optimization
  private processingFrame: boolean = false;
  private pendingFrames: number = 0;
  private maxPendingFrames: number = 2; // Drop frames if more than 2 are pending

  constructor(serverUrl: string, callbacks: VideoStreamCallbacks) {
    this.url = serverUrl;
    this.callbacks = callbacks;
    this.lastBytesResetTime = performance.now();
  }

  public async connect(): Promise<void> {
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.CONNECTING ||
        this.socket.readyState === WebSocket.OPEN)
    ) {
      console.log("Video stream connection already exists");
      return;
    }

    if (this.connecting) {
      console.log("Already attempting to connect to video stream");
      return Promise.resolve();
    }

    this.cancelReconnectAttempts();
    this.connecting = true;
    this.intentionalDisconnect = false;
    this.reconnectAttempts = 0;

    return new Promise<void>((resolve, reject) => {
      try {
        if (this.socket) {
          this.cleanup();
        }

        let wsUrl = this.url;
        if (!wsUrl.startsWith("ws://") && !wsUrl.startsWith("wss://")) {
          wsUrl = "ws://" + wsUrl;
        }

        console.log(`Attempting to connect to video stream at: ${wsUrl}`);

        this.socket = new WebSocket(wsUrl);
        this.socket.binaryType = "arraybuffer";

        const connectionTimeout = setTimeout(() => {
          if (this.socket && this.socket.readyState !== WebSocket.OPEN) {
            console.log("Video stream connection timeout");
            this.connecting = false;
            this.cleanup();
            reject(new Error("Video stream connection timeout"));
          }
        }, 5000); // Reduced timeout for faster failure detection

        this.socket.onopen = () => {
          clearTimeout(connectionTimeout);
          this.connecting = false;
          console.log("Video WebSocket connection established");
          this.startStatsUpdate();
          this.callbacks.onConnect();
          resolve();
        };

        this.socket.onclose = (event) => {
          clearTimeout(connectionTimeout);
          this.connecting = false;
          console.log(`Video WebSocket connection closed: ${event.code}`);
          this.cleanup();

          if (!this.intentionalDisconnect) {
            this.handleReconnect();
          } else {
            this.callbacks.onDisconnect();
          }
        };

        this.socket.onerror = (error) => {
          clearTimeout(connectionTimeout);
          this.connecting = false;
          console.error("Video WebSocket error:", error);
          this.callbacks.onError(error);
          reject(error);
        };

        this.socket.onmessage = (event) => {
          // Optimized message handling
          if (event.data instanceof ArrayBuffer) {
            this.handleFrameMessage(event.data);
          } else if (typeof event.data === "string") {
            try {
              const message = JSON.parse(event.data);
              console.log("Received video control message:", message);
            } catch (e) {
              console.error("Invalid JSON message:", event.data);
            }
          }
        };
      } catch (error) {
        this.connecting = false;
        console.error("Error creating Video WebSocket:", error);
        reject(error);
      }
    });
  }

  private handleFrameMessage(data: ArrayBuffer): void {
    const receiveTime = performance.now();

    // Frame dropping logic - if we're processing too many frames, drop this one
    if (this.processingFrame || this.pendingFrames >= this.maxPendingFrames) {
      this.framesDropped++;
      return;
    }

    this.pendingFrames++;

    // Use requestAnimationFrame for smoother frame processing
    requestAnimationFrame(() => {
      this.processFrame(data, receiveTime);
      this.pendingFrames--;
    });
  }

  private processFrame(data: ArrayBuffer, receiveTime: number): void {
    if (this.processingFrame) {
      return; // Skip if already processing
    }

    this.processingFrame = true;

    try {
      // Track statistics
      this.framesReceived++;

      const frameSize = data.byteLength;
      this.totalBytes += frameSize;
      this.bytesLastSecond += frameSize;

      // Optimized FPS calculation
      const now = performance.now();
      if (this.lastFrameTime !== 0) {
        const frameDuration = now - this.lastFrameTime;
        if (frameDuration > 0) {
          const currentFps = 1000 / frameDuration;

          // Keep only last 10 FPS values for faster calculation
          this.fpsArray.push(currentFps);
          if (this.fpsArray.length > 10) {
            this.fpsArray.shift();
          }

          // Simplified latency calculation
          const latency = now - receiveTime;
          this.latencyValues.push(latency);
          if (this.latencyValues.length > 10) {
            this.latencyValues.shift();
          }
        }
      }
      this.lastFrameTime = now;

      // Pass frame to callback immediately
      this.callbacks.onFrame(data, receiveTime);
    } finally {
      this.processingFrame = false;
    }
  }

  public disconnect(): void {
    this.intentionalDisconnect = true;
    this.cancelReconnectAttempts();
    this.cleanup();
    this.callbacks.onDisconnect();

    this.framesReceived = 0;
    this.fpsArray = [];
    this.latencyValues = [];
    this.totalBytes = 0;
    this.bytesLastSecond = 0;
  }

  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  private startStatsUpdate(): void {
    if (this.statsUpdateInterval) {
      clearInterval(this.statsUpdateInterval);
    }

    this.statsUpdateInterval = setInterval(() => {
      this.updateStats();
    }, 1000);
  }

  private updateStats(): void {
    // Optimized stats calculation
    const avgFps =
      this.fpsArray.length > 0
        ? this.fpsArray.reduce((sum, fps) => sum + fps, 0) /
          this.fpsArray.length
        : 0;

    const now = performance.now();
    const timeSinceLastReset = (now - this.lastBytesResetTime) / 1000;
    const dataRateKbps =
      timeSinceLastReset > 0
        ? this.bytesLastSecond / timeSinceLastReset / 1024
        : 0;

    this.bytesLastSecond = 0;
    this.lastBytesResetTime = now;

    const avgLatency =
      this.latencyValues.length > 0
        ? this.latencyValues.reduce((sum, val) => sum + val, 0) /
          this.latencyValues.length
        : 0;

    const avgFrameSize =
      this.framesReceived > 0 ? this.totalBytes / this.framesReceived : 0;

    // Add frames dropped info
    console.log(
      `Frames: ${this.framesReceived}, Dropped: ${
        this.framesDropped
      }, FPS: ${avgFps.toFixed(1)}`
    );

    this.callbacks.onStats({
      framesReceived: this.framesReceived,
      resolution: this.resolution,
      frameSize: avgFrameSize,
      dataRate: dataRateKbps,
      fps: avgFps,
      latency: avgLatency,
    });
  }

  private handleReconnect(): void {
    if (
      this.reconnectAttempts < this.maxReconnectAttempts &&
      !this.intentionalDisconnect
    ) {
      this.reconnectAttempts++;
      console.log(
        `Attempting to reconnect video stream (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
      );

      const backoffTime = Math.min(
        1000 * Math.pow(1.5, this.reconnectAttempts - 1),
        5000
      );

      const timeout = setTimeout(() => {
        const index = this.reconnectTimeouts.indexOf(timeout);
        if (index !== -1) {
          this.reconnectTimeouts.splice(index, 1);

          if (
            !this.isConnected() &&
            !this.connecting &&
            !this.intentionalDisconnect
          ) {
            this.connect().catch((error) => {
              console.error("Video stream reconnect failed:", error);
            });
          }
        }
      }, backoffTime);

      this.reconnectTimeouts.push(timeout);
    } else {
      console.log("Max video stream reconnect attempts reached");
      this.callbacks.onDisconnect();
    }
  }

  private cancelReconnectAttempts(): void {
    this.reconnectTimeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });
    this.reconnectTimeouts = [];
  }

  private cleanup(): void {
    console.log("Cleaning up video WebSocket resources...");

    if (this.statsUpdateInterval) {
      clearInterval(this.statsUpdateInterval);
      this.statsUpdateInterval = null;
    }

    if (this.socket) {
      try {
        const readyState = this.socket.readyState;

        this.socket.onopen = null;
        this.socket.onclose = null;
        this.socket.onerror = null;
        this.socket.onmessage = null;

        if (
          readyState === WebSocket.OPEN ||
          readyState === WebSocket.CONNECTING
        ) {
          this.socket.close(1000, "Normal closure");
        }
      } catch (error) {
        console.error("Error during WebSocket cleanup:", error);
      } finally {
        this.socket = null;
      }
    }

    // Reset processing states
    this.processingFrame = false;
    this.pendingFrames = 0;

    console.log("WebSocket cleanup completed");
  }

  public setResolution(width: number, height: number): void {
    this.resolution = `${width} × ${height}`;
  }

  public getUrl(): string {
    return this.url;
  }

  public updateUrl(newUrl: string): void {
    if (this.url !== newUrl) {
      console.log(`Updating video WebSocket URL from ${this.url} to ${newUrl}`);
      this.url = newUrl;

      if (this.isConnected()) {
        console.log("Disconnecting to apply new URL");
        this.disconnect();
      }
    }
  }
}

export default VideoWebSocketClient;
