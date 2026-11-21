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

  /* ---------- faixa da promoção ---------- */
  (function(){const p=window.NP_PROMO;if(!p||!p.off)return;const now=new Date(),end=p.ends?new Date(p.ends+'T23:59:59-03:00'):null,start=p.starts?new Date(p.starts+'T00:00:00-03:00'):null;
    if((start&&now<start)||(end&&now>end))return;
    $('promoName').textContent=p.name;$('promoText').textContent=innerWidth<760?`${p.off}% off nos impressos`:`${p.off}% de desconto ou mais em ${p.categories?p.categories.join(', '):'todos os produtos impressos'}`;
    if(end){const d=Math.ceil((end-now)/864e5);$('promoTime').textContent=d<=1?'Termina hoje':`Termina em ${d} dias`}
    $('promoWrap').hidden=false})();

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

  /* ---------- hero em carrossel ---------- */
  (function(){
    const hero=$('hero'),slides=[...hero.querySelectorAll('.slide')],dots=[...hero.querySelectorAll('[data-go]')];let cur=0,timer=0,paused=false;
    // slide 2: menor preço de filamento em estoque
    const prices=FIL.filter(x=>Number(x.c.stock)>0&&x.c.cost!=null).map(x=>filPrice(x.c,1));
    if(prices.length)$('heroFilPrice').innerHTML=`a partir de <b>${fmt(Math.min(...prices))}</b> o carretel`;
    // slide 3: promoção (se ativa) com fotos de Natal
    const pr=window.NP_PROMO;const promoOn=pr&&pr.off&&(!pr.ends||new Date()<=new Date(pr.ends+'T23:59:59-03:00'));
    if(promoOn){$('slidePromoTag').textContent=pr.name;$('slidePromoTitle').textContent=`Natal com ${pr.off}% de desconto ou mais.`;$('slidePromoText').textContent='Árvores, enfeites e lembranças impressas em 3D com preço de Black Friday, por tempo limitado.'}
    $('promoPics').innerHTML=natal.slice(0,3).map((p,i)=>`<img class="p${i}" src="${esc(thumbOf(p))}" alt="" loading="lazy" decoding="async">`).join('');
    function go(n,user){
      n=(n+slides.length)%slides.length;if(n===cur)return;const dir=(n>cur||(cur===slides.length-1&&n===0))&&!(cur===0&&n===slides.length-1)?1:-1;
      slides.forEach((s,i)=>{s.classList.remove('on','from-left','from-right','out-left','out-right');s.setAttribute('aria-hidden',String(i!==n))});
      slides[cur].classList.add(dir>0?'out-left':'out-right');slides[n].classList.add('on',dir>0?'from-right':'from-left');
      dots.forEach((d,i)=>d.setAttribute('aria-selected',String(i===n)));cur=n;hero.dataset.slide=n;
      if(user)restart();
    }
    function restart(){clearInterval(timer);hero.classList.remove('run');void hero.offsetWidth;if(!reduce&&!paused){hero.classList.add('run');timer=setInterval(()=>go(cur+1),7000)}}
    dots.forEach(d=>d.onclick=()=>go(Number(d.dataset.go),true));
    hero.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>go(cur+Number(b.dataset.step),true));
    hero.addEventListener('mouseenter',()=>{paused=true;restart()});hero.addEventListener('mouseleave',()=>{paused=false;restart()});
    hero.addEventListener('focusin',()=>{paused=true;restart()});hero.addEventListener('focusout',()=>{paused=false;restart()});
    let x0=null,y0=0;hero.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;x0=e.clientX;y0=e.clientY});
    hero.addEventListener('pointerup',e=>{if(x0===null)return;const dx=e.clientX-x0,dy=e.clientY-y0;x0=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy))go(cur+(dx<0?1:-1),true)});
    hero.addEventListener('keydown',e=>{if(e.key==='ArrowRight')go(cur+1,true);if(e.key==='ArrowLeft')go(cur-1,true)});
    document.addEventListener('visibilitychange',()=>{paused=document.hidden;restart()});
    hero.dataset.slide=0;restart();
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

  /* ---------- hero: vídeo (quando existir) ou impressão desenhada em loop ---------- */
  const hero=$('slide0'),cv=$('heroCanvas'),video=$('heroVideo');
  const saveData=navigator.connection&&navigator.connection.saveData;
  // Mídia do slide 1 (data/hero.js). image: foto de fundo; video: vídeo em loop; keepNozzle: mantém o bico animado por cima.
  const cfg=window.NP_HERO_VIDEO;
  if(cfg){
    const media=hero.querySelector('.hero-media');
    if(cfg.image){const im=new Image();im.className='hero-bg';im.alt='';im.decoding='async';im.src=narrow()&&cfg.imageMobile?cfg.imageMobile:cfg.image;media.prepend(im);hero.classList.add('has-bg')}
    if(cfg.desktop){if(cfg.poster)video.poster=cfg.poster;video.hidden=false;hero.classList.add('has-bg');
      if(!reduce&&!saveData){video.src=narrow()&&cfg.mobile?cfg.mobile:cfg.desktop;video.preload='auto';
        new IntersectionObserver(es=>{es[0].isIntersecting?video.play().catch(()=>{}):video.pause()}).observe(hero)}}
    if(!cfg.keepNozzle){cv.hidden=true;return}
  }
  const ctx=cv.getContext('2d'),off=document.createElement('canvas'),octx=off.getContext('2d');
  const LOOP=['Verde','Azul','Vermelho','Amarelo','Roxo','Branco','Rosa'].map(c=>ffVariants.find(v=>v.kind==='PLA'&&v.color===c)).filter(Boolean);
  const hex2rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
  let W=0,H=0,dpr=1;
  function resize(){dpr=Math.min(devicePixelRatio||1,narrow()?1.5:2);const r=cv.getBoundingClientRect();W=Math.max(1,Math.round(r.width*dpr));H=Math.max(1,Math.round(r.height*dpr));cv.width=W;cv.height=H}
  const PROFILE=[[0,44],[.1,62],[.36,100],[.62,80],[.84,40],[.93,42],[1,62]];
  const radius=t=>{for(let i=1;i<PROFILE.length;i++){const[a,ra]=PROFILE[i-1],[b,rb]=PROFILE[i];if(t<=b){const u=(t-a)/(b-a);return ra+(rb-ra)*u*u*(3-2*u)}}return 62};
  const N=90;
  function draw(t,rgb,spin){
    ctx.clearRect(0,0,W,H);
    const nw=narrow(),cx=W*(nw?.68:.7),baseY=H*(nw?.5:.8),vh=H*(nw?.36:.66),k=vh/434,lh=vh/N,maxR=100*k;
    const printP=ease(clamp(t/.72)),fade=1-ease(clamp((t-.93)/.07));
    ctx.globalAlpha=fade;
    // mesa
    const gx=ctx.createRadialGradient(cx,baseY+10*k,0,cx,baseY+10*k,maxR*2);gx.addColorStop(0,`rgba(${rgb},.28)`);gx.addColorStop(1,`rgba(${rgb},0)`);
    ctx.fillStyle=gx;ctx.beginPath();ctx.ellipse(cx,baseY+10*k,maxR*2,maxR*.36,0,0,7);ctx.fill();
    ctx.fillStyle='#0b100d';ctx.beginPath();ctx.ellipse(cx,baseY+6*k,maxR*1.45,maxR*.19,0,0,7);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.16)';ctx.lineWidth=dpr;ctx.stroke();
    // peça
    const ow=Math.ceil(maxR*2+8),oh=Math.ceil(vh+8);if(off.width!==ow||off.height!==oh){off.width=ow;off.height=oh}
    octx.globalCompositeOperation='source-over';octx.clearRect(0,0,ow,oh);
    const n=printP*N,count=Math.min(N,Math.ceil(n)),gap=Math.max(1,lh*.16),col=`rgb(${rgb})`,hot=`rgb(${rgb.map(v=>Math.round(v+(255-v)*.55))})`;
    for(let i=0;i<count;i++){const w=2*radius(i/(N-1))*k;octx.fillStyle=(i===count-1&&printP<1)?hot:col;octx.fillRect(ow/2-w/2,oh-4-(i+1)*lh,w,lh-gap)}
    octx.globalCompositeOperation='source-atop';
    const hx=.34+.16*Math.sin(spin),g=octx.createLinearGradient(0,0,ow,0);
    g.addColorStop(0,'rgba(0,0,0,.62)');g.addColorStop(Math.max(.05,hx-.2),'rgba(0,0,0,.08)');g.addColorStop(hx,'rgba(255,255,255,.34)');g.addColorStop(Math.min(.95,hx+.22),'rgba(255,255,255,0)');g.addColorStop(1,'rgba(0,0,0,.66)');
    octx.fillStyle=g;octx.fillRect(0,0,ow,oh);
    ctx.drawImage(off,cx-ow/2,baseY-oh+4);
    // bico
    const lift=ease(clamp((t-.74)/.08)),topY=baseY-count*lh,tr=radius(clamp(count/N))*k;
    const nx=cx+Math.sin(printP*N*1.35)*tr*.78,ny=topY-3*k-lift*vh*.6;
    if(lift<1){ctx.save();ctx.globalAlpha=fade*(1-lift);const s=k*1.1;
      const cg=ctx.createLinearGradient(nx-22*s,0,nx+22*s,0);cg.addColorStop(0,'#7b838e');cg.addColorStop(.35,'#f5f7fa');cg.addColorStop(.7,'#aab2bc');cg.addColorStop(1,'#5b636e');
      ctx.fillStyle='#161b19';ctx.fillRect(nx-30*s,ny-120*s,60*s,22*s);
      ctx.fillStyle=cg;ctx.beginPath();ctx.moveTo(nx-22*s,ny-98*s);ctx.lineTo(nx+22*s,ny-98*s);ctx.lineTo(nx+10*s,ny-26*s);ctx.lineTo(nx-10*s,ny-26*s);ctx.closePath();ctx.fill();
      ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(nx-10*s,ny-26*s);ctx.lineTo(nx+10*s,ny-26*s);ctx.lineTo(nx,ny-2*s);ctx.closePath();ctx.fill();
      const gl=ctx.createRadialGradient(nx,ny,0,nx,ny,26*s);gl.addColorStop(0,`rgba(${rgb},.85)`);gl.addColorStop(1,`rgba(${rgb},0)`);ctx.fillStyle=gl;ctx.beginPath();ctx.arc(nx,ny,26*s,0,7);ctx.fill();ctx.restore()}
    ctx.globalAlpha=1;
  }
  const CYCLE=9000;let start=performance.now(),raf=0,visible=true;
  function frame(now){
    raf=0;const el=Math.max(0,now-start),loop=Math.floor(el/CYCLE),t=(el%CYCLE)/CYCLE,v=LOOP[loop%LOOP.length],rgb=hex2rgb(v.swatch);
    hero.style.setProperty('--glow',`rgb(${rgb})`);
    draw(t,rgb,el/2600);
    if(visible&&!document.hidden)raf=requestAnimationFrame(frame);
  }
  const play=()=>{if(!raf&&!reduce)raf=requestAnimationFrame(frame)};
  resize();addEventListener('resize',()=>{resize();if(reduce)draw(.85,hex2rgb(LOOP[0].swatch),0)});
  new IntersectionObserver(es=>{visible=es[0].isIntersecting;if(visible)play()}).observe(hero);
  document.addEventListener('visibilitychange',play);
  if(reduce){hero.style.setProperty('--glow',LOOP[0].swatch);draw(.85,hex2rgb(LOOP[0].swatch),0)}else play();
})();
