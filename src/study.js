export const STORAGE_KEY = 'estudio-itz:v1';

export function shuffle(values, random = Math.random) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createRound(buildings, marks, mode = 'all', order = 'random', random = Math.random) {
  const ids = buildings.filter(b => mode === 'all' || marks[b.id] === 'review').map(b => b.id);
  return { ids: order === 'random' ? shuffle(ids, random) : ids, index: 0 };
}

export function restoreProgress(raw, buildings) {
  const validIds = new Set(buildings.map(b => b.id));
  const marks = Object.fromEntries(Object.entries(raw?.marks ?? {}).filter(([id, mark]) => validIds.has(id) && ['known', 'review'].includes(mark)));
  const mode = raw?.mode === 'review' ? 'review' : 'all';
  const order = raw?.order === 'dossier' ? 'dossier' : 'random';
  let round = raw?.round;
  if (!round || !Array.isArray(round.ids) || !round.ids.every(id => validIds.has(id)) || new Set(round.ids).size !== round.ids.length || !Number.isInteger(round.index) || round.index < 0 || round.index > round.ids.length || (mode === 'all' && round.ids.length !== buildings.length)) {
    round = createRound(buildings, marks, mode, order);
  } else {
    round = { ids: [...round.ids], index: round.index };
  }
  return { marks, mode, order, round };
}

export function rateCurrent(state, mark) {
  const id = state.round.ids[state.round.index];
  if (!id || !['known', 'review'].includes(mark)) return state;
  return { ...state, marks: { ...state.marks, [id]: mark }, round: { ...state.round, index: state.round.index + 1 } };
}

export function statistics(buildings, marks) {
  const known = buildings.filter(b => marks[b.id] === 'known').length;
  const review = buildings.filter(b => marks[b.id] === 'review').length;
  return { known, review, unseen: buildings.length - known - review };
}
