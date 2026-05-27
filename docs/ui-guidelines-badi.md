# Guía UI Reducida - Sistema BADI

## 1. Objetivo

Esta guía define los lineamientos visuales iniciales para el frontend del Sistema de Gestión Social del Banco de Alimentos de Imbabura (BADI).

El objetivo es construir una interfaz institucional, limpia y funcional, usando Angular, Angular Material y SCSS personalizado.

Esta guía no busca crear un design system completo todavía. Su propósito es orientar las primeras vistas funcionales del sistema:

- Layout principal
- Dashboard
- Organizaciones
- Detalle de organización
- Usuarios
- Roles

---

## 2. Contexto del sistema

Proyecto: Sistema de Gestión Social BADI  
Frontend: Angular  
UI: Angular Material + SCSS  
Backend: NestJS API REST  
Arquitectura: monolito modular  

El backend ya cuenta con módulos funcionales para:

- Usuarios
- Roles
- Asignación usuario-rol
- Catálogos paramétricos
- Tipos de organización
- Organizaciones
- Representantes
- Grupos atendidos
- Dirigentes
- Detalle completo de organización

---

## 3. Identidad visual

La interfaz debe transmitir:

- Formalidad institucional
- Claridad operativa
- Confianza
- Orden administrativo
- Facilidad de uso para personal de Gestión Social

El diseño debe tomar como referencia el prototipo inicial del sistema BADI, pero mejorado con una estructura más limpia, consistente y moderna.

---

## 4. Paleta de colores

Color principal oficial BADI:

```scss
$badi-green-700: #015641;
```

Paleta recomendada:

```scss
// Verdes BADI
$badi-green-900: #013d2f; // sidebar oscuro
$badi-green-800: #014936; // hover sidebar
$badi-green-700: #015641; // color principal BADI
$badi-green-600: #027257; // hover botones
$badi-green-500: #038767; // acentos positivos
$badi-green-100: #d9eee7; // fondos suaves
$badi-green-050: #f1faf7; // fondo muy suave

// Neutrales
$gray-900: #111827; // texto principal
$gray-700: #374151; // texto secundario
$gray-500: #6b7280; // texto auxiliar
$gray-300: #d1d5db; // bordes
$gray-100: #f3f4f6; // fondos suaves
$gray-050: #f9fafb; // fondo general
$white: #ffffff;

// Estados
$state-active: #015641;
$state-inactive: #6b7280;
$state-pending: #d97706;
$state-approved: #059669;
$state-rejected: #dc2626;
$state-scheduled: #2563eb;
```

Uso recomendado:

- Sidebar: `#013d2f`
- Ítem activo del sidebar: `#015641`
- Hover sidebar: `#014936`
- Botones principales: `#015641`
- Fondo general: `#f9fafb`
- Cards: blanco
- Bordes: gris claro
- Estados activos: verde BADI

---

## 5. Estilo general

El sistema debe tener un estilo administrativo moderno:

- Sidebar izquierdo fijo
- Topbar superior blanca
- Fondo general claro
- Cards blancas con bordes suaves
- Tablas limpias
- Formularios en tarjetas
- Botones primarios verdes
- Íconos de Angular Material
- Bordes redondeados moderados entre 8px y 12px
- Sombras muy sutiles
- Diseño sobrio, no recargado

No usar efectos visuales innecesarios, animaciones exageradas ni colores que compitan con el verde institucional.

---

## 6. Layout principal

El layout base debe incluir:

1. Sidebar fijo a la izquierda
2. Topbar superior
3. Área principal de contenido
4. Router outlet para renderizar vistas internas

Estructura visual:

```text
┌──────────────────────────────────────────────┐
│ Topbar                                       │
├───────────────┬──────────────────────────────┤
│ Sidebar       │ Área de contenido            │
│               │                              │
│               │ Vistas del sistema           │
│               │                              │
└───────────────┴──────────────────────────────┘
```

---

## 7. Sidebar

Características:

- Ancho aproximado: 260px
- Fondo: `#013d2f`
- Logo o texto principal: `BADI`
- Subtítulo: `Sistema de Gestión Social`
- Texto en blanco o blanco con opacidad
- Ítem activo con fondo `#015641`
- Hover con fondo `#014936`
- Íconos de Angular Material
- Footer con usuario ficticio

Usuario de ejemplo:

```text
Daniela Sánchez
Gestión Social
```

Navegación inicial:

```text
Dashboard              /dashboard
Organizaciones         /organizations
Usuarios               /users
Roles                  /roles
Gestión Documental     /documents
Cronograma             /schedule
Auditoría              /audit
```

Las rutas que todavía no tengan funcionalidad real pueden mostrarse como placeholders.

---

## 8. Topbar

Características:

- Alto aproximado: 64px
- Fondo blanco
- Borde inferior gris claro
- A la izquierda: título o breadcrumb de la vista actual
- A la derecha:
  - ícono de notificaciones
  - nombre del usuario
  - avatar con iniciales

Ejemplo:

```text
Dashboard                                    🔔 Daniela Sánchez  DS
```

---

## 9. Área de contenido

Características:

- Fondo: `#f9fafb`
- Padding: 24px
- Cada vista debe tener:
  - título principal
  - subtítulo breve
  - acciones principales si aplica
  - contenido en cards o tablas

Ejemplo:

```text
Título: Organizaciones
Subtítulo: Gestión de organizaciones sociales registradas
Acción: Nueva organización
```

---

## 10. Componentes mínimos reutilizables

Crear solo los componentes necesarios para avanzar rápido:

```text
layout/
  app-shell/
  sidebar/
  topbar/

shared/components/
  status-chip/
  page-header/
  kpi-card/
```

No crear un design system enorme todavía.

Componentes mínimos:

### AppShellComponent

Contenedor principal del sistema.

Debe incluir:

- Sidebar
- Topbar
- Router outlet

### SidebarComponent

Menú lateral con navegación.

### TopbarComponent

Barra superior con título, notificaciones y usuario.

### PageHeaderComponent

Componente para títulos de página.

Debe mostrar:

- título
- subtítulo
- botón de acción opcional

### StatusChipComponent

Chip visual para estados:

```text
Activo
Inactivo
Registrada
Aprobado
Pendiente
Rechazado
Programado
```

### KpiCardComponent

Card para métricas del dashboard.

---

## 11. Vistas iniciales

Las primeras vistas a preparar son:

```text
/dashboard
/organizations
/organizations/:id
/users
/roles
/documents
/schedule
/audit
```

Las vistas `/documents`, `/schedule` y `/audit` pueden quedar como placeholders por ahora.

---

## 12. Dashboard

La vista Dashboard debe mostrar:

- Título: `Dashboard`
- Subtítulo: `Resumen general del sistema BADI`
- 4 cards KPI:
  1. Organizaciones registradas
  2. Representantes activos
  3. Grupos atendidos
  4. Dirigentes registrados
- Sección de actividad reciente simulada
- Sección de próximas acciones o recordatorios simulados

Los datos pueden ser simulados al inicio.

---

## 13. Vista de Organizaciones

Ruta:

```text
/organizations
```

Debe mostrar:

- Título: `Organizaciones`
- Subtítulo: `Gestión de organizaciones sociales registradas`
- Botón: `Nueva organización`
- Barra de búsqueda
- Tabla

Columnas iniciales:

```text
Razón social
RUC
Tipo
Ciudad
Estado
Acciones
```

Acciones:

```text
Ver detalle
Editar
```

Por ahora puede usar datos simulados o preparar la estructura para conectarse luego al backend.

---

## 14. Detalle de Organización

Ruta:

```text
/organizations/:id
```

Debe estar pensada para consumir:

```text
GET /organizations/:id/full-detail
```

Estructura visual:

- Header con:
  - nombre de la organización
  - RUC
  - ciudad
  - estado
- Secciones o tabs:
  1. Información general
  2. Representantes
  3. Grupos atendidos
  4. Dirigentes
  5. Documentos asociados

La sección `Documentos asociados` debe existir visualmente aunque el módulo documental aún no esté implementado.

Por ahora mostrar:

```text
Sin documentos registrados todavía.
```

Tabla vacía preparada:

```text
Tipo de documento
Nombre
Fecha de carga
Estado
Acciones
```

---

## 15. Vista Usuarios

Ruta:

```text
/users
```

Debe mostrar:

- Título: `Usuarios`
- Subtítulo: `Administración de usuarios del sistema`
- Botón: `Nuevo usuario`
- Tabla simple

Columnas:

```text
Nombres
Email
Estado
Acciones
```

---

## 16. Vista Roles

Ruta:

```text
/roles
```

Debe mostrar:

- Título: `Roles`
- Subtítulo: `Gestión de roles del sistema`
- Botón: `Nuevo rol`
- Cards o tabla

Campos visibles:

```text
Nombre del rol
Descripción
Estado
Acciones
```

---

## 17. Placeholders temporales

Las siguientes rutas pueden tener placeholders visuales por ahora:

```text
/documents
/schedule
/audit
```

Cada placeholder debe mostrar:

- título
- descripción breve
- mensaje indicando que el módulo será implementado posteriormente

Ejemplo:

```text
Gestión Documental
Este módulo permitirá consultar y administrar documentos asociados a organizaciones.
```

---

## 18. Estructura sugerida de carpetas

```text
src/app/
  layout/
    app-shell/
    sidebar/
    topbar/

  shared/
    components/
      page-header/
      status-chip/
      kpi-card/

  features/
    dashboard/
    organizations/
    users/
    roles/
    documents/
    schedule/
    audit/
```

---

## 19. Rutas sugeridas

```typescript
export const routes = [
  {
    path: '',
    component: AppShellComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'organizations', component: OrganizationsListComponent },
      { path: 'organizations/:id', component: OrganizationDetailComponent },
      { path: 'users', component: UsersComponent },
      { path: 'roles', component: RolesComponent },
      { path: 'documents', component: DocumentsPlaceholderComponent },
      { path: 'schedule', component: SchedulePlaceholderComponent },
      { path: 'audit', component: AuditPlaceholderComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
```

---

## 20. Reglas para Antigravity

Cuando se solicite implementar una vista o componente, Antigravity debe seguir estas reglas:

1. Leer primero `docs/contexto-badi.md`.
2. Leer también este archivo `docs/ui-guidelines-badi.md`.
3. Antes de modificar archivos, responder:
   - si necesita instalar paquetes
   - qué archivos tocará
   - qué cambios hará
4. No instalar paquetes automáticamente.
5. No modificar backend.
6. No crear vistas fuera del alcance solicitado.
7. No crear componentes innecesarios.
8. Mantener Angular Material + SCSS.
9. Verificar que el proyecto compile con:

```bash
npm run build
```

10. Mantener el diseño sobrio, institucional y alineado al verde BADI.

---

## 21. Primer objetivo frontend

El primer bloque a implementar debe ser:

```text
Layout base:
- AppShellComponent
- SidebarComponent
- TopbarComponent
- rutas placeholder
- estilos globales BADI
```

No implementar todavía formularios complejos ni conexión real con backend.

Después del layout base, avanzar en este orden:

```text
1. Dashboard
2. Organizaciones listado
3. Detalle de organización
4. Usuarios
5. Roles
```
