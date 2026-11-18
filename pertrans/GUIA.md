# PERTRANS · Centro de control

Cuatro procesos independientes. AM/PM queda fuera.

## Primera vez
1. Combustible: carga tu Excel base o último corte revisado; luego COPEC. Para fuente mensual usa el reporte acumulado del mes. No ordenes una sola columna en los archivos de origen.
2. Pareo: carga el listado de móviles propios, la programación y los ingresos de la App. Confirma las equivalencias de nombres y descarga el Excel. Se cuenta por conductor, sin exigir coincidencia de hora o cliente.
3. Taller: carga MODELO_TALLER_actualizado_V2.xlsx, selecciona la pestaña del mes y adjunta los PDF. Revisa proveedor, móvil/destino y montos. Puedes mostrar una foto como apoyo para asignar móviles. Confirma y descarga. La nueva descarga queda como base en este navegador.
4. Autopistas: carga el último informe PERTRANS con Dashboard, Resumen y siete autopistas. Selecciona el mes. Carga los PDF y los detalles Excel/CSV, confirma cada fuente y descarga. Cada autopista contiene solo detalle; el resumen cruza patente × autopista. No se distribuyen saldos anteriores, intereses ni diferencias sin patente.

## Trabajo seguro con los archivos
- No se envían facturas ni planillas al servidor. La página y sus bibliotecas se descargan; los datos se procesan en tu equipo.
- El código es público; los documentos que subes no se incorporan a GitHub.
- El navegador conserva tus bases. En otro computador o navegador necesitas cargar el Excel o recuperar un respaldo.
- Descarga el respaldo de cada módulo antes de cambiar de equipo o borrar los datos del navegador.
- PDF escaneados sin texto: usa Agregar manualmente en Taller, o el CSV/Excel original de detalle en Autopistas. No se inventan montos.
- Un documento no reconocido queda por revisar. El estado CONTADO de una factura no confirma que se haya realizado una transferencia.
- Taller: usa Repartir por móvil solo con una distribución confirmada. El total de las partes debe coincidir exactamente con el respaldo.
- Autopistas: si factura y detalle contienen lo mismo, incluye solo una fuente por factura/autopista. Se excluyen los tránsitos de otros meses.
- Los datos agregados sin fecha de tránsito requieren verificar el período de la factura antes de confirmar.
- Guarda los Excel descargados con fecha. No entregues a jefatura un archivo con alertas pendientes sin aclararlas.


## Multas y revisión de flota

1. Abre **Multas** y carga el control Excel con las hojas `Revision semanal` y `Hallazgos`.
2. Selecciona patente y fecha. Guarda **Sin hallazgos** cuando la revisión no detecte infracciones; guarda **Con hallazgos** y completa una fila por cada infracción cuando corresponda.
3. Registra comuna, folio, fecha de infracción, juzgado, monto, estado y conductor según los antecedentes disponibles. Los datos desconocidos se dejan pendientes; no se deducen de observaciones resumidas.
4. Adjunta pantallazos PNG, JPG o WEBP a cada infracción. Esta versión adjunta imágenes y requiere transcribir y confirmar los datos; no incluye OCR automático.
5. Descarga el **Excel actualizado**: completa Hallazgos, actualiza el resultado de la revisión en los días de la semana indicada en B4 y cuenta las infracciones detalladas por patente en Observaciones. Conserva también la observación original. El modelo admite hasta 1.000 infracciones.
6. Ajusta el período y prepara el informe. Incluye detalle, montos pendientes, revisiones con hallazgos sin registros asociados y pantallazos. Usa **Imprimir o guardar PDF**.
7. Descarga un **respaldo completo** JSON para conservar planilla, registros e imágenes, y para recuperar el trabajo en otro navegador o equipo. Las imágenes no se incorporan al Excel.

Los registros quedan en el almacenamiento de este navegador, sin subirse automáticamente a GitHub. La página y el código son públicos. Cualquier persona con acceso al mismo perfil del navegador puede acceder al trabajo guardado. Borrar los datos del sitio elimina ese almacenamiento: conserva respaldos fuera del navegador.

**Limpiar pantalla** en Multas vacía el formulario y la vista previa, conservando el historial y el Excel base. En Taller y Autopistas permite descartar la tanda después de exportar o respaldar, conservando el modelo.
