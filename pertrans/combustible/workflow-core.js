(function(root){
'use strict';
const excluded=new Set(['SLJC74']);
const business=rows=>rows.filter(r=>!excluded.has(Fuel.norm(r.plate)));
const monthBounds=date=>{const [y,m]=date.slice(0,7).split('-').map(Number);return {start:date.slice(0,7)+'-01',end:new Date(Date.UTC(y,m,0)).toISOString().slice(0,10),next:new Date(Date.UTC(y,m,1)).toISOString().slice(0,10)};};
function assemble(history,incoming,mode,cutoff,integrate=true){
 const h=integrate?business(history):[],i=business(incoming);
 if(!i.length)return h;
 if(mode==='continue'){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(cutoff||''))throw Error('Indica hasta qué fecha está revisada tu última planilla.');
  const metadata=new Map(i.map(r=>[Fuel.key(r),r]));
  return [...h.filter(r=>r.date<=cutoff).map(r=>{const source=metadata.get(Fuel.key(r));if(!source)return r;return {...r,unitPrice:r.unitPrice??source.unitPrice,station:r.station||source.station,transaction:r.transaction||source.transaction,product:r.product||source.product};}),...i.filter(r=>r.date>cutoff)];
 }
 const start=monthBounds(i.reduce((d,r)=>r.date<d?r.date:d,i[0].date)).start;
 // The monthly source owns that month. Preserve only prior history and explicit corrections.
 const corrections=new Map(h.filter(r=>r.correctionOdo!==null&&r.correctionOdo!==undefined).map(r=>[Fuel.key(r),r]));
 return [...h.filter(r=>r.date<start),...i.map(r=>{const old=corrections.get(Fuel.key(r));return old?{...r,odo:old.correctionOdo,correctionOdo:old.correctionOdo}:r;})];
}
function prepare(history,incoming,start,end,fixes,matrix,options={}){
 const records=assemble(history,incoming,options.mode||'monthly',options.cutoff,options.integrate!==false);
 return Fuel.prepare(records,[],start,end,fixes,[...matrix.keys()]);
}
function segment(capacity){if(!(capacity>0))return 'Sin capacidad registrada';if(capacity<=10)return 'Hasta 10 pasajeros';if(capacity<=19)return '11 a 19 pasajeros';if(capacity<=35)return '20 a 35 pasajeros';return '36 o más pasajeros';}
const rut=value=>{const s=Fuel.norm(value);return /^\d{7,8}[0-9K]$/.test(s)&&!/^0+$/.test(s)?s:'';};
function analyze(prepared,matrix,start,end){
 const alerts=OdometerReview.analyze(prepared,matrix),critical=new Map();
 for(const a of alerts){const serious=a.reasons.filter(s=>/vacío|retrocede|Salto aislado|120 km|misma fecha y hora/.test(s));if(serious.length){if(!critical.has(a.plate))critical.set(a.plate,new Set());serious.forEach(s=>critical.get(a.plate).add(s));}}
 const loads=prepared.rows.filter(r=>r.date>=start&&r.date<=end),sum=(rows,fn)=>rows.reduce((n,r)=>n+fn(r),0);
 const knownAmounts=loads.filter(r=>Fuel.num(r.amount)!==null),priceRows=loads.filter(r=>r.unitPrice>0&&r.liters>0);
 const liters=sum(loads,r=>r.liters||0),amount=sum(knownAmounts,r=>r.amount),pricedLiters=sum(priceRows,r=>r.liters);
 const plates=prepared.groups.filter(g=>!g.historical).map(g=>{
  const m=matrix.get(g.plate)||{},own=g.items.filter(r=>r.date>=start&&r.date<=end),volume=sum(own,r=>r.liters||0),spend=sum(own,r=>Fuel.num(r.amount)??0),valid=g.rate!==null&&Number.isFinite(g.rate)&&g.rate>=0&&g.items.length>=2;
  const serious=[...(critical.get(g.plate)||[])];
  return {plate:g.plate,mobile:m.mobile??'',driver:m.driver||'',capacity:m.capacity??null,segment:segment(m.capacity),expected:m.expected??null,rate:g.rate,diff:valid&&m.expected>0?g.rate-m.expected:null,compliance:valid&&m.expected>0?g.rate/m.expected:null,valid,rankable:valid&&m.expected>0&&!serious.length,serious,baseline:g.baseline,loads:own.length,liters:volume,amount:spend,missingAmounts:own.filter(r=>Fuel.num(r.amount)===null).length,first:own[0]?.date,last:own.at(-1)?.date};
 });
 const bySegment=new Map();for(const p of plates){if(!bySegment.has(p.segment))bySegment.set(p.segment,[]);bySegment.get(p.segment).push(p);}
 const segments=[...bySegment].map(([name,all])=>{const sorted=all.filter(p=>p.rankable).sort((a,b)=>b.diff-a.diff||a.plate.localeCompare(b.plate));return {name,count:all.length,eligible:sorted.length,best:sorted[0]||null,worst:sorted.at(-1)||null};});
 const transitions=[],driverPlates=[];
 for(const g of prepared.groups){let previous=null;const observed=new Set();for(const r of g.items){const id=rut(r.rut);if(!id)continue;if(r.date>=start&&r.date<=end){observed.add(id);if(previous&&previous.id!==id)transitions.push({plate:g.plate,date:r.date,time:r.time,previousRut:previous.raw,previousDate:previous.date,rut:r.rut,sameDay:previous.date===r.date});}previous={id,raw:r.rut,date:r.date};}if(observed.size>1)driverPlates.push({plate:g.plate,ruts:[...observed],count:observed.size});}
 const variations=[];
 for(const g of prepared.groups){if(g.historical)continue;const blocks=new Map();let skipped=0;
  for(let j=1;j<g.items.length;j++){const r=g.items[j],prev=g.items[j-1];if(r.date<start||r.date>end)continue;
   const km=r.odo!==null&&prev.odo!==null?r.odo-prev.odo:null,hours=(Date.parse(r.date+'T'+r.time+'Z')-Date.parse(prev.date+'T'+prev.time+'Z'))/3600000;
   if(km===null||km<0||!(r.liters>0)||(km>0&&hours<=0)||(hours>0&&km/hours>120)){skipped++;continue;}
   const block=Math.min(4,Math.floor((Number(r.date.slice(8))-1)/7)),a=blocks.get(block)||{index:block,label:['01–07','08–14','15–21','22–28','29–31'][block],km:0,liters:0,intervals:0};a.km+=km;a.liters+=r.liters;a.intervals++;blocks.set(block,a);
  }
  const values=[...blocks.values()].sort((a,b)=>a.index-b.index).map(b=>({...b,rate:b.km/b.liters})),first=values[0],last=values.at(-1),reason=critical.has(g.plate)?'Revisar odómetro antes de comparar':values.length<2?'Faltan al menos dos tramos con intervalos válidos':!(first.rate>0)?'El primer tramo no permite calcular una variación porcentual':'';
  variations.push({plate:g.plate,mobile:matrix.get(g.plate)?.mobile??'',blocks:values,first,last,change:reason?null:(last.rate/first.rate-1)*100,reason,skipped});
 }
 const multiple=MultipleFuelLoads.analyze(loads,start,end,matrix);
 return {start,end,loads:loads.length,liters,amount,missingAmounts:loads.length-knownAmounts.length,effectivePrice:liters>0&&knownAmounts.length===loads.length?amount/liters:null,weightedUnitPrice:pricedLiters>0?sum(priceRows,r=>r.unitPrice*r.liters)/pricedLiters:null,missingUnitPrice:loads.length-priceRows.length,plates,segments,alerts,transitions,driverPlates,variations,multiple,consumption:[...plates].sort((a,b)=>b.liters-a.liters||a.plate.localeCompare(b.plate)),loadRanking:[...plates].sort((a,b)=>b.loads-a.loads||a.plate.localeCompare(b.plate)),expense:[...plates].sort((a,b)=>b.amount-a.amount||a.plate.localeCompare(b.plate)),pending:plates.filter(p=>!p.valid||p.serious.length),baselineMissing:plates.filter(p=>!p.baseline),firstDate:loads.reduce((d,r)=>r.date<d?r.date:d,end),lastDate:loads.reduce((d,r)=>r.date>d?r.date:d,start)};
}
function rollover(records,cutoff,fixes,matrix){
 const next=monthBounds(cutoff).next;
 const atCutoff=Fuel.prepare(business(records),[],monthBounds(cutoff).start,cutoff,fixes,[...matrix.keys()]);
 const latest=atCutoff.groups.map(g=>g.items.at(-1));
 const unknown=latest.filter(r=>!matrix.has(r.plate));if(unknown.length)throw Error('Falta la patente en la matriz antes de preparar el mes siguiente: '+unknown.map(r=>r.plate).join(', '));
 const invalid=latest.filter(r=>r.odo===null||r.odo<0);
 if(invalid.length)throw Error('Corrige el último odómetro antes de preparar la base: '+invalid.map(r=>r.plate).join(', '));
 // Rebuild from the as-of snapshot; source may also contain next month's loads.
 const base=Fuel.prepare(latest,[],next,next,{},[...matrix.keys()]);
 for(const g of base.groups){const source=latest.find(r=>r.plate===g.plate);g.items[0].original=Object.prototype.hasOwnProperty.call(source,'original')?source.original:source.odo;g.items[0].originalOdo=g.items[0].original;g.items[0].corrected=!!source.corrected;}
 return {prepared:base,next,cutoff};
}
root.FuelWorkflow={business,monthBounds,assemble,prepare,segment,analyze,rollover};
})(typeof window==='undefined'?globalThis:window);
