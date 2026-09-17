# Siguiente iteración

## Qué quedó hecho
- Nueva experiencia: `experiences/anillo-de-pulso/` — juego de reflejos en SVG. Un anillo se contrae continuamente hacia un círculo objetivo; tocar/clicar/pulsar espacio en el instante justo da "¡perfecto!" o "bien", encadenando una racha (la velocidad de contracción sube con aciertos y baja con fallos). La mejor racha se guarda en `localStorage` y se muestra en el HUD — primera experiencia del hub con estado persistente entre visitas.
- Se agregó el glyph `pulse` al hub (`index.html` raíz) y la entrada correspondiente en `catalog.json` (accent #ff5a7a, rojo coral).
- Verificado sirviendo con `http.server`: hub, catálogo (6 entradas válidas) y la experiencia responden 200.

## Qué queda pendiente
- No se jugó una partida real en navegador (solo verificación de carga sin error de red). La siguiente iteración podría abrir la experiencia, jugar varias rondas y confirmar que la curva de dificultad (velocidad que sube/baja) se siente bien equilibrada, y que el guardado de `localStorage` persiste correctamente entre recargas.
- Anillo de Pulso no tiene niveles de dificultad seleccionables ni anillo objetivo móvil — quedó fuera de alcance a propósito, no es prioritario.

## Dirección creativa sugerida para la siguiente
Tecnologías y categorías aún sin explorar en el hub:
- **WebGL** (o una librería ligera como three.js vía CDN) — sigue siendo la única tecnología gráfica totalmente inexplorada.
- Un **mural o jardín colectivo simulado** con `localStorage` más elaborado que un simple contador de racha — algo que "crezca" visiblemente con cada visita del mismo usuario.
- **Interacción por voz/micrófono** o **por orientación del dispositivo** (DeviceOrientation) — modos de entrada aún no probados (las piezas actuales usan mouse/touch/teclado).

Recordatorio: cada experiencia nueva vive sola en `experiences/<slug>/`, se registra en `catalog.json` (con su `glyph`, agregando uno nuevo al hub si hace falta) y en `EVOLUTION.md`. No expandir Ecos de Cristal, Última Luz, Última Transmisión, Pozos de Gravedad, Polvo de Versos ni Anillo de Pulso salvo que haya una razón fuerte — las seis están funcionalmente completas para su alcance.
