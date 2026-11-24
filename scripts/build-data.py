#!/usr/bin/env python3
"""Genera public/data/{exercises,instructions}.json desde free-exercise-db + traducciones.
Uso: python3 scripts/build-data.py <exercises.json> <dir_traducciones>"""
import json, sys, glob, os, datetime
src, esdir = sys.argv[1], sys.argv[2]
out = os.path.join(os.path.dirname(__file__), '..', 'public', 'data')
EQ = {'barbell':'barbell','dumbbell':'dumbbell','cable':'cable','machine':'machine','kettlebells':'kettlebell',
      'bands':'band','body only':'body',None:'body','e-z curl bar':'ezbar','medicine ball':'medball',
      'exercise ball':'ball','foam roll':'foam','other':'other'}
LV = {'beginner':1,'intermediate':2,'expert':3}
es = {}
for f in sorted(glob.glob(os.path.join(esdir, 's[0-9][0-9].json'))):
    try: es.update(json.load(open(f, encoding='utf-8')))
    except Exception as e: print('WARN traducción inválida', f, e)
data = json.load(open(src, encoding='utf-8'))
idx, ins, miss, seen = [], {}, 0, set()
for x in data:
    if x['id'] in seen: continue
    seen.add(x['id'])
    if not x['instructions'] or len(x.get('images', [])) < 2:
        print('OMITIDO (sin instrucciones o sin imágenes):', x['id']); continue
    t = es.get(x['id'])
    ok = bool(t) and isinstance(t.get('i'), list) and len(t['i']) == len(x['instructions']) and t.get('n')
    if not ok: miss += 1
    idx.append({'id': x['id'], 'n': t['n'] if ok else x['name'], 'e': x['name'], 'eq': EQ[x.get('equipment')],
                'lv': LV[x['level']], 'f': x.get('force') or '', 'm': x.get('mechanic') or '', 'c': x['category'],
                'p': x['primaryMuscles'], 's': x['secondaryMuscles'], 'g': len(x.get('images', [])), 'tr': 1 if ok else 0})
    ins[x['id']] = t['i'] if ok else x['instructions']
meta = {'source': 'free-exercise-db (yuhonas) — dominio público (Unlicense)', 'count': len(idx),
        'translated': len(idx) - miss, 'built': datetime.date.today().isoformat()}
json.dump({'meta': meta, 'items': idx}, open(os.path.join(out, 'exercises.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
json.dump(ins, open(os.path.join(out, 'instructions.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(meta)
