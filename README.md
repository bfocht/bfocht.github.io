# Bryan Focht — Resume

Two self-contained, static HTML pages, served with [GitHub Pages](https://bfocht.github.io/).

| File | What it is |
| --- | --- |
| `index.html` | Interactive resume: a force-directed knowledge graph of positions, organizations, skills and credentials. Requires modern browser (canvas, `requestAnimationFrame`). |
| `resume.html` | Plain no-JavaScript fallback and printable version — where older browsers and screen readers land. |

Both are generated output, not hand-edited. They're built from the source.

## Build pipeline

| Path | What it is |
| --- | --- |
| `src/resume-knowledge-graph.html` | Interactive knowledge graph source. Reads `src/data/*.js` via `<script src>` at load time. |
| `src/data/` | The four data tables both resume pages are generated from — `orgs.js`, `skills.js`, `creds.js`, `entries.js`. |
| `src/scripts/build.mjs` | Generates `resume.html` from the data tables and `index.html` by inlining the data into `resume-knowledge-graph.html`, then minifies both. |

### Data tables

Four plain `const` tables, each written as a `<script src>` file so the
interactive graph (`src/resume-knowledge-graph.html`) can load them directly
in the browser, and so `src/scripts/build.mjs` can read them with a bare
Node VM context to generate `resume.html`.

| File | Table | Contents |
| --- | --- | --- |
| `orgs.js` | `ORGS` | Employers, university, and certification bodies. |
| `skills.js` | `SKILLS` | Competencies and technologies, grouped by `cat`, with match `alias`es and drawer `desc` text. |
| `creds.js` | `CREDS` | Degrees, certifications, training and memberships, linked to an org and a year span. |
| `entries.js` | `ENTRIES` | Role & experience — the bulk of the resume content. |

Edit these tables directly; there's no separate schema file.

### Building

Run from the repo root:

```bash
# regenerate and minify both resume.html and index.html
node src/scripts/build.mjs
```

`build.mjs` minifies both pages with `html-minifier-terser` via `npx`
(fetched from npm on first run, forced to the public registry). Run it
after editing anything in `src/data/` or `src/resume-knowledge-graph.html` —
`resume.html` and `index.html` are generated output and shouldn't be
hand-edited.
