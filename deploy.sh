#!/bin/bash
echo "🚀 Deploying TheRealistDevLab..."

cd ~/DCSYear1Sem2

python3 - << 'PYEOF'
import os, re, time

# ── Restore photos ─────────────────────────────────────────────────
photos_dir = "photos"
files = sorted([f for f in os.listdir(photos_dir) if f.lower().endswith('.jpg')])

def make_caption(f):
    f = f.replace('.jpg','').replace('.JPG','')
    if 'WA' in f:
        date = f.replace('IMG-','').split('-WA')[0]
        parts = date.split('-')
        if len(parts) == 3:
            months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
            try:
                y,m,d = parts
                return f"TheRealists — {months[int(m)]} {int(d)}, {y}"
            except: pass
    return f"TheRealists — {f}"

lines = ['const PHOTOS = [']
for f in files:
    lines.append(f'  {{ src: "photos/{f}", caption: "{make_caption(f)}" }},')
lines.append('];')

with open('index.html', 'r') as fh:
    content = fh.read()

new_content = re.sub(r'const PHOTOS = \[.*?\];', '\n'.join(lines), content, flags=re.DOTALL)

# ── Update SW cache version to force all browsers to reload ────────
version = str(int(time.time()))
new_content = re.sub(r"const CACHE = 'rdl-v\d+'", f"const CACHE = 'rdl-v{version}'", new_content)

with open('index.html', 'w') as fh:
    fh.write(new_content)

# Also update sw.js cache version
if os.path.exists('sw.js'):
    with open('sw.js', 'r') as fh:
        sw = fh.read()
    sw = re.sub(r"const CACHE = 'rdl-v\d+'", f"const CACHE = 'rdl-v{version}'", sw)
    with open('sw.js', 'w') as fh:
        fh.write(sw)

print(f"✅ {len(files)} photos restored.")
print(f"✅ Cache version updated to rdl-v{version}")
PYEOF

git add .
git commit -m "Deploy $(date '+%Y-%m-%d %H:%M')"
git push
echo "✅ Done! Site live at https://realistsdevlab.github.io/DCSYear1Sem2"
echo "📱 Members will see updates automatically — no hard refresh needed!"
