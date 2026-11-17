(function(root){
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const attr=(s,k)=>(s.match(new RegExp('(?:^|\\s)'+k+'="([^"]*)"'))||[])[1];
function install(zip,raw,book,length){
 const text=p=>fflate.strFromU8(zip[p]),put=(p,s)=>zip[p]=fflate.strToU8(s);let xml=text(raw.path);
 const relPath=raw.path.replace(/([^/]+)$/,'_rels/$1.rels');let rels=zip[relPath]?text(relPath):'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';
 let tablePath=null,id=null,name='ConsumosPERTRANS';
 const parts=[...xml.matchAll(/<tablePart\b[^>]*r:id="([^"]*)"[^>]*\/?\s*>/g)];
 for(const part of parts){const rel=[...rels.matchAll(/<Relationship\b([^>]*?)\/?\s*>/g)].find(m=>attr(m[1],'Id')===part[1]);if(!rel)continue;const target=attr(rel[1],'Target');const p=target.startsWith('/')?target.slice(1):'xl/'+target.replace(/^\.\.\//,'');if(zip[p]){const table=text(p);if(!/ref="A1:[HJ]\d+"/.test(table))throw Error('La tabla de SHEET debe abarcar las columnas A:J desde la fila 1.');tablePath=p;id=attr(table.match(/<table\b([^>]*)>/)[1],'id');name=attr(table.match(/<table\b([^>]*)>/)[1],'name');}}
 const last=Math.max(2,length+1);
 if(tablePath){let t=text(tablePath).replace(/ref="A1:[HJ]\d+"/g,'ref="A1:J'+last+'"');put(tablePath,t);}
 else{
  const ids=Object.keys(zip).filter(p=>/^xl\/tables\/[^/]+\.xml$/.test(p)).map(p=>Number(attr((text(p).match(/<table\b([^>]*)>/)||[])[1]||'','id'))||0);id=Math.max(0,...ids)+1;tablePath='xl/tables/pertransFuel'+id+'.xml';
  const used=[...rels.matchAll(/\bId="([^"]*)"/g)].map(m=>m[1]);let rid='rIdFuelLive';while(used.includes(rid))rid+='1';
  rels=rels.replace('</Relationships>','<Relationship Id="'+rid+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/table" Target="../tables/pertransFuel'+id+'.xml"/></Relationships>');put(relPath,rels);
  const part='<tableParts count="1"><tablePart r:id="'+rid+'"/></tableParts>';
  xml=xml.includes('<extLst')?xml.replace('<extLst',part+'<extLst'):xml.replace('</worksheet>',part+'</worksheet>');
  const heads=Array.from({length:8},(_,i)=>String(book.Sheets.SHEET[String.fromCharCode(65+i)+'1']?.v||['Patente','Fecha','Hora','Litros','Consumo ($)','Odómetro (Km)','Rendimiento (Km/Lts)','Rut Conductor'][i]));
  put(tablePath,'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><table xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" id="'+id+'" name="'+name+'" displayName="'+name+'" ref="A1:J'+last+'" totalsRowShown="0"><autoFilter ref="A1:J'+last+'"/><tableColumns count="8">'+heads.map((h,i)=>'<tableColumn id="'+(i+1)+'" name="'+esc(h)+'"/>').join('')+'</tableColumns><tableStyleInfo showFirstColumn="0" showLastColumn="0" showRowStripes="0" showColumnStripes="0"/></table>');
  const ct='[Content_Types].xml';put(ct,text(ct).replace('</Types>','<Override PartName="/'+tablePath+'" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml"/></Types>'));
 }
 let tableXml=text(tablePath);if(!/name="Odómetro original"/.test(tableXml)){tableXml=tableXml.replace(/<tableColumns count="8">/,'<tableColumns count="10">').replace('</tableColumns>','<tableColumn id="9" name="Odómetro original"/><tableColumn id="10" name="Odómetro corregido"/></tableColumns>');}tableXml=tableXml.replace(/<tableColumn\b([^>]*id="6"[^>]*)(?:\/>|>[\s\S]*?<\/tableColumn>)/,(_,attrs)=>'<tableColumn'+attrs+'><calculatedColumnFormula>IF([@[Odómetro corregido]]&lt;&gt;"",[@[Odómetro corregido]],IF([@[Odómetro original]]="","",[@[Odómetro original]]))</calculatedColumnFormula></tableColumn>');put(tablePath,tableXml);
 xml=xml.replace(/<dimension ref="([^"]*)"\/>/,'<dimension ref="A1:J'+Math.max(last,2)+'"/>');xml=xml.replace(/<autoFilter\b[^>]*(?:\/>|>[\s\S]*?<\/autoFilter>)/g,'');put(raw.path,xml);return name;
}
function formulas(table,headers,start,limit=2000){const col=i=>'SHEET!$'+String.fromCharCode(65+i)+'$2:$'+String.fromCharCode(65+i)+'$'+limit;
 const count='COUNTIF('+col(0)+',$A$1)',first='MATCH($A$1,'+col(0)+',0)',last='MATCH($A$1,'+col(0)+',0)',at=(c,i)=>'INDEX('+col(c)+','+i+')',date='DATE('+start.split('-').map(Number).join(',')+')';
 const firstOdo='_xlfn.XLOOKUP($A$1,'+col(0)+','+col(5)+',"",0,1)',lastOdo='_xlfn.XLOOKUP($A$1,'+col(0)+','+col(5)+',"",0,-1)';
 const liters='IF('+count+'<2,"",SUMIF('+col(0)+',$A$1,'+col(3)+')-'+at(3,first)+')',km='IF('+count+'<2,"",IF(COUNT('+firstOdo+','+lastOdo+')<2,"",'+lastOdo+'-'+firstOdo+'))';
 const rate='IF('+count+'=0,"",IF('+count+'=1,IF(AND(ISNUMBER('+at(1,first)+'),'+at(1,first)+'<'+date+'),IF(AND(ISNUMBER('+at(6,first)+'),'+at(6,first)+'>=1,'+at(6,first)+'<=40),'+at(6,first)+',""),""),IFERROR(IF(OR(I2<=0,NOT(ISNUMBER(J2)),J2/I2<1,J2/I2>40),"",J2/I2),"")))';
 return {filter:'_xlfn._xlws.FILTER(SHEET!A2:H'+limit+','+col(0)+'=$A$1,"no hay datos")',count,liters,km,rate,lastDate:'_xlfn.MAXIFS('+col(1)+','+col(0)+',$A$1)'};
}
root.LiveFuelSheet={install,formulas};
})(typeof window==='undefined'?globalThis:window);
