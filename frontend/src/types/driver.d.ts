export interface VideoSegment {
    point: { lat: number; lng: number; };
    url: string;
  }
  
  export interface Ride {
    start: Date;
    end?: Date;
    totalTravelTime: number;
  }
  
  export interface Route {
    start: { lat: number; lng: number; };
    end: { lat: number; lng: number; };
    path: { lat: number; lng: number; }[];
  }
  
  export interface Driver {
    id: number;
    name: string;
    status: string;
    location: { lat: number; lng: number; };
    startLocation?: { lat: number; lng: number; };
    destination?: { lat: number; lng: number; };
    carName: string;
    licensePlate: string;
    rides: Ride[];
    cameraStreamUrl: string;
    videoSegments?: VideoSegment[];
    route?: Route;
  }
  