'use strict';
/* Busca com sugestões (produtos e cores de filamento) e links diretos para produto/filamento.
   Depende de app.js (state, openDetails, renderCatalog, fmt, esc, imgOf, minAvailable, filPrice, showToast)
   e de filaments.js (window.openFilamentBrand). */
(function(){
  const $=id=>document.getElementById(id);
  const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
  const short=t=>String(t).split('|')[0].trim();
  const input=$('searchInput'),finder=input.closest('.finder');

  /* ---------- índice ---------- */
  const IDX=[];
  state.products.forEach(p=>{const m=minAvailable(p);IDX.push({kind:'p',id:p.id,title:short(p.title),sub:p.category,img:thumbOf(p),price:m,out:m===null,
    text:norm([p.title,p.category,p.variants.map(v=>v.name).join(' ')].join(' '))})});
  (window.NP_FIL||[]).forEach(b=>b.lines.forEach(l=>l.colors.forEach(c=>{IDX.push({kind:'f',brand:b.id,sku:c.sku,title:`${b.name} ${l.name} ${c.name}`,sub:Number(c.stock)>0?`Filamento 1 kg · ${c.stock} em estoque`:'Filamento 1 kg · sem estoque',
    img:c.photo,price:c.cost!=null?filPrice(c,1):null,out:!(Number(c.stock)>0),text:norm(`filamento carretel ${b.name} ${l.name} ${c.name}`)})})));

  function search(q){const words=norm(q).split(/\s+/).filter(Boolean);if(!words.length)return[];
    const hit=IDX.filter(x=>words.every(w=>x.text.includes(w)));
    const score=x=>(x.out?2:0)+(norm(x.title).startsWith(words[0])?0:1);
    const ps=hit.filter(x=>x.kind==='p').sort((a,b)=>score(a)-score(b)).slice(0,4),fs=hit.filter(x=>x.kind==='f').sort((a,b)=>score(a)-score(b)).slice(0,4);
    return {ps,fs,total:hit.length}}

  /* ---------- sugestões ---------- */
  const box=document.createElement('div');box.className='suggest';box.id='suggest';box.setAttribute('role','listbox');box.hidden=true;finder.appendChild(box);
  input.setAttribute('aria-controls','suggest');input.setAttribute('aria-autocomplete','list');
  let sel=-1;
  const row=x=>`<button type="button" class="sg-item${x.out?' out':''}" role="option" data-k="${x.kind}" ${x.kind==='p'?`data-id="${x.id}"`:`data-brand="${x.brand}" data-sku="${x.sku}"`}><img src="${esc(x.img)}" alt="" loading="lazy"><span class="sg-t"><b>${esc(x.title)}</b><small>${esc(x.sub)}</small></span><span class="sg-p">${x.price!=null?fmt(x.price):x.out?'Esgotado':''}</span></button>`;
  function render(){const q=input.value.trim();if(q.length<2){box.hidden=true;return}
    const r=search(q);sel=-1;
    if(!r.total){box.innerHTML=`<p class="sg-empty">Nada encontrado para “${esc(q)}”. Tente outra palavra ou fale com uma vendedora.</p>`;box.hidden=false;return}
    box.innerHTML=(r.ps.length?`<p class="sg-h">Produtos</p>${r.ps.map(row).join('')}`:'')+(r.fs.length?`<p class="sg-h">Filamentos</p>${r.fs.map(row).join('')}`:'')
      +(r.ps.length?`<button type="button" class="sg-all" data-all>Ver todos os produtos com “${esc(q)}”</button>`:'');
    box.hidden=false;
    box.querySelectorAll('.sg-item').forEach(b=>b.onclick=()=>choose(b));const all=box.querySelector('[data-all]');if(all)all.onclick=showAll}
  function choose(b){box.hidden=true;input.blur();if(b.dataset.k==='p')openDetails(b.dataset.id);else window.openFilamentBrand&&window.openFilamentBrand(b.dataset.brand,b.dataset.sku)}
  function showAll(){box.hidden=true;query=input.value;renderCatalog();$('catalogo').scrollIntoView({behavior:'smooth',block:'start'})}
  input.oninput=()=>{query=input.value;renderCatalog();render()};
  input.addEventListener('focus',render);
  input.addEventListener('keydown',e=>{const items=[...box.querySelectorAll('.sg-item')];
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){if(!items.length)return;e.preventDefault();sel=(sel+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;items.forEach((b,i)=>b.classList.toggle('on',i===sel));items[sel].scrollIntoView({block:'nearest'})}
    else if(e.key==='Enter'){e.preventDefault();if(sel>=0&&items[sel])choose(items[sel]);else showAll()}
    else if(e.key==='Escape'){box.hidden=true}});
  document.addEventListener('pointerdown',e=>{if(!finder.contains(e.target))box.hidden=true});

  /* ---------- links diretos e compartilhar ---------- */
  const SHARE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>';
  async function share(hash,title){const url=location.href.split('#')[0]+'#'+hash;
    if(navigator.share){try{await navigator.share({title,url});return}catch(e){if(e&&e.name==='AbortError')return}}
    try{await navigator.clipboard.writeText(url);showToast('Link copiado. Cole no WhatsApp para enviar.')}catch(e){prompt('Copie o link:',url)}}
  const pTitle=$('detailTitle');const pb=document.createElement('button');pb.type='button';pb.className='share-btn';pb.innerHTML=SHARE+'<span>Compartilhar</span>';
  pb.onclick=()=>share('p-'+openProductId,pTitle.textContent);document.querySelector('.pm-cat').after(pb);
  const fb=document.createElement('button');fb.type='button';fb.className='share-btn';fb.innerHTML=SHARE+'<span>Compartilhar</span>';
  fb.onclick=()=>{const c=document.querySelector('#fpSwatches [aria-checked="true"]'),i=c?Number(c.dataset.i):0,b=(window.NP_FIL||[]).find(b=>b.name===$('fpBrand').textContent);
    const l=b&&b.lines.find(l=>`${b.name} ${l.name}`===$('fpTitle').textContent);const col=l&&l.colors[i];if(col)share(`f-${b.id}-${col.sku}`,`${$('fpTitle').textContent} ${col.name}`)};
  document.querySelector('.fp-brand').appendChild(fb);
  function openFromHash(){const h=decodeURIComponent(location.hash.slice(1));let m;
    if((m=h.match(/^p-(\d+)$/))&&state.products.some(p=>p.id===m[1]))setTimeout(()=>openDetails(m[1]),150);
    else if((m=h.match(/^f-([a-z]+)-(.+)$/)))setTimeout(()=>window.openFilamentBrand&&window.openFilamentBrand(m[1],m[2]),150)}
  addEventListener('hashchange',openFromHash);openFromHash();
})();
