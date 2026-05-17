import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../../lib/geocoding/google';

export default function GoogleLocationSearch({ onSelect, placeholder, language, className }) {
  const inputRef = useRef(null);
  const sessionTokenRef = useRef(null);
  const autocompleteServiceRef = useRef(null);
  const placesServiceRef = useRef(null);
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((google) => {
        if (cancelled) return;
        autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
        const sink = document.createElement('div');
        placesServiceRef.current = new google.maps.places.PlacesService(sink);
        sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
        setReady(true);
      })
      .catch((err) => console.error('Google Maps load failed', err));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready || !query || query.length < 2) {
      setPredictions([]);
      return;
    }
    autocompleteServiceRef.current.getPlacePredictions(
      {
        input: query,
        sessionToken: sessionTokenRef.current,
        language: language || undefined,
      },
      (results, status) => {
        if (status === 'OK' && results) {
          setPredictions(results);
          setOpen(true);
        } else {
          setPredictions([]);
        }
      },
    );
  }, [query, ready, language]);

  const handleSelect = (prediction) => {
    setQuery(prediction.description);
    setOpen(false);
    placesServiceRef.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['geometry', 'formatted_address'],
        sessionToken: sessionTokenRef.current,
      },
      (place, status) => {
        loadGoogleMaps().then((google) => {
          sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
        });
        if (status === 'OK' && place?.geometry?.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          onSelect?.({
            latitude: lat,
            longitude: lng,
            address: place.formatted_address || prediction.description,
          });
        }
      },
    );
  };

  return (
    <div className={`relative ${className || ''}`} data-testid="google-location-search">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => predictions.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder || 'Search for an address...'}
        className="w-full px-3 py-2 rounded-md border border-stone-300 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
      />
      {open && predictions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-white border border-stone-200 rounded-md shadow-lg max-h-64 overflow-auto">
          {predictions.map((p) => (
            <li
              key={p.place_id}
              onMouseDown={() => handleSelect(p)}
              className="px-3 py-2 text-sm hover:bg-stone-100 cursor-pointer"
            >
              <div className="font-medium text-stone-900">{p.structured_formatting?.main_text || p.description}</div>
              {p.structured_formatting?.secondary_text && (
                <div className="text-xs text-stone-500">{p.structured_formatting.secondary_text}</div>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="text-[10px] text-stone-400 mt-1 text-right pr-1">Powered by Google</div>
    </div>
  );
}
