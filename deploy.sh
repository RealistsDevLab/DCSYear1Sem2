#!/bin/bash
# ══ TheRealists Study Hub — Deploy Script v5.0 ════════════════════════════════
# Usage: bash deploy.sh
#
# Supports two project modes — auto-detected:
#   [VANILLA]  index.html in repo root → bump cache, security check, git push
#   [REACT]    rdl-react/ subfolder    → npm install check, vite build, gh-pages
#
# Both modes:
#   • Pull latest from remote before pushing (avoids conflicts)
#   • Security check for hardcoded passwords
#   • Friendly error messages
#
# Fix v5.0: Lowered minimum file size to 15KB (optimized HTML is fine)
# ══════════════════════════════════════════════════════════════════════════════

# ══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS — defined first so they're available everywhere below
# ══════════════════════════════════════════════════════════════════════════════

function _stash_and_pull() {
  cd "$REPO_DIR"
  STASHED=false
  if ! git diff --quiet || ! git diff --cached --quiet; then
    git stash push -m "deploy-autostash" 2>&1 && STASHED=true
  fi
  if ! git pull --rebase 2>&1; then
    $STASHED && git stash pop 2>/dev/null
    echo "❌ git pull --rebase failed. Resolve conflicts manually then re-run."
    exit 1
  fi
  $STASHED && git stash pop 2>/dev/null || true
  echo "✅ Up to date with remote"
}

function _print_success_vanilla() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅ Deployed successfully!"
  echo "   🌐 https://realistsdevlab.github.io/DCSYear1Sem2"
  echo ""
  echo "   📱 Members will see updates automatically."
  echo "   🔑 Login with email/phone + access code (admin only via settings)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

function _print_push_error() {
  echo ""
  echo "❌ git push failed. Possible causes:"
  echo "   • No internet connection"
  echo "   • GitHub token expired — run: git remote -v"
  echo "   • Remote has new commits — run: git pull --rebase then re-run"
  echo ""
  echo "   Your commit is saved locally. Run 'git push' once fixed."
}

# ══════════════════════════════════════════════════════════════════════════════
# MAIN SCRIPT
# ══════════════════════════════════════════════════════════════════════════════

echo ""
echo "📚 TheRealists Study Hub — Deploy v5.0"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Resolve repo root ──────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$SCRIPT_DIR"

if [ ! -d "$REPO_DIR/.git" ] && [ -d "$HOME/DCSYear1Sem2/.git" ]; then
  REPO_DIR="$HOME/DCSYear1Sem2"
fi

if [ ! -d "$REPO_DIR/.git" ]; then
  echo "❌ ERROR: Not inside a git repository."
  echo "   Run this script from inside DCSYear1Sem2/."
  exit 1
fi

cd "$REPO_DIR"
echo "📁 Repo: $REPO_DIR"

# ── Detect project mode ────────────────────────────────────────────────────────
REACT_DIR="$REPO_DIR/rdl-react"
VANILLA_HTML="$REPO_DIR/index.html"
MODE=""

if [ -d "$REACT_DIR" ] && [ -f "$REACT_DIR/package.json" ]; then
  if [ -f "$VANILLA_HTML" ]; then
    echo ""
    echo "🔀 Detected BOTH projects:"
    echo "   [1] Vanilla  — index.html (current live site)"
    echo "   [2] React    — rdl-react/ (new version)"
    echo ""
    printf "   Which do you want to deploy? [1/2]: "
    read -r MODE_CHOICE
    if [[ "$MODE_CHOICE" == "2" ]]; then
      MODE="react"
    else
      MODE="vanilla"
    fi
  else
    MODE="react"
  fi
elif [ -f "$VANILLA_HTML" ]; then
  MODE="vanilla"
else
  echo "❌ ERROR: Neither index.html nor rdl-react/ found in $REPO_DIR"
  exit 1
fi

echo "🎯 Mode: $(echo $MODE | tr '[:lower:]' '[:upper:]')"

# ══════════════════════════════════════════════════════════════════════════════
# VANILLA MODE — index.html deploy
# ══════════════════════════════════════════════════════════════════════════════
if [ "$MODE" = "vanilla" ]; then

  # ── Step 1: Validate index.html ─────────────────────────────────────────────
  echo ""
  echo "🔍 Step 1 — Validating index.html..."
  FILE_SIZE=$(wc -c < "$VANILLA_HTML")
  # Lowered threshold from 50000 to 15000 bytes (optimized HTML is fine)
  if [ "$FILE_SIZE" -lt 15000 ]; then
    echo "❌ ERROR: index.html is too small (${FILE_SIZE} bytes — expected 15KB+)."
    echo "   Looks corrupted or accidentally emptied. Deploy cancelled."
    exit 1
  fi
  echo "✅ index.html OK ($(echo "$FILE_SIZE / 1024" | bc)KB)"

  # ── Step 2: Bump SW cache version ───────────────────────────────────────────
  echo ""
  echo "⚙️  Step 2 — Bumping SW cache version..."
  python3 - << 'PYEOF'
import re, time, os
version = str(int(time.time()))
pattern = r"const CACHE = 'rdl-v[\w]+'"
replacement = f"const CACHE = 'rdl-v{version}'"
changed = []
for filename in ['sw.js', 'index.html']:
    if not os.path.exists(filename): continue
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    if re.search(pattern, content):
        content = re.sub(pattern, replacement, content)
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
        changed.append(filename)
if changed:
    print(f"✅ Cache bumped → rdl-v{version} ({', '.join(changed)})")
else:
    print("⚠️  No CACHE string found — browsers may serve stale content.")
PYEOF

  # ── Step 3: Security check ───────────────────────────────────────────────────
  echo ""
  echo "🔐 Step 3 — Security check..."
  # Check for common hardcoded password patterns (more comprehensive)
  if grep -qiE "(password|secret|token|key).*=\s*['\"][a-zA-Z0-9]{8,}['\"]" "$VANILLA_HTML" 2>/dev/null; then
    echo "⚠️  WARNING: Possible hardcoded credentials detected in index.html!"
    printf "   Continue anyway? [y/N]: "
    read -r confirm
    [[ "$confirm" != "y" && "$confirm" != "Y" ]] && echo "❌ Deploy cancelled." && exit 1
  else
    echo "✅ No obvious hardcoded passwords detected"
  fi

  # ── Step 4: Pull latest ──────────────────────────────────────────────────────
  echo ""
  echo "🔄 Step 4 — Pulling latest from remote..."
  _stash_and_pull

  # ── Step 5: Commit and push ──────────────────────────────────────────────────
  echo ""
  echo "📦 Step 5 — Staging changes..."
  git add .
  if git diff --cached --quiet; then
    echo "ℹ️  Nothing to commit — already up to date."
    exit 0
  fi
  echo "📝 Changed files:"
  git diff --cached --name-only | sed 's/^/   • /'
  echo ""
  printf "✏️  Describe changes (Enter for auto message): "
  read -r USER_MSG
  COMMIT_MSG="${USER_MSG:-Deploy $(date '+%Y-%m-%d %H:%M') — Study Hub update}"
  git commit -m "$COMMIT_MSG"
  echo ""
  echo "📤 Pushing to GitHub..."
  if git push; then
    _print_success_vanilla
  else
    _print_push_error
    exit 1
  fi

fi

# ══════════════════════════════════════════════════════════════════════════════
# REACT MODE — Vite build + gh-pages deploy
# ══════════════════════════════════════════════════════════════════════════════
if [ "$MODE" = "react" ]; then

  cd "$REACT_DIR"
  echo "📁 React dir: $REACT_DIR"

  # ── Step 1: Check Node.js ────────────────────────────────────────────────────
  echo ""
  echo "🔍 Step 1 — Checking environment..."
  if ! command -v node &>/dev/null; then
    echo "❌ ERROR: Node.js is not installed."
    echo "   Download it from https://nodejs.org (LTS version)"
    exit 1
  fi
  if ! command -v npm &>/dev/null; then
    echo "❌ ERROR: npm not found. Reinstall Node.js from https://nodejs.org"
    exit 1
  fi
  NODE_VER=$(node --version)
  NPM_VER=$(npm --version)
  echo "✅ Node $NODE_VER  /  npm $NPM_VER"

  # ── Step 2: Check .env ──────────────────────────────────────────────────────
  echo ""
  echo "🔐 Step 2 — Checking .env..."
  if [ ! -f ".env" ]; then
    echo "❌ ERROR: .env file not found in rdl-react/."
    echo "   Copy your Firebase config into rdl-react/.env"
    echo "   Example:"
    echo "     VITE_FIREBASE_API_KEY=AIzaSy..."
    echo "     VITE_FIREBASE_PROJECT_ID=therealistdevlab"
    exit 1
  fi
  REQUIRED_KEYS=("VITE_FIREBASE_API_KEY" "VITE_FIREBASE_AUTH_DOMAIN" "VITE_FIREBASE_DATABASE_URL" "VITE_FIREBASE_PROJECT_ID")
  MISSING_KEYS=()
  for key in "${REQUIRED_KEYS[@]}"; do
    grep -q "^${key}=" .env || MISSING_KEYS+=("$key")
  done
  if [ ${#MISSING_KEYS[@]} -gt 0 ]; then
    echo "❌ ERROR: Missing keys in .env:"
    for k in "${MISSING_KEYS[@]}"; do echo "   • $k"; done
    exit 1
  fi
  echo "✅ .env looks good"

  # ── Step 3: Install dependencies ────────────────────────────────────────────
  echo ""
  echo "📦 Step 3 — Checking dependencies..."
  if [ ! -d "node_modules" ]; then
    echo "   node_modules not found — running npm install..."
    if npm install; then
      echo "✅ Dependencies installed"
    else
      echo "❌ npm install failed. Check your internet connection."
      exit 1
    fi
  else
    if [ "package.json" -nt "node_modules" ]; then
      echo "   package.json changed — running npm install..."
      npm install && echo "✅ Dependencies updated" || { echo "❌ npm install failed."; exit 1; }
    else
      echo "✅ Dependencies already installed"
    fi
  fi

  if ! npx gh-pages --version &>/dev/null; then
    echo "   Installing gh-pages..."
    npm install --save-dev gh-pages || { echo "❌ Could not install gh-pages."; exit 1; }
  fi

  # ── Step 4: Security check ───────────────────────────────────────────────────
  echo ""
  echo "🔐 Step 4 — Security check..."
  if git -C "$REPO_DIR" ls-files --error-unmatch rdl-react/.env &>/dev/null 2>&1; then
    echo "⚠️  WARNING: rdl-react/.env is tracked by git!"
    echo "   This means your Firebase keys will be public on GitHub."
    printf "   Continue anyway? [y/N]: "
    read -r confirm
    [[ "$confirm" != "y" && "$confirm" != "Y" ]] && echo "❌ Deploy cancelled." && exit 1
  else
    echo "✅ .env is not committed to git (good)"
  fi

  # ── Step 5: Vite build ───────────────────────────────────────────────────────
  echo ""
  echo "🔨 Step 5 — Building with Vite..."
  if npm run build; then
    DIST_SIZE=$(du -sh dist 2>/dev/null | cut -f1)
    echo "✅ Build complete (dist/ = $DIST_SIZE)"
  else
    echo ""
    echo "❌ BUILD FAILED. Common causes:"
    echo "   • JSX syntax error in a component"
    echo "   • Missing import (check the error line above)"
    echo "   • .env variable not prefixed with VITE_ (e.g. VITE_FIREBASE_API_KEY)"
    exit 1
  fi

  # ── Step 6: Copy public assets to dist if needed ────────────────────────────
  echo ""
  echo "📋 Step 6 — Checking public assets..."
  ASSETS_COPIED=()
  for asset in "sw.js" "manifest.json"; do
    if [ -f "$REPO_DIR/$asset" ] && [ ! -f "dist/$asset" ]; then
      cp "$REPO_DIR/$asset" "dist/$asset"
      ASSETS_COPIED+=("$asset")
    elif [ -f "public/$asset" ]; then
      : # Vite already copies public/ into dist/ automatically
    fi
  done
  if [ ${#ASSETS_COPIED[@]} -gt 0 ]; then
    echo "✅ Copied to dist/: ${ASSETS_COPIED[*]}"
  else
    echo "✅ Public assets OK"
  fi

  # ── Step 7: Deploy to gh-pages ───────────────────────────────────────────────
  echo ""
  echo "🚀 Step 7 — Deploying to GitHub Pages (gh-pages branch)..."
  if npx gh-pages -d dist --dotfiles; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ React app deployed successfully!"
    echo "   🌐 https://realistsdevlab.github.io/DCSYear1Sem2/"
    echo ""
    echo "   ⏳ GitHub Pages takes ~1 min to update."
    echo "   📱 Members will see the new version automatically."
    echo "   🔑 Same Firebase data — no migration needed."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  else
    echo ""
    echo "❌ gh-pages deploy failed. Possible causes:"
    echo "   • No internet connection"
    echo "   • GitHub auth expired — run: git remote -v"
    echo "   • gh-pages branch has a conflict — run: npm run deploy manually"
    exit 1
  fi

  echo ""
  echo "📦 Saving source changes to main branch..."
  cd "$REPO_DIR"
  git add rdl-react/ --ignore-errors 2>/dev/null || true
  git reset HEAD rdl-react/node_modules 2>/dev/null || true
  git reset HEAD rdl-react/dist 2>/dev/null || true
  if ! git diff --cached --quiet; then
    git commit -m "React source update $(date '+%Y-%m-%d %H:%M')"
    git push origin main 2>/dev/null || git push origin master 2>/dev/null || true
    echo "✅ Source committed to main branch"
  else
    echo "ℹ️  No source changes to commit"
  fi

fi