# Roadmap — Consultorio

## Fase 1: Fix Core — Agenda funcional
**Goal:** Que la agenda cargue y guarde datos correctamente contra el backend real.
**Requirements:** REQ-01, REQ-02, REQ-08 (parcial — página /turnos básica)
**Archivos afectados:**
- `src/components/react/Agenda.tsx` — entity + field names
- `src/components/react/AtenderModal.tsx` — field names + remover archivos
- `src/components/react/PatientModal.tsx` — field names + remover archivos
- `src/lib/entities.ts` — turnosConfig, patientsConfig, doctorsConfig
- `src/pages/turnos.astro` — crear página básica (evitar 404)

**Dependencies:** Ninguna (solo frontend)
**Complejidad:** Alta (muchos archivos, muchos find & replace pero también lógica)
**Estado del slot API:** El scheduling API devuelve slots con campos `fecha`, `hora`, `profesional_id`, `duracion` según la interfaz. Verificar al ejecutar si los nombres coinciden o necesitan remapeo.

---

## Fase 2: Fix DoctorScheduleEditor + DoctorsPage
**Goal:** Que el editor de horarios de profesionales funcione con el backend real.
**Requirements:** REQ-03, REQ-04, REQ-05
**Archivos afectados:**
- `src/components/react/DoctorScheduleEditor.tsx` — reescribir tabs
- `src/components/react/DoctorsPage.tsx` — fix display de nombre

**Dependencies:** Fase 1 (para tener el contexto correcto de doctor.data.name)
**Complejidad:** Muy alta (reescritura completa del ScheduleTab)

**Plan para ScheduleTab:**
- UI: 6 días (Lun-Sab), cada uno con toggle y 2 bloques: Mañana / Tarde
- Cada bloque tiene: habilitado, hora desde, hora hasta
- La duración del turno (`period`) se setea por bloque desde el doctor (usar un campo de duración en el form)
- Guardar: `apiUpdate('doctors', doctor.id, { mon_morn_enabled, mon_morn_from, mon_morn_to, mon_morn_period, mon_after_enabled, ... })`

---

## Fase 3: site_config entity + SiteConfigEditor fix
**Goal:** Que la configuración del sitio funcione end-to-end.
**Requirements:** REQ-06, REQ-07
**Acciones:**
- Crear entidad `site_config` en Fyso via MCP (15 campos text)
- Publicar la entidad
- Crear 1 registro seed con datos del consultorio
- Corregir defaults en `SiteConfigEditor.tsx`

**Dependencies:** Ninguna (backend Fyso + frontend independiente)
**Complejidad:** Baja (MCP ops + pequeño fix de UI)

---

## Fase 4: Página /turnos — Booking público completo
**Goal:** Que los pacientes puedan reservar turnos desde el sitio público.
**Requirements:** REQ-08
**Archivos:**
- `src/pages/turnos.astro` — página astro
- `src/components/react/TurnosPage.tsx` — componente principal (nuevo)

**Flujo:**
1. Select profesional (doctors con online=true)
2. Calendario de fechas disponibles
3. Grid de slots disponibles del día seleccionado
4. Form de datos del paciente (nombre, apellido, DNI, teléfono)
5. Crear appointment (status='pendiente')
6. Pantalla de confirmación

**Dependencies:** Fase 1 (appointments entity correcta), Fase 3 (site_config para personalización)
**Complejidad:** Alta (nuevo componente completo)
