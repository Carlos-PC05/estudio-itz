import '@fontsource-variable/dm-sans';
import '@fontsource-variable/newsreader';
import './style.css';
import dossier from '../data/buildings.json';
import { STORAGE_KEY, createRound, restoreProgress, rateCurrent, statistics } from './study.js';

const buildings = dossier.buildings;
const byId = new Map(buildings.map(b => [b.id, b]));
const app = document.querySelector('#app');
const h = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const asset = path => `${import.meta.env.BASE_URL}${path}`;
const icon = (name, extra = '') => {
  const paths = {
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    repeat: '<path d="M20 7H8a5 5 0 0 0-5 5m1 5h12a5 5 0 0 0 5-5M16 3l4 4-4 4M8 13l-4 4 4 4"/>',
    expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    building: '<path d="M5 21V10a7 7 0 0 1 14 0v11M9 21V10a3 3 0 0 1 6 0v11M2 21h20"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-11v1"/>',
    source: '<path d="M14 3h7v7m0-7L10 14M10 3H3v18h18v-7"/>',
  };
  return `<svg class="icon ${extra}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? ''}</svg>`;
};
let storageAvailable = true;
let initial;
try {
  const raw = localStorage.getItem(STORAGE_KEY);
  try { initial = JSON.parse(raw ?? 'null'); } catch { initial = null; }
} catch { storageAvailable = false; }
let state = restoreProgress(initial, buildings);
let revealed = false;

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch { storageAvailable = false; }
}

function answer(building) {
  return `<div class="answer-content">
    ${building.sources.map((source, i) => `<section class="source-answer" aria-label="Datos de la página ${source.page}">
      ${i ? '<p class="version-label">Otra ficha del mismo edificio</p>' : ''}
      <h2 ${i === 0 ? 'id="answer-title"' : ''}>${h(source.name)}</h2>
      <dl>${[['Arquitecto', source.architect], ['Ubicación', source.location], ['Fecha', source.date]].map(([label, value]) => `<div><dt>${label}</dt><dd>${value && value !== '-' ? h(value) : '<span class="missing">Sin dato en el dosier</span>'}</dd></div>`).join('')}</dl>
      ${source.pages.map(page => `<a class="source-link" href="${asset(`pages/${String(page).padStart(2, '0')}.webp`)}" target="_blank" rel="noopener">Ver página ${page} del dosier ${icon('source')}</a>`).join('')}
    </section>`).join('')}
    ${building.notes.length ? `<aside class="dossier-note">${icon('info')}<div><strong>Para revisar en el dosier</strong>${building.notes.map(note => `<p>${h(note)}</p>`).join('')}</div></aside>` : ''}
    <div class="rating-area"><p>¿Cómo lo llevabas?</p><div class="rating-buttons"><button class="button review-button" data-action="rate" data-mark="review">${icon('repeat')} Necesito repasarlo</button><button class="button known-button" data-action="rate" data-mark="known">${icon('check')} Lo sabía</button></div><small>Tu valoración se guarda y pasas al siguiente.</small></div>
  </div>`;
}

function study(building) {
  const position = state.round.index + 1;
  const mark = state.marks[building.id];
  return `<div class="study-layout">
    <section class="gallery-panel" aria-label="Imágenes del edificio">
      <div class="gallery-heading"><span>Observa los detalles</span><span>${building.images.length} ${building.images.length === 1 ? 'imagen' : 'imágenes'}</span></div>
      <div class="gallery ${building.images.length === 1 ? 'gallery-single' : ''}">${building.images.map((img, i) => `<button class="image-button" data-action="zoom" data-image="${i}" aria-label="Ampliar imagen ${i + 1}" style="--image-ratio:${img.width / img.height}"><img src="${asset(img.src)}" alt="Vista ${i + 1} del edificio de estudio" width="${img.width}" height="${img.height}" decoding="async" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}><span class="image-expand">${icon('expand')}<span>Ampliar</span></span></button>`).join('')}</div>
      <p class="gallery-caption">Imágenes del dosier del primer parcial. Pulsa para ampliar.</p>
    </section>
    <section class="recall-panel ${revealed ? 'is-revealed' : ''}" aria-label="Ficha de identificación">
      <div class="recall-top"><span class="study-position">Ficha ${position} <span>/ ${state.round.ids.length}</span></span>${mark ? `<span class="mark-label ${mark === 'known' ? 'mark-known' : ''}">${icon(mark === 'known' ? 'check' : 'repeat')}${mark === 'known' ? 'Lo sabías' : 'Para repasar'}</span>` : '<span class="mark-label">Sin valorar</span>'}</div>
      ${revealed ? answer(building) : `<div class="question-content"><span class="question-symbol" aria-hidden="true">?</span><h2 id="question-title">¿Qué edificio<br>estás viendo?</h2><p>Intenta recordar su nombre, arquitecto, ubicación y fecha.</p><button class="button primary reveal-button" data-action="reveal">${icon('eye')} Ver respuestas</button><span class="keyboard-hint">También puedes pulsar <kbd>Espacio</kbd></span></div>`}
    </section>
  </div>`;
}

function roundEnd() {
  const empty = !state.round.ids.length;
  const ids = state.round.ids;
  const known = ids.filter(id => state.marks[id] === 'known').length;
  const review = ids.filter(id => state.marks[id] === 'review').length;
  return `<section class="end-panel"><div class="end-symbol">${icon(empty ? 'check' : 'building')}</div><h2>${empty ? 'Tu repaso está al día.' : 'Una ronda más, un poco más cerca.'}</h2><p>${empty ? 'Aquí aparecerán los edificios que marques como «Necesito repasarlo».' : `Has llegado al final de los ${ids.length} edificios de esta ronda.`}</p>${empty ? '' : `<div class="round-summary"><span><strong>${known}</strong> Lo sabía</span><span><strong>${review}</strong> Para repasar</span><span><strong>${ids.length - known - review}</strong> Sin valorar</span></div>`}<div class="end-actions"><button class="button primary" data-action="${empty ? 'all' : 'restart'}">${icon('repeat')}${empty ? 'Estudiar todos' : 'Nueva ronda'}</button>${!empty && statistics(buildings, state.marks).review ? '<button class="button secondary" data-action="review">Repasar los pendientes</button>' : ''}</div></section>`;
}

function render() {
  const stats = statistics(buildings, state.marks);
  const building = byId.get(state.round.ids[state.round.index]);
  const total = state.round.ids.length;
  const percentage = total ? (state.round.index / total) * 100 : 0;
  app.innerHTML = `<header class="site-header"><a class="brand" href="${import.meta.env.BASE_URL}" aria-label="Arquitectura, inicio">${icon('building')}<span>Arquitectura<span class="brand-dot">.</span></span></a><span class="course-label">Dosier de estudio <span>/</span> Primer parcial</span><span class="save-indicator"><span class="status-dot"></span>${storageAvailable ? 'Progreso guardado en este navegador' : 'Progreso solo en esta sesión'}</span></header>
    <main id="study"><div class="page-heading"><div><h1>Aprende a reconocer.</h1><p>Una imagen, un edificio. Mira, recuerda y comprueba.</p></div><div class="collection-size"><strong>${buildings.length}</strong><span>edificios<br>por descubrir</span></div></div>
    <section class="study-toolbar" aria-label="Opciones de estudio"><div class="mode-tabs" role="group" aria-label="Modo de estudio"><button data-action="all" aria-pressed="${state.mode === 'all'}">Todos <span>${buildings.length}</span></button><button data-action="review" aria-pressed="${state.mode === 'review'}">Necesito repasarlos <span>${stats.review}</span></button></div><div class="round-options"><label for="order">Orden</label><select id="order" aria-describedby="order-hint"><option value="random" ${state.order === 'random' ? 'selected' : ''}>Aleatorio</option><option value="dossier" ${state.order === 'dossier' ? 'selected' : ''}>Del dosier</option></select><button class="restart-button" data-action="restart" aria-label="Iniciar una nueva ronda">${icon('repeat')}<span>Nueva ronda</span></button></div></section>
    <div class="progress-line" role="progressbar" aria-label="Recorrido de la ronda" aria-valuemin="0" aria-valuemax="${Math.max(total, 1)}" aria-valuenow="${state.round.index}" aria-valuetext="${state.round.index} de ${total} edificios recorridos"><span style="width:${percentage}%"></span></div>
    <p id="order-hint" class="options-hint">Cambiar el modo o el orden inicia una nueva ronda y conserva tus valoraciones.</p>
    ${!storageAvailable ? '<p class="storage-warning" role="status">El navegador no permite guardar el progreso. Puedes seguir estudiando, pero los cambios se perderán al cerrar esta página.</p>' : ''}
    ${building ? study(building) : roundEnd()}
    <nav class="study-navigation" aria-label="Navegación de la ronda"><button class="button text-button" data-action="previous" ${state.round.index === 0 ? 'disabled' : ''}>${icon('arrow', 'point-left')} Anterior</button><span>${building ? `Edificio <strong>${state.round.index + 1}</strong> de ${total}` : total ? 'Ronda terminada' : 'Sin edificios pendientes'}</span><button class="button text-button" data-action="next" ${!building ? 'disabled' : ''}>Siguiente ${icon('arrow')}</button></nav>
    <footer class="study-footer"><div class="learning-totals"><span><i class="legend-dot known-dot"></i><strong>${stats.known}</strong> aprendidos</span><span><i class="legend-dot review-dot"></i><strong>${stats.review}</strong> para repasar</span><span><i class="legend-dot unseen-dot"></i><strong>${stats.unseen}</strong> sin valorar</span></div><p>A tu ritmo. Una ficha cada vez.</p></footer></main>
    <dialog class="image-dialog" aria-label="Imagen ampliada"><div class="dialog-toolbar"><span id="zoom-label"></span><div><button class="dialog-arrow" data-action="zoom-previous" aria-label="Imagen anterior">${icon('arrow', 'point-left')}</button><button class="dialog-arrow" data-action="zoom-next" aria-label="Imagen siguiente">${icon('arrow')}</button><button class="dialog-close" data-action="close" aria-label="Cerrar imagen ampliada">${icon('close')}</button></div></div><div class="zoom-content"></div><p>Usa las flechas para cambiar de imagen. Escape para cerrar.</p></dialog>`;
  app.querySelectorAll('.gallery img').forEach(img => img.addEventListener('error', () => {
    img.closest('button').insertAdjacentHTML('beforeend', '<span class="image-error">No se ha podido cargar esta imagen. Recarga la página para reintentarlo.</span>');
  }, { once: true }));
}

function announce(message) {
  document.querySelector('#announcer').textContent = message;
}

function focusCurrent() {
  const title = app.querySelector('#question-title, .end-panel h2');
  title?.setAttribute('tabindex', '-1');
  title?.focus({ preventScroll: true });
  if (matchMedia('(max-width: 760px)').matches) {
    app.querySelector('.gallery-panel, .end-panel')?.scrollIntoView({ block: 'start' });
  }
}

function changeRound(mode = state.mode, order = state.order) {
  state = { ...state, mode, order, round: createRound(buildings, state.marks, mode, order) };
  revealed = false;
  save(); render();
  focusCurrent();
  announce(`Nueva ronda. ${state.round.ids.length} edificios. Respuestas ocultas.`);
}

function navigate(delta) {
  state.round.index = Math.max(0, Math.min(state.round.ids.length, state.round.index + delta));
  revealed = false;
  save(); render();
  focusCurrent();
  announce(state.round.index < state.round.ids.length ? `Edificio ${state.round.index + 1} de ${state.round.ids.length}. Respuestas ocultas.` : 'Ronda terminada.');
}

let zoomIndex = 0;
let zoomOpener;
function zoom(index) {
  const building = byId.get(state.round.ids[state.round.index]);
  if (!building) return;
  zoomIndex = (index + building.images.length) % building.images.length;
  const img = building.images[zoomIndex];
  const dialog = app.querySelector('dialog');
  const view = document.createElement('img');
  view.id = 'zoom-image';
  view.src = asset(img.src);
  view.alt = `Vista ${zoomIndex + 1} del edificio de estudio`;
  dialog.querySelector('.zoom-content').replaceChildren(view);
  dialog.querySelector('#zoom-label').textContent = `Imagen ${zoomIndex + 1} de ${building.images.length}`;
  dialog.querySelectorAll('.dialog-arrow').forEach(button => { button.disabled = building.images.length < 2; });
  if (!dialog.open) {
    zoomOpener = document.activeElement;
    dialog.showModal();
    dialog.querySelector('.dialog-close').focus();
  }
}

app.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button || button.disabled) return;
  switch (button.dataset.action) {
    case 'reveal':
      revealed = true; render();
      app.querySelector('.rating-buttons button')?.focus({ preventScroll: true });
      announce('Respuestas visibles. Ya puedes valorar el edificio.');
      break;
    case 'rate':
      if (!revealed) return;
      state = rateCurrent(state, button.dataset.mark);
      revealed = false; save(); render();
      focusCurrent();
      announce(state.round.index < state.round.ids.length ? 'Valoración guardada. Siguiente edificio, respuestas ocultas.' : 'Valoración guardada. Ronda terminada.');
      break;
    case 'next': navigate(1); break;
    case 'previous': navigate(-1); break;
    case 'all': if (state.mode !== 'all') changeRound('all'); break;
    case 'review': if (state.mode !== 'review') changeRound('review'); break;
    case 'restart': changeRound(); break;
    case 'zoom': zoom(Number(button.dataset.image)); break;
    case 'zoom-previous': zoom(zoomIndex - 1); break;
    case 'zoom-next': zoom(zoomIndex + 1); break;
    case 'close': app.querySelector('dialog').close(); zoomOpener?.focus(); break;
  }
});
app.addEventListener('change', event => { if (event.target.id === 'order') changeRound(state.mode, event.target.value); });
document.addEventListener('keydown', event => {
  if (app.querySelector('dialog').open) {
    if (event.key === 'ArrowLeft') { event.preventDefault(); zoom(zoomIndex - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); zoom(zoomIndex + 1); }
    return;
  }
  if (event.target.closest('button, a, select, input, textarea')) return;
  if (event.code === 'Space' && !revealed && byId.has(state.round.ids[state.round.index])) {
    event.preventDefault(); app.querySelector('[data-action="reveal"]').click();
  }
  if (event.key === 'ArrowRight') { event.preventDefault(); navigate(1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); navigate(-1); }
});
save(); render();
