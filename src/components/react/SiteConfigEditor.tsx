import { useEffect, useState } from 'react';
import { apiList, apiCreate, apiUpdate } from '../../lib/api-client';

interface SiteConfig {
  clinic_name: string;
  clinic_slogan: string;
  hero_title: string;
  hero_subtitle: string;
  cta_title: string;
  cta_subtitle: string;
  address: string;
  phone: string;
  email: string;
  whatsapp: string;
  hours_weekday: string;
  hours_saturday: string;
  hours_sunday: string;
  emergency_hours: string;
  google_maps_url: string;
}

const DEFAULTS: SiteConfig = {
  clinic_name: 'Consultorio',
  clinic_slogan: 'Tu salud, nuestra prioridad.',
  hero_title: 'Atencion medica de calidad',
  hero_subtitle: 'Contamos con profesionales especializados para cuidar tu salud. Pide tu turno online de forma facil y rapida.',
  cta_title: 'Necesitas un turno?',
  cta_subtitle: 'Reserva tu turno online o contactanos por WhatsApp. Estamos para ayudarte.',
  address: '',
  phone: '',
  email: '',
  whatsapp: '',
  hours_weekday: '8:00 - 20:00',
  hours_saturday: '9:00 - 14:00',
  hours_sunday: 'Cerrado',
  emergency_hours: '',
  google_maps_url: '',
};

const SECTIONS = [
  {
    title: 'General',
    fields: [
      { key: 'clinic_name', label: 'Nombre de la clinica', type: 'text' },
      { key: 'clinic_slogan', label: 'Slogan', type: 'text' },
    ],
  },
  {
    title: 'Hero (Pagina principal)',
    fields: [
      { key: 'hero_title', label: 'Titulo', type: 'text' },
      { key: 'hero_subtitle', label: 'Subtitulo', type: 'textarea' },
    ],
  },
  {
    title: 'Llamada a la accion (CTA)',
    fields: [
      { key: 'cta_title', label: 'Titulo', type: 'text' },
      { key: 'cta_subtitle', label: 'Subtitulo', type: 'text' },
    ],
  },
  {
    title: 'Contacto',
    fields: [
      { key: 'address', label: 'Direccion', type: 'text' },
      { key: 'phone', label: 'Telefono', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'whatsapp', label: 'WhatsApp (sin +, ej: 5491112345678)', type: 'text' },
    ],
  },
  {
    title: 'Horarios',
    fields: [
      { key: 'hours_weekday', label: 'Lunes a Viernes', type: 'text' },
      { key: 'hours_saturday', label: 'Sabados', type: 'text' },
      { key: 'hours_sunday', label: 'Domingos', type: 'text' },
      { key: 'emergency_hours', label: 'Emergencias', type: 'text' },
    ],
  },
  {
    title: 'Mapa',
    fields: [
      { key: 'google_maps_url', label: 'URL embed de Google Maps', type: 'textarea' },
    ],
  },
] as const;

export default function SiteConfigEditor() {
  const [form, setForm] = useState<SiteConfig>(DEFAULTS);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const { data } = await apiList('site_config');
      if (data.length > 0) {
        const record = data[0];
        setRecordId(record.id);
        const d = record.data || {};
        setForm({
          clinic_name: d.clinic_name || DEFAULTS.clinic_name,
          clinic_slogan: d.clinic_slogan || DEFAULTS.clinic_slogan,
          hero_title: d.hero_title || DEFAULTS.hero_title,
          hero_subtitle: d.hero_subtitle || DEFAULTS.hero_subtitle,
          cta_title: d.cta_title || DEFAULTS.cta_title,
          cta_subtitle: d.cta_subtitle || DEFAULTS.cta_subtitle,
          address: d.address || DEFAULTS.address,
          phone: d.phone || DEFAULTS.phone,
          email: d.email || DEFAULTS.email,
          whatsapp: d.whatsapp || DEFAULTS.whatsapp,
          hours_weekday: d.hours_weekday || DEFAULTS.hours_weekday,
          hours_saturday: d.hours_saturday || DEFAULTS.hours_saturday,
          hours_sunday: d.hours_sunday || DEFAULTS.hours_sunday,
          emergency_hours: d.emergency_hours || DEFAULTS.emergency_hours,
          google_maps_url: d.google_maps_url || DEFAULTS.google_maps_url,
        });
      }
    } catch (err) {
      console.error('Error loading site config:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      if (recordId) {
        await apiUpdate('site_config', recordId, form);
      } else {
        const result = await apiCreate('site_config', form);
        if (result?.id) setRecordId(result.id);
      }
      setMessage({ type: 'success', text: 'Configuracion guardada. Los cambios se veran en el proximo deploy del sitio.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: `Error al guardar: ${err.message}` });
    } finally {
      setSaving(false);
    }
  }

  function handleChange(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-6 h-6 border-2 border-[#14b8a6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="max-w-3xl space-y-6">
      {message && (
        <div
          className={`px-4 py-3 rounded-xl text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {SECTIONS.map((section) => (
        <div key={section.title} className="bg-white rounded-2xl border border-[#e7e5e4] shadow-sm p-5">
          <h2 className="text-lg font-bold text-[#1c1917] mb-4">{section.title}</h2>
          <div className="space-y-4">
            {section.fields.map((f) => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-[#57534e] mb-1">{f.label}</label>
                {f.type === 'textarea' ? (
                  <textarea
                    value={(form as any)[f.key] || ''}
                    onChange={(e) => handleChange(f.key, e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-[#d6d3d1] text-sm text-[#1c1917] focus:outline-none focus:ring-2 focus:ring-[#14b8a6]/20 focus:border-[#14b8a6] transition-colors resize-y"
                  />
                ) : (
                  <input
                    type="text"
                    value={(form as any)[f.key] || ''}
                    onChange={(e) => handleChange(f.key, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#d6d3d1] text-sm text-[#1c1917] focus:outline-none focus:ring-2 focus:ring-[#14b8a6]/20 focus:border-[#14b8a6] transition-colors"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-[#14b8a6] text-white font-semibold text-sm hover:bg-[#0d9488] transition-colors disabled:opacity-50 shadow-md shadow-[#14b8a6]/20"
        >
          {saving ? 'Guardando...' : 'Guardar configuracion'}
        </button>
      </div>
    </form>
  );
}
