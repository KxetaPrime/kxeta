"""Variações do N fita."""
import os,sys,itertools;sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from logo5 import N_D,D_D,SW
INK,NEON,DEEP='#0C100E','#3DF25C','#17A83B'
c=itertools.count()
def clip(inner,shape=N_D):
    i=next(c);return f'<clipPath id="v{i}"><path d="{shape}"/></clipPath><g clip-path="url(#v{i})">{inner}</g>'
a,b=12+SW,88-SW
V={}
V['Fita (atual)']=clip(f'<rect width="100" height="100" fill="{NEON}"/><path d="{D_D}" fill="{DEEP}"/>')
V['Três tons']=clip(f'<rect width="100" height="100" fill="{NEON}"/><path d="{D_D}" fill="{DEEP}"/><rect x="{b+6}" width="40" height="100" fill="#9BFFAE"/><path d="{D_D}" fill="{DEEP}" transform="translate(0 0)" clip-path="none"/>')
V['Dobra com sombra']=clip(f'<rect width="100" height="100" fill="{NEON}"/><path d="{D_D}" fill="{DEEP}"/><path d="M{b-SW*.55-4} 90L{b-SW*.55} 90L{88} 90L{70} 59Z" fill="#0E6B26" opacity=".0"/><path d="M{12+SW*.55+SW*.55} 10L{12+SW*.55+SW*.55+5} 10L{88+5} 90L{88} 90Z" fill="#0B5A22"/>')
gaps=''.join(f'<rect x="0" y="{y}" width="100" height="1.7" fill="{INK}"/>' for y in range(18,90,8))
V['Camadas de impressão']=clip(f'<rect width="100" height="100" fill="{NEON}"/><path d="{D_D}" fill="{DEEP}"/>{gaps}')
V['Linha e fita']=f'<path d="{N_D}" fill="none" stroke="{NEON}" stroke-width="3.2"/>'+clip(f'<path d="{D_D}" fill="{NEON}"/>')
V['Em movimento']=f'<g transform="translate(9 0) skewX(-10)">'+clip(f'<rect width="100" height="100" fill="{NEON}"/><path d="{D_D}" fill="{DEEP}"/>')+'</g>'
V['Fita neon']=clip(f'<rect width="100" height="100" fill="#FFFFFF"/><path d="{D_D}" fill="{NEON}"/>')
V['Selo']=f'<circle cx="50" cy="50" r="50" fill="{NEON}"/><g transform="translate(50 50) scale(.62) translate(-50 -50)">'+clip(f'<rect width="100" height="100" fill="{INK}"/><path d="{D_D}" fill="#0E6B26"/>')+'</g>'
if __name__=='__main__':
    O=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'logo','v5','variacoes')+'/';os.makedirs(O,exist_ok=True)
    cells='';import re
    for i,(k,v) in enumerate(V.items()):
        slug=re.sub(r'[^a-z0-9]+','-',k.lower().replace('ç','c').replace('ê','e').replace('ã','a')).strip('-')
        open(O+f'{i+1}-{slug}.svg','w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -6 112 112" width="512" height="512"><rect x="-6" y="-6" width="112" height="112" rx="28" fill="{INK}"/><g transform="translate(50 50) scale(.72) translate(-50 -50)">{v}</g></svg>')
        x,y=(i%4)*300,(i//4)*340
        cells+=f'<g transform="translate({x+20} {y+20})"><rect width="260" height="260" rx="56" fill="{INK}"/><g transform="translate(130 130) scale(1.7) translate(-50 -50)">{v}</g><text x="0" y="296" font-family="Geist,Arial" font-weight="700" font-size="20" fill="{INK}">{i+1}. {k}</text></g>'
    open(O+'prancha.svg','w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1220 700" width="1220" height="700"><rect width="1220" height="700" fill="#EEF0EE"/>{cells}</svg>')
    print('ok')
