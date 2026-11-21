    'use strict';
    const BASE=window.NP_PRODUCTS||[];
    // Preços sempre "redondos para cima": terminam em ,99 (84,93 vira 84,99; 85,00 continua 85,00).
    function priceUp(x){x=Math.round(Number(x)*100)/100;if(Math.abs(x-Math.round(x))<.005)return Math.round(x);const c=Math.ceil(x)-.01;return Math.round(c*100)/100}
    // Preço promocional: ,99 imediatamente abaixo, para o desconto anunciado ser de verdade (35% ou um pouco mais).
    function priceDown(x){const c=Math.floor(Number(x)+1e-9)-.01;return Math.max(.99,Math.round(c*100)/100)}
    // Promoção (data/promo.js): desconto real sobre o preço atual dos produtos impressos, válido entre as datas.
    const PROMO=(()=>{const p=window.NP_PROMO;if(!p||!p.off)return null;const now=new Date();if(p.starts&&now<new Date(p.starts+'T00:00:00-03:00'))return null;if(p.ends&&now>new Date(p.ends+'T23:59:59-03:00'))return null;return p})();
    function applyPromo(list){if(!PROMO)return list;for(const p of list){if(PROMO.categories&&!PROMO.categories.includes(p.category))continue;for(const v of p.variants){const base=Number(v.price);v.oldPrice=base;v.price=priceDown(base*(1-PROMO.off/100))}}return list}
    const STORAGE='nova_prime_3d_cart_v1';
    const fmt=x=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(x)||0);
    const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const safeUrl=u=>typeof u==='string'&&(/^assets\/products\/[\w-]+\.webp$/.test(u)||/^https:\/\/cf\.shopee\.com\.br\/file\//.test(u))?u:'';
    const FALLBACK='assets/fallback.svg';
    let state={products:applyPromo(structuredClone(BASE)),cart:[]};
    try{const saved=JSON.parse(localStorage.getItem(STORAGE));if(saved&&Array.isArray(saved.cart))state.cart=saved.cart.filter(l=>l&&(String(l.productId).startsWith('fil:')?!!(window.NP_FIL_INDEX||{})[String(l.productId).slice(4)]:state.products.some(p=>p.id===l.productId)));}catch(e){}
    let currentFilter='Todos',query='',sort='featured',openProductId='',qty=1,activeGallery=0,activeSlide=0,toastTimer;
    const $=id=>document.getElementById(id);const imgOf=p=>safeUrl(p.images?.[0])||FALLBACK;
    function persist(){try{localStorage.setItem(STORAGE,JSON.stringify({cart:state.cart}))}catch(e){}}
    const filaments=[{id:'fil_pla',title:'Flashforge PLA Basic',kind:'PLA',category:'Filamentos Basic',images:[]},{id:'fil_petg',title:'Flashforge PETG Basic',kind:'PETG',category:'Filamentos Basic',images:[]}];
    const ffVariants=[{"kind": "PLA", "color": "Amarelo", "image": "assets/filamentos/NP-FF-PLA-AMA.webp", "swatch": "#F2B51D", "sku": "NP-FF-PLA-AMA"}, {"kind": "PLA", "color": "Amarelo Claro", "image": "", "swatch": "#FADE89", "sku": "NP-FF-PLA-AMC"}, {"kind": "PLA", "color": "Azul", "image": "assets/filamentos/NP-FF-PLA-AZU.webp", "swatch": "#1454B9", "sku": "NP-FF-PLA-AZU"}, {"kind": "PLA", "color": "Branco", "image": "assets/filamentos/NP-FF-PLA-BRA.webp", "swatch": "#F6F6F1", "sku": "NP-FF-PLA-BRA"}, {"kind": "PLA", "color": "Cinza", "image": "assets/filamentos/NP-FF-PLA-CIN.webp", "swatch": "#788393", "sku": "NP-FF-PLA-CIN"}, {"kind": "PLA", "color": "Dourado", "image": "assets/filamentos/NP-FF-PLA-DOU.webp", "swatch": "#B59B54", "sku": "NP-FF-PLA-DOU"}, {"kind": "PLA", "color": "Marrom", "image": "assets/filamentos/NP-FF-PLA-MAR.webp", "swatch": "#92502C", "sku": "NP-FF-PLA-MAR"}, {"kind": "PLA", "color": "Preto", "image": "assets/filamentos/NP-FF-PLA-PRE.webp", "swatch": "#25262A", "sku": "NP-FF-PLA-PRE"}, {"kind": "PLA", "color": "Rosa", "image": "assets/filamentos/NP-FF-PLA-ROS.webp", "swatch": "#EA8EB9", "sku": "NP-FF-PLA-ROS"}, {"kind": "PLA", "color": "Roxo", "image": "assets/filamentos/NP-FF-PLA-ROX.webp", "swatch": "#7524B8", "sku": "NP-FF-PLA-ROX"}, {"kind": "PLA", "color": "Verde", "image": "assets/filamentos/NP-FF-PLA-VER.webp", "swatch": "#49BA51", "sku": "NP-FF-PLA-VER"}, {"kind": "PLA", "color": "Vermelho", "image": "assets/filamentos/NP-FF-PLA-VEM.webp", "swatch": "#D72F29", "sku": "NP-FF-PLA-VEM"}, {"kind": "PLA", "color": "Vermelho Claro", "image": "", "swatch": "#F67B72", "sku": "NP-FF-PLA-VMC"}, {"kind": "PETG", "color": "Preto", "image": "assets/filamentos/NP-FF-PETG-PRE.webp", "swatch": "#25262A", "sku": "NP-FF-PETG-PRE"}, {"kind": "PETG", "color": "Rosa", "image": "assets/filamentos/NP-FF-PETG-ROS.webp", "swatch": "#E992BB", "sku": "NP-FF-PETG-ROS"}, {"kind": "PETG", "color": "Verde", "image": "assets/filamentos/NP-FF-PETG-VER.webp", "swatch": "#36AD44", "sku": "NP-FF-PETG-VER"}];
        const spoolSvg=(type='PLA')=>`<svg class="spool" viewBox="0 0 260 255" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Carretel ilustrativo de filamento"><defs><linearGradient id="s${type}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${type==='PETG'?'#5d9e9c':'#4f74b7'}"/><stop offset="1" stop-color="${type==='PETG'?'#1b4f52':'#1d385f'}"/></linearGradient></defs><ellipse cx="139" cy="222" rx="92" ry="14" fill="#7191ba" opacity=".18"/><path d="M64 57C109 30 189 28 207 66v124c-41 26-112 25-153-6Z" fill="url(#s${type})"/><ellipse cx="64" cy="126" rx="44" ry="83" fill="#213954" stroke="#56769c" stroke-width="7"/><ellipse cx="64" cy="126" rx="28" ry="60" fill="#527094"/><ellipse cx="64" cy="126" rx="13" ry="35" fill="#122c4d" stroke="#90a6c4" stroke-width="3"/><path d="M108 65q56-17 95 6M106 78q61-16 100 7M106 91q61-17 100 7M106 104q61-17 100 7M106 117q61-17 100 7M106 130q61-17 100 7M106 143q61-17 100 7M106 156q61-17 100 7M106 169q61-17 100 7" fill="none" stroke="#9dc1ec" stroke-width="3" opacity=".31"/><text x="64" y="128" text-anchor="middle" fill="#eaf1fb" font-weight="800" font-size="8" font-family="Arial">FLASHFORGE</text></svg>`;
    function goodVariants(p){return p.variants.filter(v=>Number(v.stock)>0)}
    function minAvailable(p){const vv=goodVariants(p);return vv.length?Math.min(...vv.map(v=>Number(v.price))):null}
    function discountDetails(v){if(v.oldPrice&&Number(v.oldPrice)>Number(v.price)){let pct=Math.round((1-v.price/v.oldPrice)*100);return {old:v.oldPrice,pct,preview:false}}return null}
    function getFirstAvailable(p){return goodVariants(p).sort((a,b)=>a.price-b.price)[0]||p.variants[0]}
    function showToast(msg){clearTimeout(toastTimer);$('snack').textContent=msg;$('snack').classList.add('on');toastTimer=setTimeout(()=>$('snack').classList.remove('on'),2700)}
    let activeFilKind='PLA',selectedFilColor='';
    function showFilamentColors(id){
      activeFilKind=id==='fil_petg'?'PETG':'PLA';
      selectedFilColor=activeFilKind==='PLA'?'Azul':'Preto';
      $('filColorsTitle').textContent=`Flashforge ${activeFilKind} Basic`;
      $('filQty').value='1';
      renderColorSelector();
      openOverlay('filamentModal');
    }
    function showSelectedPhoto(v){
      const photo=$('filColorPic');
      const empty=$('filColorEmpty');
      const note=$('filColorNote');
      const expected=v?.image;
      const color=v?.swatch||'#eef3fa';
      // Nunca substituir uma cor por uma foto de outra cor.
      photo.removeAttribute('src');
      photo.hidden=true;
      empty.hidden=false;
      empty.querySelector('.emptySwatch').style.background=color;
      empty.querySelector('.emptyTitle').textContent=`${activeFilKind} Basic · ${v?.color||''}`;
      empty.querySelector('.emptyDesc').textContent='Foto desta cor em atualização';
      photo.alt=`Filamento Flashforge ${activeFilKind} Basic, cor ${v?.color||''}`;
      note.textContent='A imagem deve representar exatamente a cor escolhida.';
      if(!expected){return;}
      const expectedColor=v.color;
      const expectedKind=activeFilKind;
      const test=new Image();
      test.onload=()=>{
        if(selectedFilColor!==expectedColor||activeFilKind!==expectedKind)return;
        photo.src=expected;
        photo.hidden=false;
        empty.hidden=true;
        note.textContent='Imagem da cor selecionada · Produto Flashforge original';
      };
      test.onerror=()=>{
        if(selectedFilColor===expectedColor&&activeFilKind===expectedKind){
          note.textContent='Foto indisponível. Confirme o tom com nossa equipe.';
        }
      };
      test.src=expected;
    }
    function renderColorSelector(){
      const variants=ffVariants.filter(x=>x.kind===activeFilKind);
      const selected=variants.find(x=>x.color===selectedFilColor)||variants[0];
      if(!selected)return;
      selectedFilColor=selected.color;
      $('filColorsOptions').innerHTML=variants.map(x=>`<button type="button" class="colorOption ${x.color===selectedFilColor?'selected':''}" data-color="${esc(x.color)}" aria-pressed="${x.color===selectedFilColor}" aria-label="Cor ${esc(x.color)}"><i style="background:${esc(x.swatch)}"></i>${esc(x.color)}</button>`).join('');
      document.querySelectorAll('#filColorsOptions [data-color]').forEach(b=>b.onclick=()=>{
        selectedFilColor=b.dataset.color;
        renderColorSelector();
      });
      $('filColorName').textContent=`Cor escolhida: ${selectedFilColor}`;
      showSelectedPhoto(selected);
    }
    function addChosenFil(){const q=Math.min(99,Math.max(1,Number($('filQty').value)||1));addToCart(activeFilKind==='PLA'?'fil_pla':'fil_petg',`${selectedFilColor} · 1 kg`,q);closeAll();renderCart();openOverlay('cartDrawer')}
    const TINTS={'Natal e decoração':'#D9423A','Chaveiros e brindes':'#E8A30C','Casa e organização':'#1F6FEB','Peças e acessórios':'#2E9E5B'};
    const catTint=c=>TINTS[c]||'#1454B9';
    const cats=['Todos','Natal e decoração','Chaveiros e brindes','Casa e organização','Peças e acessórios'];
    function renderFilters(){const counts={};for(const p of state.products)counts[p.category]=(counts[p.category]||0)+1;$('filterBar').innerHTML=cats.map(c=>`<button type="button" class="chip" aria-pressed="${currentFilter===c}" data-cat="${esc(c)}">${esc(c)}<small>${c==='Todos'?state.products.length:(counts[c]||0)}</small></button>`).join('');document.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{currentFilter=b.dataset.cat;renderCatalog();renderFilters()});}
    let onlyFav=false,favs=new Set();try{favs=new Set(JSON.parse(localStorage.getItem('nova_prime_3d_fav_v1'))||[])}catch(e){}
    const saveFavs=()=>{try{localStorage.setItem('nova_prime_3d_fav_v1',JSON.stringify([...favs]))}catch(e){}};
    function updateFavUI(){const c=$('favCount');if(c){c.textContent=favs.size;c.hidden=!favs.size}const b=$('favBtn');if(b)b.setAttribute('aria-pressed',String(onlyFav))}
    function toggleFav(id){favs.has(id)?favs.delete(id):favs.add(id);saveFavs();updateFavUI();document.querySelectorAll(`[data-fav="${id}"]`).forEach(b=>{b.setAttribute('aria-pressed',String(favs.has(id)));b.setAttribute('aria-label',favs.has(id)?'Remover dos favoritos':'Salvar nos favoritos')});if(onlyFav)renderCatalog();showToast(favs.has(id)?'Salvo nos favoritos.':'Removido dos favoritos.')}
    const HEART='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.2-9.3C1.7 8 3.6 5 6.8 5c2 0 3.4 1.1 5.2 3 1.8-1.9 3.2-3 5.2-3 3.2 0 5.1 3 4 6.2-1.7 4.7-9.2 9.3-9.2 9.3z"/></svg>';
    const PLUS='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
    const shortName=p=>String(p.title).split('|')[0].trim()||p.title;
    function cardHTML(p){const v=getFirstAvailable(p),min=minAvailable(p),disc=v?discountDetails(v):null,name=shortName(p),n=p.variants.length,fav=favs.has(p.id);
      const stockTotal=p.variants.reduce((n,x)=>n+(Number(x.stock)||0),0);
      const badge=min===null?'<span class="badge muted">Esgotado</span>':disc?`<span class="badge promo">${PROMO?esc(PROMO.name)+' · ':''}-${disc.pct}%</span>`:p.featured?'<span class="badge">Destaque</span>':'';
      return `<article class="card"><div class="card-media"><button class="card-img" type="button" data-detail="${p.id}" aria-label="Ver detalhes de ${esc(name)}"><img loading="lazy" src="${esc(imgOf(p))}" alt="${esc(name)}" onerror="this.onerror=null;this.src='${FALLBACK}'"></button>${badge}<button class="fav" type="button" data-fav="${p.id}" aria-pressed="${fav}" aria-label="${fav?'Remover dos favoritos':'Salvar nos favoritos'}">${HEART}</button></div><div class="card-body"><p class="card-cat">${esc(p.category)}</p><p class="card-stock${stockTotal&&stockTotal<=10?' low':''}">${stockTotal?(stockTotal<=10?`Últimas ${stockTotal} unidades`:`${stockTotal} em estoque`):'Sem estoque'}</p><h3 class="card-title"><button type="button" data-detail="${p.id}">${esc(name)}</button></h3><div class="card-foot"><div class="card-price">${min===null?'<strong>Indisponível</strong>':`<small>${n>1?'a partir de':'por'}</small><strong>${fmt(min)}</strong>${disc?`<s>${fmt(disc.old)}</s>`:''}`}</div><button class="add" type="button" data-detail="${p.id}" aria-label="Escolher ${esc(name)}">${PLUS}</button></div></div></article>`}
    function renderCatalog(){let filtered=state.products.filter(p=>{const q=(p.title+' '+p.description+' '+p.category+' '+p.variants.map(v=>v.name).join(' ')).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),qq=query.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();return (currentFilter==='Todos'||p.category===currentFilter)&&q.includes(qq)&&(!onlyFav||favs.has(p.id))});filtered.sort((a,b)=>sort==='asc'?(minAvailable(a)??1e9)-(minAvailable(b)??1e9):sort==='desc'?(minAvailable(b)??0)-(minAvailable(a)??0):sort==='az'?a.title.localeCompare(b.title,'pt-BR'):Number(b.featured)-Number(a.featured)); $('productGrid').innerHTML=filtered.map(cardHTML).join('');document.querySelectorAll('.card-img').forEach(e=>{e.style.backgroundImage=`url("${FALLBACK}")`;e.style.backgroundPosition='center';e.style.backgroundSize='cover'});$('showingLabel').textContent=onlyFav?`${filtered.length} ${filtered.length===1?'favorito':'favoritos'}`:`Mostrando ${filtered.length} de ${state.products.length} produtos`; $('catalogCountLabel').textContent=`${filtered.length} produto${filtered.length!==1?'s':''}`;$('emptyResults').hidden=!!filtered.length;document.querySelectorAll('[data-detail]').forEach(b=>b.onclick=()=>openDetails(b.dataset.detail));document.querySelectorAll('[data-fav]').forEach(b=>b.onclick=e=>{e.stopPropagation();toggleFav(b.dataset.fav)}); }
    function openOverlay(id){document.querySelectorAll('.modal,.drawer').forEach(e=>{e.classList.remove('open');e.setAttribute('aria-hidden','true')});$('veil').classList.add('open');const el=$(id);el.classList.add('open');el.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';}
    function closeAll(){$('veil').classList.remove('open');document.querySelectorAll('.modal,.drawer').forEach(e=>{e.classList.remove('open');e.setAttribute('aria-hidden','true')});document.body.style.overflow='';}
    const normName=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
    function variantLabel(name){const parts=String(name).split(',');return {tone:parts[0].trim(),pack:parts.slice(1).join(',').trim()}}
    function optionGroups(p){const tones=[],packs=[];p.variants.forEach(v=>{const l=variantLabel(v.name);if(!tones.includes(l.tone))tones.push(l.tone);if(l.pack&&!packs.includes(l.pack))packs.push(l.pack)});
      const n2=packs.length?(/bon/i.test(packs.join())?'Capacidade':/un|kit|unid/i.test(packs.join())?'Quantidade':'Tamanho'):null;
      return {tones,packs,n1:p.optionName||'Opção',n2}}
    const optImage=(p,tone)=>{const o=p.optionImages||{};const k=Object.keys(o).find(k=>normName(k)===normName(tone));return k?o[k]:null};
    let pickTone='',pickPack='';
    function setMainImg(src){const im=$('detailImg');if(im.getAttribute('src')===src)return;im.classList.remove('swap');void im.offsetWidth;im.classList.add('swap');im.src=src;im.onerror=()=>{im.onerror=null;im.src=FALLBACK}}
    function openDetails(id){const p=state.products.find(p=>p.id===id);if(!p)return;openProductId=id;qty=1;
      const name=String(p.title).split('|')[0].trim()||p.title;
      $('detailCat').textContent=p.category;$('detailTitle').textContent=name;$('detailDesc').textContent=p.description;
      $('detailExternal').innerHTML=`<a href="https://shopee.com.br/product/232207419/${encodeURIComponent(p.id)}/" target="_blank" rel="noopener noreferrer">Ver anúncio na Shopee</a>`;
      document.querySelector('#productModal .pm-desc').open=false;
      const gal=[...p.images.map(u=>safeUrl(u)).filter(Boolean)];
      $('detailThumbs').innerHTML=gal.map((u,i)=>`<button type="button" data-thumb="${i}" class="${i===0?'selected':''}" aria-label="Foto ${i+1}"><img src="${esc(u)}" alt=""></button>`).join('');
      document.querySelectorAll('[data-thumb]').forEach(b=>b.onclick=()=>{setMainImg(gal[Number(b.dataset.thumb)]);document.querySelectorAll('[data-thumb]').forEach(q=>q.classList.toggle('selected',q===b))});
      $('detailImg').src=gal[0]||FALLBACK;$('detailImg').alt=name;
      $('variantSelect').innerHTML=p.variants.map((v,i)=>`<option value="${i}">${esc(v.name)}</option>`).join('');
      const first=p.variants.find(v=>v.stock>0)||p.variants[0];const l=variantLabel(first.name);pickTone=l.tone;pickPack=l.pack;
      syncVariant(p,false);openOverlay('productModal');}
    function findVariant(p,tone,pack){return p.variants.findIndex(v=>{const l=variantLabel(v.name);return l.tone===tone&&l.pack===pack})}
    function syncVariant(p,photo){let i=findVariant(p,pickTone,pickPack);
      if(i<0||!p.variants[i].stock){const alt=p.variants.findIndex(v=>{const l=variantLabel(v.name);return l.tone===pickTone&&v.stock>0});if(alt>=0){i=alt;pickPack=variantLabel(p.variants[i].name).pack}else if(i<0)i=0}
      $('variantSelect').value=String(i);qty=1;
      if(photo!==false){const im=optImage(p,pickTone);if(im){setMainImg(im);document.querySelectorAll('[data-thumb]').forEach(q=>q.classList.remove('selected'))}}
      renderVariantPicker();updateDetails()}
    function updateDetails(){const p=state.products.find(p=>p.id===openProductId);if(!p)return;const v=p.variants[Number($('variantSelect').value)]||p.variants[0];if(!v)return;
      qty=Math.max(1,Math.min(qty,Number(v.stock)||1));$('qtyValue').textContent=String(qty);const disc=discountDetails(v);
      $('detailPrice').textContent=fmt(v.price);$('detailOldPrice').innerHTML=disc?`<s>${fmt(disc.old)}</s><b>-${disc.pct}%</b>`:'';
      const bd=$('detailBadge');bd.hidden=!disc;if(disc)bd.textContent=`${typeof PROMO!=='undefined'&&PROMO?PROMO.name+' · ':''}-${disc.pct}%`;
      $('detailStock').textContent=v.stock>0?(v.stock<=10?`Últimas ${v.stock} unidades`:`${v.stock} em estoque`):'Esgotado nesta opção';$('detailStock').classList.toggle('low',v.stock<=10);
      $('detailAdd').disabled=v.stock<=0;$('detailAdd').textContent=v.stock>0?'Adicionar ao carrinho':'Esgotado'}
    function renderVariantPicker(){const p=state.products.find(x=>x.id===openProductId);if(!p)return;const g=optionGroups(p);const box=$('variantPicker');
      if(p.variants.length<2){box.innerHTML='';return}
      const toneOk=t=>p.variants.some(v=>variantLabel(v.name).tone===t&&v.stock>0);
      const packOk=k=>{const i=findVariant(p,pickTone,k);return i>=0&&p.variants[i].stock>0};
      let html=`<div class="opt"><p class="opt-label">${esc(g.n1)}: <b>${esc(pickTone)}</b></p><div class="opt-row">${g.tones.map(t=>{const im=optImage(p,t);return `<button type="button" class="chip-opt${im?' has-img':''}" data-tone="${esc(t)}" aria-pressed="${t===pickTone}" ${toneOk(t)?'':'disabled'}>${im?`<img src="${esc(im)}" alt="">`:''}<span>${esc(t)}</span></button>`}).join('')}</div></div>`;
      if(g.packs.length)html+=`<div class="opt"><p class="opt-label">${esc(g.n2)}: <b>${esc(pickPack)}</b></p><div class="opt-row">${g.packs.map(k=>`<button type="button" class="chip-opt" data-pack="${esc(k)}" aria-pressed="${k===pickPack}" ${packOk(k)?'':'disabled'}><span>${esc(k)}</span></button>`).join('')}</div></div>`;
      box.innerHTML=html;
      box.querySelectorAll('[data-tone]').forEach(b=>b.onclick=()=>{pickTone=b.dataset.tone;syncVariant(p)});
      box.querySelectorAll('[data-pack]').forEach(b=>b.onclick=()=>{pickPack=b.dataset.pack;syncVariant(p,false)})}
    function wholesaleQty(){return state.cart.filter(x=>x.productId.startsWith('fil:')).reduce((acc,x)=>acc+x.qty,0)}
    const filItem=id=>(window.NP_FIL_INDEX||{})[String(id).slice(4)];
    function filMargin(total){const P=window.NP_PRICING||{retail:20,tiers:[]};let m=P.retail;for(const t of P.tiers)if(total>=t.min)m=t.add;return m}
    function filPrice(item,total){return item.cost==null?null:priceUp(Number(item.cost)+filMargin(total||0))}
    function filTierLabel(total){const P=window.NP_PRICING||{tiers:[]};const t=[...P.tiers].reverse().find(t=>total>=t.min);return t?`atacado (a partir de ${t.min} carretéis)`:'varejo'}
    function currentLinePrice(line){if(line.productId.startsWith('fil:')){const it=filItem(line.productId);return it?filPrice(it,wholesaleQty()):0}const p=state.products.find(p=>p.id===line.productId);return p?.variants.find(v=>v.id===line.variantId)?.price??line.unitPrice??0}
    function addToCart(productId,variantId,quantity){const isFil=productId.startsWith('fil:'),fi=isFil?filItem(productId):null,p=isFil?fi:state.products.find(p=>p.id===productId);if(!p)return;const v=isFil?{id:variantId,name:variantId,price:filPrice(fi,1),stock:Number(fi.stock)||0}:p.variants.find(v=>v.id===variantId);if(!v||v.stock<=0){showToast('Esta variação está indisponível.');return;}const existing=state.cart.find(x=>x.productId===productId&&x.variantId===v.id);const current=existing?.qty||0;const allowed=Math.max(0,Math.min(Number(quantity),v.stock-current));if(!allowed){showToast('A quantidade máxima disponível já está no carrinho.');return;}if(existing)existing.qty+=allowed;else state.cart.push({productId,variantId:v.id,variantName:v.name,qty:allowed,unitPrice:v.price});persist();renderCart();showToast('Produto adicionado ao carrinho!');}
    function lineInfo(line){const fi=line.productId.startsWith('fil:')?filItem(line.productId):null;const p=fi?{title:`Filamento ${fi.brandName} ${fi.lineName}`}:state.products.find(x=>x.id===line.productId);return {p,price:currentLinePrice(line),image:fi?(fi.photo||'assets/brand/icone.svg'):imgOf(p||{images:[]})}}
    function renderCart(){const totalQty=state.cart.reduce((a,x)=>a+x.qty,0);$('cartCount').textContent=totalQty;$('cartTitleCount').textContent=`(${totalQty} ${totalQty===1?'item':'itens'})`;const filQty=wholesaleQty();const total=state.cart.reduce((sum,x)=>sum+currentLinePrice(x)*x.qty,0);$('cartTotal').textContent=fmt(total);$('cartHint').textContent=filQty?`Filamentos: ${filQty} ${filQty===1?'carretel':'carretéis'}, preço de ${filTierLabel(filQty)}. Acima de 5 carretéis o preço cai, e acima de 20 cai de novo. Frete e pagamento combinados com a vendedora.`:'Frete e pagamento são combinados diretamente com a vendedora pelo WhatsApp.';let arr=state.cart.map((line,i)=>{const {p,price,image}=lineInfo(line);return `<div class="cartItem"><img src="${esc(image)}" alt="" onerror="this.onerror=null;this.src='${FALLBACK}'"><div><strong>${esc(p?.title||line.productId)}</strong><p>${esc(line.variantName)}</p><div class="linePrice">${fmt(price)} / un. · ${fmt(price*line.qty)}</div><div class="qtyControls"><button data-qtydec="${i}">−</button><b>${line.qty}</b><button data-qtyinc="${i}">+</button></div></div><button class="trash" data-remove="${i}" aria-label="Remover item">×</button></div>`}).join('');$('cartItems').innerHTML=arr||'<div class="empty"><strong>Seu carrinho está vazio.</strong>Escolha um produto e adicione aqui para montar seu pedido.</div>';for(const id of ['sellerKarita','sellerIsabel'])$(id).disabled=!state.cart.length;document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{state.cart.splice(Number(b.dataset.remove),1);persist();renderCart()});document.querySelectorAll('[data-qtydec]').forEach(b=>b.onclick=()=>changeQty(Number(b.dataset.qtydec),-1));document.querySelectorAll('[data-qtyinc]').forEach(b=>b.onclick=()=>changeQty(Number(b.dataset.qtyinc),1));}
    function changeQty(i,d){const l=state.cart[i];if(!l)return;let max=9999;if(l.productId.startsWith('fil:')){max=Number(filItem(l.productId)?.stock)||0}else{const p=state.products.find(p=>p.id===l.productId);max=p?.variants.find(v=>v.id===l.variantId)?.stock||0;}l.qty+=d;if(l.qty<=0)state.cart.splice(i,1);else l.qty=Math.min(l.qty,max);persist();renderCart();}
    function orderText(name){let s=`Olá, ${name}! Quero fazer um pedido pela Nova Prime 3D.\n\n*Meu pedido:*\n`;state.cart.forEach(l=>{const {p,price}=lineInfo(l);s+=`• ${p?.title||l.productId}\n  Variação: ${l.variantName}\n  Quantidade: ${l.qty}\n  Subtotal: ${fmt(price*l.qty)}\n`;});s+=`\n*Total de produtos: ${fmt(state.cart.reduce((v,l)=>v+currentLinePrice(l)*l.qty,0))}*\n`;if(PROMO&&state.cart.some(l=>!l.productId.startsWith('fil:')))s+=`Preços com desconto de ${PROMO.name}.\n`;if(wholesaleQty())s+=`Filamentos: ${wholesaleQty()} carretéis, preço de ${filTierLabel(wholesaleQty())}.\n`;s+='\nQuero confirmar a disponibilidade, o frete e a forma de pagamento. Obrigado!';return s}
    function whatsapp(phone,message){window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`,'_blank','noopener,noreferrer')}
    function openService(kind){let design=kind==='design';$('serviceModalHeading').textContent=design?'Equipe de Design 3D':'Equipe de Vendas';$('serviceTitle').textContent=design?'Com quem você deseja criar seu projeto?':'Com quem você deseja conversar?';$('serviceDescription').textContent=design?'Conte sua ideia e escolha um dos nossos atendentes de Design 3D.':'Escolha uma vendedora para tirar dúvidas sobre produtos e disponibilidade.';let people=design?[['Samuel','62981667349'],['Geovane','62982459339']]:[['Karita','62994077839'],['Isabel','62994632427']];$('personList').innerHTML=people.map(([name,phone])=>`<button class="personChoice" data-phone="${phone}" data-name="${name}"><span class="avatar">${name[0]}</span><strong>${name}</strong><span>${design?'Design 3D':'Vendas'} · WhatsApp ↗</span></button>`).join('');document.querySelectorAll('[data-phone]').forEach(b=>b.onclick=()=>whatsapp(b.dataset.phone,design?`Olá, ${b.dataset.name}! Quero conversar sobre um projeto de Design 3D para a Nova Prime 3D.`:`Olá, ${b.dataset.name}! Gostaria de tirar uma dúvida sobre os produtos da Nova Prime 3D.`));openOverlay('serviceModal');}
    $('openCart').onclick=()=>{renderCart();openOverlay('cartDrawer')};$('veil').onclick=closeAll;document.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeAll);document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAll()});$('searchInput').oninput=e=>{query=e.target.value;renderCatalog();if(query.trim())$('catalogo').scrollIntoView({behavior:'smooth',block:'start'})};$('sortSelect').onchange=e=>{sort=e.target.value;renderCatalog()};$('contactBtn').onclick=()=>openService('sales');$('contactDesignBtn').onclick=()=>openService('design');$('variantSelect').onchange=()=>{qty=1;updateDetails()};$('qtyDec').onclick=()=>{qty=Math.max(1,qty-1);updateDetails()};$('qtyInc').onclick=()=>{qty++;updateDetails()};$('detailAdd').onclick=()=>{const p=state.products.find(p=>p.id===openProductId);const v=p?.variants[Number($('variantSelect').value)];if(v){addToCart(p.id,v.id,qty);closeAll();openOverlay('cartDrawer')}};
    $('sellerKarita').onclick=()=>whatsapp('62994077839',orderText('Karita'));
    $('sellerIsabel').onclick=()=>whatsapp('62994632427',orderText('Isabel'));
    renderFilters();renderCatalog();renderCart();

    $('toggleSearch').onclick=()=>{document.querySelector('.tophead').classList.toggle('searchOpen');if(document.querySelector('.tophead').classList.contains('searchOpen'))$('searchInput').focus()};
    $('floatContact').onclick=()=>openService('sales');
    $('addChosenFil').onclick=addChosenFil;
    $('filColorPic').onclick=()=>{if($('filColorPic').hidden||!$('filColorPic').src)return;$('zoomImg').src=$('filColorPic').src;$('zoomImg').alt=$('filColorPic').alt;$('zoomOverlay').hidden=false;document.body.style.overflow='hidden'};     $('detailImg').onclick=()=>{if(!$('detailImg').src)return;$('zoomImg').src=$('detailImg').src;$('zoomImg').alt=$('detailImg').alt;$('zoomOverlay').hidden=false;document.body.style.overflow='hidden'};
    const closeZoom=()=>{$('zoomOverlay').hidden=true;document.body.style.overflow=$('veil').classList.contains('open')?'hidden':''};
    $('closeZoom').onclick=closeZoom;$('zoomOverlay').onclick=e=>{if(e.target===$('zoomOverlay'))closeZoom()};
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('zoomOverlay').hidden)closeZoom()});
