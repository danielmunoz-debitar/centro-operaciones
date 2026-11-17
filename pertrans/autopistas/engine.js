(function(root){
'use strict';
const P=root.PT,groups=['Autopista Central','Interurbanas Autopase','RutaPass 78 y 68','Ruta del Maipo','Vespucio Norte','Vespucio Sur','Costanera Norte'],plateRE=/^(?:[A-Z]{4}\d{2}|[A-Z]{2}\d{4})$/;
function groupFor(code){const s=P.norm(code);return /^(VS|VESPUCIOSUR)$/.test(s)?groups[5]:/^(CN|AMB|COSTANERANORTE)$/.test(s)?groups[6]:/VN|VESP UCI ONORTE/.test(s)?groups[4]:'';}
function invoice(t,name=''){return (t.match(/FACTURA(?:\s+(?:NO AFECTA O|EXENTA|ELECTR[OÓ]NICA|DE PEAJE|N[º°]|N°))*\s*[-:]?\s*(\d{5,})/i)||t.match(/N[º°]\s*(\d{5,})/)||name.match(/(?:_F|FA_|FE)(\d{5,})/i)||[])[1]||'';}
function period(t){const m=t.match(/(\d\d[-\/]\d\d[-\/]20\d\d)\s*(?:al|a|hasta)\s*(\d\d[-\/]\d\d[-\/]20\d\d)/i);if(m)return m[1]+' al '+m[2];const until=t.match(/Hasta\s+(\d{1,2}\s+de\s+\w+\s+20\d\d)/i);return until?'Hasta '+until[1]+'; inicio no informado':'';}
function parsePdf(pdf,name){
 const text=pdf.text,ref=(pdf.text.match(/N[º°]\s*(\d{1,3}(?:\.\d{3})+)/)?.[1]?.replace(/\./g,'')||invoice(text,name)),declared=period(text),rows=[],warnings=[];let group='';
 const add=(plate,amount,g,extra={})=>{if(amount!==null&&plateRE.test(P.norm(plate)))rows.push({plate:P.norm(plate),amount,group:g,code:g,invoice:ref,date:'',time:'',portico:'',source:name,level:'aggregate',...extra});};
 const transit=/\b([A-Z]{4}\d{2}|[A-Z]{2}\d{4})\s+(VS|CN|AMB)\s+(.+?)\s+(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2}(?::\d{2})?)\s+(\S+)\s*\$\s*([\d.]+,\d{2})/g;
 for(const page of pdf.pages)for(const line of page.lines){for(const m of line.text.matchAll(transit))add(m[1],P.num(m[7]),groupFor(m[2]),{code:m[2],date:P.date(m[4]),time:P.time(m[5]),portico:m[3],level:'transit'});}
 if(rows.length)return {name,rows,invoice:ref,group:[...new Set(rows.map(r=>r.group))].join(', '),period:declared,warnings,enabled:true,confirmed:false};
 if(/Sociedad Concesionaria Autopista Central/i.test(text)){
  group=groups[0];
  for(const page of pdf.pages.slice(1))for(const line of page.lines){const pi=line.items.findIndex(i=>plateRE.test(P.norm(i.text)));if(pi<0)continue;const plate=P.norm(line.items[pi].text);
   for(const [lo,hi,g]of [[.12,.205,groups[0]],[.33,.43,groups[1]]]){const items=line.items.filter(i=>(i.x+i.width/2)/page.width>=lo&&(i.x+i.width/2)/page.width<=hi&&/^[\d.,]+$/.test(i.text));if(items.length===1){const n=P.num(items[0].text);if(n>0)add(plate,n,g);}}
  }
 }else if(/Operadora de Sistemas Electr[oó]nicos|77[.]?630[.]?439-5|RutaPass/i.test(text)){
  group=groups[2];
  for(const page of pdf.pages)for(const line of page.lines){const m=line.text.match(/\b([A-Z]{4}\d{2}|[A-Z]{2}\d{4})\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)(?:\s+([\d.,]+))?\s*$/);if(m)add(m[1],P.num(m[5]||m[4]),group);}
 }else if(/RUTA DEL MAIPO|RUTA\s+DEL\s+MAIPO|96[.]?875[.]?230-8/i.test(text)){
  group=groups[3];for(const page of pdf.pages)for(const line of page.lines){const m=line.text.match(/^\s*([A-Z]{4}\d{2}|[A-Z]{2}\d{4})\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)/);if(m)add(m[1],P.num(m[4]),group);}
 }
 const cents=new Set();const unique=rows.filter(r=>{const k=r.plate+'|'+r.group+'|'+r.amount;if(cents.has(k))return false;cents.add(k);return true;});
 if(unique.length)warnings.push('Importes agregados por patente. Confirma que el período de la factura corresponde al mes seleccionado.');
 else warnings.push('No se encontró un detalle por patente compatible. Carga el Excel/CSV de detalle; no se usará el total de la factura como consumo.');
 if(!ref)warnings.push('Confirma el número de factura / referencia.');
 return {name,rows:unique,invoice:ref,group,period:declared,warnings,enabled:!!unique.length,confirmed:false};
}
function parseRows(data,name){
 const header=data.findIndex(r=>r.map(P.norm).includes('PATENTE')&&(r.map(P.norm).includes('IMPORTE')||r.map(P.norm).includes('MONTO')||r.map(P.norm).includes('IMPORTECLP')));
 if(header<0)return {name,rows:[],invoice:'',group:'',period:'',warnings:['No se identificaron columnas Patente e Importe/Monto. Usa el detalle de tránsitos original.'],enabled:false,confirmed:false};
 const h=data[header].map(P.norm),idx=names=>h.findIndex(v=>names.includes(v)),ip=idx(['PATENTE']),ia=idx(['IMPORTE','MONTO','IMPORTECLP']),id=idx(['FECHAHORA','FECHADETRANSITO','FECHATRANSITO']),it=idx(['HORADETRANSITO','HORA']),ig=idx(['CONCESIONARIA','AUTOPISTA','AUTOPISTACODIGO']),ir=idx(['FACTURA','FACTURAREF']),ipo=idx(['PORTICO']);const rows=[];
 for(const r of data.slice(header+1)){const p=P.norm(r[ip]),amount=P.num(r[ia]);if(!plateRE.test(p)||amount===null)continue;const d=P.date(r[id]),t=P.time(r[it]??r[id]),code=String(r[ig]??'').trim(),ref=String(r[ir]??'').replace(/^FACTURA\s+EXENTA\s*-\s*/i,'').trim();rows.push({plate:p,amount,date:d,time:t,portico:String(r[ipo]??''),invoice:ref||invoice('',name),code,group:groupFor(code),source:name,level:d?'transit':'aggregate',needsGroup:!!code&&!groupFor(code),missingTime:!!d&&!t});}
 const names=[...new Set(rows.map(r=>r.group).filter(Boolean))],refs=[...new Set(rows.map(r=>r.invoice).filter(Boolean))];
 return {name,rows,invoice:refs.length===1?refs[0]:'',group:names.length===1?names[0]:'',period:'',warnings:rows.length?[(rows.some(r=>r.needsGroup)?'Hay códigos de concesionaria no clasificados: excluidos hasta asignar grupo.':''),(rows.some(r=>r.missingTime)?'Hay tránsitos sin hora: excluidos hasta revisar y autorizar.':'')].filter(Boolean):['Sin tránsitos reconocibles'],enabled:!!rows.length,confirmed:false};
}
function prepare(sources,month){
 if(!/^20\d\d-\d\d$/.test(month))throw Error('Selecciona el mes de análisis.');
 const rows=[],issues=[],excluded=[],seen=new Set(),invoiceOwners=new Map(),enabled=sources.filter(s=>s.enabled);
 for(const s of enabled){
  if(!s.confirmed)issues.push('Confirma '+s.name);
  if(!s.invoice&&!s.rows.every(r=>r.invoice))issues.push('Falta factura/referencia: '+s.name);
  if(!s.group&&!s.rows.every(r=>r.group))issues.push('Falta grupo de autopista: '+s.name);
  const wrongPeriod=!s.rows.some(r=>r.date)&&s.period&&/20\d\d/.test(s.period)&&((s.period.match(/\d\d[-\/]\d\d[-\/]20\d\d/g)||[]).at(-1));if(wrongPeriod&&P.date(wrongPeriod).slice(0,7)!==month){excluded.push(...s.rows.map(r=>({...r,reason:'Período de factura fuera del mes'})));continue;}
 const keys=new Set(s.rows.map(r=>(s.overrideGroup?s.group:r.group||s.group)+'|'+(s.overrideInvoice?s.invoice:r.invoice||s.invoice)));
  for(const k of keys){if(invoiceOwners.has(k))issues.push('Misma factura/autopista en '+s.name+' y '+invoiceOwners.get(k)+'. Incluye un solo detalle.');else invoiceOwners.set(k,s.name);}
  for(const original of s.rows){const r={...original,group:s.overrideGroup?s.group:original.group||s.group,invoice:s.overrideInvoice?s.invoice:original.invoice||s.invoice};if((r.needsGroup&&!s.overrideGroup)||(r.missingTime&&!s.includeMissingTime)){excluded.push({...r,reason:r.needsGroup?'Concesionaria sin clasificar':'Tránsito sin hora: revisar respaldo'});continue;}if(r.date&&r.date.slice(0,7)!==month){excluded.push(r);continue;}const key=[r.group,r.invoice,r.plate,r.date,r.time,r.portico,r.amount].join('|');if(r.level==='transit'&&seen.has(key)){excluded.push({...r,duplicate:true});continue;}if(r.level==='transit')seen.add(key);rows.push(r);}
 }
 const summary=new Map(),byGroup=new Map(groups.map(g=>[g,0]));for(const r of rows){if(!groups.includes(r.group)){issues.push('Grupo no compatible en '+r.source);continue;}if(!summary.has(r.plate))summary.set(r.plate,new Map(groups.map(g=>[g,0])));summary.get(r.plate).set(r.group,summary.get(r.plate).get(r.group)+r.amount);byGroup.set(r.group,byGroup.get(r.group)+r.amount);}
 return {rows,summary,byGroup,total:rows.reduce((n,r)=>n+r.amount,0),excluded,issues:[...new Set(issues)]};
}
function exportOriginal(bytes,book,result,month){
 if(result.issues.length)throw Error(result.issues.join('\n'));if(!result.rows.length)throw Error('No hay importes identificados en este mes.');
 const expected=['Dashboard','Resumen',...groups];if(!expected.every(n=>book.SheetNames.includes(n)))throw Error('Usa el informe PERTRANS de autopistas con Dashboard, Resumen y las siete autopistas.');
 const zip=fflate.unzipSync(new Uint8Array(bytes)),sheets=P.manifest(zip),loc=n=>sheets.find(s=>s.name===n),label=new Date(month+'-15T12:00:00Z').toLocaleDateString('es-CL',{month:'long',year:'numeric'}),bounds={};
 for(const group of groups){const sh=loc(group),detail=result.rows.filter(r=>r.group===group),changes={B2:group,A4:'Período analizado',B4:label,A5:'Criterio',B5:'Solo importes respaldados por patente. Sin saldos anteriores ni distribución de diferencias.',A6:'Fuentes',B6:[...new Set(detail.map(r=>r.source))].join(' · '),A7:'Facturas / referencias',B7:[...new Set(detail.map(r=>r.invoice))].join(' · '),A8:null,B8:null};detail.forEach((r,i)=>{const n=11+i;[r.plate,P.serial(r.date),r.time||null,r.portico||null,r.amount,r.invoice,r.code||group,r.source].forEach((v,j)=>changes[XLSX.utils.encode_col(j)+n]=v);});bounds[group]=10+Math.max(1,detail.length);zip[sh.path]=P.buf(P.patch(P.text(zip[sh.path]),changes,{clearFrom:11,modelRow:11,endColumn:'H',filter:'A10:H'+bounds[group]}));}
 const plates=[...result.summary.keys()].sort(),sum=loc('Resumen'),changes={A2:'PERTRANS · Gasto identificado en autopistas · '+label};
 plates.forEach((p,i)=>{const n=i+4;changes['A'+n]=p;groups.forEach((g,j)=>changes[XLSX.utils.encode_col(j+1)+n]={f:"SUMIFS('"+g+"'!$E$11:$E$"+bounds[g]+",'"+g+"'!$A$11:$A$"+bounds[g]+",$A"+n+")",v:result.summary.get(p).get(g)});const total=[...result.summary.get(p).values()].reduce((n,a)=>n+a,0);changes['I'+n]={f:'SUM(B'+n+':H'+n+')',v:total};changes['K'+n]={f:'COUNTIFS($I$4:$I$'+(plates.length+3)+',">"&I'+n+')+COUNTIFS($I$4:I'+n+',I'+n+')',v:1+[...result.summary.values()].filter(m=>[...m.values()].reduce((a,b)=>a+b,0)>total).length+plates.slice(0,i).filter(p=>[...result.summary.get(p).values()].reduce((a,b)=>a+b,0)===total).length};});
 const totalRow=plates.length+5;changes['A'+totalRow]='TOTAL IDENTIFICADO';for(let j=1;j<=8;j++)changes[XLSX.utils.encode_col(j)+totalRow]={f:'SUM('+XLSX.utils.encode_col(j)+'4:'+XLSX.utils.encode_col(j)+(plates.length+3)+')',v:j===8?result.total:result.byGroup.get(groups[j-1])};
 zip[sum.path]=P.buf(P.patch(P.text(zip[sum.path]),changes,{clearFrom:4,modelRow:4,endColumn:'K',filter:'A3:I'+(plates.length+3)}));
 const dash=loc('Dashboard'),d={B3:label+' · Consumo identificado · CLP',B5:{f:"'Resumen'!I"+totalRow,v:result.total},F5:plates.length,J5:[...result.byGroup].filter(x=>x[1]>0).length,E8:'TODAS',K8:{f:'SUM(D13:D19)',v:result.total},B44:'Solo importes identificados por patente. No incluye saldos anteriores, intereses ni diferencias sin desglose.',B46:'Cada autopista contiene solo el detalle. Resumen y Dashboard consolidan sus importes.'};
 groups.forEach((g,i)=>{const n=13+i;d['B'+n]=g;d['D'+n]={f:'IF($E$8="TODAS",SUM(\'Resumen\'!'+XLSX.utils.encode_col(i+1)+'4:'+XLSX.utils.encode_col(i+1)+(plates.length+3)+'),SUMIFS(\'Resumen\'!'+XLSX.utils.encode_col(i+1)+'4:'+XLSX.utils.encode_col(i+1)+(plates.length+3)+',\'Resumen\'!A4:A'+(plates.length+3)+',$E$8))',v:result.byGroup.get(g)};});
 const ranked=[...result.summary].map(([p,m])=>[p,[...m.values()].reduce((a,b)=>a+b,0)]).sort((a,b)=>b[1]-a[1]);const oldRange=XLSX.utils.decode_range(book.Sheets.Dashboard['!ref']);for(let n=5;n<=Math.max(oldRange.e.r+1,plates.length+5);n++)d['X'+n]=null;
 d.X4='TODAS';plates.forEach((p,i)=>d['X'+(i+5)]=p);
 for(let i=0;i<10;i++){d['B'+(27+i)]={f:'IFERROR(INDEX(\'Resumen\'!$A$4:$A$'+(plates.length+3)+',MATCH('+ (i+1)+',\'Resumen\'!$K$4:$K$'+(plates.length+3)+',0)),"")',v:ranked[i]?.[0]||''};d['D'+(27+i)]={f:'IFERROR(LARGE(\'Resumen\'!$I$4:$I$'+(plates.length+3)+','+(i+1)+'),"")',v:ranked[i]?.[1]??''};}
 let xml=P.patch(P.text(zip[dash.path]),d,{modelRow:13});xml=xml.replace(/<formula1>[^<]*\$X\$4[^<]*<\/formula1>/g,'<formula1>\'Dashboard\'!$X$4:$X$'+(plates.length+4)+'</formula1>');zip[dash.path]=P.buf(xml);
 for(const path of Object.keys(zip).filter(n=>/^xl\/charts\/chart[^/]+\.xml$/.test(n))){let c=P.text(zip[path]);c=c.replace(/<c:(?:numCache|strCache)>[\s\S]*?<\/c:(?:numCache|strCache)>/g,'');zip[path]=P.buf(c);}
 P.recalc(zip);return fflate.zipSync(zip,{level:6});
}
root.Tolls={groups,groupFor,parsePdf,parseRows,prepare,exportOriginal,invoice,period};
})(typeof window==='undefined'?globalThis:window);
