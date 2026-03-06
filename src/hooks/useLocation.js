import { useState, useEffect, useCallback, useRef } from 'react';

// Cache location in memory
const locationCache = {
  data: null,
  timestamp: null,
  promise: null
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useLocation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cachedLocation, setCachedLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle'); // idle, loading, success, error
  const isMounted = useRef(true);

  // Get address from coordinates using geocoding service
  const getAddressForLocation = useCallback(async (location) => {
    try {
      const response = await fetch(
        `https://tywhkdmlhjiluslmxdjt.supabase.co/functions/v1/geocode?lat=${location.lat}&lng=${location.lng}`
      );
      if (response.ok) {
        const data = await response.json();
        return data.address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
      }
    } catch (err) {
      console.warn('Geocoding failed:', err);
    }
    return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
  }, []);

  // Get location from IP address as fallback
  const getIpLocation = useCallback(async () => {
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
        const address = await getAddressForLocation(location);
        location.address = address;
      } catch (e) {
        // Ignore address errors for IP
      }
      
      return location;
    } catch (error) {
      console.error('IP location error:', error);
      throw new Error('Could not get location from IP');
    }
  }, [getAddressForLocation]);

  // Preload location on hook initialization
  useEffect(() => {
    isMounted.current = true;
    
    // Pre-fetch location when hook is first used
    preloadLocation();
    
    // Refresh location periodically
    const interval = setInterval(() => {
      if (isMounted.current) {
        // Only refresh if cache is about to expire
        if (locationCache.timestamp && (Date.now() - locationCache.timestamp) > (CACHE_DURATION - 30000)) {
          console.log('📍 Refreshing location cache');
          preloadLocation();
        }
      }
    }, 30000);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, []);

  // Main function to get current location
  const getCurrentLocation = useCallback(() => {
    // Check cache first
    if (locationCache.data && locationCache.timestamp) {
      const age = Date.now() - locationCache.timestamp;
      if (age < CACHE_DURATION) {
        console.log(`📍 Using cached location (${Math.round(age / 1000)}s old)`);
        return Promise.resolve({
          ...locationCache.data,
          fromCache: true,
          cacheAge: age
        });
      }
    }

    // If already fetching, return existing promise
    if (locationCache.promise) {
      console.log('📍 Location fetch already in progress');
      return locationCache.promise;
    }

    setIsLoading(true);
    setError(null);
    setLocationStatus('loading');
    
    const fetchLocation = () => {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          console.warn('No GPS available, using IP location (may be inaccurate)');
          getIpLocation()
            .then(ipLoc => {
              const result = {
                ...ipLoc,
                warning: 'Using IP location - accuracy may be low'
              };
              
              // Cache the result
              locationCache.data = result;
              locationCache.timestamp = Date.now();
              locationCache.promise = null;
              
              if (isMounted.current) {
                setCachedLocation(result);
                setLocationStatus('success');
                setIsLoading(false);
              }
              resolve(result);
            })
            .catch(reject);
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
                  const address = await getAddressForLocation(location);
                  location.address = address;
                } catch (e) {}

                // Cache the result
                locationCache.data = location;
                locationCache.timestamp = Date.now();
                locationCache.promise = null;

                if (isMounted.current) {
                  setCachedLocation(location);
                  setLocationStatus('success');
                  setIsLoading(false);
                }
                resolve(location);
                return;
              }

              if (attempts >= maxAttempts) {
                if (bestGpsLocation) {
                  console.log(`📊 Using best GPS reading: ${bestGpsLocation.accuracy}m`);
                  
                  try {
                    const address = await getAddressForLocation(bestGpsLocation);
                    bestGpsLocation.address = address;
                  } catch (e) {}
                  
                  if (bestGpsLocation.accuracy > 100) {
                    bestGpsLocation.warning = 'GPS accuracy is low. Please ensure you have a clear view of the sky.';
                  }
                  
                  // Cache the result
                  locationCache.data = bestGpsLocation;
                  locationCache.timestamp = Date.now();
                  locationCache.promise = null;

                  if (isMounted.current) {
                    setCachedLocation(bestGpsLocation);
                    setLocationStatus('success');
                    setIsLoading(false);
                  }
                  resolve(bestGpsLocation);
                } else {
                  console.warn('⚠️ No valid GPS readings, using IP fallback');
                  getIpLocation()
                    .then(ipLoc => {
                      const result = {
                        ...ipLoc,
                        warning: 'Using IP location - this may be inaccurate. Please enable GPS for better accuracy.'
                      };
                      
                      locationCache.data = result;
                      locationCache.timestamp = Date.now();
                      locationCache.promise = null;

                      if (isMounted.current) {
                        setCachedLocation(result);
                        setLocationStatus('success');
                        setIsLoading(false);
                      }
                      resolve(result);
                    })
                    .catch(reject);
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
                console.warn('⚠️ All GPS attempts failed, using IP fallback');
                getIpLocation()
                  .then(ipLoc => {
                    const result = {
                      ...ipLoc,
                      warning: 'GPS unavailable - using IP location (may be inaccurate)'
                    };
                    
                    locationCache.data = result;
                    locationCache.timestamp = Date.now();
                    locationCache.promise = null;

                    if (isMounted.current) {
                      setCachedLocation(result);
                      setLocationStatus('success');
                      setIsLoading(false);
                    }
                    resolve(result);
                  })
                  .catch(reject);
              }
            },
            options
          );
        };

        tryGetPosition();
      });
    };

    locationCache.promise = fetchLocation();
    return locationCache.promise;
  }, [getIpLocation, getAddressForLocation]);

  // Preload location function
  const preloadLocation = useCallback(() => {
    // Only preload if not already cached or cache expired
    if (!locationCache.data || !locationCache.timestamp || 
        (Date.now() - locationCache.timestamp) > CACHE_DURATION) {
      console.log('📍 Preloading location');
      getCurrentLocation().catch(() => {});
    }
  }, [getCurrentLocation]);

  // Get cached location synchronously
  const getCachedLocation = useCallback(() => {
    return cachedLocation || locationCache.data;
  }, [cachedLocation]);

  // Force refresh location
  const refreshLocation = useCallback(() => {
    // Force refresh by invalidating cache
    locationCache.timestamp = 0;
    locationCache.promise = null;
    return getCurrentLocation();
  }, [getCurrentLocation]);

  // Get location status info
  const getLocationStatus = useCallback(() => {
    if (locationCache.data && locationCache.timestamp) {
      const age = Date.now() - locationCache.timestamp;
      return {
        available: true,
        cached: age < CACHE_DURATION,
        age,
        method: locationCache.data.method,
        accuracy: locationCache.data.accuracy
      };
    }
    return { available: false };
  }, []);

  return {
    getCurrentLocation,
    getAddressForLocation,
    isLoading,
    error,
    cachedLocation: getCachedLocation(),
    locationStatus,
    preloadLocation,
    refreshLocation,
    getLocationStatus,
    isCached: !!(locationCache.data && locationCache.timestamp && 
                 (Date.now() - locationCache.timestamp) < CACHE_DURATION)
  };
};