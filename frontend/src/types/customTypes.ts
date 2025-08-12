// src/types.ts

export interface Zone {
    id: string;
    name: string;
  }
  
  export interface Sensor {
    id: string;
    name: string;
  }
  
  export interface ProfileData {
    firstName: string;
    lastName: string;
    email: string;
    currentOrg: {
      name: string;
    };
  }
  
  export interface Device {
    id: string;
    name: string;
    ipAddress: string;
    macAddress: string;
    team?: {
      name: string;
    };
    sensors: Sensor[];
  }
  
  export interface Area {
    id: string;
    name: string;
    zones: Zone[];
  }
  
  export interface Team {
    id: string;
    name: string;
  }
  
  export interface Alert {
    id: number;
    view: number;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    cameraId: string;
    motionType: string | null;
    mediaPath: string | null;
    mediaType: string | null;
    nodeId: string | null;
    deviceId: string | null;
    s3_key: string | null;
    sessionId: string | null;
    orgId: string | null;
    mediaUrl: string | null;
  }
  
  export interface Pagination {
    total: number;
    page: number;
    limit: number;
  }
  
  export interface AlertResponse {
    data: Alert[];
    pagination: Pagination;
  }
  
  export interface Camera {
    id: number;
    mac: string;
    name: string;
    is_virtual: boolean;
    host: string;
    port: number;
    username: string;
    password: string;
    customParameters: any;
    isActive: boolean;
    network_id: string;
    workerId: string;
    streamInputPath: string;
    streamKey: string;
    authToken: string;
    detectionEnabled: boolean;
    zoneId: number;
    onvifPort: number | null;
    stream_links: {
      local?: {
        rtmp: string;
        hls: string;
        rtsp: string;
      };
      cloud?: {
        rtmp: string;
        hls: string;
        rtsp: string;
      };
    };
  }
  
  export interface EnhancedCamera extends Camera {
    status: string;
    localHls?: string;
    cloudHls?: string;
  }
  // File: src/types/customTypes.ts

// ... existing Alert types ...

// Camera interface
export interface Camera {
  id: number;
  mac: string;
  name: string;
  is_virtual: boolean;
  host: string;
  port: number;
  username: string;
  password: string;
  customParameters: any;
  isActive: boolean;
  network_id: string;
  workerId: string;
  streamInputPath: string;
  streamKey: string;
  authToken: string;
  detectionEnabled: boolean;
  zoneId: number;
  onvifPort: number | null;
  stream_links: {
    local?: {
      rtmp: string;
      hls: string;
      rtsp: string;
    };
    cloud?: {
      rtmp: string;
      hls: string;
      rtsp: string;
    };
  };
}

// Enhanced camera with UI-specific properties
export interface EnhancedCamera extends Camera {
  status: string;
 }

// Camera pagination interface
export interface CameraPagination {
  total: number;
  page: number;
  limit: number;
}

// Camera response interface
export interface CameraResponse {
  data: Camera[];
  pagination: CameraPagination;
}