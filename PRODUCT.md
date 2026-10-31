# Estudio de arquitectura

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Estudiante que prepara el primer parcial y necesita reconocer edificios a partir de las imágenes del dosier.

## Product Purpose

Practicar la identificación visual y recordar nombre, arquitecto, ubicación y fecha mediante respuestas que se revelan a petición.

## Operating Context

Uso en móvil y ordenador. Estudio en rondas aleatorias o en orden del dosier, con marcas personales guardadas en el navegador.

## Capabilities and Constraints

Ver `docs/diseno-estudio.md` para el alcance confirmado. Agrupar todas las imágenes del mismo edificio, conservar variantes del dosier con sus páginas, ofrecer repaso según la última valoración y ampliar imágenes. Publicación en GitHub Pages con cada push a main.

## Brand Commitments

Interfaz clara, en español, con protagonismo de las imágenes. El usuario ha confirmado el alcance y ha indicado comenzar la implementación.

## Evidence on Hand

PDF local `DOSIER EDIFICIOS PRIMER PARCIAL .pdf`, con 26 páginas y 136 fichas de origen. No hay una identidad visual previa ni código de aplicación.

## Product Principles

- La imagen permite intentar recordar antes de ver la respuesta.
- La última valoración guía el repaso.
- Las discrepancias del material se presentan con su procedencia.
- La interfaz mantiene el foco en estudiar.

## Implementation Choice

Elección de implementación del agente dentro del alcance aprobado: aplicación estática con JavaScript y Vite, sin servidor ni cuentas. No se ha expresado una preferencia de framework.
