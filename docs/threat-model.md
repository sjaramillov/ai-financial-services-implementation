# Modelo de amenazas

Activos: identidad, datos autorizados, propuesta, política, aprobación, estado del dominio, registro de idempotencia y evidencia. Fronteras: navegador/backend, orquestador/modelo, herramientas/sistema de registro, evaluador/candidato y entorno temporal/repositorio de evidencia.

| Amenaza | Escenario | Control y prueba necesaria |
|---|---|---|
| Confused deputy | Un documento solicita llamar una herramienta privilegiada | Lista de herramientas mínima, parámetros tipados y autorización backend independiente del texto |
| Cambio después de aprobación | La propuesta cambia de objeto o monto | Invalidar aprobación por cambio de versión/hash y comprobar de nuevo en el momento del efecto |
| Doble operación | Reintento tras un timeout que ocurrió después del commit | Clave de negocio estable, reserva atómica y conciliación antes de reenvío |
| Fuga entre usuarios | Un identificador de caso permite consultar otra sesión | Identidad derivada del servidor y filtro por recurso en cada lectura |
| Evidencia manipulada | Worker o administrador cambia el informe | Separar escritor y auditor; integridad, retención y controles de administración verificables |
| Presupuesto agotado | Bucle de modelo o retry sin límite | Límites por ejecución y globales, circuit breaker, cancelación y supervisión |
| Juez comprometido | Respuesta del candidato ordena asignarle máxima nota | Datos no confiables separados de la rúbrica; calibración y revisión humana |
| Recursos huérfanos | El ejecutor falla después de aprovisionar | Inventario durable, TTL operativo y verificador externo con permisos de limpieza acotados |
| Dependencia degradada | Core lento o respuesta ambigua | Abstenerse, abrir circuito y conciliar; no inventar confirmaciones |
| Cambio de proveedor | Modelo actualizado sin evaluación | Registro de versiones, regresión, rollout controlado y mecanismo de reversión |

Los filtros de texto y guardrails no sustituyen la autorización ni prueban ausencia de prompt injection. La traza del navegador puede modificarse y no representa un registro inmutable.

## Datos y auditoría

Registrar identificador de operación, actor autorizado, acción, objeto pseudonimizado, versión de evidencia, política, propuesta estructurada, aprobación y resultado observable. Evitar secretos, datos personales innecesarios y razonamiento interno del modelo. Definir retención y acceso conforme al propósito aprobado, con pruebas de restauración y borrado cuando corresponda.

La terminación de procesos no deshace un efecto ya confirmado por el sistema de registro. Las compensaciones son operaciones de negocio nuevas y requieren autorización propia.
