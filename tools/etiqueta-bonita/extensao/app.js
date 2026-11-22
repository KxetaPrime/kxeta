(function(){
"use strict";
if(window.pdfjsLib&&window.chrome&&chrome.runtime&&chrome.runtime.getURL){ pdfjsLib.GlobalWorkerOptions.workerSrc=chrome.runtime.getURL("pdf.worker.min.js"); }
const $=id=>document.getElementById(id);
let outBytes=null, outUrl=null;

/* ---------- regras de produto (nome curto, SKU, variação) ---------- */
const noAcc=s=>(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
function userRules(){const out=[];($("regras").value||"").split("\n").forEach(l=>{const i=l.indexOf("=");if(i>0){const a=noAcc(l.slice(0,i).trim()),b=l.slice(i+1).trim();if(a&&b) out.push([a,b.toUpperCase()]);}});return out;}
const STOP=new Set(["de","da","do","das","dos","com","para","e","em","a","o","as","os","kit","p/","c/"]);
function nomeCurto(title){
  let s=(title||"").split(/\s[|–—-]\s|\s\|\s?/)[0];           // corta no primeiro separador " | " ou " - "
  const w=s.replace(/[()]/g,"").split(/\s+/).filter(Boolean);
  const out=[]; for(const x of w){ out.push(x); if(out.filter(y=>!STOP.has(noAcc(y))).length>=5) break; }
  while(out.length&&STOP.has(noAcc(out[out.length-1]))) out.pop();
  return out.join(" ").toUpperCase();
}
function classify(title,variation,sku){
  const t=noAcc(title); let nome=nomeCurto(title);
  for(const [a,b] of userRules()){ if(t.includes(a)){ nome=b; break; } }
  return {nome, sku:sku||"", varl:(variation||"").replace(/\s*,\s*/g," · ").toUpperCase()};
}

/* ---------- leitura do texto da etiqueta ---------- */
function lines(items){
  const arr=items.filter(i=>i.str&&i.str.trim()).map(i=>({s:i.str,x:i.transform[4],y:i.transform[5],h:Math.abs(i.transform[3])||8,w:i.width||0}));
  arr.sort((a,b)=>b.y-a.y||a.x-b.x);
  const out=[];
  for(const it of arr){ const L=out.find(l=>Math.abs(l.y-it.y)<Math.max(0.9,it.h*0.12)); if(L){L.parts.push(it);} else out.push({y:it.y,h:it.h,parts:[it]}); }
  out.forEach(l=>{l.parts.sort((a,b)=>a.x-b.x); l.x0=l.parts[0].x; l.x1=Math.max(...l.parts.map(p=>p.x+p.w)); l.text=l.parts.map(p=>p.s).join(" ").replace(/\s+/g," ").trim();});
  return out.sort((a,b)=>b.y-a.y);
}
function parsePage(textItems){
  const L=lines(textItems);
  const ai=L.findIndex(l=>/SKU\s*:/i.test(l.text)&&/Total\s*Items/i.test(l.text)) ;
  const idx= ai>=0?ai:L.findIndex(l=>/Total\s*Items\s*:/i.test(l.text));
  if(idx<0) return null;
  let head=L[idx], hi=idx;
  let H=head.text;
  while(!/Deadline\s*:/i.test(H) && hi+1<L.length && hi-idx<2 && !/^\d{1,2}\.\s/.test(L[hi+1].text)){ hi++; H+=" "+L[hi].text; }
  const below=L.slice(hi+1);
  const total=(H.match(/Total\s*Items\s*:\s*(\d+)/i)||[])[1];
  const pedido=(H.match(/#\s*([A-Z0-9]+)/i)||[])[1]||"";
  const prazo=(H.match(/Deadline\s*:\s*([0-9/]+)/i)||[])[1]||"";
  const its=[]; let cur=null;
  for(const l of below){
    // separa inícios de item no meio da linha: "... 2. (Azul) / ..."
    const pieces=l.text.split(/(?=(?:^|\s)\d{1,2}\.\s+\()/).map(x=>x.trim()).filter(Boolean);
    for(let t of pieces){
      const q=t.match(/\*\s*(\d+)\b/);
      const m=t.match(/^(\d{1,2})\.\s+(.*)$/);
      if(m){ cur={txt:"",qty:null}; its.push(cur); t=m[2]; }
      if(!cur) continue;
      if(q){ if(cur.qty==null) cur.qty=parseInt(q[1],10); t=t.replace(/\*\s*\d+\b/,""); }
      cur.txt=(cur.txt+" "+t).replace(/\s+/g," ").trim();
    }
  }
  const skuTxt=((H.match(/SKU\s*:\s*([^;]*)/i)||[])[1]||"").trim();
  let skus=skuTxt.split(/\s*,\s*/).filter(x=>x&&!/^\d{1,2}$/.test(x)); // "1" = sem SKU no UpSeller
  if(skus.length!==its.length) skus=its.length===1&&skus.length===1?skus:[];
  let k=-1;
  const items=its.map(it=>{ k++;
    let v="",title=it.txt; const m=it.txt.match(/^\((.*?)\)\s*\/\s*(.*)$/);
    if(m){v=m[1].trim(); title=m[2].trim();}
    const c=classify(title,v,skus[k]);
    return {qty:it.qty||1,title,variation:v,...c};
  });
  let minY=Math.min(L[hi].y, ...below.map(l=>l.y));
  let minX=Math.min(head.x0, ...below.map(l=>l.x0));
  let maxX=Math.max(head.x1, ...below.map(l=>l.x1));
  return {top:head.y+head.h*1.05, bottom:minY-2, x0:minX, x1:maxX, total:total?parseInt(total,10):items.reduce((a,b)=>a+b.qty,0), pedido, prazo, items};
}

/* ---------- desenho ---------- */
function safe(s){ // só caracteres que a fonte padrão do PDF aceita
  return (s||"").replace(/[–—]/g,"-").replace(/[“”]/g,'"').replace(/[‘’]/g,"'").replace(/[^\x20-\x7E\xA0-\xFF]/g,"");
}
function fit(font,text,size,maxW){ text=safe(text); if(font.widthOfTextAtSize(text,size)<=maxW) return text;
  while(text.length>1 && font.widthOfTextAtSize(text+"...",size)>maxW) text=text.slice(0,-1); return text+"..."; }
const DIM={full:{head:13,warn:11,qW:34,cW:22},compact:{head:10,warn:9,qW:24,cW:16}};
function rowHeight(it,s,mode){ return mode==="compact"?17*s:(it&&it.sku?31:25)*s; }
function needH(info,s,mode){ const d=DIM[mode]; const units=info.items.reduce((a,b)=>a+b.qty,0); const multi=info.items.length>1||units>1;
  return d.head*s+(multi?d.warn*s:0)+info.items.reduce((a,it)=>a+rowHeight(it,s,mode),0)+2; }
function drawBox(page,F,box,info,opts){
  const {rgb}=PDFLib; const K=rgb(0,0,0), W=rgb(1,1,1);
  const {x,y,w,h}=box; const s=opts.scale; const mode=opts.mode; const d=DIM[mode==="overflow"?"compact":mode];
  page.drawRectangle({x,y,width:w,height:h,color:W});
  page.drawRectangle({x,y,width:w,height:h,borderColor:K,borderWidth:1.6*s});
  let top=y+h;
  const headH=d.head*s, hf=headH*0.62; top-=headH;
  page.drawRectangle({x,y:top,width:w,height:headH,color:K});
  const units=info.items.reduce((a,b)=>a+b.qty,0);
  const right=`${info.items.length} ${info.items.length===1?"produto":"produtos"} · ${units} un`;
  const rw=F.b.widthOfTextAtSize(safe(right),hf);
  page.drawText(safe(right),{x:x+w-rw-4*s,y:top+headH*0.28,size:hf,font:F.b,color:W});
  page.drawText(fit(F.b,"CONFERIR ANTES DE FECHAR",hf,w-rw-14*s),{x:x+4*s,y:top+headH*0.28,size:hf,font:F.b,color:W});
  const multi=info.items.length>1||units>1;
  if(multi||mode==="overflow"){ const wh=d.warn*s; top-=wh;
    page.drawRectangle({x,y:top,width:w,height:wh,color:W,borderColor:K,borderWidth:1.2*s});
    const base=multi?`ATENÇÃO: ${info.items.length} ${info.items.length===1?"PRODUTO":"PRODUTOS"} · ${units} UNIDADES`:"ATENÇÃO";
    const t=mode==="overflow"?`${base} - LISTA NA PRÓXIMA ETIQUETA`:base;
    page.drawSvgPath("M0,7 L4,0 L8,7 Z",{x:x+4*s,y:top+wh-1.5*s,scale:s*wh/(11*s),color:K});
    page.drawText(fit(F.b,t,wh*0.66,w-20*s),{x:x+15*s,y:top+wh*0.27,size:wh*0.66,font:F.b,color:K});
  }
  if(mode==="overflow") return;
  const qW=d.qW*s, cW=d.cW*s;
  for(const it of info.items){
    const rowH=rowHeight(it,s,mode); const ry=top-rowH; if(ry<y-0.5) break;
    page.drawLine({start:{x,y:top},end:{x:x+w,y:top},thickness:1.2*s,color:K});
    page.drawLine({start:{x:x+qW,y:ry},end:{x:x+qW,y:top},thickness:1.2*s,color:K});
    page.drawLine({start:{x:x+w-cW,y:ry},end:{x:x+w-cW,y:top},thickness:1.2*s,color:K});
    const qt=`${it.qty}x`; const qs=Math.min((mode==="compact"?12:17)*s,rowH*0.62); const qwid=F.b.widthOfTextAtSize(qt,qs);
    page.drawText(qt,{x:x+(qW-qwid)/2,y:ry+(rowH-qs*0.72)/2,size:qs,font:F.b,color:K});
    const bx=Math.min(12*s,rowH*0.5); page.drawRectangle({x:x+w-cW+(cW-bx)/2,y:ry+(rowH-bx)/2,width:bx,height:bx,borderColor:K,borderWidth:1.3*s});
    const tx=x+qW+4*s, tw=w-qW-cW-8*s;
    const pill=(txt,size,yy)=>{ const vt=fit(F.b,txt,size,tw-10*s); const vw=F.b.widthOfTextAtSize(vt,size);
      page.drawSvgPath("M0,0 L5,3.5 L0,7 Z",{x:tx,y:yy+size*0.9,scale:size/7.5,color:K});
      page.drawRectangle({x:tx+6.5*s,y:yy-size*0.22,width:vw+4*s,height:size*1.15,color:K});
      page.drawText(vt,{x:tx+8.5*s,y:yy,size,font:F.b,color:W}); };
    if(mode==="compact"){
      const v=it.varl||it.nome; pill(v,6.6*s,top-8.4*s);
      const l2=(it.varl?[it.sku,it.nome]:[it.sku]).filter(Boolean).join("  ·  ");
      page.drawText(fit(F.b,l2,5.4*s,tw),{x:tx,y:ry+2.6*s,size:5.4*s,font:F.b,color:K});
    } else {
      let ty=top-3.5*s;
      if(it.sku){ ty-=7.5*s; page.drawText(fit(F.m,it.sku,7.5*s,tw),{x:tx,y:ty,size:7.5*s,font:F.m,color:K}); ty-=2*s; }
      ty-=6.5*s; page.drawText(fit(F.b,it.nome,6.5*s,tw),{x:tx,y:ty,size:6.5*s,font:F.b,color:K});
      if(it.varl){ ty-=3.2*s+7*s; pill(it.varl,7*s,ty); }
    }
    top=ry;
  }
}
async function processar(file){
  const st=$("status"); st.className="status"; st.textContent="Lendo o PDF...";
  ["baixar","abrir"].forEach(id=>$(id).disabled=true);
  const buf=new Uint8Array(await file.arrayBuffer());
  const doc=await pdfjsLib.getDocument({data:buf.slice()}).promise;
  const srcDoc=await PDFLib.PDFDocument.load(buf);
  const out=await PDFLib.PDFDocument.create();
  const F={b:await out.embedFont(PDFLib.StandardFonts.HelveticaBold), m:await out.embedFont(PDFLib.StandardFonts.CourierBold)};
  const srcPages=srcDoc.getPages(); let feitos=0, extras=0; const resumo=[];
  const MIN_ESCALA=0.72; // a parte da Shopee nunca fica menor que 72% (códigos de barras legíveis)
  for(let i=1;i<=doc.numPages;i++){
    const pg=await doc.getPage(i); const tc=await pg.getTextContent();
    const info=parsePage(tc.items);
    const sp=srcPages[i-1]; const {width,height}=sp.getSize();
    if(!info||!info.items.length){ const [cp]=await out.copyPages(srcDoc,[i-1]); out.addPage(cp); continue; }
    const regTop=Math.min(height,info.top+1);           // o que fica acima do rodapé antigo
    const regH=height-regTop;
    const sb=Math.max(1,Math.min(1.5,width/283*1.25)); // escala do quadro grande
    const gap=4, mx=6;
    let mode="full", need=needH(info,sb,"full");
    let esc=Math.min(1,(height-need-gap-mx)/regH);
    if(esc<MIN_ESCALA){ mode="compact"; need=needH(info,sb,"compact"); esc=Math.min(1,(height-need-gap-mx)/regH); }
    let fits=esc>=MIN_ESCALA; if(!fits){ esc=MIN_ESCALA; mode="overflow"; need=Math.max(30*sb,height-regH*esc-gap-mx); }
    const page=out.addPage([width,height]);
    const emb=await out.embedPage(sp,{left:0,bottom:regTop,right:width,top:height});
    const ew=width*esc, eh=regH*esc;
    page.drawPage(emb,{x:(width-ew)/2,y:height-eh,width:ew,height:eh});
    const boxH=Math.min(need,height-eh-gap-mx+ (mode==="full"||mode==="compact"?0:0));
    drawBox(page,F,{x:mx,y:height-eh-gap-boxH,w:width-2*mx,h:boxH},info,{scale:sb,mode});
    feitos++;
    info.items.forEach(it=>resumo.push([i,info.pedido,it.qty,it.sku,it.nome,it.varl]));
    if(!fits){
      const np=out.addPage([width,height]); extras++;
      const {rgb}=PDFLib; const K=rgb(0,0,0);
      const hs=Math.max(1,Math.min(2,width/200));
      np.drawText(fit(F.b,`PEDIDO ${info.pedido}`,11*hs,width-20),{x:10,y:height-22*hs,size:11*hs,font:F.b,color:K});
      if(info.prazo) np.drawText(safe(`Enviar até ${info.prazo}`),{x:10,y:height-36*hs,size:8*hs,font:F.b,color:K});
      const s2=Math.max(1,Math.min(1.8,(width-16)/260));
      const avail=height-46*hs-10; let m2="full"; if(needH(info,s2,m2)>avail) m2="compact";
      const hh=Math.min(avail,needH(info,s2,m2));
      drawBox(np,F,{x:8,y:height-46*hs-hh,w:width-16,h:hh},info,{scale:s2,mode:m2});
    }
  }
  if(!feitos){ st.className="status bad"; st.textContent="Não encontrei a lista de produtos (linha \"SKU: ...; Total Items\") neste PDF. Ele é o PDF de etiquetas do UpSeller?"; return; }
  outBytes=await out.save(); window.etiquetaUltimoPDF=outBytes;
  if(outUrl) URL.revokeObjectURL(outUrl);
  outUrl=URL.createObjectURL(new Blob([outBytes],{type:"application/pdf"}));
  st.className="status ok"; st.textContent=`Pronto: ${feitos} etiqueta(s) ajustada(s)`+(extras?` e ${extras} etiqueta(s) extra de lista para pedidos grandes.`:".");
  ["baixar","abrir"].forEach(id=>$(id).disabled=false);
  $("resumo").innerHTML=resumo.map(r=>`<tr><td>${r[0]}</td><td>${esc(r[1])}</td><td><b>${r[2]}x</b></td><td class="sku">${esc(r[3]||"-")}</td><td>${esc(r[4])}</td><td>${esc(r[5])}</td></tr>`).join("");
  $("resumoCard").hidden=false;
  await previa(outBytes);
  await montarImpressao(outBytes);
  if(window.__autoPrint) imprimir();
}
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
async function previa(bytes){
  const d=await pdfjsLib.getDocument({data:bytes.slice()}).promise; const box=$("pages"); box.innerHTML="";
  const n=Math.min(d.numPages,8);
  for(let i=1;i<=n;i++){ const p=await d.getPage(i); const vp=p.getViewport({scale:2});
    const c=document.createElement("canvas"); c.width=vp.width; c.height=vp.height;
    await p.render({canvasContext:c.getContext("2d"),viewport:vp}).promise;
    const f=document.createElement("figure"); const cap=document.createElement("figcaption"); cap.textContent=`Página ${i}`;
    f.append(c,cap); box.append(f); }
  $("previewInfo").textContent=d.numPages>n?`mostrando ${n} de ${d.numPages} páginas`:`${d.numPages} página(s)`;
  $("previewCard").hidden=false;
}

/* ---------- interface ---------- */
const drop=$("drop"), inp=$("file");
drop.addEventListener("click",()=>inp.click());
drop.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();inp.click();}});
["dragenter","dragover"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add("over");}));
["dragleave","drop"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove("over");}));
drop.addEventListener("drop",e=>{const f=e.dataTransfer.files[0]; if(f) run(f);});
inp.addEventListener("change",()=>{const f=inp.files[0]; if(f) run(f);});
let lastName="etiquetas";
function run(f){ lastName=f.name.replace(/\.pdf$/i,""); processar(f).catch(err=>{console.error(err);$("status").className="status bad";$("status").textContent="Não consegui ler este PDF: "+err.message;}); }
$("baixar").addEventListener("click",()=>{ if(!outUrl) return; const a=document.createElement("a"); a.href=outUrl; a.download=lastName+"-bonita.pdf"; document.body.append(a); a.click(); a.remove(); });
$("abrir").addEventListener("click",()=>imprimir());

async function montarImpressao(bytes){
  const d=await pdfjsLib.getDocument({data:bytes.slice()}).promise; const area=$("printArea"); area.innerHTML="";
  for(let i=1;i<=d.numPages;i++){ const p=await d.getPage(i); const vp0=p.getViewport({scale:1});
    const sc=Math.min(4,(203/72)*1.5); const vp=p.getViewport({scale:sc});
    const c=document.createElement("canvas"); c.width=vp.width; c.height=vp.height; const x=c.getContext("2d");
    x.fillStyle="#fff"; x.fillRect(0,0,c.width,c.height); await p.render({canvasContext:x,viewport:vp}).promise;
    const img=new Image(); img.src=c.toDataURL("image/png"); img.alt=""; area.append(img); }
  await Promise.all([...area.querySelectorAll("img")].map(im=>im.decode().catch(()=>{})));
}
function imprimir(){ if($("printArea").children.length) window.print(); }

/* ---------- extensão: configurações e PDF baixado ---------- */
const hasExt=!!(window.chrome&&chrome.storage&&chrome.storage.local);
const DEF={auto:true,autoPrint:true,any:false,direto:false};
async function getCfg(){ if(!hasExt) return DEF; return Object.assign({},DEF,await chrome.storage.local.get(["auto","autoPrint","any","direto"])); }
(async()=>{
  const c=await getCfg();
  $("cfgAuto").checked=c.auto; $("cfgPrint").checked=c.autoPrint; $("cfgAny").checked=c.any; $("cfgDireto").checked=c.direto;
  [["cfgAuto","auto"],["cfgPrint","autoPrint"],["cfgAny","any"],["cfgDireto","direto"]].forEach(([id,k])=>$(id).addEventListener("change",()=>{ if(hasExt) chrome.storage.local.set({[k]:$(id).checked}); }));
  if(hasExt&&chrome.extension&&chrome.extension.isAllowedFileSchemeAccess){
    chrome.extension.isAllowedFileSchemeAccess(ok=>{ $("cfgFile").textContent= ok?"Acesso aos arquivos baixados: liberado.":"Para o modo automático funcionar, libere \"Permitir acesso a URLs de arquivo\" em chrome://extensions > Etiqueta Bonita > Detalhes."; });
  }
  const qurl=new URLSearchParams(location.search).get("url");
  if(qurl){
    try{ $("status").textContent="Baixando as etiquetas do UpSeller...";
      const r=await fetch(qurl,{credentials:"include"}); if(!r.ok) throw new Error("HTTP "+r.status);
      const blob=await r.blob(); const name=decodeURIComponent(qurl.split("?")[0].split("/").pop()||"etiquetas.pdf");
      window.__autoPrint=c.autoPrint; lastName=name.replace(/\.pdf$/i,"");
      await processar(new File([blob],name,{type:"application/pdf"}));
    }catch(err){ $("status").className="status bad"; $("status").textContent="Não consegui buscar o PDF do UpSeller ("+err.message+"). Baixe o PDF e arraste aqui."; }
    return;
  }
  const dl=new URLSearchParams(location.search).get("dl");
  if(dl&&hasExt&&chrome.downloads){
    const [it]=await chrome.downloads.search({id:parseInt(dl,10)});
    if(!it){ $("status").textContent="Não achei o download."; return; }
    const path=it.filename.replace(/\\/g,"/"); const url="file://"+(path.startsWith("/")?"":"/")+encodeURI(path).replace(/#/g,"%23");
    try{
      const r=await fetch(url); if(!r.ok) throw new Error("HTTP "+r.status);
      const blob=await r.blob(); const name=path.split("/").pop();
      window.__autoPrint=c.autoPrint;
      lastName=name.replace(/\.pdf$/i,""); await processar(new File([blob],name,{type:"application/pdf"}));
    }catch(err){ $("status").className="status bad"; $("status").textContent="Não consegui abrir o PDF baixado. Libere \"Permitir acesso a URLs de arquivo\" em chrome://extensions > Etiqueta Bonita > Detalhes. ("+err.message+")"; }
  }
})();
try{ $("regras").value=localStorage.getItem("etqRegras")||""; }catch(e){}
$("regras").addEventListener("input",()=>{ try{ localStorage.setItem("etqRegras",$("regras").value); }catch(e){} });
})();
