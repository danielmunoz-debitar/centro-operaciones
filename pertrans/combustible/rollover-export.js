(function(root){
'use strict';
function exportBase(templateBytes,book,roll,alerts=[]){
 const relevant=alerts.filter(a=>roll.prepared.rows.some(r=>r.plate===a.plate&&r.date===a.current.date&&r.time===a.current.time));
 const warnings=new Map();for(const a of relevant){if(!warnings.has(a.plate))warnings.set(a.plate,new Set());a.reasons.forEach(reason=>warnings.get(a.plate).add(reason));}
 let bytes=TemplateFuel.exportOriginal(templateBytes,book,roll.prepared,roll.next,roll.next);
 if(warnings.size){
  const zip=fflate.unzipSync(new Uint8Array(bytes)),manifest=TemplateFuel.manifest(zip),sheet=manifest.find(s=>s.name==='Rendimientos'),exported=XLSX.read(bytes,{type:'array'}),summary=exported.Sheets.Rendimientos,refs=Fuel.references(exported),updates={};
  const last=XLSX.utils.decode_range(summary['!ref']).e.r+1;
  for(let row=2;row<=last;row++){const ref=refs.get(Fuel.norm(summary['A'+row]?.v)),why=warnings.get(ref?.plate);if(!why)continue;const cell=summary['I'+row],note='Validar odómetro de la última carga: '+[...why].join('; '),suffix=' | '+note;updates['I'+row]=cell?.f?{f:'('+cell.f+')&"'+suffix.replace(/"/g,'""')+'"',v:String(cell.v||'')+suffix}:String(cell?.v||'')+suffix;}
  zip[sheet.path]=fflate.strToU8(TemplateFuel.patch(fflate.strFromU8(zip[sheet.path]),updates));bytes=fflate.zipSync(zip,{level:6});
 }
 return {bytes,warnings:[...warnings.keys()]};
}
root.RolloverFuel={exportBase};
})(typeof window==='undefined'?globalThis:window);
