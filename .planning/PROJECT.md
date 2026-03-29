# Consultorio — Sistema de Gestión y Turnos Online

## Tenant
- **Slug:** consultorio
- **Domain:** Gestión de consultorio médico

## Core Value
Sistema de turnos online y gestión interna para consultorio médico: agenda, pacientes, profesionales, obras sociales y sitio web público con booking online.

## Stack
- Platform: Fyso (BaaS)
- Frontend: Astro + React + TailwindCSS
- MCP: Fyso MCP server (connected)

## Estado actual

### Backend Fyso (completo ✅)
- `appointments` — Turnos y citas (date, time, patient_id, doctor_id, service_id, network_id, status, consultation_notes, appointment_notes, overtime)
- `doctors` — Profesionales con horario embebido (name, enabled, online, dias_turnos, mon_morn_*, tue_morn_*, ...)
- `exceptions` — Días deshabilitados (doctor_id, since_date, to_date, since_time, to_time, exception_type, description)
- `special_schedules` — Días excepcionales (doctor_id, date, start_time, end_time, period, date_part)
- `networks` — Obras Sociales (name)
- `patients` — Pacientes (first_name, last_name, dni, email, phone, birthdate, sex, address, city, network_id, medical_record, warnings, contact_details, prof_cabecera)
- `services` — Servicios (name)
- `specialties` — Especialidades (name)
- ❌ `site_config` — FALTANTE (necesita crearse)

### Frontend (parcialmente roto)
- Admin: Agenda, Pacientes, Profesionales, Obras Sociales, Servicios, Configuración
- Público: Home, Contacto, Login
- ❌ `/turnos` — Página de reserva online FALTANTE (linkada desde nav y home)
- ❌ Nombres de entidades y campos no coinciden con el backend

## Fases planeadas
4 fases

### Fase 1: Fix entity/field mismatches (core)
Corregir todos los nombres de entidades y campos en el frontend para que coincidan con el backend real de Fyso. Sin esto, la app no funciona en absoluto.

### Fase 2: Fix DoctorScheduleEditor
Reescribir el editor de horarios de profesionales para usar las entidades reales del backend (horario embebido en doctors, exceptions, special_schedules).

### Fase 3: Crear site_config en Fyso + fix SiteConfigEditor
Crear la entidad `site_config` en Fyso y corregir el editor de configuración del sitio.

### Fase 4: Página /turnos (booking público)
Crear la página pública de reserva de turnos online para pacientes.

## Key Decisions
| Decision | Rationale | Status |
|----------|-----------|--------|
| Adaptar frontend al backend (no al revés) | El backend Fyso ya está bien diseñado y el scheduling engine depende de sus campos | Confirmado |
| Horario embebido en doctors (no entidad separada) | El scheduling API de Fyso lee de los campos mon_morn_* del doctor | Confirmado |
| site_config como entidad Fyso | Ya está integrado en el Layout público (loadSiteConfig) | Pendiente |
