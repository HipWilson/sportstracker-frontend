// app.js — lógica principal de la interfaz

// ── ESTADO ──────────────────────────────────────────────────────────────────
let state = {
  page: 1,
  limit: 20,
  search: '',
  sort: 'created_at',
  order: 'DESC',
  sport: '',
  status: '',
  debounceTimer: null,
  selectedRatingScore: 0,
  editingId: null,
};

// ── HELPERS ─────────────────────────────────────────────────────────────────

function showToast(msg, isError) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast show' + (isError ? ' error' : '');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.className = 'toast'; }, 3000);
}

function statusLabel(status) {
  const map = { pending: 'Pendiente', watching: 'Viendo', completed: 'Completado', dropped: 'Abandonado' };
  return map[status] || status;
}

function sportEmoji(sport) {
  const map = {
    'fútbol': '⚽', 'futbol': '⚽', 'football': '🏈', 'basketball': '🏀',
    'baloncesto': '🏀', 'tenis': '🎾', 'tennis': '🎾', 'formula 1': '🏎️',
    'f1': '🏎️', 'ciclismo': '🚴', 'golf': '⛳', 'baseball': '⚾',
    'béisbol': '⚾', 'natación': '🏊', 'atletismo': '🏃', 'rugby': '🏉',
    'volleyball': '🏐', 'voleibol': '🏐', 'boxeo': '🥊', 'boxing': '🥊',
    'surf': '🏄', 'ski': '⛷️', 'hockey': '🏒',
  };
  return map[(sport || '').toLowerCase()] || '🏆';
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('es-GT', { year: 'numeric', month: 'short', day: 'numeric' });
}

function starBar(avg, count) {
  if (!avg) return '<span style="color:var(--text-dim);font-size:.78rem">Sin calificaciones</span>';
  const filled = Math.round(avg / 2); // score 1-10 → 1-5 stars
  const stars = Array.from({ length: 5 }, (_, i) =>
    `<span style="color:${i < filled ? 'var(--accent)' : 'var(--border)'}">★</span>`
  ).join('');
  return `${stars} <span style="font-size:.78rem;color:var(--text-dim)">${avg} (${count})</span>`;
}

// ── RENDER SERIES GRID ───────────────────────────────────────────────────────

function renderGrid(data) {
  const grid = document.getElementById('seriesGrid');
  const empty = document.getElementById('emptyState');

  if (!data || data.length === 0) {
    grid.innerHTML = '';
    empty.style.display = '';
    return;
  }

  empty.style.display = 'none';
  grid.innerHTML = data.map(s => `
    <div class="series-card" data-id="${s.id}">
      ${s.image_url
        ? `<img class="card-image" src="${s.image_url}" alt="${s.title}" onerror="this.style.display='none'">`
        : `<div class="card-image-placeholder">${sportEmoji(s.sport)}</div>`
      }
      <div class="card-body">
        <div class="card-title">${s.title}</div>
        <div class="card-meta">
          <span class="card-sport-badge">${s.sport}</span>
          ${s.platform ? `<span>${s.platform}</span>` : ''}
          ${s.year ? `<span>${s.year}</span>` : ''}
        </div>
        ${s.avg_rating ? `<div class="card-rating">★ ${s.avg_rating} <span style="color:var(--text-dim);font-weight:400">(${s.rating_count})</span></div>` : ''}
      </div>
      <div class="card-footer">
        <span class="status-pill status-${s.status}">${statusLabel(s.status)}</span>
        ${s.episodes ? `<span style="font-size:.78rem;color:var(--text-dim)">${s.episodes} ep</span>` : ''}
      </div>
      <div class="card-actions">
        <button class="btn-card" onclick="event.stopPropagation(); openDetailModal(${s.id})">Ver</button>
        <button class="btn-card" onclick="event.stopPropagation(); openEditModal(${s.id})">Editar</button>
        <button class="btn-card btn-card-danger" onclick="event.stopPropagation(); confirmDelete(${s.id}, '${s.title.replace(/'/g, "\\'")}')">Borrar</button>
      </div>
    </div>
  `).join('');

  // Click en la card abre el detalle
  grid.querySelectorAll('.series-card').forEach(card => {
    card.addEventListener('click', () => openDetailModal(Number(card.dataset.id)));
  });
}

// ── RENDER PAGINATION ────────────────────────────────────────────────────────

function renderPagination(current, total) {
  const el = document.getElementById('pagination');
  if (total <= 1) { el.innerHTML = ''; return; }

  let html = '';

  html += `<button class="page-btn" ${current <= 1 ? 'disabled' : ''} onclick="goPage(${current - 1})">‹</button>`;

  for (let p = 1; p <= total; p++) {
    if (
      p === 1 || p === total ||
      (p >= current - 1 && p <= current + 1)
    ) {
      html += `<button class="page-btn ${p === current ? 'active' : ''}" onclick="goPage(${p})">${p}</button>`;
    } else if (p === current - 2 || p === current + 2) {
      html += `<span style="color:var(--text-dim);padding:0 4px;align-self:center">…</span>`;
    }
  }

  html += `<button class="page-btn" ${current >= total ? 'disabled' : ''} onclick="goPage(${current + 1})">›</button>`;

  el.innerHTML = html;
}

function goPage(p) {
  state.page = p;
  loadSeries();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── LOAD SERIES ──────────────────────────────────────────────────────────────

async function loadSeries() {
  const grid = document.getElementById('seriesGrid');
  const empty = document.getElementById('emptyState');
  grid.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-dim)"><span class="spinner">⟳</span></div>';
  empty.style.display = 'none';

  try {
    const result = await getSeries({
      q: state.search,
      page: state.page,
      limit: state.limit,
      sort: state.sort,
      order: state.order,
      sport: state.sport,
      status: state.status,
    });

    renderGrid(result.data);
    renderPagination(result.page, result.total_pages);

    // Stats
    document.getElementById('statTotal').textContent = `${result.total} series`;

    // Actualizar filtro de deportes con valores únicos
    updateSportFilter(result.data);

    // Stats simplificados (sólo de la página actual si no hay filtros)
    const watching = (result.data || []).filter(s => s.status === 'watching').length;
    const completed = (result.data || []).filter(s => s.status === 'completed').length;
    document.getElementById('statWatching').textContent = `${watching} viendo`;
    document.getElementById('statCompleted').textContent = `${completed} completadas`;

  } catch (err) {
    grid.innerHTML = '';
    empty.style.display = '';
    showToast('Error al cargar series: ' + err.message, true);
  }
}

// Rellena el select de deportes sin repetir
const knownSports = new Set();
function updateSportFilter(series) {
  if (!series) return;
  const sel = document.getElementById('filterSport');
  series.forEach(s => {
    if (s.sport && !knownSports.has(s.sport.toLowerCase())) {
      knownSports.add(s.sport.toLowerCase());
      const opt = document.createElement('option');
      opt.value = s.sport;
      opt.textContent = s.sport;
      sel.appendChild(opt);
    }
  });
}

// ── MODAL: CREAR / EDITAR ────────────────────────────────────────────────────

function openCreateModal() {
  state.editingId = null;
  document.getElementById('modalTitle').textContent = 'Nueva serie';
  document.getElementById('seriesForm').reset();
  document.getElementById('seriesId').value = '';
  document.getElementById('uploadPreview').innerHTML = '';
  clearFormErrors();
  document.getElementById('imageUploadGroup').style.display = 'none'; // no tiene id todavía
  document.getElementById('seriesModal').classList.add('open');
}

function openEditModal(id) {
  state.editingId = id;
  document.getElementById('modalTitle').textContent = 'Editar serie';
  clearFormErrors();
  document.getElementById('imageUploadGroup').style.display = '';
  document.getElementById('uploadPreview').innerHTML = '';

  getSeriesById(id).then(s => {
    document.getElementById('seriesId').value = s.id;
    document.getElementById('fieldTitle').value = s.title || '';
    document.getElementById('fieldSport').value = s.sport || '';
    document.getElementById('fieldPlatform').value = s.platform || '';
    document.getElementById('fieldStatus').value = s.status || 'pending';
    document.getElementById('fieldEpisodes').value = s.episodes || '';
    document.getElementById('fieldYear').value = s.year || '';
    document.getElementById('fieldDescription').value = s.description || '';
    document.getElementById('fieldImageURL').value = s.image_url || '';
    document.getElementById('seriesModal').classList.add('open');
  }).catch(err => showToast('No se pudo cargar la serie: ' + err.message, true));
}

function closeSeriesModal() {
  document.getElementById('seriesModal').classList.remove('open');
  state.editingId = null;
}

function clearFormErrors() {
  ['errTitle', 'errSport'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
}

// Mostrar errores de validación del server en los campos correspondientes
function showFormErrors(details) {
  const map = { title: 'errTitle', sport: 'errSport' };
  Object.entries(details || {}).forEach(([field, msg]) => {
    const el = document.getElementById(map[field]);
    if (el) el.textContent = msg;
  });
}

// Submit del form
document.getElementById('seriesForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFormErrors();

  const payload = {
    title: document.getElementById('fieldTitle').value.trim(),
    sport: document.getElementById('fieldSport').value.trim(),
    platform: document.getElementById('fieldPlatform').value.trim(),
    status: document.getElementById('fieldStatus').value,
    episodes: parseInt(document.getElementById('fieldEpisodes').value) || 0,
    description: document.getElementById('fieldDescription').value.trim(),
    image_url: document.getElementById('fieldImageURL').value.trim(),
  };

  const yearVal = document.getElementById('fieldYear').value.trim();
  payload.year = yearVal ? parseInt(yearVal) : null;

  const btn = document.getElementById('btnSaveSeries');
  btn.disabled = true;
  btn.textContent = 'Guardando…';

  try {
    let series;
    if (state.editingId) {
      series = await updateSeries(state.editingId, payload);
      showToast('Serie actualizada');
    } else {
      series = await createSeries(payload);
      showToast('Serie creada');

      // Si hay imagen seleccionada, subirla
      const fileInput = document.getElementById('fieldImageFile');
      if (fileInput.files.length > 0) {
        try {
          await uploadSeriesImage(series.id, fileInput.files[0]);
        } catch (imgErr) {
          showToast('Serie creada, pero falló la imagen: ' + imgErr.message, true);
        }
      }
    }

    closeSeriesModal();
    loadSeries();
  } catch (err) {
    if (err.details) {
      showFormErrors(err.details);
    }
    showToast(err.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Guardar';
  }
});

// Preview de imagen al seleccionar archivo
document.getElementById('fieldImageFile').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const preview = document.getElementById('uploadPreview');
  const reader = new FileReader();
  reader.onload = (ev) => {
    preview.innerHTML = `<img src="${ev.target.result}" alt="preview" />`;
  };
  reader.readAsDataURL(file);
});

// ── ELIMINAR ─────────────────────────────────────────────────────────────────

async function confirmDelete(id, title) {
  if (!confirm(`¿Eliminar "${title}"? Esta acción no se puede deshacer.`)) return;

  try {
    await deleteSeries(id);
    showToast('Serie eliminada');
    loadSeries();
  } catch (err) {
    showToast('No se pudo eliminar: ' + err.message, true);
  }
}

// ── MODAL: DETALLE + RATINGS ─────────────────────────────────────────────────

async function openDetailModal(id) {
  const modal = document.getElementById('detailModal');
  const content = document.getElementById('detailContent');
  content.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-dim)"><span class="spinner">⟳</span></div>';
  modal.classList.add('open');

  try {
    const [series, ratingData] = await Promise.all([
      getSeriesById(id),
      getRatings(id),
    ]);
    renderDetailModal(series, ratingData);
  } catch (err) {
    content.innerHTML = `<p style="color:var(--accent2)">Error: ${err.message}</p>`;
  }
}

function renderDetailModal(s, ratingData) {
  const content = document.getElementById('detailContent');
  const ratings = ratingData?.ratings || [];

  const coverHTML = s.image_url
    ? `<img class="detail-cover" src="${s.image_url}" alt="${s.title}" onerror="this.style.display='none'">`
    : `<div class="detail-cover-placeholder">${sportEmoji(s.sport)}</div>`;

  const ratingRows = ratings.map(r => `
    <div class="rating-item">
      <div class="rating-score">${r.score}/10</div>
      <div class="rating-comment">${r.comment || '<em style="opacity:.5">Sin comentario</em>'}</div>
      <div class="rating-date">${formatDate(r.created_at)}</div>
      <button class="rating-delete" onclick="handleDeleteRating(${s.id}, ${r.id})" title="Eliminar">✕</button>
    </div>
  `).join('');

  content.innerHTML = `
    <div class="detail-header">
      ${coverHTML}
      <div class="detail-info">
        <h2 class="detail-title">${s.title}</h2>
        <div class="detail-tags">
          <span class="card-sport-badge">${s.sport}</span>
          <span class="status-pill status-${s.status}">${statusLabel(s.status)}</span>
          ${s.platform ? `<span style="font-size:.8rem;color:var(--text-dim)">${s.platform}</span>` : ''}
        </div>
        ${s.description ? `<p class="detail-description">${s.description}</p>` : ''}
      </div>
    </div>

    <div class="detail-stats">
      ${s.year ? `<div class="detail-stat"><div class="detail-stat-value">${s.year}</div><div class="detail-stat-label">Año</div></div>` : ''}
      ${s.episodes ? `<div class="detail-stat"><div class="detail-stat-value">${s.episodes}</div><div class="detail-stat-label">Episodios</div></div>` : ''}
      <div class="detail-stat">
        <div class="detail-stat-value">${s.avg_rating || '—'}</div>
        <div class="detail-stat-label">Prom. rating</div>
      </div>
      <div class="detail-stat">
        <div class="detail-stat-value">${s.rating_count || 0}</div>
        <div class="detail-stat-label">Votos</div>
      </div>
    </div>

    <div class="rating-section">
      <h3>⭐ Calificaciones</h3>

      <!-- Formulario de nueva calificación -->
      <div class="rating-form" id="ratingFormWrap" data-series-id="${s.id}">
        <div class="star-select" id="starSelect">
          ${[1,2,3,4,5,6,7,8,9,10].map(n =>
            `<button type="button" class="star-btn" data-score="${n}" onclick="setRatingScore(${n})">${n <= 5 ? '★' : '☆'}</button>`
          ).join('')}
        </div>
        <input type="text" class="rating-comment-input" id="ratingCommentInput"
          placeholder="Comentario (opcional)" style="flex:1;min-width:140px;
          background:var(--surface2);border:1px solid var(--border);color:var(--text);
          padding:8px 10px;border-radius:var(--radius);font-family:inherit" />
        <button class="btn-primary" onclick="submitRating(${s.id})" style="white-space:nowrap">Calificar</button>
      </div>

      <!-- Lista de ratings -->
      <div class="rating-list" id="ratingList">
        ${ratings.length
          ? ratingRows
          : '<p style="color:var(--text-dim);font-size:.85rem;padding:8px 0">Sin calificaciones aún. ¡Sé el primero!</p>'
        }
      </div>
    </div>
  `;

  // Reiniciar estado de estrellas
  state.selectedRatingScore = 0;
  updateStarUI(0);
}

// Manejo de estrellas (escala 1-10)
function setRatingScore(score) {
  state.selectedRatingScore = score;
  updateStarUI(score);
}

function updateStarUI(score) {
  const stars = document.querySelectorAll('.star-btn');
  stars.forEach(btn => {
    const n = Number(btn.dataset.score);
    btn.classList.toggle('active', n <= score);
  });
}

async function submitRating(seriesId) {
  if (state.selectedRatingScore === 0) {
    showToast('Selecciona un puntaje (1-10)', true);
    return;
  }
  const comment = document.getElementById('ratingCommentInput')?.value?.trim() || '';

  try {
    await addRating(seriesId, state.selectedRatingScore, comment);
    showToast('Calificación guardada');
    // Recargar el modal de detalle
    const [series, ratingData] = await Promise.all([getSeriesById(seriesId), getRatings(seriesId)]);
    renderDetailModal(series, ratingData);
    loadSeries(); // para actualizar el avg en la card
  } catch (err) {
    showToast(err.message, true);
  }
}

async function handleDeleteRating(seriesId, ratingId) {
  if (!confirm('¿Eliminar esta calificación?')) return;
  try {
    await deleteRating(seriesId, ratingId);
    showToast('Calificación eliminada');
    const [series, ratingData] = await Promise.all([getSeriesById(seriesId), getRatings(seriesId)]);
    renderDetailModal(series, ratingData);
    loadSeries();
  } catch (err) {
    showToast(err.message, true);
  }
}

// ── FILTROS y BÚSQUEDA ────────────────────────────────────────────────────────

document.getElementById('searchInput').addEventListener('input', (e) => {
  clearTimeout(state.debounceTimer);
  state.debounceTimer = setTimeout(() => {
    state.search = e.target.value.trim();
    state.page = 1;
    loadSeries();
  }, 380);
});

document.getElementById('filterStatus').addEventListener('change', (e) => {
  state.status = e.target.value;
  state.page = 1;
  loadSeries();
});

document.getElementById('filterSport').addEventListener('change', (e) => {
  state.sport = e.target.value;
  state.page = 1;
  loadSeries();
});

document.getElementById('sortField').addEventListener('change', (e) => {
  state.sort = e.target.value;
  state.page = 1;
  loadSeries();
});

document.getElementById('btnOrder').addEventListener('click', () => {
  state.order = state.order === 'DESC' ? 'ASC' : 'DESC';
  document.getElementById('btnOrder').textContent = state.order === 'DESC' ? '↑↓' : '↓↑';
  loadSeries();
});

// ── BOTONES HEADER ───────────────────────────────────────────────────────────

document.getElementById('btnNewSeries').addEventListener('click', openCreateModal);

document.getElementById('btnExportCSV').addEventListener('click', () => {
  exportCSV().catch(err => showToast('Error al exportar: ' + err.message, true));
});

document.getElementById('btnExportXLSX').addEventListener('click', () => {
  exportXLSX().catch(err => showToast('Error al exportar: ' + err.message, true));
});

// ── CERRAR MODALES ────────────────────────────────────────────────────────────

document.getElementById('modalClose').addEventListener('click', closeSeriesModal);
document.getElementById('btnCancelModal').addEventListener('click', closeSeriesModal);
document.getElementById('detailModalClose').addEventListener('click', () => {
  document.getElementById('detailModal').classList.remove('open');
});

// Cerrar al hacer click en el overlay
document.getElementById('seriesModal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('seriesModal')) closeSeriesModal();
});
document.getElementById('detailModal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('detailModal')) {
    document.getElementById('detailModal').classList.remove('open');
  }
});

// Cerrar con Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeSeriesModal();
    document.getElementById('detailModal').classList.remove('open');
  }
});

// ── INICIALIZACIÓN ────────────────────────────────────────────────────────────

// Mostrar upload en el modal de creación también
document.getElementById('imageUploadGroup').style.display = '';

loadSeries();