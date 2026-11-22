// Etiqueta Bonita: percebe PDFs de etiqueta baixados e abre a página que deixa bonito.
const DEF={auto:true,any:false};
chrome.action.onClicked.addListener(()=>chrome.tabs.create({url:chrome.runtime.getURL("app.html")}));
chrome.downloads.onChanged.addListener(async (delta)=>{
  if(!delta.state||delta.state.current!=="complete") return;
  const cfg=Object.assign({},DEF,await chrome.storage.local.get(["auto","any"]));
  if(!cfg.auto) return;
  const [it]=await chrome.downloads.search({id:delta.id}); if(!it) return;
  const isPdf=/\.pdf$/i.test(it.filename)||it.mime==="application/pdf";
  if(!isPdf) return;
  if(/-bonita\.pdf$/i.test(it.filename)) return; // não reprocessa o próprio resultado
  const src=[it.url,it.finalUrl,it.referrer].join(" ").toLowerCase();
  if(!cfg.any && !src.includes("upseller")) return;
  chrome.tabs.create({url:chrome.runtime.getURL("app.html?dl="+it.id)});
});
