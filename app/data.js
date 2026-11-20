// Data layer: loads the three JSON files shipped under app/data/ and derives
// every number the audit strip shows, so no figure in the guide is hand-typed.
// All joins are by number: a trophy's sources and a step's citations name a
// source's `n`; a trophy's dispute names a dispute's `id` (D1-D9).

export const GRADE_POINTS = { platinum: 300, gold: 90, silver: 30, bronze: 15 };
export const GRADE_RANK = { platinum: 0, gold: 1, silver: 2, bronze: 3 };

export async function loadData() {
  const [trophiesDoc, routesDoc, sourcesDoc] = await Promise.all([
    fetch('data/trophies.json').then((r) => r.json()),
    fetch('data/routes.json').then((r) => r.json()),
    fetch('data/sources.json').then((r) => r.json()),
  ]);
  return { trophiesDoc, routesDoc, sourcesDoc };
}

export function pointsOf(trophy) {
  return GRADE_POINTS[trophy.grade] || 0;
}

export function allSteps(list) {
  return list.flatMap((t) => t.steps || []);
}

// The audit: every figure the sticky strip shows, computed from the data.
export function computeAudit({ trophiesDoc, sourcesDoc }) {
  const list = trophiesDoc.trophies;
  const steps = allSteps(list);
  const cited = steps.filter((s) => Array.isArray(s.s) && s.s.length > 0).length;
  const backed = list.filter(
    (t) => (t.sources || []).length === 2 && (t.steps || []).length >= 2,
  ).length;
  const demo = list.filter(
    (t) => String(t.phase) === '1' && String(t.missable) === 'none',
  );
  return {
    total: list.length,
    official: list.filter(
      (t) => t.name && typeof t.guide === 'string' && t.guide.trim().length > 0,
    ).length,
    stepsTotal: steps.length,
    stepsCited: cited,
    backed,
    sources: (sourcesDoc.sources || []).length,
    disputes: (sourcesDoc.disputes || []).length,
    trackers: list.filter((t) => t.count != null).length,
    hidden: list.filter((t) => t.hidden === true).length,
    demoCount: demo.length,
    demoPts: demo.reduce((a, t) => a + pointsOf(t), 0),
    totalPts: list.reduce((a, t) => a + pointsOf(t), 0),
    demoIds: demo.map((t) => t.id),
  };
}

export function phasePoints(list, phase) {
  return list
    .filter((t) => String(t.phase) === String(phase))
    .reduce((a, t) => a + pointsOf(t), 0);
}

export function phaseTrophies(list, phase) {
  return list.filter((t) => String(t.phase) === String(phase));
}

export function sourceByNumber(sourcesDoc, n) {
  return (sourcesDoc.sources || []).find((s) => s.n === n);
}

export function disputeById(sourcesDoc, id) {
  return (sourcesDoc.disputes || []).find((d) => d.id === id);
}

export function missableList(list) {
  return list.filter((t) => t.missable === 'watch' || t.missable === 'possible');
}

export function sortedForTracker(list) {
  return [...list].sort((a, b) => {
    const g = (GRADE_RANK[a.grade] ?? 9) - (GRADE_RANK[b.grade] ?? 9);
    if (g !== 0) return g;
    return String(a.name).localeCompare(String(b.name));
  });
}
