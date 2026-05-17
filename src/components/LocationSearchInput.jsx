import React from 'react';
import { useGeocodingProvider } from '../contexts/PublicConfigContext';
import MapboxLocationSearch from './geocoding/MapboxLocationSearch';
import GoogleLocationSearch from './geocoding/GoogleLocationSearch';

export default function LocationSearchInput({ onSelect, placeholder, language, className }) {
  const provider = useGeocodingProvider();
  const Component = provider === 'google' ? GoogleLocationSearch : MapboxLocationSearch;
  return (
    <Component
      onSelect={onSelect}
      placeholder={placeholder}
      language={language}
      className={className}
    />
  );
}
