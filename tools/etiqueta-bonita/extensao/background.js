// Etiqueta Bonita: percebe o PDF de etiquetas do UpSeller (aba ou download) e oferece deixar bonito.
const DEF={auto:true,any:false,direto:false};
const RE_PDF=/^https:\/\/[^/]*upseller\.(cn|com)\/.*\.pdf(\?|#|$)/i;
const vistos=new Set();
const cfg=async()=>Object.assign({},DEF,await chrome.storage.local.get(["auto","any","direto"]));
const abrir=(q)=>chrome.tabs.create({url:chrome.runtime.getURL("app.html"+(q||""))});

async function oferecer(url,tabId){
  if(vistos.has(url)) return; vistos.add(url);
  const c=await cfg(); if(!c.auto) return;
  if(tabId!=null){ chrome.action.setBadgeText({tabId,text:"!"}); chrome.action.setBadgeBackgroundColor({tabId,color:"#f5c400"}); }
  if(c.direto){ abrir("?url="+encodeURIComponent(url)); return; }
  // janelinha no canto superior direito da janela do Chrome
  let left, top=80; const W=360, H=210;
  try{ const win=await chrome.windows.getLastFocused(); left=Math.max(0,(win.left||0)+(win.width||1200)-W-24); top=(win.top||0)+80; }catch(e){}
  const base={url:chrome.runtime.getURL("aviso.html?url="+encodeURIComponent(url)),type:"popup",width:W,height:H,focused:true};
  try{ await chrome.windows.create(Object.assign({},base,left!=null?{left:Math.round(left),top:Math.round(top)}:{})); }
  catch(e){ await chrome.windows.create(base); } // se a posição falhar, abre no lugar padrão
}
chrome.tabs.onUpdated.addListener((id,info,tab)=>{ const u=info.url||(info.status==="complete"&&tab.url); if(u&&RE_PDF.test(u)) oferecer(u,id); });
chrome.runtime.onMessage.addListener((msg,sender)=>{ if(msg&&msg.gerar){ abrir("?url="+encodeURIComponent(msg.gerar)); if(sender.tab) chrome.windows.remove(sender.tab.windowId); } });

chrome.action.onClicked.addListener(async(tab)=>{
  if(tab&&tab.url&&RE_PDF.test(tab.url)) abrir("?url="+encodeURIComponent(tab.url)); else abrir("");
});

chrome.downloads.onChanged.addListener(async (delta)=>{
  if(!delta.state||delta.state.current!=="complete") return;
  const c=await cfg(); if(!c.auto) return;
  const [it]=await chrome.downloads.search({id:delta.id}); if(!it) return;
  if(!(/\.pdf$/i.test(it.filename)||it.mime==="application/pdf")||/-bonita\.pdf$/i.test(it.filename)) return;
  const src=[it.url,it.finalUrl,it.referrer].join(" ").toLowerCase();
  if(!c.any && !src.includes("upseller")) return;
  if(RE_PDF.test(it.finalUrl||it.url)&&vistos.has(it.finalUrl||it.url)) return;
  abrir("?dl="+it.id);
});
