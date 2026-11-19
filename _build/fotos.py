# Oveja Negra: SUS fotos de Instagram con un mismo tratamiento (Receta Corrado).
# Noche de vinoteca: se mezcla cada foto con un duotono negro → tinto → crema, sin matar las etiquetas.
# Uso: python -I _build/fotos.py
from pathlib import Path
from PIL import Image, ImageOps, ImageEnhance, ImageStat
R = Path(__file__).resolve().parent.parent
DARK, MID, LIGHT, MIX = '#0d0b0b', '#7a1d1d', '#f1e6d6', .30
IG = lambda i: R / 'assets' / 'raw' / 'ig' / i
# destino: (origen, ancho, alto, foco x, foco y)
MAPA = {
 # retratos del hero (2:3)
 'h-barra':     ('r_DL-9h0zSv0j.jpg', 1000, 1500, .5, .45),
 'hero-ancha':  ('p_DKQHZm1i3JQ.jpg', 1600, 1000, .5, .42),  # portada en compu
 # intro
 'fachada':     ('r_DNRTe1aBys2.jpg', 900, 1200, .5, .3),
 # noches (paneles altos)
 'n-feria':     ('r_DPPaJxRgbUb.jpg', 900, 1400, .5, .5),
 'n-cata':      ('r_DbohzLbBr4s.jpg', 1100, 1400, .5, .0, .88),
 'n-noches':  ('p_DfQTK0Igegt.jpg', 1100, 1400, .5, .5),
 'n-copas':     ('r_DOKAlRkARBW.jpg', 900, 1400, .5, .55),
 # galería
 'g-eligiendo': ('r_DL3G0j4yHKu.jpg', 900, 1200, .5, .4),
 'g-barra':     ('r_DLnlfvty08g.jpg', 1250, 1000, .5, .6),
 'g-dupla':     ('r_DL80RBCNf-B.jpg', 900, 1200, .5, .35),
 'g-rosados':   ('r_DTOBlDlASeB.jpg', 1250, 1000, .5, .05),
 'reserva':     ('r_DLtDtwnsFx0.jpg', 1000, 1250, .5, .3),
}
out = R / 'assets' / 'img'
for f in out.glob('*.jpg'): f.unlink()
grounds = {}
for dst, (src, w, h, fx, fy, *cut) in MAPA.items():
    im = Image.open(IG(src)).convert('RGB')
    if cut: im = im.crop((0, 0, im.width, int(im.height * cut[0])))
    im = ImageOps.fit(im, (w, h), Image.LANCZOS, centering=(fx, fy))
    g = ImageOps.autocontrast(im.convert('L'), cutoff=1)
    duo = ImageOps.colorize(g, black=DARK, mid=MID, white=LIGHT, midpoint=110)
    im = ImageEnhance.Color(im).enhance(.9)
    col = Image.blend(im, duo, MIX)
    col.save(out / f'{dst}.jpg', quality=78, optimize=True, progressive=True)
    if dst.startswith('h-'):
        m = ImageStat.Stat(col.resize((40, 60))).median
        grounds[dst] = '#%02x%02x%02x' % tuple(int(c * .45) for c in m)
print(grounds)
# logo: la foto de perfil (oveja calavera blanca sobre mancha negra, fondo blanco).
# Se arma una mancha con la oveja calada (transparente) en dos tintas.
p = Image.open(IG('perfil0.jpg')).convert('L')
a = p.point(lambda v: 255 if v < 110 else (0 if v > 170 else int((170 - v) * 255 / 60)))
for name, ink in (('logo-crema', LIGHT), ('logo-negro', DARK)):
    L = Image.new('RGBA', p.size, ink); L.putalpha(a)
    L.save(R / 'assets' / f'{name}.png', optimize=True)
print('ok', len(MAPA))
