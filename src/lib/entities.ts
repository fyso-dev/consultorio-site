import type { EntityConfig } from './entity-config';

export const patientsConfig: EntityConfig = {
  name: 'patients',
  displayName: 'Paciente',
  displayNamePlural: 'Pacientes',
  displayField: 'last_name',
  fields: [
    { key: 'first_name', label: 'Nombre', type: 'text', required: true, showInTable: true },
    { key: 'last_name', label: 'Apellido', type: 'text', required: true, showInTable: true },
    { key: 'dni', label: 'DNI', type: 'text', showInTable: true },
    { key: 'email', label: 'Email', type: 'email', showInTable: true },
    { key: 'phone', label: 'Telefono', type: 'text', showInTable: true },
    { key: 'birth_date', label: 'Fecha de Nacimiento', type: 'date' },
    { key: 'gender', label: 'Genero', type: 'select', options: ['Masculino', 'Femenino', 'Otro'] },
    { key: 'address', label: 'Direccion', type: 'text' },
    { key: 'city', label: 'Ciudad', type: 'text' },
    { key: 'location', label: 'Ubicacion', type: 'text' },
    { key: 'network_id', label: 'Obra Social', type: 'relationship', relation: { entity: 'networks', displayField: 'name' }, showInTable: true },
    { key: 'network_number', label: 'Nro Afiliado', type: 'text' },
    { key: 'notes', label: 'Notas', type: 'longText', showInTable: false },
  ],
};

export const doctorsConfig: EntityConfig = {
  name: 'doctors',
  displayName: 'Profesional',
  displayNamePlural: 'Profesionales',
  displayField: 'last_name',
  fields: [
    { key: 'first_name', label: 'Nombre', type: 'text', required: true, showInTable: true },
    { key: 'last_name', label: 'Apellido', type: 'text', required: true, showInTable: true },
    { key: 'email', label: 'Email', type: 'email', showInTable: true },
    { key: 'enabled', label: 'Habilitado', type: 'boolean', showInTable: true },
    { key: 'online_booking', label: 'Turnos Online', type: 'boolean', showInTable: true },
    { key: 'slot_duration', label: 'Duracion Turno (min)', type: 'number' },
  ],
};

export const networksConfig: EntityConfig = {
  name: 'networks',
  displayName: 'Obra Social',
  displayNamePlural: 'Obras Sociales',
  displayField: 'name',
  fields: [
    { key: 'name', label: 'Nombre', type: 'text', required: true, showInTable: true },
  ],
};

export const servicesConfig: EntityConfig = {
  name: 'services',
  displayName: 'Servicio',
  displayNamePlural: 'Servicios',
  displayField: 'name',
  fields: [
    { key: 'name', label: 'Nombre', type: 'text', required: true, showInTable: true },
  ],
};

export const specialtiesConfig: EntityConfig = {
  name: 'specialties',
  displayName: 'Especialidad',
  displayNamePlural: 'Especialidades',
  displayField: 'name',
  fields: [
    { key: 'name', label: 'Nombre', type: 'text', required: true, showInTable: true },
  ],
};

// Fyso Scheduling entities (native)
export const turnosConfig: EntityConfig = {
  name: 'turnos',
  displayName: 'Turno',
  displayNamePlural: 'Turnos',
  displayField: 'fecha',
  fields: [
    { key: 'fecha', label: 'Fecha', type: 'date', required: true, showInTable: true },
    { key: 'hora', label: 'Hora', type: 'text', required: true, showInTable: true },
    { key: 'paciente_id', label: 'Paciente', type: 'relationship', relation: { entity: 'patients', displayField: 'last_name' }, required: true, showInTable: true },
    { key: 'profesional_id', label: 'Profesional', type: 'relationship', relation: { entity: 'doctors', displayField: 'last_name' }, required: true, showInTable: true },
    { key: 'servicio_id', label: 'Servicio', type: 'relationship', relation: { entity: 'services', displayField: 'name' }, showInTable: true },
    { key: 'obra_social_id', label: 'Obra Social', type: 'relationship', relation: { entity: 'networks', displayField: 'name' }, showInTable: true },
    { key: 'estado', label: 'Estado', type: 'select', options: ['pendiente', 'confirmado', 'en_sala', 'atendido', 'cancelado', 'ausente'], showInTable: true },
    { key: 'notas', label: 'Notas', type: 'longText', showInTable: false },
    { key: 'notas_medicas', label: 'Notas Medicas', type: 'longText', showInTable: false },
    { key: 'duracion', label: 'Duracion (min)', type: 'number', showInTable: false },
    { key: 'origen', label: 'Origen', type: 'select', options: ['manual', 'online'], showInTable: false },
  ],
};

export const horariosConfig: EntityConfig = {
  name: 'horarios',
  displayName: 'Horario',
  displayNamePlural: 'Horarios',
  displayField: 'name',
  fields: [
    { key: 'profesional_id', label: 'Profesional', type: 'relationship', relation: { entity: 'doctors', displayField: 'last_name' }, required: true, showInTable: true },
    { key: 'rrule', label: 'Regla recurrencia', type: 'text', required: true, showInTable: true },
    { key: 'hora_inicio', label: 'Hora Inicio', type: 'text', required: true, showInTable: true },
    { key: 'hora_fin', label: 'Hora Fin', type: 'text', required: true, showInTable: true },
    { key: 'duracion_turno', label: 'Duracion Turno (min)', type: 'number', required: true, showInTable: true },
    { key: 'activo', label: 'Activo', type: 'boolean', showInTable: true },
  ],
};

export const excepcionesHorarioConfig: EntityConfig = {
  name: 'excepciones_horario',
  displayName: 'Excepcion de Horario',
  displayNamePlural: 'Excepciones de Horario',
  displayField: 'descripcion',
  fields: [
    { key: 'profesional_id', label: 'Profesional', type: 'relationship', relation: { entity: 'doctors', displayField: 'last_name' }, required: true, showInTable: true },
    { key: 'fecha_desde', label: 'Desde', type: 'date', required: true, showInTable: true },
    { key: 'fecha_hasta', label: 'Hasta', type: 'date', required: true, showInTable: true },
    { key: 'tipo', label: 'Tipo', type: 'text', required: true, showInTable: true },
    { key: 'hora_desde', label: 'Hora Desde', type: 'text' },
    { key: 'hora_hasta', label: 'Hora Hasta', type: 'text' },
    { key: 'duracion_turno', label: 'Duracion Turno (min)', type: 'number' },
    { key: 'todo_el_dia', label: 'Todo el dia', type: 'boolean' },
    { key: 'descripcion', label: 'Descripcion', type: 'text', showInTable: true },
  ],
};
