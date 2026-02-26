import type { EntityConfig, FieldConfig } from '../../lib/entity-config';
import { formatDate, formatDateTime, formatPrice, getRecordDisplayName } from '../../lib/api-client';

interface Props {
  config: EntityConfig;
  records: any[];
  lookups: Record<string, Record<string, any>>;
  search: string;
  onSearch: (q: string) => void;
  onNew: () => void;
  onEdit: (record: any) => void;
  onDelete: (record: any) => void;
}

function renderCell(record: any, f: FieldConfig, lookups: Record<string, Record<string, any>>): string {
  const val = record?.data?.[f.key];
  if (val == null || val === '') return '-';

  if (f.type === 'relationship' && f.relation) {
    const related = lookups[f.relation.entity]?.[val];
    return related ? getRecordDisplayName(related) : val;
  }
  if (f.type === 'date') return formatDate(val);
  if (f.type === 'datetime') return formatDateTime(val);
  if (f.type === 'currency') return formatPrice(val);
  if (f.type === 'boolean') return val ? 'Si' : 'No';
  if (typeof val === 'string' && val.length > 60) return val.slice(0, 60) + '...';
  return String(val);
}

export default function CrudTable({ config, records, lookups, search, onSearch, onNew, onEdit, onDelete }: Props) {
  const tableCols = config.fields.filter(f => f.showInTable !== false);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#1c1917]">{config.displayNamePlural}</h1>
          <p className="text-sm text-[#78716c]">{records.length} registros</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={e => onSearch(e.target.value)}
            className="flex-1 sm:w-56 px-3 py-2 rounded-lg border border-[#e7e5e4] text-sm focus:outline-none focus:ring-2 focus:ring-[#14b8a6] focus:border-transparent"
          />
          <button
            onClick={onNew}
            className="px-4 py-2 rounded-lg bg-[#14b8a6] text-white text-sm font-medium hover:bg-[#0d9488] transition-colors whitespace-nowrap"
          >
            + Nuevo
          </button>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-[#e7e5e4] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e7e5e4] bg-[#fafaf9]">
                {tableCols.map(f => (
                  <th key={f.key} className="text-left px-4 py-3 text-xs font-semibold text-[#78716c] uppercase tracking-wider">
                    {f.label}
                  </th>
                ))}
                <th className="w-24 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f5f4]">
              {records.map(rec => (
                <tr key={rec.id} className="hover:bg-[#fafaf9] transition-colors">
                  {tableCols.map(f => (
                    <td key={f.key} className="px-4 py-3 text-sm text-[#44403c] max-w-xs truncate">
                      {renderCell(rec, f, lookups)}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEdit(rec)}
                        className="p-1.5 rounded-lg text-[#78716c] hover:text-[#14b8a6] hover:bg-[#f0fdfa] transition-colors"
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button
                        onClick={() => onDelete(rec)}
                        className="p-1.5 rounded-lg text-[#78716c] hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Eliminar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {records.length === 0 && (
          <div className="p-8 text-center text-[#a8a29e]">No hay registros</div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {records.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center text-[#a8a29e] border border-[#e7e5e4]">No hay registros</div>
        )}
        {records.map(rec => (
          <div key={rec.id} className="bg-white rounded-xl p-4 shadow-sm border border-[#e7e5e4]">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-[#1c1917]">
                {renderCell(rec, tableCols[0], lookups)}
              </h3>
              <div className="flex items-center gap-1">
                <button onClick={() => onEdit(rec)} className="p-1.5 rounded-lg text-[#78716c] hover:text-[#14b8a6]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button onClick={() => onDelete(rec)} className="p-1.5 rounded-lg text-[#78716c] hover:text-red-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
            <div className="space-y-1">
              {tableCols.slice(1).map(f => (
                <p key={f.key} className="text-sm text-[#57534e]">
                  <span className="text-[#a8a29e]">{f.label}:</span> {renderCell(rec, f, lookups)}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
