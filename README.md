# ML Q&A

A small private-friendly website for browsing ML questions and answers, with hoverable/clickable glossary terms you can drill into.

- Pick a question from the list.
- Open it, then press **Show answer**.
- Any underlined term in a question, answer, or explanation can be hovered (desktop) for a quick tooltip, or clicked/tapped to jump into its own explanation window — which can itself contain more linked terms.
- Use the ← / → buttons in the header to move back and forth through the windows you've visited.

No build step, no framework — just static HTML/CSS/JS plus one tiny JSON API (see "Syncing across devices" below) for shared content.

## Adding questions from the browser

Press **+ Add a question** at the bottom of the question list to add your own question and answer right from the page — no editing files required. Answers can use `[[double brackets]]` too, and will link to existing glossary terms just like the built-in questions.

These are synced through the server (see "Syncing across devices"), so a question added on one device shows up on every other device that opens the same site.

Every question — including the built-in ones — has a **Remove this question** link on its page. Removing a question you added deletes it outright; removing a built-in question just hides it everywhere (the underlying data in `js/data.js` is unchanged, so it comes back if the shared data is cleared).

## Running it locally

From the repo root:

```
python3 serve.py
```

Then open http://localhost:8080 in a browser. On your phone, open `http://<your-laptop-ip>:8080` while on the same Wi-Fi network (or over Tailscale).

`serve.py` does two things plain `python3 -m http.server` doesn't: it disables caching (so a normal refresh always picks up the latest files — plain `http.server` sends no `Cache-Control` header, and some browsers will keep serving a stale `js/app.js` after it's changed on disk), and it serves the `/api/state` endpoint that added questions/explanations need (see below). If you just need to preview static files with no syncing, `python3 -m http.server` still works, but nothing added in one browser will show up in another.

## Syncing across devices

Added questions, hidden built-ins, and text explanations are stored on the server rather than in browser `localStorage`, so every device that opens the site sees the same content. `serve.py` keeps this in a single JSON file, `data-store.json`, in the repo root (gitignored — it's your data, not source code) via two endpoints:

- `GET /api/state` — returns the current `{ customQuestions, hiddenIds, textAnnotations }`, or `404` if nothing's been saved yet.
- `POST /api/state` — overwrites `data-store.json` with the JSON body.

The first time a browser that already had data from before this feature existed loads the page, it migrates that old per-browser data into the shared store automatically. Each device also keeps a `localStorage` mirror of the last state it saw, so it stays usable (read-only, effectively) for a moment if the server is briefly unreachable.

This is deliberately simple — no auth, no conflict resolution, last write wins — which is fine for one person's own questions across their own devices. It also means anything hosted purely as static files (no Python process behind it, e.g. Cloudflare Pages on its own) falls back to the old per-browser-only behavior, since there's no `/api/state` to talk to.

## Editing content

All content lives in `js/data.js`:

- `QUESTIONS` — a list of `{ id, question, answer }`.
- `GLOSSARY` — keyed by a slug, each entry is `{ term, short, explanation }`.

Wrap any word or phrase in `[[double brackets]]` to make it a linked term:

```
"...trained with [[gradient descent]]..."
```

That looks up `GLOSSARY["gradient-descent"]` (the slug is the bracketed text, lowercased with non-letters/numbers turned into `-`). If the text you want to show doesn't match the glossary key, use a pipe:

```
"...trained with [[gradient-descent|gradient descent]]..."
```

`explanation` text can contain further `[[...]]` links, so readers can keep drilling into related terms.

### Formatting

Question, answer, and explanation text also support:

| Syntax | Result |
|---|---|
| `**bold**` | **bold** |
| `__underline__` | underlined |
| `## Heading` on its own line | a subheading |
| a blank line between lines | starts a new paragraph |

This works the same way whether the text is written in `js/data.js` or typed into the **+ Add a question** form.

You don't have to type that syntax by hand: pasting into the question/answer fields from Word, Google Docs, or a webpage carries bold, underline, and headings over automatically, converting them to the syntax above. (Plain-text sources, like a code editor or terminal, paste as-is with no conversion needed.)

You can also drag a `.md` file straight onto the Answer field to use its contents as the answer. Headings (`#`) and `**bold**` come through unchanged; since standard Markdown has no underline and treats `__text__` as bold too, it's normalized to `**text**` on drop rather than becoming underlined.

### Explaining a specific phrase

Select any run of words inside an answer or a term's explanation, and a small **+ Explain** button appears — click it to write a note just for that phrase. The phrase turns into its own underlined, clickable highlight; clicking it later opens a new window with your note (which can itself use `**bold**`, `__underline__`, headings, and further explained phrases). There's a **Remove this explanation** link on that window if you want to undo it.

Like added questions, these notes sync through the server (see "Syncing across devices"). One current limitation: the highlight is re-applied by matching the phrase's exact text on each visit, so it works reliably as long as your selection stays within a single run of plain text — selecting across a bold/underlined boundary saves the note, but it won't reappear as a clickable highlight after you navigate away and back.

## Deploying privately, for free — Cloudflare Pages + Cloudflare Access

This puts a real login wall (email one-time code, or Google/GitHub sign-in) in front of the whole site, at no cost, and works fine on both mobile and laptop browsers. Note: Cloudflare Pages only serves static files, so it can't run `/api/state` — deployed this way, added questions/explanations fall back to old per-browser-only `localStorage` (still works, just not synced across devices). Running `serve.py` yourself (e.g. on the Jetson, reachable over Tailscale) is what gives you both the login wall's alternative — a private network — and cross-device sync at the same time.

1. Push this repo to GitHub (already done here).
2. In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages → Connect to Git**, and pick this repo.
3. Build settings: no build command, output directory `/` (root) — it's a static site, so leave the framework preset as "None".
4. Deploy. You'll get a `*.pages.dev` URL.
5. Go to **Zero Trust → Access → Applications → Add an application → Self-hosted**, point it at your `*.pages.dev` domain, and add a policy that only allows your email address (e.g. `eladerez@gmail.com`) — Access will email you a one-time login code whenever you visit.
6. Visit the site on your laptop or phone — you'll be asked to log in once, then it stays private to you.

Cloudflare Access is free for up to 50 users, so this costs nothing.
