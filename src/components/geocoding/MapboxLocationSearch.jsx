import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

export default function MapboxLocationSearch({ onSelect, placeholder, language, className }) {
  const containerRef = useRef(null);
  const geocoderRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || geocoderRef.current) return;

    const geocoder = new MapboxGeocoder({
      accessToken: import.meta.env.VITE_MAPBOX_TOKEN,
      mapboxgl,
      marker: false,
      placeholder: placeholder || 'Search for an address...',
      language: language || undefined,
    });
    geocoder.addTo(containerRef.current);
    geocoderRef.current = geocoder;

    geocoder.on('result', (e) => {
      const [lng, lat] = e.result.center;
      onSelect?.({
        latitude: lat,
        longitude: lng,
        address: e.result.place_name,
      });
    });

    return () => {
      try { geocoder.onRemove(); } catch (_) { /* ignore */ }
      geocoderRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={containerRef} className={className} data-testid="mapbox-location-search" />;
}
