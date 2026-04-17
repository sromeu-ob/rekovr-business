import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import api from '../api';
import { useI18n } from '../contexts/I18nContext';

const VALID_STATUSES = ['active', 'completed', 'cancelled'];

export default function EventFormPage({ auth }) {
  const { eventId } = useParams();
  const isEdit = Boolean(eventId);
  const navigate = useNavigate();
  const { t } = useI18n();

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form state
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('active');

  // Load event in edit mode
  useEffect(() => {
    if (!isEdit) return;
    api.get(`/business/events/${eventId}`)
      .then(res => {
        const evt = res.data;
        setName(evt.name || '');
        setStartDate(evt.start_date ? evt.start_date.slice(0, 16) : '');
        setEndDate(evt.end_date ? evt.end_date.slice(0, 16) : '');
        setLocation(evt.location || '');
        setStatus(evt.status || 'active');
      })
      .catch(() => setSubmitError(t('evtNotFound')))
      .finally(() => setLoading(false));
  }, [eventId, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !startDate || !endDate) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        name: name.trim(),
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        location: location.trim() || null,
        status,
      };

      if (isEdit) {
        await api.put(`/business/events/${eventId}`, payload);
        navigate(`/events/${eventId}`);
      } else {
        const res = await api.post('/business/events', payload);
        setSuccess({ name: name.trim(), eventId: res.data.event_id });
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      setSubmitError(Array.isArray(detail) ? detail.join(', ') : detail || t('failedToSave'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAnother = () => {
    setSuccess(null);
    setName('');
    setStartDate('');
    setEndDate('');
    setLocation('');
    setStatus('active');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-5 h-5 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
      </div>
    );
  }

  // Success screen after creation
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-md bg-emerald-50 flex items-center justify-center mb-4">
          <CalendarDays size={24} className="text-emerald-600" />
        </div>
        <h2 className="text-xl font-semibold text-stone-900 mb-1">{t('evtEventCreated')}</h2>
        <p className="text-sm text-stone-500 mb-6">
          <span className="font-medium text-stone-700">{success.name}</span> {t('evtHasBeenCreated')}
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleCreateAnother}
            className="px-4 py-2 bg-stone-100 text-stone-700 rounded-md text-sm font-medium hover:bg-stone-200 transition-colors"
          >
            {t('evtCreateAnother')}
          </button>
          <button
            onClick={() => navigate(`/events/${success.eventId}`)}
            className="px-4 py-2 bg-stone-900 text-white rounded-md text-sm font-medium hover:bg-stone-800 transition-colors"
          >
            {t('evtViewEvent')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate(isEdit ? `/events/${eventId}` : '/events')}
          className="w-8 h-8 rounded-md bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors"
        >
          <ArrowLeft size={15} className="text-stone-600" />
        </button>
        <div>
          <h2 className="text-2xl font-semibold text-stone-900">
            {isEdit ? t('evtEditEvent') : t('evtNewEvent')}
          </h2>
          <p className="text-sm text-stone-500 mt-0.5">{t('evtFormSubtitle')}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1.5">{t('evtNameLabel')} *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('evtNamePlaceholder')}
            required
            className="w-full h-10 px-3 bg-white border border-stone-300 rounded-md text-sm text-stone-800 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors"
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1.5">{t('evtStartDate')} *</label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full h-10 px-3 bg-white border border-stone-300 rounded-md text-sm text-stone-800 outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1.5">{t('evtEndDate')} *</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="w-full h-10 px-3 bg-white border border-stone-300 rounded-md text-sm text-stone-800 outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1.5">{t('evtLocationLabel')}</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t('evtLocationPlaceholder')}
            className="w-full h-10 px-3 bg-white border border-stone-300 rounded-md text-sm text-stone-800 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors"
          />
        </div>

        {/* Status (only in edit mode) */}
        {isEdit && (
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1.5">{t('colStatus')}</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-stone-300 rounded-md text-sm text-stone-800 outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors"
            >
              {VALID_STATUSES.map(s => (
                <option key={s} value={s}>{t(`evtStatus_${s}`)}</option>
              ))}
            </select>
          </div>
        )}

        {/* Error */}
        {submitError && (
          <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-md text-xs text-red-700">
            {submitError}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !name.trim() || !startDate || !endDate}
          className="w-full py-2.5 bg-stone-900 text-white rounded-md text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting
            ? (isEdit ? t('saving') : t('evtCreating'))
            : (isEdit ? t('saveChanges') : t('evtCreateEvent'))
          }
        </button>
      </form>
    </div>
  );
}
