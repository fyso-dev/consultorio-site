import { useState, useEffect, useCallback } from 'react';
import { apiList, apiCreate, apiUpdate, apiDelete } from '../../lib/api-client';

interface Props {
  doctor: any;
  onClose: () => void;
  onSaved: () => void;
}

type Tab = 'schedule' | 'disabled' | 'special' | 'holidays';

const DAYS = [
  { key: 'MO', label: 'Lunes', short: 'L' },
  { key: 'TU', label: 'Martes', short: 'M' },
  { key: 'WE', label: 'Miercoles', short: 'X' },
  { key: 'TH', label: 'Jueves', short: 'J' },
  { key: 'FR', label: 'Viernes', short: 'V' },
  { key: 'SA', label: 'Sabado', short: 'S' },
  { key: 'SU', label: 'Domingo', short: 'D' },
];

function rruleToDays(rrule: string): string[] {
  const match = rrule?.match(/BYDAY=([A-Z,]+)/);
  return match ? match[1].split(',') : [];
}

function dayToRrule(byday: string): string {
  return `FREQ=WEEKLY;BYDAY=${byday}`;
}

function generateTimeSlots(step: number): string[] {
  const slots: string[] = [];
  for (let h = 6; h <= 23; h++) {
    for (let m = 0; m < 60; m += step) {
      if (h === 23 && m > 0) break;
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
}

function formatDateStr(d: string): string {
  if (!d) return '';
  const clean = d.split('T')[0];
  const [y, m, day] = clean.split('-');
  if (!y || !m || !day) return clean;
  return `${day}/${m}/${y}`;
}

function slotsAfter(slots: string[], after: string): string[] {
  if (!after) return slots;
  const idx = slots.indexOf(after);
  if (idx === -1) return slots;
  return slots.slice(idx + 1);
}

const selectClass = "w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white disabled:opacity-30 disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none cursor-pointer";
const btnClass = "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors";

// ─── Tab: Horarios Semanales (reads/writes `horarios` entity) ───
interface DayConfig {
  enabled: boolean;
  records: { id?: string; hora_inicio: string; hora_fin: string; duracion_turno: number; activo: boolean }[];
}

function ScheduleTab({ doctor, timeSlots, onSaved }: { doctor: any; timeSlots: string[]; onSaved: () => void }) {
  const [schedule, setSchedule] = useState<Record<string, DayConfig>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const slotDuration = doctor.data?.slot_duration || 15;

  const loadHorarios = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiList('horarios');
      const mine = data.filter((r: any) => r.data?.profesional_id === doctor.id);

      // Build a map: byday code -> records that include that day
      const dayRecords: Record<string, any[]> = {};
      for (const rec of mine) {
        const days = rruleToDays(rec.data?.rrule || '');
        for (const d of days) {
          if (!dayRecords[d]) dayRecords[d] = [];
          dayRecords[d].push(rec);
        }
      }

      const sched: Record<string, DayConfig> = {};
      for (const day of DAYS) {
        const recs = (dayRecords[day.key] || [])
          .sort((a: any, b: any) => (a.data?.hora_inicio || '').localeCompare(b.data?.hora_inicio || ''));

        if (recs.length > 0) {
          sched[day.key] = {
            enabled: recs.some((r: any) => r.data?.activo !== false),
            records: recs.map((r: any) => ({
              id: r.id,
              hora_inicio: r.data?.hora_inicio || '08:00',
              hora_fin: r.data?.hora_fin || '12:00',
              duracion_turno: r.data?.duracion_turno || slotDuration,
              activo: r.data?.activo !== false,
            })),
          };
        } else {
          sched[day.key] = {
            enabled: false,
            records: [{ hora_inicio: '08:00', hora_fin: '12:00', duracion_turno: slotDuration, activo: true }],
          };
        }
      }
      setSchedule(sched);
    } catch (err) {
      console.error('Error loading horarios:', err);
    } finally {
      setLoading(false);
    }
  }, [doctor.id, slotDuration]);

  useEffect(() => { loadHorarios(); }, [loadHorarios]);

  function toggleDay(dayKey: string) {
    setSchedule(prev => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], enabled: !prev[dayKey].enabled },
    }));
  }

  function updateRecord(dayKey: string, idx: number, field: string, value: any) {
    setSchedule(prev => {
      const day = { ...prev[dayKey] };
      const recs = [...day.records];
      recs[idx] = { ...recs[idx], [field]: value };
      return { ...prev, [dayKey]: { ...day, records: recs } };
    });
  }

  function addPeriod(dayKey: string) {
    setSchedule(prev => {
      const day = { ...prev[dayKey] };
      const last = day.records[day.records.length - 1];
      return {
        ...prev,
        [dayKey]: {
          ...day,
          records: [...day.records, { hora_inicio: last?.hora_fin || '14:00', hora_fin: '18:00', duracion_turno: slotDuration, activo: true }],
        },
      };
    });
  }

  function removePeriod(dayKey: string, idx: number) {
    setSchedule(prev => {
      const day = { ...prev[dayKey] };
      return { ...prev, [dayKey]: { ...day, records: day.records.filter((_, i) => i !== idx) } };
    });
  }

  function copyToAll(sourceKey: string) {
    const source = schedule[sourceKey];
    setSchedule(prev => {
      const next = { ...prev };
      for (const day of DAYS) {
        if (day.key !== sourceKey) {
          next[day.key] = {
            enabled: source.enabled,
            records: source.records.map(r => ({ ...r, id: undefined })),
          };
        }
      }
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      // Get all existing horarios for this doctor
      const { data: existing } = await apiList('horarios');
      const myExisting = existing.filter((r: any) => r.data?.profesional_id === doctor.id);
      const existingIds = new Set(myExisting.map((r: any) => r.id));

      const keptIds = new Set<string>();
      const promises: Promise<any>[] = [];

      for (const day of DAYS) {
        const config = schedule[day.key];
        if (!config) continue;

        if (config.enabled) {
          for (const rec of config.records) {
            const payload = {
              profesional_id: doctor.id,
              rrule: dayToRrule(day.key),
              hora_inicio: rec.hora_inicio,
              hora_fin: rec.hora_fin,
              duracion_turno: rec.duracion_turno,
              activo: true,
            };

            if (rec.id && existingIds.has(rec.id)) {
              keptIds.add(rec.id);
              promises.push(apiUpdate('horarios', rec.id, payload));
            } else {
              promises.push(apiCreate('horarios', payload));
            }
          }
        }
        // If disabled, we don't create records; existing ones for this day will be deleted below
      }

      // Delete records that are no longer needed
      for (const ex of myExisting) {
        if (!keptIds.has(ex.id)) {
          promises.push(apiDelete('horarios', ex.id));
        }
      }

      await Promise.all(promises);
      setSuccess('Horarios guardados');
      onSaved();
      loadHorarios();
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-2">
      {error && <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">{error}</div>}
      {success && <div className="p-2 rounded-lg bg-green-50 border border-green-200 text-xs text-green-700">{success}</div>}

      {DAYS.map((day) => {
        const config = schedule[day.key];
        if (!config) return null;

        return (
          <div
            key={day.key}
            className={`rounded-lg border p-3 transition-colors ${
              config.enabled ? 'border-teal-200 bg-teal-50/30' : 'border-gray-100 bg-gray-50/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={() => toggleDay(day.key)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-[18px] bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-3.5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-[14px] after:w-[14px] after:transition-all peer-checked:bg-teal-500"></div>
                </label>
                <span className={`text-sm font-medium ${config.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                  {day.label}
                </span>
              </div>
              {config.enabled && (
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => copyToAll(day.key)} className="text-[10px] text-teal-600 hover:text-teal-700 hover:underline">
                    Copiar a todos
                  </button>
                </div>
              )}
            </div>

            {config.enabled && (
              <div className="space-y-1.5">
                {config.records.map((rec, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold w-14 shrink-0">
                      Turno {idx + 1}
                    </span>
                    <select value={rec.hora_inicio} onChange={e => updateRecord(day.key, idx, 'hora_inicio', e.target.value)} className={selectClass}>
                      {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <span className="text-gray-300 text-xs">a</span>
                    <select value={rec.hora_fin} onChange={e => updateRecord(day.key, idx, 'hora_fin', e.target.value)} className={selectClass}>
                      {slotsAfter(timeSlots, rec.hora_inicio).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {config.records.length > 1 && (
                      <button type="button" onClick={() => removePeriod(day.key, idx)} className="p-1 text-gray-400 hover:text-red-500">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    )}
                  </div>
                ))}
                {config.records.length < 3 && (
                  <button type="button" onClick={() => addPeriod(day.key)} className="text-[10px] text-teal-600 hover:underline mt-1">
                    + Agregar turno
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      <p className="text-[11px] text-gray-400 pt-1">
        Podes agregar multiples turnos por dia. Ej: 08:00-12:00 y 16:00-20:00.
      </p>

      <div className="flex justify-end pt-2">
        <button onClick={handleSave} disabled={saving} className={`${btnClass} bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50`}>
          {saving ? 'Guardando...' : 'Guardar horarios'}
        </button>
      </div>
    </div>
  );
}

// ─── Tab: Dias Deshabilitados (reads/writes `excepciones_horario` with tipo='bloqueo') ───
function DisabledDaysTab({ doctor, timeSlots }: { doctor: any; timeSlots: string[] }) {
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
      const { data } = await apiList('excepciones_horario');
      setRecords(data.filter((r: any) =>
        r.data?.profesional_id === doctor.id && r.data?.tipo === 'bloqueo'
      ));
    } catch (err) {
      console.error('Error loading excepciones_horario:', err);
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
      await apiCreate('excepciones_horario', {
        profesional_id: doctor.id,
        fecha_desde: dateFrom,
        fecha_hasta: dateTo,
        tipo: 'bloqueo',
        todo_el_dia: allDay,
        hora_desde: allDay ? '' : timeFrom,
        hora_hasta: allDay ? '' : timeTo,
        descripcion: description || 'Deshabilitado',
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
      await apiDelete('excepciones_horario', id);
      loadRecords();
    } catch (err) {
      console.error('Error deleting excepcion:', err);
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
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={selectClass} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} className="sr-only peer" />
              <div className="w-8 h-[18px] bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-3.5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-[14px] after:w-[14px] after:transition-all peer-checked:bg-teal-500"></div>
            </label>
            <span className="text-xs text-gray-700">Todo el dia</span>
          </div>

          {!allDay && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 uppercase font-semibold w-12 shrink-0">Rango</span>
              <select value={timeFrom} onChange={e => setTimeFrom(e.target.value)} className={selectClass}>
                <option value="">--</option>
                {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <span className="text-gray-300 text-xs">a</span>
              <select value={timeTo} onChange={e => setTimeTo(e.target.value)} className={selectClass}>
                <option value="">--</option>
                {slotsAfter(timeSlots, timeFrom).map(t => <option key={t} value={t}>{t}</option>)}
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
        return (
          <div key={rec.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
            <div>
              <div className="text-sm font-medium text-gray-900">
                {formatDateStr(d.fecha_desde) === formatDateStr(d.fecha_hasta) ? formatDateStr(d.fecha_desde) : `${formatDateStr(d.fecha_desde)} → ${formatDateStr(d.fecha_hasta)}`}
              </div>
              <div className="text-xs text-gray-500">
                {d.todo_el_dia || (!d.hora_desde && !d.hora_hasta) ? 'Todo el dia' : `${d.hora_desde} - ${d.hora_hasta}`}
                {d.descripcion && ` · ${d.descripcion}`}
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

// ─── Tab: Dias Excepcionales (reads/writes `excepciones_horario` with tipo='horario_especial') ───
function SpecialDaysTab({ doctor, timeSlots }: { doctor: any; timeSlots: string[] }) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [date, setDate] = useState('');
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');
  const [slotDuration, setSlotDuration] = useState(String(doctor.data?.slot_duration || 15));
  const [description, setDescription] = useState('');

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiList('excepciones_horario');
      setRecords(data.filter((r: any) =>
        r.data?.profesional_id === doctor.id && r.data?.tipo === 'horario_especial'
      ));
    } catch (err) {
      console.error('Error loading excepciones_horario:', err);
    } finally {
      setLoading(false);
    }
  }, [doctor.id]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  function resetForm() {
    setDate(''); setTimeFrom(''); setTimeTo('');
    setSlotDuration(String(doctor.data?.slot_duration || 15));
    setDescription(''); setShowForm(false); setError('');
  }

  async function handleAdd() {
    if (!date || !timeFrom || !timeTo) { setError('Completa fecha y horarios'); return; }

    setSaving(true); setError('');
    try {
      await apiCreate('excepciones_horario', {
        profesional_id: doctor.id,
        fecha_desde: date,
        fecha_hasta: date,
        tipo: 'horario_especial',
        todo_el_dia: false,
        hora_desde: timeFrom,
        hora_hasta: timeTo,
        duracion_turno: Number(slotDuration) || 15,
        descripcion: description || 'Horario especial',
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
      await apiDelete('excepciones_horario', id);
      loadRecords();
    } catch (err) {
      console.error('Error deleting excepcion:', err);
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
            <span className="text-[10px] text-gray-400 uppercase font-semibold w-12 shrink-0">Horario</span>
            <select value={timeFrom} onChange={e => setTimeFrom(e.target.value)} className={selectClass}>
              <option value="">--</option>
              {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <span className="text-gray-300 text-xs">a</span>
            <select value={timeTo} onChange={e => setTimeTo(e.target.value)} className={selectClass}>
              <option value="">--</option>
              {slotsAfter(timeSlots, timeFrom).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 uppercase font-semibold mb-1">Duracion turno (min)</label>
            <select value={slotDuration} onChange={e => setSlotDuration(e.target.value)} className={selectClass}>
              {[5, 10, 15, 20, 30, 45, 60].map(n => <option key={n} value={n}>{n} min</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 uppercase font-semibold mb-1">Descripcion (opcional)</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ej: Guardia sabado" className={selectClass} />
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
              <div className="text-sm font-medium text-gray-900">{formatDateStr(d.fecha_desde)}</div>
              <div className="text-xs text-gray-500">
                {d.hora_desde} - {d.hora_hasta} · {d.duracion_turno || 15} min
                {d.descripcion && ` · ${d.descripcion}`}
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

// ─── Tab: Feriados (reads/writes `excepciones_horario` with tipo='bloqueo') ───
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
      const [holidaysRes, excepcionesRes] = await Promise.all([
        fetch(`https://api.argentinadatos.com/v1/feriados/${year}`).then(r => r.json()),
        apiList('excepciones_horario'),
      ]);
      setHolidays(Array.isArray(holidaysRes) ? holidaysRes : []);

      const doctorExceptions = excepcionesRes.data.filter((r: any) => r.data?.profesional_id === doctor.id);
      const dates = new Set<string>();
      for (const exc of doctorExceptions) {
        const d = exc.data;
        if (d?.fecha_desde) dates.add(d.fecha_desde.split('T')[0]);
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

  function selectAll() {
    const pending = holidays.filter(h => !existingDates.has(h.fecha));
    if (selected.size === pending.length) setSelected(new Set());
    else setSelected(new Set(pending.map(h => h.fecha)));
  }

  async function handleAddSelected() {
    if (selected.size === 0) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      const promises = Array.from(selected).map(fecha => {
        const holiday = holidays.find(h => h.fecha === fecha);
        return apiCreate('excepciones_horario', {
          profesional_id: doctor.id,
          fecha_desde: fecha,
          fecha_hasta: fecha,
          tipo: 'bloqueo',
          todo_el_dia: true,
          hora_desde: '',
          hora_hasta: '',
          descripcion: holiday?.nombre || 'Feriado',
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

  const TIPO_LABELS: Record<string, string> = {
    inamovible: 'Inamovible', trasladable: 'Trasladable', puente: 'Puente',
  };
  const TIPO_COLORS: Record<string, string> = {
    inamovible: 'bg-red-50 text-red-700', trasladable: 'bg-amber-50 text-amber-700', puente: 'bg-blue-50 text-blue-700',
  };

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const pending = holidays.filter(h => !existingDates.has(h.fecha));
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
            <label
              key={h.fecha}
              className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                selected.has(h.fecha) ? 'border-teal-300 bg-teal-50/40' : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={selected.has(h.fecha)}
                onChange={() => toggleSelect(h.fecha)}
                className="w-4 h-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">{h.nombre}</div>
                <div className="text-xs text-gray-500">{formatDateStr(h.fecha)}</div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${TIPO_COLORS[h.tipo] || 'bg-gray-100 text-gray-600'}`}>
                {TIPO_LABELS[h.tipo] || h.tipo}
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
              <div className="flex-1 min-w-0">
                <span className="text-xs text-gray-600">{h.nombre}</span>
                <span className="text-xs text-gray-400 ml-2">{formatDateStr(h.fecha)}</span>
              </div>
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
  const slotDuration = doctor.data?.slot_duration || 15;
  const timeSlots = generateTimeSlots(slotDuration);
  const [tab, setTab] = useState<Tab>('schedule');

  const doctorName = `${doctor.data?.first_name || ''} ${doctor.data?.last_name || ''}`.trim() || 'Profesional';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 sm:pt-10 px-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-xl max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-3 rounded-t-2xl z-10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">{doctorName}</h2>
              <p className="text-xs text-gray-500">Turnos cada {slotDuration} min</p>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex gap-1">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  tab === t.key ? 'bg-teal-500 text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {tab === 'schedule' && <ScheduleTab doctor={doctor} timeSlots={timeSlots} onSaved={onSaved} />}
          {tab === 'disabled' && <DisabledDaysTab doctor={doctor} timeSlots={timeSlots} />}
          {tab === 'special' && <SpecialDaysTab doctor={doctor} timeSlots={timeSlots} />}
          {tab === 'holidays' && <HolidaysTab doctor={doctor} />}
        </div>
      </div>
    </div>
  );
}
