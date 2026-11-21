from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
GF='/tmp/claude-0/-home-user-kxeta/5b3d7723-2020-5084-956e-d54157ca2dbd/scratchpad/gf/ofl/bricolagegrotesque/BricolageGrotesque[opsz,wdth,wght].ttf'
f=instantiateVariableFont(TTFont(GF),{'wght':700,'opsz':96,'wdth':100})
gs=f.getGlyphSet();cm=f.getBestCmap();up=f['head'].unitsPerEm;cap=f['OS/2'].sCapHeight
def text(t,size,x,base,track=0):
    s=size/up;out='';
    for ch in t:
        g=cm[ord(ch)];p=SVGPathPen(gs);gs[g].draw(TransformPen(p,(s,0,0,-s,x,base)));out+=p.getCommands();x+=f['hmtx'][g][0]*s+track
    return out,x
INK='#0C100E';NEON='#3DF25C'
# N em uma linha contínua (filamento), caixa 100x100
N='M27 79V33C27 19 41 16 46.5 28L55.5 72C61 84 73 81 73 67V25C73 15 79 10 87 10'
def mark(col,bgc=None,w=13,layers=False):
    b=f'<rect width="100" height="100" rx="26" fill="{bgc}"/>' if bgc else ''
    if bgc and col!=bgc:
        inner=mark(col,None,w,layers) if not layers else None
        if inner: return b+f'<g transform="translate(50 50) scale(.74) translate(-57 -45)">{inner}</g>'
    if layers:
        return b+f'<path d="{N}" fill="none" stroke="{col}" stroke-width="{w+12}" stroke-linecap="round" stroke-linejoin="round"/><path d="{N}" fill="none" stroke="{bgc or "#fff"}" stroke-width="{w-1}" stroke-linecap="round" stroke-linejoin="round"/><path d="{N}" fill="none" stroke="{col}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>'
    return b+f'<path d="{N}" fill="none" stroke="{col}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
def svg(w,h,body,bg=None):
    r=f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{r}{body}</svg>'
def lockup(dark,layers=False):
    fg='#fff' if dark else INK; m=mark(NEON if dark else INK, INK if layers and dark else ('#fff' if layers else None),layers=layers)
    t1,x=text('Nova Prime',60,128,74);t2,x2=text('3D',60,x+14,74)
    body=f'<g transform="translate(8,10) scale(1)">{m}</g><path d="{t1}" fill="{fg}"/><path d="{t2}" fill="{NEON if dark else "#13A33C"}"/>'
    return svg(int(x2+12),120,body,INK if dark else '#fff')
O='/home/user/kxeta/logo/v2/'
open(O+'A-icone.svg','w').write(svg(100,100,mark(NEON,INK)))
open(O+'A-icone-claro.svg','w').write(svg(100,100,mark(INK)))
open(O+'A-horizontal-escuro.svg','w').write(lockup(True))
open(O+'A-horizontal-claro.svg','w').write(lockup(False))
open(O+'B-icone.svg','w').write(svg(100,100,mark(NEON,INK,w=12,layers=True)))
open(O+'B-horizontal-escuro.svg','w').write(lockup(True,True))
# ícone do site (sem fundo, verde neon)
open('/home/user/kxeta/assets/brand/icone.svg','w').write(svg(100,100,mark(NEON,INK)))
print('ok')
