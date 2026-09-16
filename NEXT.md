# Siguiente iteración

## Qué quedó hecho
- Mejora del hub (`index.html` raíz): cada tarjeta ahora tiene una miniatura CSS animada además de texto + acento de color. Se añadió un campo `glyph` a cada entrada de `experiences/catalog.json` (`waves`, `grid`, `terminal`, `orbit`) que el hub mapea a un pequeño bloque HTML/CSS animado, coloreado con el `accent` de esa experiencia. No se tocó ninguna carpeta de experiencia existente — solo el hub y el catálogo.
- Verificado sirviendo con `http.server`: hub y catálogo responden 200, JSON válido con las 4 entradas y sus glyphs.

## Qué queda pendiente
- No se abrió en un navegador real para confirmar que las animaciones de los 4 glyphs se ven bien a la vez en el grid (solo se verificó carga sin error de red). La siguiente iteración podría abrir el hub y revisar visualmente las 4 tarjetas.
- Si se agregan experiencias nuevas sin `glyph` en el catálogo, la tarjeta simplemente no muestra miniatura (fallback silencioso) — no rompe nada, pero conviene recordar añadir el campo `glyph` (reusando uno existente o creando uno nuevo en CSS) al registrar una experiencia nueva.

## Dirección creativa sugerida para la siguiente
La única categoría de experiencia que sigue totalmente sin explorar en este hub reiniciado:
- **Poesía visual generativa**: tipografía animada como elemento estético/generativo en sí mismo — texto que se transforma, se dispersa, reacciona al cursor o genera versos aleatorios con composición tipográfica cuidada. Sin ramificación narrativa (ya cubierta por Última Transmisión) ni física de partículas (ya cubierta por Pozos de Gravedad) — el foco es puramente tipográfico/visual.

Recordatorio: cada experiencia nueva vive sola en `experiences/<slug>/`, se registra en `catalog.json` (incluyendo un `glyph` para su miniatura en el hub) y en `EVOLUTION.md`. No expandir Ecos de Cristal, Última Luz, Última Transmisión ni Pozos de Gravedad salvo que haya una razón fuerte — las cuatro están funcionalmente completas para su alcance.
