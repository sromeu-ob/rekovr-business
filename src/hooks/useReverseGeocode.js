import { useCallback } from 'react';
import { useGeocodingProvider } from '../contexts/PublicConfigContext';
import { mapboxReverseGeocode } from '../lib/geocoding/mapbox';
import { googleReverseGeocode } from '../lib/geocoding/google';

const FALLBACK = (lat, lng) => `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

export function useReverseGeocode() {
  const provider = useGeocodingProvider();

  return useCallback(async (lat, lng, { language } = {}) => {
    try {
      if (provider === 'google') {
        return await googleReverseGeocode(lat, lng, { language });
      }
      return await mapboxReverseGeocode(lat, lng, { language });
    } catch (err) {
      console.warn('Reverse geocoding failed, using coordinates:', err);
      return FALLBACK(lat, lng);
    }
  }, [provider]);
}
