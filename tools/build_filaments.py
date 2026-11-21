"""Gera data/filaments.js a partir do catálogo do fornecedor e baixa as fotos oficiais.
Uso: python3 tools/build_filaments.py  (precisa de acesso a www.flashforge.com, cdn.shopify.com,
us.store.bambulab.com e store.bblcdn.com). Edite CATALOGO abaixo quando o fornecedor mandar lista nova."""
import json,subprocess,io,os,re,html as H,sys
from PIL import Image
from concurrent.futures import ThreadPoolExecutor
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));os.chdir(ROOT)
CACHE=sys.argv[1] if len(sys.argv)>1 else '/tmp/np-fil-cache'
os.makedirs(CACHE,exist_ok=True)
RAW=os.path.join(CACHE,'raw')
for d in ('flashforge','bambulab'):os.makedirs(os.path.join(RAW,d),exist_ok=True)
os.makedirs('assets/filamentos/studio',exist_ok=True)
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import studio

def get(u,minb=2000):
    r=subprocess.run(['curl','-sS','-L','--max-time','60','--retry','3',u],capture_output=True)
    if r.returncode or len(r.stdout)<minb: return None
    return r.stdout
def img(u,minb=2000):
    d=get(u,minb)
    if not d: return None
    try: Image.open(io.BytesIO(d)).verify(); return d
    except Exception: return None
def save(data,out):
    im=Image.open(io.BytesIO(data));im=im.convert('RGBA') if im.mode in('RGBA','LA','P') else im.convert('RGB')
    im.thumbnail((1200,1200),Image.LANCZOS);im.save(out,'WEBP',quality=84,method=6);return im.size
def avg(u):
    im=Image.open(io.BytesIO(img(u,40))).convert('RGB');w,h=im.size
    return '#%02X%02X%02X'%im.crop((w//4,h//4,3*w//4,3*h//4)).resize((1,1),Image.BOX).getpixel((0,0))
def cached(name,url):
    p=os.path.join(CACHE,name)
    if not os.path.exists(p): open(p,'wb').write(get(url,1000) or b'')
    return open(p,encoding='utf8',errors='ignore').read()

FF=json.loads(cached('ff.json','https://www.flashforge.com/products.json?limit=250'))['products']
def ff(handle,title):
    p=[x for x in FF if x['handle']==handle][0]
    for v in p['variants']:
        if v['title']==title and v.get('featured_image'): return v['featured_image']['src'].split('?')[0]
    col=title.split(' / ')[-1]
    for i in p['images']:
        n=i['src'].split('/')[-1].split('?')[0].replace('_',' ').replace('-',' ')
        if re.search(r'\b'+col+r'\b',n,re.I) and 'basic' in n.lower(): return i['src'].split('?')[0]
def bl(handle,product):
    s=cached(handle+'.html','https://us.store.bambulab.com/products/'+handle);t=s.replace('\\"','"').replace('\\/','/')
    var={}
    for m in re.finditer(r'"image":\s*"([^"]+)",\s*"name":\s*"'+product+r' - ([^"(]+?) ?\((\d+)\) / ([^"/]+?) / 1kg"',t):
        u,name,code,kind=m.groups();var.setdefault(name.strip(),{'code':code,'imgs':{}})['imgs'][kind.strip()]=u
    sw={}
    for m in re.finditer(r'<li value="([^"(]+?) ?\((\d+)\)"[^>]*><img src="([^"]+)"',s): sw.setdefault(m.group(1).strip(),H.unescape(m.group(3)))
    return var,sw
BL={'bl-pla':bl('pla-basic-filament','PLA Basic'),'bl-petg':bl('petg-basic','PETG Basic')}

EN={'Amarelo':'Yellow','Azul':'Blue','Branco':'White','Cinza':'Gray','Dourado':'Gold','Marrom':'Brown','Preto':'Black','Rosa':'Pink','Roxo':'Purple','Verde':'Green','Vermelho':'Red'}
# (marca, id da linha, nome, descrição, [(artigo, cor, estoque, custo, [nome oficial Bambu])], hex por cor, foto oficial Flashforge)
CATALOGO=[
 ('flashforge','ff-pla','PLA Basic','Fácil de imprimir e com ótimo acabamento. Para decoração, protótipos e peças do dia a dia.',[
   ('233342','Amarelo',1,64.93),('233343','Amarelo Claro',3,64.93),('233340','Azul',2,64.93),('233335','Branco',19,75.45),('233349','Cinza',10,64.93),('233350','Dourado',15,64.93),
   ('233348','Marrom',10,64.93),('233345','Preto',15,64.93),('233344','Rosa',13,64.93),('233347','Roxo',1,64.93),('233338','Verde',1,64.93),('233336','Vermelho',8,64.93),('233337','Vermelho Claro',2,64.93)],
   {'Amarelo':'#F2B51D','Amarelo Claro':'#FADE89','Azul':'#1454B9','Branco':'#F6F6F1','Cinza':'#788393','Dourado':'#B59B54','Marrom':'#92502C','Preto':'#25262A','Rosa':'#EA8EB9','Roxo':'#7524B8','Verde':'#49BA51','Vermelho':'#D72F29','Vermelho Claro':'#F67B72'},
   lambda c:('pla-basic',f'Basic / {EN[c]}') if c in EN else None),
 ('flashforge','ff-pla-mate','PLA Mate','Acabamento fosco que disfarça as linhas de camada.',[
   ('233354','Amarelo',9,66.08),('233358','Coral',5,66.08),('233362','Lavanda',6,66.08),('233352','Preto',5,66.08),('233359','Rosa',4,66.08),('233356','Verde',10,66.08)],
   {'Amarelo':'#E9C04A','Coral':'#F08A78','Lavanda':'#B4A2D8','Preto':'#2A2B2E','Rosa':'#E8A7BF','Verde':'#6FAE6A'},lambda c:None),
 ('flashforge','ff-pla-luminous','PLA Luminous','Brilha no escuro depois de ficar exposto à luz.',[
   ('233370','Branco',5,117.07),('233369','Laranja',5,117.07),('233368','Vermelho',5,117.07)],
   {'Branco':'#EAF4E2','Laranja':'#F59A3A','Vermelho':'#E5484A'},lambda c:None),
 ('flashforge','ff-pla-rainbow','PLA Rainbow','A cor muda ao longo do carretel, criando peças em degradê.',[
   ('233363','Amarelo + Azul',1,85.56),('233364','Rosa + Azul',3,85.56),('233365','Verde + Laranja',5,85.56)],
   {'Amarelo + Azul':'#F2C230|#2E6FD6','Rosa + Azul':'#EE8FB7|#3E86E0','Verde + Laranja':'#3FAE4F|#F28A2E'},lambda c:None),
 ('flashforge','ff-petg','PETG Basic','Mais resistente a impacto, calor e umidade que o PLA.',[
   ('233373','Preto',2,63.79),('233377','Rosa',3,63.79),('233376','Verde',4,63.79)],
   {'Preto':'#25262A','Rosa':'#E992BB','Verde':'#36AD44'},lambda c:('hs-petg',f'Basic / {EN[c]}')),
 ('flashforge','ff-petg-transp','PETG Transparente','Translúcido, para luminárias e peças com efeito de vidro.',[
   ('233385','Amarelo',2,82.15),('233386','Azul',14,82.15),('233387','Laranja',5,82.15),('233383','Natural',4,82.15),('233388','Roxo',4,82.15),('233382','Verde',3,82.15),('233384','Vermelho',5,82.15)],
   {'Amarelo':'#E3A532','Azul':'#3E86E0','Laranja':'#F28A2E','Natural':'#DCE6EA','Roxo':'#5B3BB5','Verde':'#4E9A33','Vermelho':'#A1262E'},
   lambda c:{'Amarelo':('hs-petg','Transparent / Yellow'),'Verde':('hs-petg','Transparent / Green'),'Roxo':('hs-petg','Transparent / Purple'),'Natural':('hs-petg','Transparent / Transparent'),'Vermelho':('hs-petg','Transparent / Ruby Red')}.get(c)),
 ('flashforge','ff-abs','ABS Basic','Aguenta mais calor, indicado para peças técnicas e de uso no carro.',[
   ('233393','Amarelo',5,68.37),('233394','Azul',5,68.37),('233390','Branco',5,68.37),('233397','Cinza',5,68.37),('233396','Marrom',5,68.37),('233389','Natural',5,68.37),
   ('233391','Preto',4,68.37),('233398','Rosa',3,68.37),('233395','Verde',5,68.37),('233392','Vermelho',5,68.37)],
   {'Amarelo':'#F4C21B','Azul':'#1F5FC8','Branco':'#F4F4F0','Cinza':'#8A9099','Marrom':'#8B4A2B','Natural':'#E9E4D4','Preto':'#222326','Rosa':'#EE8FB7','Verde':'#3FAE4F','Vermelho':'#D2302B'},
   lambda c:{'Preto':('abs','ABS Basic / Black'),'Branco':('abs','ABS Basic / White')}.get(c)),
 ('flashforge','ff-tpu','TPU 95A','Flexível e emborrachado, para capas, pés, vedações e peças que dobram.',[
   ('233402','Amarelo',5,114.21),('233403','Azul',5,114.21),('233399','Branco',5,114.21),('233405','Cinza',4,114.21),('233406','Marrom',5,114.21)],
   {'Amarelo':'#F2C230','Azul':'#2F6FCF','Branco':'#F2F2EE','Cinza':'#8A9099','Marrom':'#8B4A2B'},lambda c:None),
 ('bambulab','bl-pla','PLA Basic','A linha mais usada nas impressoras Bambu Lab, com cor uniforme e ótima precisão.',[
   ('233416','Azul Acinzentado',2,133.91,'Blue Grey'),('233422','Branco Jade',2,133.96,'Jade White'),('233418','Ciano',3,134.02,'Cyan'),('233419','Cinza',3,133.85,'Gray'),
   ('354080','Roxo',1,133.96,'Purple'),('354079','Verde Bambu',3,133.96,'Bambu Green'),('233424','Vermelho',2,133.89,'Red')],None,None),
 ('bambulab','bl-petg','PETG Basic','Resistente e com bom acabamento, para peças funcionais.',[
   ('353869','Cinza',3,128.16,'Gray'),('233414','Marrom Escuro',3,128.31,'Dark Brown'),('233413','Preto',3,128.25,'Black')],None,None),

 # Masterprint: PLA Básico e PETG Básico do catálogo oficial (masterprint.com.br), sem estoque nem custo ainda (custo None = sob consulta).
 # Fotos: recortadas do catálogo oficial em PDF (prepare_masterprint em tools/; ficam no cache em raw/masterprint).
 ('masterprint','mp-pla','PLA Básico','PLA nacional de boa qualidade, ótimo custo para produção e peças do dia a dia.',[('MP-PLA-AZUL', 'Azul', 0, None), ('MP-PLA-CINZA', 'Cinza', 0, None), ('MP-PLA-VERMELHO', 'Vermelho', 0, None), ('MP-PLA-VERDE', 'Verde', 0, None), ('MP-PLA-DOURADO', 'Dourado', 0, None), ('MP-PLA-MADEIRA', 'Madeira', 0, None), ('MP-PLA-AMARELO', 'Amarelo', 0, None), ('MP-PLA-BRANCO', 'Branco', 0, None), ('MP-PLA-ROSA', 'Rosa', 0, None), ('MP-PLA-AZUL-ESCURO', 'Azul Escuro', 0, None), ('MP-PLA-PRATA', 'Prata', 0, None), ('MP-PLA-LARANJA', 'Laranja', 0, None), ('MP-PLA-PRETO', 'Preto', 0, None), ('MP-PLA-CINZA-CLARO', 'Cinza Claro', 0, None), ('MP-PLA-MARROM', 'Marrom', 0, None), ('MP-PLA-ROXO', 'Roxo', 0, None), ('MP-PLA-ROXO-CLARO', 'Roxo Claro', 0, None), ('MP-PLA-MADEIRA-ESCURA', 'Madeira Escura', 0, None), ('MP-PLA-VERDE-BAMBU', 'Verde Bambu', 0, None), ('MP-PLA-VERDE-ESCURO', 'Verde Escuro', 0, None), ('MP-PLA-CAFE', 'Café', 0, None), ('MP-PLA-MARROM-ESCURO', 'Marrom Escuro', 0, None), ('MP-PLA-PELE', 'Pele', 0, None), ('MP-PLA-TRANSPARENTE', 'Transparente', 0, None), ('MP-PLA-ROSA-CLARO', 'Rosa Claro', 0, None), ('MP-PLA-AZUL-CLARO', 'Azul Claro', 0, None)],
   {'Azul': '#2F7FD6', 'Cinza': '#A3A6AA', 'Vermelho': '#D8262A', 'Verde': '#1FA34A', 'Dourado': '#E0A12A', 'Madeira': '#D8B08C', 'Amarelo': '#F6E21C', 'Branco': '#F4F4F2', 'Rosa': '#E94FA8', 'Azul Escuro': '#1C3A78', 'Prata': '#B5B8BC', 'Laranja': '#F7931E', 'Preto': '#1E1E20', 'Cinza Claro': '#D2D4D6', 'Marrom': '#6B4A40', 'Roxo': '#5B3FB0', 'Roxo Claro': '#D9C2EC', 'Madeira Escura': '#A0623A', 'Verde Bambu': '#2FB44A', 'Verde Escuro': '#4E7D4E', 'Café': '#4E3A36', 'Marrom Escuro': '#3E2A26', 'Pele': '#E9B98E', 'Transparente': '#E8E4DA', 'Rosa Claro': '#F2B3D6', 'Lavanda': '#B49BD9', 'Bronze': '#9C7A3C', 'Azul Claro': '#8FC6EE'},lambda c:None),
 ('masterprint','mp-petg','PETG Básico','PETG resistente a impacto e umidade, para peças funcionais e externas.',[('MP-PETG-PRETO', 'Preto', 0, None), ('MP-PETG-BRANCO', 'Branco', 0, None), ('MP-PETG-AZUL', 'Azul', 0, None), ('MP-PETG-VERMELHO', 'Vermelho', 0, None), ('MP-PETG-VERDE', 'Verde', 0, None), ('MP-PETG-ROSA', 'Rosa', 0, None), ('MP-PETG-PRATA', 'Prata', 0, None), ('MP-PETG-TRANSPARENTE', 'Transparente', 0, None), ('MP-PETG-CINZA', 'Cinza', 0, None), ('MP-PETG-AMARELO', 'Amarelo', 0, None), ('MP-PETG-MARROM', 'Marrom', 0, None), ('MP-PETG-LARANJA', 'Laranja', 0, None), ('MP-PETG-PELE', 'Pele', 0, None), ('MP-PETG-MADEIRA', 'Madeira', 0, None), ('MP-PETG-LAVANDA', 'Lavanda', 0, None), ('MP-PETG-BRONZE', 'Bronze', 0, None), ('MP-PETG-DOURADO', 'Dourado', 0, None), ('MP-PETG-ROXO', 'Roxo', 0, None)],
   {'Azul': '#2F7FD6', 'Cinza': '#A3A6AA', 'Vermelho': '#D8262A', 'Verde': '#1FA34A', 'Dourado': '#E0A12A', 'Madeira': '#D8B08C', 'Amarelo': '#F6E21C', 'Branco': '#F4F4F2', 'Rosa': '#E94FA8', 'Azul Escuro': '#1C3A78', 'Prata': '#B5B8BC', 'Laranja': '#F7931E', 'Preto': '#1E1E20', 'Cinza Claro': '#D2D4D6', 'Marrom': '#6B4A40', 'Roxo': '#5B3FB0', 'Roxo Claro': '#D9C2EC', 'Madeira Escura': '#A0623A', 'Verde Bambu': '#2FB44A', 'Verde Escuro': '#4E7D4E', 'Café': '#4E3A36', 'Marrom Escuro': '#3E2A26', 'Pele': '#E9B98E', 'Transparente': '#E8E4DA', 'Rosa Claro': '#F2B3D6', 'Lavanda': '#B49BD9', 'Bronze': '#9C7A3C', 'Azul Claro': '#8FC6EE'},lambda c:None),
 # Genéricos: linha sem marca, cores mais vendidas; sem foto de fabricante, usa o carretel desenhado.
 ('generico','gn-pla','PLA','PLA de linha econômica, bom para testes, protótipos e grandes volumes.',[
   ('GN-PLA-PRE','Preto',0,None),('GN-PLA-BRA','Branco',0,None),('GN-PLA-CIN','Cinza',0,None),('GN-PLA-VEM','Vermelho',0,None),('GN-PLA-AZU','Azul',0,None),
   ('GN-PLA-AMA','Amarelo',0,None),('GN-PLA-VER','Verde',0,None),('GN-PLA-LAR','Laranja',0,None),('GN-PLA-ROX','Roxo',0,None),('GN-PLA-ROS','Rosa',0,None)],
   {'Preto':'#1E1E20','Branco':'#F3F3F0','Cinza':'#8A8F96','Vermelho':'#C8261F','Azul':'#1E4FB5','Amarelo':'#F5C518','Verde':'#2F9E44','Laranja':'#F07A1A','Roxo':'#6B3FA0','Rosa':'#EE8FB7'},lambda c:None),
 ('generico','gn-petg','PETG','PETG de linha econômica, resistente e fácil de imprimir.',[
   ('GN-PETG-PRE','Preto',0,None),('GN-PETG-BRA','Branco',0,None),('GN-PETG-CIN','Cinza',0,None),('GN-PETG-TRA','Transparente',0,None)],
   {'Preto':'#1E1E20','Branco':'#F4F4F2','Cinza':'#8A8F96','Transparente':'#DCE6EA'},lambda c:None),
]
TRANSLUCIDO={'ff-petg-transp'}
TRANSLUCIDO_COR=('Translúcido','Transparente')
MP_BASE=os.path.join(RAW,'masterprint','_base_madeira.webp')
MP_NOPHOTO={'PLA-BRANCO','PETG-LAVANDA', 'PETG-BRONZE', 'PETG-TRANSPARENTE', 'PETG-MARROM', 'PETG-PRATA', 'PLA-AZUL-CLARO', 'PETG-PELE', 'PETG-CINZA', 'PETG-MADEIRA'}

items={};jobs=[]
for brand,lid,lname,about,rows,hexes,src in CATALOGO:
    for r in rows:
        sku,name,stock,cost=r[:4];en=r[4] if len(r)>4 else None;official=None;url=None
        if brand=='bambulab':
            V,SW=BL[lid];v=V[en];url=v['imgs'].get('Filament with spool') or v['imgs']['Refill'];hexv=avg(SW[en]);official=f"{en} ({v['code']})"
        else:
            hexv=hexes[name];s=src(name);url=ff(*s) if s else None
        items[sku]=dict(sku=sku,brand=brand,line=lid,name=name,stock=stock,cost=cost,hex=hexv,official=official,photo='',translucent=lid in TRANSLUCIDO or name.endswith(TRANSLUCIDO_COR))
        if url: jobs.append((sku,url,os.path.join(RAW,brand,sku+'.webp')))
def run(j):
    sku,url,out=j
    if os.path.exists(out): return sku,(out,Image.open(out).size)
    d=(img(url+'__op__resize,m_lfit,w_1600') if 'bblcdn' in url else None) or img(url)
    return sku,(out,save(d,out)) if d else None
for sku,r in ThreadPoolExecutor(8).map(run,jobs):
    if r: items[sku]['raw']=r[0]

# ---------- estúdio: fundo padronizado, sem cortes; simulação para cores sem foto oficial ----------
def transparent(im): return im.mode=='RGBA' and im.getchannel('A').getextrema()[0]<20
def photo_hex(im):
    # cor real tirada da foto: mediana dos pixels coloridos do produto
    a=np.array(im.convert('RGBA'),float);rgb,al=a[...,:3],a[...,3];mx,mn=rgb.max(2),rgb.min(2);sat=(mx-mn)/np.maximum(mx,1);L=rgb.mean(2)
    m=(al>200)&(sat>.28)&(L>40)&(L<235)
    if m.sum()<2000: return None
    px=rgb[m];lum=px@np.array([.299,.587,.114]);lo,hi=np.percentile(lum,[70,95])
    return '#%02X%02X%02X'%tuple(int(v) for v in np.median(px[(lum>=lo)&(lum<=hi)],axis=0))
import numpy as np
# fotos oficiais com tom corrigido (a foto do fabricante não mostra a cor como ela é): artigo -> (cor alvo, referência de luz)
ADJUST={'233350':('#D9B44A',80)}  # Dourado: a foto oficial 'Gold' sai verde-oliva
BASE={'flashforge':(os.path.join(RAW,'flashforge','233335.webp'),os.path.join(RAW,'flashforge','233383.webp')),'generico':(os.path.join(RAW,'flashforge','233390.webp'),os.path.join(RAW,'flashforge','233383.webp'))}
def compose(it):
    out=f"assets/filamentos/studio/{it['sku']}.webp"
    if it.get('raw'):
        im=Image.open(it['raw'])
        if it['brand']=='flashforge' and transparent(im):
            h=photo_hex(im)
            if h and it['sku'] not in ADJUST and not it['translucent'] and not re.search(r'branco|preto|natural|cinza|prata',it['name'],re.I): it['hex']=h
        kind='official'
        if it['sku'] in ADJUST:
            tgt,ref=ADJUST[it['sku']];im=studio.retint(im,tgt,ref);it['hex']=tgt;kind='adjusted'
        pic=studio.place_cutout(im,it['hex']) if transparent(im) else studio.place_flat(im,it['hex'],'dense' if it['brand']=='masterprint' else 'center')
    elif it['brand']=='masterprint':
        # foto oficial em alta (PLA Madeira, 1215 px, masterprint.com.br); demais cores: só o filamento recolorido
        base=Image.open(MP_BASE).convert('RGB')
        if it['name']!='Madeira' or it['line']!='mp-pla':
            base=studio.recolor_masked(base,it['hex'].split('|')[0]);kind='simulated'
        else: kind='official'
        pic=studio.place_flat(base.resize((1200,1200),Image.LANCZOS),it['hex'],'dense')
        pic.save(out,'WEBP',quality=88,method=6);it['photo']=out;it['photoKind']=kind;it.pop('raw',None)
        return it['sku'],kind
    elif it['brand'] not in BASE:
        it['photo']='';it['photoKind']='drawn';it.pop('raw',None);return it['sku'],'drawn'
    else:
        base=BASE[it['brand']][1 if it['translucent'] else 0]
        pic=studio.place_cutout(studio.recolor(Image.open(base),it['hex'],it['translucent']),it['hex']);kind='simulated'
        if it['brand']=='generico': kind='generic'
    pic.save(out,'WEBP',quality=86,method=6);it['photo']=out;it['photoKind']=kind;it.pop('raw',None)
    return it['sku'],kind
for sku,kind in ThreadPoolExecutor(4).map(compose,list(items.values())):
    print(sku,items[sku]['brand'],items[sku]['line'],items[sku]['name'],kind,items[sku]['hex'])

BRANDS=[
 dict(id='flashforge',name='Flashforge',logo='assets/brands/flashforge.svg',accent='#E9ECEA',about='Filamentos originais em várias linhas: PLA, PETG, ABS e TPU.'),
 dict(id='bambulab',name='Bambu Lab',logo='assets/brands/bambulab.svg',accent='#00AE42',about='Os filamentos originais da Bambu Lab, com o chip que a impressora reconhece.'),
 dict(id='masterprint',name='Masterprint',mono='MP',logo='assets/brands/masterprint.webp',logoWide=True,accent='#1C6FD1',about='Marca nacional de filamentos do Grupo Master, com ótimo custo-benefício para produção.'),
 dict(id='generico',name='Genéricos',mono='3D',logo=None,accent='#8A918C',about='Filamentos sem marca, de linha econômica, para testes, protótipos e produção em volume.'),
]
for b in BRANDS:
    b['lines']=[dict(id=lid,name=lname,about=about,colors=[items[r[0]] for r in rows]) for brand,lid,lname,about,rows,*_ in CATALOGO if brand==b['id']]
out='''// Gerado por tools/build_filaments.py a partir do catálogo do fornecedor. Não edite à mão: edite o script e rode de novo.
// Preço = custo + margem. Varejo: custo + R$ 20. Acima de 5 carretéis no carrinho: + R$ 15. Acima de 20: + R$ 10.
window.NP_PRICING = { retail: 20, tiers: [ { min: 6, add: 15 }, { min: 21, add: 10 } ] };
window.NP_FIL = '''+json.dumps(BRANDS,ensure_ascii=False,indent=1)+''';
window.NP_FIL_INDEX = {};
window.NP_FIL.forEach(b => b.lines.forEach(l => l.colors.forEach(c => { window.NP_FIL_INDEX[c.sku] = Object.assign({ brandName: b.name, lineName: l.name }, c); })));
'''
open('data/filaments.js','w',encoding='utf8').write(out)
print('itens',len(items),'com foto',sum(1 for i in items.values() if i['photo']))
