// src/utils/mapUtils.ts
import { Location } from "../services/cameraService";

/**
 * Google Maps integration utilities
 */
export class MapUtils {
  private static apiKey: string | null = null;

  /**
   * Initialize with Google Maps API key
   * @param apiKey Google Maps API key
   */
  static initialize(apiKey: string) {
    MapUtils.apiKey = apiKey;
  }

  /**
   * Geocode an address to get coordinates
   * @param address Address to geocode
   * @returns Promise with location coordinates
   */
  static async geocodeAddress(address: string): Promise<Location | null> {
    if (!MapUtils.apiKey) {
      throw new Error("Google Maps API key not initialized");
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address
        )}&key=${MapUtils.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          latitude: location.lat,
          longitude: location.lng,
        };
      }

      return null;
    } catch (error) {
      console.error("Geocoding error:", error);
      throw error;
    }
  }

  /**
   * Reverse geocode coordinates to get address
   * @param location Location coordinates
   * @returns Promise with formatted address
   */
  static async reverseGeocode(location: Location): Promise<string | null> {
    if (!MapUtils.apiKey) {
      throw new Error("Google Maps API key not initialized");
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.latitude},${location.longitude}&key=${MapUtils.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Reverse geocoding failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        return data.results[0].formatted_address;
      }

      return null;
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      throw error;
    }
  }

  /**
   * Get current user location using browser geolocation
   * @returns Promise with current location
   */
  static getCurrentLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          let message = "Unable to get location";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = "Location access denied by user";
              break;
            case error.POSITION_UNAVAILABLE:
              message = "Location information unavailable";
              break;
            case error.TIMEOUT:
              message = "Location request timed out";
              break;
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }

  /**
   * Calculate distance between two locations (Haversine formula)
   * @param loc1 First location
   * @param loc2 Second location
   * @returns Distance in kilometers
   */
  static calculateDistance(loc1: Location, loc2: Location): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
    const dLon = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((loc1.latitude * Math.PI) / 180) *
        Math.cos((loc2.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Format coordinates for display
   * @param location Location to format
   * @param precision Number of decimal places
   * @returns Formatted coordinate string
   */
  static formatCoordinates(location: Location, precision: number = 6): string {
    return `${location.latitude.toFixed(
      precision
    )}, ${location.longitude.toFixed(precision)}`;
  }

  /**
   * Check if location is within Pakistan boundaries (approximate)
   * @param location Location to check
   * @returns True if location is in Pakistan
   */
  static isLocationInPakistan(location: Location): boolean {
    // Approximate boundaries of Pakistan
    const bounds = {
      north: 37.1,
      south: 23.5,
      east: 77.8,
      west: 60.9,
    };

    return (
      location.latitude >= bounds.south &&
      location.latitude <= bounds.north &&
      location.longitude >= bounds.west &&
      location.longitude <= bounds.east
    );
  }

  /**
   * Get default location for Pakistan (Islamabad)
   * @returns Default location coordinates
   */
  static getDefaultPakistanLocation(): Location {
    return {
      latitude: 33.6844,
      longitude: 73.0479,
    };
  }

  /**
   * Generate a static map URL for a location
   * @param location Location to show
   * @param zoom Zoom level (1-20)
   * @param size Image size (e.g., "400x400")
   * @returns Google Static Maps API URL
   */
  static getStaticMapUrl(
    location: Location,
    zoom: number = 15,
    size: string = "400x400"
  ): string {
    if (!MapUtils.apiKey) {
      throw new Error("Google Maps API key not initialized");
    }

    const baseUrl = "https://maps.googleapis.com/maps/api/staticmap";
    const params = new URLSearchParams({
      center: `${location.latitude},${location.longitude}`,
      zoom: zoom.toString(),
      size: size,
      markers: `color:red|${location.latitude},${location.longitude}`,
      key: MapUtils.apiKey,
    });

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Open location in Google Maps (web or app)
   * @param location Location to open
   * @param label Optional label for the location
   */
  static openInGoogleMaps(location: Location, label?: string): void {
    const query = label
      ? encodeURIComponent(label)
      : `${location.latitude},${location.longitude}`;
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(url, "_blank");
  }

  /**
   * Get directions URL to a location
   * @param destination Destination location
   * @param origin Optional origin location (defaults to current location)
   * @returns Google Maps directions URL
   */
  static getDirectionsUrl(destination: Location, origin?: Location): string {
    const baseUrl = "https://www.google.com/maps/dir/";
    const originStr = origin
      ? `${origin.latitude},${origin.longitude}`
      : "My+Location";
    const destStr = `${destination.latitude},${destination.longitude}`;
    return `${baseUrl}${originStr}/${destStr}`;
  }

  /**
   * Validate location coordinates
   * @param location Location to validate
   * @returns True if coordinates are valid
   */
  static isValidLocation(location: Location): boolean {
    return (
      location.latitude >= -90 &&
      location.latitude <= 90 &&
      location.longitude >= -180 &&
      location.longitude <= 180
    );
  }

  /**
   * Generate a bounds object for multiple locations
   * @param locations Array of locations
   * @returns Bounds object with northeast and southwest corners
   */
  static getBoundsForLocations(locations: Location[]): {
    northeast: Location;
    southwest: Location;
  } | null {
    if (locations.length === 0) return null;

    let minLat = locations[0].latitude;
    let maxLat = locations[0].latitude;
    let minLng = locations[0].longitude;
    let maxLng = locations[0].longitude;

    locations.forEach((loc) => {
      minLat = Math.min(minLat, loc.latitude);
      maxLat = Math.max(maxLat, loc.latitude);
      minLng = Math.min(minLng, loc.longitude);
      maxLng = Math.max(maxLng, loc.longitude);
    });

    return {
      northeast: { latitude: maxLat, longitude: maxLng },
      southwest: { latitude: minLat, longitude: minLng },
    };
  }

  /**
   * Convert location to What3Words (requires What3Words API)
   * @param location Location to convert
   * @param w3wApiKey What3Words API key
   * @returns Promise with What3Words address
   */
  static async getWhat3WordsAddress(
    location: Location,
    w3wApiKey: string
  ): Promise<string | null> {
    try {
      const response = await fetch(
        `https://api.what3words.com/v3/convert-to-3wa?coordinates=${location.latitude},${location.longitude}&key=${w3wApiKey}&format=json`
      );

      if (!response.ok) {
        throw new Error(`What3Words API failed: ${response.status}`);
      }

      const data = await response.json();
      return data.words || null;
    } catch (error) {
      console.error("What3Words conversion error:", error);
      return null;
    }
  }
}

/**
 * Location validation and formatting utilities
 */
export class LocationValidator {
  /**
   * Validate latitude value
   * @param lat Latitude value
   * @returns True if valid
   */
  static isValidLatitude(lat: number): boolean {
    return typeof lat === "number" && lat >= -90 && lat <= 90;
  }

  /**
   * Validate longitude value
   * @param lng Longitude value
   * @returns True if valid
   */
  static isValidLongitude(lng: number): boolean {
    return typeof lng === "number" && lng >= -180 && lng <= 180;
  }

  /**
   * Parse coordinate string to location object
   * @param coordinateStr Coordinate string (e.g., "33.6844, 73.0479")
   * @returns Location object or null if invalid
   */
  static parseCoordinateString(coordinateStr: string): Location | null {
    try {
      const parts = coordinateStr.split(",").map((s) => s.trim());
      if (parts.length !== 2) return null;

      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);

      if (isNaN(lat) || isNaN(lng)) return null;
      if (
        !LocationValidator.isValidLatitude(lat) ||
        !LocationValidator.isValidLongitude(lng)
      )
        return null;

      return { latitude: lat, longitude: lng };
    } catch {
      return null;
    }
  }

  /**
   * Format location for different coordinate systems
   * @param location Location to format
   * @param format Format type ('decimal', 'dms', 'utm')
   * @returns Formatted coordinate string
   */
  static formatLocation(
    location: Location,
    format: "decimal" | "dms" | "utm" = "decimal"
  ): string {
    switch (format) {
      case "decimal":
        return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(
          6
        )}`;

      case "dms":
        return `${LocationValidator.toDMS(
          location.latitude,
          true
        )}, ${LocationValidator.toDMS(location.longitude, false)}`;

      case "utm":
        // This is a simplified UTM representation
        return `UTM: ${Math.round(location.latitude * 111000)}, ${Math.round(
          location.longitude * 111000
        )}`;

      default:
        return LocationValidator.formatLocation(location, "decimal");
    }
  }

  /**
   * Convert decimal degrees to degrees, minutes, seconds
   * @param dd Decimal degrees
   * @param isLatitude True for latitude, false for longitude
   * @returns DMS string
   */
  private static toDMS(dd: number, isLatitude: boolean): string {
    const absolute = Math.abs(dd);
    const degrees = Math.floor(absolute);
    const minutes = Math.floor((absolute - degrees) * 60);
    const seconds =
      Math.round(((absolute - degrees) * 60 - minutes) * 60 * 100) / 100;

    const direction = isLatitude ? (dd >= 0 ? "N" : "S") : dd >= 0 ? "E" : "W";

    return `${degrees}°${minutes}'${seconds}"${direction}`;
  }
}

/**
 * Map clustering utilities for handling multiple camera locations
 */
export class MapClustering {
  /**
   * Group nearby locations into clusters
   * @param locations Array of locations with IDs
   * @param maxDistance Maximum distance in km for clustering
   * @returns Array of clusters
   */
  static clusterLocations(
    locations: Array<Location & { id: string }>,
    maxDistance: number = 1
  ): Array<{
    center: Location;
    locations: Array<Location & { id: string }>;
    count: number;
  }> {
    const clusters: Array<{
      center: Location;
      locations: Array<Location & { id: string }>;
      count: number;
    }> = [];

    const processed = new Set<string>();

    locations.forEach((location) => {
      if (processed.has(location.id)) return;

      const cluster = {
        center: location,
        locations: [location],
        count: 1,
      };

      // Find nearby locations
      locations.forEach((otherLocation) => {
        if (location.id === otherLocation.id || processed.has(otherLocation.id))
          return;

        const distance = MapUtils.calculateDistance(location, otherLocation);
        if (distance <= maxDistance) {
          cluster.locations.push(otherLocation);
          cluster.count++;
          processed.add(otherLocation.id);
        }
      });

      // Calculate cluster center
      if (cluster.count > 1) {
        const avgLat =
          cluster.locations.reduce((sum, loc) => sum + loc.latitude, 0) /
          cluster.count;
        const avgLng =
          cluster.locations.reduce((sum, loc) => sum + loc.longitude, 0) /
          cluster.count;
        cluster.center = { latitude: avgLat, longitude: avgLng };
      }

      clusters.push(cluster);
      processed.add(location.id);
    });

    return clusters;
  }

  /**
   * Get optimal zoom level for displaying all locations
   * @param locations Array of locations
   * @param mapWidth Map width in pixels
   * @param mapHeight Map height in pixels
   * @returns Optimal zoom level (1-20)
   */
  static getOptimalZoom(
    locations: Location[],
    mapWidth: number,
    mapHeight: number
  ): number {
    if (locations.length === 0) return 10;
    if (locations.length === 1) return 15;

    const bounds = MapUtils.getBoundsForLocations(locations);
    if (!bounds) return 10;

    const latDiff = bounds.northeast.latitude - bounds.southwest.latitude;
    const lngDiff = bounds.northeast.longitude - bounds.southwest.longitude;

    // Calculate zoom based on the larger difference
    const maxDiff = Math.max(latDiff, lngDiff);

    // Rough zoom calculation (adjust as needed)
    if (maxDiff > 10) return 5;
    if (maxDiff > 5) return 7;
    if (maxDiff > 2) return 9;
    if (maxDiff > 1) return 11;
    if (maxDiff > 0.5) return 13;
    if (maxDiff > 0.1) return 15;
    return 17;
  }
}

/**
 * Example usage and integration guide
 */
export const MapIntegrationExample = {
  /**
   * Example: Initialize map utils
   */
  initialize: () => {
    // Initialize with your Google Maps API key
    MapUtils.initialize("YOUR_GOOGLE_MAPS_API_KEY");
  },

  /**
   * Example: Get user location and set as camera location
   */
  getCurrentLocationExample: async () => {
    try {
      const location = await MapUtils.getCurrentLocation();
      console.log("Current location:", MapUtils.formatCoordinates(location));
      return location;
    } catch (error) {
      console.error("Location error:", error);
      return MapUtils.getDefaultPakistanLocation();
    }
  },

  /**
   * Example: Search for address and get coordinates
   */
  searchAddressExample: async (address: string) => {
    try {
      const location = await MapUtils.geocodeAddress(address);
      if (location) {
        console.log(
          `Address "${address}" found at:`,
          MapUtils.formatCoordinates(location)
        );
        return location;
      } else {
        console.log("Address not found");
        return null;
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  },

  /**
   * Example: Get address from coordinates
   */
  reverseGeocodeExample: async (location: Location) => {
    try {
      const address = await MapUtils.reverseGeocode(location);
      console.log("Address:", address);
      return address;
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return null;
    }
  },
};

// Export default configuration for Pakistan
export const PakistanMapConfig = {
  defaultCenter: MapUtils.getDefaultPakistanLocation(),
  defaultZoom: 12,
  bounds: {
    north: 37.1,
    south: 23.5,
    east: 77.8,
    west: 60.9,
  },
  majorCities: [
    { name: "Islamabad", location: { latitude: 33.6844, longitude: 73.0479 } },
    { name: "Karachi", location: { latitude: 24.8607, longitude: 67.0011 } },
    { name: "Lahore", location: { latitude: 31.5204, longitude: 74.3587 } },
    { name: "Faisalabad", location: { latitude: 31.4504, longitude: 73.135 } },
    { name: "Rawalpindi", location: { latitude: 33.5651, longitude: 73.0169 } },
    { name: "Gujranwala", location: { latitude: 32.1877, longitude: 74.1945 } },
    { name: "Peshawar", location: { latitude: 34.0151, longitude: 71.5249 } },
    { name: "Multan", location: { latitude: 30.1575, longitude: 71.5249 } },
    { name: "Hyderabad", location: { latitude: 25.396, longitude: 68.3578 } },
    { name: "Quetta", location: { latitude: 30.1798, longitude: 66.975 } },
  ],
};
