// Etiqueta Bonita: percebe o PDF de etiquetas do UpSeller (aba ou download) e oferece deixar bonito.
const DEF={auto:true,any:false,direto:false};
const RE_PDF=/^https:\/\/[^/]*upseller\.(cn|com)\/.*\.pdf(\?|#|$)/i;
const vistos=new Set();
const cfg=async()=>Object.assign({},DEF,await chrome.storage.local.get(["auto","any","direto"]));
const abrir=(q)=>chrome.tabs.create({url:chrome.runtime.getURL("app.html"+(q||""))});

async function oferecer(url){
  if(vistos.has(url)) return; vistos.add(url);
  const c=await cfg(); if(!c.auto) return;
  if(c.direto){ abrir("?url="+encodeURIComponent(url)); return; }
  chrome.notifications.create("eb|"+url,{type:"basic",iconUrl:"icon128.png",title:"Etiquetas do UpSeller abertas",
    message:"Clique para gerar as etiquetas com o quadro de conferência.",buttons:[{title:"Gerar etiqueta bonita"}],requireInteraction:true,priority:2});
}
chrome.tabs.onUpdated.addListener((id,info,tab)=>{ const u=info.url||(info.status==="complete"&&tab.url); if(u&&RE_PDF.test(u)) oferecer(u); });
const clique=(nid)=>{ if(nid.startsWith("eb|")){ abrir("?url="+encodeURIComponent(nid.slice(3))); chrome.notifications.clear(nid);} };
chrome.notifications.onClicked.addListener(clique);
chrome.notifications.onButtonClicked.addListener((nid)=>clique(nid));

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
