"""Recorta (fundo transparente) as fotos de filamento usadas no topo do site: 5 por marca."""
import os,sys,json,re
import numpy as np
from PIL import Image,ImageDraw,ImageFilter
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));import studio
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));OUT=ROOT+'/assets/hero/'
RAW=sys.argv[1] if len(sys.argv)>1 else '/tmp/np-fil-cache/raw'
def cut_alpha(im):
    im=im.convert('RGBA');a=im.getchannel('A')
    if a.getextrema()[0]<20: return im
    rgb=np.array(im.convert('RGB'),float);bg=np.median(np.concatenate([rgb[:8,:8].reshape(-1,3),rgb[-8:,-8:].reshape(-1,3),rgb[:8,-8:].reshape(-1,3)]),axis=0)
    d=np.abs(rgb-bg).max(2);m=Image.fromarray(((d>9)*255).astype('uint8')).filter(ImageFilter.MaxFilter(5))
    S=m.width;dens=np.array(m.resize((S//8,m.height//8),Image.BOX).filter(ImageFilter.BoxBlur(6)),float)
    yy,xx=np.unravel_index(np.argmax(dens),dens.shape);mm=np.array(m);ys,xs=np.nonzero(mm);i=np.argmin((xs-xx*8)**2+(ys-yy*8)**2)
    ImageDraw.floodfill(m,(int(xs[i]),int(ys[i])),128);keep=(np.array(m)==128)
    al=np.clip((d-4)/22,0,1)*keep;al=np.array(Image.fromarray((al*255).astype('uint8')).filter(ImageFilter.GaussianBlur(.8)))
    out=np.dstack([rgb,al]).astype('uint8');return Image.fromarray(out,'RGBA')
def save(im,name):
    im=im.crop(im.getchannel('A').point(lambda v:255 if v>12 else 0).getbbox());im.thumbnail((760,760),Image.LANCZOS)
    im.save(OUT+name,'WEBP',quality=84,method=6)
SETS={'flashforge':['233347','233340','233338','233336','233344'],'bambulab':['354080','233418','354079','233424','233416'],
      'masterprint':['MP-PLA-ROXO','MP-PLA-AZUL','MP-PLA-VERDE','MP-PLA-VERMELHO','MP-PLA-ROSA']}
HEX={'MP-PLA-ROXO':'#5B3FB0','MP-PLA-AZUL':'#2F7FD6','MP-PLA-VERDE':'#1FA34A','MP-PLA-VERMELHO':'#D8262A','MP-PLA-ROSA':'#E94FA8'}
if __name__=='__main__':
    for b,skus in SETS.items():
        for i,s in enumerate(skus):
            if b=='masterprint':
                base=Image.open(RAW+'/masterprint/_base_madeira.webp').convert('RGB');im=studio.recolor_masked(base,HEX[s])
            else: im=Image.open(f'{RAW}/{b}/{s}.webp')
            save(cut_alpha(im),f'{b}-{i}.webp');print(b,i,s)
