const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.join(__dirname,'..'),XLSX=require(root+'/lib/xlsx.full.min.js'),fflate=require(root+'/combustible/vendor/fflate.js'),c={XLSX,fflate,Date,Map,Set,Uint8Array};vm.createContext(c);
for(const f of ['lib/common.js','taller/engine.js','autopistas/engine.js'])vm.runInContext(fs.readFileSync(root+'/'+f,'utf8'),c);
assert.equal(c.PT.num('1.234,56'),1234.56);assert.equal(c.PT.date('07.10.2026'),'2026-10-07');assert.equal(c.PT.num(''),null);
const r={date:'2026-10-10',time:'10:00:00',plate:'AAAA11',portico:'P1',amount:100,code:'VS',group:'Vespucio Sur',invoice:'100',source:'detalle.csv',level:'transit'};
const source={rows:[r,{...r}],enabled:true,confirmed:true,name:'detalle.csv',invoice:'100',group:'Vespucio Sur'};
const p=c.Tolls.prepare([source],'2026-10');assert.equal(p.rows.length,1);assert.equal(p.total,100);assert.equal(p.excluded.length,1);assert(c.Tolls.prepare([source,source],'2026-10').issues.length);
assert.equal(c.Tolls.prepare([source],'2026-11').total,0);
const invoice=c.Workshop.parse('PROVEEDOR R.U.T.: 11.111.111-1\nFACTURA ELECTRONICA\nNº 12345\n11 de noviembre de 2026\nMonto Total: 35.700','factura.pdf');assert.equal(invoice.factured,35700);assert.equal(invoice.paid,null);
const c1={rut:'11111111-1',doc:'12345',kind:'FACTURA',transaction:''};assert.equal(c.Workshop.match(c1,[{row:2,rut:c1.rut,doc:c1.doc,kind:'FACTURA'}]).type,'duplicate');
console.log('OK: números, fechas, filtro mensual, duplicados, no confundir facturado con pagado.');

// Blank self-closing cells must not consume the following formula cell.
const xml='<worksheet><sheetData><row r="10"><c r="B10" s="7"/><c r="C10" s="7"><f>1+2</f><v>3</v></c><c r="J10"/><c r="K10"><f>COUNTIF(B10:B11,B10)</f><v>1</v></c></row><row r="11"/></sheetData></worksheet>';
const patched=c.PT.patch(xml,{B10:'AAAA11'},{modelRow:10});
assert(patched.includes('<c r="C10" s="7"><f>1+2</f><v>3</v></c>'));
assert(patched.includes('<c r="K10"><f>COUNTIF(B10:B11,B10)</f><v>1</v></c>'));
assert(patched.includes('<row r="11">'));
console.log('OK: exportación preserva fórmulas tras celdas vacías.');
