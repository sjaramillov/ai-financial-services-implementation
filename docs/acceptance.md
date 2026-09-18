# Criterios para avanzar a un piloto

Todos los puntos son requisitos propuestos, no controles acreditados por la demo.

1. **Propósito:** propietario, población afectada, operaciones permitidas/prohibidas y proceso de recurso o revisión humana definidos.
2. **Datos:** clasificación, finalidad, minimización, retención, residencia y condiciones de tratamiento aprobadas para las fuentes y proveedores elegidos.
3. **Autoridad:** modelo sin permisos de efecto; backend con controles por actor, herramienta, objeto y política. Pruebas de revocación, segregación de funciones y cambios después de aprobación.
4. **Consistencia:** identidad de operación conservada, reserva atómica, payload ligado a idempotency key, recuperación tras fallas y conciliación con el sistema de registro. Ensayos concurrentes y de respuesta desconocida.
5. **Evaluación:** conjuntos representativos y versionados, criterios fijados de antemano, análisis de segmentos y de abstención, evaluación adversarial y revisión de errores de alto impacto.
6. **Operación:** cuotas, monitoreo, parada, canal manual y responsable de incidentes. RTO/RPO acordados y recuperación ensayada, con evidencia del resultado.
7. **Auditoría:** reconstrucción de una decisión con acceso restringido, retención definida y controles sobre alteración. Los logs de aplicación por sí solos no bastan.
8. **Infraestructura:** plan revisado en la cuenta elegida, IAM efectivo, ingress/egress, cifrado, secretos, costos y limpieza probados. Una configuración válida no prueba estos resultados.
9. **Proveedor:** contrato, versiones, disponibilidad, salida y límites de responsabilidad revisados por sus responsables.
10. **Aceptación:** decisión explícita de los responsables con excepciones, vencimientos y medidas compensatorias. Un tablero sin incidencias no reemplaza esa decisión.

No se fijan umbrales genéricos de exactitud o disponibilidad. Deben derivarse del daño posible, las condiciones de operación y la evidencia del caso de uso.
