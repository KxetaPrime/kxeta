"""Logo v3: N sólido com cantos e junções arredondados. Gera SVGs em logo/v3."""
import math,os
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
FONT='/tmp/claude-0/-home-user-kxeta/5b3d7723-2020-5084-956e-d54157ca2dbd/scratchpad/gf/ofl/bricolagegrotesque/BricolageGrotesque[opsz,wdth,wght].ttf'
O=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'logo','v3')+'/'
INK='#0C100E';NEON='#3DF25C';DEEP='#17A83B'
def rpoly(pts,rad):
    n=len(pts);out=[]
    for i in range(n):
        p0,p1,p2=pts[i-1],pts[i],pts[(i+1)%n];r=rad[i]
        v1=(p0[0]-p1[0],p0[1]-p1[1]);v2=(p2[0]-p1[0],p2[1]-p1[1])
        l1=math.hypot(*v1);l2=math.hypot(*v2);u1=(v1[0]/l1,v1[1]/l1);u2=(v2[0]/l2,v2[1]/l2)
        ang=math.acos(max(-1,min(1,u1[0]*u2[0]+u1[1]*u2[1])));d=min(r/math.tan(ang/2),l1*.48,l2*.48)
        a=(p1[0]+u1[0]*d,p1[1]+u1[1]*d);b=(p1[0]+u2[0]*d,p1[1]+u2[1]*d)
        k=4/3*math.tan((math.pi-ang)/4)*(d*math.tan(ang/2))/max(d,1e-6)  # proporção do controle
        k=min(.72,max(.4,k))
        c1=(a[0]+(p1[0]-a[0])*k,a[1]+(p1[1]-a[1])*k);c2=(b[0]+(p1[0]-b[0])*k,b[1]+(p1[1]-b[1])*k)
        out.append((a,c1,c2,b))
    s=f'M{out[0][3][0]:.2f} {out[0][3][1]:.2f}'
    for i in range(1,n+1):
        a,c1,c2,b=out[i%n];s+=f'L{a[0]:.2f} {a[1]:.2f}C{c1[0]:.2f} {c1[1]:.2f} {c2[0]:.2f} {c2[1]:.2f} {b[0]:.2f} {b[1]:.2f}'
    return s+'Z'
def N(sw=18,top=10,bot=90,L=12,R=88,rc=18,rj=10):
    # contorno do N: hastes de largura sw, diagonal da largura das hastes
    a=L+sw;b=R-sw
    dx=(b-a);  # deslocamento da diagonal
    P=[(L,bot),(L,top),(a+sw*.55,top),(b,bot-(bot-top)*.40),(b,top),(R,top),(R,bot),(b-sw*.55,bot),(a,top+(bot-top)*.40),(a,bot)]
    r=[rc,rc,rc*.8,rj,rc*.6,rc,rc,rc*.8,rj,rc*.6]
    return rpoly(P,r)
def diag(sw=18,top=10,bot=90,L=12,R=88):
    a=L+sw;b=R-sw
    return f'M{a} 0H{b}V100H{a}Z'  # só a faixa entre as hastes = a diagonal
f=instantiateVariableFont(TTFont(FONT),{'wght':700,'opsz':96,'wdth':100});gs=f.getGlyphSet();cm=f.getBestCmap();up=f['head'].unitsPerEm
def text(t,size,x,base,track=0):
    s=size/up;out=''
    for ch in t:
        g=cm[ord(ch)];p=SVGPathPen(gs);gs[g].draw(TransformPen(p,(s,0,0,-s,x,base)));out+=p.getCommands();x+=f['hmtx'][g][0]*s+track
    return out,x
def svg(w,h,body,bg=None,defs=''):
    r=f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}"><defs>{defs}</defs>{r}{body}</svg>'
def mark(kind,col=NEON,bg=None):
    if kind=='solid': return f'<path d="{N()}" fill="{col}"/>'
    if kind=='fita':  # diagonal em tom mais escuro: efeito de fita dobrada
        return f'<clipPath id="cN"><path d="{N()}"/></clipPath><g clip-path="url(#cN)"><rect width="100" height="100" fill="{col}"/><path d="{diag()}" fill="{DEEP if col==NEON else "#3a4440"}"/></g>'
    if kind=='selo':  # N vazado num quadrado arredondado
        return f'<rect width="100" height="100" rx="30" fill="{col}"/><g transform="translate(50 50) scale(.62) translate(-50 -50)"><path d="{N()}" fill="{bg or INK}"/></g>'
def lockup(kind,dark=True,word='Nova Prime'):
    fg='#fff' if dark else INK;acc=NEON if dark else '#13A33C'
    t1,x=text(word,62,138,80,-1.2);t2,x2=text('3D',62,x+16,80,-1.2)
    m=mark(kind,NEON if dark else INK,INK if dark else '#fff')
    return svg(int(x2+14),116,f'<g transform="translate(14 8)">{m}</g><path d="{t1}" fill="{fg}"/><path d="{t2}" fill="{acc}"/>',INK if dark else '#fff')
if __name__=='__main__':
    for k in ('solid','fita','selo'):
        open(O+f'{k}-icone.svg','w').write(svg(100,100,f'<g transform="translate(50 50) scale(.66) translate(-50 -50)">{mark(k)}</g>' if k!='selo' else mark(k),INK if k!='selo' else None) if k!='selo' else svg(100,100,mark(k)))
        open(O+f'{k}-horizontal-escuro.svg','w').write(lockup(k,True))
        open(O+f'{k}-horizontal-claro.svg','w').write(lockup(k,False))
    print('ok')
