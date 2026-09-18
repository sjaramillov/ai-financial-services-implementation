# Decisiones de arquitectura

## ADR-001 · Autoridad fuera del modelo

El modelo puede proponer acciones y solicitar lecturas. El controlador de dominio valida permisos, estado, evidencia y aprobación antes de un efecto. Esto contiene errores del modelo y herramientas comprometidas. Agrega validaciones explícitas y obliga a definir contratos de dominio.

## ADR-002 · Simulación sin dependencias externas

El ejercicio de operaciones funciona localmente con datos sintéticos y respuestas deterministas. Permite reproducir transiciones y fallas sin credenciales. No permite inferir calidad de modelos, seguridad de una cuenta cloud o comportamiento bajo carga distribuida.

## ADR-003 · Desconocido no significa fallido

Una respuesta perdida después del envío produce estado desconocido. La recuperación consulta el sistema de registro con la misma identidad de operación. Sólo un resultado definitivo permite decidir el siguiente paso. Un retry ciego o una compensación automática podrían duplicar o contradecir un efecto.

## ADR-004 · Evaluación con ciclo de vida propio

AI Evaluation Lab se modela aparte del agente de operaciones. Su flujo principal es una máquina de estados determinista; la IA se usa donde aporta análisis cualitativo delimitado. El resultado de pruebas y la limpieza se persisten por separado.

## ADR-005 · Infraestructura nueva y parametrizada

La raíz pública de Terraform es una base educativa independiente. No adopta recursos existentes ni contiene inventarios o estados. El mapa objetivo cubre más componentes que esta base; se deben implementar y validar antes de afirmar que existe un sistema completo.

## ADR-006 · Modelo editable y visores separados

ArchiMate expresa elementos y relaciones para intercambio con herramientas de modelado. Archify genera las vistas HTML interactivas desde JSON. Se conservan ambos formatos y sus límites de equivalencia; un visor no acredita conformidad semántica del modelo.
