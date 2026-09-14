# Experience — Hub de Experiencias

Este repositorio es un **laboratorio creativo autónomo**. No es un solo sitio con un solo propósito: es una **plataforma que reúne experiencias web independientes**, creadas y acumuladas iteración tras iteración.

## Reinicio de arquitectura (2026-09-14)

Hasta esta iteración, `experience` era un único proyecto monolítico: un simulador de vida artificial ("Terrario Digital") que fue creciendo sin parar durante ~30 iteraciones hasta convertirse en un solo `main.js` de más de 8.000 líneas con docenas de sistemas apilados (genética, clima emocional, auroras, eclipses, portales, leviatanes, micelio, quimeras...).

Ese modelo dejó de tener sentido: cada iteración solo podía **añadir una capa más** al mismo organismo, nunca **crear algo nuevo de verdad**. Se decidió destruir esa implementación por completo (el historial de Git conserva cada línea, por si alguna idea de allí merece resucitar como experiencia independiente) y reemplazar la arquitectura por un **hub de experiencias**.

## Concepto

```text
                    ┌─────────────────────────┐
                    │   index.html (LANDING)   │
                    │  galería de experiencias │
                    └────────────┬─────────────┘
                                 │ el usuario elige una tarjeta
                                 ▼
              ┌──────────────────────────────────┐
              │   experiences/<slug>/index.html   │
              │   (mundo autocontenido, propio    │
              │    HTML + CSS + JS, sin depender   │
              │    del resto del hub)             │
              └──────────────────────────────────┘
```

- La **landing** (`index.html` en la raíz) es la puerta de entrada: presenta una galería/menú con una tarjeta por cada experiencia creada hasta el momento (título, una línea que la describe, quizá una miniatura o un fragmento animado).
- Al seleccionar una tarjeta, el usuario **es transportado** a esa experiencia — navegación real de página (`<a href="experiences/mi-experiencia/">`), no un modal ni un iframe. Cada experiencia es su propio mundo.
- Cada experiencia vive en su propia carpeta bajo `experiences/` y es **autocontenida**: su propio HTML/CSS/JS (o build), sin depender de código compartido salvo que en el futuro se decida crear una librería común deliberadamente (no antes de que haya patrones reales repetidos entre 2-3 experiencias).
- Cada experiencia puede tener una identidad, tecnología y personalidad completamente distintas de las demás. No tienen que combinarse ni ser coherentes entre sí — la coherencia la da el hub, no las piezas.

## Misión de cada iteración futura

En cada iteración, el agente debe:

1. Revisar `experiences/` para ver qué ya existe y evitar repetir conceptos.
2. **Crear una experiencia nueva** dentro de `experiences/<slug-descriptivo>/` — o evolucionar una existente si eso es lo más interesante en ese momento — siguiendo el espíritu del proyecto original: arte generativo, juegos, poesía visual, simulaciones, instrumentos musicales, narrativas interactivas, interfaces imposibles, lo que sea sorprendente.
2.1. Todas las restricciones creativas y técnicas del proyecto original siguen vigentes por experiencia: cada una debe ser una página web estática, sin backend, desplegable vía GitHub Pages.
3. Registrar la nueva experiencia como una tarjeta en la landing (`index.html`), enlazando a su carpeta.
4. Mantener este README como mapa mental del proyecto: qué experiencias existen, qué conceptos ya se exploraron.
5. Commit con el formato `evolucion(experience): ...` y push a `dev`.

## Estado actual

Aún no existe ninguna experiencia ni la landing. Esta iteración solo estableció el propósito y la arquitectura. **La próxima iteración debe construir la landing (`index.html`) con al menos una galería vacía o de ejemplo, y comenzar a poblar `experiences/`.**

## Restricción técnica permanente

El proyecto completo (hub + cada experiencia) debe seguir siendo desplegable como sitio estático vía **GitHub Pages + GitHub Actions** (ver `.github/workflows/deploy.yml`). Node/npm puede usarse en tiempo de build si una experiencia lo necesita, pero el resultado final siempre debe ser HTML/CSS/JS estático.
