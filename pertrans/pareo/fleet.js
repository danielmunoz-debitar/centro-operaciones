(function(root){
'use strict';
const defaults=[];
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
function number(v){if(typeof v==='number')return Number.isSafeInteger(v)&&v>0?String(v):'';if(typeof v!=='string')return '';let s=v.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');s=s.replace(/^(?:MOVIL|MOBILE|M)\s*[-:#]?\s*/, '').trim();if(!/^\d+(?:[.,]0+)?$/.test(s))return '';let n=Number(s.replace(',','.'));return Number.isSafeInteger(n)&&n>0?String(n):'';}
function column(headers){const allowed=['MOVIL','N MOVIL','NRO MOVIL','NUM MOVIL','NUMERO MOVIL','NUMERO DE MOVIL','MOVIL PERTRANS','N DE MOVIL','N O MOVIL','MOVIL ASIGNADO'];return headers.findIndex(c=>allowed.includes(norm(c)));}
function list(values){if(!Array.isArray(values))throw Error('Listado de móviles inválido.');const xs=[...new Set(values.map(number).filter(Boolean))].sort((a,b)=>+a-+b);if(!xs.length)throw Error('El listado no contiene números de móvil válidos.');return xs;}
function split(rows,mobiles){const own=new Set(mobiles.length?list(mobiles):[]),included=[],excluded=[],pending=[];for(const row of rows){const mobile=number(row.mobileRaw);const r={...row,mobile};if(!mobile)pending.push(r);else if(own.has(mobile))included.push(r);else excluded.push(r);}return {included,excluded,pending,total:rows.length};}
root.Fleet={defaults,number,column,list,split};if(typeof module!=='undefined')module.exports=root.Fleet;
})(typeof window==='undefined'?globalThis:window);
