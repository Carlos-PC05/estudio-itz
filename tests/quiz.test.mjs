import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateQuiz } from '../src/quiz.js';

test('el servidor envía el temario y los ajustes a modelos gratuitos', async t => {
  const source = await readFile(new URL('../data/instalaciones.txt', import.meta.url), 'utf8');
  const questions = [{
    question: '¿Qué une la LGA?',
    options: ['La CGP y los contadores', 'Un diferencial y un motor', 'Dos viviendas'],
    correctIndex: 0,
    explanation: 'La LGA alimenta la centralización de contadores.',
    page: 42,
  }];
  t.mock.method(globalThis, 'fetch', async (url, request) => {
    assert.equal(url, 'https://openrouter.ai/api/v1/chat/completions');
    assert.equal(request.headers.Authorization, 'Bearer clave-de-prueba');
    const payload = JSON.parse(request.body);
    assert.deepEqual(payload.models, ['particle-ai/particle-1:free', 'inclusionai/ling-3.2-flash:free']);
    assert.deepEqual(payload.reasoning, { enabled: false });
    const schema = payload.response_format.json_schema.schema.properties.questions;
    assert.equal(schema.minItems, 1);
    assert.equal(schema.maxItems, 1);
    assert.equal(schema.items.properties.options.minItems, 3);
    assert.equal(schema.items.properties.options.maxItems, 3);
    assert.deepEqual(JSON.parse(payload.messages[1].content), {
      preguntas: 1, opcionesPorPregunta: 3, preferencias: 'Preguntas sobre la LGA',
    });
    assert.match(payload.messages[0].content, /\[Página PDF 67\]/);
    assert.doesNotMatch(payload.messages[0].content, /\[Página PDF 68\]/);
    return Response.json({ choices: [{ message: { content: JSON.stringify({ questions }) } }] });
  });
  const result = await generateQuiz({ key: 'clave-de-prueba', count: 1, optionCount: 3, instructions: 'Preguntas sobre la LGA', source });
  assert.deepEqual(result, questions);
});
