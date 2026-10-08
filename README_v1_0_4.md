# DEBITAR Centro de Operaciones v1.0.4

## Instalación
1. Exportar respaldo JSON actual desde Configuración antes de publicar.
2. Subir **todos** los archivos y carpeta `assets` a la raíz de GitHub Pages, reemplazando los de v1.0.3.
3. Recargar la aplicación; si la PWA conserva archivos antiguos, cerrar/reabrir y actualizar sin borrar datos del sitio.
4. Confirmar que clientes, tareas, turnos, saldos y cobros se mantienen.

## Mejoras
- Logo oficial DEBITAR grande, restaurado como archivo real.
- Tema oscuro y navegación agrupada en cinco áreas sin borrar módulos.
- Mi jornada: tareas pendientes y vencidas, continuidad y dashboard histórico.
- Presupuesto 55/25/20 transitorio o 50/30/20 objetivo (referencial).
- Conciliación por cuenta con historial, motivo, fecha y diferencia; no inventa ingresos o gastos.
- Cuentas de terceros separadas en el indicador de saldos.
- Se excluyen saldos iniciales explícitos del KPI de ingresos ganados.
- Service worker actualizado y ruta de icono reparada.

## Advertencias
- NO se importa automáticamente el respaldo ni se modifica el saldo de ninguna cuenta. El JSON del 8 de octubre es referencia, no reemplaza datos posteriores.
- Conciliar solo después de registrar movimientos conocidos para evitar doble conteo.
- La distribución presupuestaria es orientativa; los gastos y las cuotas pueden requerir reclasificación.
- El turno Uber de 99,65 horas requiere revisión de la hora real de cierre; no se altera automáticamente.
- No se ha validado el funcionamiento extremo a extremo en navegador real. Hacer respaldo y prueba controlada antes de uso productivo.
