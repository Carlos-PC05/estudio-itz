# Verificación de la primera versión

- `npm test`: 8 pruebas de rondas, valoraciones, persistencia y recuperación de datos inválidos.
- `npm run build`: valida 133 edificios, las 136 fichas y las 167 imágenes, sus equivalencias y las 26 páginas de origen; genera la web estática correctamente.
- `npm run test:e2e`: 14 pruebas, los mismos siete escenarios en escritorio y móvil. Cubren respuestas ocultas, valoración y avance, recarga, navegación sin valorar, imágenes agrupadas, ampliación y Escape, variantes con páginas de origen, repaso vacío, cambio de orden y almacenamiento bloqueado o corrupto.
- Revisión visual de pregunta y respuesta en escritorio y móvil. Se corrigió la ocultación del enlace de salto y se oculta la ayuda de teclado en pantallas táctiles.
- Revisión visual de las 167 imágenes extraídas mediante hojas de contacto. La imagen del Panteón que se encuentra al final de la página 18 se asocia a los datos de la página 19.
- Se conserva el texto continuado entre páginas para el Convento de Tourette y se separan correctamente los campos que comparten línea en el PDF.
- `git diff --check`: sin problemas de espacios.

El usuario ha seleccionado GitHub Actions como fuente de Pages. La API confirma `has_pages: true` y `build_type: workflow`.

Tras autenticar la terminal como `Carlos-PC05`, los commits se han subido a `main` y GitHub Actions ha iniciado el workflow automáticamente. El resultado de las pruebas y del despliegue de cada versión se consulta en [Actions](https://github.com/Carlos-PC05/estudio-itz/actions/workflows/deploy.yml).
