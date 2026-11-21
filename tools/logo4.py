"""Logo v4: 'n' em arco + ponto (nova / gota do bico). Gera logo/v4."""
import os,sys
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from logo3 import text,svg,INK,NEON
O=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'logo','v4')+'/';os.makedirs(O,exist_ok=True)
def arch(x=14,y=30,w=62,h=60,t=21):
    R=w/2;r=R-t;cx=x+R;cy=y+R
    return (f'M{x} {y+h}V{cy}A{R} {R} 0 0 1 {x+w} {cy}V{y+h}H{x+w-t}V{cy}A{r} {r} 0 0 0 {x+t} {cy}V{y+h}Z')
def mark(col=NEON,dot=None,variant='dot'):
    a=f'<path d="{arch()}" fill="{col}"/>'
    if variant=='dot': return a+f'<circle cx="86" cy="22" r="10" fill="{dot or col}"/>'
    if variant=='layers':
        return f'<path d="{arch(14,24,72,66,8)}" fill="{col}"/><path d="{arch(25,35,50,55,8)}" fill="{col}"/><path d="{arch(36,46,28,44,8)}" fill="{col}"/>'
    return a
def lockup(variant,dark=True):
    fg='#fff' if dark else INK;acc=NEON if dark else '#13A33C'
    t1,x=text('nova prime',64,128,82,-1.6);t2,x2=text('3d',64,x+14,82,-1.6)
    m=mark(NEON if dark else INK,'#fff' if dark else '#13A33C',variant)
    return svg(int(x2+14),116,f'<g transform="translate(8 -8)">{m}</g><path d="{t1}" fill="{fg}"/><path d="{t2}" fill="{acc}"/>',INK if dark else '#fff')
def png_ready():
    # versões para redes sociais (fundo cheio, símbolo central)
    for name,bg,col,dot in [('avatar-escuro',INK,NEON,'#fff'),('avatar-verde',NEON,INK,'#fff')]:
        open(O+name+'.svg','w').write(svg(1080,1080,f'<g transform="translate(540 540) scale(6.4) translate(-55 -51)">{mark(col,dot)}</g>',bg))
if __name__=='__main__':
    for v in ('dot','layers'):
        open(O+f'{v}-horizontal-escuro.svg','w').write(lockup(v,True));open(O+f'{v}-horizontal-claro.svg','w').write(lockup(v,False))
        open(O+f'{v}-icone.svg','w').write(svg(100,100,f'<rect width="100" height="100" rx="28" fill="{INK}"/><g transform="translate(50 50) scale(.7) translate(-55 -51)">{mark(NEON,"#fff",v)}</g>'))
    png_ready();print('ok')
