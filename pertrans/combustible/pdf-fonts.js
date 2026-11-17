(function(root){
'use strict';
function decode(s){const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',out=[];let acc=0,bits=0;for(const char of s){const n=alphabet.indexOf(char);if(n<0)continue;acc=(acc<<6)|n;bits+=6;if(bits>=8){bits-=8;out.push((acc>>bits)&255);}}return new Uint8Array(out);}
function install(doc,ref,profile){
 const ctx=doc.context,bytes=decode(profile.data),fontFile=ctx.register(ctx.flateStream(bytes,{Length1:bytes.length}));
 const descriptor=ctx.register(ctx.obj({Type:'FontDescriptor',FontName:profile.name,Flags:32,FontBBox:profile.bbox,ItalicAngle:0,Ascent:profile.ascent,Descent:profile.descent,CapHeight:profile.capHeight,StemV:80,FontFile2:fontFile}));
 const mappings=Object.entries(profile.unicode).map(([code,unicode])=>'<'+Number(code).toString(16).padStart(2,'0')+'> <'+unicode.toString(16).padStart(4,'0')+'>');
 let cmap='/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /PertransWinAnsi def\n/CMapType 2 def\n1 begincodespacerange\n<00> <FF>\nendcodespacerange\n';
 for(let i=0;i<mappings.length;i+=80){const chunk=mappings.slice(i,i+80);cmap+=chunk.length+' beginbfchar\n'+chunk.join('\n')+'\nendbfchar\n';}cmap+='endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend';
 ctx.assign(ref,ctx.obj({Type:'Font',Subtype:'TrueType',BaseFont:profile.name,FirstChar:32,LastChar:255,Widths:profile.widths.slice(32),Encoding:'WinAnsiEncoding',FontDescriptor:descriptor,ToUnicode:ctx.register(ctx.flateStream(cmap))}));
}
function width(value,size,profile){const map=new Map(Object.entries(profile.unicode).map(([code,unicode])=>[unicode,Number(code)]));return [...String(value)].reduce((n,c)=>n+(profile.widths[map.get(c.codePointAt(0))??32]||0),0)*size/1000;}
root.PertransPDFFonts={install,width};
})(typeof window==='undefined'?globalThis:window);
