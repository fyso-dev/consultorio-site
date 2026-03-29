# Plan 02 — Fix Agenda.tsx + AtenderModal.tsx + PatientModal.tsx

## Goal
Corregir todos los nombres de entidad y campos en los componentes de la agenda para que funcionen con el backend real.

## Must Haves
- La agenda carga turnos de `appointments` correctamente
- Se pueden crear, editar y eliminar turnos
- El historial de paciente muestra turnos correctos
- AtenderModal guarda notas médicas correctamente
- No hay referencias a `turnos`, `fecha`, `hora`, `paciente_id`, `profesional_id`, `estado`, etc.

## Field Mapping Reference
```
turnos          → appointments
fecha           → date
hora            → time
paciente_id     → patient_id
profesional_id  → doctor_id
servicio_id     → service_id
obra_social_id  → network_id
estado          → status
notas           → appointment_notes
notas_medicas   → consultation_notes
archivos        → ELIMINAR (campo no existe)
```

Doctor name: `first_name + last_name` → `data.name`

## Tasks

### Task 1: Fix Agenda.tsx — Entity names y field references
<action>
En `src/components/react/Agenda.tsx`:

1. `apiList('turnos')` → `apiList('appointments')`
2. `apiCreate('turnos', ...)` → `apiCreate('appointments', ...)`
3. `apiUpdate('turnos', id, ...)` → `apiUpdate('appointments', id, ...)`
4. `apiDelete('turnos', id)` → `apiDelete('appointments', id)`
5. `field(t, 'fecha')` → `field(t, 'date')`
6. `field(t, 'hora')` → `field(t, 'time')`
7. `field(t, 'paciente_id')` → `field(t, 'patient_id')`
8. `field(t, 'profesional_id')` → `field(t, 'doctor_id')`
9. `field(t, 'servicio_id')` → `field(t, 'service_id')`
10. `field(t, 'obra_social_id')` → `field(t, 'network_id')`
11. `field(t, 'estado')` → `field(t, 'status')`
12. `field(t, 'notas')` → `field(t, 'appointment_notes')`
13. En la interfaz `Slot`, los campos `fecha/hora/profesional_id/duracion` vienen del scheduling API — mantener hasta verificar
14. En TurnoEditPanel (inline edit):
    - `paciente_id: selectedPatient.id` → `patient_id: ...`
    - `fecha: bookingSlot.fecha` → `date: bookingSlot.fecha` (o `date` si el slot usa `date`)
    - `hora: bookingSlot.hora` → `time: bookingSlot.hora`
    - `profesional_id: bookingSlot.profesional_id` → `doctor_id: bookingSlot.profesional_id`
    - `servicio_id` → `service_id`
    - `obra_social_id` → `network_id`
    - `notas` → `appointment_notes`
    - `estado: 'confirmado'` → `status: 'confirmado'`
    - `estado: 'bloqueado'` → `status: 'bloqueado'`
15. Doctor display: `doc.data?.first_name + ' ' + doc.data?.last_name` → `doc.data?.name`
16. `turnosDelDia`, `turnos` state variable — pueden mantener el nombre de variable (son solo nombres de variable JS, no afectan la API)
17. `estadoBadge` keys — estos son los valores que se guardan en `status`. Verificar si el backend acepta cualquier string o tiene validaciones. Por ahora mantener los labels en español como están.

**IMPORTANTE:** El estado `en_sala` → verificar si el backend lo acepta. Si no, adaptar.
</action>

### Task 2: Fix AtenderModal.tsx — Field names
<action>
En `src/components/react/AtenderModal.tsx`:

1. `field(turno, 'notas_medicas')` → `field(turno, 'consultation_notes')`
2. `field(turno, 'profesional_id')` → `field(turno, 'doctor_id')`
3. `field(turno, 'paciente_id')` → `field(turno, 'patient_id')`
4. `field(turno, 'fecha')` → `field(turno, 'date')`
5. `field(turno, 'hora')` → `field(turno, 'time')`
6. `field(turno, 'estado')` → `field(turno, 'status')`
7. `field(turno, 'notas')` → `field(turno, 'appointment_notes')`
8. Eliminar todo lo relacionado con `archivos`:
   - Estado `archivos`/`Archivo` interface
   - Input de archivos
   - Guardado de archivos en el update
   - La UI de archivos adjuntos
9. En el objeto de update: `notas_medicas` → `consultation_notes`
10. En la lista de historial:
    - `apiList('turnos', ...)` → `apiList('appointments', ...)`
    - `field(t, 'paciente_id')` → `field(t, 'patient_id')`
    - `field(t, 'profesional_id')` → `field(t, 'doctor_id')`
    - `field(t, 'fecha')` → `field(t, 'date')`
    - `field(t, 'notas_medicas')` → `field(t, 'consultation_notes')`
    - `field(t, 'estado')` → `field(t, 'status')`
</action>

### Task 3: Fix PatientModal.tsx — Field names
<action>
En `src/components/react/PatientModal.tsx`:

1. Form inicial:
   - `birth_date: patient.data?.birth_date` → `birthdate: patient.data?.birthdate`
   - `gender: patient.data?.gender` → `sex: patient.data?.sex`
   - `notes: patient.data?.notes` → `medical_record: patient.data?.medical_record`
   - Eliminar `network_number` (no existe en backend)
   - Eliminar `location` y `LocationMap` (no existe en backend)

2. Historial de turnos:
   - `apiList('turnos', ...)` → `apiList('appointments', ...)`
   - `field(t, 'paciente_id')` → `field(t, 'patient_id')`
   - `field(t, 'profesional_id')` → `field(t, 'doctor_id')`
   - `field(t, 'fecha')` → `field(t, 'date')`
   - `field(t, 'hora')` → `field(t, 'time')`
   - `field(t, 'estado')` → `field(t, 'status')`
   - `field(t, 'notas_medicas')` → `field(t, 'consultation_notes')`
   - Eliminar referencias a `archivos`

3. Form fields UI: reemplazar labels de `Fecha de Nacimiento` (field: birthdate), `Sexo` (field: sex), `Historia Clinica` (field: medical_record)

4. Doctor display en historial: `doctor.data?.first_name + last_name` → `doctor.data?.name`
</action>

<verify>
1. `npm run build` en el proyecto no arroja errores de TypeScript en estos archivos
2. No hay ningún string `'turnos'` como nombre de entidad API en Agenda/AtenderModal/PatientModal
3. No hay ninguna referencia a campos `fecha`, `hora`, `paciente_id`, `profesional_id`, `estado`, `notas_medicas` en contexto de API
4. No hay referencias a `archivos` como campo de appointment
</verify>
