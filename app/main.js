// Bootstrap: loads the data, builds the store, renders the audit strip and the
// active view, and wires every control. Views are switched by tab or by the
// ?view= link; ?demo=1 ticks the demo set once; ?open=<id> (or `platinum`)
// scrolls a trophy card into view. All state lives in the store.

import { computeAudit, loadData, pointsOf } from './data.js';
import { createStore } from './store.js';
import {
  renderAudit,
  renderChecklist,
  renderMissables,
  renderRoadmap,
  renderRoutes,
  renderSources,
  renderTracker,
} from './views.js';

const RENDERERS = {
  tracker: renderTracker,
  roadmap: renderRoadmap,
  checklist: renderChecklist,
  routes: renderRoutes,
  sources: renderSources,
  missables: renderMissables,
};

const params = new URLSearchParams(location.search);
const store = createStore();

const ctx = {
  data: null,
  audit: null,
  store,
  filters: { q: '', grade: '', kind: '', phase: '', missable: false, remaining: false },
  view: RENDERERS[params.get('view')] ? params.get('view') : 'tracker',
  get spoilerOn() {
    return store.state.spoiler;
  },
};

function earnedTotals() {
  const list = ctx.data.trophiesDoc.trophies;
  const earned = list.filter((t) => store.isEarned(t.id));
  return { count: earned.length, pts: earned.reduce((a, t) => a + pointsOf(t), 0) };
}

function renderAll() {
  const totals = earnedTotals();
  renderAudit(document.getElementById('audit'), ctx.audit, totals.count, totals.pts);
  RENDERERS[ctx.view](document.getElementById('view'), ctx);
  document.querySelectorAll('.tab').forEach((b) => {
    b.classList.toggle('active', b.dataset.view === ctx.view);
  });
}

function applyDeepLinks() {
  if (params.get('demo') === '1') {
    store.loadDemo(ctx.audit.demoIds);
    renderAll();
  }
  const open = params.get('open');
  if (!open) return;
  const list = ctx.data.trophiesDoc.trophies;
  const target =
    open === 'platinum'
      ? list.find((t) => t.grade === 'platinum')
      : list.find((t) => String(t.id) === open);
  if (!target) return;
  requestAnimationFrame(() => {
    const el = document.getElementById(`trophy-${target.id}`);
    if (el) el.scrollIntoView({ block: 'center' });
  });
}

function download(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function wireEvents() {
  document.querySelectorAll('.tab').forEach((b) => {
    b.addEventListener('click', () => {
      ctx.view = b.dataset.view;
      renderAll();
    });
  });

  const q = document.getElementById('q');
  q.addEventListener('input', () => {
    ctx.filters.q = q.value;
    if (ctx.view === 'tracker') renderAll();
  });
  document.getElementById('f-grade').addEventListener('change', (e) => {
    ctx.filters.grade = e.target.value;
    renderAll();
  });
  document.getElementById('f-kind').addEventListener('change', (e) => {
    ctx.filters.kind = e.target.value;
    renderAll();
  });
  document.getElementById('f-phase').addEventListener('change', (e) => {
    ctx.filters.phase = e.target.value;
    renderAll();
  });
  document.getElementById('f-missable').addEventListener('change', (e) => {
    ctx.filters.missable = e.target.checked;
    renderAll();
  });
  document.getElementById('f-remaining').addEventListener('change', (e) => {
    ctx.filters.remaining = e.target.checked;
    renderAll();
  });

  const spoiler = document.getElementById('f-spoiler');
  spoiler.checked = store.state.spoiler;
  spoiler.addEventListener('change', () => {
    store.setSpoiler(spoiler.checked);
    renderAll();
  });

  document.getElementById('btn-demo').addEventListener('click', () => {
    store.loadDemo(ctx.audit.demoIds);
    renderAll();
  });
  document.getElementById('btn-export').addEventListener('click', () => {
    download('leonida-field-manual-progress.json', store.exportJson());
  });
  document.getElementById('file-import').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const ok = store.importJson(await file.text());
      if (!ok) alert('That file is not a Field Manual export.');
    } catch {
      alert('Could not read that file.');
    }
    e.target.value = '';
    renderAll();
  });
  document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm('Clear all earned ticks, counters and checklist marks?')) {
      store.reset();
      renderAll();
    }
  });

  // One delegated listener for every control inside the rendered views.
  document.getElementById('view').addEventListener('click', (e) => {
    const inc = e.target.closest('[data-count-inc]');
    const dec = e.target.closest('[data-count-dec]');
    if (inc || dec) {
      const id = Number((inc || dec).dataset.countInc || (inc || dec).dataset.countDec);
      const trophy = ctx.data.trophiesDoc.trophies.find((t) => t.id === id);
      if (!trophy || trophy.count == null) return;
      const next = store.countOf(id) + (inc ? 1 : -1);
      store.setCount(id, next, trophy.count);
      renderAll();
    }
  });
  document.getElementById('view').addEventListener('change', (e) => {
    const earn = e.target.closest('[data-earn]');
    if (earn) {
      store.toggleEarned(Number(earn.dataset.earn));
      renderAll();
      return;
    }
    const c100 = e.target.closest('[data-check100]');
    if (c100) {
      store.toggle100(c100.dataset.check100);
      renderAll();
    }
  });
}

async function init() {
  ctx.data = await loadData();
  ctx.audit = computeAudit(ctx.data);
  wireEvents();
  renderAll();
  applyDeepLinks();
}

init();
