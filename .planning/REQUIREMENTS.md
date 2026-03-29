# Requirements — Consultorio

## REQ-01: Corregir nombres de entidad y campos — Agenda

**Problema:** `Agenda.tsx`, `AtenderModal.tsx`, `PatientModal.tsx` usan nombres incorrectos.

**Mapeo de entidad:**
- `turnos` → `appointments`

**Mapeo de campos en appointments:**
| Frontend (roto) | Backend real |
|----------------|-------------|
| `fecha` | `date` |
| `hora` | `time` |
| `paciente_id` | `patient_id` |
| `profesional_id` | `doctor_id` |
| `servicio_id` | `service_id` |
| `obra_social_id` | `network_id` |
| `estado` | `status` |
| `notas` | `appointment_notes` |
| `notas_medicas` | `consultation_notes` |
| `archivos` | ❌ no existe (remover) |

**Estado de agenda:** El frontend usa `pendiente/confirmado/en_sala/atendido/cancelado/ausente/bloqueado` pero el backend describe `Pendiente/Presente/Completado/Cancelado/Bloqueado`. Adaptar las opciones o mantener los valores del frontend como strings libres.

**Doctor name:** frontend usa `doc.data?.first_name + last_name` → backend tiene un solo campo `name`

**Slots del scheduling API:** La interfaz `Slot { fecha, hora, duracion, profesional_id }` — verificar si el API devuelve estos mismos nombres o inglés.

**Archivos:** Se usa un campo `archivos` (JSON array de base64) que no existe en el backend. **Remover** esta funcionalidad de AtenderModal y PatientModal por ahora.

**Priority:** P0 (la app no funciona sin esto)

---

## REQ-02: Corregir entities.ts y patientsConfig

**Problema:** `entities.ts` tiene configs con nombres incorrectos.

**turnosConfig** — campo names incorrectos:
- `fecha` → `date`, `hora` → `time`
- `paciente_id` → `patient_id`, `profesional_id` → `doctor_id`
- `servicio_id` → `service_id`, `obra_social_id` → `network_id`
- `estado` → `status`, `notas` → `appointment_notes`, `notas_medicas` → `consultation_notes`
- Remover `duracion`, `origen` (no existen)
- Agregar `overtime` (boolean)

**patientsConfig** — campo names incorrectos:
- `birth_date` → `birthdate`
- `gender` → `sex`
- `notes` → `medical_record`
- Remover `network_number`, `location` (no existen en backend)
- Agregar `warnings`, `contact_details`, `medical_record`, `prof_cabecera`

**doctorsConfig** — completamente incorrecto:
- `first_name` + `last_name` → `name` (campo único)
- `online_booking` → `online`
- `slot_duration` → remover (embebido por día)
- Agregar `specialization`, `nota_publica`, `dias_turnos`

**Remover** los configs de `horarios`, `excepciones_horario` (no existen como entidades separadas)

**Priority:** P0

---

## REQ-03: Corregir DoctorScheduleEditor — Tab Horarios Semanales

**Problema:** Usa entidad `horarios` que no existe. El horario está embebido en el doctor.

**Estructura del backend:** El doctor tiene campos `{day}_{part}_enabled`, `{day}_{part}_from`, `{day}_{part}_to`, `{day}_{part}_period` donde:
- day: `mon`, `tue`, `wed`, `thu`, `fri`, `sat`
- part: `morn`, `after`

**Cambios requeridos:**
- Leer el schedule leyendo el doctor con `apiList('doctors')` (ya cargado)
- Guardar con `apiUpdate('doctors', doctor.id, { mon_morn_enabled, mon_morn_from, ... })`
- La UI pasa de "múltiples períodos por día con rrule" a "mañana/tarde por día"
- Eliminar toda la lógica de rrules

**Priority:** P1

---

## REQ-04: Corregir DoctorScheduleEditor — Tabs Días Deshabilitados y Especiales

**Problema:** Usa entidad `excepciones_horario` que no existe.

**Mapeo de entidades:**
- `excepciones_horario` con `tipo='bloqueo'` → entidad `exceptions`
- `excepciones_horario` con `tipo='horario_especial'` → entidad `special_schedules`
- `excepciones_horario` con `tipo='bloqueo'` (feriados) → entidad `exceptions`

**Mapeo de campos para `exceptions`:**
| Frontend (roto) | Backend real |
|----------------|-------------|
| `profesional_id` | `doctor_id` |
| `fecha_desde` | `since_date` |
| `fecha_hasta` | `to_date` |
| `hora_desde` | `since_time` |
| `hora_hasta` | `to_time` |
| `tipo` | `exception_type` |
| `descripcion` | `description` |
| `todo_el_dia` | ❌ no existe (inferir de since_time vacío) |

**Mapeo de campos para `special_schedules`:**
| Frontend (roto) | Backend real |
|----------------|-------------|
| `profesional_id` | `doctor_id` |
| `fecha` | `date` |
| `hora_desde` | `start_time` |
| `hora_hasta` | `end_time` |
| `duracion_turno` | `period` |
| `turno` | `date_part` (morning/afternoon) |

**Priority:** P1

---

## REQ-05: Corregir DoctorsPage

**Problema:** Muestra `first_name + last_name` pero backend tiene campo único `name`.

**Cambios:**
- Reemplazar `doc.data?.first_name + doc.data?.last_name` → `doc.data?.name`
- Reemplazar `online_booking` → `online`
- Remover `slot_duration` del display de días (no es relevante)
- Mostrar `specialization` del doctor

**Priority:** P1

---

## REQ-06: Crear entidad site_config en Fyso

**Problema:** El Layout público y SiteConfigEditor cargan config desde entidad `site_config` que no existe en Fyso.

**Entidad a crear:**
- `site_config` con campos: `clinic_name` (text), `clinic_slogan` (text), `hero_title` (text), `hero_subtitle` (text), `cta_title` (text), `cta_subtitle` (text), `address` (text), `phone` (text), `email` (text), `whatsapp` (text), `hours_weekday` (text), `hours_saturday` (text), `hours_sunday` (text), `emergency_hours` (text), `google_maps_url` (text)

**Seed:** Crear 1 registro con valores por defecto del consultorio (reemplazar defaults de veterinaria)

**Priority:** P1

---

## REQ-07: Corregir SiteConfigEditor — Defaults

**Problema:** Los defaults hardcodeados son para una veterinaria (`Tu veterinaria de confianza`, etc.)

**Cambios:**
- Cambiar defaults a textos de consultorio médico
- Asegurarse que guarda correctamente en `site_config` entity

**Priority:** P1

---

## REQ-08: Página /turnos — Booking público

**Problema:** La página `/turnos` no existe pero está linkada desde el nav y el home.

**Funcionalidad:**
1. Seleccionar profesional (doctors con `online=true`)
2. Seleccionar fecha en calendario
3. Ver slots disponibles (via `apiGetAvailableSlots`)
4. Ingresar datos del paciente o buscar por DNI
5. Confirmar turno (crear appointment con status='pendiente')
6. Pantalla de confirmación con resumen

**Priority:** P0 (está linkado desde el sitio y da 404)

---

## REQ-09: PatientModal — Corregir campos

**Problema:** El form de edición de paciente usa campos que no coinciden.

**Cambios:**
- `birth_date` → `birthdate`
- `gender` → `sex`
- `notes` → `medical_record`
- Remover `network_number`, `location` del form (no existen en backend)
- Actualizar historial de turnos: `turnos` → `appointments`, todos los campos de fecha/hora/estado
- Remover referencia a `archivos`

**Priority:** P1
