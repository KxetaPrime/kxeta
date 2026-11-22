const u=new URLSearchParams(location.search).get("url");
document.getElementById("g").onclick=()=>chrome.runtime.sendMessage({gerar:u});
document.getElementById("n").onclick=()=>window.close();
document.addEventListener("keydown",e=>{if(e.key==="Enter")document.getElementById("g").click(); if(e.key==="Escape")window.close();});