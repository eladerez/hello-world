# ML Q&A

A small private-friendly website for browsing ML questions and answers, with hoverable/clickable glossary terms you can drill into.

- Pick a question from the list.
- Open it, then press **Show answer**.
- Any underlined term in a question, answer, or explanation can be hovered (desktop) for a quick tooltip, or clicked/tapped to jump into its own explanation window — which can itself contain more linked terms.
- Use the ← / → buttons in the header to move back and forth through the windows you've visited.

No build step, no framework, no server-side code — it's a static site.

## Adding questions from the browser

Press **+ Add a question** at the bottom of the question list to add your own question and answer right from the page — no editing files required. Answers can use `[[double brackets]]` too, and will link to existing glossary terms just like the built-in questions.

These are stored in your browser's `localStorage`, since the site has no backend: they only exist on the device/browser you added them in, and clearing site data (or using a different browser/incognito window) won't show them.

Every question — including the built-in ones — has a **Remove this question** link on its page. Removing a question you added deletes it outright; removing a built-in question just hides it in that browser (the underlying data in `js/data.js` is unchanged, so it comes back if the browser's storage is cleared).

## Running it locally

From the repo root:

```
python3 -m http.server 8000
```

Then open http://localhost:8000 in a browser. On your phone, open `http://<your-laptop-ip>:8000` while on the same Wi-Fi network.

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

## Deploying privately, for free — Cloudflare Pages + Cloudflare Access

This puts a real login wall (email one-time code, or Google/GitHub sign-in) in front of the whole site, at no cost, and works fine on both mobile and laptop browsers.

1. Push this repo to GitHub (already done here).
2. In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages → Connect to Git**, and pick this repo.
3. Build settings: no build command, output directory `/` (root) — it's a static site, so leave the framework preset as "None".
4. Deploy. You'll get a `*.pages.dev` URL.
5. Go to **Zero Trust → Access → Applications → Add an application → Self-hosted**, point it at your `*.pages.dev` domain, and add a policy that only allows your email address (e.g. `eladerez@gmail.com`) — Access will email you a one-time login code whenever you visit.
6. Visit the site on your laptop or phone — you'll be asked to log in once, then it stays private to you.

Cloudflare Access is free for up to 50 users, so this costs nothing.
