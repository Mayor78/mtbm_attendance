import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, queryKeys } from '../lib/api';

// Cache location in memory (can be replaced with TanStack Query's cache)
const locationCache = {
  data: null,
  timestamp: null,
  promise: null
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// API functions for location
const locationApi = {
  getAddressFromCoords: async ({ lat, lng }) => {
    try {
      const response = await fetch(
        `https://tywhkdmlhjiluslmxdjt.supabase.co/functions/v1/geocode?lat=${lat}&lng=${lng}`
      );
      if (response.ok) {
        const data = await response.json();
        return data.address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
    } catch (err) {
      console.warn('Geocoding failed:', err);
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  },

  getIpLocation: async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (!data.latitude || !data.longitude) {
        throw new Error('Invalid IP location data');
      }

      const location = {
        lat: data.latitude,
        lng: data.longitude,
        accuracy: 5000,
        city: data.city,
        region: data.region,
        country: data.country_name,
        method: 'ip',
        source: 'ip',
        timestamp: new Date().toISOString()
      };

      try {
        const address = await locationApi.getAddressFromCoords(location);
        location.address = address;
      } catch (e) {
        // Ignore address errors for IP
      }
      
      return location;
    } catch (error) {
      console.error('IP location error:', error);
      throw new Error('Could not get location from IP');
    }
  },

  getGpsLocation: () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      };

      let attempts = 0;
      const maxAttempts = 3;
      let bestGpsLocation = null;
      
      const tryGetPosition = () => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              source: 'gps',
              method: 'gps',
              timestamp: new Date().toISOString()
            };

            attempts++;

            if (!bestGpsLocation || location.accuracy < bestGpsLocation.accuracy) {
              bestGpsLocation = location;
            }

            if (location.accuracy < 50) {
              console.log(`✅ Good GPS accuracy: ${location.accuracy}m`);
              
              try {
                const address = await locationApi.getAddressFromCoords(location);
                location.address = address;
              } catch (e) {}

              resolve(location);
              return;
            }

            if (attempts >= maxAttempts) {
              if (bestGpsLocation) {
                console.log(`📊 Using best GPS reading: ${bestGpsLocation.accuracy}m`);
                
                try {
                  const address = await locationApi.getAddressFromCoords(bestGpsLocation);
                  bestGpsLocation.address = address;
                } catch (e) {}
                
                if (bestGpsLocation.accuracy > 100) {
                  bestGpsLocation.warning = 'GPS accuracy is low. Please ensure you have a clear view of the sky.';
                }
                
                resolve(bestGpsLocation);
              } else {
                reject(new Error('No valid GPS readings'));
              }
              return;
            }

            setTimeout(tryGetPosition, 1000);
          },
          (err) => {
            console.warn('GPS attempt failed:', err);
            attempts++;
            
            if (attempts < maxAttempts) {
              setTimeout(tryGetPosition, 1000);
            } else {
              reject(err);
            }
          },
          options
        );
      };

      tryGetPosition();
    });
  },

  getLocation: async () => {
    try {
      // Try GPS first
      return await locationApi.getGpsLocation();
    } catch (gpsError) {
      console.warn('GPS failed, falling back to IP:', gpsError);
      // Fall back to IP location
      const ipLoc = await locationApi.getIpLocation();
      return {
        ...ipLoc,
        warning: 'GPS unavailable - using IP location (may be inaccurate)'
      };
    }
  }
};

export const useLocation = () => {
  const queryClient = useQueryClient();
  const [locationStatus, setLocationStatus] = useState('idle'); // idle, loading, success, error
  const isMounted = useRef(true);

  // Use TanStack Query for location data
  const locationQuery = useQuery({
    queryKey: ['currentLocation'],
    queryFn: locationApi.getLocation,
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION * 2,
    retry: 2,
    retryDelay: 1000,
    enabled: false, // Don't fetch automatically
  });

  // Get address for specific coordinates
  const useAddress = (lat, lng) => {
    return useQuery({
      queryKey: queryKeys.geocode(lat, lng),
      queryFn: () => locationApi.getAddressFromCoords({ lat, lng }),
      enabled: !!lat && !!lng,
      staleTime: Infinity,
      gcTime: 24 * 60 * 60 * 1000,
    });
  };

  useEffect(() => {
    isMounted.current = true;
    
    // Preload location
    preloadLocation();
    
    // Refresh location periodically
    const interval = setInterval(() => {
      if (isMounted.current && locationQuery.data) {
        const age = Date.now() - new Date(locationQuery.data.timestamp).getTime();
        if (age > CACHE_DURATION - 30000) {
          console.log('📍 Refreshing location cache');
          refreshLocation();
        }
      }
    }, 30000);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, []);

  // Update status based on query state
  useEffect(() => {
    if (locationQuery.isLoading) {
      setLocationStatus('loading');
    } else if (locationQuery.isError) {
      setLocationStatus('error');
    } else if (locationQuery.isSuccess) {
      setLocationStatus('success');
    }
  }, [locationQuery.isLoading, locationQuery.isError, locationQuery.isSuccess]);

  const getCurrentLocation = useCallback(async () => {
    return await locationQuery.refetch();
  }, [locationQuery]);

  const preloadLocation = useCallback(() => {
    if (!locationQuery.data) {
      locationQuery.refetch();
    }
  }, [locationQuery]);

  const refreshLocation = useCallback(() => {
    // Invalidate the query to force a refetch
    queryClient.invalidateQueries({ queryKey: ['currentLocation'] });
    return locationQuery.refetch();
  }, [queryClient, locationQuery]);

  const getAddressForLocation = useCallback(async (location) => {
    return await locationApi.getAddressFromCoords(location);
  }, []);

  const getIpLocation = useCallback(async () => {
    return await locationApi.getIpLocation();
  }, []);

  return {
    // Main functions
    getCurrentLocation,
    getAddressForLocation,
    getIpLocation,
    
    // Query state
    isLoading: locationQuery.isLoading,
    isError: locationQuery.isError,
    error: locationQuery.error,
    data: locationQuery.data,
    
    // Enhanced state
    cachedLocation: locationQuery.data,
    locationStatus,
    
    // Actions
    preloadLocation,
    refreshLocation,
    
    // Helpers
    isCached: !!locationQuery.data,
    useAddress, // Hook for getting address for specific coordinates
  };
};