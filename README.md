# DEBITAR Centro de Operaciones v0.6.1

Versión corregida. No contiene datos privados precargados.

## Instalación
Reemplazar index.html, app.js, styles.css y manifest.webmanifest en el hosting.
Luego abrir Configuración > Importar JSON y seleccionar el respaldo exportado desde v0.5.

## Compatibilidad
El importador acepta el respaldo `version: 3`, conserva campos desconocidos y migra la estructura en memoria a version 6.

## Seguridad
No publicar respaldos JSON ni credenciales de clientes en GitHub. Los datos continúan en localStorage del navegador hasta implementar backend/login/sincronización.
