'use strict';
/* Nova Prime 3D — hero (seletor de cor + vaso impresso em camadas) e seção de filamentos.
   Depende de app.js: ffVariants, filaments, activeFilKind, selectedFilColor, renderColorSelector, openOverlay, $ */
(function(){
  const KINDS={PLA:{id:'fil_pla',label:'PLA Basic',blurb:'Fácil de imprimir, ótimo acabamento e muitas cores. A escolha certa para decoração, protótipos e peças do dia a dia.'},
                PETG:{id:'fil_petg',label:'PETG Basic',blurb:'Mais resistente a impacto e à umidade que o PLA. Indicado para peças funcionais e que ficam expostas.'}};
  const variantsOf=k=>ffVariants.filter(v=>v.kind===k);
  let heroKind='PLA',heroColor='Azul';
  const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
  const lum=h=>{const[r,g,b]=rgb(h).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*r+.7152*g+.0722*b};
  function hsl(h){let[r,g,b]=rgb(h).map(v=>v/255);const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;let H=0,S=0;if(mx!==mn){const d=mx-mn;S=l>.5?d/(2-mx-mn):d/(mx+mn);H=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;H*=60}return[H,S*100,l*100]}
  const onColor=h=>lum(h)>.42?'#0E1530':'#fff';

  function openFilament(kind,color){
    activeFilKind=kind;selectedFilColor=color;
    $('filColorsTitle').textContent=`Flashforge ${kind} Basic`;$('filQty').value='1';
    renderColorSelector();openOverlay('filamentModal');
  }

  /* vaso: cada camada é um retângulo; a largura segue o perfil */
  const PROFILE=[[0,44],[.1,62],[.36,100],[.62,80],[.84,40],[.93,42],[1,62]];
  const radius=t=>{for(let i=1;i<PROFILE.length;i++){const[a,ra]=PROFILE[i-1],[b,rb]=PROFILE[i];if(t<=b){const u=(t-a)/(b-a),e=u*u*(3-2*u);return ra+(rb-ra)*e}}return PROFILE[PROFILE.length-1][1]};
  function buildVase(){
    const svg=$('vase'),NS='http://www.w3.org/2000/svg',N=62,H=7,CX=180,BASE=478;
    let out=`<defs><linearGradient id="vshade" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".42"/><stop offset=".3" stop-color="#fff" stop-opacity=".26"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".46"/></linearGradient></defs><ellipse cx="${CX}" cy="${BASE+4}" rx="120" ry="10" fill="rgba(26,32,48,.16)"/>`;
    for(let i=0;i<N;i++){
      const r=radius(i/(N-1)),y=BASE-(i+1)*H,d=(60+i*34).toFixed(0);
      out+=`<rect class="layer" x="${(CX-r).toFixed(1)}" y="${y}" width="${(r*2).toFixed(1)}" height="${H-.8}" rx="2.6" style="animation-delay:${d}ms"/><rect class="shade" x="${(CX-r).toFixed(1)}" y="${y}" width="${(r*2).toFixed(1)}" height="${H-.8}" rx="2.6" fill="url(#vshade)" style="animation-delay:${d}ms"/>`;
    }
    out+=`<rect class="nozzle" x="${CX-9}" y="${BASE-6}" width="18" height="26" rx="3"/>`;
    svg.innerHTML=out;
  }

  function setHero(kind,color){
    const list=variantsOf(kind);let v=list.find(x=>x.color===color)||list[0];
    heroKind=kind;heroColor=v.color;
    const root=document.documentElement.style,[H,S,L]=hsl(v.swatch),dark=L<26;
    root.setProperty('--fil',v.swatch);
    root.setProperty('--hero-bg',`hsl(${H.toFixed(0)} ${Math.min(S,62).toFixed(0)}% ${dark?11:13}%)`);
    root.setProperty('--hero-glow',`hsl(${H.toFixed(0)} ${Math.min(Math.max(S,18),70).toFixed(0)}% ${dark?36:Math.min(Math.max(L*.5,17),25).toFixed(0)}%)`);
    $('heroColorName').textContent=v.color;$('heroColorMeta').textContent=`${KINDS[kind].label}, 1 kg`;
    document.querySelectorAll('.kindtabs button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.kind===kind)));
    $('heroSwatches').innerHTML=list.map(x=>`<button type="button" class="sw" role="radio" aria-checked="${x.color===v.color}" aria-label="${esc(x.color)}" title="${esc(x.color)}" data-color="${esc(x.color)}" style="--c:${x.swatch}"></button>`).join('');
    document.querySelectorAll('#heroSwatches .sw').forEach(b=>b.onclick=()=>setHero(heroKind,b.dataset.color));
  }

  function renderFilList(){
    $('filList').innerHTML=Object.keys(KINDS).map(k=>{const list=variantsOf(k),K=KINDS[k];
      return `<div class="kind"><div class="kind-head"><h3>Flashforge ${K.label}</h3><p>${K.blurb}</p></div><div class="tiles" role="list" aria-label="Cores de ${K.label}">${list.map(v=>`<button type="button" class="tile" role="listitem" data-kind="${k}" data-color="${esc(v.color)}" style="--c:${v.swatch};--t:${onColor(v.swatch)}"><span class="tile-name">${esc(v.color)}</span><span class="tile-meta">${K.label}, 1 kg</span></button>`).join('')}</div></div>`}).join('');
    document.querySelectorAll('.tile').forEach(b=>b.onclick=()=>openFilament(b.dataset.kind,b.dataset.color));
  }

  buildVase();renderFilList();setHero('PLA','Azul');
  document.querySelectorAll('.kindtabs button').forEach(b=>b.onclick=()=>setHero(b.dataset.kind,heroColor));
  $('heroBuy').onclick=()=>openFilament(heroKind,heroColor);
})();
