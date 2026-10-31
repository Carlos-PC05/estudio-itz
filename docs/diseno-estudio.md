# Diseño de la web de estudio

## Decisiones acordadas

- El material de referencia es `DOSIER EDIFICIOS PRIMER PARCIAL .pdf`.
- Cada ficha de estudio corresponde a un edificio y muestra juntas todas sus imágenes.
- Nombre, arquitecto, ubicación y fecha permanecen ocultos hasta pulsar «Ver respuestas».
- El orden inicial es aleatorio, sin repetir edificios durante una ronda.
- Se ofrece también el orden del dosier.
- Después de revelar los datos se puede marcar «Lo sabía» o «Necesito repasarlo».
- Las marcas se guardan en el navegador para poder practicar los edificios que requieren repaso.
- Los datos proceden del PDF; los campos incompletos o contradictorios se señalan para revisarlos con el usuario.
- Cuando un edificio tenga datos distintos en varias fichas del PDF, la respuesta muestra las versiones con sus páginas de origen y una indicación de la discrepancia.
- Se ofrecen los modos «Todos» y «Necesito repasarlos».
- Prevalece la última valoración de cada edificio; marcar «Lo sabía» lo retira del grupo que necesita repaso.
- Los botones de valoración avanzan automáticamente al siguiente edificio.
- Cada cambio de edificio oculta sus respuestas.
- «Anterior» y «Siguiente» permiten navegar sin valorar.
- La interfaz es clara, en español y adaptable a móvil y ordenador.
- Las imágenes tienen protagonismo y pueden ampliarse.
- La web se despliega en GitHub Pages y se actualiza automáticamente con los pushes a `main`.

## Cierre de la entrevista

Las decisiones de estudio, presentación y destino de despliegue están acordadas. El usuario confirmó expresamente el alcance y autorizó comenzar la implementación.

## Destino y acceso de despliegue

- Repositorio: `Carlos-PC05/estudio-itz`, público, con rama predeterminada `main`.
- GitHub Pages todavía no está activado y no existen workflows.
- La sesión actual de GitHub y el alias SSH del remoto corresponden a `cparra05`, que solo tiene lectura en ese repositorio.
- El plugin de GitHub identifica a `Carlos-PC05` y los metadatos muestran permisos del propietario, pero la integración devuelve 403 «Resource not accessible by integration» al intentar crear un blob. No se publicó ningún archivo. Se necesita una conexión con escritura y la selección inicial de GitHub Actions en Settings → Pages, operación que el plugin no expone.

## Observaciones de la revisión del material

El PDF tiene 26 páginas y 136 fichas; una ficha del documento no equivale necesariamente a un edificio distinto. Hay fichas con varias imágenes y edificios repetidos.

Villa Almerico Capra / Villa Capra-La Rotonda aparece con fechas diferentes. La extracción deberá conservar la procedencia de los datos para que esas diferencias puedan revisarse. El número definitivo de edificios se determinará al revisar las equivalencias.
