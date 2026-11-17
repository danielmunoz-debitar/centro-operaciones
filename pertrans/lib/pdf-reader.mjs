import * as pdfjs from './pdf.min.mjs';
pdfjs.GlobalWorkerOptions.workerSrc=new URL('./pdf.worker.min.mjs',import.meta.url).href;
export async function extractPdf(bytes){
 const doc=await pdfjs.getDocument({data:new Uint8Array(bytes).slice(),useSystemFonts:true,isEvalSupported:false}).promise;
 const pages=[];
 for(let n=1;n<=doc.numPages;n++){const page=await doc.getPage(n),tc=await page.getTextContent(),lines=[];
  for(const item of tc.items){if(!item.str?.trim())continue;const y=Math.round(item.transform[5]*2)/2;let line=lines.find(l=>Math.abs(l.y-y)<2);if(!line){line={y,items:[]};lines.push(line);}line.items.push({text:item.str.trim(),x:item.transform[4],width:item.width});}
  lines.sort((a,b)=>b.y-a.y);for(const l of lines){l.items.sort((a,b)=>a.x-b.x);l.text=l.items.map(i=>i.text).join(' ');}
  pages.push({number:n,width:page.getViewport({scale:1}).width,lines,text:lines.map(l=>l.text).join('\n')});
 }
 await doc.destroy();return {pages,text:pages.map(p=>p.text).join('\n\f\n')};
}
