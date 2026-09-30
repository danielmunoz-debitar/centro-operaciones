# DEBITAR · Centro de Operaciones v0.3

Versión integrada del ecosistema personal/DEBITAR/Uber.

## Actualización en GitHub Pages
Reemplaza `index.html`, `app.js`, `styles.css`, `manifest.webmanifest` y `sw.js`. Mantén `assets/logo-debitar.png`. Haz commit y espera el despliegue de GitHub Pages.

## Datos
- Se guardan localmente en el navegador.
- Migra automáticamente datos básicos desde `debitar_ops_v02` cuando existe.
- Usa Configuración > Exportar JSON como respaldo.
- Las credenciales de clientes se cifran en el navegador con AES-GCM y contraseña maestra; la contraseña maestra no se guarda.
- No publiques archivos JSON de respaldo en GitHub.

## Modelo
Ingresos por fuente + cobros DEBITAR + Uber alimentan el ecosistema. Transferencias entre billeteras no son ingreso/gasto. Gastos y deudas se controlan por mes. Uber separa caja (bruto - bencina cargada) de resultado económico (bruto - combustible consumido - desgaste - retención).