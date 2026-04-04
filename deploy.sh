#!/bin/bash
# ══ TheRealistDevLab — Deploy Script ══════════════════════════════════════════
# Usage: bash deploy.sh
# Automatically: restores photos + updates cache version + pushes to GitHub
# No separate restore_photos.py needed — everything is handled here
# ══════════════════════════════════════════════════════════════════════════════

set -e
echo "🚀 Deploying TheRealistDevLab..."

cd ~/DCSYear1Sem2

# ── Step 1: Restore photos + update cache version ─────────────────────────────
python3 - << 'PYEOF'
import os, re, time

photos_dir = "photos"

# Safely list photos — handle missing folder
if not os.path.exists(photos_dir):
    print("⚠️  photos/ folder not found — skipping photo restore")
    files = []
else:
    files = sorted([f for f in os.listdir(photos_dir) if f.lower().endswith('.jpg')])

def make_caption(f):
    name = f.replace('.jpg','').replace('.JPG','')
    if 'WA' in name:
        date = name.replace('IMG-','').split('-WA')[0]
        parts = date.split('-')
        if len(parts) == 3:
            months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
            try:
                y, m, d = parts
                return f"TheRealists — {months[int(m)]} {int(d)}, {y}"
            except:
                pass
    return f"TheRealists — {name}"

# Build PHOTOS array
lines = ['const PHOTOS = [']
for f in files:
    caption = make_caption(f)
    # Escape any single quotes in filenames
    safe_f = f.replace("'", "\\'")
    safe_caption = caption.replace('"', '\\"')
    lines.append(f'  {{ src: "photos/{safe_f}", caption: "{safe_caption}" }},')
lines.append('];')
photos_js = '\n'.join(lines)

# Read index.html
with open('index.html', 'r', encoding='utf-8') as fh:
    content = fh.read()

# Restore PHOTOS array
content = re.sub(r'const PHOTOS = \[.*?\];', photos_js, content, flags=re.DOTALL)

# Update SW cache version — forces all browsers to reload new version
version = str(int(time.time()))
content = re.sub(r"const CACHE = 'rdl-v[\w]+'", f"const CACHE = 'rdl-v{version}'", content)

# Write back
with open('index.html', 'w', encoding='utf-8') as fh:
    fh.write(content)

# Update sw.js cache version too
if os.path.exists('sw.js'):
    with open('sw.js', 'r', encoding='utf-8') as fh:
        sw = fh.read()
    sw = re.sub(r"const CACHE = 'rdl-v[\w]+'", f"const CACHE = 'rdl-v{version}'", sw)
    with open('sw.js', 'w', encoding='utf-8') as fh:
        fh.write(sw)
    print(f"✅ sw.js cache version → rdl-v{version}")

if files:
    print(f"✅ {len(files)} photos restored into PHOTOS array")
else:
    print("ℹ️  No photos to restore (photos/ folder empty or missing)")

print(f"✅ Cache version → rdl-v{version}")
PYEOF

# ── Step 2: Stage, commit and push ────────────────────────────────────────────
git add .

# Only commit if there are actual changes
if git diff --cached --quiet; then
    echo "ℹ️  Nothing changed — already up to date"
else
    git commit -m "Deploy $(date '+%Y-%m-%d %H:%M')"
    git push
    echo ""
    echo "✅ Done! Site live at https://realistsdevlab.github.io/DCSYear1Sem2"
    echo "📱 Members will see updates automatically — no hard refresh needed!"
fi
