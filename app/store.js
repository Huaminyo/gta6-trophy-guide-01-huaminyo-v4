// Browser state: earned ticks, count-tracker values, the 100% checklist and
// the spoiler setting, all in localStorage under one key. Export writes the
// whole state as one JSON file; import reads such a file back. Nothing here
// ever touches the network.

const KEY = 'leonida-field-manual-v1';

function freshState() {
  return { earned: [], counts: {}, checked100: [], spoiler: true };
}

function normalize(parsed) {
  const state = freshState();
  if (!parsed || typeof parsed !== 'object') return state;
  if (Array.isArray(parsed.earned)) state.earned = parsed.earned.filter((v) => Number.isInteger(v));
  if (parsed.counts && typeof parsed.counts === 'object') {
    for (const [k, v] of Object.entries(parsed.counts)) {
      if (Number.isInteger(v) && v >= 0) state.counts[k] = v;
    }
  }
  if (Array.isArray(parsed.checked100)) state.checked100 = parsed.checked100.filter((v) => typeof v === 'string');
  if (typeof parsed.spoiler === 'boolean') state.spoiler = parsed.spoiler;
  return state;
}

export function createStore() {
  let state = freshState();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = normalize(JSON.parse(raw));
  } catch {
    state = freshState();
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // Storage full or blocked: the guide still works for this session.
    }
  }

  return {
    get state() {
      return state;
    },
    isEarned(id) {
      return state.earned.includes(id);
    },
    toggleEarned(id) {
      state.earned = state.earned.includes(id)
        ? state.earned.filter((v) => v !== id)
        : [...state.earned, id];
      save();
    },
    countOf(id) {
      return state.counts[id] || 0;
    },
    setCount(id, value, max) {
      const clamped = Math.max(0, Math.min(max, Math.floor(value) || 0));
      if (clamped === 0) delete state.counts[id];
      else state.counts[id] = clamped;
      save();
    },
    isChecked100(key) {
      return state.checked100.includes(key);
    },
    toggle100(key) {
      state.checked100 = state.checked100.includes(key)
        ? state.checked100.filter((v) => v !== key)
        : [...state.checked100, key];
      save();
    },
    loadDemo(ids) {
      state.earned = [...new Set([...state.earned, ...ids])];
      save();
    },
    setSpoiler(on) {
      state.spoiler = Boolean(on);
      save();
    },
    reset() {
      state = freshState();
      save();
    },
    exportJson() {
      return JSON.stringify(state, null, 2);
    },
    importJson(text) {
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false;
      state = normalize(parsed);
      save();
      return true;
    },
  };
}
