# Tablero de controles

[![Mapa de controles de IA financiera](preview.svg)](index.html)

Abre [`index.html`](index.html) en un navegador, o sirve el repositorio como explica el [README principal](../README.md). GitHub muestra el código HTML; la imagen permite conocer el mapa antes de ejecutarlo.

El tablero empieza con la vista completa: información y propuesta arriba, autoridad y ejecución abajo, una lectura independiente de verificación y auditoría transversal. **Anterior**, **Siguiente** y los siete capítulos cambian la explicación. **Reiniciar** comienza una presentación progresiva desde la frontera. **Vista completa / Vista progresiva** cambia la visibilidad de los componentes; **Presentar** oculta la introducción y las notas; **Imprimir** produce el mapa completo.

Las capas **Sólo lectura**, **Recuperación**, **Parada de emergencia** y **Medición** permiten ubicar controles adicionales. Se muestra una capa a la vez, acompañada por su alcance. Las flechas del teclado cambian de capítulo cuando el foco está fuera de un control; dentro del mapa permiten desplazarlo. `Home` vuelve al primer capítulo y `End` muestra el mapa completo.

El caso ilustrativo es un pago sintético ya aplicado cuya confirmación permanece pendiente. Solo se permite conciliar la confirmación. El tablero enlaza el [laboratorio](../demo/index.html), la [arquitectura conceptual](../architecture/conceptual.html), la [arquitectura objetivo](../architecture/target.html) y el diseño de [AI Evaluation Lab](../architecture/evaluation-lab.html).

## Guion de revisión

1. **Frontera de autoridad:** el modelo propone; los servicios de dominio autorizan y producen efectos.
2. **Propuesta tipada:** contexto autorizado y contrato explícito. Validar formato no acredita un diagnóstico ni autoriza una acción.
3. **Ruta gobernada:** herramientas concretas, alcance mínimo y credenciales fuera del modelo.
4. **Identidad y política:** actor y servicio separados, permisos por tarea y recurso, revalidación antes del efecto.
5. **Decisión humana:** actor independiente, contenido exacto, alcance limitado y vigencia; aprobar no elimina las reglas del dominio.
6. **Verificación:** recibo y postcondición; una respuesta perdida exige consulta por la misma operación.
7. **Auditoría:** quién, qué, por qué y con qué resultado, con protección y retención que deben implementarse fuera del ejercicio.

## Diseño y mantenimiento

Arquitectos, equipos de operación, riesgo y seguridad revisan el flujo juntos en un monitor o proyector y luego inspeccionan el ejercicio a su ritmo. La cuadrícula cálida, la tipografía y el mapa conectado priorizan la frontera de autoridad. El azul identifica controles; el amarillo señala decisiones y el capítulo activo. Los estados llevan texto además de color.

Recursos locales, foco visible, enlace para saltar navegación, botones nativos, descripción textual del mapa, desplazamiento en pantallas estrechas y respeto por reducción de movimiento. Las fuentes incluyen sus [licencias SIL OFL](assets/fonts/FONT-LICENSES.txt).

Fuentes editables: `index.html`, `app.js`, `board.css`, `diagram.css` y `assets/fonts/`. El tablero no necesita build ni recursos externos. `style.css` conserva los estilos compartidos por la demo.

Después de modificar el mapa o sus estilos, actualizar la imagen del README desde la raíz:

```sh
python3 scripts/build_board_preview.py
```

El generador copia el SVG del tablero, muestra sus siete pasos, omite las capas opcionales e incorpora los estilos y fuentes locales. Incluye en los metadatos la licencia Apache 2.0 del diagrama y los avisos completos SIL OFL de las fuentes para su redistribución independiente. `preview.svg` es una imagen estática sin JavaScript ni llamadas externas. Es material de referencia y simulación, no evidencia de una implementación productiva.
