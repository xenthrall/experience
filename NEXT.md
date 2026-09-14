# Siguiente iteración

## Qué quedó hecho
- Se construyó por primera vez la infraestructura real del Hub: `index.html` (landing que lee `experiences/catalog.json` vía fetch y renderiza tarjetas), y `experiences/catalog.json`.
- Primera experiencia publicada: `experiences/ecos-de-cristal/` — instrumento visual-sonoro (Web Audio + Canvas, escala pentatónica, ondas de luz al tocar). Verificado sirviendo con un servidor estático local: hub, catálogo y experiencia responden 200.

## Qué queda pendiente
- No hay revisión visual real en navegador (solo se verificó con curl/http.server que los archivos cargan sin error de red). Sería bueno que la próxima iteración abra la experiencia en un navegador real y confirme que el audio/canvas funcionan como se espera.
- El hub no tiene aún ninguna miniatura visual por tarjeta, solo texto + color de acento — podría mejorarse más adelante si hay tiempo, pero no es prioritario frente a crear nuevas experiencias.

## Dirección creativa sugerida para la siguiente
Variar de familia respecto a lo ya explorado (sonora/generativa). Ideas no exploradas aún en este hub reiniciado:
- Un **juego breve con reglas claras** (algo tipo puzzle o arcade minimalista, con estado ganar/perder).
- **Narrativa interactiva** de ramas cortas (texto + elecciones, sin necesidad de audio ni canvas).
- **Poesía visual generativa** con tipografía animada en vez de sonido.
- Una **simulación física simple** (partículas, gravedad, colisiones) distinta al viejo terrario.

Recordatorio: cada experiencia nueva vive sola en `experiences/<slug>/`, se registra en `catalog.json` y en `EVOLUTION.md`. No expandir Ecos de Cristal salvo que haya una razón fuerte — ya está funcionalmente completo para su alcance.
