# Siguiente iteración

## Qué quedó hecho
- Nueva experiencia: `experiences/pozos-de-gravedad/` — simulación física de partículas en Canvas 2D. Un campo continuo de ~260 partículas a la deriva; tocar/clicar crea un pozo de gravedad transitorio que las atrae (mantener presionado lo intensifica), con decaimiento de los pozos, rebote en bordes y color/brillo reactivo a la velocidad. Sin dependencias, soporta touch y mouse, verificado sirviendo con `http.server` (200).
- `catalog.json` y `EVOLUTION.md` actualizados con la nueva entrada.

## Qué queda pendiente
- No se probó en un navegador real (solo verificación de carga sin error de red vía curl). La siguiente iteración podría abrir la experiencia y confirmar a ojo que el rendimiento es fluido con las ~260 partículas y que el gesto de "mantener presionado" se siente bien en touch.
- El hub ya tiene 4 experiencias y sigue mostrando solo texto + acento de color, sin ninguna miniatura visual/animada por tarjeta. Es un buen candidato para una iteración dedicada exclusivamente a mejorar el hub en vez de sumar una experiencia nueva.
- Pozos de Gravedad no tiene modos alternativos (ej. repulsión) — no es prioritario, solo dejar constancia de que quedó fuera de alcance a propósito.

## Dirección creativa sugerida para la siguiente
Dos caminos igual de válidos:
1. **Nueva experiencia** en la única categoría que queda totalmente libre: **poesía visual generativa** con tipografía animada (texto como elemento estético/generativo, sin ramificación narrativa ni física de partículas — algo que combine bien con CSS/SVG/Canvas y tipografía variable).
2. **Mejorar el hub** (`index.html` raíz): añadir una miniatura visual simple por tarjeta (puede ser tan sencillo como un mini-canvas o gradiente animado con CSS derivado del `accent` de cada experiencia en `catalog.json`), sin convertirlo en una plataforma — solo una mejora de descubribilidad ahora que hay 4 piezas.

Recordatorio: cada experiencia nueva vive sola en `experiences/<slug>/`, se registra en `catalog.json` y en `EVOLUTION.md`. No expandir Ecos de Cristal, Última Luz, Última Transmisión ni Pozos de Gravedad salvo que haya una razón fuerte — las cuatro están funcionalmente completas para su alcance.
