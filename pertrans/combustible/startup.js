(function(){
'use strict';
function report(text){var box=document.getElementById('startupError');if(!box){box=document.createElement('div');box.id='startupError';box.setAttribute('role','alert');box.style.cssText='position:relative;background:#fff0ed;color:#761d15;border:2px solid #c53c2d;padding:18px;margin:18px;font:16px sans-serif;white-space:pre-wrap;';document.body.prepend(box);}box.textContent='La aplicación encontró un error. Presiona Ctrl + F5 para actualizar. Si continúa, comparte este mensaje: '+text;}
window.addEventListener('error',function(event){if(event.target&&event.target.tagName==='SCRIPT'){report('No se pudo cargar '+event.target.getAttribute('src'));}else if(event.message){report(event.message+(event.filename?' · '+event.filename.split('/').pop()+':'+event.lineno:''));}},true);
window.addEventListener('unhandledrejection',function(event){report(event.reason&&event.reason.message||String(event.reason));});
window.addEventListener('load',function(){if(!window.pertransStarted)report('La aplicación no terminó de iniciar.');});
})();
