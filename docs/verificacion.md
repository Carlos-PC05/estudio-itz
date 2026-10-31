# Verificación de la primera versión

- `npm test`: 8 pruebas de rondas, valoraciones, persistencia y recuperación de datos inválidos.
- `npm run build`: valida 133 edificios, las 136 fichas y las 167 imágenes, sus equivalencias y las 26 páginas de origen; genera la web estática correctamente.
- `npm run test:e2e`: 14 pruebas, los mismos siete escenarios en escritorio y móvil. Cubren respuestas ocultas, valoración y avance, recarga, navegación sin valorar, imágenes agrupadas, ampliación y Escape, variantes con páginas de origen, repaso vacío, cambio de orden y almacenamiento bloqueado o corrupto.
- Revisión visual de pregunta y respuesta en escritorio y móvil. Se corrigió la ocultación del enlace de salto y se oculta la ayuda de teclado en pantallas táctiles.
- Revisión visual de las 167 imágenes extraídas mediante hojas de contacto. La imagen del Panteón que se encuentra al final de la página 18 se asocia a los datos de la página 19.
- Se conserva el texto continuado entre páginas para el Convento de Tourette y se separan correctamente los campos que comparten línea en el PDF.
- `git diff --check`: sin problemas de espacios.

El usuario ha seleccionado GitHub Actions como fuente de Pages. La API confirma `has_pages: true` y `build_type: workflow`.

No se ha podido verificar un despliegue real: la sesión de terminal no tiene escritura y la integración del plugin de GitHub devuelve 403 al escribir. El workflow está preparado para publicar en cuanto se suba a `main`. Se ha solicitado autenticar la terminal con la cuenta propietaria para completar el push y verificar el resultado.
