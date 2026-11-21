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

  /* ---------- categorias no hero ---------- */
  const CATS=['Natal e decoração','Chaveiros e brindes','Casa e organização','Peças e acessórios'];
  const firstImg=c=>{const p=P.filter(x=>x.category===c).sort((a,b)=>Number(b.featured)-Number(a.featured))[0];return p?imgOf(p):''};
  const filImg=(ffVariants.find(v=>v.color==='Verde'&&v.image)||ffVariants.find(v=>v.image)||{}).image||'';
  $('heroCats').innerHTML=CATS.map(c=>{const n=P.filter(p=>p.category===c).length;return `<a class="cat" href="#catalogo" data-goto-cat="${esc(c)}"><img src="${esc(firstImg(c))}" alt="" loading="lazy"><span><b>${esc(c)}</b><small>${n} ${n===1?'produto':'produtos'}</small></span></a>`}).join('')
    +`<a class="cat" href="#filamentos"><img src="${esc(filImg)}" alt="" loading="lazy"><span><b>Filamentos</b><small>PLA e PETG Basic</small></span></a>`
    +`<a class="cat" href="#sob-medida"><i class="cat-icon" aria-hidden="true">+</i><span><b>Sob medida</b><small>Sua ideia em 3D</small></span></a>`;

  /* ---------- vitrine de Natal ---------- */
  const natal=P.filter(p=>p.category==='Natal e decoração').sort((a,b)=>Number(b.featured)-Number(a.featured)||(minAvailable(a)??1e9)-(minAvailable(b)??1e9)).slice(0,5);
  $('natalBento').innerHTML=natal.map((p,i)=>{const m=minAvailable(p);return `<button type="button" class="tile${i===0?' big':''}" data-detail="${p.id}"><img src="${esc(imgOf(p))}" alt="" loading="lazy"><span class="tile-info"><b>${esc(shortName(p))}</b>${m!==null?`<em>${p.variants.length>1?'a partir de ':''}${fmt(m)}</em>`:'<em>Esgotado</em>'}</span></button>`}).join('');

  /* ---------- carrossel de mais procurados ---------- */
  const rail=$('rail');
  rail.innerHTML=P.filter(p=>p.featured).map(cardHTML).join('');
  document.querySelectorAll('[data-rail]').forEach(b=>b.onclick=()=>rail.scrollBy({left:Number(b.dataset.rail)*rail.clientWidth*.8,behavior:reduce?'auto':'smooth'}));
  function bindCards(root){root.querySelectorAll('[data-detail]').forEach(b=>b.onclick=()=>openDetails(b.dataset.detail));root.querySelectorAll('[data-fav]').forEach(b=>b.onclick=e=>{e.stopPropagation();toggleFav(b.dataset.fav)})}
  bindCards(rail);bindCards($('natalBento'));

  /* ---------- filamentos ---------- */
  function openFilament(kind,color){activeFilKind=kind;selectedFilColor=color;$('filColorsTitle').textContent=`Flashforge ${kind} Basic`;$('filQty').value='1';renderColorSelector();openOverlay('filamentModal')}
  window.openFilament=openFilament;
  $('filList').innerHTML=['PLA','PETG'].map(k=>`<div class="fil-kind"><h3>${k} Basic</h3><div class="fil-grid">${ffVariants.filter(v=>v.kind===k).map(v=>`<button type="button" class="fil" data-kind="${k}" data-color="${esc(v.color)}"><span class="fil-pic" style="--c:${v.swatch}">${v.image?`<img src="${esc(v.image)}" alt="">`:''}</span><span class="fil-name"><i style="--c:${v.swatch}"></i>${esc(v.color)}</span></button>`).join('')}</div></div>`).join('');
  document.querySelectorAll('.fil').forEach(b=>b.onclick=()=>openFilament(b.dataset.kind,b.dataset.color));

  /* ---------- favoritos no topo ---------- */
  $('favBtn').onclick=()=>{onlyFav=!onlyFav;if(onlyFav)currentFilter='Todos';updateFavUI();renderFilters();renderCatalog();$('catalogo').scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'})};
  updateFavUI();

  /* ---------- topo com sombra ao rolar ---------- */
  const head=document.querySelector('.tophead');
  const onScroll=()=>head.classList.toggle('scrolled',scrollY>8);addEventListener('scroll',onScroll,{passive:true});onScroll();

  /* ---------- hero: vídeo (quando existir) ou impressão desenhada em loop ---------- */
  const hero=document.querySelector('.cine'),cv=$('heroCanvas'),video=$('heroVideo');
  const saveData=navigator.connection&&navigator.connection.saveData;
  const cfg=window.NP_HERO_VIDEO;
  if(cfg){
    if(cfg.poster)video.poster=cfg.poster;
    video.hidden=false;cv.hidden=true;
    if(!reduce&&!saveData){video.src=narrow()&&cfg.mobile?cfg.mobile:cfg.desktop;video.preload='auto';
      new IntersectionObserver(es=>{es[0].isIntersecting?video.play().catch(()=>{}):video.pause()}).observe(hero)}
    return;
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
