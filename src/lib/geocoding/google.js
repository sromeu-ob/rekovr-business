const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

let loaderPromise = null;

export function loadGoogleMaps() {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.google?.maps?.places) return Promise.resolve(window.google);
  if (loaderPromise) return loaderPromise;
  if (!GOOGLE_API_KEY) {
    return Promise.reject(new Error('VITE_GOOGLE_MAPS_API_KEY is not configured'));
  }

  loaderPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-google-maps-loader]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google));
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places&v=weekly`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMapsLoader = 'true';
    script.onload = () => resolve(window.google);
    script.onerror = (err) => {
      loaderPromise = null;
      reject(err);
    };
    document.head.appendChild(script);
  });

  return loaderPromise;
}

export async function googleReverseGeocode(lat, lng, { language = 'en' } = {}) {
  const google = await loadGoogleMaps();
  const geocoder = new google.maps.Geocoder();
  return new Promise((resolve, reject) => {
    geocoder.geocode(
      { location: { lat, lng }, language },
      (results, status) => {
        if (status === 'OK' && results?.[0]) {
          resolve(results[0].formatted_address);
        } else {
          reject(new Error(`Google reverse geocoding failed: ${status}`));
        }
      },
    );
  });
}
