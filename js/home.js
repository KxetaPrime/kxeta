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
      return `<a class="catc${c.cat?'':' fil'}" href="${c.href||'#catalogo'}" ${c.cat?`data-goto-cat="${esc(c.cat)}"`:''}><img src="${esc(src)}" alt="" loading="lazy" decoding="async"><span><span class="catc-t"><b>${c.t}</b><small>${n?`${n} ${n===1?'produto':'produtos'}`:c.s}</small></span><em aria-hidden="true">→</em></span></a>`}).join('');
  })();

  /* ---------- carretéis do topo: trocam de marca e abrem a cor clicada ---------- */
  (function(){const st=$('spoolStage'),sw=$('brandSwitch');if(!st)return;
    const SETS=[['flashforge',['233347','233340','233338','233336','233344']],['bambulab',['354080','233418','354079','233424','233416']],['masterprint',['MP-PLA-ROXO','MP-PLA-AZUL','MP-PLA-VERDE','MP-PLA-VERMELHO','MP-PLA-ROSA']]];
    const B=id=>(window.NP_FIL||[]).find(b=>b.id===id),C=sku=>FIL.find(x=>x.c.sku===sku);
    const btns=[...st.querySelectorAll('.sp')];let cur=0,timer=0,hold=false;
    SETS.forEach(([b])=>{for(let i=0;i<5;i++){const im=new Image();im.src=`assets/hero/${b}-${i}.webp`}});
    sw.innerHTML=SETS.map(([id],i)=>{const b=B(id);return `<button type="button" role="tab" data-set="${i}" aria-selected="${i===0}">${b.logo&&!b.logoWide?`<img src="${b.logo}" alt="" width="18" height="18">`:''}<span>${esc(b.name)}</span><i></i></button>`}).join('');
    function label(){const [id,skus]=SETS[cur];btns.forEach((bt,i)=>{const x=C(skus[i]);bt.setAttribute('aria-label',x?`Ver ${x.b.name} ${x.l.name} ${x.c.name}`:'Ver filamento')})}
    function show(n,user){if(n===cur&&!user)return;cur=(n+SETS.length)%SETS.length;st.classList.add('out');
      sw.querySelectorAll('[data-set]').forEach(b=>b.setAttribute('aria-selected',String(Number(b.dataset.set)===cur)));
      setTimeout(()=>{const id=SETS[cur][0];btns.forEach((bt,i)=>bt.querySelector('img').src=`assets/hero/${id}-${i}.webp`);st.dataset.brand=id;label();st.classList.remove('out');st.classList.remove('in');void st.offsetWidth;st.classList.add('in')},reduce?0:360);
      if(user)restart()}
    function restart(){clearInterval(timer);sw.classList.remove('run');void sw.offsetWidth;if(!reduce&&!hold){sw.classList.add('run');timer=setInterval(()=>show(cur+1),5200)}}
    btns.forEach((bt,i)=>bt.onclick=()=>{const [id,skus]=SETS[cur];window.openFilamentBrand&&window.openFilamentBrand(id,skus[i])});
    sw.querySelectorAll('[data-set]').forEach(b=>b.onclick=()=>show(Number(b.dataset.set),true));
    const box=st.closest('.hero2');box.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){hold=true;restart()}});box.addEventListener('pointerleave',()=>{hold=false;restart()});
    document.addEventListener('visibilitychange',()=>{hold=document.hidden;restart()});
    st.dataset.brand='flashforge';label();restart();
  })();

  /* ---------- carretéis: profundidade com o mouse ---------- */
  (function(){const st=$('spoolStage');if(!st||reduce||matchMedia('(hover:none)').matches)return;const box=st.closest('.hero2');let raf=0,mx=0,my=0;
    box.addEventListener('pointermove',e=>{const r=box.getBoundingClientRect();mx=(e.clientX-r.left)/r.width-.5;my=(e.clientY-r.top)/r.height-.5;if(!raf)raf=requestAnimationFrame(()=>{raf=0;st.style.setProperty('--mx',mx.toFixed(3));st.style.setProperty('--my',my.toFixed(3))})});
    box.addEventListener('pointerleave',()=>{st.style.setProperty('--mx',0);st.style.setProperty('--my',0)})})();

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
