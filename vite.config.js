import { readFile } from 'node:fs/promises';
import { defineConfig, loadEnv } from 'vite';
import { generateQuiz, QUIZ_TIMEOUT_MESSAGE } from './src/quiz.js';

const base = '/estudio-itz/';

export default defineConfig(({ mode }) => {
  const key = loadEnv(mode, process.cwd(), 'OPENROUTER_').OPENROUTER_API_KEY?.trim();

  return {
    base,
    define: { __LOCAL_QUIZ__: JSON.stringify(Boolean(key)) },
    plugins: key ? [{
      name: 'local-quiz',
      configureServer(server) {
        const source = readFile(new URL('./data/instalaciones.txt', import.meta.url), 'utf8');
        server.middlewares.use(async (req, res, next) => {
          if (req.url !== `${base}api/quiz`) return next();
          res.setHeader('Content-Type', 'application/json');
          if (req.method !== 'POST' ||
              !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress) ||
              !/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(req.headers.host ?? '') ||
              req.headers['sec-fetch-site'] !== 'same-origin' ||
              req.headers['content-type'] !== 'application/json') {
            res.statusCode = 403;
            return res.end(JSON.stringify({ error: 'La generación con la clave local solo está disponible desde esta web en el mismo equipo.' }));
          }

          let config;
          try {
            let body = '';
            for await (const chunk of req) {
              body += chunk;
              if (body.length > 8192) throw new Error();
            }
            config = JSON.parse(body);
          } catch {
            res.statusCode = 400;
            return res.end(JSON.stringify({ error: 'La configuración del cuestionario no es válida.' }));
          }

          const { count, optionCount, instructions } = config ?? {};
          if (!Number.isInteger(count) || count < 1 || count > 20 ||
              ![3, 4].includes(optionCount) || typeof instructions !== 'string' || instructions.length > 1200) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ error: 'La configuración del cuestionario no es válida.' }));
          }

          try {
            const questions = await generateQuiz({ key, count, optionCount, instructions, source: await source });
            res.end(JSON.stringify({ questions }));
          } catch (error) {
            const timedOut = error.name === 'TimeoutError';
            res.statusCode = timedOut ? 504 : (error.status ?? 502);
            res.end(JSON.stringify({ error: timedOut ? QUIZ_TIMEOUT_MESSAGE : error.message }));
          }
        });
      },
    }] : [],
    build: {
      rolldownOptions: {
        input: ['index.html', 'arquitectura/index.html', 'instalaciones/index.html'],
      },
    },
  };
});
