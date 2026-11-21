'use strict';
/* Página inicial: hero, categorias, vitrine de Natal, carrossel, filamentos e favoritos.
   Depende de app.js: state, ffVariants, cardHTML, openDetails, renderFilters, renderCatalog,
   currentFilter, onlyFav, updateFavUI, toggleFav, minAvailable, fmt, esc, imgOf,
   activeFilKind, selectedFilColor, renderColorSelector, openOverlay, $. */
(function(){
  const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)),ease=t=>t*t*(3-2*t);
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const narrow=()=>innerWidth<760;
  const shortName=p=>String(p.title).split('|')[0].trim()||p.title;
  const P=state.products;

  /* ---------- navegação por categoria ---------- */
  function gotoCat(cat){
    currentFilter=cat;onlyFav=false;updateFavUI();renderFilters();renderCatalog();
    $('catalogo').scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
  }
  document.addEventListener('click',e=>{const b=e.target.closest('[data-goto-cat]');if(!b)return;e.preventDefault();gotoCat(b.dataset.gotoCat)});

  /* ---------- vitrine de destaques (abas: Natal | Filamentos) ---------- */
  const destRail=$('destRail');
  const natal=P.filter(p=>p.category==='Natal e decoração').sort((a,b)=>Number(b.featured)-Number(a.featured)||(minAvailable(a)??1e9)-(minAvailable(b)??1e9));
  const FIL=(window.NP_FIL||[]).flatMap(b=>b.lines.flatMap(l=>l.colors.map(c=>({b,l,c}))));
  const topFil=FIL.filter(x=>Number(x.c.stock)>0&&x.c.photoKind==='official').sort((x,y)=>Number(y.c.stock)-Number(x.c.stock));
  // mistura as marcas: vai pegando a cor com mais estoque de cada marca, em rodízio, sem repetir mais de 3 por linha
  const byBrand={};topFil.forEach(x=>(byBrand[x.b.id]=byBrand[x.b.id]||[]).push(x));
  const pickFil=[];for(let r=0;pickFil.length<10&&r<20;r++)for(const k in byBrand){const x=byBrand[k].find(x=>!pickFil.includes(x)&&pickFil.filter(y=>y.l===x.l).length<3);if(x&&pickFil.length<10)pickFil.push(x)}
  const PLUS='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
  const filCard=({b,l,c})=>{const st=Number(c.stock);return `<article class="card fil-card"><div class="card-media"><button class="card-img" type="button" data-fil-open="${b.id}" data-sku="${c.sku}" aria-label="Ver ${esc(b.name)} ${esc(l.name)} ${esc(c.name)}"><img loading="lazy" src="${esc(c.photo)}" alt="${esc(b.name)} ${esc(l.name)} ${esc(c.name)}"></button><span class="badge">${esc(b.name)}</span></div><div class="card-body"><p class="card-cat">${esc(l.name)} · 1 kg</p><p class="card-stock${st<=10?' low':''}">${st<=10?`Últimas ${st} unidades`:`${st} em estoque`}</p><h3 class="card-title"><button type="button" data-fil-open="${b.id}" data-sku="${c.sku}"><i class="dot-c" style="background:${String(c.hex).split('|')[0]}"></i>${esc(c.name)}</button></h3><div class="card-foot"><div class="card-price"><small>o carretel</small><strong>${fmt(filPrice(c,1))}</strong></div><button class="add" type="button" data-fil-open="${b.id}" data-sku="${c.sku}" aria-label="Escolher ${esc(c.name)}">${PLUS}</button></div></div></article>`};
  function bindCards(root){root.querySelectorAll('[data-detail]').forEach(b=>b.onclick=()=>openDetails(b.dataset.detail));root.querySelectorAll('[data-fav]').forEach(b=>b.onclick=e=>{e.stopPropagation();toggleFav(b.dataset.fav)});root.querySelectorAll('[data-fil-open]').forEach(b=>b.onclick=()=>window.openFilamentBrand&&window.openFilamentBrand(b.dataset.filOpen,b.dataset.sku))}
  function showTab(t){document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===t)));destRail.innerHTML=t==='fil'?pickFil.map(filCard).join(''):natal.map(cardHTML).join('');destRail.scrollLeft=0;bindCards(destRail)}
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));showTab('natal');

  /* ---------- carrossel de mais procurados ---------- */
  const rail=$('rail');
  rail.innerHTML=P.filter(p=>p.featured).map(cardHTML).join('');bindCards(rail);
  document.querySelectorAll('[data-rail]').forEach(b=>b.onclick=()=>{const r=b.closest('section').querySelector('.rail');r.scrollBy({left:Number(b.dataset.rail)*r.clientWidth*.8,behavior:reduce?'auto':'smooth'})});

  /* ---------- topo em blocos (bento) ---------- */
  (function(){
    // faixa de produtos reais rolando
    const pick=P.filter(p=>minAvailable(p)!==null).sort((a,b)=>Number(b.featured)-Number(a.featured));
    const item=p=>`<button type="button" class="mq-item" data-detail="${p.id}" aria-label="${esc(shortName(p))}"><img src="${esc(thumbOf(p))}" alt="" loading="lazy" decoding="async"><span>${fmt(minAvailable(p))}</span></button>`;
    $('mqTrack').innerHTML=pick.map(item).join('')+pick.map(item).join('').replace(/<button /g,'<button tabindex="-1" aria-hidden="true" ');
    $('mqTrack').querySelectorAll('[data-detail]').forEach(b=>b.onclick=()=>openDetails(b.dataset.detail));
    // filamentos: carretéis oficiais e menor preço
    const prices=FIL.filter(x=>Number(x.c.stock)>0&&x.c.cost!=null).map(x=>filPrice(x.c,1));
    if(prices.length)$('heroFilPrice').innerHTML=`a partir de <b>${fmt(Math.min(...prices))}</b>`;
    const sp=['233340','233336','233338'].map(s=>FIL.find(x=>x.c.sku===s)).filter(Boolean);
    $('heroSpools').innerHTML=sp.map((x,i)=>`<img class="s${i}" src="${esc(x.c.photo)}" alt="" loading="lazy" decoding="async">`).join('');
    // promoção (ou Natal)
    const pr=window.NP_PROMO,now=new Date(),end=pr&&pr.ends?new Date(pr.ends+'T23:59:59-03:00'):null,start=pr&&pr.starts?new Date(pr.starts+'T00:00:00-03:00'):null;
    const on=pr&&pr.off&&!(start&&now<start)&&!(end&&now>end);
    const nat=natal[0];if(nat)$('hpImg').src=sm(imgOf(nat));
    if(on){$('hpTag').textContent=pr.name;$('hpTitle').innerHTML=`<em>${pr.off}%</em> off ou mais`;$('hpText').textContent=pr.categories?pr.categories.join(', '):'Em todos os produtos impressos';
      if(end){const d=Math.ceil((end-now)/864e5);$('hpTime').textContent=d<=1?'Termina hoje':`Termina em ${d} dias`}
      $('heroPromo').href='#catalogo'}
    else $('heroPromo').classList.add('calm');
  })();

  /* ---------- favoritos no topo ---------- */
  $('favBtn').onclick=()=>{onlyFav=!onlyFav;if(onlyFav)currentFilter='Todos';updateFavUI();renderFilters();renderCatalog();$('catalogo').scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'})};
  updateFavUI();

  /* ---------- barra inferior (celular) ---------- */
  $('tbWhats').onclick=()=>openService('sales');
  const tbLinks=[...document.querySelectorAll('[data-tb]')],tbSecs=tbLinks.map(a=>$(a.dataset.tb)).filter(Boolean);
  const tbSpy=()=>{let cur=tbSecs[0];for(const s of tbSecs)if(s.getBoundingClientRect().top<innerHeight*.4)cur=s;tbLinks.forEach(a=>a.classList.toggle('on',a.dataset.tb===cur.id))};
  addEventListener('scroll',tbSpy,{passive:true});tbSpy();

  /* ---------- topo com sombra ao rolar ---------- */
  const head=document.querySelector('.tophead');
  const onScroll=()=>head.classList.toggle('scrolled',scrollY>8);addEventListener('scroll',onScroll,{passive:true});onScroll();

})();
