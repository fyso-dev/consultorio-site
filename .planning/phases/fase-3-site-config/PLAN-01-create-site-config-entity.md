# Plan 01 — Crear entidad site_config en Fyso + seed + fix editor

## Goal
Crear la entidad `site_config` en Fyso, publicarla, sembrar un registro inicial, y corregir el SiteConfigEditor para que use textos de consultorio médico (no veterinaria).

## Must Haves
- Entidad `site_config` existe y está publicada en Fyso
- Existe 1 registro con datos reales del consultorio
- El Layout público carga los datos correctamente
- El SiteConfigEditor usa defaults de consultorio médico (no veterinaria)

## MCP Operations

### Op 1: Crear entidad site_config
```
generate_entity({
  name: 'site_config',
  displayName: 'Configuracion del Sitio',
  description: 'Configuracion publica del sitio web del consultorio',
  fields: [
    { name: 'Nombre del Consultorio', fieldKey: 'clinic_name', type: 'text' },
    { name: 'Slogan', fieldKey: 'clinic_slogan', type: 'text' },
    { name: 'Hero Titulo', fieldKey: 'hero_title', type: 'text' },
    { name: 'Hero Subtitulo', fieldKey: 'hero_subtitle', type: 'text' },
    { name: 'CTA Titulo', fieldKey: 'cta_title', type: 'text' },
    { name: 'CTA Subtitulo', fieldKey: 'cta_subtitle', type: 'text' },
    { name: 'Direccion', fieldKey: 'address', type: 'text' },
    { name: 'Telefono', fieldKey: 'phone', type: 'text' },
    { name: 'Email', fieldKey: 'email', type: 'text' },
    { name: 'WhatsApp', fieldKey: 'whatsapp', type: 'text' },
    { name: 'Horario Semana', fieldKey: 'hours_weekday', type: 'text' },
    { name: 'Horario Sabado', fieldKey: 'hours_saturday', type: 'text' },
    { name: 'Horario Domingo', fieldKey: 'hours_sunday', type: 'text' },
    { name: 'Emergencias', fieldKey: 'emergency_hours', type: 'text' },
    { name: 'Google Maps URL', fieldKey: 'google_maps_url', type: 'text' },
  ]
})
```

### Op 2: Publicar entidad
```
publish_entity({ entityName: 'site_config' })
```

### Op 3: Crear registro seed
```
create_record('site_config', {
  clinic_name: 'Consultorio',
  clinic_slogan: 'Tu consultorio de confianza. Turnos online las 24 horas.',
  hero_title: 'Tu salud en las mejores manos',
  hero_subtitle: 'Gestionamos tus turnos de manera simple y rapida. Reserva online en cualquier momento.',
  cta_title: 'Necesitas un turno?',
  cta_subtitle: 'Reserva tu turno online o contactanos por WhatsApp. Estamos para ayudarte.',
  address: 'Av. Corrientes 1234, CABA, Buenos Aires',
  phone: '(011) 1234-5678',
  email: 'info@consultorio.com',
  whatsapp: '5491112345678',
  hours_weekday: '8:00 - 20:00',
  hours_saturday: '9:00 - 14:00',
  hours_sunday: 'Cerrado',
  emergency_hours: '24 horas',
  google_maps_url: 'https://www.google.com/maps/embed?...'
})
```

## Frontend Fix

### Fix SiteConfigEditor.tsx — defaults
<action>
En `src/components/react/SiteConfigEditor.tsx`:
- Cambiar `clinic_slogan` default: `'Tu veterinaria de confianza...'` → `'Tu consultorio de confianza. Turnos online las 24 horas.'`
- Cambiar `hero_title` default: `'Tu mascota merece el mejor cuidado'` → `'Tu salud en las mejores manos'`
- Cambiar `hero_subtitle` default: texto de veterinaria → texto de consultorio médico
- Cambiar `cta_title` y `cta_subtitle` default: de veterinaria a consultorio
- Cambiar `cta_subtitle` default WhatsApp message: de mascotas a consultas
</action>

<verify>
1. `list_entities()` incluye `site_config` con status `published`
2. `query_records('site_config')` retorna 1 registro con `clinic_name`
3. El Layout público carga la config y actualiza los textos del sitio
4. SiteConfigEditor carga y muestra los datos correctos
</verify>
