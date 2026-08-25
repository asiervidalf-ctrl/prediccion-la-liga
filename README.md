# La Porra 26/27

Web estática para crear y compartir predicciones de LaLiga 2026/27.

## Entorno de desarrollo en Python

El proyecto usa Python 3.12 o posterior, Flask y `uv` para gestionar el entorno:

```powershell
uv sync
uv run python server.py
```

Abre `http://127.0.0.1:8000` en el navegador. Para ejecutar las comprobaciones:

```powershell
uv run pytest
uv run ruff check .
```

Para actualizar las plantillas y fotos desde las páginas públicas de FútbolFantasy:

```powershell
uv run python scrape_players.py
```

Los resultados se guardan en `data/players.json`; la web usa esa caché para ofrecer el autocompletado sin realizar peticiones durante cada búsqueda.

Si prefieres `pip`, activa un entorno virtual e instala `requirements.txt`.

## Abrir sin servidor

Puedes abrir `index.html` directamente en el navegador. Para que los enlaces compartidos funcionen entre distintos dispositivos, publica la carpeta en un alojamiento estático como GitHub Pages, Netlify o Vercel.

No requiere instalación, dependencias, cuenta ni base de datos. Las elecciones se guardan en el navegador y el botón de compartir codifica la predicción en el propio enlace.

## Archivos

- `index.html`: estructura y contenido.
- `styles.css`: diseño responsive.
- `app.js`: clasificación, premios, guardado y enlaces compartibles.
