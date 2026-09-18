# Fundación de evidencia sintética en AWS

Referencia educativa independiente del demo local. Define un almacenamiento de evidencia y separación de permisos para estudiar controles de IA en servicios financieros. No contiene infraestructura adoptada, inventarios, estado, direcciones de red, credenciales ni identificadores de entornos existentes.

**Alcance:** el código describe recursos nuevos. La verificación local usa un proveedor simulado; no demuestra que los controles funcionen en una cuenta AWS. Este módulo no despliega el tablero, el agente, un modelo ni la arquitectura objetivo completa.

## Qué define el código

| Recurso/control | Implementado en Terraform | Límite |
|---|---|---|
| Evidencia | Bucket privado, ACL deshabilitadas, versionado, TLS obligatorio, cifrado KMS con clave exacta | El prefijo `synthetic/` es una convención de acceso; no verifica que el contenido sea sintético |
| Escritura | Rol que solo puede escribir `synthetic/*`, generar una clave de datos a través de S3 y emitir logs | No lee ni elimina evidencia; no ejecuta operaciones financieras |
| Revisión | Rol distinto que lista/lee versiones de `synthetic/*` y descifra a través de S3 | No escribe ni aprueba transacciones; aprobación humana pertenece a la aplicación |
| Identidad | Confianza hacia dos roles preexistentes, explícitos y distintos de la cuenta elegida | No crea IdP, federación, MFA ni identidades de origen; cada origen necesita autorización `sts:AssumeRole` |
| Auditoría técnica | Logs de acceso S3 en un segundo bucket privado con SSE-S3 y fuente restringida; grupo CloudWatch | No incluye CloudTrail, SIEM, alertas, exportador de aplicación ni acceso de un equipo de seguridad |
| Retención | Evidencia sin caducidad automática; logs con retención limitada y versionado | S3 Lifecycle es asíncrono; las versiones no actuales pueden persistir otro período tras pasar a no actuales |
| Protección local | `prevent_destroy` en buckets/clave, `force_destroy = false`, eliminación KMS a 30 días | No sustituye controles de AWS; quitar recursos del código o administrar por fuera puede eludir la protección |

El versionado permite recuperar versiones; **no es inmutabilidad/WORM**. El escritor puede crear una nueva versión bajo una clave existente. La aplicación debe producir un identificador único de evidencia y registrar versión/hash. La clave delega administración en la cuenta: los administradores pueden modificar los controles. Las políticas IAM mostradas no son un límite de permisos organizativo ni una defensa ante el administrador de cuenta.

S3 entrega logs de acceso según su mecanismo de mejor esfuerzo. No constituyen una bitácora completa ni garantizan cada evento. El bucket de destino usa SSE-S3 porque la entrega de estos logs lo requiere. [Documentación de S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/ServerLogs.html) y [cifrado del destino](https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingKMSEncryption.html).

## Valores que debes cambiar

`terraform.tfvars.example` contiene instrucciones `CHANGE` y placeholders **deliberadamente inválidos**. Para una futura implementación revisada, copiar a `terraform.tfvars` y completar en privado:

| Variable | Sustitución o revisión requerida |
|---|---|
| `region` | Región comercial de AWS aprobada según residencia, disponibilidad y costos. No hay región de despliegue predeterminada. |
| `expected_account_id` | ID real de la cuenta destinataria. El proveedor rechaza operar en otra cuenta. `account1` en diagramas es solo una etiqueta. |
| `resource_prefix` | Prefijo nuevo y globalmente único para los buckets, de 6–40 caracteres, en minúsculas. |
| `runtime_trusted_role_arn` | Rol existente del workload, en la misma cuenta y sin comodines. |
| `audit_trusted_role_arn` | Rol existente de revisión, en la misma cuenta y distinto al workload. |
| `aws_profile` | Nombre del perfil local de SSO/asunción de rol, si se usa. `null` conserva la cadena estándar de credenciales; verificar su identidad antes de operar. |
| `log_retention_days` | Elegir 7, 14, 30, 60 o 90 días; 30 es una decisión de ejercicio, no una política regulatoria. |

No existen variables para IP, CIDR, interfaces, VPC, AZ o endpoints porque este módulo no crea red. `az-1` y `az-2` pertenecen al diseño objetivo, no son nombres AWS utilizables. Tampoco se solicitan secretos, claves de API o datos de clientes. Los valores numéricos y `us-east-1` en las pruebas son fixtures del proveedor simulado.

## Verificación sin cuenta cloud

Desde esta carpeta, con Terraform 1.7 o superior:

```sh
terraform fmt -check -recursive
terraform init -backend=false -input=false
terraform validate
terraform test
```

`init` descarga el proveedor público y verifica su firma; requiere red hacia el registro, sin acceder a AWS. El archivo `.terraform.lock.hcl` fija la versión/checksums seleccionados y se versiona. `validate` comprueba esquema y referencias. Cada ejecución de `tests/controls.tftest.hcl` usa `mock_provider "aws"`: incluso el `command = apply` de esa prueba solo rellena atributos calculados en memoria, sin llamadas AWS. Nunca ejecutar pruebas con un proveedor real reemplazando ese mock. [Mecanismo de mocks de Terraform](https://developer.hashicorp.com/terraform/language/tests/mocking).

El lock incluye hashes del contenido (`h1`) para macOS ARM64 y Linux AMD64, además de los hashes de ZIP (`zh`). Al actualizar el proveedor, ejecutar `terraform providers lock -platform=darwin_arm64 -platform=linux_amd64` y versionar el resultado. CI usa `-lockfile=readonly`: necesita los hashes de contenido de su plataforma para validar el proveedor ya descomprimido. [Formatos de checksum y plataformas en Terraform](https://developer.hashicorp.com/terraform/language/files/dependency-lock).

Las pruebas comprueban bloqueos de acceso público, versionado, cifrado, listas exactas de permisos, prefijo, condiciones de KMS, TLS, origen de logs y rechazo de identidad compartida/cuenta ajena/placeholders. No prueban efectividad IAM en AWS, entrega real de logs, restauración ni disponibilidad.

## Antes de una implementación real

Este repositorio no realiza despliegues. Una implementación necesita una revisión propia de identidad temporal, costos, política de claves, permisos del ejecutor, residencia y retención. El módulo usa el backend local por omisión: definir un backend con cifrado, control de acceso y bloqueo antes de un uso compartido. No publicar estado, planes, variables privadas ni valores de outputs.

El cliente que cargue evidencia debe usar una operación `PutObject` individual, un objeto pequeño y los encabezados explícitos `x-amz-server-side-encryption: aws:kms` y `x-amz-server-side-encryption-aws-kms-key-id` con el ARN devuelto. No se concede `kms:Decrypt` al escritor: cargas multipartes no están contempladas. No usar comandos que suban multipartes automáticamente sin revisar ese contrato. Los permisos se limitan a `synthetic/`.

Queda propuesto, fuera de este código: autenticación del producto, autorización por operación, validación de entradas, políticas del agente, aislamiento de herramientas, aprobación y conciliación de acciones, evaluación del modelo, conectividad privada, cómputo, endpoints, CloudTrail con eventos de datos, alertas, operación de seguridad, WORM si la política lo exige, respaldo/restauración demostrada y despliegue de aplicaciones. El cifrado y IAM por sí solos no comprueban esos controles.

Los costos posibles incluyen KMS, almacenamiento/versiones/solicitudes S3 y CloudWatch. La evidencia no expira y acumula almacenamiento; los logs pueden contener metadatos operativos y merecen control de acceso. No se crean NAT, balanceadores, cómputo o servicios de modelos. La retención limitada reduce acumulación de logs; no es un tope de gasto ni una promesa de capa gratuita. Evaluar costos con el [AWS Pricing Calculator](https://calculator.aws/) antes de desplegar.
