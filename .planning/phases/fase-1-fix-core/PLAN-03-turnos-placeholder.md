# Plan 03 — Página /turnos (placeholder para evitar 404)

## Goal
Crear una página `/turnos` básica para que no dé 404. El booking completo se implementa en Fase 4.

## Must Haves
- `/turnos` no da 404
- La página muestra un mensaje informativo o formulario simple
- Usa el Layout público con nav y footer

## Tasks

### Task 1: Crear src/pages/turnos.astro
<action>
Crear `src/pages/turnos.astro` con contenido simple que indique que el sistema de turnos está disponible y muestre información de contacto para reservar.

La página debe:
- Usar Layout.astro con `title="Turnos"` y `activePage="turnos"`
- Mostrar un mensaje de "Reserva tu turno" con opciones de contacto
- Incluir botón de WhatsApp
- Tener diseño consistente con el resto del sitio (colores teal)
- Mostrar datos de contacto (data-sc attributes para que se actualicen con site_config)

Este placeholder se reemplazará en Fase 4 con el booking interactivo.
</action>

<verify>
- `curl localhost:4321/turnos` responde 200
- La página muestra Layout correcto con nav y footer
- El link "Pedir turno" del nav lleva a esta página sin 404
</verify>
