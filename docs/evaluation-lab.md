# AI Evaluation Lab

**Estado: diseño conceptual.** No hay orquestador, entorno cloud ni resultados de evaluación implementados en este repositorio.

## Propósito y MVP

Comparar herramientas de IA antes de incorporarlas a un proceso financiero. El primer ejercicio compara dos asistentes documentales ficticios usando un caso de uso, una suite común y una integración corporativa simulada. La adquisición queda a cargo de una revisión humana.

El portal solicita y consulta evaluaciones. Un catálogo versiona candidatos, suites, datos y criterios. El orquestador mantiene estados, reservas, presupuesto y recuperación. Ejecutores aislados llaman adaptadores con permisos acotados. Las evidencias se conservan fuera de los entornos temporales. Un evaluador calcula métricas y presenta una comparación navegable: **comparación → criterio → prueba → evidencia**.

## Estados y cierre

`solicitada → preparando → ejecutando → evaluando → limpiando → cerrada`

Una falla o cancelación deriva a limpieza desde cualquier estado que pueda haber creado recursos. La persistencia separa:

- `test_result`: cumple, no_cumple, no_evaluado o fallo_tecnico.
- `cleanup_status`: pendiente, en_progreso, verificada o fallida.
- `execution_status`: estado de la máquina, con intento, propietario de lease y vencimiento.

Sólo se declara cerrada cuando la limpieza está verificada. Un informe puede existir mientras la limpieza sigue pendiente, pero debe mostrarlo. Un supervisor externo recupera leases vencidos y detecta recursos huérfanos mediante el inventario de la ejecución. Cancelar no borra la evidencia ni revierte de manera automática efectos externos.

## Deduplicación y reutilización

El candidato tiene identificador canónico por proveedor/producto y nombres alternativos. Esto evita registros duplicados; no define todavía la identidad de una evaluación.

La huella de evaluación incluye candidato y versión, caso de uso, suite, versión o hash de datos, configuración relevante y ámbito de autorización. Normalizar los valores antes de calcular la huella. Reservarla con una restricción única o escritura condicional **atómica**, antes de encolar. Registro y publicación requieren un outbox transaccional o una estrategia equivalente de recuperación para no perder trabajos entre ambos pasos.

| Situación encontrada | Comportamiento propuesto |
|---|---|
| Ejecución en curso | Vincular la nueva solicitud al seguimiento existente si sus permisos lo permiten |
| Informe vigente y condiciones equivalentes | Reutilizarlo, comprobando permisos y política de vigencia |
| Informe vencido o cambio relevante | Nueva evaluación enlazada a la anterior |
| Fallo recuperable | Nuevo intento con historial; recuperar lease con fencing token |
| Repeticiones estadísticas planificadas | Ejecuciones intencionales con identificador de réplica explícito |

La clave de idempotencia de una solicitud protege doble clic y reintentos de red. Debe ligarse al payload: reutilizarla con otro contenido genera conflicto. La huella de evaluación resuelve duplicación entre solicitudes diferentes. Ninguna de las dos autoriza compartir resultados entre ámbitos distintos.

## Medición

La suite define entradas, resultados esperados, rúbricas, condiciones, repeticiones y criterios de exclusión antes de observar resultados. Se conservan versiones de modelo, prompt, herramientas, evaluador y parámetros. Cuando el proveedor no permita fijar una versión, el informe registra esa limitación.

Las métricas objetivas se calculan directamente: aciertos contra un conjunto etiquetado, fallos de contrato, tiempos observados, llamadas y consumo registrado. Los costos se calculan con unidades y tarifas fechadas; no se inventan precios ni se presentan estimaciones como facturas. Los resultados deben incluir tamaños de muestra, dispersión e incertidumbre cuando corresponda.

La IA puede asistir en rúbricas cualitativas y en la redacción de conclusiones con referencias a evidencia. La salida del candidato es dato no confiable: no modifica la rúbrica, las herramientas o las instrucciones del evaluador. Calibrar el juez contra revisión humana y analizar desacuerdos. No usar la autoevaluación del candidato como única evidencia.

Funcionalidad, experiencia de uso, privacidad, accesibilidad, seguridad, integración, costo y condiciones contractuales se convierten en criterios verificables. Los criterios legales y contractuales requieren revisión especializada. Entrenamiento, fine-tuning y RAG son capacidades opcionales del candidato; no etapas obligatorias del laboratorio.

## Pruebas de aceptación futuras

Probar solicitudes simultáneas, reintento después de reservar pero antes de encolar, caída del worker, vencimiento de lease, intento de reutilización entre ámbitos, límite de consumo, prompt injection contra el evaluador y fallo de eliminación. Cada caso debe conservar evidencia, resultado de evaluación y resultado de limpieza por separado.
