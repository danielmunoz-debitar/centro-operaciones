(function(root){
'use strict';
const P=root.PT;
function documentDate(t){let d=P.date(t);if(d)return d;const m=t.match(/(\d{1,2})\s+(?:de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+(?:de\s+)?(20\d\d)/i);return m?m[3]+'-'+String(['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'].indexOf(m[2].toLowerCase())+1).padStart(2,'0')+'-'+m[1].padStart(2,'0'):'';}
const pick=(t,re)=>t.match(re)?.[1]?.trim()||'';
function parse(text,filename){
 const bank=/Comprobante de Transferencia|Datos Transferencia/i.test(text),quote=/COTIZACI[OÓ]N|COTIZACION REPUESTOS/i.test(text),invoice=/FACTURA\s+(?:NO AFECTA O\s+EXENTA\s+)?ELECTR[OÓ]NICA/i.test(text),commercial=/Vta\. Nacional Afecta/i.test(text);
 let rut='',vendor='',id='',kind=invoice?'FACTURA':commercial?'VTA. NACIONAL AFECTA':quote?'COTIZACION':'SIN DOC TRIBUTARIO';
 const transferId=pick(text,/(mw[a-z0-9]+-\d+)/i)||pick(text,/ID Transferencia[^\n]*\n(\d+)/i)||pick(text,/ID Transferencia\s+(\d+)/i);
 if(bank){const block=text.split(/Rut Destinatario/i)[1]?.split(/Nombre Destinatario/i)[0]||'';rut=[...block.matchAll(/([\d.]+-[\dkK])/g)].at(-1)?.[1]||'';rut=rut||pick(text,/(?:Rut Destinatario\s+)([\d.]+-[\dkK])/i)||pick(text,/RUT:\s*([\d.]+-[\dkK])/);vendor=pick(text,/Destinatario:\s*([^\n]+)/i);if(!vendor)vendor=pick(text,/Nombre Destinatario\s+([^\n]+)/i);}
 if(!rut||!bank){rut=pick(text,/R\.?U\.?T\.?\s*:?\s*([\d.]+-[\dkK])/i);vendor=text.split('\n').map(x=>x.trim()).find(l=>l.length>4&&!/Estimado|Factura|RUT|R\.U\.T|Fecha|Ita[uú]|Datos Transferencia/i.test(l))?.replace(/\s+R\.?U\.?T\.?.*$/i,'')||'';}
 const suppliers=[['969183005','DIFOR CHILE SA'],['789240302','IMPLEMENTOS SA'],['796064307','VIVIPRA LTDA'],['782395602','SUPERMERCADO DEL NEUMATICO'],['787017401','WURTH CHILE LTDA'],['55448612','LUIS HUMBERTO LETELIER MARTICORENA'],['77734821','ROBERTO ANTONIO MUÑOZ ACEVEDO'],['77549073K','MARTIGOM SPA'],['781984523','COMERCIAL CHALK-ARTS & AUTOCOLOR SPA'],['50469240K','CADIZ HERNANDEZ MARIA ELENA Y OTRO'],['783811847','FERRETERÍA MARCELA REQUENA ALVAREZ E.I.R.L.']];
 rut=rut.replace(/\./g,'');vendor=suppliers.find(([r])=>r===P.norm(rut))?.[1]||vendor;
 if(invoice)id=pick(text,/FACTURA\s+(?:NO AFECTA O\s+EXENTA\s+)?ELECTR[OÓ]NICA\s*(?:N[º°o.]*)?\s*(\d+)/i)||pick(text,/N[º°]\s*(\d+)/i);
 else if(commercial)id=pick(text,/Vta\. Nacional Afecta:\s*(\d+)/i);
 else if(quote)id=pick(text,/CO-\d+-\d+/i)||pick(text,/COTIZACI[OÓ]N(?:\s+REPUESTOS)?\s*(?:N[º°o.]*)?\s*([\d.]+)/i);
 // CO ids need their entire match.
 if(quote&&!invoice&&/CO-\d+-\d+/.test(text))id=text.match(/CO-\d+-\d+/)[0];
 let amount=bank?P.num(pick(text,/Monto[^\n]*\n\s*\$\s*([\d.,]+)/i)||pick(text,/Monto\s*\$\s*([\d.,]+)/i)):null;
 let invoiceAmount=invoice?P.num(pick(text,/Monto\s+Total\s*:?\s*(?:CLP|\$)?\s*([\d.,]+)/i)):null;
 const datestr=documentDate(text),fdate=filename.match(/(\d\d)-(\d\d)-(20\d\d)/),date=datestr||(fdate?fdate[3]+'-'+fdate[2]+'-'+fdate[1]:'');
 const mobile=pick(text,/(?:\bM[ÓO]VIL\s*|\bM)(\d{3})\b/i)||pick(filename,/_M(\d{3})_/i)||( /\bSTOCK\b/i.test(text+' '+filename)?'STOCK':'');
 const glosa=pick(text,/(?:Mensaje \(opcional\)|Mensaje a destinatario)\s*:?\s*([^\n]+)/i);
 let description=glosa||filename.replace(/\.pdf$/i,'').replace(/^\d\d-\d\d-\d{4}_/,'').replace(/_\$.*$/,'').replaceAll('_',' ');
 if(!glosa&&/^f\d+/i.test(filename))description=text.split('\n').filter(l=>/^\s*1\s+(?:\S+\s+)?/.test(l)).slice(0,1).join(' ').replace(/\s{2,}/g,' ').slice(0,160)||'Detalle según factura (ver respaldo)';
 let qty=null;
 if(!bank&&/^f\d+/i.test(filename)){const lines=text.split('\n').filter(l=>/^\s*\d+\s+\S+\s+/.test(l)&&/\d+[,.]\d+/.test(l));if(lines.length){const clean=lines[0].trim().replace(/^\d+\s+\S+\s+/,'');const tail=clean.match(/\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)$/);description=tail?clean.slice(0,tail.index):clean;if(lines.length>1)description+=' Y OTROS ÍTEMS SEGÚN FACTURA';if(lines.length===1&&tail)qty=P.num(tail[2]);}}
 const payment=amount!==null&&bank?'PAGADO':'POR CONFIRMAR PAGO';
 if(invoice&&invoiceAmount===null)invoiceAmount=P.num(pick(text,/(?:TOTAL BRUTO|TOTAL)\s*(?:CLP|\$)?\s*([\d.,]+)/i));
 const hasText=text.trim().length>45,issues=[];
 if(!hasText)issues.push('Sin texto legible: completa los campos usando el respaldo');
 if(!vendor)issues.push('Proveedor sin identificar');
 if(!mobile)issues.push('Asigna móvil, STOCK o TALLER');
 if(!date)issues.push('Confirma la fecha');
 if(amount===null&&invoiceAmount===null)issues.push('Confirma el monto');
 return {date,vendor,rut,kind,doc:id,description,qty,mobile,paid:amount,factured:invoiceAmount,bank:bank?(/Ita[uú]/i.test(text)?'ITAU':/BCI|86888226/.test(text)?'BCI':''):'',payment,transaction:transferId,notes:'Respaldo: '+filename+(transferId?'. Transferencia '+transferId:'')+(invoice?'':'. Falta factura tributaria')+'.',source:filename,issues,confirmed:false,action:'append',target:null,omit:false,raw:text};
}
function inspectTemplate(book,month){
 if(!book.SheetNames.includes(month))throw Error('No existe la pestaña '+month+'. Selecciona el mes correcto o carga tu planilla que lo incluya.');
 const data=P.rows(book,month),h=data[0].map(P.norm);
 if(h[9]!=='MONTOPAGADO'||h[10]!=='MONTOFACTURA'||h[8]!=='MOVIL')throw Error('La pestaña no coincide con tu modelo de taller A:O. Usa MODELO_TALLER_actualizado_V2.');
 return data.slice(1).map((r,i)=>({row:i+2,date:P.date(r[0]),vendor:r[1],rut:r[2],kind:r[3],doc:String(r[4]??''),mobile:r[8],paid:P.num(r[9]),factured:P.num(r[10]),notes:r[14]||''})).filter(r=>r.vendor);
}
function match(c,existing,others=[]){
 const doc=String(c.doc).replace(/\W/g,''),rut=P.norm(c.rut);
 const duplicate=existing.find(r=>rut&&P.norm(r.rut)===rut&&doc&&String(r.doc).replace(/\W/g,'')===doc);
 if(duplicate&&((c.kind==='FACTURA'&&duplicate.kind==='FACTURA')||(c.kind!=='FACTURA'&&c.transaction&&duplicate.notes.includes(c.transaction))))return {type:'duplicate',row:duplicate.row,message:'Documento ya registrado en fila '+duplicate.row};
 const txn=c.transaction&&existing.find(r=>String(r.notes).includes(c.transaction));
 if(txn)return {type:'duplicate',row:txn.row,message:'Transferencia ya registrada en fila '+txn.row};
 const batch=others.find(o=>o!==c&&!o.omit&&(!c.allocation||o.allocation!==c.allocation)&&rut&&P.norm(o.rut)===rut&&((doc&&o.doc===c.doc&&o.kind===c.kind)||(c.transaction&&c.transaction===o.transaction)));
 if(batch)return {type:'batch',message:'Revisa: el documento o transferencia se repite en esta tanda'};
 if(c.kind==='FACTURA'){
  const matches=existing.filter(r=>P.norm(r.rut)===rut&&r.paid===c.factured&&r.mobile!==null&&String(r.mobile)===String(c.mobile)&&!String(r.kind).startsWith('FACTURA')&&Math.abs(Date.parse(r.date)-Date.parse(c.date))<=14*86400000);
  if(matches.length===1)return {type:'merge',row:matches[0].row,message:'Puede completar el pago de fila '+matches[0].row+'; confirma con el respaldo'};
 }
 return {type:'new',message:'Nuevo registro'};
}
function validate(c){
 const issues=[];if(!c.date)issues.push('fecha');if(!c.vendor.trim())issues.push('proveedor');if(!c.rut.trim())issues.push('RUT');if(!/^(\d{2,3}|STOCK|TALLER|\d{2,3}\s*\/\s*STOCK)$/i.test(String(c.mobile)))issues.push('móvil / stock / taller');
 if(c.paid===null&&c.factured===null)issues.push('monto');if(c.paid!==null&&(!Number.isFinite(c.paid)||c.paid<0))issues.push('monto pagado');if(c.factured!==null&&(!Number.isFinite(c.factured)||c.factured<0))issues.push('monto factura');
 if(c.kind==='FACTURA'&&!c.doc)issues.push('número factura');if(c.action==='merge'&&!c.target)issues.push('fila a completar');
 return issues;
}
function exportOriginal(bytes,book,month,candidates){
 const existing=inspectTemplate(book,month),zip=fflate.unzipSync(new Uint8Array(bytes)),sh=P.manifest(zip).find(s=>s.name===month),changes={},data=P.rows(book,month),used=new Set(),edited=[],added=[];let last=Math.max(1,...existing.map(r=>r.row));
 const allocations=new Map();for(const c of candidates.filter(c=>!c.omit&&c.allocation)){if(!allocations.has(c.allocation))allocations.set(c.allocation,[]);allocations.get(c.allocation).push(c);}for(const parts of allocations.values()){if(Math.abs(parts.reduce((n,c)=>n+(c.paid??c.factured??0),0)-parts[0].allocationTotal)>.01)throw Error('Las partes ya no suman el total del respaldo. Revisa el reparto.');}
 for(const c of candidates.filter(c=>!c.omit)){
  if(!c.confirmed)throw Error('Confirma todas las filas antes de descargar.');
  const invalid=validate(c);if(invalid.length)throw Error(c.source+': falta '+invalid.join(', '));
  const m=match(c,existing);if(m.type==='duplicate'||m.type==='batch')throw Error('Duplicado: '+c.source+'. Omite la fila.');
  const key=P.norm(c.rut)+'|'+c.kind+'|'+c.doc+'|'+c.transaction+(c.allocation?'|'+c.mobile:'');if((c.doc||c.transaction)&&used.has(key))throw Error('Documento repetido en la tanda');used.add(key);
  if(c.action==='merge'){
   const target=existing.find(r=>r.row===Number(c.target));if(!target||P.norm(target.rut)!==P.norm(c.rut)||String(target.mobile)!==String(c.mobile)||target.paid!==c.factured||target.factured!==null)throw Error('La fila a completar no coincide con proveedor, móvil, monto o ya tiene factura.');
   const n=target.row;changes['D'+n]=c.kind;changes['E'+n]=c.doc;changes['K'+n]=c.factured;changes['M'+n]={f:'IF(K'+n+'="","",K'+n+'-J'+n+')',v:c.factured-(target.paid||0)};changes['O'+n]=target.notes+' | Factura recibida: '+c.source;edited.push(n);continue;
  }
  const n=++last;const values=[P.serial(c.date),c.vendor,c.rut,c.kind,c.doc||null,c.mobile==='STOCK'?'STOCK':c.mobile==='TALLER'?'INSUMO TALLER':'GASTO TALLER',c.description,c.qty,c.mobile,c.paid,c.factured,c.bank||null,{f:'IF(K'+n+'="","",K'+n+'-J'+n+')',v:c.factured===null?'':c.factured-(c.paid||0)},c.payment,c.notes];
  values.forEach((v,i)=>changes[XLSX.utils.encode_col(i)+n]=v);added.push(n);
 }
 zip[sh.path]=P.buf(P.patch(P.text(zip[sh.path]),changes,{modelRow:Math.max(...existing.map(r=>r.row)),endColumn:'O',filter:'A1:O'+last}));
 P.recalc(zip);return {bytes:fflate.zipSync(zip,{level:6}),added,edited};
}
root.Workshop={parse,documentDate,inspectTemplate,match,validate,exportOriginal};
})(typeof window==='undefined'?globalThis:window);
