import { test, expect } from '@playwright/test';

test('Instalaciones envía la configuración y corrige el cuestionario', async ({ page }) => {
  await page.route('https://openrouter.ai/api/v1/chat/completions', async route => {
    const request = route.request();
    const payload = request.postDataJSON();
    expect(payload.model).toBe('openrouter/free');
    expect(JSON.parse(payload.messages[1].content)).toEqual({
      preguntas: 1,
      opcionesPorPregunta: 3,
      preferencias: 'Preguntas sobre la LGA',
    });
    expect(payload.messages[0].content).toContain('[Página PDF 67]');
    expect(payload.messages[0].content).not.toContain('[Página PDF 68]');
    await route.fulfill({ json: { choices: [{ message: { content: JSON.stringify({ questions: [{
      question: '¿Qué une la LGA?',
      options: ['La CGP y la centralización de contadores', 'La vivienda y la acometida', 'El diferencial y los circuitos interiores'],
      correctIndex: 0,
      explanation: 'La línea general de alimentación enlaza esos dos elementos.',
      page: 42,
    }] }) } }] } });
  });

  await page.goto('./');
  await page.getByText('Instalaciones', { exact: true }).click();
  await page.getByRole('link', { name: /Cuestionarios interactivos/ }).click();
  await page.getByLabel('Preguntas', { exact: true }).fill('1');
  await page.getByLabel('Opciones por pregunta').selectOption('3');
  await page.getByLabel('Instrucciones').fill('Preguntas sobre la LGA');
  await page.getByLabel('Clave de OpenRouter').fill('clave-de-prueba');
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
  await page.route('https://openrouter.ai/api/v1/chat/completions', route =>
    route.fulfill({ json: { choices: [{ message: { content: '{"questions":[]}' } }] } }));
  await page.goto('./instalaciones/');
  await page.getByLabel('Clave de OpenRouter').fill('clave-de-prueba');
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
  await page.route('https://openrouter.ai/api/v1/chat/completions', async route => {
    const payload = route.request().postDataJSON();
    expect(JSON.parse(payload.messages[1].content).opcionesPorPregunta).toBe(4);
    attempts += 1;
    if (attempts === 1) {
      await route.fulfill({ status: 429, json: {} });
      return;
    }
    await route.fulfill({ json: { choices: [{ message: { content: JSON.stringify({ questions }) } }] } });
  });

  await page.goto('./instalaciones/');
  await page.getByLabel('Preguntas', { exact: true }).fill('2');
  await page.getByLabel('Clave de OpenRouter').fill('clave-de-prueba');
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
