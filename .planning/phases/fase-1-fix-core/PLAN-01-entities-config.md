# Plan 01 — Fix entities.ts

## Goal
Corregir los configs de entidades en `src/lib/entities.ts` para que coincidan con los schemas reales del backend Fyso.

## Must Haves
- `turnosConfig` usa `appointments` como nombre de entidad y campos correctos
- `patientsConfig` usa campos correctos del backend patients
- `doctorsConfig` usa `name` como campo único (no first_name/last_name)
- No existen configs de `horarios` ni `excepciones_horario`

## Tasks

### Task 1: Corregir turnosConfig
<action>
Edit `src/lib/entities.ts` — reemplazar turnosConfig completo:

```typescript
export const turnosConfig: EntityConfig = {
  name: 'appointments',
  displayName: 'Turno',
  displayNamePlural: 'Turnos',
  displayField: 'date',
  fields: [
    { key: 'date', label: 'Fecha', type: 'date', required: true, showInTable: true },
    { key: 'time', label: 'Hora', type: 'text', required: true, showInTable: true },
    { key: 'patient_id', label: 'Paciente', type: 'relationship', relation: { entity: 'patients', displayField: 'last_name' }, required: true, showInTable: true },
    { key: 'doctor_id', label: 'Profesional', type: 'relationship', relation: { entity: 'doctors', displayField: 'name' }, required: true, showInTable: true },
    { key: 'service_id', label: 'Servicio', type: 'relationship', relation: { entity: 'services', displayField: 'name' }, showInTable: true },
    { key: 'network_id', label: 'Obra Social', type: 'relationship', relation: { entity: 'networks', displayField: 'name' }, showInTable: true },
    { key: 'status', label: 'Estado', type: 'select', options: ['pendiente', 'confirmado', 'en_sala', 'atendido', 'cancelado', 'ausente', 'bloqueado'], showInTable: true },
    { key: 'appointment_notes', label: 'Notas Turno', type: 'longText', showInTable: false },
    { key: 'consultation_notes', label: 'Notas Consulta', type: 'longText', showInTable: false },
    { key: 'overtime', label: 'Sobreturno', type: 'boolean', showInTable: false },
  ],
};
```
</action>

<verify>
- El campo `name` en turnosConfig es `appointments`
- Existen campos `date`, `time`, `patient_id`, `doctor_id`, `status`, `appointment_notes`, `consultation_notes`
- No existen campos `fecha`, `hora`, `paciente_id`, `profesional_id`, `estado`, `notas`
</verify>

### Task 2: Corregir patientsConfig
<action>
Edit `src/lib/entities.ts` — reemplazar patientsConfig:

```typescript
export const patientsConfig: EntityConfig = {
  name: 'patients',
  displayName: 'Paciente',
  displayNamePlural: 'Pacientes',
  displayField: 'last_name',
  fields: [
    { key: 'first_name', label: 'Nombre', type: 'text', required: true, showInTable: true },
    { key: 'last_name', label: 'Apellido', type: 'text', showInTable: true },
    { key: 'dni', label: 'DNI', type: 'text', showInTable: true },
    { key: 'email', label: 'Email', type: 'email', showInTable: true },
    { key: 'phone', label: 'Telefono', type: 'text', showInTable: true },
    { key: 'birthdate', label: 'Fecha de Nacimiento', type: 'date' },
    { key: 'sex', label: 'Sexo', type: 'select', options: ['Masculino', 'Femenino', 'Otro'] },
    { key: 'address', label: 'Direccion', type: 'text' },
    { key: 'city', label: 'Ciudad', type: 'text' },
    { key: 'network_id', label: 'Obra Social', type: 'relationship', relation: { entity: 'networks', displayField: 'name' }, showInTable: true },
    { key: 'medical_record', label: 'Historia Clinica', type: 'longText' },
    { key: 'warnings', label: 'Alertas', type: 'longText' },
    { key: 'contact_details', label: 'Contacto Extra', type: 'longText' },
    { key: 'prof_cabecera', label: 'Profesional Cabecera', type: 'text' },
  ],
};
```
</action>

### Task 3: Corregir doctorsConfig
<action>
Edit `src/lib/entities.ts` — reemplazar doctorsConfig:

```typescript
export const doctorsConfig: EntityConfig = {
  name: 'doctors',
  displayName: 'Profesional',
  displayNamePlural: 'Profesionales',
  displayField: 'name',
  fields: [
    { key: 'name', label: 'Nombre completo', type: 'text', required: true, showInTable: true },
    { key: 'specialization', label: 'Especialidad', type: 'text', showInTable: true },
    { key: 'email', label: 'Email', type: 'email', showInTable: true },
    { key: 'enabled', label: 'Habilitado', type: 'boolean', showInTable: true },
    { key: 'online', label: 'Turnos Online', type: 'boolean', showInTable: true },
    { key: 'dias_turnos', label: 'Dias adelante', type: 'number' },
    { key: 'nota_publica', label: 'Nota Publica', type: 'longText' },
  ],
};
```
</action>

### Task 4: Eliminar configs obsoletos
<action>
Eliminar de `src/lib/entities.ts`:
- `horariosConfig` (entidad `horarios` no existe en backend)
- `excepcionesHorarioConfig` (entidad `excepciones_horario` no existe)
</action>

<verify>
El archivo compila sin errores de TypeScript. Los exports disponibles son: patientsConfig, doctorsConfig, networksConfig, servicesConfig, specialtiesConfig, turnosConfig.
</verify>
