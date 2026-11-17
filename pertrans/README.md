# PERTRANS · Centro de control
Portal estático de cuatro módulos. Sin servicios pagados ni claves API.

## Abrir
GitHub Pages publica esta carpeta en /pertrans/. Los originales del repositorio permanecen intactos.
Para desarrollo: servir esta carpeta con un servidor HTTP local; abrir index.html. No abrir con file:// (los módulos PDF usan ES modules).

## Datos
No se incluyen documentos, plantillas con datos ni listados de trabajadores en el repositorio.
Carga los Excel desde el equipo en cada módulo. IndexedDB conserva las bases; descarga respaldos al cambiar de equipo.
La foto de asignación en Taller se muestra de apoyo; la asignación se confirma en la tabla. PDF sin texto requiere ingreso manual o detalle Excel/CSV.
Combustible y Pareo son migraciones de las versiones previas. Se usa un nuevo origen y no se migra automáticamente su almacenamiento del sitio anterior.

## Pruebas
node tests/core.cjs
La validación previa con fuentes privadas contrastó 18.264 registros, 96 patentes y las siete autopistas frente al modelo de octubre. Los datos de prueba no se publican.
No sustituye la verificación de nuevos diseños de factura o datos corregidos en origen.

## Bibliotecas
SheetJS / xlsx-js-style, fflate, PDF.js, pdf-lib y DejaVu (para los informes de combustible).
Los avisos y licencias originales se conservan junto a las bibliotecas cuando están disponibles.
