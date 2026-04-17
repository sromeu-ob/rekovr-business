import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, Upload, X, Sparkles, MapPin, CheckCircle, Plus, ArrowLeft, Loader2 } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import api, { photoUrl } from '../api';
import { useI18n } from '../contexts/I18nContext';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function NewItemPage({ auth }) {
  const navigate = useNavigate();
  const { itemId } = useParams();
  const isEdit = Boolean(itemId);
  const { t, language } = useI18n();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInitializedRef = useRef(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [loadingItem, setLoadingItem] = useState(isEdit);
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [publicTitle, setPublicTitle] = useState('');
  const [publicDescription, setPublicDescription] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [dateTime, setDateTime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  const [eventId, setEventId] = useState('');
  const [activeEvents, setActiveEvents] = useState([]);

  const [savedAddress, setSavedAddress] = useState('');
  const [savedLat, setSavedLat] = useState(null);
  const [savedLng, setSavedLng] = useState(null);

  // Initial map center: item coords (edit) or org default or Barcelona
  const [initialCenter, setInitialCenter] = useState(null);

  const orgDefaultLocation = auth?.organization?.default_location;

  // ── Fetch active events for selector ─────────────────────────────────────────

  useEffect(() => {
    api.get('/business/events', { params: { status: 'active' } })
      .then(res => setActiveEvents(res.data.events || []))
      .catch(() => {});
  }, []);

  // ── Load item in edit mode ───────────────────────────────────────────────────

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/business/items/${itemId}`)
      .then(res => {
        const item = res.data;
        setTitle(item.title || '');
        setDescription(item.description || '');
        setPublicTitle(item.public_title || '');
        setPublicDescription(item.public_description || '');
        setAddress(item.address || '');
        if (item.date_time) setDateTime(item.date_time.slice(0, 16));
        if (item.event_id) setEventId(item.event_id);
        if (item.location?.coordinates) {
          const [iLng, iLat] = item.location.coordinates;
          setLat(iLat);
          setLng(iLng);
          setInitialCenter([iLng, iLat]);
        }
        if (item.photos?.length) {
          setPhotos(item.photos.map(url => ({ preview: photoUrl(url), url })));
        }
      })
      .catch(err => console.error('Failed to load item:', err))
      .finally(() => setLoadingItem(false));
  }, [itemId, isEdit]);

  // ── Update location state from map interactions ────────────────────────────

  const updateLocationFromCoords = useCallback((newLat, newLng, newAddress) => {
    setLat(newLat);
    setLng(newLng);
    setAddress(newAddress || `${newLat.toFixed(5)}, ${newLng.toFixed(5)}`);
  }, []);

  // ── Interactive map with geocoder, drag, click, geolocation ────────────────

  useEffect(() => {
    if (loadingItem) return; // wait until item is loaded in edit mode
    if (!mapContainerRef.current || mapInitializedRef.current) return;
    mapInitializedRef.current = true;

    const defaultCenter = initialCenter
      || (orgDefaultLocation
        ? [orgDefaultLocation.longitude, orgDefaultLocation.latitude]
        : [2.1734, 41.3851]);

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
      placeholder: t('searchForAddress'),
    });
    map.addControl(geocoder, 'top-left');
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    const marker = new mapboxgl.Marker({ color: '#18181b', draggable: true })
      .setLngLat(defaultCenter)
      .addTo(map);
    markerRef.current = marker;

    // Pre-set location state from initialCenter (edit) or orgDefault (create)
    if (initialCenter) {
      // location already set from item load — don't overwrite address
    } else if (orgDefaultLocation) {
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

    // Only use geolocation in create mode (don't override item's location)
    if (!isEdit && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: geoLat, longitude: geoLng } = pos.coords;
          map.flyTo({ center: [geoLng, geoLat], zoom: 14 });
          marker.setLngLat([geoLng, geoLat]);
          updateLocationFromCoords(geoLat, geoLng, null);
        },
        () => {}
      );
    }

    return () => { map.remove(); mapRef.current = null; mapInitializedRef.current = false; };
  }, [success, loadingItem]); // re-init after "register another" reset or when item loaded

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
      if (removed?.preview && removed?.file) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  // ── AI auto-fill ─────────────────────────────────────────────────────────────

  const handleAiFill = async () => {
    if (!photos.length || aiLoading) return;
    setAiLoading(true);
    try {
      const formData = new FormData();
      for (const p of photos.slice(0, 3)) {
        if (p.file) {
          formData.append('files', p.file);
        } else {
          // Existing photo — fetch as blob and send as file
          try {
            const res = await fetch(p.preview);
            const blob = await res.blob();
            formData.append('files', blob, 'photo.jpg');
          } catch {
            // skip if fetch fails
          }
        }
      }
      formData.append('language', language);
      const res = await api.post('/business/items/describe', formData);
      if (res.data.title) setTitle(res.data.title);
      if (res.data.description) setDescription(res.data.description);
      if (res.data.public_title) setPublicTitle(res.data.public_title);
      if (res.data.public_description) setPublicDescription(res.data.public_description);
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
    setSubmitError(null);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        latitude: lat,
        longitude: lng,
        address,
        date_time: dateTime || null,
        photos: photos.map((p) => p.url),
        ...(publicTitle && { public_title: publicTitle }),
        ...(publicDescription && { public_description: publicDescription }),
      ...(eventId && { event_id: eventId }),
      };

      if (isEdit) {
        await api.put(`/business/items/${itemId}`, payload);
        navigate(`/items/${itemId}`);
      } else {
        await api.post('/business/items', payload);
        setSavedAddress(address);
        setSavedLat(lat);
        setSavedLng(lng);
        setSuccess({ title: title.trim() });
      }
    } catch (err) {
      console.error('Submit failed:', err);
      const detail = err.response?.data?.detail;
      setSubmitError(Array.isArray(detail) ? detail.join(', ') : detail || t('failedToSave'));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Reset for "register another" ────────────────────────────────────────────

  const handleRegisterAnother = () => {
    photos.forEach((p) => p.file && p.preview && URL.revokeObjectURL(p.preview));
    setPhotos([]);
    setTitle('');
    setDescription('');
    setAddress(savedAddress);
    setLat(savedLat);
    setLng(savedLng);
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    mapInitializedRef.current = false;
    setSuccess(null);
  };

  // ── Loading state (edit mode) ────────────────────────────────────────────────

  if (loadingItem) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-5 h-5 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
      </div>
    );
  }

  // ── Success screen (create mode only) ───────────────────────────────────────

  if (success) {
    return (
      <div data-testid="item-success" className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={28} className="text-emerald-600" />
          </div>
          <h2 className="text-lg font-semibold text-stone-900 mb-1">{t('itemRegistered')}</h2>
          <p className="text-sm text-stone-500 mb-8">
            "<span className="font-medium text-stone-700">{success.title}</span>" {t('isBeingRegistered')}
            {' '}{t('aiLookingForMatches')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              data-testid="register-another-btn"
              onClick={handleRegisterAnother}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-stone-900 text-white rounded-md text-sm font-medium hover:bg-stone-800 transition-colors"
            >
              <Plus size={15} />
              {t('registerAnother')}
            </button>
            <button
              data-testid="view-items-btn"
              onClick={() => navigate('/items')}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-stone-100 text-stone-700 rounded-md text-sm font-medium hover:bg-stone-200 transition-colors"
            >
              {t('viewItems')}
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
          data-testid="back-btn"
          onClick={() => navigate(isEdit ? `/items/${itemId}` : '/items')}
          className="w-8 h-8 rounded-md bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors"
        >
          <ArrowLeft size={15} className="text-stone-600" />
        </button>
        <div>
          <h2 className="text-2xl font-semibold text-stone-900">
            {isEdit ? t('editItem') : t('registerFoundItem')}
          </h2>
          <p className="text-sm text-stone-500">{t('takePhotoAndAI')}</p>
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
                <div key={idx} className="relative aspect-square rounded-md overflow-hidden bg-stone-100">
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
                <div className="aspect-square rounded-md bg-stone-100 flex items-center justify-center">
                  <Loader2 size={20} className="text-stone-400 animate-spin" />
                </div>
              )}
            </div>

            {/* Photo buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 lg:hidden flex items-center justify-center gap-2 py-2.5 bg-stone-900 text-white rounded-md text-sm font-medium hover:bg-stone-800 transition-colors"
              >
                <Camera size={16} />
                {t('takePhoto')}
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-stone-100 lg:bg-stone-900 lg:text-white text-stone-700 rounded-md text-sm font-medium hover:bg-stone-200 lg:hover:bg-stone-800 transition-colors"
              >
                <Upload size={16} />
                {t('uploadPhotos')}
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
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors ${
                hasPhotos && !aiLoading
                  ? 'bg-stone-900 text-white hover:bg-stone-800'
                  : 'bg-stone-100 text-stone-300 cursor-not-allowed'
              }`}
            >
              {aiLoading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Sparkles size={15} />
              )}
              {aiLoading ? t('generating') : t('autoFillTitleDescription')}
            </button>
          </div>

          {/* RIGHT: Form fields */}
          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">{t('titleLabel')} *</label>
              <input
                data-testid="item-title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Black leather wallet"
                required
                className="w-full h-10 px-3 bg-white border border-stone-300 rounded-md text-sm text-stone-800 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">{t('descriptionLabel')}</label>
              <textarea
                data-testid="item-description-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the item in detail..."
                rows={4}
                className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-md text-sm text-stone-800 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                <MapPin size={12} className="inline mr-1" />
                {t('locationRequired')} *
              </label>
              <div
                data-testid="map-container"
                ref={mapContainerRef}
                className="w-full h-[220px] lg:h-[260px] rounded-md overflow-hidden"
              />
              {address && (
                <p className="mt-1.5 text-xs text-stone-400 truncate">{address}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">{t('dateTimeFound')}</label>
              <input
                data-testid="item-datetime-input"
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-stone-300 rounded-md text-sm text-stone-800 outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors"
              />
            </div>

            {/* Event selector */}
            {activeEvents.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">{t('evtSelectEvent')}</label>
                <select
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-stone-300 rounded-md text-sm text-stone-800 outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors"
                >
                  <option value="">{t('evtNoEvent')}</option>
                  {activeEvents.map(evt => (
                    <option key={evt.event_id} value={evt.event_id}>{evt.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Error */}
            {submitError && (
              <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-md text-xs text-red-600">
                {submitError}
              </div>
            )}

            {/* Submit */}
            <div className="pt-2 pb-4">
              <button
                data-testid="publish-item-btn"
                type="submit"
                disabled={!canSubmit}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-md text-sm font-medium transition-colors ${
                  canSubmit
                    ? 'bg-stone-900 text-white hover:bg-stone-800'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle size={16} />
                )}
                {submitting
                  ? t('saving')
                  : isEdit
                    ? t('saveChanges')
                    : t('publishItem')}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
