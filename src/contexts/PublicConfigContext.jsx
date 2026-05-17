import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const DEFAULTS = {
  geocoding_provider: 'mapbox',
};

const PublicConfigContext = createContext(DEFAULTS);

export function PublicConfigProvider({ children }) {
  const [config, setConfig] = useState(DEFAULTS);

  useEffect(() => {
    let cancelled = false;
    api.get('/public/config')
      .then((res) => {
        if (!cancelled && res.data && typeof res.data === 'object') {
          setConfig({ ...DEFAULTS, ...res.data });
        }
      })
      .catch(() => {
        // Fail silently — keep defaults
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <PublicConfigContext.Provider value={config}>
      {children}
    </PublicConfigContext.Provider>
  );
}

export function usePublicConfig() {
  return useContext(PublicConfigContext);
}

export function useGeocodingProvider() {
  return useContext(PublicConfigContext).geocoding_provider;
}
