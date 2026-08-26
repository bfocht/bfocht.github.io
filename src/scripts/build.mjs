#!/usr/bin/env node
/**
 * Build and minify both resume pages from src/.
 *
 * - src/resume-knowledge-graph.html + src/data/*.js  -> index.html
 *   (local <script src> data files inlined, then minified)
 * - src/data/*.js (read via a VM context)            -> resume.html
 *   (plain no-JavaScript fallback, generated then minified)
 *
 * Both outputs go through the same html-minifier-terser pass so the two
 * pages stay a matched pair, and both get the same generated-on banner
 * (added after minification — a minifier would otherwise strip it as a
 * comment).
 *
 * Usage:
 *   node src/scripts/build.mjs
 *
 * Uses npx + html-minifier-terser (fetched from registry.npmjs.org on first run).
 */
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import {
  existsSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createContext, runInContext } from 'node:vm';

const srcRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(srcRoot, '..');
const DATA_FILES = ['orgs.js', 'skills.js', 'creds.js', 'entries.js'];

function banner() {
  const generated = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return `<!--
⣿⣿⣿⣿⣿⣿⢸⣿⡇⠀⣿⣿⡇⣿⣿⡇⣼⣿⣿⣿⣿⣿⠀⠀⡇⣿⣶⣦⣄⡀⠀⠀⠀⠀⠀⠀⠀
⠉⠉⣿⣿⠉⠉⢸⣿⡇⠀⣿⣿⡃⣿⣿⡇⣿⣿⡇⠀⣿⣿⠀⠀⡇⣿⣿⣿⣿⣿⣶⣄⠀⠀⠀⠀⠀
⠀⠀⣿⣿⠀⠀⢸⣿⣧⣤⣿⣿⡇⣿⣿⡇⠻⣿⣷⣦⡀⠀⠀⠀⡇⣿⣿⣿⣿⣿⣿⣿⣦⠀⠀⠀⠀
⠀⠀⣿⣿⠀⠀⢸⣿⡟⠛⣿⣿⡇⣿⣿⡇⠀⠈⠻⢿⣿⣦⠀⠀⡇⣿⣿⣿⣿⣿⣿⣿⣿⣧⠀⠀⠀
⠀⠀⣿⣿⠀⠀⢸⣿⡇⠀⣿⣿⡇⣿⣿⡇⣿⣿⡇⠀⣿⣿⠀⠀⣷⣿⣿⣿⣿⣿⣿⣿⣿⣿⡆⠀⠀
⠀⠀⣿⣿⠀⠀⢸⣿⡇⠀⣿⣿⡇⣿⣿⡇⣿⣿⣷⣶⣿⣿⠀⠀⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⠀⠀
⠀⠀⠛⠛⠀⠀⠘⠛⠃⠀⠛⠛⠃⠛⠛⠃⠈⠛⠛⠛⠛⠋⠀⠀⠿⢿⣿⣿⣿⣿⣿⣿⣿⠟⠋⠀⠀
⣿⡇⢴⣿⣿⣿⡆⠀⢸⣿⣿⣿⣿⣿⣿⠀⣿⡇⢸⣿⣿⣿⡇⠀⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⣿⣷
⣿⡇⢸⣿⡀⠛⠃⠀⠀⠀⣿⡇⠀⣿⣿⠀⣿⡇⢸⣿⠀⠀⠀⠀⠀⠀⠀⣀⣀⣤⣴⣶⣶⣶⣾⣿⣿
⣿⡇⠈⠻⢿⣶⡄⠀⠀⠀⣿⡇⠀⣿⣿⠿⣿⡇⢸⣿⠿⠿⠇⠀⠀⠀⢸⣿⣿⣿⣿⣿⡿⠛⠋⣹⡿
⣿⡇⢰⣶⡀⣿⡇⠀⠀⠀⣿⡇⠀⣿⣿⠀⣿⡇⢸⣿⣀⣀⡀⠀⠀⠀⢸⣿⣿⣿⣿⠋⠀⠀⢰⣿⡇
⠿⠇⠸⠿⠿⠿⠇⠀⠀⠀⠿⠇⠀⠿⠿⠀⠿⠇⠸⠿⠿⠿⠇⠀⠀⠀⣿⣿⣿⣿⠃⠀⠀⢠⣿⣿⡇
⣶⣶⡆⠀⣶⣶⠀⢰⣶⣶⠀⢰⣶⣶⡀⢲⣶⣦⠀⢰⣶⣶⠀⠀⠀⠀⣿⣿⣿⠃⠀⣠⣤⣿⣿⣿⠃
⢸⣿⣧⠀⣿⣿⡇⢸⣿⣿⠀⣿⣿⣿⡇⠈⣿⣿⡀⣼⣿⡏⠀⠀⠀⠀⣿⣿⡏⢀⣾⣿⣿⣿⣿⣿⠀
⢸⣿⣿⢸⣿⣿⡇⣼⣿⡇⢸⣿⡿⣿⣧⠀⢻⣿⣇⣿⣿⠁⠀⠀⠀⠀⣿⣿⠇⣼⣿⣿⣿⣿⣿⣿⠀
⠀⣿⣿⢸⣿⣿⣇⣿⣿⠇⢸⣿⡇⣿⣿⡀⠘⣿⣿⣿⡏⠀⠀⠀⠀⠀⣿⣿⢸⣿⣿⣿⣿⣿⣿⣿⠀
⠀⣿⣿⣿⣿⢿⣿⣿⣿⠀⣾⣿⠷⢿⣿⡇⠀⢻⣿⣿⠀⠀⠀⠀⠀⠀⣿⡿⣾⣿⣿⣿⣿⣿⠟⠁⠀
⠀⢸⣿⣿⡏⢸⣿⣿⡿⢰⣿⣿⠀⢸⣿⣷⠀⢸⣿⣿⠀⠀⠀⠀⠀⢀⣿⡇⣿⣿⣿⠟⠋⠀⠀⠀⠀
⠀⢸⣿⣿⡇⢸⣿⣿⡇⢸⣿⡇⠀⠀⣿⣿⠀⢸⣿⣿⠀⠀⠀⠀⠀⠀⠻⡇⠟⠋⠀⠀⠀⠀⠀⠀⠀

Author: Bryan Focht
Generated on ${generated}
-->
`;
}

/* ============================================================
 * resume.html — plain no-JavaScript fallback, generated from src/data
 * ============================================================ */

function buildPlainResumeHtml() {
  // The data tables are plain `const X = [...]` scripts written for a
  // <script src> tag, so a bare VM context is all it takes to read them here.
  const ctx = createContext({});
  const tables = DATA_FILES.map(f => readFileSync(resolve(srcRoot, 'data', f), 'utf8')).join('\n');
  // One script, because a top-level `const` in a VM script is scoped to that script.
  const { ORGS, SKILLS, CREDS, ENTRIES } =
    runInContext(tables + '\n;({ ORGS, SKILLS, CREDS, ENTRIES })', ctx, { filename: 'resume-data' });

  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  function inline(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  }
  function mdToHtml(md, shift = 0) {
    const out = [];
    let list = null;
    const closeList = () => { if (list) { out.push('</' + list + '>'); list = null; } };
    for (const raw of String(md).split('\n')) {
      const line = raw.trimEnd();
      if (!line.trim()) { closeList(); continue; }
      let m;
      if ((m = line.match(/^(#{1,6})\s+(.*)$/))) {
        closeList();
        const lvl = Math.min(6, Math.max(2, m[1].length + shift));
        out.push(`<h${lvl}>${inline(m[2])}</h${lvl}>`);
        continue;
      }
      if (/^---+$/.test(line.trim())) { closeList(); out.push('<hr>'); continue; }
      if ((m = line.match(/^\s*[-*]\s+(.*)$/))) {
        if (list !== 'ul') { closeList(); out.push('<ul>'); list = 'ul'; }
        out.push('<li>' + inline(m[1]) + '</li>');
        continue;
      }
      if ((m = line.match(/^\s*\d+\.\s+(.*)$/))) {
        if (list !== 'ol') { closeList(); out.push('<ol>'); list = 'ol'; }
        out.push('<li>' + inline(m[1]) + '</li>');
        continue;
      }
      if ((m = line.match(/^>\s?(.*)$/))) { closeList(); out.push('<blockquote>' + inline(m[1]) + '</blockquote>'); continue; }
      closeList();
      out.push('<p>' + inline(line) + '</p>');
    }
    closeList();
    return out.join('\n');
  }

  const orgById = new Map(ORGS.map(o => [o.id, o]));
  const skillById = new Map(SKILLS.map(s => [s.id, s]));
  const byKey = new Map(ENTRIES.map(e => [e.key, e]));

  const profile = byKey.get('profile');
  // The graph rings positions oldest-to-newest; a resume reads newest first.
  const positions = ENTRIES.filter(e => e.kind === 'position')
    .slice()
    .sort((a, b) => (b.tl ?? -Infinity) - (a.tl ?? -Infinity));
  const certifications = byKey.get('credentials');

  const groupBy = (rows, key) => rows.reduce((m, r) => {
    const k = typeof key === 'function' ? key(r) : r[key];
    (m.get(k) || m.set(k, []).get(k)).push(r);
    return m;
  }, new Map());

  const YEARS = (() => {
    const ys = ENTRIES.flatMap(e => [e.y0, e.y1]).filter(y => typeof y === 'number');
    return { from: Math.min(...ys), to: Math.max(...ys) };
  })();

  function skillList(ids) {
    const labels = (ids || []).map(id => skillById.get(id)?.label).filter(Boolean);
    if (!labels.length) return '';
    return `<p class="skills"><b>Skills:</b> ${labels.map(esc).join(' · ')}</p>`;
  }
  function highlightList(hs) {
    if (!hs || !hs.length) return '';
    return `<ul class="metrics">${hs.map(h => `<li><b>${esc(h.v)}</b> ${esc(h.k)}</li>`).join('')}</ul>`;
  }
  function orgLine(e) {
    if (e.tagline) return `<p class="meta">${inline(e.tagline)}</p>`;
    const names = (e.orgs || []).map(id => orgById.get(id)?.name).filter(Boolean);
    const bits = [names.join(', '), e.dates, e.tenure, e.location].filter(Boolean);
    return bits.length ? `<p class="meta">${esc(bits.join(' · '))}</p>` : '';
  }
  // The write-ups repeat their own title and date line as the first two
  // markdown lines, which the section header already prints — drop them here.
  function bodyOf(e) {
    const lines = String(e.md || '').split('\n');
    let i = 0;
    if (/^#{1,6}\s/.test(lines[0] || '')) i = 1;
    if (/^\*.*\*$/.test((lines[i] || '').trim())) i += 1;
    return mdToHtml(lines.slice(i).join('\n'), 1);
  }

  function section(e, tag, headingOverride) {
    return `<section id="${esc(e.key)}">
<h2>${esc(headingOverride || e.title)}</h2>
${orgLine(e)}
${highlightList(e.highlights)}
${bodyOf(e)}
${skillList(e.skills)}
${tag || ''}
</section>`;
  }

  // Shared by every "group rows, head each group with an <h3>" section below.
  function groupedSection(rows, key, heading, renderItems) {
    return [...groupBy(rows, key)]
      .map(([group, items]) => `<h3>${esc(heading(group))}</h3>\n${renderItems(items)}`)
      .join('\n');
  }

  const credRows = groupedSection(CREDS, 'kind', kind => `${kind}s`, items => `<ul class="creds">${items.map(c => {
    const org = orgById.get(c.orgId);
    const bits = [org && org.name, c.issued, c.expired ? 'expired ' + c.expired : null].filter(Boolean);
    return `<li><b>${esc(c.title || c.label)}</b><span class="meta"> — ${esc(bits.join(' · '))}</span>${c.note ? `<br><span class="note">${esc(c.note)}</span>` : ''}</li>`;
  }).join('')}</ul>`);

  const skillRows = groupedSection(SKILLS, 'cat', cat => cat, items =>
    `<p class="skills">${items.map(s => esc(s.label)).join(' · ')}</p>`);

  const CSS = `
body{margin:0;background:#f6f7f9;color:#1c2330;
  font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
  -webkit-text-size-adjust:100%}
.wrap{max-width:820px;margin:0 auto;padding:28px 22px 72px;background:#fff}
a{color:#1a5fb4}
header{border-bottom:2px solid #1c2330;padding-bottom:16px;margin-bottom:8px}
header h1{margin:0;font-size:30px;letter-spacing:.2px}
header p{margin:4px 0 0;font-size:15px;color:#4a5568}
.photo{width:96px;height:96px;border-radius:50%;margin-bottom:12px}
.switch{margin:14px 0 0;padding:10px 14px;background:#eef2f8;border:1px solid #d3dced;font-size:14px}
.switch p{margin:0}
nav{margin:22px 0 6px;padding:12px 0;border-top:1px solid #dde3ec;border-bottom:1px solid #dde3ec;font-size:14px}
nav ul{margin:0;padding:0;list-style:none}
nav li{display:inline-block;margin:2px 14px 2px 0}
section{padding:26px 0 6px;border-bottom:1px solid #e6eaf1}
section:last-of-type{border-bottom:none}
h2{margin:0 0 4px;font-size:22px;letter-spacing:.2px}
h3{margin:22px 0 6px;font-size:16px;text-transform:uppercase;letter-spacing:.9px;color:#3d4a60}
h4{margin:18px 0 4px;font-size:15px}
p{margin:10px 0}
ul,ol{margin:10px 0;padding-left:22px}
li{margin:4px 0}
.meta{color:#5a6a85;font-size:14px}
.note{color:#5a6a85;font-size:14px}
.skills{font-size:14px;color:#3d4a60}
ul.metrics{list-style:none;padding:0;margin:12px 0}
ul.metrics li{display:inline-block;margin:0 18px 6px 0;font-size:14px;color:#3d4a60}
ul.metrics b{font-size:19px;color:#1c2330;display:block}
ul.creds{list-style:none;padding:0}
ul.creds li{margin:8px 0}
code{background:#eef2f8;padding:1px 5px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:14px}
blockquote{margin:10px 0;padding-left:14px;border-left:3px solid #d3dced;color:#3d4a60}
hr{border:none;border-top:1px solid #e6eaf1;margin:20px 0}
footer{margin-top:34px;padding-top:16px;border-top:1px solid #dde3ec;font-size:13px;color:#5a6a85}
@media print{
  body{background:#fff;font-size:11.5pt}
  .wrap{max-width:none;padding:0}
  .switch,nav{display:none}
  section{page-break-inside:avoid;border-bottom:none}
  a{color:#000;text-decoration:none}
}
`.trim();

  const navItems = [
    ['profile', 'Profile'],
    ...positions.map(p => [p.key, p.title]),
    certifications && [certifications.key, 'Education & Certifications'],
    ['skills', 'Skills'],
  ].filter(Boolean);

  // Always index.html: that's the name the graph is published under in this
  // GitHub Pages repo, which is the only place this link matters.
  const GRAPH_HREF = 'index.html';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bryan Focht — Resume</title>
<meta name="description" content="Bryan Focht — Director of Engineering at GoDaddy. Plain-text resume, ${YEARS.from}–${YEARS.to}.">
<style>
${CSS}
</style>
</head>
<body>
<div class="wrap">
<header>
${profile && profile.photo ? `<img class="photo" src="${profile.photo}" alt="">\n` : ''}<h1>Bryan Focht</h1>
<p>Director of Engineering · GoDaddy</p>
<p class="meta">${YEARS.from} – ${YEARS.to} · ${positions.length} positions · ${SKILLS.length} skills · ${CREDS.length} credentials</p>
</header>

<div class="switch"><p>View the <a href="${GRAPH_HREF}">interactive knowledge graph</a>.</p></div>

<nav aria-label="Sections"><ul>
${navItems.map(([k, t]) => `<li><a href="#${esc(k)}">${esc(t)}</a></li>`).join('\n')}
</ul></nav>

${profile ? section(profile) : ''}
${positions.map(p => section(p)).join('\n\n')}
${certifications ? section(certifications, credRows, 'Education & Certifications') : `<section id="credentials"><h2>Education &amp; Certifications</h2>${credRows}</section>`}

<section id="skills">
<h2>Skills</h2>
${skillRows}
</section>

<footer>
<p>Generated from the same data tables as the interactive graph. No JavaScript required.</p>
</footer>
</div>
</body>
</html>
`;
}

/* ============================================================
 * index.html — knowledge graph, data files inlined
 * ============================================================ */

const SCRIPT_SRC_RE =
  /<script\b([^>]*?\bsrc\s*=\s*(["'])([^"']+)\2[^>]*)>\s*<\/script>/gi;

function isLocalSrc(src) {
  return !/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(src);
}

function isInsideRoot(filePath, sourceRoot) {
  const rel = relative(sourceRoot, filePath);
  return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel);
}

function inlineLocalScripts(html, htmlDir, sourceRoot) {
  const inlined = [];
  const out = html.replace(SCRIPT_SRC_RE, (match, _attrs, _q, src) => {
    if (!isLocalSrc(src)) return match;
    const resolved = resolve(htmlDir, src);
    if (!isInsideRoot(resolved, sourceRoot)) {
      throw new Error(
        `Local script path escapes source root:\n  src: ${src}\n  resolved: ${resolved}\n  root: ${sourceRoot}`,
      );
    }
    if (!existsSync(resolved)) {
      throw new Error(`Local script not found: ${src} (resolved ${resolved})`);
    }
    const body = readFileSync(resolved, 'utf8');
    inlined.push({ src, path: resolved, bytes: statSync(resolved).size });
    return `<script>\n${body.replace(/\s+$/, '')}\n</script>`;
  });
  return { html: out, inlined };
}

function buildGraphHtml() {
  const input = resolve(srcRoot, 'resume-knowledge-graph.html');
  const sourceHtml = readFileSync(input, 'utf8');
  const { html, inlined } = inlineLocalScripts(sourceHtml, dirname(input), srcRoot);
  return { input, html, inlined };
}

/* ============================================================
 * shared: minify one HTML string with html-minifier-terser via npx
 * ============================================================ */

// Force public npm — corporate mirrors often 403 packages used only for this build.
const env = {
  ...process.env,
  npm_config_registry: 'https://registry.npmjs.org',
};

function minify(html, tempName) {
  const tempIn = resolve(tmpdir(), `.${tempName}.in.${process.pid}.html`);
  const tempOut = resolve(tmpdir(), `.${tempName}.out.${process.pid}.html`);
  const args = [
    '--yes',
    'html-minifier-terser@7.2.0',
    '--collapse-whitespace',
    '--remove-comments',
    '--collapse-boolean-attributes',
    '--remove-redundant-attributes',
    '--remove-script-type-attributes',
    '--remove-style-link-type-attributes',
    '--minify-css', 'true',
    '--minify-js', JSON.stringify({ compress: true, mangle: true }),
    '-o', tempOut,
    tempIn,
  ];
  try {
    writeFileSync(tempIn, html, 'utf8');
    const result = spawnSync('npx', args, { cwd: repoRoot, env, stdio: 'inherit', shell: process.platform === 'win32' });
    if ((result.status ?? 1) !== 0) {
      console.error('Minify failed.');
      process.exit(result.status ?? 1);
    }
    return readFileSync(tempOut, 'utf8');
  } finally {
    for (const f of [tempIn, tempOut]) {
      try { unlinkSync(f); } catch { /* ignore missing temp */ }
    }
  }
}

function fmt(n) {
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(1)} KB`;
}

/* ============================================================
 * run both builds
 * ============================================================ */

console.log('Building resume.html (plain fallback)...');
const plainHtml = buildPlainResumeHtml();
const plainBefore = Buffer.byteLength(plainHtml, 'utf8');
const plainMinified = minify(plainHtml, 'resume');
const plainOutput = resolve(repoRoot, 'resume.html');
writeFileSync(plainOutput, banner() + plainMinified, 'utf8');
const plainAfter = statSync(plainOutput).size;
console.log(
  `Wrote ${plainOutput} (${fmt(plainBefore)} → ${fmt(plainAfter)}, −${((1 - plainAfter / plainBefore) * 100).toFixed(1)}%)`,
);

console.log('\nBuilding index.html (knowledge graph)...');
const { input: graphInput, html: graphHtml, inlined } = buildGraphHtml();
if (inlined.length) {
  for (const a of inlined) console.log(`  inlined ${a.src}`);
}
const graphBefore = statSync(graphInput).size + inlined.reduce((n, a) => n + a.bytes, 0);
const graphMinified = minify(graphHtml, 'resume-knowledge-graph');
const graphOutput = resolve(repoRoot, 'index.html');
writeFileSync(graphOutput, banner() + graphMinified, 'utf8');
const graphAfter = statSync(graphOutput).size;
console.log(
  `Wrote ${graphOutput} (${fmt(graphBefore)} → ${fmt(graphAfter)}, −${((1 - graphAfter / graphBefore) * 100).toFixed(1)}%)`,
);
