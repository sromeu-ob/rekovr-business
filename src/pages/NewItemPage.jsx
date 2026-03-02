import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, X, Sparkles, MapPin, CheckCircle, Plus, ArrowLeft, Loader2 } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import api from '../api';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function NewItemPage({ auth }) {
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInitializedRef = useRef(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [dateTime, setDateTime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  const [savedAddress, setSavedAddress] = useState('');
  const [savedLat, setSavedLat] = useState(null);
  const [savedLng, setSavedLng] = useState(null);

  const orgDefaultLocation = auth?.organization?.default_location;

  // ── Update location state from map interactions ────────────────────────────

  const updateLocationFromCoords = useCallback((newLat, newLng, newAddress) => {
    setLat(newLat);
    setLng(newLng);
    setAddress(newAddress || `${newLat.toFixed(5)}, ${newLng.toFixed(5)}`);
  }, []);

  // ── Interactive map with geocoder, drag, click, geolocation ────────────────

  useEffect(() => {
    if (!mapContainerRef.current || mapInitializedRef.current) return;
    mapInitializedRef.current = true;

    const defaultCenter = orgDefaultLocation
      ? [orgDefaultLocation.longitude, orgDefaultLocation.latitude]
      : [2.1734, 41.3851]; // Barcelona fallback

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: defaultCenter,
      zoom: 13,
    });
    mapRef.current = map;

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl,
      marker: false,
      placeholder: 'Search for an address...',
    });
    map.addControl(geocoder, 'top-left');
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    const marker = new mapboxgl.Marker({ color: '#18181b', draggable: true })
      .setLngLat(defaultCenter)
      .addTo(map);
    markerRef.current = marker;

    if (orgDefaultLocation) {
      updateLocationFromCoords(
        orgDefaultLocation.latitude,
        orgDefaultLocation.longitude,
        orgDefaultLocation.address || null,
      );
    }

    geocoder.on('result', (e) => {
      const [gLng, gLat] = e.result.center;
      marker.setLngLat([gLng, gLat]);
      updateLocationFromCoords(gLat, gLng, e.result.place_name);
    });

    marker.on('dragend', () => {
      const { lat: mLat, lng: mLng } = marker.getLngLat();
      updateLocationFromCoords(mLat, mLng, null);
    });

    map.on('click', (e) => {
      marker.setLngLat([e.lngLat.lng, e.lngLat.lat]);
      updateLocationFromCoords(e.lngLat.lat, e.lngLat.lng, null);
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: geoLat, longitude: geoLng } = pos.coords;
          map.flyTo({ center: [geoLng, geoLat], zoom: 14 });
          marker.setLngLat([geoLng, geoLat]);
          updateLocationFromCoords(geoLat, geoLng, null);
        },
        () => {} // denied or error — keep default
      );
    }

    return () => { map.remove(); mapRef.current = null; mapInitializedRef.current = false; };
  }, [success]); // re-init after "register another" reset

  // ── Photo handling ───────────────────────────────────────────────────────────

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const preview = URL.createObjectURL(file);
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post('/business/items/upload', formData);
        setPhotos((prev) => [...prev, { file, preview, url: res.data.url }]);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removePhoto = (idx) => {
    setPhotos((prev) => {
      const removed = prev[idx];
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  // ── AI auto-fill ─────────────────────────────────────────────────────────────

  const handleAiFill = async () => {
    if (!photos.length || aiLoading) return;
    setAiLoading(true);
    try {
      const formData = new FormData();
      for (const p of photos) {
        if (p.file) formData.append('files', p.file);
      }
      formData.append('language', 'en');
      const res = await api.post('/business/items/describe', formData);
      if (res.data.title) setTitle(res.data.title);
      if (res.data.description) setDescription(res.data.description);
    } catch (err) {
      console.error('AI describe failed:', err);
    } finally {
      setAiLoading(false);
    }
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !lat || !lng) return;
    setSubmitting(true);
    try {
      await api.post('/business/items', {
        title: title.trim(),
        description: description.trim(),
        latitude: lat,
        longitude: lng,
        address,
        date_time: dateTime || null,
        photos: photos.map((p) => p.url),
      });
      setSavedAddress(address);
      setSavedLat(lat);
      setSavedLng(lng);
      setSuccess({ title: title.trim() });
    } catch (err) {
      console.error('Submit failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Reset for "register another" ────────────────────────────────────────────

  const handleRegisterAnother = () => {
    photos.forEach((p) => p.preview && URL.revokeObjectURL(p.preview));
    setPhotos([]);
    setTitle('');
    setDescription('');
    setAddress(savedAddress);
    setLat(savedLat);
    setLng(savedLng);
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    mapInitializedRef.current = false;
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setDateTime(now.toISOString().slice(0, 16));
    setSuccess(null);
  };

  // ── Success screen ──────────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={28} className="text-green-600" />
          </div>
          <h2 className="text-[18px] font-bold text-zinc-900 mb-1">Item registered</h2>
          <p className="text-[13px] text-zinc-500 mb-8">
            "<span className="font-medium text-zinc-700">{success.title}</span>" has been registered.
            The AI is looking for matches in the background.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRegisterAnother}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl text-[13px] font-semibold hover:bg-zinc-800 transition"
            >
              <Plus size={15} />
              Register another
            </button>
            <button
              onClick={() => navigate('/items')}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-100 text-zinc-700 rounded-xl text-[13px] font-medium hover:bg-zinc-200 transition"
            >
              View items
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────

  const hasPhotos = photos.length > 0;
  const canSubmit = title.trim() && lat && lng && !submitting && !uploading;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/items')}
          className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition"
        >
          <ArrowLeft size={16} className="text-zinc-600" />
        </button>
        <div>
          <h2 className="text-[20px] font-extrabold text-zinc-900">Register found item</h2>
          <p className="text-[12px] text-zinc-400">Take a photo and let the AI do the rest.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Two-column on desktop, stacked on mobile */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* LEFT: Photos */}
          <div className="w-full lg:w-[380px] flex-shrink-0 space-y-3">
            {/* Photo grid */}
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-zinc-100">
                  <img src={photo.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center"
                  >
                    <X size={12} className="text-white" />
                  </button>
                </div>
              ))}
              {uploading && (
                <div className="aspect-square rounded-xl bg-zinc-100 flex items-center justify-center">
                  <Loader2 size={20} className="text-zinc-400 animate-spin" />
                </div>
              )}
            </div>

            {/* Photo buttons */}
            <div className="flex gap-2">
              {/* Camera — only on mobile (capture attribute only works on touch devices) */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 lg:hidden flex items-center justify-center gap-2 py-3 bg-zinc-900 text-white rounded-xl text-[13px] font-semibold hover:bg-zinc-800 transition"
              >
                <Camera size={16} />
                Take photo
              </button>
              {/* File picker — always visible, full width on desktop */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-100 lg:bg-zinc-900 lg:text-white text-zinc-700 rounded-xl text-[13px] font-medium lg:font-semibold hover:bg-zinc-200 lg:hover:bg-zinc-800 transition"
              >
                <Upload size={16} />
                Upload photos
              </button>
            </div>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* AI button */}
            <button
              type="button"
              onClick={handleAiFill}
              disabled={!hasPhotos || aiLoading}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold transition ${
                hasPhotos && !aiLoading
                  ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                  : 'bg-zinc-100 text-zinc-300 cursor-not-allowed'
              }`}
            >
              {aiLoading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Sparkles size={15} />
              )}
              {aiLoading ? 'Generating...' : 'Auto-fill title & description'}
            </button>
          </div>

          {/* RIGHT: Form fields */}
          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Black leather wallet"
                required
                className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[13px] outline-none focus:border-zinc-400 transition"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the item in detail..."
                rows={4}
                className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-[13px] outline-none focus:border-zinc-400 transition resize-none"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                <MapPin size={12} className="inline mr-1" />
                Location *
              </label>
              <div
                ref={mapContainerRef}
                className="w-full h-[220px] lg:h-[260px] rounded-xl overflow-hidden"
              />
              {address && (
                <p className="mt-1.5 text-[11px] text-zinc-400 truncate">{address}</p>
              )}
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Date & Time found</label>
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[13px] outline-none focus:border-zinc-400 transition"
              />
            </div>

            {/* Submit - sticky on mobile */}
            <div className="pt-2 pb-4">
              <button
                type="submit"
                disabled={!canSubmit}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[14px] font-bold transition ${
                  canSubmit
                    ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                    : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                }`}
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle size={16} />
                )}
                {submitting ? 'Publishing...' : 'Publish item'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
