// Views: every screen the manual shows, rendered from the loaded data. The
// audit strip is computed live; a trophy card shows its official name,
// description and grade, its guide in our own words, each step with its
// citations, and any dispute resolved to its question and call — never a raw
// id. Hidden trophies stay masked while the spoiler setting is on and the
// trophy is not earned yet.

import {
  disputeById,
  missableList,
  phasePoints,
  phaseTrophies,
  pointsOf,
  sourceByNumber,
  sortedForTracker,
} from './data.js';

export function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function prettyKey(key) {
  return String(key)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function maskedName(trophy, spoilerOn, earned) {
  if (spoilerOn && trophy.hidden && !earned) return '◆ Hidden Trophy';
  return trophy.name;
}

function maskedDesc(trophy, spoilerOn, earned) {
  if (spoilerOn && trophy.hidden && !earned) return '•••••••••••• — hidden on PlayStation until earned.';
  return trophy.description || '';
}

function citations(step, sourcesDoc) {
  if (!Array.isArray(step.s) || step.s.length === 0) return '';
  return step.s
    .map((n) => {
      const src = sourceByNumber(sourcesDoc, n);
      const label = src ? `${src.site || 'Source'} #${n}` : `Source #${n}`;
      return `<a class="cite" href="#src-${n}" title="${esc(label)}">[${n}]</a>`;
    })
    .join(' ');
}

function sourcesLine(trophy, sourcesDoc) {
  const list = (trophy.sources || [])
    .map((n) => sourceByNumber(sourcesDoc, n))
    .filter(Boolean);
  if (list.length === 0) return '';
  return `<p class="srcs">Sources: ${list
    .map((s) => `<a class="cite" href="#src-${s.n}">${esc(s.site || 'Source')} #${s.n}</a>`)
    .join(' · ')}</p>`;
}

function disputeBox(trophy, sourcesDoc) {
  if (!trophy.dispute) return '';
  const d = disputeById(sourcesDoc, trophy.dispute);
  if (!d) return '';
  return `<div class="dispute"><b>Disputed · ${esc(d.id)}</b><br>${esc(d.q)}<br><span>Call: ${esc(d.call)}</span></div>`;
}

function trackerRow(trophy, store) {
  if (trophy.count == null) return '';
  const current = store.countOf(trophy.id);
  const pct = Math.min(100, Math.round((current / trophy.count) * 100));
  return `<div class="tracker-row">
    <span>${esc(trophy.countLabel || 'Progress')}: ${current} / ${trophy.count} ${esc(trophy.countUnit || '')}</span>
    <div class="tracker-bar"><div class="tracker-fill" style="width:${pct}%"></div></div>
    <button type="button" data-count-dec="${trophy.id}" aria-label="Decrease count">−</button>
    <button type="button" data-count-inc="${trophy.id}" aria-label="Increase count">+</button>
  </div>`;
}

function trophyCard(trophy, ctx) {
  const { store } = ctx;
  const sourcesDoc = ctx.data.sourcesDoc;
  const spoilerOn = store.state.spoiler;
  const earned = store.isEarned(trophy.id);
  const grade = String(trophy.grade || '').toLowerCase();
  const missable = trophy.missable === 'watch' || trophy.missable === 'possible';
  const steps = (trophy.steps || [])
    .map((st) => `<li>${esc(st.t)} ${citations(st, sourcesDoc)}</li>`)
    .join('');
  return `<article class="card ${esc(grade)}${earned ? ' earned' : ''}" id="trophy-${trophy.id}" data-trophy="${trophy.id}">
    <div class="card-top">
      <input class="card-check" type="checkbox" data-earn="${trophy.id}" ${earned ? 'checked' : ''} aria-label="Mark ${esc(trophy.name)} earned">
      <div>
        <h3 class="card-name">${esc(maskedName(trophy, spoilerOn, earned))}</h3>
        <div class="card-meta">
          <span class="badge grade-${esc(grade)}">${esc(grade)}</span>
          <span class="badge pts">${pointsOf(trophy)} PTS</span>
          <span class="badge">Phase ${esc(trophy.phase)}</span>
          <span class="badge">${esc(trophy.kind || 'trophy')}</span>
          ${missable ? `<span class="badge missable">Missable · ${esc(trophy.missable)}</span>` : ''}
          ${trophy.hidden ? '<span class="badge hidden-flag">Hidden</span>' : ''}
        </div>
      </div>
    </div>
    <p class="card-desc">${esc(maskedDesc(trophy, spoilerOn, earned))}</p>
    <p class="card-guide">${esc(trophy.guide)}</p>
    ${steps ? `<ol class="steps">${steps}</ol>` : ''}
    ${sourcesLine(trophy, sourcesDoc)}
    ${disputeBox(trophy, sourcesDoc)}
    ${trackerRow(trophy, store)}
  </article>`;
}

export function renderAudit(el, audit, earnedCount, earnedPts) {
  el.innerHTML = `<div class="audit-inner">
    <span class="audit-item">AUDIT <b>${audit.official}/${audit.total}</b> official</span>
    <span class="audit-item"><b>${audit.stepsCited}/${audit.stepsTotal}</b> steps cited</span>
    <span class="audit-item"><b>${audit.backed}</b> backed 2+</span>
    <span class="audit-item"><b>${audit.sources}</b> sources</span>
    <span class="audit-item"><b>${audit.disputes}</b> disputes</span>
    <span class="audit-item"><b>${audit.trackers}</b> trackers</span>
    <span class="audit-item"><b>${audit.hidden}</b> hidden</span>
    <span class="audit-item">demo <b>${audit.demoCount}/55</b> · <b>${audit.demoPts}/${audit.totalPts}</b> PTS</span>
    <span class="audit-item audit-progress">YOUR PROGRESS <b>${earnedCount}/55</b> · <b>${earnedPts}/${audit.totalPts}</b> PTS</span>
  </div>`;
}

export function renderTracker(view, ctx) {
  const { data, filters } = ctx;
  const list = sortedForTracker(data.trophiesDoc.trophies);
  const q = (filters.q || '').toLowerCase();
  const shown = list.filter((t) => {
    if (filters.grade && t.grade !== filters.grade) return false;
    if (filters.kind && t.kind !== filters.kind) return false;
    if (filters.phase && String(t.phase) !== filters.phase) return false;
    if (filters.missable && !(t.missable === 'watch' || t.missable === 'possible')) return false;
    if (filters.remaining && ctx.store.isEarned(t.id)) return false;
    if (q) {
      const hay = `${t.name} ${t.description || ''} ${t.guide || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  view.innerHTML = `<div class="view-head"><h2>Tracker — all 55 trophies</h2>
    <p>Tick a trophy when you earn it; progress saves in this browser. Every guide cites its sources beside the steps.</p></div>
    <p class="count-line">Showing ${shown.length} of ${list.length} trophies</p>
    <div class="cards">${shown.map((t) => trophyCard(t, ctx)).join('')}</div>
    ${shown.length === 0 ? '<p class="empty">No trophy matches these filters.</p>' : ''}`;
}

export function renderRoadmap(view, ctx) {
  const { data } = ctx;
  const list = data.trophiesDoc.trophies;
  const phases = data.trophiesDoc.meta.roadmap || [];
  const spoilerOn = ctx.store.state.spoiler;
  const blocks = phases
    .map((p) => {
      const members = phaseTrophies(list, p.id);
      const names = members
        .map((t) => {
          const earned = ctx.store.isEarned(t.id);
          const label = spoilerOn && t.hidden && !earned ? '◆ Hidden Trophy' : t.name;
          return `<li>${esc(label)} <span class="badge grade-${esc(t.grade)}">${esc(t.grade)}</span> ${earned ? '<span class="ok">✓</span>' : ''}</li>`;
        })
        .join('');
      return `<section class="phase"><h3>Phase ${esc(p.id)} · ${esc(p.name)} <span class="pts">${phasePoints(list, p.id)} PTS</span></h3>
        <p>${esc(p.hours || '')} · ${esc(p.note || '')} · ${members.length} trophies</p>
        <ul>${names}</ul></section>`;
    })
    .join('');
  view.innerHTML = `<div class="view-head"><h2>Roadmap to the platinum</h2>
    <p>Four phases, in the order to play them. Phase 1 is the story run; Phase 2 sweeps the 100% checklist; Phase 3 mops up strangers and cleanup; Phase 4 is the platinum itself. Hidden names stay masked while the spoiler setting is on.</p></div>${blocks}`;
}

export function renderChecklist(view, ctx) {
  const { data, store } = ctx;
  const counts = data.trophiesDoc.meta.counts || {};
  const keys = Object.keys(counts);
  const done = keys.filter((k) => store.isChecked100(k)).length;
  const items = keys
    .map(
      (k) => `<label class="check-item${store.isChecked100(k) ? ' done' : ''}">
        <input type="checkbox" data-check100="${esc(k)}" ${store.isChecked100(k) ? 'checked' : ''}>
        <span>${esc(prettyKey(k))}</span><span class="target">${counts[k]}</span>
      </label>`,
    )
    .join('');
  view.innerHTML = `<div class="view-head"><h2>100% Checklist</h2>
    <p>${data.trophiesDoc.meta.note_100 || ''}</p></div>
    <p class="count-line">${done} of ${keys.length} categories complete</p>
    <div class="check-grid">${items}</div>`;
}

export function renderRoutes(view, ctx) {
  const routes = ctx.data.routesDoc.routes || [];
  const blocks = routes
    .map((r) => {
      const stages = (r.stages || [])
        .map((s) => `<li><b>${esc(s.label)}</b>${s.tip ? ` <span class="tip">— ${esc(s.tip)}</span>` : ''}</li>`)
        .join('');
      return `<section class="route"><h3>${esc(r.title)} <span class="count">${r.count} ${esc(r.unit || '')}</span></h3><ol>${stages}</ol></section>`;
    })
    .join('');
  view.innerHTML = `<div class="view-head"><h2>Routes — ${routes.length} efficient runs</h2>
    <p>Ordered stage lists for the long grinds: each route is the shortest path through its collectibles or activities, in the order to do them.</p></div>${blocks}`;
}

export function renderSources(view, ctx) {
  const { sourcesDoc } = ctx.data;
  const sources = sourcesDoc.sources || [];
  const disputes = sourcesDoc.disputes || [];
  const srcCards = sources
    .map(
      (s) => `<article class="src-card" id="src-${s.n}"><b>[${s.n}] ${esc(s.title)}</b> · <span class="site">${esc(s.site || '')}</span><br>
        ${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a><br>` : ''}
        ${s.note ? `<p>${esc(s.note)}</p>` : ''}${s.read ? `<p>Read ${esc(s.read)}.</p>` : ''}</article>`,
    )
    .join('');
  const disputeCards = disputes
    .map(
      (d) => `<article class="src-card"><b>${esc(d.id)}</b> · ${esc(d.q)}<br>
        <p>A: ${esc(d.a)}<br>B: ${esc(d.b)}</p><p><b>Call:</b> ${esc(d.call)}</p></article>`,
    )
    .join('');
  view.innerHTML = `<div class="view-head"><h2>Sources &amp; disputes</h2>
    <p>${esc(sourcesDoc.method_note || 'Every fact in a guide names where it came from.')}</p></div>
    <h3 class="view-head" style="margin-top:18px">Sources (${sources.length})</h3>${srcCards}
    <h3 class="view-head" style="margin-top:18px">Open disputes (${disputes.length})</h3>${disputeCards}`;
}

export function renderMissables(view, ctx) {
  const list = missableList(ctx.data.trophiesDoc.trophies);
  view.innerHTML = `<div class="view-head"><h2>Missables — ${list.length} trophies</h2>
    <p>These can be missed: a story choice, a one-time event, or a window that closes. Do them on the first run, in the order the roadmap gives, or be ready to replay the chapter. Each card says exactly when the window is.</p></div>
    <div class="cards">${list.map((t) => trophyCard(t, ctx)).join('')}</div>`;
}
