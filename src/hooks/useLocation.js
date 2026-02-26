import { useState } from 'react';

export const useLocation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAddressForLocation = async (location) => {
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
  };

  const getIpLocation = async () => {
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
  };

  const getCurrentLocation = () => {
    setIsLoading(true);
    setError(null);
    
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        console.warn('No GPS available, using IP location (may be inaccurate)');
        getIpLocation()
          .then(ipLoc => {
            resolve({
              ...ipLoc,
              warning: 'Using IP location - accuracy may be low'
            });
          })
          .catch(reject)
          .finally(() => setIsLoading(false));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      };

      const readings = [];
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
              timestamp: new Date().toISOString()
            };

            readings.push(location);
            attempts++;

            if (!bestGpsLocation || location.accuracy < bestGpsLocation.accuracy) {
              bestGpsLocation = location;
            }

            if (location.accuracy < 50) {
              console.log(`✅ Good GPS accuracy: ${location.accuracy}m`);
              
              getAddressForLocation(location).then(addr => {
                location.address = addr;
              }).catch(() => {});

              setIsLoading(false);
              resolve(location);
              return;
            }

            if (attempts >= maxAttempts) {
              if (bestGpsLocation) {
                console.log(`📊 Using best GPS reading: ${bestGpsLocation.accuracy}m`);
                
                try {
                  const address = await getAddressForLocation(bestGpsLocation);
                  bestGpsLocation.address = address;
                } catch (e) {
                  // Ignore address errors
                }
                
                if (bestGpsLocation.accuracy > 100) {
                  bestGpsLocation.warning = 'GPS accuracy is low. Please ensure you have a clear view of the sky.';
                }
                
                setIsLoading(false);
                resolve(bestGpsLocation);
              } else {
                console.warn('⚠️ No valid GPS readings, using IP fallback');
                const ipLoc = await getIpLocation();
                setIsLoading(false);
                resolve({
                  ...ipLoc,
                  warning: 'Using IP location - this may be inaccurate. Please enable GPS for better accuracy.'
                });
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
                  resolve({
                    ...ipLoc,
                    warning: 'GPS unavailable - using IP location (may be inaccurate)'
                  });
                })
                .catch(reject)
                .finally(() => setIsLoading(false));
            }
          },
          options
        );
      };

      tryGetPosition();
    });
  };

  return {
    getCurrentLocation,
    getAddressForLocation,
    isLoading,
    error
  };
};