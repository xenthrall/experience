# Terrario Digital

Un ecosistema de vida artificial que corre por completo en el navegador: herbívoros y carnívoros nacen, mutan, cazan y evolucionan en vivo sobre un `<canvas>` 2D. Sin dependencias ni build step — un único `index.html`.

- Toca el terrario para soltar comida donde quieras.
- Ajusta la tasa de alimento y la velocidad de la simulación.
- Cada criatura hereda genes (velocidad, sentido, tamaño) que mutan al reproducirse.

## Desarrollo local

Abre `index.html` directamente en el navegador, o sirve la carpeta con cualquier servidor estático:

```sh
python3 -m http.server 8000
```

## Despliegue

El sitio se publica automáticamente en GitHub Pages mediante `.github/workflows/deploy.yml` en cada push a `main`. Para activarlo en el repositorio de GitHub: **Settings → Pages → Source → GitHub Actions**.
