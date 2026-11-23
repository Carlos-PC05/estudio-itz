import { test, expect } from '@playwright/test';

const local = 'http://127.0.0.1:4174/estudio-itz/';
const api = `${local}api/quiz`;

test('Instalaciones envía la configuración y corrige el cuestionario', async ({ page }) => {
  await page.route(api, async route => {
    expect(route.request().headers().authorization).toBeUndefined();
    expect(route.request().postDataJSON()).toEqual({ count: 1, optionCount: 3, instructions: 'Preguntas sobre la LGA' });
    await route.fulfill({ json: { questions: [{
      question: '¿Qué une la LGA?',
      options: ['La CGP y la centralización de contadores', 'La vivienda y la acometida', 'El diferencial y los circuitos interiores'],
      correctIndex: 0,
      explanation: 'La línea general de alimentación enlaza esos dos elementos.',
      page: 42,
    }] } });
  });

  await page.goto(local);
  await page.getByRole('link', { name: /Practicar Instalaciones/ }).click();
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await page.getByLabel('Preguntas', { exact: true }).fill('1');
  await page.getByLabel('Opciones por pregunta').selectOption('3');
  await page.getByLabel('Instrucciones').fill('Preguntas sobre la LGA');
  await page.getByRole('button', { name: 'Generar cuestionario' }).click();
  await expect(page.getByRole('heading', { name: '¿Qué une la LGA?' })).toBeVisible();
  await page.getByRole('button', { name: 'La vivienda y la acometida' }).click();
  const feedback = page.getByRole('status').filter({ hasText: 'Incorrecto' });
  await expect(feedback).toContainText('La CGP y la centralización de contadores');
  await expect(feedback).toContainText('Página 42 del PDF');
  await page.getByRole('button', { name: 'Ver resultado' }).click();
  await expect(page.getByRole('heading', { name: '0 de 1 respuestas correctas' })).toBeVisible();
  await page.getByRole('button', { name: 'Repetir cuestionario' }).click();
  await page.getByRole('button', { name: 'La CGP y la centralización de contadores' }).click();
  await expect(page.getByRole('status').filter({ hasText: /^Correcto/ })).toBeVisible();
});

test('un test inválido permite corregir la configuración y probar el ejemplo', async ({ page }) => {
  await page.route(api, route =>
    route.fulfill({ status: 502, json: { error: 'El modelo devolvió un cuestionario incompleto.' } }));
  await page.goto(`${local}instalaciones/`);
  await page.getByRole('button', { name: 'Generar cuestionario' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'cuestionario incompleto' })).toBeVisible();
  await page.getByRole('button', { name: 'Probar test de ejemplo' }).click();
  await expect(page.getByText('Test de ejemplo', { exact: true })).toBeVisible();
  await expect(page.getByText('Pregunta 1 de 3')).toBeVisible();
});

test('un límite temporal de OpenRouter permite reintentar con cuatro opciones', async ({ page }) => {
  const questions = [
    {
      question: '¿Qué detecta un interruptor diferencial?',
      options: ['Una sobretensión', 'Un exceso de potencia contratada', 'Una fuga de corriente', 'Una caída de tensión'],
      correctIndex: 2,
      explanation: 'Un desequilibrio entre la corriente de ida y de retorno indica una fuga.',
      page: 62,
    },
    {
      question: '¿Qué une la LGA?',
      options: ['La CGP y la centralización de contadores', 'El cuadro y un receptor', 'El contador y la vivienda', 'Dos circuitos interiores'],
      correctIndex: 0,
      explanation: 'La LGA lleva la alimentación desde la CGP hasta la centralización.',
      page: 42,
    },
  ];
  let attempts = 0;
  await page.route(api, async route => {
    const payload = route.request().postDataJSON();
    expect(payload.optionCount).toBe(4);
    attempts += 1;
    if (attempts === 1) {
      await route.fulfill({ status: 429, json: { error: 'OpenRouter ha alcanzado un límite de uso gratuito.' } });
      return;
    }
    await route.fulfill({ json: { questions } });
  });

  await page.goto(`${local}instalaciones/`);
  await page.getByLabel('Preguntas', { exact: true }).fill('2');
  const generate = page.getByRole('button', { name: 'Generar cuestionario' });
  await generate.click();
  await expect(page.getByRole('status').filter({ hasText: 'límite de uso gratuito' })).toBeVisible();
  await generate.click();
  await expect(page.locator('#answers').getByRole('button')).toHaveCount(4);
  await page.getByRole('button', { name: 'Una fuga de corriente' }).click();
  await page.getByRole('button', { name: 'Siguiente pregunta' }).click();
  await expect(page.getByText('Pregunta 2 de 2')).toBeVisible();
  await expect(page.locator('#feedback')).toBeEmpty();
  await page.getByRole('button', { name: 'El cuadro y un receptor' }).click();
  await page.getByRole('button', { name: 'Ver resultado' }).click();
  await expect(page.getByRole('heading', { name: '1 de 2 respuestas correctas' })).toBeVisible();
});

test('el timeout de OpenRouter se distingue de una respuesta truncada', async ({ page }) => {
  let attempts = 0;
  await page.route(api, route => {
    attempts += 1;
    return attempts === 1
      ? route.fulfill({ status: 504, json: { error: 'OpenRouter agotó el tiempo de espera.' } })
      : route.fulfill({ status: 502, json: { error: 'El modelo cortó la respuesta.' } });
  });

  await page.goto(`${local}instalaciones/`);
  const generate = page.getByRole('button', { name: 'Generar cuestionario' });
  await generate.click();
  await expect(page.getByRole('status').filter({ hasText: 'OpenRouter agotó el tiempo de espera' })).toBeVisible({ timeout: 2000 });
  await generate.click();
  await expect(page.getByRole('status').filter({ hasText: 'El modelo cortó la respuesta' })).toBeVisible();
});

test('la compilación estática ofrece el test de ejemplo sin pedir una clave', async ({ page }) => {
  await page.goto('./instalaciones/');
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Generar cuestionario' })).toBeHidden();
  await expect(page.getByText('La generación de nuevos tests', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Probar test de ejemplo' }).click();
  await expect(page.getByText('Pregunta 1 de 3')).toBeVisible();
});
