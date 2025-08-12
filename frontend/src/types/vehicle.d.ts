// types/vehicle.ts
export interface Location {
    lat: number; 
    lng: number; 
  }
  
  export interface Ride {
    start: Date;             
    end?: Date | null;      
    totalTravelTime: number; 
  }
  
  export interface Sensor {
    id: number;              
    name: string;            
  }
  
  export interface Vehicle {
    id: number;                
    make: string;              
    model: string;             
    chassisNumber: string;     
    licensePlate: string;      
    destination?: Location;    
    currentLocation: Location; 
    startLocation: Location;   
    startTime: Date;           
    rides: Ride[];            
    status: string;            
    sensors: Sensor[];
    wheels: number; // Add this line to include sensors
  } 
  