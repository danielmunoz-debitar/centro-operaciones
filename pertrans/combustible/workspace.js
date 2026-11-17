'use strict';
let workspaceRevision=0,downloadedRevision=-1,saveChain=Promise.resolve(),workspaceRestoring=false,datesTouched=false,templateIsBundled=false,workspaceActive=false;
let lastSavedFingerprint='',baselineLatest='',workspaceBootPromise;
const workspaceStamp=()=>new Date().toISOString();
function calculateWork(start,end){
 return FuelWorkflow.prepare(history,incoming,start,end,sessionFixes,summaryMap,{mode:$('loadMode').value,cutoff:$('reviewedThrough').value,integrate:$('history').checked});
}
function refreshWorkStatus(text){
 if(!templateBytes){$('reviewStatus').textContent='Carga tu planilla base para comenzar. Los archivos se guardan solo en este navegador.';$('reviewStatus').className='review-status';return;}
 const fixed=Object.keys(sessionFixes).length,dirty=downloadedRevision!==workspaceRevision;
 $('reviewStatus').textContent=(text?text+' · ':'')+fixed+' correcciones guardadas en esta revisión. '+(dirty?'Hay cambios pendientes de descargar.':'El último Excel descargado corresponde a esta revisión.');
 $('reviewStatus').className=dirty?'review-status pending':'review-status';
}
function stateSnapshot(){return {version:2,savedAt:workspaceStamp(),templateBytes:new Uint8Array(templateBytes),history:history.map(r=>({...r})),incoming:incoming.map(r=>({...r})),fileLog:[...fileLog],readErrors:[...readErrors],sessionFixes:{...sessionFixes},fixes:{...fixes},matrix:[...summaryMap.entries()],start:$('start').value,end:$('end').value,integrate:$('history').checked,mode:$('loadMode').value,cutoff:$('reviewedThrough').value,revision:workspaceRevision,downloadedRevision,templateIsBundled,templateLabel:$('templateLabel').textContent};}
function queueSave(){if(!templateBytes||workspaceRestoring||!workspaceActive)return Promise.resolve();const snapshot=stateSnapshot();saveChain=saveChain.catch(()=>{}).then(()=>FuelWorkspaceStore.save(snapshot));saveChain.then(()=>{if(snapshot.revision===workspaceRevision)refreshWorkStatus('Trabajo guardado en este navegador');}).catch(error=>{$('reviewStatus').textContent=error.message;});return saveChain;}
function clearReport(){window.currentFuelReport=null;$('reportSection').hidden=true;}
function workspaceProcessed(){
 if(workspaceRestoring)return;
 workspaceActive=true;const fingerprint=JSON.stringify([$ ('start').value,$('end').value,$('loadMode').value,$('reviewedThrough').value,sessionFixes,prepared.rows.map(r=>[Fuel.key(r),r.odo,r.liters])]);
 if(fingerprint!==lastSavedFingerprint){workspaceRevision++;lastSavedFingerprint=fingerprint;clearReport();}
 refreshWorkStatus();queueSave();
}
function hydrate(state){
 if(state.version!==2||!state.templateBytes||!Array.isArray(state.history)||!Array.isArray(state.incoming)||!Array.isArray(state.matrix))throw Error('El respaldo no tiene el formato de una revisión PERTRANS.');
 if(Object.values(state.sessionFixes||{}).some(v=>typeof v!=='number'||!Number.isFinite(v)||v<0))throw Error('El respaldo contiene correcciones inválidas.');
 const bytes=new Uint8Array(state.templateBytes),book=readBook(bytes);
 if(!book.Sheets.SHEET||!book.Sheets.Rendimientos)throw Error('El respaldo no contiene una plantilla válida.');
 workspaceRestoring=true;templateBytes=bytes;templateBook=book;history=businessRows(state.history);incoming=businessRows(state.incoming);fileLog=state.fileLog||[];readErrors=state.readErrors||[];summaryMap=new Map(state.matrix);sessionFixes=state.sessionFixes||{};fixes={...fixes,...sessionFixes};
 $('start').value=state.start;$('end').value=state.end;$('history').checked=state.integrate!==false;$('loadMode').value=state.mode||'monthly';$('reviewedThrough').value=state.cutoff||'';workspaceRevision=state.revision||0;downloadedRevision=state.downloadedRevision??-1;templateIsBundled=!!state.templateIsBundled;workspaceActive=true;
 $('templateLabel').textContent=state.templateLabel||'Formato recuperado';$('inputsLabel').textContent=incoming.length+' cargas recuperadas; no necesitas volver a subir el mensual.';
 $('files').textContent='Revisión recuperada · '+new Date(state.savedAt).toLocaleString('es-CL');showLinkAudit();if(incoming.length||history.length)process();workspaceRestoring=false;clearReport();refreshWorkStatus('Revisión recuperada');datesTouched=true;
}
function matrixFromBook(book){const refs=Fuel.references(book),rows=XLSX.utils.sheet_to_json(book.Sheets.Rendimientos,{header:1,defval:''}),m=new Map();for(const r of rows.slice(1)){if(!r[0]||Fuel.norm(r[0])==='PATENTE')continue;const ref=refs.get(Fuel.norm(r[0]));if(!ref?.sheet)continue;m.set(ref.plate,{plate:r[0],mobile:r[1],driver:String(r[2]||''),capacity:Fuel.num(r[3]),expected:Fuel.num(r[5]),saved:Fuel.num(r[4])});}return m;}
async function loadBundledTemplate(){
 $('templateLabel').textContent='Sube tu última planilla revisada o la base de inicio de mes. Se guardará solo en este navegador.';
 message('Carga tu planilla base y el archivo COPEC para comenzar.');
}
function setInputPeriod(){if(!incoming.length)return;const dates=incoming.map(r=>r.date).filter(Boolean).sort(),first=dates[0],last=dates.at(-1);if(!datesTouched||$('start').value.slice(0,7)!==first.slice(0,7)){$('start').value=FuelWorkflow.monthBounds(first).start;$('end').value=last;}
 $('inputPeriod').textContent='Reporte cargado: '+reportDate(first)+' al '+reportDate(last)+'. Selecciona el corte que necesitas.';
}
// Extend the existing upload handlers; preserve file-read wait and error handling.
for(const id of ['template','inputs']){const handler=$(id).onchange;$(id).onchange=async function(event){await workspaceBootPromise;await handler(event);if(id==='template'&&templateBook){templateIsBundled=false;summaryMap=matrixFromBook(templateBook);baselineLatest=history.map(r=>r.date).filter(Boolean).sort().at(-1)||'';$('reviewedThrough').value=baselineLatest;$('loadMode').value='continue';datesTouched=false;if(!incoming.length&&baselineLatest){$('start').value=FuelWorkflow.monthBounds(baselineLatest).start;$('end').value=baselineLatest;}}if(id==='inputs'&&!readErrors.length){setInputPeriod();workspaceActive=true;}clearReport();refreshWorkStatus('Archivo cargado');queueSave();};}
for(const id of ['start','end','history','loadMode','reviewedThrough']){const previous=$(id).onchange;$(id).onchange=()=>{if(id==='start'||id==='end')datesTouched=true;previous?.();invalidate();clearReport();workspaceRevision++;refreshWorkStatus('Período o modo modificado');queueSave();};}
const oldSaveFix=savefix;savefix=function(){oldSaveFix();clearReport();};
function saveVisibleEdits(){
 if(!prepared)return;
 const edits=[];for(const field of document.querySelectorAll('[data-odo]')){const row=prepared.rows[Number(field.dataset.odo)],n=Fuel.num(field.value);if(n!==row.odo){if(n===null||n<0)throw Error('Odómetro inválido en '+row.plate+' '+reportDate(row.date));edits.push([Fuel.fixkey(row),n]);}}
 for(const [key,n]of edits){sessionFixes[key]=n;fixes[key]=n;}if(edits.length)savefix();
}
$('saveReview').onclick=async()=>{try{saveVisibleEdits();process();if(!prepared)return;await queueSave();refreshWorkStatus('Revisión guardada y rendimientos recalculados');}catch(error){message(error.message);}};
$('export').onclick=async()=>{
 try{saveVisibleEdits();process();if(!prepared)return;const notice=$('exportMessage').textContent;const revision=workspaceRevision,version=screenVersion;$('export').disabled=true;$('exportMessage').textContent='Recalculando y generando tu Excel…';await new Promise(resolve=>setTimeout(resolve,25));if(version!==screenVersion)return;
  const bytes=TemplateFuel.exportOriginal(templateBytes,templateBook,prepared,$('start').value,$('end').value);download(bytes,'Rendimiento_consumo_combustible_'+$('end').value+'.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');downloadedRevision=revision;await queueSave();refreshWorkStatus('Excel generado');$('exportMessage').textContent='Excel generado con las correcciones guardadas. Puedes seguir revisándolo y corregir otra patente en esta pantalla; al terminar, vuelve a descargar. El Excel que ya tienes abierto no cambia automáticamente.'+(notice?' '+notice:'');
 }catch(error){$('exportMessage').textContent=error.message;}finally{if(prepared)$('export').disabled=false;}
};
$('backupWork').onclick=async()=>{try{if(!templateBytes)throw Error('Primero carga un archivo o recupera tu formato.');saveVisibleEdits();if(prepared)process();const state=stateSnapshot();delete state.templateBytes;const archive=fflate.zipSync({'revision.json':fflate.strToU8(JSON.stringify(state)),'formato.xlsx':new Uint8Array(templateBytes)},{level:6});download(archive,'Respaldo_revision_PERTRANS_'+$('end').value+'.zip','application/zip');await queueSave();}catch(error){message(error.message);}};
$('restoreWork').onchange=async event=>{try{await workspaceBootPromise;const file=event.target.files[0];if(!file)return;const zip=fflate.unzipSync(new Uint8Array(await file.arrayBuffer()));if(!zip['revision.json']||!zip['formato.xlsx'])throw Error('Selecciona el ZIP descargado con Respaldar revisión.');const state=JSON.parse(fflate.strFromU8(zip['revision.json']));state.templateBytes=zip['formato.xlsx'];hydrate(state);await queueSave();message('Revisión recuperada con archivos, fechas y correcciones.');}catch(error){workspaceRestoring=false;message(error.message);}};
$('rollover').onclick=async()=>{
 const button=$('rollover'),label=button.textContent,status=$('rolloverStatus');button.disabled=true;button.textContent='Preparando base…';status.textContent='Preparando la última carga de cada patente…';
 try{await workspaceBootPromise;await Promise.all([...pendingReads]);saveVisibleEdits();process();if(!prepared)throw Error($('message').textContent||'Procesa tu planilla antes de preparar el siguiente mes.');
  const month=FuelWorkflow.monthBounds($('end').value),records=FuelWorkflow.assemble(history,incoming,$('loadMode').value,$('reviewedThrough').value,$('history').checked),roll=FuelWorkflow.rollover(records,month.end,sessionFixes,summaryMap);
  const alerts=OdometerReview.analyze(calculateWork(month.start,month.end),summaryMap).filter(a=>a.reasons.some(s=>/vacío|retrocede|Salto aislado|120 km/.test(s)));
  await new Promise(resolve=>setTimeout(resolve,25));const output=RolloverFuel.exportBase(templateBytes,templateBook,roll,alerts);
  download(output.bytes,'Base_inicio_mes_'+roll.next.slice(0,7)+'_PERTRANS.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  const latest=roll.prepared.rows.map(r=>r.date).sort().at(-1),notice='Base descargada: '+roll.prepared.rows.length+' patentes, una última carga por patente. Última fecha disponible: '+reportDate(latest)+'.'+(output.warnings.length?' Atención: validar odómetros de '+output.warnings.join(', ')+'. Las alertas quedan en Observación; no se modificaron sus lecturas.':'');
  status.textContent=notice;$('exportMessage').textContent=notice;message(notice);status.scrollIntoView?.({behavior:'smooth',block:'center'});queueSave();
 }catch(error){const text='No se pudo preparar el mes siguiente: '+error.message;status.textContent=text;$('exportMessage').textContent=text;message(text);status.scrollIntoView?.({behavior:'smooth',block:'center'});}finally{button.disabled=false;button.textContent=label;}
};
const oldClearScreen=$('clearScreen').onclick;$('clearScreen').onclick=async()=>{await workspaceBootPromise;const archived=templateBytes&&workspaceActive?stateSnapshot():null;if(archived){try{await FuelWorkspaceStore.save(archived);}catch(error){message('No se pudo guardar el trabajo. Descarga Respaldar revisión antes de limpiar.');return;}}
 oldClearScreen();workspaceActive=false;workspaceRevision=0;downloadedRevision=-1;lastSavedFingerprint='';datesTouched=false;clearReport();$('inputPeriod').textContent='';try{await loadBundledTemplate();refreshWorkStatus('Pantalla limpia. La revisión anterior se conserva hasta que guardes otra.');}catch(error){message(error.message);}
};
$('recoverWork').onclick=async()=>{try{const state=await FuelWorkspaceStore.load();if(!state)throw Error('No hay una revisión guardada en este navegador. Puedes importar un respaldo ZIP.');hydrate(state);message('Revisión anterior recuperada.');}catch(error){workspaceRestoring=false;message(error.message);}};
const originalProcessClick=$('process').onclick;$('process').onclick=async()=>{await workspaceBootPromise;return originalProcessClick();};
$('process').disabled=true;
workspaceBootPromise=(async()=>{try{const state=await FuelWorkspaceStore.load();if(state){hydrate(state);message('Se recuperó tu revisión guardada. Puedes continuar corrigiendo y descargar el Excel actualizado.');return;}}catch(error){$('reviewStatus').textContent=error.message;}
 try{await loadBundledTemplate();refreshWorkStatus('Carga el mensual para comenzar');}catch(error){message(error.message);}
})().finally(()=>{$('process').disabled=false;});
