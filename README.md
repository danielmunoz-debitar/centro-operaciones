# DEBITAR · Centro de Operaciones v0.2

## Publicar en GitHub Pages
1. Sube el contenido de esta carpeta a la raíz de tu repositorio.
2. GitHub > Settings > Pages.
3. Deploy from branch > `main` / `/root`.
4. Abre la URL publicada una vez con internet. El Service Worker deja disponible la app offline.

## Qué incluye
- Dashboard autosumable.
- Billeteras reales del ecosistema.
- DEBITAR: clientes y ficha con los campos definidos.
- Bóveda local cifrada AES-GCM para claves SII/Previred/Mutual/DT.
- Uber: turnos, km reales, bruto, combustible consumido, desgaste, retención, neto, $/hora y $/km.
- Meta Uber calculada desde el déficit mensual, no una meta fija.
- Trabajo dependiente.
- Gastos, deudas y cuotas por vencimiento.
- Objetivos.
- Exportar/importar respaldo JSON.
- PWA / funcionamiento offline después de primera carga.

## Seguridad y sincronización
- Datos normales: `localStorage` del navegador.
- Claves de clientes: cifradas con Web Crypto AES-GCM + PBKDF2. La contraseña maestra NO se guarda.
- Esta versión todavía no sincroniza automáticamente entre dispositivos. Usa Exportar/Importar respaldo para mover datos.
- No publiques archivos JSON de respaldo en GitHub.

## Importante
La v0.2 es funcional y preserva la arquitectura financiera definida, pero aún es una etapa local/offline. La siguiente capa es autenticación + base central + sincronización multi-dispositivo.
