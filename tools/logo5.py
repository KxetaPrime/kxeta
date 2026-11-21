"""Logo v5 (escolhido): N em fita dobrada. Gera logo/v5 e o ícone do site."""
import os,sys,itertools
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from logo3 import rpoly,text,svg,INK,NEON
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));O=ROOT+'/logo/v5/';os.makedirs(O,exist_ok=True)
SW,RC,RJ=18,20,18
def npath(sw=SW,top=10,bot=90,L=12,R=88,rc=RC,rj=RJ):
    a=L+sw;b=R-sw
    P=[(L,bot),(L,top),(a+sw*.55,top),(b,bot-(bot-top)*.40),(b,top),(R,top),(R,bot),(b-sw*.55,bot),(a,top+(bot-top)*.40),(a,bot)]
    return rpoly(P,[rc,rc,rc*.8,rj,rc*.6,rc,rc,rc*.8,rj,rc*.6])
def dpath(sw=SW,L=12,R=88,top=10,bot=90):
    a=L+sw;b=R-sw
    return f'M{L} {top}L{a+sw*.55} {top}L{R} {bot}L{b-sw*.55} {bot}Z'
N_D=npath();D_D=dpath()
_ids=itertools.count()
TONES={'dark':(NEON,'#17A83B'),'light':(INK,'#13A33C'),'green':(INK,'#0E5A25'),'white':('#FFFFFF','#BFC6C1')}
def mark(tone='dark'):
    s,d=TONES[tone];i=next(_ids)
    return f'<clipPath id="nf{i}"><path d="{N_D}"/></clipPath><g clip-path="url(#nf{i})"><rect width="100" height="100" fill="{s}"/><path d="{D_D}" fill="{d}"/></g>'
def sym(tone,size,extra=''):
    return f'<svg viewBox="4 4 92 92" width="{size}" height="{size}" aria-hidden="true" {extra}>{mark(tone)}</svg>'
def lockup(tone,bg,fg,acc):
    t1,x=text('nova prime',64,124,82,-1.6);t2,x2=text('3d',64,x+14,82,-1.6)
    return svg(int(x2+14),116,f'<g transform="translate(10 8.2) scale(.82)">{mark(tone)}</g><path d="{t1}" fill="{fg}"/><path d="{t2}" fill="{acc}"/>',bg)
if __name__=='__main__':
    open(O+'horizontal-escuro.svg','w').write(lockup('dark',INK,'#fff',NEON))
    open(O+'horizontal-claro.svg','w').write(lockup('light','#fff',INK,'#13A33C'))
    open(O+'horizontal-verde.svg','w').write(lockup('green',NEON,INK,'#fff'))
    icon=svg(100,100,f'<rect width="100" height="100" rx="28" fill="{INK}"/><g transform="translate(50 50) scale(.62) translate(-50 -50)">{mark("dark")}</g>')
    open(O+'icone.svg','w').write(icon);open(ROOT+'/assets/brand/icone.svg','w').write(icon)
    open(O+'simbolo.svg','w').write(svg(100,100,mark('dark')))
    for name,bg,t in [('avatar-escuro',INK,'dark'),('avatar-verde',NEON,'green')]:
        open(O+name+'.svg','w').write(svg(1080,1080,f'<g transform="translate(540 540) scale(6.2) translate(-50 -50)">{mark(t)}</g>',bg))
    print('ok')
