# Índice IA Local

Web en Astro para comparar los modelos de IA que voy ejecutando en local: puntuación en un benchmark
estricto de 100 puntos y velocidad real en tokens por segundo.

## Arrancar la web

Necesitas Node.js 22 o superior.

```bash
npm install
npm run dev        # abre http://localhost:4321
npm run build      # genera la web estática en dist/
npm run preview    # sirve la versión de dist/
```

## Añadir un modelo o resultados nuevos

Todo sale de `src/data/modelos.json`. Para añadir un modelo, copia el bloque de uno existente y cambia
los datos. Cada prueba es `null` mientras no esté hecha:

```json
{
  "id": "gemma-4-12b-q4",
  "nombre": "Gemma 4 12B",
  "familia": "Gemma",
  "cuantizacion": "Q4 · Q4_K_M",
  "tamanoGB": 7.3,
  "parametros": "12B",
  "arquitectura": "Denso",
  "razonamiento": false,
  "licencia": "Apache 2.0",
  "equipo": "SSD NVMe · 32 GB RAM",
  "motor": "llama.cpp",
  "fecha": "2026-11-20",
  "pruebas": {
    "1": {
      "puntos": 5,
      "entrada": { "tokens": 25, "segundos": 0.2, "tps": 125.0 },
      "salida": { "tokens": 4, "segundos": 0.1, "tps": 40.0 }
    },
    "2": null
  }
}
```

- `puntos`: los que saca en esa prueba según `benchmark/SOLUCIONES.md`.
- `entrada` y `salida`: los datos que muestra llama.cpp debajo de tu mensaje y de la respuesta. Si no
  los apuntaste, pon `null`.
- `familia` decide el color. Las familias con color propio son Qwen, Gemma, Llama, Mistral, gpt-oss,
  Phi, DeepSeek y Granite; cualquier otra sale en gris.
- La puntuación, las velocidades medias y los rankings se calculan solos.

## Benchmark

La carpeta `benchmark/` tiene todo lo necesario para pasar las pruebas:

- `PROMPTS.md`: las 10 pruebas, listas para copiar y pegar, y cómo hacerlas.
- `SOLUCIONES.md`: respuestas correctas y criterios de corrección.
- `corregir.py`: corrector automático de las pruebas 3, 6, 7 y 9 (`python corregir.py 6 respuesta6.py`).
- `prueba08_registro.txt`: el texto largo de la prueba 8.

## Estructura

```
src/
  data/benchmark.json   definición de las 10 pruebas
  data/modelos.json     resultados de cada modelo
  lib/metricas.ts       cálculo de puntuación y velocidades
  scripts/app.ts        gráficas, filtros, tabla y tooltips
  components/           metodología
  pages/index.astro     la página
  styles/global.css     estilos (tema claro y oscuro)
benchmark/              prompts, soluciones y corrector
```
