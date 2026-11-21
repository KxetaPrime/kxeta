'use strict';
/* Hero "impressão pelo scroll".
   - Enquanto o vídeo do Higgsfield não existe (window.NP_SEQ === null), a peça é desenhada em código no canvas.
   - Com window.NP_SEQ definido, o canvas passa a desenhar os quadros do vídeo (branco sobre preto) e aplica a cor por multiplicação.
   Depende de: ffVariants (app.js) e window.openFilament (design.js). */
(function(){
  const q=s=>document.querySelector(s),clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)),ease=t=>t*t*(3-2*t);
  const story=q('#inicio'),cv=q('#storyCanvas');
  if(!story||!cv)return;
  const ctx=cv.getContext('2d'),head=q('.tophead'),bar=q('#storyBar');
  const chaps=[...document.querySelectorAll('.chap')];
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isNarrow=()=>innerWidth<760;

  /* ---------- cores ---------- */
  const hex2rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
  const toHsl=h=>{let[r,g,b]=hex2rgb(h).map(v=>v/255);const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;let H=0,S=0;if(mx!==mn){const d=mx-mn;S=l>.5?d/(2-mx-mn):d/(mx+mn);H=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;H*=60}return[H,S*100,l*100]};
  const mix=(a,b,t)=>a.map((v,i)=>Math.round(v+(b[i]-v)*t));
  let kind='PLA',colorName='Verde',locked=false;
  const list=()=>ffVariants.filter(v=>v.kind===kind);
  const find=()=>list().find(v=>v.color===colorName)||list()[0];
  let rgb=hex2rgb(find().swatch),rgbTarget=rgb.slice();

  function applyTheme(v){
    const[H,S,L]=toHsl(v.swatch),dark=L<26,r=document.documentElement.style;
    r.setProperty('--fil',v.swatch);
    r.setProperty('--hero-bg',`hsl(${H.toFixed(0)} ${Math.min(S,62).toFixed(0)}% ${dark?9:11}%)`);
    r.setProperty('--hero-glow',`hsl(${H.toFixed(0)} ${Math.min(Math.max(S,18),70).toFixed(0)}% ${dark?34:Math.min(Math.max(L*.5,17),25).toFixed(0)}%)`);
  }
  function setColor(name,fromUser){
    const prev=colorName;colorName=name;const v=find();colorName=v.color;rgbTarget=hex2rgb(v.swatch);
    if(fromUser)locked=true;
    q('#heroColorName').textContent=v.color;q('#heroColorMeta').textContent=`${kind==='PLA'?'PLA':'PETG'} Basic, 1 kg`;
    document.querySelectorAll('#heroSwatches .sw').forEach(b=>b.setAttribute('aria-checked',String(b.dataset.color===v.color)));
    applyTheme(v);if(prev!==v.color)kick();
  }
  function renderSwatches(){
    q('#heroSwatches').innerHTML=list().map(x=>`<button type="button" class="sw" role="radio" aria-checked="${x.color===colorName}" aria-label="${x.color}" title="${x.color}" data-color="${x.color}" style="--c:${x.swatch}"></button>`).join('');
    document.querySelectorAll('#heroSwatches .sw').forEach(b=>b.onclick=()=>setColor(b.dataset.color,true));
  }
  document.querySelectorAll('.kindtabs button').forEach(b=>b.onclick=()=>{kind=b.dataset.kind;document.querySelectorAll('.kindtabs button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderSwatches();setColor(colorName,true)});
  q('#heroBuy').onclick=()=>window.openFilament&&window.openFilament(kind,colorName);

  /* ---------- canvas ---------- */
  let W=0,H=0,dpr=1;
  function resize(){dpr=Math.min(devicePixelRatio||1,isNarrow()?1.5:2);const r=cv.getBoundingClientRect();W=Math.max(1,Math.round(r.width*dpr));H=Math.max(1,Math.round(r.height*dpr));cv.width=W;cv.height=H;kick()}
  const PROFILE=[[0,44],[.1,62],[.36,100],[.62,80],[.84,40],[.93,42],[1,62]];
  const radius=t=>{for(let i=1;i<PROFILE.length;i++){const[a,ra]=PROFILE[i-1],[b,rb]=PROFILE[i];if(t<=b){const u=(t-a)/(b-a);return ra+(rb-ra)*u*u*(3-2*u)}}return PROFILE[PROFILE.length-1][1]};
  const off=document.createElement('canvas'),octx=off.getContext('2d');
  const N=96;

  function drawProcedural(printP,p){
    ctx.clearRect(0,0,W,H);
    const narrow=isNarrow(),cx=W*(narrow?.5:.66),baseY=H*(narrow?.7:.84),vh=H*(narrow?.4:.62),k=vh/434,lh=vh/N,maxR=100*k;
    const n=printP*N,full=Math.floor(n),frac=n-full;
    // mesa de impressão
    const gx=ctx.createRadialGradient(cx,baseY+10*k,0,cx,baseY+10*k,maxR*1.9);gx.addColorStop(0,'rgba(255,255,255,.16)');gx.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=gx;ctx.beginPath();ctx.ellipse(cx,baseY+10*k,maxR*1.9,maxR*.34,0,0,7);ctx.fill();
    ctx.fillStyle='#0d1210';ctx.beginPath();ctx.ellipse(cx,baseY+6*k,maxR*1.5,maxR*.2,0,0,7);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.22)';ctx.lineWidth=dpr;ctx.beginPath();ctx.ellipse(cx,baseY+6*k,maxR*1.5,maxR*.2,0,0,7);ctx.stroke();
    // peça (offscreen, para aplicar o sombreamento só sobre ela)
    const ow=Math.ceil(maxR*2+8),oh=Math.ceil(vh+8);
    if(off.width!==ow||off.height!==oh){off.width=ow;off.height=oh}
    octx.globalCompositeOperation='source-over';octx.clearRect(0,0,ow,oh);
    const col=`rgb(${rgb[0]},${rgb[1]},${rgb[2]})`,hot=`rgb(${mix(rgb,[255,255,255],.55)})`,gap=Math.max(1,lh*.16),ox=ow/2;
    const count=Math.min(N,full+(frac>0?1:0));
    for(let i=0;i<count;i++){
      const w=2*radius(i/(N-1))*k,y=oh-4-(i+1)*lh,top=(i===count-1&&printP<1);
      octx.fillStyle=top?hot:col;octx.fillRect(ox-w/2,y,w,lh-gap);
    }
    // sombreamento que "gira" com o scroll
    octx.globalCompositeOperation='source-atop';
    const hx=.32+.2*Math.sin(p*Math.PI*1.6),g=octx.createLinearGradient(0,0,ow,0);
    g.addColorStop(0,'rgba(0,0,0,.62)');g.addColorStop(Math.max(.05,hx-.2),'rgba(0,0,0,.08)');g.addColorStop(hx,'rgba(255,255,255,.34)');g.addColorStop(Math.min(.95,hx+.22),'rgba(255,255,255,0)');g.addColorStop(1,'rgba(0,0,0,.66)');
    octx.fillStyle=g;octx.fillRect(0,0,ow,oh);
    ctx.drawImage(off,cx-ow/2,baseY-oh+4);
    // bico
    const lift=ease(clamp((p-.53)/.07)),topY=baseY-count*lh,tr=radius(clamp(count/N))*k;
    const nx=cx+Math.sin(printP*N*1.35)*tr*.78,ny=topY-3*k-lift*vh*.55,a=1-lift;
    if(a>0.01){
      ctx.save();ctx.globalAlpha=a;const s=k*1.15;
      const cg=ctx.createLinearGradient(nx-22*s,0,nx+22*s,0);cg.addColorStop(0,'#7b838e');cg.addColorStop(.35,'#f5f7fa');cg.addColorStop(.7,'#aab2bc');cg.addColorStop(1,'#5b636e');
      ctx.fillStyle='#161b19';ctx.fillRect(nx-30*s,ny-120*s,60*s,22*s);
      ctx.fillStyle=cg;ctx.beginPath();ctx.moveTo(nx-22*s,ny-98*s);ctx.lineTo(nx+22*s,ny-98*s);ctx.lineTo(nx+10*s,ny-26*s);ctx.lineTo(nx-10*s,ny-26*s);ctx.closePath();ctx.fill();
      ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(nx-10*s,ny-26*s);ctx.lineTo(nx+10*s,ny-26*s);ctx.lineTo(nx,ny-2*s);ctx.closePath();ctx.fill();
      const gl=ctx.createRadialGradient(nx,ny,0,nx,ny,26*s);gl.addColorStop(0,`rgba(${rgb},.85)`);gl.addColorStop(1,`rgba(${rgb},0)`);ctx.fillStyle=gl;ctx.beginPath();ctx.arc(nx,ny,26*s,0,7);ctx.fill();
      ctx.restore();
    }
  }

  /* ---- modo vídeo: sequência de quadros ---- */
  let seq=null;
  function loadSeq(){
    const cfg=window.NP_SEQ;if(!cfg)return;
    const c=isNarrow()&&cfg.mobile?cfg.mobile:cfg.desktop;if(!c)return;
    seq={cfg:c,imgs:new Array(c.count),ok:0};cv.classList.add('seq');
    // carrega primeiro quadro, o do meio e o último; depois o resto em ordem
    const order=[0,Math.floor(c.count/2),c.count-1];for(let i=0;i<c.count;i++)if(!order.includes(i))order.push(i);
    let k=0;const next=()=>{if(k>=order.length)return;const i=order[k++],im=new Image();im.decoding='async';im.onload=()=>{seq.imgs[i]=im;seq.ok++;kick();next()};im.onerror=next;im.src=`${c.path}${String(i+1).padStart(3,'0')}.${c.ext}`};
    next();next();
  }
  function drawSeq(printP){
    ctx.clearRect(0,0,W,H);ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
    const want=Math.round(printP*(seq.cfg.count-1));let im=null;
    for(let d=0;d<seq.cfg.count&&!im;d++)im=seq.imgs[want-d]||seq.imgs[want+d];
    if(!im)return false;
    const narrow=isNarrow(),s=Math.max(W/im.width,H/im.height)*(narrow?1:1),dw=im.width*s,dh=im.height*s,cx=W*(narrow?.5:.64);
    ctx.drawImage(im,cx-dw/2,H/2-dh/2,dw,dh);
    ctx.globalCompositeOperation='multiply';ctx.fillStyle=`rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation='source-over';
    return true;
  }

  /* ---------- capítulos e progresso ---------- */
  const win=(p,a,b,c,d)=>p<a||p>d?0:p<b?ease((p-a)/(b-a)):p<=c?1:ease(1-(p-c)/(d-c));
  const WINDOWS=[[-1,-.5,.09,.17],[.13,.2,.4,.5],[.55,.62,.8,.87],[.89,.94,1.01,1.02]];
  function render(p){
    const printP=ease(clamp((p-.03)/.5));
    if(!locked&&p>.56){const L=list(),i=Math.min(L.length-1,Math.floor(clamp((p-.58)/.28)*L.length));if(L[i].color!==colorName)setColor(L[i].color,false)}
    document.documentElement.style.setProperty('--bp',clamp(p/.14).toFixed(3));
    chaps.forEach((c,i)=>{const[a,b,d,e]=WINDOWS[i],o=win(p,a,b,d,e);c.style.opacity=o.toFixed(3);c.style.transform=`translateY(${((1-o)*18).toFixed(1)}px)`;c.classList.toggle('on',o>.6);c.setAttribute('aria-hidden',o<.3?'true':'false')});
    bar.style.transform=`scaleX(${p.toFixed(4)})`;
    if(seq&&seq.ok){if(!drawSeq(printP))drawProcedural(printP,p)}else drawProcedural(printP,p);
  }

  let cur=0,tgt=0,raf=0,inView=true;
  const target=()=>{const r=story.getBoundingClientRect(),total=story.offsetHeight-innerHeight;return total>0?clamp(-r.top/total):1};
  function tick(){
    raf=0;tgt=reduce?1:target();
    cur+=(tgt-cur)*(reduce?1:.16);if(Math.abs(tgt-cur)<.0005)cur=tgt;
    let moving=cur!==tgt;
    for(let i=0;i<3;i++){const d=rgbTarget[i]-rgb[i];if(Math.abs(d)>.6){rgb[i]+=d*.14;moving=true}else rgb[i]=rgbTarget[i]}
    render(cur);
    if(moving&&inView)raf=requestAnimationFrame(tick);
  }
  function kick(){if(!raf)raf=requestAnimationFrame(tick)}
  addEventListener('scroll',()=>{kick();const r=story.getBoundingClientRect();head.classList.toggle('solid',r.bottom<90)},{passive:true});
  addEventListener('resize',resize);
  new IntersectionObserver(es=>{inView=es[0].isIntersecting;if(inView)kick()},{rootMargin:'200px'}).observe(story);

  renderSwatches();setColor(colorName,false);resize();loadSeq();
  if(reduce){chaps.forEach((c,i)=>{c.style.display=i===3?'block':'none'})}
  kick();
})();
