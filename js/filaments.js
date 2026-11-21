'use strict';
/* Filamentos por marca: cards na página e janela com carretel que muda de cor.
   Dados em data/filaments.js (window.NP_FIL). Depende de app.js: ffVariants, addToCart, renderCart,
   openOverlay, whatsapp, fmt, esc, showToast. */
(function(){
  const BRANDS=window.NP_FIL||[];
  const $=id=>document.getElementById(id);
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  // cores de cada linha (Flashforge vem do app.js, com foto real quando existe)
  const colorsOf=line=>line.fromApp
    ?ffVariants.filter(v=>v.kind===line.fromApp).map(v=>({name:v.color,hex:v.swatch,photo:v.image||''}))
    :line.colors.map(([name,hex,translucent])=>({name,hex,translucent:!!translucent,photo:''}));
  const lum=h=>{const[r,g,b]=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);return .2126*r+.7152*g+.0722*b};

  /* carretel em SVG; a cor do filamento vem de --sel para poder animar */
  function spool(brand,big){
    const logo=brand.logo?`<image href="${brand.logo}" x="104" y="104" width="32" height="32"/>`:`<text x="120" y="125" text-anchor="middle" font-family="Geist,system-ui,sans-serif" font-weight="700" font-size="11" fill="#0C100E">${esc(brand.mono||brand.name.slice(0,2).toUpperCase())}</text>`;
    const rings=[94,86,78,70,62].map(r=>`<circle cx="120" cy="120" r="${r}"/>`).join('');
    const windows=[0,60,120,180,240,300].map(a=>{const x=120+40*Math.cos(a*Math.PI/180),y=120+40*Math.sin(a*Math.PI/180);return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="8.5"/>`}).join('');
    return `<svg class="spool${big?' big':''}" viewBox="0 0 240 240" aria-hidden="true">
      <circle cx="120" cy="120" r="114" fill="#171B19"/><circle cx="120" cy="120" r="110" fill="none" stroke="${brand.accent}" stroke-opacity=".55" stroke-width="2"/>
      <circle class="spool-fil" cx="120" cy="120" r="102"/>
      <g fill="none" stroke="rgba(0,0,0,.13)" stroke-width="1.4">${rings}</g>
      <path d="M38 92a86 86 0 0 1 64-60" stroke="rgba(255,255,255,.55)" stroke-width="7" stroke-linecap="round" fill="none"/>
      <path d="M204 150a86 86 0 0 1-60 54" stroke="rgba(0,0,0,.22)" stroke-width="9" stroke-linecap="round" fill="none"/>
      <circle cx="120" cy="120" r="56" fill="#171B19"/><g fill="#0B0D0C">${windows}</g>
      <circle cx="120" cy="120" r="27" fill="#F2F4F3"/>${logo}
    </svg>`;
  }
  const paint=(el,c)=>{el.style.setProperty('--sel',c.hex);el.classList.toggle('translucent',!!c.translucent)};

  /* ---------- cards ---------- */
  $('filBrands').innerHTML=BRANDS.map(b=>{
    const all=b.lines.flatMap(colorsOf),first=all.find(c=>!/branco|preto|transparente/i.test(c.name))||all[0];
    const priced=b.lines.find(l=>l.price);
    const dots=all.slice(0,9).map(c=>`<i style="--c:${c.hex}"></i>`).join('')+(all.length>9?`<em>+${all.length-9}</em>`:'');
    return `<button type="button" class="brand-card" data-brand="${b.id}" style="--sel:${first.hex};--accent:${b.accent}">
      <span class="bc-top">${b.logo?`<img src="${b.logo}" alt="" width="28" height="28">`:`<span class="bc-mono">${esc(b.mono||b.name.slice(0,2).toUpperCase())}</span>`}<b>${esc(b.name)}</b></span>
      <span class="bc-spool">${spool(b)}</span>
      <span class="bc-lines">${b.lines.map(l=>`<span>${esc(l.name)}</span>`).join('')}</span>
      <span class="bc-dots" aria-label="${all.length} cores">${dots}</span>
      <span class="bc-foot"><span class="bc-price">${priced?`<small>a partir de</small><strong>${fmt(priced.wholesale||priced.price)}<span>/kg</span></strong>`:`<small>${all.length} cores</small><strong class="soft">Preço sob consulta</strong>`}</span><span class="pill neon sm">Ver cores</span></span>
    </button>`}).join('');
  document.querySelectorAll('.brand-card').forEach(c=>{
    c.onclick=()=>open(c.dataset.brand);
    // prévia: passa o mouse pelas bolinhas e o carretel do card muda de cor
    c.querySelectorAll('.bc-dots i').forEach(d=>d.onmouseenter=()=>c.style.setProperty('--sel',d.style.getPropertyValue('--c')));
  });

  /* ---------- janela ---------- */
  const pop=$('filPop');let brand=null,line=null,color=null,qty=1,lastFocus=null;
  function open(id){
    brand=BRANDS.find(b=>b.id===id);if(!brand)return;
    lastFocus=document.activeElement;line=brand.lines[0];
    $('fpLogo').hidden=!brand.logo;if(brand.logo)$('fpLogo').src=brand.logo;
    $('fpBrand').textContent=brand.name;$('fpAbout').textContent=brand.about;
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
    $('fpTitle').textContent=`${brand.name} ${line.name}`;
    const cs=colorsOf(line);
    $('fpSwatches').innerHTML=cs.map((c,i)=>`<button type="button" role="radio" class="fp-sw${c.translucent?' translucent':''}" aria-checked="false" data-i="${i}" style="--c:${c.hex}" title="${esc(c.name)}"><i></i><span>${esc(c.name)}</span></button>`).join('');
    $('fpSwatches').querySelectorAll('.fp-sw').forEach(b=>b.onclick=()=>selectColor(cs[Number(b.dataset.i)],b));
    $('fpCount').textContent=`${cs.length} ${cs.length===1?'cor':'cores'}`;
    const keep=color&&cs.find(c=>c.name===color.name);
    const pick=keep||cs.find(c=>!/branco|preto|transparente/i.test(c.name))||cs[0];
    selectColor(pick,$('fpSwatches').querySelector(`[data-i="${cs.indexOf(pick)}"]`));
    qty=1;renderBuy();
  }
  function selectColor(c,btn){
    color=c;
    $('fpSwatches').querySelectorAll('.fp-sw').forEach(b=>b.setAttribute('aria-checked',String(b===btn)));
    paint(pop,c);$('fpColor').textContent=c.name;
    pop.style.setProperty('--glow',c.hex);pop.classList.toggle('light',lum(c.hex)>.75);
    const ph=$('fpPhoto');ph.hidden=!c.photo;if(c.photo){ph.querySelector('img').src=c.photo;ph.querySelector('img').alt=`${brand.name} ${line.name}, cor ${c.name}`}
    // pequeno "giro" do carretel a cada troca
    const s=$('fpStageSpool').firstElementChild;if(s&&!reduce){s.classList.remove('spin');void s.getBBox;requestAnimationFrame(()=>s.classList.add('spin'))}
    renderBuy();
  }
  function renderBuy(){
    const box=$('fpBuy');
    if(line.price){
      box.innerHTML=`<div class="fp-price"><strong>${fmt(line.price)}</strong><span>por kg</span><small>${fmt(line.wholesale)} por kg a partir de 5 kg no carrinho</small></div>
        <div class="fp-row"><div class="fp-qty" role="group" aria-label="Quantidade em kg"><button type="button" id="fpMinus" aria-label="Diminuir">−</button><output id="fpQty">${qty}</output><button type="button" id="fpPlus" aria-label="Aumentar">+</button></div>
        <button type="button" class="pill neon grow" id="fpAdd">Adicionar ao carrinho</button></div>`;
      $('fpMinus').onclick=()=>{qty=Math.max(1,qty-1);$('fpQty').textContent=qty};
      $('fpPlus').onclick=()=>{qty=Math.min(99,qty+1);$('fpQty').textContent=qty};
      $('fpAdd').onclick=()=>{addToCart(line.cartId,`${color.name} · 1 kg`,qty);close();renderCart();openOverlay('cartDrawer')};
      $('fpNote').textContent='Frete e pagamento são combinados pelo WhatsApp ao finalizar o pedido.';
    }else{
      const msg=n=>`Olá, ${n}! Quero saber o preço e a disponibilidade do filamento ${brand.name} ${line.name}, cor ${color.name}.`;
      box.innerHTML=`<div class="fp-price"><strong class="soft">Preço sob consulta</strong><small>Confirme o valor e o estoque desta cor com uma vendedora.</small></div>
        <div class="fp-row"><button type="button" class="pill neon grow" data-wa="62994077839" data-name="Karita">Consultar com a Karita</button><button type="button" class="pill line grow" data-wa="62994632427" data-name="Isabel">Consultar com a Isabel</button></div>`;
      box.querySelectorAll('[data-wa]').forEach(b=>b.onclick=()=>whatsapp(b.dataset.wa,msg(b.dataset.name)));
      $('fpNote').textContent='As cores mostradas são as da linha do fabricante. A vendedora confirma o que está disponível.';
    }
  }
  pop.querySelectorAll('[data-fp-close]').forEach(b=>b.onclick=close);
  document.addEventListener('keydown',e=>{
    if(pop.hidden)return;
    if(e.key==='Escape'){e.stopPropagation();close()}
    if(e.key==='Tab'){const f=[...pop.querySelectorAll('button:not([hidden]),[href],input')].filter(x=>x.offsetParent);if(!f.length)return;const a=f[0],z=f[f.length-1];
      if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}
  },true);
  $('fpPhoto').onclick=()=>{const im=$('fpPhoto').querySelector('img');$('zoomImg').src=im.src;$('zoomImg').alt=im.alt;$('zoomOverlay').hidden=false};
  window.openFilamentBrand=open;
})();
