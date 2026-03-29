# Plan 01 — Página /turnos — Booking público completo

## Goal
Crear la página pública de reserva de turnos online con flujo completo: seleccionar profesional → fecha → slot → datos del paciente → confirmar.

## Must Haves
- El paciente puede elegir un profesional que tenga `online=true`
- Puede seleccionar una fecha en un calendario simple
- Ve los slots disponibles del día (via scheduling API)
- Ingresa su nombre, apellido, DNI y teléfono
- Se crea un appointment con status='pendiente'
- Ve pantalla de confirmación con resumen del turno

## Files
- `src/pages/turnos.astro` — reemplazar el placeholder
- `src/components/react/TurnosPage.tsx` — nuevo componente principal

## UI Flow
```
Step 1: Seleccionar profesional
  → Grid de cards de doctors con online=true
  → Card muestra: nombre, especialidad, nota_publica

Step 2: Seleccionar fecha
  → Mini calendario del mes actual
  → Solo fechas futuras habilitadas
  → Al seleccionar fecha → cargar slots

Step 3: Seleccionar horario
  → Grid de botones con los horarios disponibles
  → Si no hay slots: mensaje "No hay turnos disponibles para este día"

Step 4: Datos del paciente
  → Form: Nombre *, Apellido, DNI *, Teléfono *, Email (opcional)
  → Botón "Confirmar turno"

Step 5: Confirmación
  → Mensaje de éxito
  → Resumen: profesional, fecha, hora
  → Instrucciones de contacto si necesitan cancelar
```

## API Calls
```typescript
// Load doctors online
const { data: doctors } = await apiList('doctors');
const onlineDoctors = doctors.filter(d => d.data?.online === true && d.data?.enabled !== false);

// Load available slots
const slots = await apiGetAvailableSlots(doctorId, selectedDate, selectedDate);
// Slots interface: { fecha: string, hora: string, duracion: number, profesional_id: string }
// NOTE: Verificar si el API devuelve estos nombres o date/time/doctor_id/duration

// Create appointment
await apiCreate('appointments', {
  doctor_id: doctorId,
  date: selectedDate,
  time: selectedSlot.hora,  // o .time si el API devuelve en inglés
  status: 'pendiente',
  appointment_notes: notes || null,
  // patient_id: null (el paciente se crea o se identifica después, o se deja como nota)
});
// Alternativa: crear paciente primero, luego appointment con patient_id
```

## Tasks

### Task 1: Crear TurnosPage.tsx
<action>
Crear `src/components/react/TurnosPage.tsx` con el flujo completo de 5 pasos descrito arriba.

Estilos: consistentes con el resto del sitio (teal, rounded-xl, shadows).
Sin autenticación requerida (es público).
Error handling claro en cada paso.
Loading states en cada llamada API.
</action>

### Task 2: Crear/reemplazar turnos.astro
<action>
Reemplazar `src/pages/turnos.astro` con:
```astro
---
import Layout from '../layouts/Layout.astro';
import TurnosPage from '../components/react/TurnosPage';
---
<Layout title="Reservar Turno" activePage="turnos">
  <TurnosPage client:load />
</Layout>
```
</action>

### Task 3: Agregar "turnos" al nav highlight
<action>
En `src/layouts/Layout.astro`, el link "Pedir turno" ya existe pero no está en `navLinks` (está hardcoded como botón separado). Verificar que tenga el highlight correcto cuando activePage="turnos".
</action>

<verify>
1. `/turnos` carga sin errores
2. Se muestran los profesionales con `online=true`
3. Al seleccionar profesional y fecha, aparecen slots disponibles
4. Se puede completar el form y crear un turno
5. El turno aparece en la Agenda admin como 'pendiente'
6. La confirmación muestra resumen correcto
</verify>
