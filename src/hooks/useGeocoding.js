import { useQueries } from '@tanstack/react-query';
import { api, queryKeys } from '../lib/api';

// Cache for geocoded addresses to avoid duplicate requests
const geocodeCache = new Map();

export const useGeocoding = (records) => {
  // Filter records that need geocoding and aren't in cache
  const recordsToGeocode = (records || [])
    .filter(record => {
      if (!record?.location_lat || !record?.location_lng) return false;
      const cacheKey = `${record.location_lat},${record.location_lng}`;
      return !geocodeCache.has(cacheKey);
    })
    .slice(0, 5); // Limit concurrent requests to avoid rate limiting

  // Use TanStack Query's useQueries for multiple requests
  const geocodeQueries = useQueries({
    queries: recordsToGeocode.map(record => ({
      queryKey: queryKeys.geocode(record.location_lat, record.location_lng),
      queryFn: () => api.geocodeLocation({
        lat: record.location_lat,
        lng: record.location_lng
      }),
      enabled: !!record.location_lat && !!record.location_lng,
      staleTime: Infinity, // Never refetch geocoded addresses
      gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours
      retry: 2,
      retryDelay: 1000,
      onSuccess: (address) => {
        // Store in cache when successful
        const cacheKey = `${record.location_lat},${record.location_lng}`;
        geocodeCache.set(cacheKey, address);
      },
    })),
  });

  // Build locations object from cache and query results
  const locations = {};

  // First, add all cached locations
  records?.forEach(record => {
    if (record?.location_lat && record?.location_lng) {
      const cacheKey = `${record.location_lat},${record.location_lng}`;
      if (geocodeCache.has(cacheKey)) {
        locations[record.id] = geocodeCache.get(cacheKey);
      }
    }
  });

  // Then add newly fetched locations from queries
  geocodeQueries.forEach((query, index) => {
    if (query.data) {
      const record = recordsToGeocode[index];
      locations[record.id] = query.data;
    }
  });

  const isLoading = geocodeQueries.some(q => q.isLoading);
  const isError = geocodeQueries.some(q => q.isError);
  const errors = geocodeQueries.filter(q => q.error).map(q => q.error);

  return {
    locations,
    isLoading,
    isError,
    errors,
    // Progress info
    total: recordsToGeocode.length,
    completed: geocodeQueries.filter(q => q.isSuccess).length,
  };
};