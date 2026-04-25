# 🏆 SportsTracker — Frontend

> Cliente web para rastrear series y documentales deportivos.  
> Construido con **HTML, CSS y JavaScript vanilla puro** — sin frameworks, sin librerías, sin jQuery, sin axios.

**⚙️ Backend repo:** [sportstracker-backend](https://github.com/HipWilson/sportstracker-backend.git)  
**🌐 App en producción:** [https://TU_USUARIO.github.io/sportstracker-frontend/](https://hipwilson.github.io/sportstracker-frontend/)

---

## 📸 Screenshot

<img width="1919" height="1024" alt="image" src="https://github.com/user-attachments/assets/d91c64d4-830f-49ae-b906-45a32060191e" />

---

## 🛠️ Stack

| Tecnología | Uso |
|---|---|
| HTML5 | Estructura semántica |
| CSS3 | Variables CSS, grid de cards, modales, responsive |
| JavaScript ES6+ | Lógica de la app, `fetch()` nativo para la API |
| Google Fonts | Bebas Neue (display) + Barlow (body) |
| GitHub Pages | Deploy en producción |

Sin jQuery. Sin axios. Sin React. Solo el navegador.

---

## 🚀 Correr localmente

El frontend no requiere instalación ni build step. Solo abre `index.html`:

```bash
# Opción 1 — Node
npx serve .

# Opción 2 — Python
python3 -m http.server 3000

# Opción 3 — cualquier servidor estático
```

Asegúrate de que el backend esté corriendo en `http://localhost:8080`.  
La URL de la API está en `js/api.js`:

```js
const API_BASE = 'http://localhost:8080';
```

Para apuntar al backend en producción (Railway), cámbiala por la URL pública:

```js
const API_BASE = 'https://TU_APP.up.railway.app';
```

---

## 📁 Estructura del proyecto

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

---

## ✅ Challenges implementados

- **CRUD completo de series** — crear, leer, actualizar y eliminar desde la interfaz con modales dedicados.
- **Búsqueda con debounce** — búsqueda en tiempo real que espera 380ms antes de consultar la API para no saturarla con cada tecla.
- **Filtros combinados** — filtrado simultáneo por estado, deporte, texto libre, con ordenamiento y dirección (ASC/DESC).
- **Paginación del lado del servidor** — navegación por páginas con puntos suspensivos para rangos largos.
- **Sistema de ratings con estrellas** — selector visual 1–10, cálculo de promedio, listado y eliminación de calificaciones.
- **Subida de imágenes** — upload de portada vía multipart/form-data con preview inmediato y fallback por emoji de deporte.
- **Exportación a CSV** — generado manualmente con BOM UTF-8 para compatibilidad con Excel, sin ninguna librería.
- **Exportación a Excel (.xlsx)** — formato SpreadsheetML construido a mano en XML puro, sin librerías, compatible con Excel y LibreOffice.
- **CORS** — el frontend consume una API en un dominio distinto (Railway vs GitHub Pages); la solución se configuró en el servidor Go con `Access-Control-Allow-Origin: *`.
- **Diseño responsivo** — layout en grid adaptable a móvil, modales con scroll y header sticky.

---

## 💬 Reflexión técnica
 
### ¿Usaría este stack de nuevo?
 
**HTML/CSS/JS vanilla — sí, en proyectos pequeños.** El control total sin capas de abstracción fue liberador. `fetch()` nativo resultó suficiente, pero gestionar el estado global a mano se vuelve frágil rápido — en un proyecto más grande usaría React.
 
**Exportación sin librerías — sí, vale la pena una vez.** Construir el CSV y el SpreadsheetML a mano fue el challenge más didáctico: entendí de verdad el BOM UTF-8 y el formato XML de Office. En producción usaría SheetJS, pero el ejercicio da una comprensión que ninguna librería te da.
 
**GitHub Pages — sí, para estáticos es perfecto.** Deploy gratuito, HTTPS automático, cero configuración.
 
**Lo que cambiaría:** TypeScript para el tipado de la API y algún store reactivo simple para el estado.
 
