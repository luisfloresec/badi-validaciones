# Contexto del Proyecto BADI

## 1. Información general del proyecto

El proyecto corresponde al Trabajo de Integración Curricular titulado:

**“Desarrollo de una aplicación web utilizando Angular y NestJS para la sistematización de los procesos de Gestión Social del Banco de Alimentos de Imbabura (BADI).”**

El sistema busca apoyar la gestión de organizaciones sociales, convenios, documentos, entregas de alimentos, reportes, seguridad y auditoría.

El desarrollo debe realizarse de forma incremental, siguiendo las Historias de Usuario, el Product Backlog, los procesos BPMN y el Diccionario de Datos aprobados.

---

## 2. Stack tecnológico definido

- Frontend: Angular.
- Backend: NestJS.
- Base de datos: PostgreSQL.
- ORM: TypeORM.
- Almacenamiento documental: Firebase Storage.
- Contenedores: Docker / Docker Compose.
- Control de versiones: Git / GitHub.
- Entorno de desarrollo: Windows con WSL2 Ubuntu.
- Editor/agente de apoyo: Antigravity.

---

## 3. Estructura actual del proyecto

```text
badi/
├── backend/
│   └── badi-api/        # Backend NestJS
├── frontend/
│   └── badi-web/        # Frontend Angular sin SSR
├── database/
├── docs/
├── docker-compose.yml   # PostgreSQL en Docker
└── README.md
```

---

## 4. Base de datos local

PostgreSQL se ejecuta mediante Docker Compose.

Credenciales locales de desarrollo:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=badi_user
DB_PASSWORD=badi_password
DB_DATABASE=badi_db
```

Contenedor:

```text
badi_postgres
```

---

## 5. Principios generales de desarrollo

1. El desarrollo debe respetar el Diccionario de Datos, las Historias de Usuario y el Product Backlog aprobados.
2. No crear tablas, campos o relaciones nuevas sin una justificación clara.
3. Las tablas y columnas de base de datos deben usar nombres en español.
4. En TypeScript se permite usar camelCase, pero debe mapearse a columnas del diccionario.
5. La información crítica no debe eliminarse físicamente; se deben usar estados como Activo, Inactivo, Anulado o Reemplazado.
6. Las acciones críticas deben registrarse en auditoría cuando corresponda.
7. El desarrollo debe ser modular y seguir buenas prácticas de NestJS y Angular.
8. No implementar funcionalidades completas de golpe; avanzar por sprint e historia de usuario.
9. El backend debe exponer una API clara para ser consumida por Angular.
10. El frontend debe manejar validaciones visuales, pero las validaciones principales también deben existir en backend.

---

## 6. Roles funcionales base

El sistema manejará roles configurables, pero para el análisis y desarrollo inicial se consideran estos roles funcionales:

### Administrador

Responsable de configurar usuarios, roles, permisos, catálogos, tipos de documento y tipos de convenio.

### Gestión Social

Usuario operativo responsable de registrar organizaciones, representantes, grupos atendidos, dirigentes, convenios, entregas y documentos asociados.

### Usuario autorizado

Usuario con permisos específicos para consultar, descargar o revisar información según el rol asignado.

---

## 7. Módulos principales del sistema

### 7.1 Seguridad y Acceso

Incluye autenticación, usuarios, roles y permisos.

Tablas principales:

- usuario
- rol
- usuario_rol

Historias relacionadas:

- HU-01 Iniciar sesión.
- HU-02 Gestionar mi perfil.
- HU-03 Gestionar usuarios.
- HU-04 Gestionar roles y permisos.

Reglas importantes:

- El usuario accede mediante credenciales.
- La contraseña nunca debe almacenarse en texto plano.
- El campo `password_hash` debe guardar la contraseña cifrada.
- El acceso a módulos y acciones depende de roles y permisos.
- Los usuarios no deben eliminarse físicamente si tienen historial; se desactivan.
- Las acciones de creación, actualización y desactivación deben auditarse.

---

### 7.2 Catálogos y Configuración

Incluye catálogos simples y catálogos con reglas funcionales.

Tablas principales:

- catalogo_parametrico
- tipo_documento
- tipo_convenio

Reglas importantes:

- Los catálogos simples como vulnerabilidad, grupo etario, acción social, segmento, frecuencia de retiro, financiamiento y transporte pueden administrarse desde `catalogo_parametrico`.
- `tipo_documento` y `tipo_convenio` tienen tablas propias porque contienen reglas adicionales.
- Los valores inactivos no deben aparecer para nuevos registros, pero deben conservarse para registros históricos.
- Los cambios en catálogos deben auditarse.

---

### 7.3 Gestión de Organizaciones Sociales

Administra organizaciones sociales, representantes, grupos atendidos y dirigentes.

Tablas principales:

- tipo_organizacion
- organizacion
- representante
- grupo_atendido
- dirigente

Reglas importantes:

- El RUC se almacena como `VARCHAR(13)`, no como número.
- La cédula se almacena como texto, no como número.
- Una organización puede existir sin convenio.
- El convenio se gestiona en un módulo independiente.
- Grupo atendido no es lo mismo que grupo etario.
- Grupo atendido es el grupo real registrado.
- Grupo etario, vulnerabilidad y segmento son clasificaciones asociadas al grupo atendido.
- Para esta versión se maneja una vulnerabilidad principal por grupo atendido.
- Cada grupo atendido debe tener un dirigente.
- El dirigente puede ser el mismo representante o una persona distinta.
- En GADs pueden existir grupos predeterminados, pero el sistema debe permitir registrar nuevos grupos si el catálogo no cubre el caso real.
- No se deben eliminar físicamente organizaciones críticas; se debe manejar estado.

---

### 7.4 Gestión de Convenios

Administra convenios como entidad independiente de la organización.

Tablas principales:

- tipo_convenio
- convenio
- historial_estado_convenio

Reglas importantes:

- Todo convenio debe vincularse a una organización existente.
- Una organización puede tener cero, uno o varios convenios.
- Un convenio nuevo se registra como nuevo convenio, no como renovación del anterior.
- El convenio piloto puede controlarse por número máximo de retiros.
- El convenio vinculado puede controlarse por duración en meses desde la fecha de activación.
- Los cambios de estado del convenio deben registrarse en `historial_estado_convenio`.
- El archivo del convenio firmado no se guarda como campo dentro de `convenio`; se maneja como documento.
- El convenio puede estar en estados como Borrador, Activo, Finalizado o Suspendido.
- La activación del convenio registra fecha de activación.
- Si el convenio controla duración, la fecha estimada de finalización puede calcularse desde la activación.
- Si el convenio controla retiros, el contador de retiros se alimenta desde entregas ejecutadas.

---

### 7.5 Gestión Documental

La gestión documental se centraliza en dos tablas principales:

- tipo_documento
- documento

Reglas clave:

- Todo archivo debe tener un `tipo_documento`.
- La tabla `tipo_documento` clasifica y define reglas del documento.
- La tabla `documento` registra el archivo real, ruta, nombre, usuario, fecha, estado y relación con entidades.
- Los archivos físicos se almacenan en Firebase Storage.
- La base de datos solo guarda referencias, rutas y metadatos.
- Los documentos de procesos específicos se cargan desde su módulo de origen.
- Gestión Documental permite consulta centralizada.
- Gestión Documental administra directamente documentos institucionales.
- Gestión Documental no debe modificar relaciones principales de documentos asociados a convenios, entregas u organizaciones.

Ejemplos de relación documental:

- RUC:
  - `entidad_tipo = organizacion`
  - `entidad_id = id_organizacion`

- Convenio firmado:
  - `entidad_tipo = convenio`
  - `entidad_id = id_convenio`

- Registro fotográfico:
  - `entidad_tipo = entrega`
  - `entidad_id = id_entrega`

- Memorando institucional:
  - `es_institucional = true`
  - `entidad_tipo = null`
  - `entidad_id = null`

Reglas para documentos institucionales:

- Si `es_institucional = true`, el documento se gestiona desde Gestión Documental.
- No requiere entidad asociada.
- Permite múltiples registros por defecto.
- Ejemplos: memorandos, oficios, reglamentos, manuales y formatos generales.

Reglas para documentos asociados a módulos:

- Se cargan desde el módulo correspondiente.
- Heredan automáticamente `entidad_tipo` y `entidad_id`.
- Pueden consultarse y descargarse desde Gestión Documental.
- No deben reasignarse desde Gestión Documental.

Reglas de reemplazo documental:

- Si un documento se carga incorrectamente, no se elimina físicamente.
- El documento anterior cambia de estado: Inactivo, Anulado o Reemplazado.
- El nuevo documento queda como Activo.
- La vista principal debe mostrar documentos activos.
- Los documentos inactivos, anulados o reemplazados se conservan para trazabilidad.

Campos importantes de `tipo_documento`:

- id_tipo_documento
- nombre
- modulo_origen
- formatos_permitidos
- requiere_entidad
- es_institucional
- estado
- permite_multiple
- permite_reemplazo

Campos importantes de `documento`:

- id_documento
- id_tipo_documento
- nombre_archivo
- nombre_documento
- ruta_archivo
- mime_type
- tamano_bytes
- entidad_tipo
- entidad_id
- es_institucional
- fecha_emision
- estado
- fecha_carga
- id_usuario_carga
- id_usuario_updated

---

### 7.6 Cronograma, Agendamiento y Entregas

Administra la planificación y ejecución de entregas/retiros.

Tabla principal:

- entrega

Reglas importantes:

- Una entrega se asocia a una organización.
- Puede asociarse a un convenio si aplica.
- El número de usuarios atendidos en la entrega no necesariamente coincide con el total de personas atendidas registrado en la organización.
- La cuota de recuperación real puede diferir de la cuota estimada de la organización.
- Las entregas pueden alimentar el contador de retiros de un convenio piloto.
- Las evidencias fotográficas se manejan como documentos relacionados directamente a la entrega:
  - `entidad_tipo = entrega`
  - `entidad_id = id_entrega`
- No se deben crear campos como `foto1`, `foto2` o `foto3`.
- Una entrega puede tener una o varias evidencias si el tipo documental lo permite.
- Las entregas pueden tener estados como Programada, Ejecutada o Cancelada.
- Si una entrega ya afectó el contador de retiros de un convenio, su anulación debe controlar el impacto en ese contador.

---

### 7.7 Reportes

Los reportes se generan mediante consultas sobre las tablas existentes.

No se debe crear una tabla por cada reporte.

Reportes esperados:

- Organizaciones activas.
- Convenios activos/finalizados.
- Entregas por periodo.
- Kilos entregados.
- Usuarios atendidos.
- Documentos registrados.
- Evidencias por entrega.
- Reportes filtrados por fecha, organización, convenio, estado o tipo documental.

Reglas importantes:

- Los reportes se generan con filtros.
- Si no existen datos para un filtro, se debe mostrar un mensaje informativo.
- La exportación a PDF o Excel puede implementarse si el alcance lo contempla.
- El acceso a reportes debe depender de permisos.

---

### 7.8 Auditoría y Trazabilidad

Tabla principal:

- auditoria_log

Reglas importantes:

- Registra acciones críticas del sistema.
- No reemplaza historiales específicos como `historial_estado_convenio`.
- Complementa la trazabilidad global.
- Debe registrar usuario, acción, módulo, entidad afectada, datos anteriores, datos nuevos, fecha e IP si aplica.
- Los registros de auditoría no deben ser editables ni eliminables por usuarios comunes.
- El acceso a auditoría debe estar protegido por permisos.

Acciones auditables:

- Crear usuario.
- Actualizar usuario.
- Desactivar usuario.
- Cambiar permisos.
- Crear organización.
- Actualizar organización.
- Registrar convenio.
- Cambiar estado de convenio.
- Cargar documento.
- Reemplazar/anular documento.
- Registrar entrega.
- Cancelar entrega.

---

## 8. Product Backlog por sprints

### Sprint 0

Base del sistema:

- Seguridad.
- Usuarios.
- Roles.
- Permisos.
- Catálogos.
- Tipos de documento.
- Tipos de convenio.

Historias:

- HU-01 a HU-07.

### Sprint 1

Gestión de organizaciones:

- Registro de organizaciones.
- Representantes.
- Grupos atendidos.
- Dirigentes.
- Consulta, actualización y desactivación.

Historias:

- HU-08 a HU-12.

### Sprint 2

Gestión de convenios y gestión documental:

- Convenios.
- Activación y ciclo de vida.
- Documentos de convenio.
- Carga contextual.
- Documentos institucionales.
- Consulta y descarga documental.

Historias:

- HU-13 a HU-18.

### Sprint 3

Entregas, reportes y auditoría:

- Agendamiento.
- Entrega realizada.
- Evidencias fotográficas.
- Gestión de entregas.
- Reportes.
- Auditoría.

Historias:

- HU-19 a HU-24.

---

## 9. Convenciones técnicas para NestJS

- Usar módulos por dominio funcional.
- Evitar poner toda la lógica en `app.module`.
- Usar entidades TypeORM alineadas al diccionario.
- Usar DTOs para entrada de datos.
- Usar servicios para lógica de negocio.
- Usar controladores para rutas.
- Usar validaciones con `class-validator` cuando se implementen DTOs.
- Usar nombres de tabla en español.
- No crear entidades que no estén justificadas en el diccionario.
- Usar `@Column({ name: 'nombre_columna' })` cuando el nombre TypeScript difiera del nombre real en base de datos.

Estructura sugerida:

```text
src/
├── modules/
│   ├── users/
│   ├── roles/
│   ├── auth/
│   ├── catalogs/
│   ├── document-types/
│   ├── agreement-types/
│   ├── organizations/
│   ├── representatives/
│   ├── attended-groups/
│   ├── agreements/
│   ├── documents/
│   ├── deliveries/
│   └── audit/
```

---

## 10. Convenciones técnicas para Angular

- Usar Angular como SPA.
- No usar SSR.
- Usar routing.
- Usar SCSS.
- Organizar por features.
- Separar servicios, modelos, páginas y componentes.
- Consumir la API NestJS mediante servicios Angular.
- Validar formularios en frontend y backend.
- El frontend no debe contener reglas críticas que no existan también en backend.
- Usar guards e interceptores para autenticación cuando se implemente login.

Estructura sugerida:

```text
src/app/
├── core/
│   ├── services/
│   ├── guards/
│   └── interceptors/
├── shared/
│   ├── components/
│   └── models/
├── features/
│   ├── auth/
│   ├── users/
│   ├── roles/
│   ├── catalogs/
│   ├── organizations/
│   ├── agreements/
│   ├── documents/
│   ├── deliveries/
│   ├── reports/
│   └── audit/
```

---

## 11. Reglas para usar asistencia de IA en el proyecto

Cuando se use Antigravity para generar código:

1. Primero debe leer este archivo de contexto.
2. Debe respetar el diccionario de datos.
3. Debe trabajar por historia de usuario o tarea técnica.
4. No debe crear módulos completos sin explicación previa.
5. No debe modificar muchas partes del proyecto sin indicar qué cambiará.
6. Debe evitar inventar campos no definidos.
7. Si necesita agregar un campo, debe justificarlo.
8. Debe mantener nombres de columnas alineados a la base de datos.
9. Debe priorizar claridad y mantenibilidad sobre automatización excesiva.
10. Debe esperar revisión antes de cambios grandes.
11. Debe trabajar de forma incremental.
12. Debe mantener coherencia entre backend, frontend, base de datos y documentación.

---

## 12. Estado actual del desarrollo

Ya se realizó:

- Instalación de WSL2 con Ubuntu.
- Instalación de Node.js, npm, Angular CLI y NestJS CLI.
- Creación del proyecto NestJS `badi-api`.
- Creación del proyecto Angular `badi-web` sin SSR.
- Inicialización del repositorio Git.
- Configuración de PostgreSQL con Docker Compose.
- Configuración inicial de TypeORM en NestJS.
- Validación de conexión backend con PostgreSQL.
- Creación del archivo de contexto del proyecto.

Siguiente objetivo:

Implementar Sprint 0, iniciando por usuarios y roles.

---

## 13. Indicaciones para Antigravity

Antes de generar código, leer este archivo y confirmar comprensión del contexto.

No modificar código todavía si el usuario solo pide análisis.

Cuando el usuario solicite implementación, trabajar de forma incremental y proponer primero el plan de cambios.

El desarrollo debe avanzar en este orden inicial:

1. Usuarios.
2. Roles.
3. Relación usuario-rol.
4. Autenticación.
5. Catálogos paramétricos.
6. Tipos de documento.
7. Tipos de convenio.
