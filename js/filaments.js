'use strict';
/* Filamentos por marca: cards na página e janela com foto oficial (ou carretel desenhado) que troca com a cor.
   Dados em data/filaments.js (NP_FIL, NP_FIL_INDEX, NP_PRICING), gerado por tools/build_filaments.py.
   Depende de app.js: addToCart, renderCart, openOverlay, filPrice, fmt, esc. */
(function(){
  const BRANDS=window.NP_FIL||[],P=window.NP_PRICING||{retail:20,tiers:[]};
  const $=id=>document.getElementById(id);
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hexes=c=>String(c.hex).split('|');
  const lum=h=>{const[r,g,b]=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);return .2126*r+.7152*g+.0722*b};
  const swatchBg=c=>{const[a,b]=hexes(c);return b?`linear-gradient(135deg,${a} 0 50%,${b} 50% 100%)`:a};
  const inStock=c=>Number(c.stock)>0;
  const tiers=[{min:1,add:P.retail},...P.tiers];

  /* carretel desenhado (para cores sem foto oficial); --sel e --sel2 animam a cor */
  function spool(brand,big){
    const logo=brand.logo?`<image href="${brand.logo}" x="104" y="104" width="32" height="32"/>`:'';
    const rings=[94,86,78,70,62].map(r=>`<circle cx="120" cy="120" r="${r}"/>`).join('');
    const windows=[0,60,120,180,240,300].map(a=>{const x=120+40*Math.cos(a*Math.PI/180),y=120+40*Math.sin(a*Math.PI/180);return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="8.5"/>`}).join('');
    return `<svg class="spool${big?' big':''}" viewBox="0 0 240 240" aria-hidden="true">
      <circle cx="120" cy="120" r="114" fill="#171B19"/><circle cx="120" cy="120" r="110" fill="none" stroke="${brand.accent}" stroke-opacity=".55" stroke-width="2"/>
      <circle class="spool-fil" cx="120" cy="120" r="102"/><path class="spool-fil2" d="M120 18a102 102 0 0 1 0 204z"/>
      <g fill="none" stroke="rgba(0,0,0,.13)" stroke-width="1.4">${rings}</g>
      <path d="M38 92a86 86 0 0 1 64-60" stroke="rgba(255,255,255,.55)" stroke-width="7" stroke-linecap="round" fill="none"/>
      <path d="M204 150a86 86 0 0 1-60 54" stroke="rgba(0,0,0,.22)" stroke-width="9" stroke-linecap="round" fill="none"/>
      <circle cx="120" cy="120" r="56" fill="#171B19"/><g fill="#0B0D0C">${windows}</g>
      <circle cx="120" cy="120" r="27" fill="#F2F4F3"/>${logo}
    </svg>`;
  }
  function paint(el,c){const[a,b]=hexes(c);el.style.setProperty('--sel',a);el.style.setProperty('--sel2',b||a);el.classList.toggle('dual',!!b);el.classList.toggle('translucent',!!c.translucent)}

  /* ---------- cards ---------- */
  const allColors=b=>b.lines.flatMap(l=>l.colors);
  $('filBrands').innerHTML=BRANDS.map(b=>{
    const all=allColors(b),avail=all.filter(inStock),cover=all.find(c=>c.photoKind==='official'&&inStock(c)&&!/branco|preto|natural|cinza/i.test(c.name))||all.find(c=>c.photo)||all[0];
    const minPrice=Math.min(...avail.map(c=>filPrice(c,1)));
    const dots=avail.slice(0,10).map(c=>`<i style="--c:${swatchBg(c)}" title="${esc(c.name)}"></i>`).join('')+(avail.length>10?`<em>+${avail.length-10}</em>`:'');
    return `<button type="button" class="brand-card" data-brand="${b.id}" style="--sel:${hexes(cover)[0]};--accent:${b.accent}">
      <span class="bc-top"><img src="${b.logo}" alt="" width="28" height="28"><b>${esc(b.name)}</b></span>
      <span class="bc-pic">${cover.photo?`<img src="${cover.photo}" alt="" loading="lazy">`:spool(b)}</span>
      <span class="bc-lines">${b.lines.map(l=>`<span>${esc(l.name)}</span>`).join('')}</span>
      <span class="bc-dots" aria-label="${avail.length} cores em estoque">${dots}</span>
      <span class="bc-foot"><span class="bc-price"><small>a partir de</small><strong>${fmt(minPrice)}<span> o carretel</span></strong></span><span class="pill neon sm">Ver cores</span></span>
    </button>`}).join('');
  document.querySelectorAll('.brand-card').forEach(c=>c.onclick=()=>open(c.dataset.brand));

  /* ---------- janela ---------- */
  const pop=$('filPop');let brand=null,line=null,color=null,qty=1,lastFocus=null;
  function open(id){
    brand=BRANDS.find(b=>b.id===id);if(!brand)return;
    lastFocus=document.activeElement;line=brand.lines[0];color=null;
    $('fpLogo').src=brand.logo;$('fpBrand').textContent=brand.name;
    $('fpStageSpool').innerHTML=spool(brand,true);pop.style.setProperty('--accent',brand.accent);
    renderLines();selectLine(line.id);
    pop.hidden=false;document.body.style.overflow='hidden';
    requestAnimationFrame(()=>pop.classList.add('on'));
    setTimeout(()=>$('fpClose').focus(),reduce?0:180);
  }
  function close(){
    pop.classList.remove('on');document.body.style.overflow='';
    setTimeout(()=>{pop.hidden=true},reduce?0:260);
    if(lastFocus&&lastFocus.focus)lastFocus.focus();
  }
  function renderLines(){
    $('fpLines').innerHTML=brand.lines.map(l=>`<button type="button" role="tab" aria-selected="${l===line}" data-line="${l.id}">${esc(l.name)}</button>`).join('');
    $('fpLines').hidden=brand.lines.length<2;
    $('fpLines').querySelectorAll('[data-line]').forEach(b=>b.onclick=()=>selectLine(b.dataset.line));
  }
  function selectLine(id){
    line=brand.lines.find(l=>l.id===id)||brand.lines[0];
    $('fpLines').querySelectorAll('[data-line]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.line===line.id)));
    $('fpTitle').textContent=`${brand.name} ${line.name}`;$('fpAbout').textContent=line.about;
    const cs=line.colors;cs.forEach(c=>{if(c.photo){const i=new Image();i.src=c.photo}});
    $('fpSwatches').innerHTML=cs.map((c,i)=>`<button type="button" role="radio" class="fp-sw${c.translucent?' translucent':''}${inStock(c)?'':' out'}" aria-checked="false" data-i="${i}" style="--c:${swatchBg(c)}" title="${esc(c.name)}${inStock(c)?'':' (esgotado)'}"><i></i><span>${esc(c.name)}</span></button>`).join('');
    $('fpSwatches').querySelectorAll('.fp-sw').forEach(b=>b.onclick=()=>selectColor(cs[Number(b.dataset.i)],b));
    const n=cs.filter(inStock).length;$('fpCount').textContent=`${n} ${n===1?'cor':'cores'} em estoque`;
    const keep=color&&cs.find(c=>c.name===color.name&&inStock(c));
    const pick=keep||cs.find(c=>c.photo&&inStock(c)&&!/branco|preto|natural/i.test(c.name))||cs.find(inStock)||cs[0];
    selectColor(pick,$('fpSwatches').querySelector(`[data-i="${cs.indexOf(pick)}"]`),true);
  }
  function selectColor(c,btn,silent){
    const changed=color!==c;color=c;qty=1;
    $('fpSwatches').querySelectorAll('.fp-sw').forEach(b=>b.setAttribute('aria-checked',String(b===btn)));
    paint(pop,c);$('fpColor').textContent=c.name;
    const[a]=hexes(c);pop.style.setProperty('--glow',a);pop.classList.toggle('light',lum(a)>.75);
    // foto oficial grande com troca suave; sem foto, o carretel desenhado
    const stage=$('fpStage'),pics=$('fpPics');
    stage.classList.toggle('has-photo',!!c.photo);
    if(c.photo){
      const cur=pics.querySelector('img.on');
      if(!cur||cur.getAttribute('src')!==c.photo){
        const im=new Image();im.alt=`${brand.name} ${line.name}, cor ${c.name}${c.photoKind==='simulated'?', simulação da cor':', foto oficial do fabricante'}`;im.decoding='async';im.src=c.photo;
        pics.appendChild(im);const show=()=>requestAnimationFrame(()=>{im.classList.add('on');if(cur){cur.classList.remove('on');setTimeout(()=>cur.remove(),reduce?0:420)}});
        im.complete?show():(im.onload=show,im.onerror=show);
      }
    }else{pics.querySelectorAll('img').forEach(i=>i.remove());const s=$('fpStageSpool').firstElementChild;if(s&&!reduce&&changed&&!silent){s.classList.remove('spin');requestAnimationFrame(()=>s.classList.add('spin'))}}
    $('fpOfficial').textContent=c.photoKind==='simulated'?'Simulação da cor sobre foto oficial':c.photo?'Foto oficial do fabricante':'Ilustração na cor escolhida';
    renderBuy();
  }
  function renderBuy(){
    const box=$('fpBuy'),c=color,st=Number(c.stock)||0;
    if(!st){box.innerHTML=`<div class="fp-price"><strong class="soft">Esgotado</strong><small>Esta cor está sem estoque no momento. Escolha outra cor ou fale com uma vendedora.</small></div>`;$('fpNote').textContent='';return}
    const rows=tiers.map((t,i)=>{const n=tiers[i+1];const label=n?`${t.min} a ${n.min-1} carretéis`:`${t.min} ou mais`;return `<li${i===0?' class="on"':''}><span>${label}</span><b>${fmt(filPrice(c,t.min))}</b></li>`}).join('');
    box.innerHTML=`<div class="fp-price"><strong>${fmt(filPrice(c,1))}</strong><span>o carretel de 1 kg</span></div>
      <ul class="fp-tiers" aria-label="Preço por carretel conforme a quantidade de filamentos no carrinho">${rows}</ul>
      <div class="fp-row"><div class="fp-qty" role="group" aria-label="Quantidade de carretéis"><button type="button" id="fpMinus" aria-label="Diminuir">−</button><output id="fpQty">${qty}</output><button type="button" id="fpPlus" aria-label="Aumentar">+</button></div>
      <button type="button" class="pill neon grow" id="fpAdd">Adicionar ao carrinho</button></div>
      <p class="fp-stock">${st===1?'Última unidade':st<=3?`Últimas ${st} unidades`:`${st} em estoque`}</p>`;
    const upd=()=>{$('fpQty').textContent=qty;box.querySelectorAll('.fp-tiers li').forEach((li,i)=>{const t=tiers[i],n=tiers[i+1];li.classList.toggle('on',qty>=t.min&&(!n||qty<n.min))})};
    $('fpMinus').onclick=()=>{qty=Math.max(1,qty-1);upd()};
    $('fpPlus').onclick=()=>{qty=Math.min(st,qty+1);upd()};
    $('fpAdd').onclick=()=>{addToCart('fil:'+c.sku,`${c.name} · 1 kg`,qty);close();renderCart();openOverlay('cartDrawer')};
    $('fpNote').textContent='O preço de atacado vale somando todos os filamentos do carrinho. Frete e pagamento são combinados pelo WhatsApp.';
  }
  pop.querySelectorAll('[data-fp-close]').forEach(b=>b.onclick=close);
  document.addEventListener('keydown',e=>{
    if(pop.hidden)return;
    if(e.key==='Escape'){e.stopPropagation();close()}
    if(e.key==='Tab'){const f=[...pop.querySelectorAll('button,[href],input')].filter(x=>x.offsetParent&&!x.disabled);if(!f.length)return;const a=f[0],z=f[f.length-1];
      if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}
  },true);
  $('fpPics').onclick=()=>{const im=$('fpPics').querySelector('img.on');if(!im)return;$('zoomImg').src=im.src;$('zoomImg').alt=im.alt;$('zoomOverlay').hidden=false};
  window.openFilamentBrand=open;
})();
