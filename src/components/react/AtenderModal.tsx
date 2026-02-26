import { useState, useEffect, useRef } from 'react';
import { apiUpdate, apiList, field, getRecordDisplayName } from '../../lib/api-client';

const estadoBadge: Record<string, { bg: string; text: string; label: string }> = {
  pendiente: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Pendiente' },
  confirmado: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Confirmado' },
  en_sala: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'En sala' },
  atendido: { bg: 'bg-green-50', text: 'text-green-700', label: 'Atendido' },
  cancelado: { bg: 'bg-red-50', text: 'text-red-600', label: 'Cancelado' },
  ausente: { bg: 'bg-gray-50', text: 'text-gray-500', label: 'Ausente' },
};

interface Archivo {
  name: string;
  type: string;
  data: string; // base64
  size: number;
}

interface AtenderModalProps {
  turno: any;
  patient: any;
  network: any;
  doctorsLookup: Record<string, any>;
  onClose: () => void;
  onTurnoUpdated: (turnoId: string, data: Record<string, any>) => void;
}

export default function AtenderModal({ turno, patient, network, doctorsLookup, onClose, onTurnoUpdated }: AtenderModalProps) {
  const [notasMedicas, setNotasMedicas] = useState(field(turno, 'notas_medicas') || '');
  const [archivos, setArchivos] = useState<Archivo[]>(() => {
    try { return JSON.parse(field(turno, 'archivos') || '[]'); } catch { return []; }
  });
  const [saving, setSaving] = useState(false);
  const [historial, setHistorial] = useState<any[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const doctorId = field(turno, 'profesional_id');
  const doctor = doctorsLookup[doctorId];

  useEffect(() => {
    loadHistorial();
  }, []);

  async function loadHistorial() {
    if (!patient?.id) return;
    setLoadingHistorial(true);
    try {
      const res = await apiList('turnos', { limit: '200' });
      const patientTurnos = res.data
        .filter((t: any) =>
          field(t, 'paciente_id') === patient.id &&
          field(t, 'profesional_id') === doctorId &&
          t.id !== turno.id
        )
        .sort((a: any, b: any) => {
          const fa = field(a, 'fecha') || '';
          const fb = field(b, 'fecha') || '';
          return fb.localeCompare(fa);
        })
        .slice(0, 10);
      setHistorial(patientTurnos);
    } catch (err) {
      console.error('Error loading historial:', err);
    } finally {
      setLoadingHistorial(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} es muy grande (max 5MB)`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setArchivos(prev => [...prev, {
          name: file.name,
          type: file.type,
          data: base64,
          size: file.size,
        }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  }

  function removeArchivo(idx: number) {
    setArchivos(prev => prev.filter((_, i) => i !== idx));
  }

  function openArchivo(arch: Archivo) {
    const byteChars = atob(arch.data);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
    const blob = new Blob([new Uint8Array(byteNumbers)], { type: arch.type });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function getFileIcon(type: string): string {
    if (type.startsWith('image/')) return '🖼';
    if (type === 'application/pdf') return '📄';
    return '📎';
  }

  async function handleSave() {
    setSaving(true);
    try {
      const data: Record<string, any> = {
        notas_medicas: notasMedicas,
        estado: 'atendido',
      };
      if (archivos.length > 0) {
        data.archivos = JSON.stringify(archivos);
      }
      await apiUpdate('turnos', turno.id, data);
      onTurnoUpdated(turno.id, data);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  // Get archivos from historial turnos
  function getHistorialArchivos(t: any): Archivo[] {
    try { return JSON.parse(field(t, 'archivos') || '[]'); } catch { return []; }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Atender Paciente</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          {/* Patient info bar */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <span className="font-medium text-gray-900">
              {patient ? `${patient.data?.first_name || ''} ${patient.data?.last_name || ''}`.trim() : '-'}
            </span>
            {patient?.data?.phone && (
              <span className="text-gray-500">Tel: {patient.data.phone}</span>
            )}
            {patient?.data?.email && (
              <span className="text-gray-500">{patient.data.email}</span>
            )}
            {network && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                {network.data?.name || getRecordDisplayName(network)}
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Notas de mesa de entrada (read-only) */}
          {field(turno, 'notas') && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-xs font-medium text-amber-700 mb-1">Notas de recepcion</p>
              <p className="text-sm text-amber-900">{field(turno, 'notas')}</p>
            </div>
          )}

          {/* Notas medicas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notas de la consulta</label>
            <textarea
              value={notasMedicas}
              onChange={e => setNotasMedicas(e.target.value)}
              rows={6}
              placeholder="Escribir notas de la consulta..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-y"
            />
          </div>

          {/* Archivos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Archivos adjuntos</label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
            {archivos.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {archivos.map((arch, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm">
                    <span>{getFileIcon(arch.type)}</span>
                    <button onClick={() => openArchivo(arch)} className="flex-1 text-left text-teal-700 hover:underline truncate">
                      {arch.name}
                    </button>
                    <span className="text-xs text-gray-400 shrink-0">{formatFileSize(arch.size)}</span>
                    <button onClick={() => removeArchivo(idx)} className="text-gray-400 hover:text-red-500 shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-dashed border-gray-300 text-gray-500 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50/50 transition-colors"
            >
              + Adjuntar archivo
            </button>
            <p className="text-xs text-gray-400 mt-1">Imagenes, PDF, documentos. Max 5MB por archivo.</p>
          </div>

          {/* Historial con este medico */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Historial con {doctor ? getRecordDisplayName(doctor) : 'este profesional'}
            </h3>
            {loadingHistorial ? (
              <div className="flex items-center py-4">
                <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                <span className="ml-2 text-xs text-gray-400">Cargando...</span>
              </div>
            ) : historial.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">Sin consultas anteriores con este profesional</p>
            ) : (
              <div className="space-y-3">
                {historial.map(t => {
                  const estado = field(t, 'estado') || 'pendiente';
                  const badge = estadoBadge[estado] || estadoBadge.pendiente;
                  const hArchivos = getHistorialArchivos(t);
                  return (
                    <div key={t.id} className="border border-gray-100 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500">{field(t, 'fecha')?.split('T')[0] || '-'}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>{badge.label}</span>
                      </div>
                      {field(t, 'notas_medicas') && (
                        <p className="text-sm text-gray-700 mt-1">{field(t, 'notas_medicas')}</p>
                      )}
                      {hArchivos.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {hArchivos.map((a, i) => (
                            <button key={i} onClick={() => openArchivo(a)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-xs text-teal-700 hover:bg-teal-50">
                              {getFileIcon(a.type)} {a.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar y Completar Cita'}
          </button>
        </div>
      </div>
    </div>
  );
}
