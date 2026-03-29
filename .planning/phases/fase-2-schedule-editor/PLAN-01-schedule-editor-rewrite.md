# Plan 01 — Reescribir DoctorScheduleEditor

## Goal
Reescribir el DoctorScheduleEditor para usar las entidades reales del backend. El horario está embebido en el doctor; días deshabilitados usan `exceptions`; días especiales usan `special_schedules`.

## Must Haves
- Tab "Horarios" lee y guarda en los campos embebidos del doctor (`mon_morn_enabled`, etc.)
- Tab "Dias Deshabilitados" usa entidad `exceptions` con campos correctos
- Tab "Dias Excepcionales" usa entidad `special_schedules` con campos correctos
- Tab "Feriados" usa entidad `exceptions` con `exception_type='feriado'`
- Doctor name en header: `doctor.data.name`

## Doctor Schedule Fields Reference
```
Campos del doctor por día (day = mon/tue/wed/thu/fri/sat):
  {day}_morn_enabled: boolean
  {day}_morn_from: text (HH:mm)
  {day}_morn_to: text (HH:mm)
  {day}_morn_period: number (duracion en minutos)
  {day}_after_enabled: boolean
  {day}_after_from: text (HH:mm)
  {day}_after_to: text (HH:mm)
  {day}_after_period: number
```

## Exceptions Fields Reference
```
doctor_id: relation -> doctors
since_date: date (YYYY-MM-DD)
to_date: date (YYYY-MM-DD)
since_time: text (HH:mm, opcional)
to_time: text (HH:mm, opcional)
exception_type: text ('bloqueo', 'feriado', etc.)
description: longText
```

## Special Schedules Fields Reference
```
doctor_id: relation -> doctors
date: date (YYYY-MM-DD)
start_time: text (HH:mm)
end_time: text (HH:mm)
period: number (duracion turno en minutos)
date_part: text ('morning' o 'afternoon')
```

## Tasks

### Task 1: Reescribir ScheduleTab
<action>
Reemplazar ScheduleTab en DoctorScheduleEditor.tsx.

**UI nueva:**
- 6 días: Lun, Mar, Mie, Jue, Vie, Sab (sin Domingo)
- Por cada día: toggle de habilitado (que habilita mañana o tarde)
- Cuando habilitado: mostrar 2 bloques colapsables: Mañana / Tarde
- Por cada bloque: toggle habilitado, hora_desde, hora_hasta, duracion (select 10/15/20/30/40/60 min)

**Load:**
```typescript
// Doctor ya está en props con todos sus campos embebidos
// Mapear doctor.data.{day}_{part}_{field} a estado local
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const PARTS = ['morn', 'after'];
// Inicializar state con los valores del doctor
```

**Save:**
```typescript
const payload: Record<string, any> = {};
for (const day of DAYS) {
  for (const part of PARTS) {
    payload[`${day}_${part}_enabled`] = schedule[day][part].enabled;
    payload[`${day}_${part}_from`] = schedule[day][part].from;
    payload[`${day}_${part}_to`] = schedule[day][part].to;
    payload[`${day}_${part}_period`] = schedule[day][part].period;
  }
}
await apiUpdate('doctors', doctor.id, payload);
```
</action>

### Task 2: Reescribir DisabledDaysTab
<action>
Adaptar DisabledDaysTab para usar `exceptions` entity:

- Load: `apiList('exceptions')`, filtrar por `doctor_id === doctor.id`
- Create: `apiCreate('exceptions', { doctor_id: doctor.id, since_date, to_date, since_time, to_time, exception_type: 'bloqueo', description })`
- Delete: `apiDelete('exceptions', id)`
- Fields: `since_date`, `to_date`, `since_time` (opcional), `to_time` (opcional), `description`
- "Todo el dia" → no enviar `since_time`/`to_time`
</action>

### Task 3: Reescribir SpecialDaysTab
<action>
Adaptar SpecialDaysTab (horarios excepcionales) para usar `special_schedules` entity:

- Load: `apiList('special_schedules')`, filtrar por `doctor_id === doctor.id`
- Create: `apiCreate('special_schedules', { doctor_id: doctor.id, date, start_time, end_time, period, date_part })`
- Delete: `apiDelete('special_schedules', id)`
- Fields: `date`, `start_time`, `end_time`, `period` (duracion minutos), `date_part` ('morning' o 'afternoon')
</action>

### Task 4: Fix HolidaysTab
<action>
Adaptar HolidaysTab para usar `exceptions` entity con `exception_type='feriado'`:

- Load: `apiList('exceptions')`, filtrar por `doctor_id === doctor.id AND exception_type === 'feriado'`
- Toggle feriado: si existe → delete, si no existe → create con `exception_type: 'feriado'`, `since_date` y `to_date` con la fecha del feriado
</action>

### Task 5: Fix DoctorsPage — doctor name
<action>
En DoctorsPage.tsx:
- Reemplazar `doc.data?.first_name + ' ' + doc.data?.last_name` → `doc.data?.name`
- `doctor.data?.online_booking` → `doctor.data?.online`
- Remover display de `slot_duration`
- Mostrar `doc.data?.specialization` si existe
</action>

<verify>
1. La página de profesionales carga y muestra nombres correctamente
2. El editor de horarios abre sin errores de consola
3. Se puede guardar un horario semanal y persistir en el backend
4. Se puede crear/eliminar un día deshabilitado en `exceptions`
5. Se puede crear/eliminar un día especial en `special_schedules`
</verify>
