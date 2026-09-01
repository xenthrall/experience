# Terrario Digital — Ecosistema Vivo & Evolución

Un simulador de vida artificial y selección natural que corre por completo en el navegador sobre un `<canvas>` 2D de alto rendimiento (acelerado por Spatial Hash Grid a 60 FPS). Sin dependencias ni build step — un único `index.html`.

## 🌿 Especies & Red Trófica

1. **🦌 Ciervo Ágil (`HERB_AGILE`)**: Herbívoro de manada (*Boids*). Detecta depredadores, emite ondas de alarma para alertar a la manada, huye en zig-zag y busca refugio o camuflaje en arbustos.
2. **🦏 Titán Acorazado (`HERB_MEGA`)**: Megafauna masiva y resistente. Se alimenta de densos matorrales y se defiende con contraataques espinados si es atacado.
3. **🐺 Cazador de Manada (`CARN_PACK`)**: Depredador ágil con modo de acecho sigiloso, acometidas veloces (*sprint strike*) y descanso/digestión tras alimentarse.
4. **🦖 Depredador Apex (`CARN_APEX`)**: Bestia solitaria y territorial. Caza presas grandes y emite rugidos intimidatorios que dispersan en pánico a las criaturas cercanas.
5. **🦅 Carroñero (`SCAVENGER`)**: Vuela en órbitas majestuosas, localiza restos/cadáveres y los consume, dejando huesos limpios que fertilizan la tierra.
6. **✨ Polinizador (`POLLINATOR`)**: Insectos bioluminiscentes que fertilizan arbustos y dispersan brotes de flora por el terrario.

## 🧠 Inteligencia & Instintos de Supervivencia

- **Metabolismo Completo**: Energía (Hambre), Hidratación (Sed), Resistencia (Stamina) y Salud (HP).
- **Puntos de Agua & Oasis**: Las criaturas deben acudir periódicamente a las orillas a beber agua fresca para no deshidratarse.
- **Camuflaje en Arbustos**: La vegetación densa otorga sigilo, ocultando a las presas de la vista de depredadores lejanos.
- **Ciclo Día / Noche**: Comportamientos nocturnos de sueño/hibernación, ojos brillantes en la oscuridad y bioluminiscencia.
- **Cadáveres & Reciclaje de Nutrientes**: La descomposición de cadáveres genera nuevo suelo fértil con brotes de flores y frutos.
- **Genética Hereditaria & Mutación**: Velocidad, sentidos, tamaño, sigilo, eficiencia de resistencia y pigmentación varían con la selección natural.

## 🛠️ Herramientas & Controles Interactivos

- **Inspector de Criaturas**: Haz clic en cualquier criatura para ver su cerebro en vivo (estado actual, barras de necesidades, árbol genealógico y estadísticas genéticas).
- **Barra de Spawn Inferior**: Siembra comida, invoca cualquiera de las 6 especies o crea nuevos estanques con un toque.
- **Gráfico Histórico de Población**: Mini gráfica dinámica en tiempo real que muestra el equilibrio depredador-presa.
- **Clima & Lluvia Fértil**: Activa lluvias que nutren el terreno y aceleran el crecimiento botánico.
- **Modos Visuales**: Alterna conos de visión, emociones flotantes (💭), barras de salud y ciclo día/noche automático.

## 🚀 Desarrollo Local

Abre `index.html` directamente en el navegador, o sírvelo con cualquier servidor estático:

```sh
python3 -m http.server 8000
```
