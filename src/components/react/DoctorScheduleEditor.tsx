import { useState, useEffect, useCallback } from 'react';
import { apiList, apiCreate, apiUpdate, apiDelete } from '../../lib/api-client';

interface Props {
  doctor: any;
  onClose: () => void;
  onSaved: () => void;
}

type Tab = 'schedule' | 'disabled' | 'special' | 'holidays';

const DAYS = [
  { key: 'mon', label: 'Lunes' },
  { key: 'tue', label: 'Martes' },
  { key: 'wed', label: 'Miercoles' },
  { key: 'thu', label: 'Jueves' },
  { key: 'fri', label: 'Viernes' },
  { key: 'sat', label: 'Sabado' },
];

const PARTS = [
  { key: 'morn', label: 'Manana' },
  { key: 'after', label: 'Tarde' },
];

const DURATIONS = [5, 10, 15, 20, 30, 40, 45, 60];

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 6; h <= 23; h++) {
    for (let m = 0; m < 60; m += 5) {
      if (h === 23 && m > 0) break;
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

function formatDateStr(d: string): string {
  if (!d) return '';
  const clean = d.split('T')[0];
  const [y, m, day] = clean.split('-');
  if (!y || !m || !day) return clean;
  return `${day}/${m}/${y}`;
}

const selectClass = "w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white disabled:opacity-30 disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none cursor-pointer";
const btnClass = "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only peer" />
      <div className="w-8 h-[18px] bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-3.5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-[14px] after:w-[14px] after:transition-all peer-checked:bg-teal-500"></div>
    </label>
  );
}

// ─── Tab: Horarios Semanales (embedded in doctor) ───
interface PartConfig {
  enabled: boolean;
  from: string;
  to: string;
  period: number;
}

type ScheduleState = Record<string, { morn: PartConfig; after: PartConfig }>;

function defaultPart(from: string, to: string): PartConfig {
  return { enabled: false, from, to, period: 15 };
}

function initSchedule(doctor: any): ScheduleState {
  const state: ScheduleState = {};
  for (const day of DAYS) {
    const d = doctor.data || {};
    state[day.key] = {
      morn: {
        enabled: d[`${day.key}_morn_enabled`] === true || d[`${day.key}_morn_enabled`] === 'true',
        from: d[`${day.key}_morn_from`] || '08:00',
        to: d[`${day.key}_morn_to`] || '12:00',
        period: Number(d[`${day.key}_morn_period`]) || 15,
      },
      after: {
        enabled: d[`${day.key}_after_enabled`] === true || d[`${day.key}_after_enabled`] === 'true',
        from: d[`${day.key}_after_from`] || '14:00',
        to: d[`${day.key}_after_to`] || '18:00',
        period: Number(d[`${day.key}_after_period`]) || 15,
      },
    };
  }
  return state;
}

function ScheduleTab({ doctor, onSaved }: { doctor: any; onSaved: () => void }) {
  const [schedule, setSchedule] = useState<ScheduleState>(() => initSchedule(doctor));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function setPartField(day: string, part: 'morn' | 'after', key: keyof PartConfig, value: any) {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], [part]: { ...prev[day][part], [key]: value } },
    }));
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload: Record<string, any> = {};
      for (const day of DAYS) {
        for (const part of ['morn', 'after'] as const) {
          const p = schedule[day.key][part];
          payload[`${day.key}_${part}_enabled`] = p.enabled;
          payload[`${day.key}_${part}_from`] = p.from;
          payload[`${day.key}_${part}_to`] = p.to;
          payload[`${day.key}_${part}_period`] = p.period;
        }
      }
      await apiUpdate('doctors', doctor.id, payload);
      setSuccess('Horarios guardados');
      onSaved();
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      {error && <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">{error}</div>}
      {success && <div className="p-2 rounded-lg bg-green-50 border border-green-200 text-xs text-green-700">{success}</div>}

      {DAYS.map(day => {
        const dayState = schedule[day.key];
        const anyEnabled = dayState.morn.enabled || dayState.after.enabled;
        return (
          <div key={day.key} className={`rounded-lg border p-3 transition-colors ${anyEnabled ? 'border-teal-200 bg-teal-50/20' : 'border-gray-100 bg-gray-50/30'}`}>
            <p className={`text-sm font-semibold mb-2 ${anyEnabled ? 'text-gray-900' : 'text-gray-400'}`}>{day.label}</p>
            <div className="space-y-2">
              {PARTS.map(part => {
                const p = dayState[part.key as 'morn' | 'after'];
                return (
                  <div key={part.key} className={`flex flex-wrap items-center gap-2 py-1.5 px-2 rounded ${p.enabled ? 'bg-white border border-gray-100' : ''}`}>
                    <div className="flex items-center gap-1.5 w-24 shrink-0">
                      <Toggle checked={p.enabled} onChange={v => setPartField(day.key, part.key as 'morn' | 'after', 'enabled', v)} />
                      <span className={`text-xs ${p.enabled ? 'text-gray-700' : 'text-gray-400'}`}>{part.label}</span>
                    </div>
                    {p.enabled && (
                      <>
                        <select value={p.from} onChange={e => setPartField(day.key, part.key as 'morn' | 'after', 'from', e.target.value)} className={selectClass} style={{ width: '90px' }}>
                          {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <span className="text-gray-300 text-xs">a</span>
                        <select value={p.to} onChange={e => setPartField(day.key, part.key as 'morn' | 'after', 'to', e.target.value)} className={selectClass} style={{ width: '90px' }}>
                          {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select value={p.period} onChange={e => setPartField(day.key, part.key as 'morn' | 'after', 'period', Number(e.target.value))} className={selectClass} style={{ width: '80px' }}>
                          {DURATIONS.map(d => <option key={d} value={d}>{d} min</option>)}
                        </select>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="flex justify-end pt-2">
        <button onClick={handleSave} disabled={saving} className={`${btnClass} bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50`}>
          {saving ? 'Guardando...' : 'Guardar horarios'}
        </button>
      </div>
    </div>
  );
}

// ─── Tab: Dias Deshabilitados (exceptions entity, exception_type='bloqueo') ───
function DisabledDaysTab({ doctor }: { doctor: any }) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [allDay, setAllDay] = useState(true);
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');
  const [description, setDescription] = useState('');

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiList('exceptions');
      setRecords(data.filter((r: any) =>
        r.data?.doctor_id === doctor.id && r.data?.exception_type === 'bloqueo'
      ));
    } catch (err) {
      console.error('Error loading exceptions:', err);
    } finally {
      setLoading(false);
    }
  }, [doctor.id]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  function resetForm() {
    setDateFrom(''); setDateTo(''); setAllDay(true);
    setTimeFrom(''); setTimeTo(''); setDescription('');
    setShowForm(false); setError('');
  }

  async function handleAdd() {
    if (!dateFrom || !dateTo) { setError('Selecciona las fechas'); return; }
    if (!allDay && (!timeFrom || !timeTo)) { setError('Selecciona el rango horario'); return; }
    setSaving(true); setError('');
    try {
      await apiCreate('exceptions', {
        doctor_id: doctor.id,
        since_date: dateFrom,
        to_date: dateTo,
        since_time: allDay ? null : timeFrom,
        to_time: allDay ? null : timeTo,
        exception_type: 'bloqueo',
        description: description || 'Deshabilitado',
      });
      resetForm();
      loadRecords();
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiDelete('exceptions', id);
      loadRecords();
    } catch (err) {
      console.error('Error deleting exception:', err);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">Dias que el profesional no atiende (vacaciones, licencia, etc.)</p>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className={`${btnClass} bg-teal-500 text-white hover:bg-teal-600`}>
            + Agregar
          </button>
        )}
      </div>

      {showForm && (
        <div className="rounded-lg border border-teal-200 bg-teal-50/30 p-3 space-y-3">
          {error && <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">{error}</div>}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-gray-500 uppercase font-semibold mb-1">Desde</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={selectClass} />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 uppercase font-semibold mb-1">Hasta</label>
              <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); if (!dateFrom) setDateFrom(e.target.value); }} className={selectClass} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Toggle checked={allDay} onChange={setAllDay} />
            <span className="text-xs text-gray-700">Todo el dia</span>
          </div>
          {!allDay && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 uppercase font-semibold w-12 shrink-0">Rango</span>
              <select value={timeFrom} onChange={e => setTimeFrom(e.target.value)} className={selectClass}>
                <option value="">--</option>
                {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <span className="text-gray-300 text-xs">a</span>
              <select value={timeTo} onChange={e => setTimeTo(e.target.value)} className={selectClass}>
                <option value="">--</option>
                {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-[10px] text-gray-500 uppercase font-semibold mb-1">Motivo (opcional)</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ej: Vacaciones" className={selectClass} />
          </div>
          <div className="flex items-center gap-2 justify-end">
            <button type="button" onClick={resetForm} className={`${btnClass} text-gray-500 hover:bg-gray-100`}>Cancelar</button>
            <button type="button" onClick={handleAdd} disabled={saving} className={`${btnClass} bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50`}>
              {saving ? 'Guardando...' : 'Agregar'}
            </button>
          </div>
        </div>
      )}

      {records.length === 0 && !showForm && (
        <div className="text-center py-6 text-gray-400 text-xs">No hay dias deshabilitados</div>
      )}

      {records.map(rec => {
        const d = rec.data || {};
        const from = d.since_date?.split('T')[0] || '';
        const to = d.to_date?.split('T')[0] || '';
        return (
          <div key={rec.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
            <div>
              <div className="text-sm font-medium text-gray-900">
                {from === to ? formatDateStr(from) : `${formatDateStr(from)} → ${formatDateStr(to)}`}
              </div>
              <div className="text-xs text-gray-500">
                {d.since_time ? `${d.since_time} - ${d.to_time}` : 'Todo el dia'}
                {d.description && ` · ${d.description}`}
              </div>
            </div>
            <button onClick={() => handleDelete(rec.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab: Dias Excepcionales (special_schedules entity) ───
function SpecialDaysTab({ doctor }: { doctor: any }) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [period, setPeriod] = useState(15);
  const [datePart, setDatePart] = useState<'morning' | 'afternoon'>('morning');

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiList('special_schedules');
      setRecords(data.filter((r: any) => r.data?.doctor_id === doctor.id));
    } catch (err) {
      console.error('Error loading special_schedules:', err);
    } finally {
      setLoading(false);
    }
  }, [doctor.id]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  function resetForm() {
    setDate(''); setStartTime(''); setEndTime(''); setPeriod(15); setDatePart('morning');
    setShowForm(false); setError('');
  }

  async function handleAdd() {
    if (!date || !startTime || !endTime) { setError('Completa fecha y horarios'); return; }
    setSaving(true); setError('');
    try {
      await apiCreate('special_schedules', {
        doctor_id: doctor.id,
        date,
        start_time: startTime,
        end_time: endTime,
        period,
        date_part: datePart,
      });
      resetForm();
      loadRecords();
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiDelete('special_schedules', id);
      loadRecords();
    } catch (err) {
      console.error('Error deleting special_schedule:', err);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">Dias con horario especial (ej: sabado extra, guardia)</p>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className={`${btnClass} bg-teal-500 text-white hover:bg-teal-600`}>
            + Agregar
          </button>
        )}
      </div>

      {showForm && (
        <div className="rounded-lg border border-teal-200 bg-teal-50/30 p-3 space-y-3">
          {error && <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">{error}</div>}
          <div>
            <label className="block text-[10px] text-gray-500 uppercase font-semibold mb-1">Fecha</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={selectClass} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 uppercase font-semibold w-16 shrink-0">Horario</span>
            <select value={startTime} onChange={e => setStartTime(e.target.value)} className={selectClass}>
              <option value="">--</option>
              {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <span className="text-gray-300 text-xs">a</span>
            <select value={endTime} onChange={e => setEndTime(e.target.value)} className={selectClass}>
              <option value="">--</option>
              {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-gray-500 uppercase font-semibold mb-1">Duracion turno</label>
              <select value={period} onChange={e => setPeriod(Number(e.target.value))} className={selectClass}>
                {DURATIONS.map(d => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 uppercase font-semibold mb-1">Turno del dia</label>
              <select value={datePart} onChange={e => setDatePart(e.target.value as 'morning' | 'afternoon')} className={selectClass}>
                <option value="morning">Manana</option>
                <option value="afternoon">Tarde</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <button type="button" onClick={resetForm} className={`${btnClass} text-gray-500 hover:bg-gray-100`}>Cancelar</button>
            <button type="button" onClick={handleAdd} disabled={saving} className={`${btnClass} bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50`}>
              {saving ? 'Guardando...' : 'Agregar'}
            </button>
          </div>
        </div>
      )}

      {records.length === 0 && !showForm && (
        <div className="text-center py-6 text-gray-400 text-xs">No hay dias excepcionales</div>
      )}

      {records.map(rec => {
        const d = rec.data || {};
        return (
          <div key={rec.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
            <div>
              <div className="text-sm font-medium text-gray-900">{formatDateStr(d.date)}</div>
              <div className="text-xs text-gray-500">
                {d.start_time} - {d.end_time} · {d.period || 15} min
                {d.date_part && ` · ${d.date_part === 'morning' ? 'Manana' : 'Tarde'}`}
              </div>
            </div>
            <button onClick={() => handleDelete(rec.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab: Feriados (exceptions entity, exception_type='feriado') ───
interface Feriado {
  fecha: string;
  tipo: string;
  nombre: string;
}

function HolidaysTab({ doctor }: { doctor: any }) {
  const [holidays, setHolidays] = useState<Feriado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [existingDates, setExistingDates] = useState<Set<string>>(new Set());
  const [year, setYear] = useState(new Date().getFullYear());

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [holidaysRes, exceptionsRes] = await Promise.all([
        fetch(`https://api.argentinadatos.com/v1/feriados/${year}`).then(r => r.json()),
        apiList('exceptions'),
      ]);
      setHolidays(Array.isArray(holidaysRes) ? holidaysRes : []);
      const doctorExceptions = exceptionsRes.data.filter((r: any) =>
        r.data?.doctor_id === doctor.id && r.data?.exception_type === 'feriado'
      );
      const dates = new Set<string>();
      for (const exc of doctorExceptions) {
        const since = exc.data?.since_date?.split('T')[0];
        if (since) dates.add(since);
      }
      setExistingDates(dates);
    } catch (err: any) {
      setError('No se pudieron cargar los feriados');
    } finally {
      setLoading(false);
    }
  }, [doctor.id, year]);

  useEffect(() => { loadData(); }, [loadData]);

  function toggleSelect(fecha: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(fecha)) next.delete(fecha); else next.add(fecha);
      return next;
    });
  }

  const pending = holidays.filter(h => !existingDates.has(h.fecha));

  function selectAll() {
    if (selected.size === pending.length) setSelected(new Set());
    else setSelected(new Set(pending.map(h => h.fecha)));
  }

  async function handleAddSelected() {
    if (selected.size === 0) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      const promises = Array.from(selected).map(fecha => {
        const holiday = holidays.find(h => h.fecha === fecha);
        return apiCreate('exceptions', {
          doctor_id: doctor.id,
          since_date: fecha,
          to_date: fecha,
          exception_type: 'feriado',
          description: holiday?.nombre || 'Feriado',
        });
      });
      await Promise.all(promises);
      setSuccess(`${selected.size} feriado(s) agregados`);
      setSelected(new Set());
      loadData();
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  const TIPO_COLORS: Record<string, string> = {
    inamovible: 'bg-red-50 text-red-700',
    trasladable: 'bg-amber-50 text-amber-700',
    puente: 'bg-blue-50 text-blue-700',
  };

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const already = holidays.filter(h => existingDates.has(h.fecha));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">Feriados nacionales (fuente: argentinadatos.com)</p>
        <div className="flex items-center gap-1">
          <button onClick={() => setYear(y => y - 1)} className={`${btnClass} text-gray-500 hover:bg-gray-100`}>&larr;</button>
          <span className="text-xs font-bold text-gray-700 w-12 text-center">{year}</span>
          <button onClick={() => setYear(y => y + 1)} className={`${btnClass} text-gray-500 hover:bg-gray-100`}>&rarr;</button>
        </div>
      </div>

      {error && <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">{error}</div>}
      {success && <div className="p-2 rounded-lg bg-green-50 border border-green-200 text-xs text-green-700">{success}</div>}

      {pending.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <button onClick={selectAll} className="text-[10px] text-teal-600 hover:underline">
              {selected.size === pending.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </button>
            {selected.size > 0 && (
              <button onClick={handleAddSelected} disabled={saving} className={`${btnClass} bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50`}>
                {saving ? 'Agregando...' : `Agregar ${selected.size} feriado(s)`}
              </button>
            )}
          </div>

          {pending.map(h => (
            <label key={h.fecha} className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${selected.has(h.fecha) ? 'border-teal-300 bg-teal-50/40' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
              <input type="checkbox" checked={selected.has(h.fecha)} onChange={() => toggleSelect(h.fecha)} className="w-4 h-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">{h.nombre}</div>
                <div className="text-xs text-gray-500">{formatDateStr(h.fecha)}</div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${TIPO_COLORS[h.tipo] || 'bg-gray-100 text-gray-600'}`}>
                {h.tipo}
              </span>
            </label>
          ))}
        </>
      )}

      {already.length > 0 && (
        <div className="pt-2">
          <p className="text-[10px] text-gray-400 uppercase font-semibold mb-2">Ya cargados</p>
          {already.map(h => (
            <div key={h.fecha} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-2 mb-1">
              <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              <span className="text-xs text-gray-600">{h.nombre}</span>
              <span className="text-xs text-gray-400">{formatDateStr(h.fecha)}</span>
            </div>
          ))}
        </div>
      )}

      {holidays.length === 0 && (
        <div className="text-center py-6 text-gray-400 text-xs">No se encontraron feriados para {year}</div>
      )}
    </div>
  );
}

// ─── Main Editor ───
const TABS: { key: Tab; label: string }[] = [
  { key: 'schedule', label: 'Horarios' },
  { key: 'disabled', label: 'Dias Deshab.' },
  { key: 'special', label: 'Dias Excep.' },
  { key: 'holidays', label: 'Feriados' },
];

export default function DoctorScheduleEditor({ doctor, onClose, onSaved }: Props) {
  const [tab, setTab] = useState<Tab>('schedule');
  const doctorName = doctor.data?.name || 'Profesional';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 sm:pt-10 px-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-xl max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-3 rounded-t-2xl z-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">{doctorName}</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex gap-1">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === t.key ? 'bg-teal-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {tab === 'schedule' && <ScheduleTab doctor={doctor} onSaved={onSaved} />}
          {tab === 'disabled' && <DisabledDaysTab doctor={doctor} />}
          {tab === 'special' && <SpecialDaysTab doctor={doctor} />}
          {tab === 'holidays' && <HolidaysTab doctor={doctor} />}
        </div>
      </div>
    </div>
  );
}
