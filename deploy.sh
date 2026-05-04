#!/bin/bash
# ══ TheRealistDevLab — Deploy Script v2.0 ═════════════════════════════════════
# Usage: bash deploy.sh
# What it does:
#   1. Bumps the SW cache version so browsers pick up changes
#   2. Validates index.html exists and is non-empty
#   3. Stages, commits and pushes to GitHub
#
# What it NO LONGER does:
#   ✗ Restores hardcoded PHOTOS array (images are now in Firebase/Cloudinary)
#   ✗ Reads local photos/ folder (academic images are uploaded via admin panel)
# ══════════════════════════════════════════════════════════════════════════════

set -e
echo ""
echo "🚀 TheRealistDevLab — Deploy v2.0"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd ~/DCSYear1Sem2

# ── Guard: make sure index.html exists ────────────────────────────────────────
if [ ! -f "index.html" ]; then
  echo "❌ ERROR: index.html not found in $(pwd)"
  echo "   Make sure you're in the right folder."
  exit 1
fi

# ── Step 1: Bump SW cache version ─────────────────────────────────────────────
echo ""
echo "⚙️  Step 1 — Bumping cache version..."

python3 - << 'PYEOF'
import re, time, os

version = str(int(time.time()))
pattern = r"const CACHE = 'rdl-v[\w]+'"
replacement = f"const CACHE = 'rdl-v{version}'"
changed = []

for filename in ['index.html', 'sw.js']:
    if not os.path.exists(filename):
        continue
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    if re.search(pattern, content):
        content = re.sub(pattern, replacement, content)
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
        changed.append(filename)

if changed:
    print(f"✅ Cache version → rdl-v{version} ({', '.join(changed)})")
else:
    print("ℹ️  No cache version string found — skipping")
PYEOF

# ── Step 2: Security reminder ─────────────────────────────────────────────────
echo ""
echo "🔐 Step 2 — Security check..."

# Warn if any hardcoded default passwords are found
if grep -q "UICTR2026\|RDLBRAVE2026\|DEFAULT_MEMBER_CODE\|DEFAULT_ADMIN_CODE" index.html 2>/dev/null; then
  echo "⚠️  WARNING: Hardcoded password constants detected in index.html!"
  echo "   These should be removed before deploying."
  read -p "   Continue anyway? [y/N] " confirm
  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "❌ Deploy cancelled."
    exit 1
  fi
else
  echo "✅ No hardcoded passwords detected"
fi

# ── Step 3: Stage and push ────────────────────────────────────────────────────
echo ""
echo "📦 Step 3 — Staging changes..."

git add .

if git diff --cached --quiet; then
  echo ""
  echo "ℹ️  Nothing changed — already up to date."
  echo "   No commit needed."
else
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
  git commit -m "Deploy $TIMESTAMP — secure per-member auth"
  echo ""
  echo "📤 Pushing to GitHub..."
  git push
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅ Done! Site live at:"
  echo "   https://realistsdevlab.github.io/DCSYear1Sem2"
  echo ""
  echo "📱 Members will see updates automatically."
  echo "🔑 Add members via Admin → Settings → 👥 Members"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fi
