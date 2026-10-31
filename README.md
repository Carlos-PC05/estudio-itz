# Arquitectura · Primer parcial

Web de estudio a partir de `DOSIER EDIFICIOS PRIMER PARCIAL .pdf`: 133 edificios, 136 fichas de origen y 167 imágenes. Las imágenes del mismo edificio se muestran juntas y los datos se revelan con «Ver respuestas».

## Desarrollo

Requiere Node.js 24 o posterior.

```bash
npm ci
npm run dev
```

Abre la dirección que imprime Vite, bajo `/estudio-itz/`.

```bash
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run preview
```

Las pruebas de navegador utilizan la compilación de `dist/`, con vistas de escritorio y móvil. El build valida todas las fichas y las imágenes antes de generar la web.

## Estudiar

- «Todos» practica el conjunto completo; «Necesito repasarlos» utiliza la última valoración de cada edificio.
- Una ronda muestra cada edificio una sola vez, aleatoriamente o siguiendo su primera aparición en el dosier.
- «Ver respuestas» revela nombre, arquitecto, ubicación y fecha.
- «Lo sabía» y «Necesito repasarlo» guardan la valoración y avanzan. «Anterior» y «Siguiente» permiten navegar sin valorar.
- Cada cambio de edificio oculta los datos. Al recargar, se retoman la ronda y las valoraciones con las respuestas ocultas.
- Las imágenes pueden ampliarse. Escape cierra la ampliación y las flechas cambian de vista.
- Fuera de los controles, Espacio revela la respuesta y las flechas permiten navegar entre edificios.

El progreso se guarda solo en este navegador y origen mediante `localStorage`; no se sincroniza entre dispositivos. Si el almacenamiento está bloqueado, la web permite estudiar y avisa de que no podrá guardar los cambios.

## Material y discrepancias

Los datos y las imágenes proceden exclusivamente del PDF. Se mantienen la redacción y las fechas originales, incluso cuando parecen erróneas. Las variantes, datos ausentes y discrepancias detectadas se señalan en la respuesta y se enlazan las páginas de origen.

- `data/buildings.json`: material extraído, agrupado por edificio y con procedencia por ficha.
- `data/overrides.json`: equivalencias revisadas, una asociación de imagen entre páginas y notas del material.
- `public/images/`: imágenes originales convertidas a WebP, conservando proporción y sin ampliarlas artificialmente.
- `public/pages/`: reproducciones de las 26 páginas para consultar el contexto.
- `scripts/extract_dossier.py`: extracción reproducible; incluye las fichas que continúan en otra página.

Para regenerar, coloca el PDF original en la raíz y ejecuta con [uv](https://docs.astral.sh/uv/):

```bash
uv run scripts/extract_dossier.py
npm run build
```

El PDF de 103 MB se conserva localmente y está excluido de Git. El despliegue utiliza el material extraído, que ocupa unos 13 MB. No requiere el PDF, servicios externos, claves ni un servidor de aplicación. Las fuentes también se sirven desde la propia web.

## GitHub Pages

El workflow `.github/workflows/deploy.yml` instala dependencias, ejecuta las pruebas, valida los datos y compila. En cada push a `main`, publica `dist/` en GitHub Pages; también puede ejecutarse manualmente desde Actions. Las pull requests ejecutan las comprobaciones sin publicar.

Configuración inicial del repositorio:

1. En **Settings → Pages → Build and deployment → Source**, seleccionar **GitHub Actions**.
2. Subir los cambios a `main` o ejecutar el workflow desde **Actions → Publicar en GitHub Pages → Run workflow**, si el primer push ocurrió antes de activar Pages.

La URL prevista es `https://carlos-pc05.github.io/estudio-itz/`; solo estará disponible después de un despliegue correcto. Si cambia el nombre del repositorio, ajustar `base` en `vite.config.js` y la URL de las pruebas en `playwright.config.js`.

GitHub Pages ya está configurado con GitHub Actions como fuente. Los pushes a `main` ejecutan el workflow automáticamente. Para subir cambios desde este proyecto, el remoto utiliza HTTPS con la cuenta activa de GitHub CLI.

Referencias: [workflows de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) y [despliegue de Vite en GitHub Pages](https://vite.dev/guide/static-deploy#github-pages).
