// api.js — todas las llamadas al backend
const API_BASE = 'https://sportstracker-backend-production.up.railway.app';

/**
 * Helper interno: hace fetch y lanza error si el status no es 2xx.
 * Retorna el body parseado como JSON, o null si la respuesta es 204 No Content.
 */
async function request(method, path, body) {
  const opts = {
    method,
    headers: {},
  };

  if (body instanceof FormData) {
    // Para subir imágenes, no seteamos Content-Type (el browser lo hace con el boundary)
    opts.body = body;
  } else if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(API_BASE + path, opts);

  if (res.status === 204) return null;

  const data = await res.json();

  if (!res.ok) {
    // Extraemos el mensaje de error del JSON del servidor
    const msg = data?.error || `Error ${res.status}`;
    const err = new Error(msg);
    err.details = data?.details || null;
    err.status = res.status;
    throw err;
  }

  return data;
}

/* ── SERIES ── */

/**
 * Listar series con filtros opcionales.
 * @param {Object} params - { q, page, limit, sort, order, sport, status }
 */
function getSeries(params = {}) {
  const qs = new URLSearchParams();
  if (params.q)      qs.set('q', params.q);
  if (params.page)   qs.set('page', params.page);
  if (params.limit)  qs.set('limit', params.limit);
  if (params.sort)   qs.set('sort', params.sort);
  if (params.order)  qs.set('order', params.order);
  if (params.sport)  qs.set('sport', params.sport);
  if (params.status) qs.set('status', params.status);
  const query = qs.toString() ? '?' + qs.toString() : '';
  return request('GET', '/series' + query);
}

/** Obtener una serie por ID */
function getSeriesById(id) {
  return request('GET', `/series/${id}`);
}

/** Crear una serie nueva */
function createSeries(data) {
  return request('POST', '/series', data);
}

/** Actualizar una serie existente */
function updateSeries(id, data) {
  return request('PUT', `/series/${id}`, data);
}

/** Eliminar una serie */
function deleteSeries(id) {
  return request('DELETE', `/series/${id}`);
}

/** Subir imagen para una serie (FormData con campo "image") */
function uploadSeriesImage(id, file) {
  const fd = new FormData();
  fd.append('image', file);
  return request('POST', `/series/${id}/image`, fd);
}

/* ── RATINGS ── */

/** Obtener calificaciones de una serie */
function getRatings(seriesId) {
  return request('GET', `/series/${seriesId}/rating`);
}

/** Agregar calificación */
function addRating(seriesId, score, comment) {
  return request('POST', `/series/${seriesId}/rating`, { score, comment });
}

/** Eliminar calificación */
function deleteRating(seriesId, ratingId) {
  return request('DELETE', `/series/${seriesId}/rating/${ratingId}`);
}