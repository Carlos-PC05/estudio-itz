import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shuffle, createRound, restoreProgress, rateCurrent, statistics } from '../src/study.js';

const buildings = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

test('el aleatorio recorre todos los edificios sin repetir ni modificar el origen', () => {
  const values = buildings.map(b => b.id);
  const shuffled = shuffle(values, () => 0);
  assert.deepEqual([...shuffled].sort(), values);
  assert.equal(new Set(shuffled).size, 3);
  assert.deepEqual(values, ['a', 'b', 'c']);
  assert.notDeepEqual(shuffled, values);
});
test('el orden del dosier conserva el orden de aparición', () => {
  assert.deepEqual(createRound(buildings, {}, 'all', 'dossier').ids, ['a', 'b', 'c']);
});
test('el repaso incluye solo pendientes y permite un grupo vacío', () => {
  assert.deepEqual(createRound(buildings, { a: 'known', b: 'review' }, 'review').ids, ['b']);
  assert.deepEqual(createRound(buildings, {}, 'review').ids, []);
});
test('la última valoración retira el edificio del repaso y avanza una sola posición', () => {
  const initial = { marks: { a: 'review' }, mode: 'review', order: 'dossier', round: { ids: ['a'], index: 0 } };
  const result = rateCurrent(initial, 'known');
  assert.equal(result.marks.a, 'known');
  assert.equal(result.round.index, 1);
  assert.equal(initial.marks.a, 'review');
  assert.deepEqual(createRound(buildings, result.marks, 'review').ids, []);
  assert.deepEqual(rateCurrent(result, 'review'), result);
});
test('se recupera la ronda sin volver a mezclar ni perder las valoraciones', () => {
  const saved = { marks: { a: 'known' }, mode: 'all', order: 'random', round: { ids: ['c', 'a', 'b'], index: 2 } };
  assert.deepEqual(restoreProgress(saved, buildings), saved);
});
test('un almacenamiento inválido no introduce duplicados ni edificios ajenos', () => {
  const restored = restoreProgress({ marks: { a: 'known', b: 'bad', deleted: 'review' }, round: { ids: ['a', 'a', 'deleted'], index: 9 } }, buildings);
  assert.deepEqual(restored.marks, { a: 'known' });
  assert.equal(new Set(restored.round.ids).size, 3);
  assert.equal(restored.round.index, 0);
});
test('una ronda completa se recupera como completa', () => {
  const restored = restoreProgress({ round: { ids: ['a', 'b', 'c'], index: 3 } }, buildings);
  assert.equal(restored.round.index, 3);
});
test('las cifras distinguen aprendidos, pendientes y sin valorar', () => {
  assert.deepEqual(statistics(buildings, { a: 'known', b: 'review' }), { known: 1, review: 1, unseen: 1 });
});
