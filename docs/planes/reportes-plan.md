# PLAN DE IMPLEMENTACIÓN

# Sistema de Reportes -- Banco de Alimentos de Imbabura (BADI)

## Objetivo General

Diseñar e implementar un sistema de reportes institucionales integrado
directamente dentro de los módulos existentes del sistema BADI,
permitiendo generar documentos PDF y exportaciones Excel útiles para la
gestión operativa y administrativa, evitando la creación de un módulo
independiente de reportes.

El objetivo no es exportar tablas, sino producir documentos que
representen información real utilizada por el personal del BADI durante
sus procesos diarios.

------------------------------------------------------------------------

# Objetivos específicos

-   Generar documentos PDF institucionales desde los procesos más
    importantes.
-   Exportar información consolidada a Excel desde los listados
    administrativos.
-   Reutilizar una infraestructura común de generación de reportes.
-   Mantener una apariencia institucional uniforme.
-   No modificar el modelo de datos existente.
-   No duplicar lógica del sistema.

------------------------------------------------------------------------

# Arquitectura General

## Backend

Se mantendrá un único módulo interno denominado:

`ReportsModule`

Este módulo **NO** tendrá interfaz gráfica.

Responsabilidades:

-   PdfGeneratorService
-   ExcelGeneratorService
-   Plantillas comunes
-   Encabezados y pies de página
-   Estilos compartidos
-   Procesamiento de imágenes
-   Utilidades comunes

Todos los módulos consumirán este servicio.

Ejemplo:

``` text
AgreementController
        │
        ▼
AgreementService
        │
        ▼
ReportsModule
        │
        ▼
PDF / Excel
```

No deberán existir rutas como:

``` text
/reports
/reports/dashboard
```

Cada módulo expondrá sus propios endpoints:

``` text
GET /deliveries/:id/report
GET /agreements/:id/report
GET /organizations/:id/report
GET /organizations/:id/history
GET /dashboard/report

GET /organizations/export
GET /agreements/export
GET /deliveries/export
GET /audit/export
GET /documents/export
```

------------------------------------------------------------------------

# Frontend

No existirá:

-   Menú "Reportes"
-   Ruta `/reports`
-   Dashboard de reportes
-   Pantalla exclusiva de reportes

Los botones estarán integrados en cada módulo.

------------------------------------------------------------------------

# Filosofía

## Reportes Institucionales (PDF)

Se generan desde el detalle de un registro y documentan un proceso.

## Exportaciones Administrativas (Excel)

Se generan desde los listados y respetan los filtros aplicados.

------------------------------------------------------------------------

# FASE 1 -- Infraestructura

Implementar:

-   ReportsModule
-   PdfGeneratorService
-   ExcelGeneratorService
-   Plantillas reutilizables
-   Header institucional
-   Footer institucional
-   Estilos comunes
-   Procesamiento de imágenes
-   Numeración de páginas
-   Configuración de márgenes

No implementar aún ningún reporte.

------------------------------------------------------------------------

# FASE 2 -- Reporte de Entrega (Prioridad Máxima)

Ubicación:

Detalle de una entrega.

Botón:

``` text
Reporte PDF
```

## Diseño del PDF

``` text
------------------------------------------------

LOGO BADI

BANCO DE ALIMENTOS DE IMBABURA

REPORTE DE ENTREGA

------------------------------------------------

Número de entrega

Fecha

Fecha de generación

------------------------------------------------

DATOS GENERALES

------------------------------------------------

Organización

Responsable

Estado

Observaciones

Información existente en el sistema

------------------------------------------------

PRODUCTOS ENTREGADOS

------------------------------------------------

Tabla con la información registrada

------------------------------------------------

EVIDENCIAS

------------------------------------------------

Fotografía 1
Fotografía 2
Fotografía 3
...

------------------------------------------------

OBSERVACIONES

------------------------------------------------

Texto completo

------------------------------------------------
```

Requisitos:

-   Solo fotografías como evidencias.
-   Mantener proporción.
-   Dos imágenes por fila.
-   Agregar nuevas páginas automáticamente.

------------------------------------------------------------------------

# FASE 3 -- Reporte de Convenio

Ubicación:

Detalle del convenio.

Botón:

``` text
Reporte PDF
```

Contenido:

Utilizar **únicamente** los campos existentes en la base de datos.

No agregar información inexistente.

Diseño:

``` text
LOGO

REPORTE DE CONVENIO

--------------------------------

Datos generales

Estado

Fechas

Organización

Responsable

Observaciones

Documento asociado

--------------------------------
```

------------------------------------------------------------------------

# FASE 4 -- Ficha Institucional de Organización

Botón:

``` text
Reporte PDF
```

Contenido:

Datos registrados de la organización.

Indicadores calculados:

-   Cantidad de convenios.
-   Cantidad de entregas.
-   Última entrega registrada.

No modificar el modelo de datos.

------------------------------------------------------------------------

# FASE 5 -- Historial de Organización

Botón:

``` text
Historial PDF
```

Contenido:

-   Datos generales.
-   Convenios registrados.
-   Entregas realizadas.
-   Evidencias fotográficas de las entregas.

------------------------------------------------------------------------

# FASE 6 -- Reporte del Dashboard

Botón:

``` text
Exportar PDF
```

Debe incluir:

-   Indicadores actuales.
-   Gráficos existentes.
-   Fecha y hora de generación.
-   Resumen ejecutivo.

No recalcular información distinta a la mostrada por el Dashboard.

------------------------------------------------------------------------

# FASE 7 -- Exportaciones Excel

Implementar en:

-   Organizaciones
-   Convenios
-   Entregas
-   Auditoría
-   Documentos

Cada exportación deberá respetar exactamente los filtros activos del
listado.

------------------------------------------------------------------------

# Diseño institucional de los PDF

## Encabezado

-   Logo BADI
-   Nombre completo del sistema
-   Nombre del reporte
-   Fecha y hora
-   Número de página

## Tipografía

-   Título: 18 pt, negrita.
-   Subtítulos: 14 pt.
-   Texto: 11 pt.

## Tablas

-   Encabezado gris.
-   Filas alternadas.
-   Bordes finos.
-   Formato uniforme.

## Márgenes

-   Superior: 25 mm
-   Inferior: 20 mm
-   Laterales: 20 mm

## Pie de página

``` text
Sistema Web BADI
Fecha de generación
Página X de Y
```

------------------------------------------------------------------------

# Requisitos de desarrollo

-   No duplicar consultas.
-   Reutilizar servicios existentes.
-   No crear entidades nuevas para reportes.
-   No modificar la base de datos.
-   Reutilizar la lógica actual del sistema.

------------------------------------------------------------------------

# Criterios de aceptación

Cada fase estará completa únicamente cuando:

-   El botón esté integrado en la interfaz correspondiente.
-   El documento se genere correctamente.
-   Mantenga la identidad visual institucional.
-   Utilice únicamente información existente.
-   No afecte funcionalidades actuales.
-   Permita descargar el documento sin errores.

------------------------------------------------------------------------

# Observaciones para Antigravity

-   No crear un módulo visual de reportes.
-   Integrar los botones directamente en cada módulo.
-   Antes de implementar cada reporte, inspeccionar las entidades reales
    del proyecto.
-   No asumir la existencia de campos.
-   No inventar información.
-   Adaptar cada reporte al estado actual del sistema.
