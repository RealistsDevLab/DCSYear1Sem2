#!/bin/bash
echo "🚀 Deploying TheRealistDevLab..."

python3 - << 'PYEOF'
import os, re

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

with open('index.html', 'w') as fh:
    fh.write(new_content)

print(f"✅ {len(files)} photos restored.")
PYEOF

git add .
git commit -m "Deploy update" 2>/dev/null || echo "Nothing new to commit"
git push
echo "✅ Done! https://realistsdevlab.github.io/DCSYear1Sem2"
