'use strict';
/* Nova Prime 3D — hero (seletor de cor + vaso impresso em camadas) e seção de filamentos.
   Depende de app.js: ffVariants, filaments, activeFilKind, selectedFilColor, renderColorSelector, openOverlay, $ */
(function(){
  const KINDS={PLA:{id:'fil_pla',label:'PLA Basic',blurb:'Fácil de imprimir, ótimo acabamento e muitas cores. A escolha certa para decoração, protótipos e peças do dia a dia.'},
                PETG:{id:'fil_petg',label:'PETG Basic',blurb:'Mais resistente a impacto e à umidade que o PLA. Indicado para peças funcionais e que ficam expostas.'}};
  const variantsOf=k=>ffVariants.filter(v=>v.kind===k);

  const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
  const lum=h=>{const[r,g,b]=rgb(h).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*r+.7152*g+.0722*b};
  function hsl(h){let[r,g,b]=rgb(h).map(v=>v/255);const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;let H=0,S=0;if(mx!==mn){const d=mx-mn;S=l>.5?d/(2-mx-mn):d/(mx+mn);H=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;H*=60}return[H,S*100,l*100]}
  const onColor=h=>lum(h)>.42?'#0E1530':'#fff';

  function openFilament(kind,color){
    activeFilKind=kind;selectedFilColor=color;
    $('filColorsTitle').textContent=`Flashforge ${kind} Basic`;$('filQty').value='1';
    renderColorSelector();openOverlay('filamentModal');
  }

  function renderFilList(){
    $('filList').innerHTML=Object.keys(KINDS).map(k=>{const list=variantsOf(k),K=KINDS[k];
      return `<div class="kind"><div class="kind-head"><h3>Flashforge ${K.label}</h3><p>${K.blurb}</p></div><div class="tiles" role="list" aria-label="Cores de ${K.label}">${list.map(v=>`<button type="button" class="tile" role="listitem" data-kind="${k}" data-color="${esc(v.color)}" style="--c:${v.swatch};--t:${onColor(v.swatch)}"><span class="tile-name">${esc(v.color)}</span><span class="tile-meta">${K.label}, 1 kg</span></button>`).join('')}</div></div>`}).join('');
    document.querySelectorAll('.tile').forEach(b=>b.onclick=()=>openFilament(b.dataset.kind,b.dataset.color));
  }

  renderFilList();
  window.openFilament=openFilament;
})();
