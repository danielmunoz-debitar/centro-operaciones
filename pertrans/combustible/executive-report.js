(function(root){
'use strict';
const n=(v,d=0)=>v===null||v===undefined?'s/d':Number(v).toLocaleString('es-CL',{minimumFractionDigits:d,maximumFractionDigits:d});
const money=v=>v===null?'s/d':'$'+n(v),signed=(v,d=2)=>v===null?'s/d':(v>0?'+':'')+n(v,d),pct=v=>signed(v,1)+'%';
const xml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=s=>s.slice(8,10)+'-'+s.slice(5,7)+'-'+s.slice(0,4);
function model(a){
 const valid=a.plates.filter(p=>p.valid&&Number.isFinite(p.rate)&&p.expected>0&&p.diff!==null),states={bad:0,acceptable:0,good:0,pending:a.plates.length-valid.length};
 for(const p of valid){if(p.diff< -1.5)states.bad++;else if(p.diff<0)states.acceptable++;else states.good++;}
 const sortRelative=(x,y)=>x.diff-y.diff||x.plate.localeCompare(y.plate),worst=valid.filter(p=>p.diff<0).sort(sortRelative).slice(0,5),bad=valid.filter(p=>p.diff< -1.5).sort((x,y)=>x.diff-y.diff||x.plate.localeCompare(y.plate));
 const order=['Hasta 10 pasajeros','11 a 19 pasajeros','20 a 35 pasajeros','36 o más pasajeros','Sin capacidad registrada'];
 const segments=order.map(name=>{const all=valid.filter(p=>p.segment===name).sort(sortRelative);return {name,count:all.length,below:all.filter(p=>p.diff<0).length,worst:all[0]||null,best:all.at(-1)||null};}).filter(s=>s.count);
 const topSpend=a.expense.slice(0,3).map(p=>({...p,share:a.amount>0?p.amount/a.amount*100:null}));
 const named=p=>p.plate+(p.serious.length?'*':'');
 const priority=bad.length?'Revisar los '+bad.length+' casos de Mal rendimiento: '+bad.slice(0,3).map(p=>p.plate).join(', ')+(bad.length>3?' y '+(bad.length-3)+' adicionales':'')+'.':'No hay patentes bajo el umbral de Mal rendimiento.';
 return {version:2,start:a.start,end:a.end,period:date(a.start)+' al '+date(a.end),month:new Intl.DateTimeFormat('es-CL',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(a.start+'T12:00:00Z')),amount:a.amount,liters:a.liters,price:a.effectivePrice,loads:a.loads,plates:a.plates.length,below:states.bad+states.acceptable,states,worst,bad,segments,topSpend,alertCount:a.pending.length,missingBase:a.baselineMissing.length,missingAmounts:a.missingAmounts,firstDate:a.firstDate,lastDate:a.lastDate,multipleDays:a.multiple.days.length,multiplePlates:a.multiple.ranking.length,driverChangePlates:new Set(a.transitions.map(t=>t.plate)).size,priority,named};
}
function html(m){
 const tbl=(heads,rows)=>'<table><thead><tr>'+heads.map(x=>'<th>'+xml(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(v=>'<td>'+xml(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
 const cards=[['Gasto total de combustible',money(m.amount),'CLP'],['Precio promedio',m.price===null?'s/d':'$'+n(m.price,2),'/ litro'],['Litros cargados',n(m.liters,2),'litros'],['Bajo lo esperado',m.below+' de '+m.plates,'patentes']];
 const total=m.states.good+m.states.acceptable+m.states.bad||1,bar=[[m.states.good,'#247347'],[m.states.acceptable,'#996318'],[m.states.bad,'#b53838']].map(([count,color])=>'<i style="width:'+count/total*100+'%;background:'+color+'"></i>').join('');
 return '<div class="executive-dashboard executive-editorial"><div class="editorial-header"><div><strong>PERTRANS</strong><small>CONTROL DE GESTIÓN</small></div><p>'+xml(m.month)+'<br>'+xml(m.period)+'</p></div><h2>Cierre mensual de combustible</h2><div class="executive-kpis">'+cards.map(([label,value,unit])=>'<div><small>'+xml(label)+'</small><strong>'+xml(value)+'</strong><span>'+xml(unit)+'</span></div>').join('')+'</div><section class="executive-block"><h3>Semáforo de rendimiento</h3><div class="executive-meter">'+bar+'</div><div class="editorial-legend"><b class="good">'+m.states.good+' Bien</b><b class="acceptable">'+m.states.acceptable+' Aceptable</b><b class="bad">'+m.states.bad+' Mal</b><span>'+m.states.pending+' pendientes de cálculo</span></div></section><section class="executive-block"><h3>Mayores diferencias bajo lo esperado</h3><p>Diferencia = real - esperado. Mismo criterio del Excel, en km/L.</p>'+tbl(['Patente','Móvil','Real km/L','Esperado','Dif. km/L','Estado'],m.worst.map(p=>[m.named(p),p.mobile,n(p.rate,2),n(p.expected,2),signed(p.diff),p.diff< -1.5?'Mal':'Aceptable']))+'</section><section class="executive-block"><h3>Comparación por capacidad</h3>'+tbl(['Capacidad','Bajo esperado','Menor resultado km/L','Mejor resultado km/L'],m.segments.slice(0,5).map(s=>[s.name.replace(' pasajeros',''),s.below+' / '+s.count,m.named(s.worst)+'  '+signed(s.worst.diff),m.named(s.best)+'  '+signed(s.best.diff)]))+'</section><div class="editorial-bottom"><section class="executive-block"><h3>Mayor gasto del mes</h3>'+tbl(['Patente','Gasto CLP'],m.topSpend.map(p=>[p.plate,money(p.amount)]))+'</section><aside><h3>Por abordar</h3><p>'+xml(m.priority)+'</p></aside></div><p class="executive-notes">* '+m.alertCount+' patentes con alertas de odómetro; validar las lecturas señaladas. Detalle en el Excel.<br>'+m.plates+' patentes · '+m.loads+' cargas. Precio promedio = gasto / litros. Se excluye SLJC74. '+m.missingAmounts+' cargas sin monto.</p></div>';
}
async function pdf(m){
 const {PDFDocument,StandardFonts,rgb}=root.PDFLib;if(!PDFDocument)throw Error('No se pudo cargar el generador PDF. Actualiza la aplicación.');
 const doc=await PDFDocument.create(),page=doc.addPage();page.setSize(595.28,841.89);const normal=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold);
 doc.setTitle('PERTRANS - Cierre mensual '+m.month);doc.setAuthor('PERTRANS - Control de Gestión');doc.setSubject('Desviaciones de rendimiento, gasto y precio promedio');
 const H=841.89,C={navy:'#103B5A',blue:'#147FB5',ink:'#182C3B',muted:'#5D6F7D',line:'#DDE6EC',pale:'#F2F6F9',red:'#B53838',amber:'#996318',green:'#247347'};
 const color=hex=>{const h=hex.replace('#','');return rgb(parseInt(h.slice(0,2),16)/255,parseInt(h.slice(2,4),16)/255,parseInt(h.slice(4,6),16)/255);};
 const rect=(x,t,w,h,fill,border)=>page.drawRectangle({x,y:H-t-h,width:w,height:h,color:color(fill),...(border?{borderColor:color(border),borderWidth:.5}:{})});
 function text(value,x,t,size=10,weight=false,fill=C.ink,maxWidth){let s=String(value??''),font=weight?bold:normal;if(maxWidth){while(s.length&&PertransPDFFonts.width(s,size,weight?PERTRANS_REPORT_FONTS.bold:PERTRANS_REPORT_FONTS.regular)>maxWidth)s=s.slice(0,-1);if(s!==String(value??''))s=s.slice(0,-3)+'...';}page.drawText(s,{x,y:H-t-size,size,font,color:color(fill)});}
 const line=(x,t,w)=>page.drawLine({start:{x,y:H-t},end:{x:x+w,y:H-t},thickness:.6,color:color(C.line)});
 function table(x,t,width,heads,rows,widths,rowHeight=26){rect(x,t,width,22,'#FFFFFF');let offset=x;heads.forEach((h,i)=>{text(h,offset+5,t+6,8.5,true,C.muted,widths[i]-10);offset+=widths[i];});line(x,t+22,width);rows.forEach((r,index)=>{const top=t+22+index*rowHeight;let xx=x;r.forEach((v,i)=>{const value=typeof v==='object'?v.text:v,fill=typeof v==='object'?v.color:C.ink;text(value,xx+5,top+8,9.7,i===0||i===r.length-1,fill,widths[i]-10);xx+=widths[i];});line(x,top+rowHeight,width);});return t+22+rows.length*rowHeight;}
 function wrapped(value,x,t,width,size=9.5,leading=14,weight=false){const words=String(value).split(/\s+/);let row='',top=t;for(const word of words){const next=row?row+' '+word:word;if(PertransPDFFonts.width(next,size,weight?PERTRANS_REPORT_FONTS.bold:PERTRANS_REPORT_FONTS.regular)>width&&row){text(row,x,top,size,weight);top+=leading;row=word;}else row=next;}if(row)text(row,x,top,size,weight);return top+leading;}
 const M=32,W=531;
 text('PERTRANS',M,25,17,true,C.navy);text('CONTROL DE GESTIÓN',M,49,8,true,C.blue);
 text(m.month.charAt(0).toUpperCase()+m.month.slice(1),363,28,11,true,C.ink,200);
 text(m.period,363,47,8.5,false,C.muted,200);
 text('Cierre mensual de combustible',M,71,22,true,C.navy);
 page.drawLine({start:{x:M,y:H-108},end:{x:M+W,y:H-108},thickness:1.5,color:color(C.blue)});
 const cards=[['GASTO TOTAL',money(m.amount),'CLP'],['PRECIO PROMEDIO',m.price===null?'s/d':'$'+n(m.price,2),'/ litro'],['LITROS CARGADOS',n(m.liters,2),'litros'],['BAJO LO ESPERADO',m.below+' de '+m.plates,'patentes']];
 cards.forEach(([label,value,unit],i)=>{const x=M+i*135;text(label,x,131,8,true,C.muted);let size=i===0?17:19;while(PertransPDFFonts.width(value,size,PERTRANS_REPORT_FONTS.bold)>126&&size>12)size-=.5;text(value,x,151,size,true,C.ink,126);text(unit,x,180,8.5,false,C.muted);if(i<3)page.drawLine({start:{x:x+127,y:H-128},end:{x:x+127,y:H-195},thickness:.5,color:color(C.line)});});
 text('SEMÁFORO DE RENDIMIENTO',M,218,9,true,C.navy);
 const total=m.states.good+m.states.acceptable+m.states.bad||1;let bx=M;
 for(const [count,fill]of [[m.states.good,C.green],[m.states.acceptable,C.amber],[m.states.bad,C.red]]){const width=count/total*W;if(width>0)rect(bx,240,width,10,fill);bx+=width;}
 text(m.states.good+' Bien',M,263,10,true,C.green);text(m.states.acceptable+' Aceptable',M+102,263,10,true,C.amber);text(m.states.bad+' Mal',M+251,263,10,true,C.red);text(m.states.pending+' pendientes de cálculo',M+354,263,8.5,false,C.muted,177);
 text('MAYORES DIFERENCIAS BAJO LO ESPERADO',M,302,10,true,C.navy);
 text('Diferencia = real - esperado. Mismo criterio del Excel, en km/L.',M,321,8.5,false,C.muted);
 const status=p=>p.diff< -1.5?'Mal':p.diff<0?'Aceptable':'Bien';
 table(M,343,W,['Patente','Móvil','Real km/L','Esperado','Dif. km/L','Estado'],m.worst.map(p=>[m.named(p),p.mobile,n(p.rate,2),n(p.expected,2),{text:signed(p.diff),color:p.diff< -1.5?C.red:C.amber},{text:status(p),color:p.diff< -1.5?C.red:C.amber}]),[96,57,85,92,90,111],25);
 if(!m.worst.length)text('No hay patentes bajo el rendimiento esperado.',M+5,375,10,false,C.green);
 text('COMPARACIÓN POR CAPACIDAD',M,517,10,true,C.navy);
 table(M,539,W,['Capacidad','Bajo esperado','Menor resultado km/L','Mejor resultado km/L'],m.segments.slice(0,5).map(s=>[s.name.replace(' pasajeros',''),s.below+' / '+s.count,m.named(s.worst)+'  '+signed(s.worst.diff),m.named(s.best)+'  '+signed(s.best.diff)]),[108,105,159,159],m.segments.length>4?20:24);
 text('MAYOR GASTO DEL MES',M,674,10,true,C.navy);
 table(M,695,260,['Patente','Gasto CLP'],m.topSpend.map(p=>[p.plate,money(p.amount)]),[113,147],20);
 rect(320,670,243,105,C.pale);text('POR ABORDAR',334,686,9,true,C.blue);wrapped(m.priority,334,707,213,9.5,14);
 const noteTop=801;
 line(M,noteTop-12,W);
 text('* '+m.alertCount+' patentes con alertas de odómetro; validar las lecturas señaladas. Detalle en el Excel.',M,noteTop,7.8,false,C.muted,531);
 text(m.plates+' patentes · '+m.loads+' cargas. Precio promedio = gasto / litros. SLJC74 excluida. '+m.missingAmounts+' cargas sin monto.',M,noteTop+13,7.8,false,C.muted,531);
 await doc.flush();
 PertransPDFFonts.install(doc,normal.ref,PERTRANS_REPORT_FONTS.regular);
 PertransPDFFonts.install(doc,bold.ref,PERTRANS_REPORT_FONTS.bold);
 return doc.save();
}
root.ExecutiveFuelReport={model,html,pdf,n,money};
})(typeof window==='undefined'?globalThis:window);
