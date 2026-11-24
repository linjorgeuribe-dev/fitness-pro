"""Tratamiento uniforme para todo el catálogo: la persona (y lo que el modelo reconoce como sujeto) queda a color;
el resto de la foto NO se borra, se atenúa hacia el fondo de la app. Así las máquinas y poleas siguen visibles."""
import sys, os, time
from PIL import Image, ImageOps, ImageFilter
from rembg import remove, new_session
src, dst = sys.argv[1], sys.argv[2]
only = None
shard, shards = (int(sys.argv[3]), int(sys.argv[4])) if len(sys.argv) > 4 else (0, 1)
ses = new_session('isnet-general-use')
BG = (23, 26, 31)
t0 = time.time(); n = 0
for i, d in enumerate(sorted(os.listdir(src))):
    if i % shards != shard: continue
    p = os.path.join(src, d)
    if not os.path.isdir(p): continue
    for f in sorted(os.listdir(p)):
        if not f.endswith('.jpg'): continue
        o = os.path.join(dst, d, f[:-4] + '.webp')
        if os.path.exists(o) and not only: continue
        im = Image.open(os.path.join(p, f)).convert('RGB')
        a = remove(im, session=ses, only_mask=True).convert('L').filter(ImageFilter.GaussianBlur(0.8))
        gray = ImageOps.grayscale(im).filter(ImageFilter.GaussianBlur(1.2)).convert('RGB')
        back = Image.blend(Image.new('RGB', im.size, BG), gray, 0.22)   # entorno atenuado
        out = Image.composite(im, back, a)
        out.thumbnail((480, 480)); os.makedirs(os.path.dirname(o), exist_ok=True)
        out.save(o, 'WEBP', quality=64, method=5); n += 1
        if n % 50 == 0: print(n, round(time.time() - t0), 's', flush=True)
print('listo', n, round(time.time() - t0), 's', flush=True)
