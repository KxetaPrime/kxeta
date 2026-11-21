"""Atualiza os dados estruturados (JSON-LD) do index.html com os produtos e preços atuais.
Uso: python3 tools/seo.py  (rode depois de mudar produtos ou promoção)."""
import json,os,re,math,datetime
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
P=json.load(open('data/products.json',encoding='utf8'))
promo=re.search(r"off:\s*(\d+).*?ends:\s*'([\d-]+)'",open('data/promo.js',encoding='utf8').read(),re.S)
off,ends=(int(promo.group(1)),promo.group(2)) if promo and 'NP_PROMO = null' not in open('data/promo.js').read() else (0,None)
def down(x):return max(.99,math.floor(x+1e-9)-.01)
items=[]
for i,p in enumerate(P):
    vs=[v for v in p['variants'] if v['stock']>0] or p['variants']
    lo=min(v['price'] for v in vs);hi=max(v['price'] for v in vs)
    if off and ends and datetime.date.today()<=datetime.date.fromisoformat(ends):lo,hi=down(lo*(1-off/100)),down(hi*(1-off/100))
    items.append({"@type":"ListItem","position":i+1,"item":{"@type":"Product","name":p['title'].split('|')[0].strip(),"image":p['images'][0],"category":p['category'],"sku":p['id'],
      "offers":{"@type":"AggregateOffer","priceCurrency":"BRL","lowPrice":f"{lo:.2f}","highPrice":f"{hi:.2f}","offerCount":len(p['variants']),
        "availability":"https://schema.org/InStock" if any(v['stock']>0 for v in p['variants']) else "https://schema.org/OutOfStock"}}})
ld={"@context":"https://schema.org","@graph":[{"@type":"Store","name":"Nova Prime 3D","description":"Peças impressas em 3D, filamentos Flashforge, Bambu Lab e Masterprint e projetos sob medida.","priceRange":"R$","currenciesAccepted":"BRL"},
    {"@type":"ItemList","name":"Produtos impressos em 3D","itemListElement":items}]}
h=open('index.html',encoding='utf8').read()
block='<script type="application/ld+json" id="ld">'+json.dumps(ld,ensure_ascii=False)+'</script>'
h=re.sub(r'<script type="application/ld\+json" id="ld">.*?</script>',block,h,flags=re.S) if 'id="ld"' in h else h.replace('</head>','  '+block+'\n</head>')
open('index.html','w',encoding='utf8').write(h);print('JSON-LD com',len(items),'produtos')
