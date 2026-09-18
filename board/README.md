# Tablero de controles

Abre [`index.html`](index.html) en un navegador. El tablero conecta identidad, evidencia, propuesta, revisión humana, ejecución, verificación y auditoría. **Anterior**, **Siguiente** y cada componente permiten recorrer los siete pasos. **Mostrar todo** mantiene todos los componentes visibles. **Presentar** amplía el diagrama y oculta las notas de revisión; al salir se recuperan.

El caso ilustrativo es un pago sintético ya aplicado cuya confirmación permanece pendiente. Solo se permite conciliar la confirmación. El tablero enlaza el [laboratorio](../demo/index.html), la [arquitectura conceptual](../architecture/conceptual.html) y la [arquitectura objetivo](../architecture/target.html).

## Guion de revisión

1. **Identidad y contexto:** permisos de lectura y permiso de acción son decisiones distintas.
2. **Modelo y evidencia:** el contenido recuperado no tiene autoridad. La abstención debe ser un resultado válido.
3. **Propuesta tipada:** validar formato no prueba que el diagnóstico sea correcto ni autoriza la acción.
4. **Revisión humana:** actor independiente, contenido exacto, alcance limitado y vigencia; el humano no elimina las reglas del dominio.
5. **API de dominio:** revalidación inmediatamente antes del efecto, versiones, deduplicación y parada.
6. **Resultado:** recibo y postcondición; una respuesta perdida exige consulta por la misma operación.
7. **Auditoría:** quién, qué, por qué y con qué resultado, con protección y retención que deben implementarse fuera del ejercicio.

## Contexto de diseño público

Registro de producto. Arquitectos, equipos de operación, riesgo y seguridad revisan el flujo juntos en un monitor o proyector, en una sala iluminada, y luego inspeccionan el ejercicio a su ritmo. La interfaz usa una superficie clara de papel, tinta sobria y un acento reservado para selección y acciones. Los estados llevan texto además de color. La intención es facilitar revisión, no presentar servicios como desplegados ni atribuir certificación.

Fuentes del sistema, recursos locales, foco visible, enlace para saltar navegación, botones nativos, adaptación móvil y respeto por reducción de movimiento. Las notas usan prosa corta y los componentes ofrecen un recorrido consistente. El diagrama del tablero explica la frontera; las vistas de arquitectura amplían componentes y topología.

Fuentes editables: `index.html`, `app.js` y `style.css`. No necesita build ni recursos externos. Es material de referencia y simulación, no evidencia de una implementación productiva.
