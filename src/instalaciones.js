import './quiz.css';
import source from '../data/instalaciones.txt?raw';
import { generateQuiz } from './quiz.js';

const sample = [
  {
    question: '¿Qué efecto tiene elevar la tensión de transporte para una misma potencia?',
    options: ['Aumenta la intensidad', 'Disminuye la intensidad', 'La intensidad permanece igual'],
    correctIndex: 1,
    explanation: 'Al transportar la misma potencia a mayor tensión, se necesita menos intensidad. Esto reduce las pérdidas por efecto Joule.',
    page: 18,
  },
  {
    question: '¿Qué elemento une la caja general de protección con la centralización de contadores?',
    options: ['La línea general de alimentación', 'El interruptor diferencial', 'La derivación individual'],
    correctIndex: 0,
    explanation: 'La línea general de alimentación (LGA) enlaza la caja general de protección con la centralización de contadores.',
    page: 42,
  },
  {
    question: '¿Qué detecta un interruptor diferencial?',
    options: ['Una sobretensión transitoria', 'Un exceso de potencia contratada', 'Una fuga de corriente'],
    correctIndex: 2,
    explanation: 'El diferencial compara la corriente que entra con la que regresa. Un desequilibrio indica una fuga que puede provocar la desconexión.',
    page: 62,
  },
];

const byId = id => document.getElementById(id);
const form = byId('quiz-form');
const localQuiz = import.meta.env.DEV && __LOCAL_QUIZ__;
const keyInput = byId('key');

if (localQuiz) {
  keyInput.required = false;
  keyInput.closest('label').hidden = true;
  byId('key-help').textContent = 'Se usa la clave de OpenRouter configurada en el servidor local. Al generar, OpenRouter recibe el temario y tus instrucciones.';
}
const generate = byId('generate');
const demo = byId('demo');
const status = byId('generation-status');
const question = byId('question');
const answers = byId('answers');
const feedback = byId('feedback');
const next = byId('next');
const restart = byId('restart');

let quiz;
let index;
let score;
let answered;

function showQuestion() {
  const current = quiz[index];
  answered = false;
  feedback.replaceChildren();
  feedback.removeAttribute('data-result');
  next.hidden = true;
  restart.hidden = Boolean(current);
  byId('quiz-position').textContent = current ? `Pregunta ${index + 1} de ${quiz.length}` : 'Cuestionario terminado';
  question.textContent = current ? current.question : `${score} de ${quiz.length} respuestas correctas`;
  answers.replaceChildren();
  current?.options.forEach((option, optionIndex) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'quiz-answer';
    button.textContent = option;
    button.addEventListener('click', () => grade(optionIndex));
    answers.append(button);
  });
  question.focus();
}

function grade(selected) {
  if (answered) return;
  answered = true;
  const { options, correctIndex, explanation, page } = quiz[index];
  const correct = selected === correctIndex;
  if (correct) score += 1;
  const buttons = answers.querySelectorAll('button');
  buttons.forEach(button => button.setAttribute('aria-disabled', 'true'));
  buttons[correctIndex].dataset.result = 'correct';
  buttons[selected].dataset.result = correct ? 'correct' : 'incorrect';

  const heading = document.createElement('strong');
  heading.textContent = correct ? 'Correcto' : 'Incorrecto';
  const text = document.createElement('p');
  text.textContent = correct ? explanation : `La respuesta correcta es «${options[correctIndex]}». ${explanation}`;
  const citation = document.createElement('small');
  citation.textContent = `Página ${page} del PDF`;
  feedback.dataset.result = correct ? 'correct' : 'incorrect';
  feedback.append(heading, text, citation);
  next.textContent = index + 1 === quiz.length ? 'Ver resultado' : 'Siguiente pregunta';
  next.hidden = false;
  next.focus();
}

function begin(questions, kind) {
  quiz = questions;
  index = 0;
  score = 0;
  byId('quiz-kind').textContent = kind;
  byId('setup').hidden = true;
  byId('practice').hidden = false;
  showQuestion();
}

demo.addEventListener('click', () => begin(sample, 'Test de ejemplo'));
next.addEventListener('click', () => {
  index += 1;
  showQuestion();
});
restart.addEventListener('click', () => begin(quiz, byId('quiz-kind').textContent));
byId('configure').addEventListener('click', () => {
  byId('practice').hidden = true;
  byId('setup').hidden = false;
  byId('setup-title').focus();
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (generate.disabled) return;
  const key = keyInput.value.trim();
  if (!localQuiz && !key) {
    status.textContent = 'Introduce una clave de OpenRouter.';
    keyInput.focus();
    return;
  }
  const fields = new FormData(form);
  generate.disabled = demo.disabled = true;
  status.textContent = 'OpenRouter está preparando tus preguntas…';
  try {
    const settings = {
      count: Number(fields.get('count')),
      optionCount: Number(fields.get('options')),
      instructions: fields.get('instructions').trim(),
    };
    let questions;
    if (localQuiz) {
      const response = await fetch(`${import.meta.env.BASE_URL}api/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
        signal: AbortSignal.timeout(95000),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      questions = result.questions;
    } else {
      questions = await generateQuiz({ ...settings, key, source });
    }
    status.textContent = '';
    begin(questions, 'Test generado con IA');
  } catch (error) {
    const connectionError = error instanceof SyntaxError || error instanceof TypeError || error.name === 'TimeoutError';
    status.textContent = connectionError
      ? 'No se pudo obtener un cuestionario válido. Revisa tu conexión y vuelve a intentarlo.'
      : error.message;
  } finally {
    generate.disabled = demo.disabled = false;
  }
});
