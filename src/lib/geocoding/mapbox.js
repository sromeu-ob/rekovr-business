const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export async function mapboxReverseGeocode(lat, lng, { language = 'en' } = {}) {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`
    + `?access_token=${MAPBOX_TOKEN}&language=${language}&limit=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Mapbox reverse geocoding failed: ${res.status}`);
  const data = await res.json();
  return data?.features?.[0]?.place_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}
