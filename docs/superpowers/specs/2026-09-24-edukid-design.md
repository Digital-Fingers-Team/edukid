# EduKid — design spec

Date: 2026-09-24
Repo: `Digital-Fingers-Team/edukid` (public). Replaces the static site in
`Digital-Fingers-Team/Kid-Edu` (edukid.dfteam-eg.com), which is left untouched.

## 1. Purpose

EduKid is a home app for Arabic-speaking kindergarten children (KG1/KG2, roughly
ages 4–6) and their parents.

1. **Primary goal: support treatment of early childhood stuttering at home.**
   The program is modelled on the Lidcombe Program (parent-delivered verbal
   contingencies + daily severity ratings), with playful practice of
   fluency-facilitating techniques (gentle onset, slow/smooth speech, breathing).
2. **Secondary goal: early learning** — Arabic letters, English letters and
   words, numbers, shapes and colours — adaptive per child.

Users: a parent and child together at home. The parent drives the stuttering
program; the child plays.

### Success criteria

- A parent can create an account, add a child, read the guide, run a daily
  session, rate the day, and see a chart of ratings over weeks — on a phone, in
  Arabic, RTL.
- The app never scores, grades or blocks the child based on how fluently they
  speak.
- Stage 1 → Stage 2 progression follows the rule in §3.3 and is covered by tests.
- Learning games adapt: missed items return sooner than mastered ones.
- Data syncs across the parent's devices; a session done offline syncs later.
- Runs at `https://edukid.130-110-124-121.sslip.io`.

### Non-goals

- No AI assistant, no chatbot, no child-facing AI.
- No automatic stuttering detection or fluency score. (The old app's
  speech-recognition "fluency %" is removed on purpose.)
- No therapist/clinic accounts (possible later; the data model allows adding them).
- Not a medical device. The app states that it supports, and does not replace,
  a speech-language pathologist (أخصائي تخاطب).

## 2. Principles for the stuttering part

- Nothing the child sees depends on how fluently they spoke. Stickers and
  characters are earned by *taking part* (finishing a session or game).
- Corrections are only ever suggested to the parent, gently, and rarely.
- The app enforces at least 5 praises per correction in a session (§3.2).
- Microphone input drives playful visuals only; it is never analysed for
  correctness or recorded unless the parent explicitly consents (§3.5).
- Never tell the child "slow down" / "calm down" — this wording appears only in
  the parent guide as something *not* to say.

## 3. Stuttering program

### 3.1 Parent guide

Short illustrated Arabic pages, shown at onboarding and always reachable:

- What stuttering is; that it is common and not the child's or parent's fault.
- Helpful: give time, keep eye contact, speak a little slower yourself, listen
  to *what* the child says.
- Unhelpful: "speak slowly/calm down/take a breath", finishing words,
  interrupting, showing impatience.
- How the daily session and ratings work; the praise/correction phrases.
- When to see a specialist: stuttering lasting over 6 months, tension/struggle,
  avoidance, child distressed, family history — and that a specialist should
  supervise the program.

### 3.2 Daily session (~10 minutes, parent + child)

A session is a guided sequence:

1. **Warm-up (1–2 min)** — breathing game: bubbles/balloon respond to soft,
   steady blowing into the mic.
2. **Talking game (5–8 min)** — parent and child go through picture cards or a
   picture story. Difficulty is a ladder chosen by the app from the child's
   current level; the parent can move it up or down:
   - L1 single words (naming pictures)
   - L2 two–three-word phrases ("قطة كبيرة")
   - L3 sentences ("القطة بتشرب لبن")
   - L4 describing a picture story
   - L5 free conversation (open prompts)
3. **Parent buttons** during the talking game:
   - **كلام ناعم (smooth)** → app shows a praise phrase to say, rotating from a
     list ("كلامك ناعم زي الحرير!", "برافو، قلتها بسهولة!").
   - **كلام متقطّع (bumpy)** → app usually shows *nothing to say* (just counts).
     It suggests a gentle request ("تقدر تقولها تاني بهدوء؟") only when the
     session's smooth:bumpy-acknowledged ratio would stay ≥ 5:1 after it, and
     never twice in a row.
4. **Finish** — child picks a sticker; parent is asked for today's rating if not
   yet given.

Stored per session: date, child, duration, level(s) used, smooth count, bumpy
count, corrections suggested, parent note.

Level suggestion: start at L1. After 3 sessions at a level where the parent
tapped mostly smooth (bumpy ≤ 10% of taps), suggest the next level; if bumpy
> 30% in 2 sessions, suggest one level down. Suggestions only — parent decides.

### 3.3 Daily severity rating and stages

- Once per day the parent rates the child's speech that day: **0–9**
  (0 = no stuttering, 1 = extremely mild, 9 = extremely severe), one tap, with
  labelled scale.
- Chart: daily ratings (last 4 weeks) and weekly averages (all time), per child.
- **Stage 1**: daily sessions recommended.
- **Stage 2 (maintenance)**: eligible when each of the last **3 consecutive
  calendar weeks** has ≥ 4 rated days, weekly average ≤ **1.5**, and ≥ **4**
  days rated 0 or 1. App proposes Stage 2; parent confirms. In Stage 2 the
  recommended session frequency steps down: 3/week for 2 weeks → 2/week for 2
  weeks → 1/week for 4 weeks → 1 every 2 weeks.
- **Return to Stage 1**: in Stage 2, if a week's average > 2.5 (with ≥ 3 rated
  days), the app suggests going back to Stage 1.
- Weeks start Saturday (local week in Egypt).

### 3.4 Technique games (child plays, parent watches)

All use the Web Audio API for live loudness only; no scoring, no speech
recognition, no pass/fail.

- **🐢 السلحفاة** (slow smooth speech): the turtle walks while voice is
  continuous; pauses when silent. Picture word shown for the child to say
  slowly with the parent modelling.
- **🎈 البالونة** (gentle onset): balloon inflates when loudness rises gently;
  a sudden loud start makes it wobble playfully (no negative message).
- **〰️ الثعبان** (stretchy sounds): snake grows while the first sound is held.
- **🫧 الفقاعات** (breathing): bubbles float up with soft steady blowing.

Each game ends with a sticker after a fixed number of turns regardless of how
it went. If the mic is unavailable, the game works by tap (parent taps to
animate) so it never blocks.

### 3.5 Speech samples (optional)

- Parent may record a ~2 minute conversation sample, suggested monthly.
- Requires explicit per-child consent (a checkbox with a plain explanation);
  without it the record button is hidden.
- Stored on the server under `data/recordings/<child>/`; listed by date for
  playback; deletable individually; deleted with the child/account.

## 4. Learning part

### 4.1 Content (`content/*.json`)

- Arabic letters (28), each with an example word + emoji/picture.
- English letters (26) and ~40 simple words (colours, animals, family, food).
- Numbers 1–20; KG2 additionally adding/subtracting within 10.
- Shapes (circle, square, triangle, rectangle, star, heart) and 8 colours.
- Speech-practice words and phrases grouped by starting sound and length,
  reusing the same pictures (so the talking game uses familiar words).
- Picture stories for L4 (sequences of 3–4 emoji/illustration frames + text).

Item shape: `{ id, subject, kg: 1|2, prompt, answer, image, audioText, lang }`.

### 4.2 Game types (generic, content-driven)

1. **استمع واختار** — app speaks the item (speechSynthesis), child taps the
   correct card among 3–4.
2. **وصّل** — match picture ↔ word, number ↔ group of objects.
3. **عدّ** — count objects, tap the number.
4. **ارسم** — trace a letter/number with a finger on a canvas guide.

Wrong answers get a gentle "حاول تاني" and the item stays; no penalties.

### 4.3 Adaptivity

Per child, per item Leitner boxes 1–5. Correct → next box; wrong → box 1.
A round draws mostly from low boxes, some from due higher boxes. An item in
box 5 is "mastered". KG stage filters which items appear.

### 4.4 Library

- Books: the existing KG PDFs, compressed, opened in the browser's PDF viewer.
- Songs/videos: embedded YouTube links (not stored in the repo).
- Stories: the picture stories from §4.1 with read-aloud (speechSynthesis).

## 5. Architecture

```
apps/web   React + TypeScript + Vite, PWA (installable, offline shell), Arabic RTL
apps/api   Node + Fastify + SQLite (better-sqlite3)
content/   JSON content shared by both
```

pnpm workspace. Shared TypeScript types for API payloads.

### 5.1 Web

- Routes: `/` welcome/login, `/children`, `/child/:id` home (today's plan),
  `/child/:id/session`, `/child/:id/rate`, `/child/:id/progress`,
  `/child/:id/games/...`, `/child/:id/learn/...`, `/guide`, `/library`,
  `/settings`.
- Pure logic in `apps/web/src/logic/` (stages, praise ratio, level suggestion,
  Leitner) — no DOM, unit tested.
- Local store: IndexedDB (Dexie) holds the child's data and an outbox of
  pending writes. Every write goes to IndexedDB first, then the outbox is sent
  to the API; on reconnect the outbox flushes. Server wins on conflicts for
  settings; sessions/ratings are append-or-upsert by client-generated id, so
  replays are idempotent.

### 5.2 API

- Auth: email + password (argon2id hash), session id in an httpOnly,
  Secure, SameSite=Lax cookie. Rate-limited login.
- Resources (all scoped to the logged-in parent):
  `POST /api/auth/register|login|logout`, `GET /api/me`,
  `GET/POST/PATCH/DELETE /api/children`,
  `PUT /api/children/:id/sessions/:sid`, `PUT /api/children/:id/ratings/:date`,
  `PUT /api/children/:id/items/:itemId` (Leitner state),
  `GET /api/children/:id/sync?since=` (all changes since timestamp),
  `POST/GET/DELETE /api/children/:id/recordings`,
  `DELETE /api/me` (delete account and everything).
- Every child-scoped route checks the child belongs to the caller; otherwise 404.
- SQLite file and recordings under `apps/api/data/` (git-ignored).

### 5.3 Deployment (pricelens)

- API under pm2 as `edukid-api`, bound to `127.0.0.1` on an internal port.
- Web build copied to `~/edukid-site/html`.
- New `server` block in the existing `sli-site` nginx container for
  `edukid.130-110-124-121.sslip.io`: serves the web build, proxies `/api` to the
  API. The container needs the web files mounted and host network access to the
  API port (checked during implementation).
- TLS: extend the `sli-cert` renewal to include the new name.
- Nothing else on the server is restarted except `sli-site` (reload) — it also
  serves SLI, so its config is validated (`nginx -t`) before reload.

## 6. Testing

- Unit (vitest): stage eligibility/return rules, praise-ratio suggestion rule,
  level suggestion, Leitner scheduling, outbox/sync merge.
- API (vitest + Fastify inject): register/login/logout, parent A cannot read or
  write parent B's child, idempotent session/rating upserts, account deletion
  removes recordings.
- End-to-end (Playwright, in the podman playwright image on the server): create
  account → add child → guide → daily session with taps → rating → progress
  chart shows it; offline session then reconnect syncs.
- Manual: open every screen on the deployed site in a phone-sized browser and
  check RTL layout.

## 7. Content and licensing notes

- Old repo videos (Toyor Baby, ABC song) are copyrighted; use YouTube embeds.
- Illustrations: emoji plus simple SVGs made for the project.

## 8. Visual design

The user asked explicitly: games must look good and be easy on the eyes —
not generic "AI-generated" UI.

- **One coherent illustrated world**, not a template: a small cast of
  hand-drawn-style SVG characters (the turtle, balloon, snake, a child guide)
  reused across games, stickers and empty states. No stock gradients, no
  glassmorphism, no emoji-soup headers, no generic card grids with drop shadows
  everywhere.
- **Eye comfort**: warm off-white paper background (not pure white), soft
  muted palette with one or two saturated accents for tap targets; no neon,
  no flashing, no fast looping animation; motion is slow and eased and honours
  `prefers-reduced-motion`. Contrast meets WCAG AA for text.
- **Night-time friendly**: a dim theme for evening sessions (sessions are often
  at bedtime), following the device setting.
- **Kid ergonomics**: tap targets ≥ 64px in child screens, one task per screen,
  minimal text on child screens (pictures + spoken prompts), large friendly
  Arabic type (a rounded Arabic font such as Baloo Bhaijaan 2 / Tajawal for
  UI), numerals shown as the child learns them.
- **Two visual registers**: child screens are playful and illustrated; parent
  screens are calm, clean and readable (guide, rating, charts).
- **Sound**: gentle, optional sound effects; a mute toggle; no harsh
  failure sounds.
- The frontend-design skill is applied during implementation, and every screen
  is checked in a real browser at phone width before it counts as done.
