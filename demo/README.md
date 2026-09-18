# Laboratorio local de controles

Ejercicio educativo en español para revisar autorización, idempotencia y recuperación en una implementación de IA para servicios financieros. La propuesta de un asistente **no tiene autoridad para modificar el sistema**. La revisión humana está acotada y el dominio vuelve a comprobar el comando.

Todo ocurre en memoria con ocho casos ficticios. No hay modelos, APIs, credenciales, cuentas, servicios cloud ni transacciones reales. Las propuestas son predefinidas. No se usa telemetría, almacenamiento del navegador, fuentes externas ni acceso de red desde el código del laboratorio.

## Abrir y reproducir

1. Abre [`index.html`](index.html) directamente en un navegador moderno. También puedes servir la raíz del repositorio con `python3 -m http.server 8000 --bind 127.0.0.1` y entrar a `/demo/`.
2. Pulsa **Avanzar 10 s**. El reloj es lógico y las primeras propuestas quedan en revisión.
3. Selecciona un caso de la cola. Inspecciona **Contenido de propuesta y aprobación** y los eventos.
4. Usa **Aprobar como revisor** y después **Avanzar 1 s** para permitir al dominio revalidar.
5. Descarga **Evidencia JSON** antes de reiniciar si quieres conservar el recorrido. La descarga contiene todos los eventos y los recibos sintéticos por operación; la pantalla muestra los últimos treinta eventos.

El botón **Intentar ejecución**, dentro de los límites de autoridad, permite enviar el intento en el instante lógico actual. Es útil para comprobar denegaciones y duplicados. No hace avanzar el reloj. En el caso de vencimiento, sigue el paso **Avanzar 1 s** después de aprobar para alcanzar el límite exacto de expiración.

## Casos y resultados esperados

Reinicia el ensayo antes de cada recorrido si buscas comparar resultados. No avances 120 segundos antes de aprobar, salvo que quieras probar evidencia vencida.

| Caso | Recorrido | Resultado esperado |
|---|---|---|
| SIM-001 · Camino autorizado | Avanzar 10 s → aprobar → avanzar 1 s | `VERIFIED`: una conciliación, un débito original, cero débitos nuevos. |
| SIM-002 · Respuesta perdida | Avanzar 10 s → seleccionar → aprobar → avanzar 1 s | `UNKNOWN`: el efecto ocurrió en el dominio simulado, pero el consumidor no recibió la respuesta. |
| SIM-002 · Recuperación | En `UNKNOWN`, intentar ejecución y luego reconciliar | El duplicado no produce otro efecto ni resuelve `UNKNOWN`. La lectura concordante del recibo y del estado cambia a `VERIFIED`. |
| SIM-003 · Cambio concurrente | Avanzar 10 s → seleccionar → aprobar → avanzar 1 s | `REJECTED`: la versión cambia después de aprobar; cero efectos. |
| SIM-004 · Vencimiento | Avanzar 10 s → seleccionar → aprobar → avanzar 1 s | `EXPIRED`: aprobación válida por un segundo lógico, rechazada en el límite exacto. |
| SIM-005 · Evidencia insuficiente | Avanzar 10 s → seleccionar | `ABSTAINED`: falta estado de negocio verificable, no hay propuesta ejecutable. |
| SIM-006 · Contrato inválido | Avanzar 10 s tres veces → seleccionar | `QUARANTINED` tras tres lecturas fallidas. **Reparar y reingresar** conserva la clave, exige nueva lectura y aprobación. |
| SIM-007 · Fallo transitorio | Avanzar 10 s tres veces → seleccionar | Dos fallos sintéticos de lectura y un tercer intento válido. Queda `REVIEW`; nunca se aprueba automáticamente. |
| SIM-008 · Instrucción en evidencia | Avanzar 10 s → seleccionar → aprobar | `ACTION_DENIED`: la propuesta predefinida intenta `REPEAT_DEBIT`, fuera del catálogo. El intento humano no evita la regla. |

Los números son identificadores sintéticos. No representan personas, clientes, cuentas ni pagos existentes.

## Experimentos adicionales

**Separación de funciones.** En un caso `REVIEW`, usa **Intentar autoaprobación**. Debe aparecer `SELF_APPROVAL_DENIED` y no crearse una aprobación. La suite también intenta aprobar con un actor sin rol.

**Revocación de rol.** Aprueba SIM-001 y usa **Revocar rol del revisor** antes de ejecutar. El permiso simulado se revoca para todo el ensayo. `REVIEWER_AUTHORITY_REVOKED` impide el efecto: una aprobación previa no congela la autoridad del revisor. Restituir el rol no renueva la aprobación ni recupera casos ya rechazados.

**Cambio de contenido.** Aprueba SIM-001 y usa **Alterar propuesta** antes de avanzar el reloj. `CONTENT_CHANGED` impide aplicar una aprobación a evidencia distinta. La vinculación del laboratorio compara la serialización del contenido; no es una firma criptográfica ni un protocolo de autorización transferible.

**Cambio de versión.** En SIM-001, aprueba y usa **Cambiar versión**. El siguiente intento debe denegarse aunque la aprobación permanezca vigente.

**Evidencia vencida.** Avanza 10 s y después 120 s antes de aprobar. `STALE_EVIDENCE` requiere nueva evidencia y una nueva propuesta. Aprobar no renueva la observación anterior. En esta versión del ejercicio se reinicia el ensayo para generar de nuevo las propuestas vencidas o rechazadas.

**Parada de emergencia.** Aprueba SIM-001, activa la parada y avanza 1 s: cero efectos nuevos. Retírala y avanza 1 s dentro de la vigencia: el dominio vuelve a validar. La parada no deshace lo aplicado. Un caso `UNKNOWN` puede reconciliarse por lectura si la dependencia está disponible.

**Dependencia degradada.** Reinicia, degrada la dependencia y avanza 10 s. Tres fallos abren el circuito. Tras ocho segundos lógicos de espera, se admite una sonda de lectura; una sonda fallida vuelve a abrirlo. Restaura la dependencia y avanza hasta la siguiente sonda. Recuperar la dependencia no renueva aprobaciones vencidas.

**Pausa y concurrencia.** El selector limita los lectores simulados a 1, 3 o 6. Reducirlo permite terminar las lecturas ya iniciadas. Pausar detiene la admisión de nuevas lecturas y efectos; las lecturas iniciadas pueden terminar y las aprobaciones siguen envejeciendo. Estas cifras no son capacidad ni latencia medida.

## Contrato de estados

```text
QUEUED → READING → REVIEW → APPROVED → VERIFIED
            │        │          ├──→ UNKNOWN → lectura concordante → VERIFIED
            │        │          ├──→ REJECTED  (versión, contenido o precondición)
            │        │          └──→ EXPIRED
            │        └── propuesta denegada: sigue sin aprobación
            ├──→ ABSTAINED
            └──→ RETRY_WAIT → READING → QUARANTINED → reparación/reingreso
```

`UNKNOWN` representa conocimiento incompleto del consumidor. El motor conserva el estado real sintético para poder demostrar la recuperación. El JSON exportado y los eventos incluyen esa perspectiva del dominio; la tabla y el inspector muestran la confirmación como **por verificar** mientras el resultado sea desconocido. Consultar un recibo sin comprobar estado y postcondición no basta para declarar éxito.

## Evidencia y verificación

El esquema `financial-ai-control-lab-v1` declara `mode: local-simulation`, `syntheticData: true`, `modelInference: false` y `durableAudit: false`. Cada evento incluye secuencia, tiempo lógico, caso, operación, actor simulado, tipo y detalle. El recibo vive en memoria bajo una clave estable y su contenido se compara en reintentos. La colección `receipts` exporta una copia de cada recibo con `operationId`, contenido vinculado, recurso, versión y estado. En `UNKNOWN`, un recibo `COMMITTED` expone la perspectiva del dominio para estudiar la respuesta perdida; el consumidor conserva su estado desconocido hasta reconciliar. La descarga es una instantánea y no cambia al seguir ejecutando o reiniciar el ensayo.

Desde la raíz:

```sh
node --test tests/control-lab.test.cjs
```

La suite ejecuta la misma fuente del navegador en Node y comprueba autorización, separación de funciones, catálogo, recurso, contenido, versión, vencimiento, duplicados, resultados desconocidos, recibos ausentes o divergentes, parada, dependencia, circuito, cuarentena y pausa. El resultado de cada ejecución es la evidencia del estado actual del código; no se reutilizan resultados históricos.

## Límites e implementación productiva

- La identidad y los roles son etiquetas controladas por el motor, sin autenticación real. El código de navegador es modificable y no constituye una frontera de seguridad.
- Las propuestas se construyen de forma determinista. El caso hostil prueba la lista de acciones permitidas, no evalúa resistencia real de un modelo a prompt injection.
- La comparación de contenido es local. Una implementación distribuida debe especificar canonicalización, firmas o identificadores protegidos, confianza entre servicios y validación en servidor.
- Una transición síncrona de un único proceso ilustra el efecto y el recibo. No demuestra transacciones distribuidas, persistencia, tolerancia a fallos, aislamiento de clientes, consistencia remota ni un único efecto garantizado en otro sistema.
- El registro exportado es modificable. La auditoría productiva necesita controles de acceso, integridad, minimización, retención y manejo de datos definidos.
- No existe carga real, inferencia, monitoreo, despliegue ni validación de cumplimiento normativo en este ejercicio.

Fuentes editables: [`src/engine.js`](src/engine.js), [`src/app.js`](src/app.js), [`src/style.css`](src/style.css) y [`index.html`](index.html). No hay compilación ni dependencias externas. El estilo compartido está en [`../board/style.css`](../board/style.css).
