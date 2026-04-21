import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, Upload, X, Sparkles, MapPin, CheckCircle, Plus, ArrowLeft, Loader2, IdCard, ShieldCheck, AlertCircle } from 'lucide-react';
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
  const docInputRef = useRef(null);

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

  // Identified owner (document) — ephemeral, never uploaded to storage
  const [identifiedOwner, setIdentifiedOwner] = useState(null);
  const [docExtracting, setDocExtracting] = useState(false);
  const [docError, setDocError] = useState(null);

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

  // ── Identified owner extraction (ephemeral, no storage) ─────────────────────

  const handleDocSelect = async (e) => {
    const file = (e.target.files || [])[0];
    e.target.value = '';
    if (!file) return;
    setDocError(null);
    setDocExtracting(true);
    try {
      const formData = new FormData();
      formData.append('files', file);
      const res = await api.post('/business/items/extract-document', formData);
      const data = res.data || {};
      if (!data.is_identity_document) {
        setDocError(t('identifiedOwnerNotDetected'));
        return;
      }
      setIdentifiedOwner({
        doc_type: data.doc_type || 'other',
        doc_type_label: data.doc_type_label || '',
        owner_name: data.owner_name || '',
        doc_number: data.doc_number || '',
        notes: data.notes || '',
        ai_extracted: true,
        extraction_confidence: data.confidence || null,
      });
      // Auto-fill title if empty — saves a step when the item IS the document
      if (!title.trim()) {
        const typeKey = {
          id_card: 'docTypeIdCard',
          passport: 'docTypePassport',
          driving_license: 'docTypeDrivingLicense',
          other: 'docTypeOther',
        }[data.doc_type] || 'docTypeOther';
        const typeLabel = data.doc_type_label?.trim() || t(typeKey);
        const owner = data.owner_name?.trim();
        setTitle(owner ? `${typeLabel} · ${owner}` : typeLabel);
      }
    } catch (err) {
      console.error('Document extraction failed:', err);
      setDocError(err.response?.data?.detail || t('identifiedOwnerNotDetected'));
    } finally {
      setDocExtracting(false);
    }
  };

  const updateIdentifiedOwner = (field, value) => {
    setIdentifiedOwner((prev) => ({ ...(prev || {}), [field]: value, ai_extracted: false }));
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
      ...(identifiedOwner && identifiedOwner.owner_name?.trim() && identifiedOwner.doc_number?.trim() && {
        identified_owner: {
          doc_type: identifiedOwner.doc_type || 'other',
          doc_type_label: identifiedOwner.doc_type_label?.trim() || null,
          owner_name: identifiedOwner.owner_name.trim(),
          doc_number: identifiedOwner.doc_number.trim(),
          notes: identifiedOwner.notes?.trim() || null,
          ai_extracted: !!identifiedOwner.ai_extracted,
          extraction_confidence: identifiedOwner.extraction_confidence ?? null,
        },
      }),
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
    setIdentifiedOwner(null);
    setDocError(null);
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    mapInitializedRef.current = false;
    setSuccess(null);
  };

  // ── Loading state (edit mode) ────────────────────────────────────────────────

  if (loadingItem) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
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
          <h2 className="text-lg font-semibold text-slate-900 mb-1">{t('itemRegistered')}</h2>
          <p className="text-sm text-slate-500 mb-8">
            "<span className="font-medium text-slate-700">{success.title}</span>" {t('isBeingRegistered')}
            {' '}{t('aiLookingForMatches')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              data-testid="register-another-btn"
              onClick={handleRegisterAnother}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 transition-colors"
            >
              <Plus size={15} />
              {t('registerAnother')}
            </button>
            <button
              data-testid="view-items-btn"
              onClick={() => navigate('/items')}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-100 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-200 transition-colors"
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
          className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft size={15} className="text-slate-600" />
        </button>
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            {isEdit ? t('editItem') : t('registerFoundItem')}
          </h2>
          <p className="text-sm text-slate-500">{t('takePhotoAndAI')}</p>
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
                <div key={idx} className="relative aspect-square rounded-md overflow-hidden bg-slate-100">
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
                <div className="aspect-square rounded-md bg-slate-100 flex items-center justify-center">
                  <Loader2 size={20} className="text-slate-400 animate-spin" />
                </div>
              )}
            </div>

            {/* Photo buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 lg:hidden flex items-center justify-center gap-2 py-2.5 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 transition-colors"
              >
                <Camera size={16} />
                {t('takePhoto')}
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-100 lg:bg-teal-600 lg:text-white text-slate-700 rounded-md text-sm font-medium hover:bg-slate-200 lg:hover:bg-teal-700 transition-colors"
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
                  ? 'bg-teal-600 text-white hover:bg-teal-700'
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed'
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
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">{t('titleLabel')} *</label>
              <input
                data-testid="item-title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Black leather wallet"
                required
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">{t('descriptionLabel')}</label>
              <textarea
                data-testid="item-description-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the item in detail..."
                rows={4}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-md text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                <MapPin size={12} className="inline mr-1" />
                {t('locationRequired')} *
              </label>
              <div
                data-testid="map-container"
                ref={mapContainerRef}
                className="w-full h-[220px] lg:h-[260px] rounded-md overflow-hidden"
              />
              {address && (
                <p className="mt-1.5 text-xs text-slate-400 truncate">{address}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">{t('dateTimeFound')}</label>
              <input
                data-testid="item-datetime-input"
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
              />
            </div>

            {/* Event selector */}
            {activeEvents.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">{t('evtSelectEvent')}</label>
                <select
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                >
                  <option value="">{t('evtNoEvent')}</option>
                  {activeEvents.map(evt => (
                    <option key={evt.event_id} value={evt.event_id}>{evt.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Identified owner (document) */}
            <div className="border border-slate-200 rounded-md p-4 bg-slate-50/50" data-testid="identified-owner-section">
              <div className="flex items-start gap-2 mb-2">
                <IdCard size={16} className="text-teal-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{t('identifiedOwner')}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{t('identifiedOwnerHint')}</p>
                </div>
              </div>

              {!identifiedOwner && (
                <>
                  <button
                    type="button"
                    onClick={() => docInputRef.current?.click()}
                    disabled={docExtracting}
                    className="w-full flex items-center justify-center gap-2 py-2.5 mt-2 bg-white border border-teal-600 text-teal-700 rounded-md text-sm font-medium hover:bg-teal-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    data-testid="scan-document-btn"
                  >
                    {docExtracting ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                    {docExtracting ? t('identifiedOwnerExtracting') : t('identifiedOwnerUploadBtn')}
                  </button>
                  <input
                    ref={docInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleDocSelect}
                    className="hidden"
                  />
                  {docError && (
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-700">
                      <AlertCircle size={13} className="flex-shrink-0 mt-px" />
                      <span>{docError}</span>
                    </div>
                  )}
                </>
              )}

              {identifiedOwner && (
                <div className="mt-2 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700">
                    <CheckCircle size={13} />
                    <span>{t('identifiedOwnerDetected')} {t('identifiedOwnerEditHint')}</span>
                    {identifiedOwner.extraction_confidence != null && (
                      <span className="ml-auto text-slate-400">
                        {t('docConfidence')}: {Math.round(identifiedOwner.extraction_confidence * 100)}%
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{t('docTypeField')}</span>
                      <select
                        value={identifiedOwner.doc_type}
                        onChange={(e) => updateIdentifiedOwner('doc_type', e.target.value)}
                        className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      >
                        <option value="id_card">{t('docTypeIdCard')}</option>
                        <option value="passport">{t('docTypePassport')}</option>
                        <option value="driving_license">{t('docTypeDrivingLicense')}</option>
                        <option value="other">{t('docTypeOther')}</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{t('docTypeLabelField')}</span>
                      <input
                        type="text"
                        value={identifiedOwner.doc_type_label || ''}
                        onChange={(e) => updateIdentifiedOwner('doc_type_label', e.target.value)}
                        placeholder={t('docTypeLabelFieldHint')}
                        className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{t('ownerNameField')}</span>
                    <input
                      type="text"
                      value={identifiedOwner.owner_name}
                      onChange={(e) => updateIdentifiedOwner('owner_name', e.target.value)}
                      required
                      className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      data-testid="owner-name-input"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{t('docNumberField')}</span>
                    <input
                      type="text"
                      value={identifiedOwner.doc_number}
                      onChange={(e) => updateIdentifiedOwner('doc_number', e.target.value)}
                      required
                      autoComplete="off"
                      className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono"
                      data-testid="doc-number-input"
                    />
                    <div className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-500">
                      <ShieldCheck size={12} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{t('docNumberEphemeralNotice')}</span>
                    </div>
                  </label>

                  <label className="block">
                    <span className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{t('docNotesField')}</span>
                    <textarea
                      value={identifiedOwner.notes || ''}
                      onChange={(e) => updateIdentifiedOwner('notes', e.target.value)}
                      placeholder={t('docNotesFieldHint')}
                      rows={2}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => { setIdentifiedOwner(null); setDocError(null); }}
                    className="text-xs text-slate-500 hover:text-red-600"
                  >
                    {t('identifiedOwnerRemove')}
                  </button>
                </div>
              )}
            </div>

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
                    ? 'bg-teal-600 text-white hover:bg-teal-700'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
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
