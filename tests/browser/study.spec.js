import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const data = JSON.parse(await readFile(new URL('../../data/buildings.json', import.meta.url)));
const ids = data.buildings.map(b => b.id);
const key = 'estudio-itz:v1';

async function startAt(page, id, extra = {}) {
  const progress = { marks: {}, mode: 'all', order: 'dossier', round: { ids, index: ids.indexOf(id) }, ...extra };
  await page.addInitScript(({ key, progress }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(progress));
  }, { key, progress });
  await page.goto('./');
}

test('se estudia, se valora y se retoma sin revelar respuestas', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await startAt(page, 'casa-de-la-cascada');
  await expect(page.getByRole('heading', { name: '¿Qué edificio estás viendo?' })).toBeVisible();
  await expect(page.getByText('F.L. WRIGHT', { exact: true })).toHaveCount(0);
  await expect(page.locator('.gallery img')).toHaveCount(1);
  await expect.poll(() => page.locator('.gallery img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-question.png`, fullPage: true, animations: 'disabled' });
  await page.getByRole('button', { name: 'Ver respuestas', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'CASA DE LA CASCADA', exact: true })).toBeVisible();
  await expect(page.getByRole('definition')).toHaveCount(3);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-answer.png`, fullPage: true, animations: 'disabled' });
  await page.getByRole('button', { name: 'Necesito repasarlo', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ver respuestas', exact: true })).toBeVisible();
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
  expect(saved.marks['casa-de-la-cascada']).toBe('review');
  expect(saved.round.index).toBe(ids.indexOf('casa-de-la-cascada') + 1);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Ver respuestas', exact: true })).toBeVisible();
  await expect(page.locator('.study-position')).toContainText(`Ficha ${saved.round.index + 1}`);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('las imágenes del mismo edificio se ven juntas y se pueden ampliar', async ({ page }) => {
  await startAt(page, 'casa-tugendhat');
  await expect(page.locator('.gallery img')).toHaveCount(2);
  await page.getByRole('button', { name: 'Ampliar imagen 1', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('#zoom-label')).toHaveText('Imagen 1 de 2');
  await page.getByRole('button', { name: 'Imagen siguiente', exact: true }).click();
  await expect(page.locator('#zoom-label')).toHaveText('Imagen 2 de 2');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Ampliar imagen 1', exact: true })).toBeFocused();
});

test('las variantes mantienen las fechas y páginas del dosier', async ({ page }) => {
  await startAt(page, 'villa-almerico-capra');
  await expect(page.locator('.gallery img')).toHaveCount(2);
  await expect(page.getByText('ANDREA PALLADIO', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Ver respuestas', exact: true }).click();
  await expect(page.getByRole('definition').filter({ hasText: /^1566$/ })).toHaveCount(1);
  await expect(page.getByRole('definition').filter({ hasText: /^SIGLO XVII$/ })).toHaveCount(1);
  for (const n of [1, 16]) {
    const link = page.getByRole('link', { name: `Ver página ${n} del dosier`, exact: true });
    const response = await page.request.get(await link.getAttribute('href'));
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('image/webp');
  }
});

test('marcar como aprendido retira el único pendiente del siguiente repaso', async ({ page }) => {
  await startAt(page, 'casa-tugendhat', { mode: 'review', marks: { 'casa-tugendhat': 'review' }, round: { ids: ['casa-tugendhat'], index: 0 } });
  await page.getByRole('button', { name: 'Ver respuestas', exact: true }).click();
  await page.getByRole('button', { name: 'Lo sabía', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Una ronda más, un poco más cerca.' })).toBeVisible();
  await page.getByRole('button', { name: 'Nueva ronda', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Tu repaso está al día.' })).toBeVisible();
  await page.getByRole('button', { name: 'Estudiar todos', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ver respuestas', exact: true })).toBeVisible();
});

test('navegar no valora y oculta siempre la siguiente respuesta', async ({ page }) => {
  await startAt(page, 'casa-tugendhat');
  await page.getByRole('button', { name: 'Ver respuestas', exact: true }).click();
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ver respuestas', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Anterior', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ver respuestas', exact: true })).toBeVisible();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).marks, key)).toEqual({});
});

test('cambiar de orden conserva las marcas y crea una ronda completa sin repeticiones', async ({ page }) => {
  await startAt(page, 'casa-tugendhat', { marks: { 'casa-tugendhat': 'known' } });
  await page.getByLabel('Orden', { exact: true }).selectOption('random');
  const state = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
  expect(new Set(state.round.ids).size).toBe(133);
  expect(state.round.index).toBe(0);
  expect(state.marks['casa-tugendhat']).toBe('known');
});

test('el almacenamiento corrupto y la imposibilidad de guardar tienen recuperación', async ({ page }) => {
  await page.addInitScript(key => localStorage.setItem(key, '{incorrecto'), key);
  await page.goto('./');
  await expect(page.getByRole('button', { name: 'Ver respuestas', exact: true })).toBeVisible();
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('Storage blocked'); }; });
  await page.reload();
  await expect(page.getByRole('status').filter({ hasText: 'El navegador no permite guardar' })).toBeVisible();
  await page.getByRole('button', { name: 'Ver respuestas', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Lo sabía', exact: true })).toBeVisible();
});
