# Arquitecturas de referencia

Estas vistas explican cómo mantener la autoridad de negocio fuera del modelo de IA. Son **propuestas de diseño**, con nombres genéricos y datos sintéticos. El demo de operaciones y AI Evaluation Lab son ejercicios separados; el laboratorio no es una dependencia del asistente.

| Vista | Pregunta | Interactiva | Fuente editable |
|---|---|---|---|
| Conceptual · ejercicio A | ¿Quién puede decidir, aprobar y producir un efecto? | [Abrir](conceptual.html) | [JSON](conceptual.architecture.json) |
| Objetivo cloud · ejercicio A | ¿Dónde deben imponerse identidad, política, aislamiento y trazabilidad? | [Abrir](target.html) | [JSON](target-cloud.architecture.json) |
| AI Evaluation Lab · ejercicio B | ¿Cómo reservar, ejecutar, publicar y limpiar una evaluación reproducible? | [Abrir](evaluation-lab.html) | [JSON](evaluation-lab.architecture.json) |

Los HTML se pueden abrir localmente. Incluyen búsqueda, selección de componentes, relaciones y vistas guiadas. En GitHub, descargar el archivo o usar el servidor local indicado en el README principal. La prosa del modelo está en español; los controles fijos del visor y el atributo de idioma del HTML permanecen en inglés por una limitación de Archify.

## ArchiMate y Archify

[financial-ai.archimate.xml](financial-ai.archimate.xml) contiene un **modelo ArchiMate Open Exchange** con 29 elementos, 31 relaciones y tres diagramas. Se validó contra los XSD oficiales 3.1 de The Open Group, además de comprobar unicidad y resolución de referencias. El formato de intercambio 3.1 también es aplicable a modelos 3.2, según la [documentación oficial](https://www.opengroup.org/open-group-archimate-model-exchange-file-format). Esta entrega fija esa versión por interoperabilidad; no declara que sea la última versión del lenguaje.

Para editarlo en Archi: usar **File → Import → Open Exchange XML Model**, seleccionar el XML y guardar el modelo importado en formato nativo. El procedimiento se documenta en la [guía oficial de Archi](https://www.archimatetool.com/downloads/archi/Archi%20User%20Guide.pdf). La importación en Archi no se ejecutó durante esta entrega; la validación XSD no demuestra compatibilidad perfecta con todos los importadores ni valida toda la semántica del metamodelo.

**Archify es el visor interactivo de las vistas JSON; no renderiza notación ArchiMate.** Los colores, cajas y flechas de sus HTML no deben presentarse como símbolos normativos del lenguaje. El XML conserva los tipos ArchiMate y el mapeo explícito está en [archimate-mapping.json](archimate-mapping.json).

| Significado | Tipo ArchiMate | Elementos representativos |
|---|---|---|
| Participante | `BusinessActor` | Operador, usuario autorizado, evaluador |
| Responsabilidad humana | `BusinessRole` | Revisor de operación, revisión de evaluación |
| Unidad lógica de software | `ApplicationComponent` | Canal, controlador, agente, herramientas, catálogo, ejecutor |
| Servicio expuesto | `ApplicationService` | Identidad, modelo administrado |
| Información persistente | `DataObject` | Estado de dominio, auditoría, resultados, métricas |
| Intercambio entre componentes | `Flow` | Solicitud, propuesta, despacho y finalización |
| Provisión de servicio | `Serving` | Identidad hacia canal/ingreso |
| Lectura/escritura | `Access` | Controlador a estado; ejecutor y catálogo a resultados |
| Relación conceptual sin mayor especialización | `Association` dirigida | Participación humana, proyección y conciliación |

Las asociaciones conservan la etiqueta del contrato sin inventar un flujo tecnológico completo. Por ejemplo, `record` abstrae los datos del sistema de registro; su adaptador y motor quedan fuera de esa caja. El catálogo del laboratorio se modela como un componente con almacén transaccional aunque el visor use un icono de base de datos. No se deduce el tipo ArchiMate a partir del color del HTML.

Los JSON son la autoridad para composición y relaciones de cada vista. El mapeo define su semántica de intercambio. El XML se deriva mediante:

```sh
python3 architecture/scripts/export_archimate.py
```

Si se hacen cambios en Archi, revisar y trasladar las decisiones a los JSON y al mapeo antes de regenerar; no mantener dos topologías divergentes como fuentes igualmente vigentes.

## Ejercicio A: autoridad antes del efecto

1. El canal obtiene una identidad autenticada y limita el contexto a la finalidad declarada. El backend valida sesión, tenant, roles, base habilitante y consentimiento cuando corresponda. Ocultar un botón en el navegador no implementa estos controles.
2. El agente recibe datos mínimos y produce una propuesta estructurada con evidencia. El gateway de herramientas valida nombres, argumentos, destinos y scopes mediante una allowlist. El controlador privilegiado no es una herramienta del modelo.
3. La aprobación humana se liga al hash de la propuesta, la versión de la operación, la política y una caducidad. Se impide la autoaprobación cuando la política exige separación de funciones. Un cambio material invalida la aprobación.
4. El controlador vuelve a validar autoridad y estado inmediatamente antes del efecto. Si la política, la identidad o el kill switch no están disponibles o vigentes, se abstiene. El callback del worker solo entrega una propuesta; no recibe privilegios de confirmación.
5. Una clave de operación estable y una transición condicional evitan efectos repetidos. Si el resultado de una llamada externa es desconocido, se conserva `UNKNOWN` y se consulta el sistema de registro antes de decidir un reintento. Una compensación requiere su propia autorización.
6. La auditoría conserva actores, versiones, decisión, evidencia permitida y resultado observable. No almacena secretos ni razonamiento interno del modelo. El fallo de auditoría debe tener una política explícita: impedir un efecto nuevo si no puede dejarse la evidencia mínima exigida y conciliar cualquier efecto ya enviado.

La parada bloquea efectos nuevos. No deshace operaciones confirmadas ni elimina la necesidad de conciliar las que estaban en curso. La entrega de una cola puede repetirse; la autoridad y deduplicación viven en el consumidor y el sistema de registro.

Una transacción DynamoDB es una opción para el estado local del ejercicio. Su atomicidad no abarca un core externo. La ventana de idempotencia del token de `TransactWriteItems` es acotada y no sustituye el registro durable de idempotencia de negocio. Véase [DynamoDB Transactions](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/transaction-apis.html).

## Objetivo cloud y decisiones pendientes

`cuenta1`, `region-1`, `az-1` y `az-2` son aliases; no identifican infraestructura real. La caja de worker representa un componente lógico con dos ubicaciones propuestas. No acredita instancias desplegadas, subredes, conmutación automática ni alta disponibilidad. Los servicios administrados regionales no se ubican dentro de una subred del cliente por el mero hecho de compartir cuenta.

| Responsabilidad | Candidato AWS | Decisión o evidencia necesaria |
|---|---|---|
| Identidad e ingreso | Federación OIDC; API Gateway; límites y protección de ingreso | Emisor/audiencia, MFA, tenant, rotación, rate limits y abuso |
| Control de dominio | Lambda u otro runtime mínimo compatible | Rol específico; contrato de aprobación; estado y reconciliación |
| Trabajo asíncrono | SQS + DLQ; worker con rol separado | Visibilidad, reintentos, redrive, TTL, presupuesto y supervisor |
| Razonamiento | API de modelo administrado como Bedrock | Modelo/región aprobados, tratamiento de datos y evaluación previa |
| Estado | DynamoDB con claves y condiciones explícitas | Unicidad, retención de idempotencia y prueba de concurrencia |
| Evidencia | Eventos estructurados + almacenamiento de archivo | Acceso de auditor, retención, protección y prueba de recuperación |
| Secretos y claves | Servicio de secretos y KMS | Entrega por identidad de workload, rotación y separación de custodios |
| Operación | Logs, métricas, alertas y traces con redacción | On-call, umbrales, coste, abuso, cola estancada y estados desconocidos |
| Infraestructura como código | Terraform y estado remoto controlado | Federación CI, revisión de plan, cifrado, locking y recuperación del estado |

La fundación Terraform incluida crea almacenamiento privado de evidencia sintética con cifrado, versionado y acceso TLS, un bucket de logs, un grupo de logs y roles de lectura/escritura separados. No implementa el flujo del agente, cómputo, identidad, API, red, cola, alarmas, CloudTrail, WORM ni backend remoto. Los candidatos de esta tabla describen el objetivo y no recursos ya creados por las plantillas. Comparar cada fila con el alcance de [infra](../infra/terraform/README.md) antes de adaptar Terraform. Separar las identidades de operador, CI, controlador, worker y limpieza. La recomendación de permisos mínimos es consistente con las [prácticas de seguridad de agentes de AWS](https://docs.aws.amazon.com/bedrock/latest/userguide/security-best-practice-agents.html).

Antes de un piloto deben decidirse residencia de datos, región y disponibilidad del modelo, ingreso y egreso permitido, responsables, retención, RPO/RTO y presupuesto. El ejercicio no asigna valores numéricos ficticios a requisitos empresariales aún no aprobados. Una prueba de restore y una prueba de fallo de zona son evidencias distintas de la mera presencia de backups o dos aliases de AZ.

## Ejercicio B: AI Evaluation Lab

El laboratorio compara comportamiento de modelos, prompts y controles con datasets sintéticos o autorizados. No ejecuta operaciones financieras. Cada manifiesto fija hashes de dataset y configuración, versión de modelo/prompt/política, criterios de evaluación y semilla donde aplique. Las métricas requieren definición de población, partición, denominador y límites; no se concluye calidad general a partir de un único promedio.

La `run_key` se deriva de una representación canónica del manifiesto. La reserva exige unicidad en una transacción o escritura condicional. Un patrón `consultar → si no existe → insertar` no es deduplicación atómica. Un outbox durable vincula reserva y despacho; un proceso de reparación recupera reservas no despachadas.

El catálogo conserva `execution_status`, `test_result` y `cleanup_status` por separado. `execution_status` indica terminación técnica; `test_result` toma `cumple`, `no_cumple`, `no_evaluado` o `fallo_tecnico` según el contrato del [ejercicio](../docs/evaluation-lab.md). El planificador entrega un lease con token de fencing; solo el ejecutor con token vigente puede publicar. Se suben artefactos a staging, se verifican hashes y el catálogo hace un commit condicionado que los vuelve visibles. Un upload aislado no equivale a un resultado publicado.

Una ejecución puede terminar mientras `cleanup_status` permanece pendiente o fallido. Un `test_result = no_cumple` es un resultado válido de evaluación, no necesariamente un error de ejecución; completar la limpieza tampoco convierte ese resultado en `cumple`. La limpieza usa identidad y allowlist de recursos propias, es reintentable y no borra resultados publicados. Un worker vencido no puede recuperar autoridad por reintentar. El tablero es una proyección del catálogo, no el sistema de registro.

## Evidencia, verificación y reproducción

[evidence.json](evidence.json) clasifica todos los componentes y relaciones como `proposed`. La validación del artefacto se clasifica como `observed`; no acredita el comportamiento de la aplicación o la nube.

| Control ejecutado | Resultado | Registro |
|---|---|---|
| Composición de cada HTML | 9/9 showcase; 0 errores; 0 avisos | [Conceptual](receipts/conceptual.json), [objetivo](receipts/target.json), [laboratorio](receipts/evaluation-lab.json) |
| Modelo XML | XSD oficial + referencias válidas; 3 diagramas | [Recibo XML](receipts/archimate-validation.json) |
| Visor conceptual y objetivo en navegador | Cargados y renderizados; selección de capítulos verificada en conceptual | Revisión de integración en escritorio; otros controles no probados exhaustivamente |
| Revisión visual del HTML | Tres vistas revisadas en escritorio; ruta exterior del laboratorio corregida y comprobada | Sin verificación móvil; los checks geométricos no prueban legibilidad percibida |
| Despliegue, IAM efectivo, HA y recuperación | No ejecutados | Diseño propuesto |
| Importación nativa en Archi | Pendiente | XSD validado, importador no ejecutado |

Los recibos HTML conservan hashes y tamaños del motor. Solo sus rutas de entrada/salida se normalizaron a rutas relativas del repositorio para publicación; los HTML no se editaron después de la entrega atómica.

Para regenerar HTML, instalar Archify 2.16.0 (upstream `c826e6c3a7abad19c0f3cd1ca57207d54b1ad8de`) y usar el runner local de Archify. La entrega usó la adaptación `2.16.0-local.1`, que elimina carga de fuentes remotas y desactiva la comprobación de actualizaciones. No se distribuye el motor completo. Ajustar `ARCHIFY_ROOT` a la instalación local; regenerar con otra plantilla puede cambiar los hashes aunque el modelo sea idéntico.

```sh
node "$ARCHIFY_ROOT/scripts/archify-local.mjs" validate architecture architecture/conceptual.architecture.json --quality showcase --json
node "$ARCHIFY_ROOT/scripts/archify-local.mjs" deliver architecture architecture/conceptual.architecture.json architecture/conceptual.html --quality showcase --json
```

Repetir para `target-cloud.architecture.json → target.html` y `evaluation-lab.architecture.json → evaluation-lab.html`. No corregir el HTML generado a mano.

Para repetir la validación XML, descargar los tres XSD desde [The Open Group](https://www.opengroup.org/xsd/archimate/) y [xml.xsd de W3C](https://www.w3.org/2001/xml.xsd) a una carpeta local; comparar sus SHA-256 con el recibo. Con Python y `lxml` instalados:

```sh
python3 architecture/scripts/validate_archimate.py --schema-dir ./xsd
```

El validador no descarga recursos ni permite resolver dependencias externas. No se redistribuyen los XSD.

## Referencias y licencia del visor

El [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework) y su [perfil de IA generativa](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf) orientan la gestión de riesgos y la evaluación; estas vistas no constituyen una certificación ni una conclusión regulatoria. Las fuentes se consultaron el 18 de septiembre de 2026.

El código embebido del visor deriva de [Archify](https://github.com/tt-a1i/archify), licencia MIT. Se conserva el aviso y texto de licencia en [ARCHIFY-LICENSE.txt](ARCHIFY-LICENSE.txt). Los modelos y explicaciones originales del proyecto se distribuyen bajo [Apache License 2.0](../LICENSE); la licencia MIT citada corresponde al código del visor. Ver [NOTICE](../NOTICE) para los avisos de terceros. ArchiMate es una marca de The Open Group.
