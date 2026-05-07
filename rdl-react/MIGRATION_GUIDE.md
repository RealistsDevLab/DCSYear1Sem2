# TheRealistDevLab — React Migration Guide
## From single index.html → React + Vite

---

## PHASE 1 — Get It Running (30 minutes)

### Step 1: Install Node.js
You need Node.js installed on your machine first.

1. Go to https://nodejs.org
2. Download the **LTS version** (the left button)
3. Install it (Next → Next → Finish)
4. Open your terminal and confirm it worked:
   ```
   node --version
   ```
   You should see something like `v20.x.x`

---

### Step 2: Set up the project folder
Copy the `rdl-react` folder I gave you into your `DCSYear1Sem2` folder,
OR create a new separate folder for it. Then open terminal there:

```bash
cd rdl-react
npm install
```

This downloads all dependencies (React, Firebase, Vite, etc.).
It creates a `node_modules` folder — takes 1-2 minutes.

---

### Step 3: Start the dev server
```bash
npm run dev
```

You'll see:
```
  VITE v5.x.x  ready in 300ms
  ➜  Local:   http://localhost:5173/DCSYear1Sem2/
```

Open that URL in your browser. You should see the login page.
**Every time you save a file, the browser updates instantly** — no refresh needed.

---

### Step 4: Test login works
Try logging in with your admin password. If it works, Firebase is connected.

If you get a Firebase error, check `.env` — make sure all the values match
your Firebase config exactly.

---

## PHASE 2 — Understand the structure (15 minutes)

```
rdl-react/
├── index.html              ← Vite's entry point (tiny, just loads the app)
├── vite.config.js          ← Build config (set your GitHub repo name here)
├── .env                    ← Firebase + Cloudinary secrets (NOT committed to git)
├── package.json            ← Dependencies
└── src/
    ├── main.jsx            ← Mounts the app (like the <script> at bottom of HTML)
    ├── App.jsx             ← Routing — maps URLs to pages
    ├── index.css           ← Global styles (your CSS variables live here)
    │
    ├── context/
    │   └── AuthContext.jsx ← Global login state (replaces _currentMember variable)
    │
    ├── services/
    │   ├── firebase.js     ← All your Firebase functions (replaces window.FB)
    │   ├── cloudinary.js   ← Cloudinary upload (replaces cloudinaryUpload())
    │   └── auth.js         ← Login logic (replaces doLogin, doAdminLogin)
    │
    ├── components/
    │   └── AppShell.jsx    ← Sidebar + layout (the persistent wrapper)
    │
    └── pages/
        ├── LoginPage.jsx   ← ✅ Already migrated
        ├── Dashboard.jsx   ← ✅ Already migrated
        ├── Gallery.jsx     ← ✅ Already migrated (with all photo upload fixes)
        ├── Quiz.jsx        ← 🚧 Stub (migrate next)
        ├── Flashcards.jsx  ← 🚧 Stub
        ├── PastPapers.jsx  ← 🚧 Stub
        ├── Leaderboard.jsx ← 🚧 Stub
        ├── Discussion.jsx  ← 🚧 Stub
        ├── Timetable.jsx   ← 🚧 Stub
        ├── Attendance.jsx  ← 🚧 Stub
        ├── CodePractice.jsx← 🚧 Stub
        ├── Profile.jsx     ← 🚧 Stub
        ├── Settings.jsx    ← 🚧 Stub (admin only)
        └── Admin.jsx       ← 🚧 Stub (admin only)
```

**The rule:** Each file in `pages/` = one screen in your app.
Each file in `services/` = one group of data operations.
You never need to touch `main.jsx` or `App.jsx` unless adding a new page.

---

## PHASE 3 — Migrate pages one by one

The pattern for migrating any page is always the same 3 steps:

### The migration pattern (repeat for every page):

**Step A:** Find the matching section in `index.html`
  - Look for the `// ══ QUIZ SYSTEM ══` comment (or whatever page you're doing)
  - Copy the HTML template AND the JS functions for that section

**Step B:** Create the React component
  - Open the matching file in `src/pages/`
  - Replace the stub export with a real component
  - Paste your logic inside `useEffect` and `useState` hooks
  - Replace `document.getElementById(...)` with React state variables

**Step C:** Replace Firebase calls
  - Old: `window.FB.getQuizzes()`
  - New: `import { getQuizzes } from '../services/firebase'` then call `getQuizzes()`

---

### Migrating Quiz.jsx — worked example

Old code in index.html:
```js
// ══ QUIZ SYSTEM ══
async function buildQuiz() {
  const quizzes = await window.FB.getQuizzes();
  document.getElementById('quiz-list').innerHTML = quizzes.map(q => `
    <div class="quiz-card">${q.title}</div>
  `).join('');
}
```

New code in Quiz.jsx:
```jsx
import { useState, useEffect } from 'react'
import { getQuizzes } from '../services/firebase'

export default function Quiz() {
  const [quizzes, setQuizzes] = useState([])

  useEffect(() => {
    getQuizzes().then(setQuizzes)
  }, [])

  return (
    <div>
      {quizzes.map(q => (
        <div key={q._key} className="quiz-card">{q.title}</div>
      ))}
    </div>
  )
}
```

**Key translation rules:**
| Old (index.html)                          | New (React)                            |
|-------------------------------------------|----------------------------------------|
| `document.getElementById('x').innerHTML`  | `useState` + JSX render                |
| `window.FB.getPhotos()`                   | `import { getPhotos } from '../services/firebase'` |
| `onclick="doThing()"`                     | `onClick={doThing}`                    |
| Global variables like `let allPhotos`     | `const [photos, setPhotos] = useState([])` |
| `onValue(ref(db,...), cb)` listener        | `useEffect(() => { const unsub = onGallery(cb); return unsub }, [])` |

---

## PHASE 4 — Deploy to GitHub Pages

### Step 1: Update vite.config.js
Make sure the `base` matches your GitHub repo name:
```js
base: '/DCSYear1Sem2/',   // ← your exact repo name
```

### Step 2: Install the deploy tool (one time only)
```bash
npm install --save-dev gh-pages
```

### Step 3: Add your repo to git remote (if not already)
```bash
git remote add origin https://github.com/realistsdevlab/DCSYear1Sem2.git
```

### Step 4: Deploy
```bash
npm run deploy
```

This runs `vite build` (compiles everything into a `dist/` folder)
then pushes it to the `gh-pages` branch of your repo automatically.

Your site will be live at:
`https://realistsdevlab.github.io/DCSYear1Sem2/`

**After the first deploy, all future deploys are just:**
```bash
npm run deploy
```
No manual git add/commit/push needed for the site.

---

## PHASE 5 — Keep old site running while you build

You don't have to switch all at once. You can:

1. Keep your current `index.html` deployed on GitHub Pages
2. Build the React version locally with `npm run dev`
3. When it's ready (all pages migrated and tested), run `npm run deploy`

The React version will replace the old one — same URL, same Firebase data.
Your members won't lose any quiz results, photos, or flashcards.

---

## Common questions

**Q: My .env file — should I commit it to GitHub?**
No. It's in `.gitignore` already. Your Firebase keys stay on your machine only.
For GitHub Pages deployment, Vite bakes the env values into the built files
(that's fine for client-side Firebase — same as having them in index.html).

**Q: Can I keep using the same Firebase database?**
Yes. All the Firebase functions in `src/services/firebase.js` use the exact
same paths (`gallery`, `members`, `quizzes`, etc.) as before.
No data migration needed.

**Q: What about the service worker (sw.js)?**
Copy your existing `sw.js` into the `rdl-react/public/` folder.
Vite serves everything in `public/` as-is alongside the built app.

**Q: What about manifest.json?**
Same — copy it into `rdl-react/public/`.

**Q: CodeMirror for Code Practice?**
In React, install it properly:
```bash
npm install @codemirror/view @codemirror/state @codemirror/lang-javascript
```
Then use the `useCodeMirror` pattern in `CodePractice.jsx`.

---

## Migration order (recommended)

Do these first — they teach you the pattern with simple pages:
1. ✅ LoginPage (done)
2. ✅ Dashboard (done)
3. ✅ Gallery (done — with all upload fixes)
4. 🔜 Discussion (just a list + form — good starter)
5. 🔜 Attendance (same structure)
6. 🔜 Flashcards (cards with flip — fun to build)
7. 🔜 Quiz (bigger, but you know the data already)
8. 🔜 Leaderboard
9. 🔜 PastPapers
10. 🔜 Timetable
11. 🔜 Settings (admin upload, member management)
12. 🔜 Admin
13. 🔜 CodePractice (CodeMirror integration — save for last)
