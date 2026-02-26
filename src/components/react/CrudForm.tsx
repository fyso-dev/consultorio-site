import { useState, useEffect } from 'react';
import type { EntityConfig, FieldConfig } from '../../lib/entity-config';
import { apiCreate, apiUpdate, getRecordDisplayName } from '../../lib/api-client';

interface Props {
  config: EntityConfig;
  record: any | null; // null = create
  lookups: Record<string, Record<string, any>>;
  onClose: () => void;
  onSaved: () => void;
}

export default function CrudForm({ config, record, lookups, onClose, onSaved }: Props) {
  const formFields = config.fields.filter(f => f.showInForm !== false);
  const isEdit = !!record;

  const [values, setValues] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    for (const f of formFields) {
      init[f.key] = record?.data?.[f.key] ?? (f.type === 'boolean' ? false : '');
    }
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function setValue(key: string, val: any) {
    setValues(prev => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Validate required
    for (const f of formFields) {
      if (f.required && (values[f.key] === '' || values[f.key] == null)) {
        setError(`${f.label} es requerido`);
        return;
      }
    }

    setSaving(true);
    try {
      const data: Record<string, any> = {};
      for (const f of formFields) {
        let val = values[f.key];
        if (f.type === 'number' || f.type === 'currency') {
          val = val === '' ? null : Number(val);
        }
        data[f.key] = val;
      }

      // Fyso requires a top-level 'name' field on every record
      if (!data.name) {
        const first = data.first_name || '';
        const last = data.last_name || '';
        if (first || last) {
          data.name = `${first} ${last}`.trim();
        } else {
          data.name = data[config.displayField] || 'Record';
        }
      }

      if (isEdit) {
        await apiUpdate(config.name, record.id, data);
      } else {
        await apiCreate(config.name, data);
      }
      onSaved();
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  function renderField(f: FieldConfig) {
    const val = values[f.key];
    const baseClass = "w-full px-3 py-2 rounded-lg border border-[#e7e5e4] text-sm focus:outline-none focus:ring-2 focus:ring-[#14b8a6] focus:border-transparent";

    if (f.type === 'select' && f.options) {
      return (
        <select value={val || ''} onChange={e => setValue(f.key, e.target.value)} className={baseClass}>
          <option value="">Seleccionar...</option>
          {f.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }

    if (f.type === 'relationship' && f.relation) {
      const relRecords = Object.values(lookups[f.relation.entity] || {});
      return (
        <select value={val || ''} onChange={e => setValue(f.key, e.target.value)} className={baseClass}>
          <option value="">Seleccionar...</option>
          {relRecords.map((r: any) => (
            <option key={r.id} value={r.id}>{getRecordDisplayName(r)}</option>
          ))}
        </select>
      );
    }

    if (f.type === 'boolean') {
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!val}
            onChange={e => setValue(f.key, e.target.checked)}
            className="w-4 h-4 rounded border-[#d6d3d1] text-[#14b8a6] focus:ring-[#14b8a6]"
          />
          <span className="text-sm text-[#44403c]">{val ? 'Si' : 'No'}</span>
        </label>
      );
    }

    if (f.type === 'longText') {
      return (
        <textarea
          value={val || ''}
          onChange={e => setValue(f.key, e.target.value)}
          rows={3}
          className={baseClass}
        />
      );
    }

    if (f.type === 'date') {
      const dateVal = val ? (typeof val === 'string' ? val.split('T')[0] : val) : '';
      return <input type="date" value={dateVal} onChange={e => setValue(f.key, e.target.value)} className={baseClass} />;
    }

    if (f.type === 'datetime') {
      const dtVal = val ? (typeof val === 'string' ? val.slice(0, 16) : val) : '';
      return <input type="datetime-local" value={dtVal} onChange={e => setValue(f.key, e.target.value)} className={baseClass} />;
    }

    const inputType = f.type === 'email' ? 'email' : (f.type === 'number' || f.type === 'currency') ? 'number' : 'text';
    return (
      <input
        type={inputType}
        value={val ?? ''}
        onChange={e => setValue(f.key, e.target.value)}
        step={f.type === 'currency' ? '0.01' : undefined}
        className={baseClass}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-20 px-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-2xl shadow-xl border border-[#e7e5e4] w-full max-w-lg max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-[#e7e5e4] px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1c1917]">
            {isEdit ? `Editar ${config.displayName}` : `Nuevo ${config.displayName}`}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#f5f5f4] text-[#78716c]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
          )}

          {formFields.map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-[#44403c] mb-1">
                {f.label} {f.required && <span className="text-red-500">*</span>}
              </label>
              {renderField(f)}
            </div>
          ))}

          <div className="flex items-center justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-[#57534e] hover:bg-[#f5f5f4] transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-[#14b8a6] text-white text-sm font-medium hover:bg-[#0d9488] transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
