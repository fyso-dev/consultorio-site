import { useState } from 'react';
import { apiDelete, getRecordDisplayName } from '../../lib/api-client';

interface Props {
  entityName: string;
  record: any;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteConfirm({ entityName, record, onClose, onDeleted }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    setDeleting(true);
    try {
      await apiDelete(entityName, record.id);
      onDeleted();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar');
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40" />
      <div className="relative bg-white rounded-2xl shadow-xl border border-[#e7e5e4] w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-[#1c1917] mb-2">Eliminar registro</h2>
        <p className="text-sm text-[#57534e] mb-4">
          Estas seguro que deseas eliminar <strong>{getRecordDisplayName(record)}</strong>? Esta accion no se puede deshacer.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
        )}

        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-[#57534e] hover:bg-[#f5f5f4] transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}
