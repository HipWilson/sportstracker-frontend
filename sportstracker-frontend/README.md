# 🏆 SportsTracker — Frontend

Cliente web para rastrear series y documentales deportivos.
Construido con HTML, CSS y JavaScript vanilla puro — sin frameworks, sin librerías, sin jQuery, sin axios.

**⚙️ Backend repo:** [sportstracker-backend](https://github.com/TU_USUARIO/sportstracker-backend)  
**🌐 App en producción:** https://TU_USUARIO.github.io/sportstracker-frontend/

---

## Stack

| Tecnología | Uso |
|---|---|
| HTML5 | Estructura semántica |
| CSS3 | Estilos con variables CSS, sin frameworks |
| JavaScript ES6+ | Lógica de la app, `fetch()` nativo para la API |
| Google Fonts | Bebas Neue + Barlow |
| GitHub Pages | Deploy en producción |

Sin jQuery. Sin axios. Sin React. Solo el navegador.

---

## ¿Qué es CORS y qué se configuró?

CORS (Cross-Origin Resource Sharing) es un mecanismo de seguridad del navegador que bloquea peticiones HTTP entre orígenes distintos. Como este cliente corre en GitHub Pages (`https://TU_USUARIO.github.io`) y el backend corre en Railway (`https://TU_APP.up.railway.app`), son orígenes distintos y el navegador bloquearía los `fetch()` por defecto.

La solución se configuró en el servidor Go con el header `Access-Control-Allow-Origin: *`, que le indica al navegador que el servidor acepta peticiones desde cualquier origen. Sin esta configuración, la app no podría comunicarse con la API.

---

## Funcionalidades

### CRUD de series
- Crear series con título, deporte, plataforma, estado, episodios, año y descripción
- Ver el detalle completo de cada serie en un modal
- Editar cualquier campo de una serie existente
- Eliminar series con confirmación

### Búsqueda y filtros
- Búsqueda en tiempo real con debounce (espera 380ms antes de consultar)
- Filtro por estado: pendiente, viendo, completado, abandonado
- Filtro por deporte
- Ordenamiento por título, deporte, año, fecha de creación o rating
- Alternancia entre orden ascendente y descendente

### Paginación
- Navegación por páginas con botones anterior/siguiente
- Indicador de página activa
- Puntos suspensivos para rangos de páginas largas

### Sistema de rating
- Calificación del 1 al 10 con selector visual de estrellas
- Comentario opcional por calificación
- Promedio de calificaciones visible en cada card
- Listado y eliminación de calificaciones en el modal de detalle

### Imágenes
- Subida de imagen desde el formulario de edición (máximo 1MB)
- Preview inmediato al seleccionar el archivo
- Fallback con emoji del deporte si no hay imagen

### Exportación
- **CSV**: generado manualmente con JavaScript, incluye BOM UTF-8 para compatibilidad con Excel
- **Excel (.xlsx)**: formato SpreadsheetML construido a mano sin ninguna librería, compatible con Excel y LibreOffice

---

## Estructura del proyecto

```
sportstracker-frontend/
├── index.html          # Estructura HTML: header, filtros, grid, modales
├── css/
│   └── style.css       # Variables CSS, grid de cards, modales, responsive
└── js/
    ├── api.js          # Módulo de llamadas al backend con fetch()
    ├── export.js       # Exportación a CSV y Excel sin librerías
    └── app.js          # Estado, renderizado, eventos, UI completa
```

Cada archivo tiene una responsabilidad clara y separada.

---

## Correr localmente

El frontend no necesita instalación. Solo abre `index.html` en el navegador, o levanta un servidor estático:

```bash
# Opción 1 — Node
npx serve .

# Opción 2 — Python
python3 -m http.server 3000

# Opción 3 — cualquier servidor estático
```

Asegúrate de que el backend esté corriendo en `http://localhost:8080`. La URL está en `js/api.js`:

```js
const API_BASE = 'http://localhost:8080';
```

---

## Deploy en GitHub Pages

1. Ir a **Settings → Pages** del repositorio
2. Source: `Deploy from a branch`
3. Branch: `main` / `(root)`
4. Guardar — en aproximadamente 1 minuto estará disponible en:
   `https://TU_USUARIO.github.io/sportstracker-frontend/`

Antes del deploy, actualizar `API_BASE` en `js/api.js` con la URL pública del backend en Railway:

```js
const API_BASE = 'https://TU_APP.up.railway.app';
```

---

## Notas de implementación

**CSV manual:** la función `escapeCSV()` encierra en comillas dobles cualquier valor que contenga comas, comillas o saltos de línea, y duplica las comillas internas. Se agrega BOM UTF-8 (`\uFEFF`) al inicio para que Excel detecte correctamente la codificación.

**Excel sin librerías:** se usa el formato SpreadsheetML de Microsoft Office, que es un XML único que Excel y LibreOffice abren directamente. No se necesita crear un archivo ZIP porque SpreadsheetML es un documento XML independiente con la extensión `.xlsx`. Cada celda se tipifica como `String` o `Number` para que Excel la procese correctamente.

**Debounce en búsqueda:** el input de búsqueda espera 380ms después de que el usuario deja de escribir antes de hacer la petición, para no saturar la API con cada tecla.

**Estado global:** toda la app maneja un objeto `state` con la página actual, filtros activos y orden seleccionado. Cualquier cambio en un filtro reinicia la página a 1 antes de recargar.