import { readFile, stat } from 'node:fs/promises';
import assert from 'node:assert/strict';

const dossier = JSON.parse(await readFile(new URL('../data/buildings.json', import.meta.url)));
assert.equal(dossier.pageCount, 26, 'Deben estar las 26 páginas');
assert.equal(dossier.sourceCount, 136, 'Deben estar las 136 fichas de origen');
assert.equal(dossier.imageCount, 167, 'Deben estar las 167 imágenes');
const ids = new Set();
const sourceIds = new Set();
const images = new Set();
for (const building of dossier.buildings) {
  assert(!ids.has(building.id), `Edificio duplicado: ${building.id}`);
  ids.add(building.id);
  assert(building.images.length, `Faltan imágenes: ${building.id}`);
  assert(building.sources.length, `Faltan datos: ${building.id}`);
  for (const source of building.sources) {
    assert(!sourceIds.has(source.sourceId), `Ficha repetida: ${source.sourceId}`);
    sourceIds.add(source.sourceId);
    for (const field of ['name', 'architect', 'location', 'date']) {
      assert.equal(typeof source[field], 'string');
      assert(!/NOMBRE:|ARQUITECTO:|UBICACIÓN:|FECHA:|TEMA \d/.test(source[field]), `Campo mal separado: ${source.sourceId} ${field}`);
    }
    assert(source.name.length, `Nombre vacío: ${source.sourceId}`);
    assert(source.pages.includes(source.page));
  }
  for (const image of building.images) {
    assert(!images.has(image.src), `Imagen asignada dos veces: ${image.src}`);
    images.add(image.src);
    assert(image.width > 0 && image.height > 0);
    assert((await stat(new URL(`../public/${image.src}`, import.meta.url))).size > 0);
  }
}
assert.equal(sourceIds.size, dossier.sourceCount);
assert.equal(images.size, dossier.imageCount);
for (let page = 1; page <= dossier.pageCount; page++) {
  await stat(new URL(`../public/pages/${String(page).padStart(2, '0')}.webp`, import.meta.url));
}
for (const id of ['villa-almerico-capra', 'panteon-de-agripa', 'cupula-de-santa-maria-del-fiore']) {
  assert.equal(dossier.buildings.find(b => b.id === id).sources.length, 2, `Revisar equivalencia: ${id}`);
}
const tourette = dossier.buildings.find(b => b.id === 'convento-de-tourette').sources[0];
assert.equal(tourette.architect, 'LE CORBUSIER');
assert.deepEqual(tourette.pages, [19, 20]);
assert.equal(dossier.buildings.find(b => b.id === 'museo-teatro-romano').sources[0].architect, 'RAFAEL MONEO');
const overrides = JSON.parse(await readFile(new URL('../data/overrides.json', import.meta.url)));
for (const id of Object.keys(overrides.notes)) assert(ids.has(id), `Nota sin edificio: ${id}`);
console.log(`Dosier validado: ${ids.size} edificios, ${sourceIds.size} fichas y ${images.size} imágenes.`);
