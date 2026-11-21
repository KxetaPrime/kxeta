"""Estúdio de fotos dos filamentos.
Monta cada produto num fundo de estúdio padronizado (1200x1200, claro, com brilho suave da cor do filamento e
sombra no chão), sem cortes. Para cores sem foto oficial, gera uma SIMULAÇÃO tingindo a foto oficial de um
carretel claro da mesma marca (identificada como simulação no site)."""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

S = 1200

def _rgb(h):
    h = h.lstrip('#'); return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], float)

def backdrop(hexcolor):
    """Fundo de estúdio: degradê claro de cima para baixo, brilho da cor atrás do produto e vinheta leve."""
    y = np.linspace(0, 1, S)[:, None]
    top, bot = np.array([251, 251, 250.]), np.array([228, 231, 228.])
    base = top + (bot - top) * (y ** 1.4)[..., None]
    base = np.broadcast_to(base, (S, S, 3)).copy()
    c = _rgb(hexcolor.split('|')[0])
    tint = c + (255 - c) * 0.35                       # cor do filamento, clareada
    yy, xx = np.mgrid[0:S, 0:S]
    r = np.sqrt((xx - S * .5) ** 2 + ((yy - S * .46) * 1.08) ** 2) / (S * .56)
    g = np.clip(1 - r, 0, 1) ** 1.6 * 0.42
    base = base * (1 - g[..., None]) + tint * g[..., None]
    v = np.clip((np.sqrt((xx - S / 2) ** 2 + (yy - S / 2) ** 2) / (S * .75)) - .55, 0, 1) * .10
    base = base * (1 - v[..., None])
    return base

def contact_shadow(canvas, box, strength=.30):
    x0, y0, x1, y1 = box
    sh = Image.new('L', (S, S), 0); d = ImageDraw.Draw(sh)
    w = (x1 - x0) * .78; cx = (x0 + x1) / 2
    d.ellipse([cx - w / 2, y1 - 22, cx + w / 2, y1 + 26], fill=255)
    sh = np.array(sh.filter(ImageFilter.GaussianBlur(26)), float) / 255 * strength
    return canvas * (1 - sh[..., None])

def _fit(w, h, box=860):
    k = min(box / w, box / h); return k

def place_cutout(rgba, hexcolor):
    """Produto já recortado (fundo transparente)."""
    im = rgba.convert('RGBA'); bb = im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
    im = im.crop(bb); k = _fit(*im.size); im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    x0 = (S - im.width) // 2; y1 = 1010; y0 = y1 - im.height
    can = contact_shadow(backdrop(hexcolor), (x0, y0, x0 + im.width, y1))
    out = Image.fromarray(np.clip(can, 0, 255).astype('uint8')).convert('RGBA')
    out.alpha_composite(im, (x0, y0)); return out.convert('RGB')

def clean_flat(rgb, seed='center'):
    """Foto com fundo liso (Bambu Lab): apaga logos/selos e devolve (fator de multiplicação 0..1, bbox da peça)."""
    a = np.array(rgb.convert('RGB'), float); bg = np.median(np.concatenate([a[:8, :8].reshape(-1, 3), a[-8:, -8:].reshape(-1, 3), a[-8:, :8].reshape(-1, 3)]), axis=0)
    d = np.abs(a - bg).max(axis=2); obj = (d > 7).astype('uint8') * 255
    m = Image.fromarray(obj, 'L').filter(ImageFilter.MaxFilter(5))
    # semente: ponto da peça mais perto do centro
    # semente: ponto mais "cheio" do objeto (evita cair num pontinho de texto)
    if seed == 'dense':
        dens = np.array(m.resize((S // 8, S // 8), Image.BOX).filter(ImageFilter.BoxBlur(6)), float)
        dens[np.array(m.resize((S // 8, S // 8), Image.NEAREST)) == 0] = -1
        yy, xx = np.unravel_index(np.argmax(dens), dens.shape); sx, sy = xx * 8 + 4, yy * 8 + 4
    else:
        sx, sy = S / 2, S * .55
    mm = np.array(m); ys, xs = np.nonzero(mm); i = np.argmin((xs - sx) ** 2 + (ys - sy) ** 2)
    ImageDraw.floodfill(m, (int(xs[i]), int(ys[i])), 128)
    keep = np.array(m) == 128
    a[~keep] = bg                                    # logos e selos somem
    f = np.clip(a / bg, 0, 1)                        # fundo vira 1.0 (não muda o estúdio)
    ys, xs = np.nonzero(keep & (d > 7)); bb = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
    return f, bb

def place_flat(rgb, hexcolor, seed='center'):
    f, (x0, y0, x1, y1) = clean_flat(rgb, seed)
    pad = 40; x0, y0, x1, y1 = max(0, x0 - pad), max(0, y0 - pad), min(S, x1 + pad), min(S, y1 + pad)
    crop = Image.fromarray((f[y0:y1, x0:x1] * 255).astype('uint8'))
    k = _fit(crop.width, crop.height, 900); crop = crop.resize((round(crop.width * k), round(crop.height * k)), Image.LANCZOS)
    layer = np.ones((S, S, 3)); px = (S - crop.width) // 2; py = 1040 - crop.height
    py = max(0, py); layer[py:py + crop.height, px:px + crop.width] = np.array(crop, float)[:min(crop.height, S - py)] / 255
    can = backdrop(hexcolor) * layer
    return Image.fromarray(np.clip(can, 0, 255).astype('uint8'))

def recolor(rgba, hexcolor, translucent=False):
    """Tinge as partes claras (filamento e peça) de um carretel claro, mantendo sombras e brilhos."""
    im = np.array(rgba.convert('RGBA'), float); rgb, al = im[..., :3], im[..., 3]
    L = rgb @ np.array([.299, .587, .114]); mx, mn = rgb.max(2), rgb.min(2); sat = (mx - mn) / np.maximum(mx, 1)
    w = np.clip((L - 70) / 110, 0, 1) * np.clip(1 - sat * 2.2, 0, 1)
    cols = [_rgb(h) for h in hexcolor.split('|')]
    if len(cols) == 2:
        xs = np.nonzero(al > 8)[1]; t = np.clip((np.arange(rgb.shape[1]) - xs.min()) / max(1, xs.max() - xs.min()), 0, 1)
        t = (np.sin((t - .5) * np.pi) + 1) / 2
        target = cols[0][None, None, :] * (1 - t)[None, :, None] + cols[1][None, None, :] * t[None, :, None]
        target = np.broadcast_to(target, rgb.shape)
    else:
        target = np.broadcast_to(cols[0], rgb.shape)
    shade = np.clip(L / 238, 0, 1.08)[..., None]
    tinted = np.clip(target * shade, 0, 255)
    hi = np.clip((L - 242) / 13, 0, 1)[..., None] * .55   # brilho especular continua claro
    tinted = tinted * (1 - hi) + 255 * hi
    out = rgb * (1 - w[..., None]) + tinted * w[..., None]
    return Image.fromarray(np.dstack([out, al]).astype('uint8'), 'RGBA')

def retint(rgba, hexcolor, ref=150):
    """Corrige o tom de uma foto oficial: leva as partes coloridas (filamento e peça) para a cor alvo,
    mantendo luz, sombra e textura. Partes pretas/cinzas (carretel) não mudam."""
    im = np.array(rgba.convert('RGBA'), float); rgb, al = im[..., :3], im[..., 3]
    L = rgb @ np.array([.299, .587, .114]); mx, mn = rgb.max(2), rgb.min(2); sat = (mx - mn) / np.maximum(mx, 1)
    w = np.clip((sat - .08) / .14, 0, 1) * np.clip((L - 18) / 40, 0, 1)
    c = _rgb(hexcolor); Lc = c @ np.array([.299, .587, .114])
    tinted = np.clip(c * (L / ref)[..., None] * (ref / Lc), 0, 255)
    hi = np.clip((L - 200) / 50, 0, 1)[..., None] * .35
    tinted = tinted * (1 - hi) + 255 * hi
    out = rgb * (1 - w[..., None]) + tinted * w[..., None]
    return Image.fromarray(np.dstack([out, al]).astype('uint8'), 'RGBA')

def recolor_masked(rgb, hexcolor, ref_box=(700, 300, 1000, 900), tol=34):
    """Troca a cor do filamento numa foto de carretel: pega os pixels parecidos com a cor de referência
    (amostra em ref_box) e leva para a cor alvo, mantendo a luz/sombra de cada pixel."""
    a = np.array(rgb.convert('RGB'), float)
    ref = np.median(a[ref_box[1]:ref_box[3], ref_box[0]:ref_box[2]].reshape(-1, 3), axis=0)
    # distância de crominância (ignora claro/escuro) + limite de saturação
    s = a.sum(2, keepdims=True) + 1e-6; rs = ref / ref.sum()
    dc = np.sqrt(((a / s - rs) ** 2).sum(2)) * 255
    L = a @ np.array([.299, .587, .114]); Lr = ref @ np.array([.299, .587, .114])
    m = np.clip(1 - (dc - tol * .35) / (tol * .65), 0, 1) * np.clip((L - 25) / 30, 0, 1) * np.clip((255 - L) / 6 + .2, 0, 1)
    sat = (a.max(2) - a.min(2)) / np.maximum(a.max(2), 1); sr = (ref.max() - ref.min()) / max(ref.max(), 1)
    m = m * np.clip((sat - sr * .45) / (sr * .3), 0, 1)
    # só a região contínua do filamento (a partir do centro da amostra), para não manchar a etiqueta
    b = Image.fromarray(((m > .35) * 255).astype('uint8')).filter(ImageFilter.MaxFilter(3))
    ImageDraw.floodfill(b, ((ref_box[0] + ref_box[2]) // 2, (ref_box[1] + ref_box[3]) // 2), 128)
    reg = Image.fromarray(((np.array(b) == 128) * 255).astype('uint8')).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1))
    m = m * (np.array(reg, float) / 255)
    m = np.array(Image.fromarray((m * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(1.2)), float) / 255
    c = _rgb(hexcolor); Lc = c @ np.array([.299, .587, .114])
    k = L / Lr
    tinted = np.clip(c[None, None, :] * k[..., None], 0, 255)
    if Lc > 200:   # cores muito claras: preserva o relevo com sombras neutras
        tinted = np.clip(c[None, None, :] * (0.55 + 0.45 * k[..., None]), 0, 255) * np.clip(k[..., None], .55, 1.0) ** .6
    hi = np.clip((L - Lr * 1.18) / 40, 0, 1)[..., None] * .5
    tinted = tinted * (1 - hi) + 255 * hi
    out = a * (1 - m[..., None]) + tinted * m[..., None]
    return Image.fromarray(np.clip(out, 0, 255).astype('uint8'))
