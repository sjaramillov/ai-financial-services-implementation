# Matriz de controles

Esta matriz es una propuesta de diseño. “Simulado” significa que se observa la regla dentro del ejercicio local; su eficacia en un backend real queda pendiente. Las pruebas concretas y sus resultados se registran en [validación](validation.md).

| ID | Riesgo y control requerido | Responsable propuesto | Evidencia de aceptación | Estado |
|---|---|---|---|---|
| C01 | Uso fuera de propósito: inventario de casos, criticidad, propietario y acciones permitidas | Negocio y riesgo de modelos | Ficha aprobada, usos prohibidos y revisión periódica | Documentado |
| C02 | Acceso indebido: identidad, autorización por recurso y separación de funciones | IAM y dominio | Pruebas de permisos cruzados, revocación y suplantación | Regla local simulada; IAM real pendiente |
| C03 | Exceso de agencia: modelo sin credenciales de escritura al sistema de registro | Arquitectura y dominio | Permisos efectivos y denegación de escrituras desde worker | Separación lógica simulada; aislamiento pendiente |
| C04 | Evidencia incorrecta o vencida: validar fuente, versión, integridad y vigencia | Dueño de datos | Evidencia vencida o modificada impide confirmar | Simulado |
| C05 | Aprobación ambigua: ligar actor, acción, recurso y contenido a política vigente | Operaciones | Cambio de propuesta invalida aprobación; autoaprobación denegada | Simulado |
| C06 | Doble efecto: clave de negocio y reserva atómica, no sólo botón deshabilitado | Dominio | Doble envío y carreras concurrentes producen un único efecto | Idempotencia local; concurrencia distribuida pendiente |
| C07 | Resultado desconocido: conciliar contra sistema de registro antes de reintentar | Operaciones y core | Timeout después del efecto no produce una segunda operación | Simulado |
| C08 | Datos expuestos: minimización, clasificación, propósito y aislamiento de sesiones | Datos y privacidad | Pruebas de fuga y trazas sin datos personales | Documentado; datos de demo sintéticos |
| C09 | Instrucciones maliciosas: tratar documentos, respuestas y herramientas como datos no confiables | Seguridad de IA | Suite adversarial; salidas tipadas; permisos independientes del prompt | Documentado; no se evalúa un LLM real |
| C10 | Consumo sin límite: cuotas de llamadas, concurrencia, tiempo y costo | Plataforma | Agotamiento del presupuesto detiene nuevos trabajos | Diseño objetivo; presupuesto cloud pendiente |
| C11 | Fallo no controlado: parada, cancelación, recuperación y canal manual | Operaciones | Parada bloquea nuevos efectos; concilia los ya enviados | Parada local simulada |
| C12 | Decisión no rastreable: correlación, versiones, resultados y retención con acceso restringido | Auditoría y plataforma | Reconstruir una decisión sin conservar razonamiento interno del modelo | Traza local; almacenamiento durable pendiente |
| C13 | Candidato inadecuado: pruebas versionadas, umbrales y revisión humana | Riesgo de modelos | Informe por criterio y prueba, evidencia y condiciones comparables | Laboratorio conceptual |
| C14 | Recursos huérfanos: vencimiento, inventario por ejecución y verificador de limpieza | Plataforma | Cierre independiente del resultado, alertas por limpieza fallida | Laboratorio conceptual |
| C15 | Dependencia del proveedor: contrato, residencia, versiones y salida | Compras, legal y arquitectura | Revisión documentada y ensayo de sustitución de adaptador | Pendiente para un caso real |
| C16 | Degradación inadvertida: métricas por segmentos, cambios y regresión | Riesgo de modelos | Línea base, umbrales acordados, alertas y rollback medido | Diseño objetivo |

La asignación de responsables es orientativa. Cada organización debe designar personas y aprobar sus umbrales. No se establecen valores universales de riesgo aceptable.

La separación de permisos, la autorización fuera del modelo y la reducción del alcance de herramientas se apoyan en [OWASP, Excessive Agency, edición 2025](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/). La matriz es una adaptación propia al ejercicio, no una transcripción normativa.
