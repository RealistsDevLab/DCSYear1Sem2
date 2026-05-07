#!/bin/bash
# ══ TheRealistDevLab — Deploy Script v3.0 ═════════════════════════════════════
# Usage: bash deploy.sh
# What it does:
#   1. Validates index.html is present and non-empty
#   2. Bumps the SW cache version in sw.js (and index.html if found there)
#   3. Runs a security check for hardcoded passwords
#   4. Pulls latest from remote to avoid push conflicts
#   5. Stages, commits with a useful message, and pushes
# ══════════════════════════════════════════════════════════════════════════════

# Do NOT use set -e — we handle errors ourselves so messages are useful
echo ""
echo "🚀 TheRealistDevLab — Deploy v3.0"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Resolve project folder ─────────────────────────────────────────────────
# Works whether you run it from inside the repo or from anywhere else
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$SCRIPT_DIR"

# Fallback: if the script isn't in the repo, try the default location
if [ ! -f "$REPO_DIR/index.html" ]; then
  REPO_DIR="$HOME/DCSYear1Sem2"
fi

if [ ! -d "$REPO_DIR" ]; then
  echo "❌ ERROR: Could not find project folder."
  echo "   Expected: $REPO_DIR"
  echo "   Run this script from inside the DCSYear1Sem2 folder."
  exit 1
fi

cd "$REPO_DIR"
echo "📁 Working in: $REPO_DIR"

# ── Step 1: Validate index.html ───────────────────────────────────────────────
echo ""
echo "🔍 Step 1 — Validating index.html..."

if [ ! -f "index.html" ]; then
  echo "❌ ERROR: index.html not found."
  exit 1
fi

FILE_SIZE=$(wc -c < "index.html")
if [ "$FILE_SIZE" -lt 50000 ]; then
  echo "❌ ERROR: index.html looks too small (${FILE_SIZE} bytes — expected 100KB+)."
  echo "   This usually means the file was accidentally emptied or corrupted."
  echo "   Deploy cancelled to protect the live site."
  exit 1
fi

echo "✅ index.html looks good ($(echo "$FILE_SIZE / 1024" | bc)KB)"

# ── Step 2: Bump SW cache version ─────────────────────────────────────────────
echo ""
echo "⚙️  Step 2 — Bumping SW cache version..."

python3 - << 'PYEOF'
import re, time, os

version     = str(int(time.time()))
pattern     = r"const CACHE = 'rdl-v[\w]+'"
replacement = f"const CACHE = 'rdl-v{version}'"
changed     = []
missing     = []

for filename in ['sw.js', 'index.html']:
    if not os.path.exists(filename):
        missing.append(filename)
        continue
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    if re.search(pattern, content):
        content = re.sub(pattern, replacement, content)
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
        changed.append(filename)

if changed:
    print(f"✅ Cache version bumped → rdl-v{version}")
    print(f"   Updated in: {', '.join(changed)}")
else:
    print("⚠️  WARNING: No 'const CACHE = rdl-v...' string found in sw.js or index.html")
    print("   Browsers may serve stale cached content after this deploy.")
    print("   Check that sw.js exists and contains:  const CACHE = 'rdl-v...'")

if missing:
    print(f"   (Not found, skipped: {', '.join(missing)})")
PYEOF

# ── Step 3: Security check ────────────────────────────────────────────────────
echo ""
echo "🔐 Step 3 — Security check..."

if grep -q "UICTR2026\|RDLBRAVE2026\|DEFAULT_MEMBER_CODE\|DEFAULT_ADMIN_CODE" index.html 2>/dev/null; then
  echo "⚠️  WARNING: Hardcoded password constants detected in index.html!"
  echo "   These should be removed before deploying to a public repo."
  printf "   Continue anyway? [y/N] "
  read -r confirm
  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "❌ Deploy cancelled."
    exit 1
  fi
else
  echo "✅ No hardcoded passwords detected"
fi

# ── Step 4: Pull latest to avoid conflicts ────────────────────────────────────
echo ""
echo "🔄 Step 4 — Pulling latest from remote..."

# Stash any unstaged changes so git pull --rebase doesn't refuse
STASHED=false
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "   (Stashing local changes temporarily…)"
  if git stash push -m "deploy-script-autostash" 2>&1; then
    STASHED=true
  else
    echo "❌ ERROR: Could not stash local changes. Run 'git stash' manually then re-run."
    exit 1
  fi
fi

if git pull --rebase 2>&1; then
  echo "✅ Up to date with remote"
else
  # Restore stash before exiting so no work is lost
  if $STASHED; then git stash pop 2>/dev/null; fi
  echo ""
  echo "❌ ERROR: git pull --rebase failed."
  echo "   There may be a real merge conflict with the remote."
  echo "   Run: git stash pop  then resolve conflicts manually."
  exit 1
fi

# Restore stashed changes on top of the pulled state
if $STASHED; then
  echo "   (Restoring stashed changes…)"
  if ! git stash pop 2>&1; then
    echo "⚠️  WARNING: Could not auto-restore stash. Run: git stash pop"
  fi
fi

# ── Step 5: Stage, commit and push ────────────────────────────────────────────
echo ""
echo "📦 Step 5 — Staging changes..."
git add .

if git diff --cached --quiet; then
  echo ""
  echo "ℹ️  Nothing to commit — working tree is already up to date."
  echo "   No push needed."
  exit 0
fi

# Show a summary of what changed
echo ""
echo "📝 Changed files:"
git diff --cached --name-only | sed 's/^/   • /'

# Ask for a meaningful commit message
echo ""
printf "✏️  Describe what you changed (or press Enter for auto message): "
read -r USER_MSG

if [ -z "$USER_MSG" ]; then
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
  COMMIT_MSG="Deploy $TIMESTAMP"
else
  COMMIT_MSG="$USER_MSG"
fi

git commit -m "$COMMIT_MSG"

echo ""
echo "📤 Pushing to GitHub..."

if git push 2>&1; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅ Deployed successfully!"
  echo "   🌐 https://realistsdevlab.github.io/DCSYear1Sem2"
  echo ""
  echo "   📱 Members will see changes automatically."
  echo "   🔑 Manage members: Admin → Settings → 👥 Members"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
  echo ""
  echo "❌ ERROR: git push failed."
  echo "   Possible causes:"
  echo "   • No internet connection"
  echo "   • GitHub token expired (run: git remote -v  to check remote)"
  echo "   • Remote has new commits — try: git pull --rebase  then re-run"
  echo ""
  echo "   Your commit was saved locally. Run 'git push' manually once fixed."
  exit 1
fi
