# SCORM Quiz Builder

A browser-based SCORM 1.2 quiz builder. Create, preview, export, and re-import quiz packages that work with any SCORM-compliant LMS.

No backend required — runs entirely as a static site.

## Features

- Create and edit quizzes in the browser
- Multiple choice and true/false questions
- Per-question feedback (correct and incorrect)
- Preview mode (simulates the learner experience without an LMS)
- Export to SCORM 1.2 ZIP, ready to upload to any LMS
- Re-import an exported ZIP to continue editing
- localStorage autosave for the current draft
- Configurable SCORM reporting (score, completion, pass/fail)
- Configurable resume behavior (start fresh, resume, show submitted)
- Shuffle questions and answers

## Tech stack

- React 18 + TypeScript
- Vite
- JSZip (browser-side ZIP generation and parsing)

## Setup and development

**Requirements:** Node.js 18+

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
```

Output is in `dist/`. The entire folder is a self-contained static site.

## Deploying

### GitHub Pages

1. Build: `npm run build`
2. Push the `dist/` folder to the `gh-pages` branch:

```bash
npm install --save-dev gh-pages
```

Add to `package.json`:

```json
"scripts": {
  "deploy": "gh-pages -d dist"
}
```

Then:

```bash
npm run build && npm run deploy
```

Or use a GitHub Actions workflow:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci && npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

> If you deploy to a sub-path (e.g. `https://user.github.io/repo/`), set `base` in `vite.config.ts` to match:
>
> ```ts
> base: '/repo/',
> ```

### CloudFront + S3

1. Build: `npm run build`
2. Upload `dist/` to an S3 bucket with static website hosting enabled
3. Create a CloudFront distribution pointing to the S3 bucket
4. Set the default root object to `index.html`
5. Add a custom error response for 404 → `/index.html` (status 200) for SPA routing

## How the exported SCORM package works

Every exported ZIP contains:

| File | Purpose |
|---|---|
| `imsmanifest.xml` | SCORM 1.2 manifest — declares the course to the LMS |
| `index.html` | Launch file — loaded by the LMS in an iframe |
| `scorm-wrapper.js` | Finds the SCORM 1.2 API in parent frames and wraps it |
| `quiz-runtime.js` | Renders the quiz, grades it, and reports to the LMS |
| `style.css` | Learner-facing styles |
| `quiz-data.json` | Quiz content (runtime data) |
| `quiz-source.json` | Builder source data — re-import this ZIP to edit |

The quiz data is also embedded inline in `index.html` for maximum LMS compatibility (some LMS environments block relative `fetch` requests).

### SCORM 1.2 reporting logic

- **Score:** stored as `cmi.core.score.raw` (0–100)
- **Pass/fail enabled:** sets `cmi.core.lesson_status` to `passed` or `failed`
- **Completion only:** sets `cmi.core.lesson_status` to `completed`
- **Both enabled:** pass/fail takes priority (SCORM 1.2 has one combined status field)
- Learner state (selected answers, submitted state, score) is saved to `cmi.suspend_data`

## Testing exported ZIPs

### SCORM Cloud (recommended)

1. Sign up at [scormcloud.com](https://scormcloud.com) (free tier available)
2. Create an application
3. Upload your exported ZIP
4. Launch the course and verify score/status reporting

### SCORM Driver (local)

[SCORM Driver](https://scormdriver.com/) lets you test SCORM packages locally in the browser without an LMS account.

### Moodle

1. Go to **Site administration → Courses → Upload course**
2. Upload the ZIP directly, or add it as a SCORM activity

## Re-importing for editing

1. Open the builder
2. Click **Import ZIP**
3. Select your previously exported `.zip` file
4. The quiz loads into the editor
5. Make changes and export a new ZIP

If the ZIP does not contain `quiz-source.json` (i.e., it came from a different tool), the builder will show a clear message.

## Test checklist

- [ ] Create a quiz with a title, description, and passing score
- [ ] Add a multiple choice question with at least 2 choices and 1 correct answer
- [ ] Add a true/false question
- [ ] Add per-question feedback (correct and incorrect)
- [ ] Preview the quiz: select answers, submit, see results and feedback
- [ ] Preview: verify pass/fail result matches passing score setting
- [ ] Preview: verify retake works when "Allow retake" is enabled
- [ ] Export SCORM ZIP — verify download starts
- [ ] Unzip and open `index.html` locally — quiz should render (no SCORM API, runs in fallback mode)
- [ ] Upload ZIP to SCORM Cloud — verify launch, scoring, and lesson status
- [ ] Re-import the exported ZIP — verify quiz reloads with all questions intact
- [ ] Test import of a non-builder ZIP — verify warning message appears
- [ ] Refresh the builder without exporting — verify draft is restored from localStorage
- [ ] Enable shuffle questions/answers — verify different order in preview
- [ ] Set resume mode to "Start fresh" — verify state is not restored
- [ ] Trigger validation errors (no title, no questions) — verify validation panel appears

## Architecture notes

The codebase is structured for future extension:

- `src/types/quiz.ts` — add new question types or settings here; bump `schemaVersion` when the format changes in a breaking way
- `src/lib/scormManifest.ts` — SCORM 2004 manifest generation can be added here
- `src/runtime/` — runtime files are bundled as raw strings via Vite and embedded in the ZIP; replace or extend these for richer interactivity
- `src/lib/importScormZip.ts` — add migration logic here when `schemaVersion` changes

The builder never sends data to a server. Everything runs in the browser.
