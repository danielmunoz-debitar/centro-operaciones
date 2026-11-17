(function(root){
'use strict';
let dbPromise;
function db(){if(!root.indexedDB)return Promise.reject(Error('Este navegador no permite guardar el trabajo local. Descarga el respaldo de revisión.'));if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{const r=root.indexedDB.open('pertrans-combustible-revision',1);r.onupgradeneeded=()=>r.result.createObjectStore('work');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||Error('No se pudo abrir el guardado local.'));});return dbPromise;}
async function operation(mode,action){const database=await db();return new Promise((resolve,reject)=>{const t=database.transaction('work',mode),s=t.objectStore('work');let value;const r=action(s);r.onsuccess=()=>value=r.result;t.oncomplete=()=>resolve(value);t.onerror=()=>reject(t.error||Error('No se pudo guardar la revisión.'));t.onabort=()=>reject(t.error||Error('Guardado interrumpido.'));});}
root.FuelWorkspaceStore={load:()=>operation('readonly',s=>s.get('current')),save:state=>operation('readwrite',s=>s.put(state,'current')),clear:()=>operation('readwrite',s=>s.delete('current'))};
})(typeof window==='undefined'?globalThis:window);
