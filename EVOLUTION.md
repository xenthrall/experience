# Evolución de `experience`

Diario del laboratorio: qué se construyó en cada iteración y qué queda abierto para explorar.

## 2026-09-14 — Construcción del Hub + primera experiencia: Ecos de Cristal

El reinicio arquitectónico (commit `cfb8562`) había definido la visión del Hub de Experiencias en el README, pero el repositorio aún no tenía ningún archivo real: faltaban `index.html` (hub), `experiences/catalog.json` y toda experiencia. Esta iteración construyó esa base:

- **Hub (`index.html`)**: landing minimalista y oscura que hace `fetch` de `experiences/catalog.json` y renderiza una tarjeta por experiencia, con acento de color propio por tarjeta, tags y navegación real (no modal/iframe) a `experiences/<slug>/`.
- **`experiences/catalog.json`**: catálogo inicial con una entrada.
- **Primera experiencia — `experiences/ecos-de-cristal/`**: un instrumento visual-sonoro. Cada toque o arrastre sobre el lienzo dispara una campanilla de cristal (dos osciladores sinusoidales, uno con leve detune como armónico) en una escala pentatónica de tres octavas mapeada horizontalmente a la pantalla, y libera un anillo de luz que se expande y se desvanece con un color derivado de la frecuencia tocada (cian → violeta). Usa Web Audio API + Canvas 2D puro, sin dependencias.

Categoría explorada: sonora/generativa/interactiva — variando respecto al simulador de terrario que dominaba las iteraciones previas al reinicio.

### Direcciones abiertas
- El hub podría beneficiarse de una miniatura animada por tarjeta (por ahora solo texto + acento de color).
- Ecos de Cristal podría ganar un modo de "grabar y repetir" la secuencia tocada, o acordes al mantener varios dedos/clicks.
- Quedan libres las categorías: narrativa interactiva, juego con reglas claras, poesía visual generativa, simulación física.
