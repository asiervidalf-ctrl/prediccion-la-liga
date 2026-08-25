# Publicar Porra Caralleiro

La vía más sencilla con almacenamiento persistente es PythonAnywhere. No necesitas mantener tu ordenador encendido.

## 1. Crear la cuenta

Entra en https://eu.pythonanywhere.com y crea una cuenta. El plan gratuito sirve para probar y proporciona una dirección `tuusuario.eu.pythonanywhere.com`; requiere renovar la web mensualmente. El plan Developer evita esa renovación manual.

## 2. Subir el proyecto

En la pestaña **Files**, sube `porra-caralleiro-deploy.zip`. Después abre una consola **Bash** y ejecuta, reemplazando `TU_USUARIO`:

```bash
cd /home/TU_USUARIO
unzip porra-caralleiro-deploy.zip -d porra-caralleiro
cd porra-caralleiro
python3.13 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 3. Crear la web

En **Web**:

1. Pulsa **Add a new web app**.
2. Elige **Manual configuration** y Python 3.13.
3. En **Virtualenv**, escribe `/home/TU_USUARIO/porra-caralleiro/.venv`.
4. Abre el enlace del archivo de configuración WSGI.
5. Borra su contenido y pega lo siguiente, reemplazando `TU_USUARIO`:

```python
import sys

project_path = "/home/TU_USUARIO/porra-caralleiro"
if project_path not in sys.path:
    sys.path.insert(0, project_path)

from pythonanywhere_wsgi import application
```

6. Guarda el archivo y pulsa **Reload**.

La dirección para compartir será `https://TU_USUARIO.eu.pythonanywhere.com`.

## Actualizaciones futuras

Sube los archivos modificados, reemplázalos en `/home/TU_USUARIO/porra-caralleiro` y pulsa **Reload**. No reemplaces `data/predictions.db`, porque contiene las porras publicadas.
