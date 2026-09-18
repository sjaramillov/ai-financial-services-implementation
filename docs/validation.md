# Validación de esta edición

Fecha: 18 de septiembre de 2026. Las comprobaciones corresponden a los archivos públicos de este repositorio y a una ejecución local sin credenciales cloud.

| Área | Comprobación | Resultado y alcance |
|---|---|---|
| Demo | `node --test tests/*.test.cjs` | 20 pruebas aprobadas; ver nombres de casos en el código de pruebas y salida de CI |
| Publicación | `python3 scripts/check_publication.py` | Sin hallazgos de las clases de datos sensibles verificadas; no es una garantía universal de detección |
| Enlaces | `python3 scripts/check_links.py` | Archivos locales referenciados existentes; no verifica disponibilidad de fuentes externas |
| Identidad de diagramas | `python3 scripts/check_architecture.py` | Hashes JSON/HTML/XML y referencias internas coherentes |
| Archify | Validación y entrega `showcase` | Tres vistas, 9/9 checks por vista, sin errores ni avisos de composición |
| ArchiMate | XSD oficial y referencias | 29 elementos, 31 relaciones, tres diagramas; importación nativa en Archi pendiente |
| Terraform | `fmt`, `init -backend=false`, `validate` | Aprobados con Terraform 1.15.5 y proveedor AWS 6.65.0 |
| Terraform | `terraform test` con `mock_provider "aws"` | Cuatro pruebas aprobadas; ningún aprovisionamiento ni validación efectiva de IAM en AWS |

## Revisión en navegador

Comprobada la versión local en el navegador integrado de escritorio:

- El tablero carga, permite avanzar entre controles y actualiza su explicación.
- La demo genera las propuestas al avanzar el reloj. SIM-001 pasa de revisión a verificado con un efecto de confirmación y cero débitos nuevos.
- SIM-002 conserva resultado desconocido al perder la respuesta. La conciliación por lectura verifica la confirmación sin aumentar los efectos.
- Revocar el rol del revisor después de aprobar SIM-001 impide el efecto y deja una denegación explícita en la traza.
- Las vistas conceptual y objetivo cargan y muestran aliases generales. En la conceptual se comprobó la selección de una vista guiada y el resaltado del recorrido.
- La vista del laboratorio carga y muestra el flujo completo. Se detectó una ruta exterior recortada, se amplió el área del diagrama en el JSON fuente y se volvió a generar y revisar el HTML.
- La inspección visual revisa legibilidad y composición en escritorio. No constituye una auditoría completa de accesibilidad ni prueba de todos los navegadores o tamaños de pantalla.

## Reproducibilidad y límites

Los workflows de CI repiten pruebas locales, enlaces, comprobaciones de publicación e integridad, regeneración XML y pruebas Terraform con proveedor simulado. No contienen pasos de despliegue ni necesitan credenciales AWS.

La validación XSD completa requiere descargar los esquemas oficiales y disponer de `lxml`; el procedimiento y hashes están en [arquitectura](../architecture/README.md). La verificación de integridad de CI no reemplaza esa validación. Para cambiar un JSON del diagrama, volver a generar HTML, XML, evidencia y recibos.

No se ejecutaron inferencias de modelos, tráfico contra un core, pruebas de concurrencia distribuida, restauración de datos ni mediciones de calidad del modelo. El laboratorio de evaluación sigue siendo conceptual.
