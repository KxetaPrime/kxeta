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
  document.querySelectorAll('[data-rail]').forEach(b=>b.onclick=()=>{const r=b.closest('section').querySelector('.rail');r.scrollBy({left:Number(b.dataset.rail)*r.clientWidth*.8,behavior:reduce?'auto':'smooth'})});

  /* ---------- topo e categorias ---------- */
  (function(){
    const pr=window.NP_PROMO,now=new Date(),end=pr&&pr.ends?new Date(pr.ends+'T23:59:59-03:00'):null,start=pr&&pr.starts?new Date(pr.starts+'T00:00:00-03:00'):null;
    if(pr&&pr.off&&!(start&&now<start)&&!(end&&now>end)){const d=end?Math.ceil((end-now)/864e5):0;
      $('hpTag').textContent=pr.name;$('hpText').textContent=`${pr.off}% off nos impressos${end?(d<=1?' · termina hoje':` · até ${pr.ends.slice(8,10)}/${pr.ends.slice(5,7)}`):''}`;$('heroPromo').hidden=false}
    const first=c=>P.filter(p=>p.category===c).sort((a,b)=>Number(b.featured)-Number(a.featured))[0];
    const fil=FIL.find(x=>x.c.sku==='233338');
    const cats=[
      {t:'Natal',s:'Enfeites e árvores',img:first('Natal e decoração'),cat:'Natal e decoração'},
      {t:'Presentes',s:'Chaveiros e lembranças',img:first('Chaveiros e brindes'),cat:'Chaveiros e brindes'},
      {t:'Casa',s:'Organização e decoração',img:first('Casa e organização'),cat:'Casa e organização'},
      {t:'Filamentos',s:'PLA, PETG, ABS e TPU',src:fil&&fil.c.photo,href:'#filamentos'}];
    $('heroCats').innerHTML=cats.map(c=>{const src=c.src||(c.img?thumbOf(c.img):'');const n=c.cat?P.filter(p=>p.category===c.cat).length:null;
      return `<a class="catc" href="${c.href||'#catalogo'}" ${c.cat?`data-goto-cat="${esc(c.cat)}"`:''}><img src="${esc(src)}" alt="" loading="lazy" decoding="async"><span><b>${c.t}</b><small>${c.s}</small></span></a>`}).join('');
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
