# Alcance y evidencia

Esta edición pública es un ejercicio autónomo de arquitectura y controles. Los casos son sintéticos y los componentes de infraestructura se describen de forma general.

| Afirmación | Tipo de evidencia disponible | Límite |
|---|---|---|
| Transiciones, autorización y recuperación de la demo | Código local y pruebas reproducibles | No demuestra aislamiento, autenticación o concurrencia distribuida |
| Relación entre controles y componentes | Documentación y modelos de arquitectura | Diseño objetivo, sin observación de despliegue |
| Configuración de la base cloud | Archivos Terraform y validación estática | No equivale a un plan revisado ni a recursos aprovisionados |
| Comparación de candidatos de IA | Diseño del laboratorio de evaluación | No hay ejecuciones ni resultados de modelos |
| Validez de los artefactos de arquitectura | Recibos del generador y comprobaciones del modelo | No certifica la calidad de una implementación |

Los registros de prueba de esta versión se generan sobre este repositorio. No se reutilizan conteos de pruebas ni afirmaciones de disponibilidad de otros entornos.

## Fronteras

El navegador no es un punto de control de seguridad suficiente. En producción, el servidor deriva la identidad de una sesión validada, consulta permisos vigentes y valida cada herramienta y recurso. Una aprobación se liga a actor, acción, objeto, versión de evidencia, política y vencimiento; cualquier cambio relevante la invalida.

La simulación utiliza respuestas predeterminadas. No mide calidad, seguridad frente a prompt injection, sesgo, latencia de inferencia ni costo de un proveedor.

La documentación organiza el trabajo mediante requisitos, decisiones, construcción y operación. No atribuye aprobación institucional o certificación de un marco de desarrollo.
