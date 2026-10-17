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
 * shared: data tables, site constants, SEO head block
 * ============================================================ */

function loadData() {
  // The data tables are plain `const X = [...]` scripts written for a
  // <script src> tag, so a bare VM context is all it takes to read them here.
  const ctx = createContext({});
  const tables = DATA_FILES.map(f => readFileSync(resolve(srcRoot, 'data', f), 'utf8')).join('\n');
  // One script, because a top-level `const` in a VM script is scoped to that script.
  return runInContext(tables + '\n;({ ORGS, SKILLS, CREDS, ENTRIES })', ctx, { filename: 'resume-data' });
}

const DATA = loadData();

// Where GitHub Pages serves this repo. Absolute URLs are required by Open Graph,
// Twitter cards, canonical links and the sitemap.
const SITE = 'https://bfocht.github.io/';
const SOCIAL = {
  linkedin: 'https://www.linkedin.com/in/bfocht/',
  github: 'https://github.com/bfocht',
  chat: 'https://chat.bryanfocht.com/',
};
const HEADLINE = 'Engineering Executive · Cloud & AI';
const OG_IMAGE = { path: 'assets/og-card.png', width: 1200, height: 630 }; // src/scripts/og-image.py
const TODAY = new Date().toISOString().slice(0, 10);

const escAttr = s => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Markdown -> plain sentence, for descriptions.
const plain = md => String(md)
  .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[`*_>#]/g, '').replace(/\s+/g, ' ').trim();

// Everything the two pages (and webmcp.html, by hand) need in <head> for search
// engines and link previews. `page` is one of PAGES below.
function seoHead(page) {
  const url = SITE + (page.path === 'index.html' ? '' : page.path);
  const img = SITE + OG_IMAGE.path;
  return [
    `<meta name="description" content="${escAttr(page.description)}">`,
    `<meta name="author" content="Bryan Focht">`,
    `<meta name="robots" content="index,follow,max-image-preview:large">`,
    `<link rel="canonical" href="${url}">`,
    `<meta property="og:type" content="${page.ogType}">`,
    `<meta property="og:site_name" content="Bryan Focht">`,
    `<meta property="og:locale" content="en_US">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:title" content="${escAttr(page.ogTitle)}">`,
    `<meta property="og:description" content="${escAttr(page.description)}">`,
    `<meta property="og:image" content="${img}">`,
    `<meta property="og:image:secure_url" content="${img}">`,
    `<meta property="og:image:type" content="image/png">`,
    `<meta property="og:image:width" content="${OG_IMAGE.width}">`,
    `<meta property="og:image:height" content="${OG_IMAGE.height}">`,
    `<meta property="og:image:alt" content="Bryan Focht, ${HEADLINE}">`,
    page.ogType === 'profile' ? `<meta property="profile:first_name" content="Bryan">\n<meta property="profile:last_name" content="Focht">` : null,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escAttr(page.ogTitle)}">`,
    `<meta name="twitter:description" content="${escAttr(page.description)}">`,
    `<meta name="twitter:image" content="${img}">`,
    `<meta name="twitter:image:alt" content="Bryan Focht, ${HEADLINE}">`,
    `<script type="application/ld+json">${JSON.stringify(jsonLd(page))}</script>`,
  ].filter(Boolean).join('\n');
}

/* ---------- schema.org JSON-LD, built from the same tables as the pages ---------- */

const MONTHS = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
// "Oct 2020 - Present" -> { startDate: "2020-10", endDate: undefined }; "May 2011" -> start only.
function parseDates(s) {
  const toIso = part => {
    const m = String(part || '').trim().match(/^(?:([A-Za-z]{3})[a-z]*\s+)?(\d{4})$/);
    if (!m) return undefined;
    return m[1] ? `${m[2]}-${MONTHS[m[1].toLowerCase()]}` : m[2];
  };
  const [a, b] = String(s || '').split(/\s*[-–]\s*/);
  return { startDate: toIso(a), endDate: /present/i.test(b || '') ? undefined : toIso(b) };
}

function personJsonLd() {
  const { ORGS, SKILLS, CREDS, ENTRIES } = DATA;
  const orgById = new Map(ORGS.map(o => [o.id, o]));
  const profile = ENTRIES.find(e => e.key === 'profile');
  const positions = ENTRIES.filter(e => e.kind === 'position').slice()
    .sort((a, b) => (b.tl ?? -Infinity) - (a.tl ?? -Infinity));
  const current = positions[0];

  const org = (id, type = 'Organization') => {
    const o = orgById.get(id);
    return o ? { '@type': type, name: o.name } : undefined;
  };
  const credCategory = { Degree: 'degree', Certification: 'certification', Training: 'certificate', Membership: 'membership' };

  return {
    '@type': 'Person',
    '@id': SITE + '#person',
    name: 'Bryan Focht',
    givenName: 'Bryan',
    familyName: 'Focht',
    url: SITE,
    image: SITE + 'assets/bryan-focht.jpg',
    // The profile's role ("Engineering Executive"), not the formal title, matching the page headline.
    jobTitle: profile?.role || current?.title,
    description: plain(String(profile?.md || '').split('\n')[0]),
    address: { '@type': 'PostalAddress', addressRegion: 'AZ', addressCountry: 'US' },
    sameAs: [SOCIAL.linkedin, SOCIAL.github, SOCIAL.chat],
    hasOccupation: current ? {
      '@type': 'Occupation',
      name: profile?.role || current.title,
      occupationLocation: current.location ? { '@type': 'Place', name: current.location } : undefined,
    } : undefined,
    // Employment history as OrganizationRole wrapping each employer: the schema.org
    // pattern for a dated role at an organization (same property name on both sides).
    worksFor: positions.map(p => {
      const d = parseDates(p.dates);
      return {
        '@type': 'OrganizationRole',
        roleName: p.title,
        startDate: d.startDate,
        endDate: d.endDate,
        worksFor: org(p.orgs?.[0]),
      };
    }),
    alumniOf: CREDS.filter(c => c.kind === 'Degree')
      .map(c => org(c.orgId, 'EducationalOrganization')).filter(Boolean),
    hasCredential: CREDS.filter(c => c.kind !== 'Membership').map(c => ({
      '@type': 'EducationalOccupationalCredential',
      name: c.title || c.label,
      credentialCategory: credCategory[c.kind] || c.kind.toLowerCase(),
      recognizedBy: org(c.orgId),
      ...(c.note && c.kind === 'Degree' ? { description: c.note } : {}),
    })),
    knowsAbout: SKILLS.filter(s => s.cat !== 'Strengths').map(s => s.label),
    knowsLanguage: 'en',
  };
}

function jsonLd(page) {
  const person = personJsonLd();
  const url = SITE + (page.path === 'index.html' ? '' : page.path);
  const website = {
    '@type': 'WebSite',
    '@id': SITE + '#website',
    url: SITE,
    name: 'Bryan Focht · Career Graph',
    description: PAGES.graph.description,
    author: { '@id': person['@id'] },
    inLanguage: 'en',
  };
  const webpage = {
    '@type': page.schemaType,
    '@id': url,
    url,
    name: page.title,
    description: page.description,
    isPartOf: { '@id': website['@id'] },
    about: { '@id': person['@id'] },
    mainEntity: { '@id': person['@id'] },
    primaryImageOfPage: { '@type': 'ImageObject', url: SITE + OG_IMAGE.path, width: OG_IMAGE.width, height: OG_IMAGE.height },
    dateModified: TODAY,
    inLanguage: 'en',
  };
  return { '@context': 'https://schema.org', '@graph': [person, website, webpage] };
}

/* ---------- page catalogue: titles, descriptions, sitemap entries ---------- */

const COUNTS = (() => {
  const { SKILLS, CREDS, ENTRIES } = DATA;
  return {
    roles: ENTRIES.filter(e => e.kind === 'position').length,
    skills: SKILLS.filter(s => s.cat !== 'Strengths').length,
    creds: CREDS.length,
  };
})();

const PAGES = {
  graph: {
    path: 'index.html',
    title: `Bryan Focht · ${HEADLINE}`,
    ogTitle: `Bryan Focht · ${HEADLINE} · Interactive Career Graph`,
    description: `Interactive career graph of Bryan Focht, an engineering executive with 25+ years building enterprise commerce platforms, AWS cloud infrastructure and AI agents. Explore ${COUNTS.roles} roles, ${COUNTS.skills} skills and ${COUNTS.creds} credentials, with a WebMCP interface for AI agents.`,
    ogType: 'profile',
    schemaType: 'ProfilePage',
    priority: '1.0',
    changefreq: 'weekly',
  },
  resume: {
    path: 'resume.html',
    title: `Bryan Focht · Resume · ${HEADLINE}`,
    ogTitle: `Bryan Focht · Resume · ${HEADLINE}`,
    description: `Printable resume of Bryan Focht, an engineering executive with 25+ years in enterprise commerce platforms, AWS cloud and AI. ${COUNTS.roles} roles at GoDaddy, First Data, TheServicePro and FMC, an MBA from Boston University, and ${COUNTS.skills} skills.`,
    ogType: 'profile',
    schemaType: 'ProfilePage',
    priority: '0.8',
    changefreq: 'monthly',
  },
  webmcp: {
    // Hand-written page; its <head> carries a copy of this block, kept in step by hand.
    path: 'webmcp.html',
    priority: '0.5',
    changefreq: 'monthly',
  },
};

/* ============================================================
 * resume.html — plain no-JavaScript fallback, generated from src/data
 * ============================================================ */

function buildPlainResumeHtml() {
  const { ORGS, SKILLS, CREDS, ENTRIES } = DATA;

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
  // Newest first, matching the graph ring (current role at twelve, earlier roles clockwise).
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
  // The profile's tagline is "role · [linkedin link]"; the role repeats the
  // page header (name + title) and the link now lives in the header too, so
  // pull it out here instead of rendering the tagline in the profile section.
  const profileLinkMd = profile && profile.tagline
    ? (profile.tagline.match(/^(.*?)\s*·\s*(\[[^\]]+\]\([^)]+\))$/) || [])[2]
    : null;

  function orgLine(e) {
    if (e.tagline) {
      if (e.key === 'profile') return '';
      return `<p class="meta">${inline(e.tagline)}</p>`;
    }
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
    // The profile heading repeats the page header's name, which is always
    // visible right above it — showing it again here is pure redundancy.
    const heading = e.key === 'profile' ? '' : `<h2>${esc(headingOverride || e.title)}</h2>`;
    return `<section id="${esc(e.key)}">
${heading}
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

  // 'Certification', 'Training', and 'Membership' rows are excluded: they duplicate
  // the "Professional certifications" / "AI & prompt engineering" / "Leadership" /
  // "Organizations" lists already rendered from the credentials entry's markdown.
  const credRows = groupedSection(CREDS.filter(c => !['Certification', 'Training', 'Membership'].includes(c.kind)), 'kind', kind => `${kind}s`, items => `<ul class="creds">${items.map(c => {
    const org = orgById.get(c.orgId);
    const bits = [org && org.name, c.issued, c.expired ? 'expired ' + c.expired : null].filter(Boolean);
    return `<li><b>${esc(c.title || c.label)}</b><span class="meta"> — ${esc(bits.join(' · '))}</span>${c.note ? `<br><span class="note">${esc(c.note)}</span>` : ''}</li>`;
  }).join('')}</ul>`);

  // The CliftonStrengths skills exist for the graph; the resume already lists them under certifications.
  const resumeSkills = SKILLS.filter(s => s.cat !== 'Strengths');
  const skillRows = groupedSection(resumeSkills, 'cat', cat => cat, items =>
    `<p class="skills">${items.map(s => esc(s.label)).join(' · ')}</p>`);

  const CSS = `
body{margin:0;background:#f6f7f9;color:#1c2330;
  font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
  -webkit-text-size-adjust:100%}
.wrap{max-width:820px;margin:0 auto;padding:28px 22px 72px;background:#fff}
a{color:#1a5fb4}
header{position:relative;border-bottom:2px solid #1c2330;padding-bottom:16px;margin-bottom:8px}
header h1{margin:0;font-size:30px;letter-spacing:.2px}
header p{margin:4px 0 0;font-size:15px;color:#4a5568}
.photo{width:96px;height:96px;border-radius:50%;margin-bottom:12px}
.switch{position:absolute;top:0;right:0;margin:0;font-size:14px}
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
ul.metrics li{display:inline-block;margin:0 18px 6px 0;font-size:14px;color:#28324a;font-weight:500}
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
  .switch{display:none}
  section{page-break-inside:avoid;border-bottom:none}
  a{color:#000;text-decoration:none}
}
`.trim();

  // Always index.html: that's the name the graph is published under in this
  // GitHub Pages repo, which is the only place this link matters.
  const GRAPH_HREF = 'index.html';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-MLCG36KPTV"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-MLCG36KPTV');
</script>
<title>${esc(PAGES.resume.title)}</title>
${seoHead(PAGES.resume)}
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="icon" href="favicon.ico" sizes="48x48">
<link rel="icon" href="assets/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="assets/apple-touch-icon.png">
<style>
${CSS}
</style>
</head>
<body>
<div class="wrap">
<header>
<p class="switch">View the <a href="${GRAPH_HREF}">interactive knowledge graph</a>.</p>
${profile && profile.photo ? `<img class="photo" src="${profile.photo}" alt="${esc(profile.photoAlt || '').replace(/"/g, '&quot;')}">\n` : ''}<h1>Bryan Focht</h1>
<p>Engineering Executive · Cloud &amp; AI${profileLinkMd ? ` · ${inline(profileLinkMd)}` : ''}</p>
<p class="meta">${YEARS.from} – ${YEARS.to} · ${positions.length} roles · ${resumeSkills.length} skills · ${CREDS.length} credentials</p>
</header>

${profile ? section(profile) : ''}
${positions.map(p => section(p)).join('\n\n')}
${certifications ? section(certifications, credRows, 'Education & Certifications') : `<section id="credentials"><h2>Education &amp; Certifications</h2>${credRows}</section>`}

<section id="skills">
<h2>Skills</h2>
${skillRows}
</section>

<footer>
<p>Generated from the same data tables as the interactive graph.</p>
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

// The graph's <head> carries a `<!-- @seo:graph -->` marker right after its <title>;
// the build swaps in the same generated block the plain resume gets.
const SEO_MARKER = '<!-- @seo:graph -->';

function buildGraphHtml() {
  const input = resolve(srcRoot, 'resume-knowledge-graph.html');
  const sourceHtml = readFileSync(input, 'utf8');
  if (!sourceHtml.includes(SEO_MARKER)) {
    throw new Error(`${SEO_MARKER} marker missing from ${input}; the graph would ship without its SEO head.`);
  }
  const withSeo = sourceHtml
    .replace(SEO_MARKER, seoHead(PAGES.graph))
    .replace(/<title>[^<]*<\/title>/, `<title>${PAGES.graph.title.replace(/&/g, '&amp;')}</title>`);
  const { html, inlined } = inlineLocalScripts(withSeo, dirname(input), srcRoot);
  return { input, html, inlined };
}

/* ============================================================
 * sitemap.xml + robots.txt
 * ============================================================ */

function gitDate(file) {
  const r = spawnSync('git', ['log', '-1', '--format=%cs', '--', file], { cwd: repoRoot, encoding: 'utf8' });
  return r.status === 0 && r.stdout.trim() ? r.stdout.trim() : TODAY;
}

function buildSitemap() {
  const rows = Object.values(PAGES).map(p => {
    const loc = SITE + (p.path === 'index.html' ? '' : p.path);
    // The two generated pages are rewritten by this build; the hand-written one keeps its last commit date.
    const lastmod = p.path === 'webmcp.html' ? gitDate(p.path) : TODAY;
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join('\n')}\n</urlset>\n`;
}

const ROBOTS = `User-agent: *\nAllow: /\n\nSitemap: ${SITE}sitemap.xml\n`;

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

console.log('\nWriting sitemap.xml and robots.txt...');
writeFileSync(resolve(repoRoot, 'sitemap.xml'), buildSitemap(), 'utf8');
writeFileSync(resolve(repoRoot, 'robots.txt'), ROBOTS, 'utf8');
console.log(`Wrote sitemap.xml (${Object.keys(PAGES).length} URLs) and robots.txt`);
