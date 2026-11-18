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


### Pago de multas y cuotas del conductor

- En **Editar**, marca la multa **Pagada** e ingresa fecha, monto efectivamente pagado, quién pagó y referencia del comprobante.
- En **Cobro al conductor**, elige **Conductor** e ingresa responsable, monto a recuperar, número de cuotas y mes de inicio. Registra la referencia del acuerdo que respalda el descuento. El monto nominal de la multa y el efectivamente pagado se conservan por separado.
- Abre **Cuotas y abonos** y registra cada descuento efectivo con fecha, monto y referencia de liquidación. Planificar cuotas no disminuye el saldo. Los abonos se aplican desde la cuota más antigua; se permiten descuentos parciales y pagos anticipados. Si un abono es incorrecto, **Anular** conserva la trazabilidad y repone el saldo.
- La multa sale de **Multas por pagar** al marcarla Pagada. Si el conductor tiene saldo, continúa en **Pendientes de pago o recuperación**. Al recuperar todo el monto pasa a **Cerradas**. Si no hay cobro al conductor, selecciona **No corresponde**; **Por definir** mantiene el caso pendiente.
- El Excel conserva **Hallazgos** y los resultados históricos de **Revision semanal**: pagar hoy no cambia lo que se detectó otro día. Añade **Pendientes multas**, **Seguimiento multas**, **Cuotas conductores** y **Abonos conductores**. Se puede reimportar el Excel generado para recuperar pagos y cuotas; las imágenes requieren el respaldo JSON completo.
- El informe respeta el filtro de estado y fechas; el Excel siempre incluye todo el historial y una hoja separada de pendientes. Deja las fechas vacías para ver saldos de revisiones antiguas. El período filtra por fecha de revisión, no por mes del descuento.

Este módulo registra pagos y descuentos informados; no ejecuta descuentos en las remuneraciones.


## Flujo desde el Excel revisado

1. Carga el Excel: se detectan las patentes marcadas **Con hallazgos** y las que tengan multas en **Hallazgos**. La lista se agrupa por patente; no vuelve a pedir marcar cada revisión. Los pagos, abonos y respaldos locales se conservan al recargar un archivo. La lista principal corresponde a los hallazgos del último Excel; el historial financiero se mantiene separado.
2. Presiona **Completar antecedentes**. Agrega información adicional por patente y guarda. Si conoces folio, comuna y monto, abre **Individualizar una multa** y registra una fila por infracción. Un texto como "2 multas" se conserva como observación; no crea dos registros ficticios.
3. Carga imágenes o un Word **.docx**, asociado al informe general o a una patente detectada. Se extraen el texto y las imágenes incrustadas para el respaldo del informe; no incluye OCR ni identificación automática del conductor. Los .doc antiguos deben guardarse como .docx. Las imágenes externas y formatos no admitidos se informan como pendientes.
4. Revisa el período y destinatario del **Informe preliminar**. El botón prepara la vista previa con resumen por patente, información faltante, multas individualizadas y respaldos. Usa **Imprimir o guardar PDF**. El sistema no envía el informe.
5. En **Control de pagos de multas identificadas**, filtra **Sin pago registrado**, **Pagadas** o **Todas las identificadas**. Ingresa fecha, monto, quién pagó y referencia del comprobante. La lista indica lo registrado, no consulta automáticamente el estado de deuda ante el organismo. Las cuotas y abonos del conductor continúan en el historial.
6. Descarga el Excel actualizado para conservar pagos, cuotas y la nueva hoja **Antecedentes patentes**. Descarga además el respaldo JSON completo para conservar Word e imágenes, que no se incrustan en el Excel.

Los documentos se procesan en el navegador. La carga de respaldo Word fue verificada mediante pruebas de extracción de texto e imagen incrustada; la prueba de carga de archivos en el navegador de desarrollo quedó interrumpida.
