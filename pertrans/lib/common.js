(function(root){
'use strict';
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const num=s=>{if(typeof s==='number')return s;if(s===null||s===undefined||String(s).trim()==='')return null;let t=String(s).trim().replace(/[^0-9.,-]/g,'');if(!t||t==='-')return 0;if(t.includes(','))t=t.replace(/\./g,'').replace(',','.');else if(/^[-]?\d{1,3}(\.\d{3})+$/.test(t))t=t.replace(/\./g,'');const n=Number(t);return Number.isFinite(n)?n:null;};
const date=s=>{if(!s)return '';if(typeof s==='number'){const d=XLSX.SSF.parse_date_code(s);return d?d.y+'-'+String(d.m).padStart(2,'0')+'-'+String(d.d).padStart(2,'0'):'';}if(s instanceof Date)return s.toISOString().slice(0,10);let t=String(s).trim();if(/^\d{4}-\d\d-\d\d/.test(t))return t.slice(0,10);const m=t.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/);return m?m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0'):'';};
const serial=d=>d?Math.round((Date.parse(d+'T00:00:00Z')-Date.UTC(1899,11,30))/86400000):null;
const time=s=>{if(typeof s==='number')return new Date(Math.round((s%1)*86400000)).toISOString().slice(11,19);if(s instanceof Date)return s.toISOString().slice(11,19);let m=String(s??'').match(/(\d{1,2}):(\d\d)(?::(\d\d))?/);return m?m[1].padStart(2,'0')+':'+m[2]+':'+(m[3]||'00'):'';};
const money=n=>new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:2}).format(n||0);
function download(bytes,name,type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'){const url=URL.createObjectURL(new Blob([bytes],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),20000);}
function db(){return new Promise((resolve,reject)=>{const r=indexedDB.open('pertrans-control-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('work');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function save(key,value){const d=await db();try{await new Promise((resolve,reject)=>{const tx=d.transaction('work','readwrite');tx.objectStore('work').put(value,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}finally{d.close();}}
async function load(key){const d=await db();try{return await new Promise((resolve,reject)=>{const r=d.transaction('work').objectStore('work').get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}finally{d.close();}}
function readBook(bytes){return XLSX.read(new Uint8Array(bytes),{type:'array',cellStyles:true,cellDates:false});}
function rows(book,sheet){return XLSX.utils.sheet_to_json(book.Sheets[sheet||book.SheetNames[0]],{header:1,defval:null,raw:true});}
function text(b){let s=fflate.strFromU8(b);if(s.includes('xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'))s=s.replaceAll('xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main"','xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"').replace(/(<\/?)(?:x:)/g,'$1');return s;}function buf(s){return fflate.strToU8(s);}
const attr=(s,k)=>(s.match(new RegExp('(?:^|\\s)'+k+'="([^"]*)"'))||[])[1];
function manifest(zip){const rel=new Map([...text(zip['xl/_rels/workbook.xml.rels']).matchAll(/<Relationship\b([^>]+)\/?\s*>/g)].map(m=>[attr(m[1],'Id'),attr(m[1],'Target')]));return [...text(zip['xl/workbook.xml']).matchAll(/<sheet\b([^>]+)\/?\s*>/g)].map(m=>{let t=rel.get(attr(m[1],'r:id'));return {name:attr(m[1],'name'),path:t?.startsWith('/')?t.slice(1):'xl/'+t?.replace(/^\.\//,'')};});}
function cell(ref,v,style){let a='<c r="'+ref+'"'+(style?' s="'+style+'"':'');if(v===null||v===undefined)return a+'/>';if(typeof v==='object'&&v.f!==undefined){return a+(typeof v.v==='string'?' t="str"':'')+'><f>'+esc(v.f.replace(/^=/,''))+'</f><v>'+esc(v.v??'')+'</v></c>';}return typeof v==='number'?a+'><v>'+v+'</v></c>':a+' t="inlineStr"><is><t xml:space="preserve">'+esc(v)+'</t></is></c>';}
function patch(xml,changes,options={}){
 const m=xml.match(/<sheetData\b[^>]*>([\s\S]*?)<\/sheetData>/);if(!m)throw Error('Formato de hoja no compatible');
 const rs=new Map(),styles=new Map();let model=[];
 for(const q of m[1].matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)){const n=+attr(q[1],'r');if(options.modelRow===n)model=[...(q[2]||'').matchAll(/<c\b([^>]*?)(?:\/>|>[\s\S]*?<\/c>)/g)].map(c=>[attr(c[1],'r').replace(/\d+$/,''),attr(c[1],'s')]);if(options.clearFrom&&n>=options.clearFrom)continue;rs.set(n,{attrs:q[1],cells:new Map([...(q[2]||'').matchAll(/<c\b([^>]*?)(?:\/>|>[\s\S]*?<\/c>)/g)].map(c=>[attr(c[1],'r'),c[0]]))});}
 for(const [c,s]of model)styles.set(c,s);
 for(const [ref,v]of Object.entries(changes)){const n=+ref.match(/\d+$/)[0],col=ref.replace(/\d+$/,'');if(!rs.has(n))rs.set(n,{attrs:' r="'+n+'"',cells:new Map()});const r=rs.get(n);const old=r.cells.get(ref);r.cells.set(ref,cell(ref,v,old?attr((old.match(/<c\b([^>]*)/)||[])[1]||'','s'):styles.get(col)));}
 const content=[...rs].sort((a,b)=>a[0]-b[0]).map(([n,r])=>'<row'+r.attrs+'>'+[...r.cells].sort(([a],[b])=>XLSX.utils.decode_col(a.replace(/\d+$/,''))-XLSX.utils.decode_col(b.replace(/\d+$/,''))).map(x=>x[1]).join('')+'</row>').join('');
 xml=xml.replace(m[0],'<sheetData>'+content+'</sheetData>');
 const max=Math.max(1,...rs.keys());if(options.endColumn)xml=xml.replace(/<dimension\b[^>]*\/>/,'<dimension ref="A1:'+options.endColumn+max+'"/>');
 if(options.filter){xml=xml.replace(/<autoFilter\b[^>]*(?:\/>|>[\s\S]*?<\/autoFilter>)/g,'');const tag='<autoFilter ref="'+options.filter+'"/>';const anchor=/<(?:sortState|dataConsolidate|customSheetViews|mergeCells|phoneticPr|conditionalFormatting|dataValidations|hyperlinks|printOptions|pageMargins|pageSetup|headerFooter|drawing|legacyDrawing|tableParts|extLst)\b/.exec(xml);xml=anchor?xml.slice(0,anchor.index)+tag+xml.slice(anchor.index):xml.replace('</worksheet>',tag+'</worksheet>');}
 return xml;
}
function recalc(zip){const w='xl/workbook.xml';let xml=text(zip[w]);const tag='<calcPr fullCalcOnLoad="1" forceFullCalc="1" calcMode="auto"/>';xml=/<calcPr\b/.test(xml)?xml.replace(/<calcPr\b[^>]*\/?\s*>/,tag):xml.replace('</workbook>',tag+'</workbook>');zip[w]=buf(xml);if(zip['xl/calcChain.xml']){delete zip['xl/calcChain.xml'];zip['xl/_rels/workbook.xml.rels']=buf(text(zip['xl/_rels/workbook.xml.rels']).replace(/<Relationship\b[^>]*Type="[^"]*calcChain"[^>]*\/?\s*>/g,''));zip['[Content_Types].xml']=buf(text(zip['[Content_Types].xml']).replace(/<Override\b[^>]*PartName="\/xl\/calcChain.xml"[^>]*\/?\s*>/g,''));}}
root.PT={norm,esc,num,date,time,serial,money,download,save,load,readBook,rows,text,buf,attr,manifest,patch,recalc};
})(typeof window==='undefined'?globalThis:window);
