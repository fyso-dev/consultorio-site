# State — Consultorio

## Tenant
- **Slug:** consultorio
- **URL:** https://app.fyso.dev

## Fase actual
Todas las fases ejecutadas.

## Fases
| Fase | Nombre | Estado |
|------|--------|--------|
| 1 | Fix Core — Agenda funcional | ✅ Completo |
| 2 | Fix DoctorScheduleEditor + DoctorsPage | ✅ Completo |
| 3 | site_config entity + SiteConfigEditor fix | ✅ Completo |
| 4 | Página /turnos — Booking público completo | ✅ Completo |

## Entidades Fyso (tenant: consultorio)
| Entidad | Estado | Campos |
|---------|--------|--------|
| appointments | ✅ published | 10 |
| doctors | ✅ published | 55 |
| exceptions | ✅ published | 7 |
| special_schedules | ✅ published | 6 |
| networks | ✅ published | 2 |
| patients | ✅ published | 14 |
| services | ✅ published | 1 |
| specialties | ✅ published | 1 |
| site_config | ✅ published | 15 |

## Frontend
| Página | Estado |
|--------|--------|
| /admin (Agenda) | ✅ Fijo — usa appointments, campos en inglés |
| /admin/pacientes | ✅ Fijo — PatientModal con campos correctos |
| /admin/profesionales | ✅ Fijo — DoctorsPage usa name, online |
| /admin/profesionales (horarios) | ✅ Fijo — DoctorScheduleEditor usa embedded fields, exceptions, special_schedules |
| /admin/obras-sociales | ✅ OK |
| /admin/servicios | ✅ OK |
| /admin/sitio | ✅ Fijo — site_config entity creada y publicada |
| / (home) | ✅ OK |
| /contacto | ✅ OK |
| /login | ✅ OK |
| /turnos | ✅ Creado — TurnosPage.tsx con flujo 5 pasos |
