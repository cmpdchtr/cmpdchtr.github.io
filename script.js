/* Root script for minimal gruvbox portfolio
 *
 * Responsibilities:
 * - Determine GitHub owner/repo (meta tags, hostname, pathname heuristics)
 * - Scan repository root for folders (prefer GitHub API; fallback to local probes and index.json)
 * - For each folder, attempt to extract a friendly title/description from local index.html or GitHub contents
 * - Render project cards into the page and expose a small debug API on window.pg
 *
 * Notes:
 * - Designed to be defensive: it tolerates missing DOM nodes and failing network calls.
 * - Avoids storing or exposing any secrets. For private repos you'd need a server-side proxy.
 *
 * Expected DOM elements (optional; script won't crash if they're missing):
 * - #projects               -> container where project cards are rendered
 * - #refresh-btn            -> button to trigger a manual rescan
 * - #theme-btn              -> toggle light/dark (script stores preference in localStorage)
 * - #repo-info              -> small area to show detected owner/repo
 * - #status                 -> small status text area
 * - #show-hidden-btn        -> button to toggle showing hidden names
 * - #use-api-btn            -> button to toggle whether to prefer GitHub API
 *
 * Internationalization: messages are in Ukrainian to match the site.
 */

(function () {
  'use strict';

  /* ---------------------------
     Utilities
  --------------------------- */
  const el = (selector) => document.querySelector(selector);
  const elAll = (selector) => Array.from(document.querySelectorAll(selector));
  const safeText = (s) => (typeof s === 'string' ? s : '');

  function setText(node, txt) {
    if (!node) return;
    node.textContent = txt;
  }

  function createEl(tag, props = {}, children = []) {
    const d = document.createElement(tag);
    Object.entries(props).forEach(([k, v]) => {
      if (k === 'class') d.className = v;
      else if (k === 'html') d.innerHTML = v;
      else if (k === 'text') d.textContent = v;
      else d.setAttribute(k, v);
    });
    (Array.isArray(children) ? children : [children]).forEach((c) => {
      if (!c) return;
      if (typeof c === 'string') d.appendChild(document.createTextNode(c));
      else d.appendChild(c);
    });
    return d;
  }

  function maybeDecodeName(n) {
    try {
      return decodeURIComponent(n);
    } catch (_) {
      return n;
    }
  }

  /* ---------------------------
     DOM references
  --------------------------- */
  const projectsEl = el('#projects') || el('#projects-list') || createAndAttachProjects();
  const refreshBtn = el('#refresh-btn');
  const themeBtn = el('#theme-btn');
  const repoInfoEl = el('#repo-info');
  const statusEl = el('#status');
  const showHiddenBtn = el('#show-hidden-btn');
  const useApiBtn = el('#use-api-btn');

  // helper: when index.html didn't include a container we create one at top of main
  function createAndAttachProjects() {
    const main = document.querySelector('main') || document.body;
    const container = createEl('div', { id: 'projects', class: 'grid' });
    main.appendChild(container);
    return container;
  }

  /* ---------------------------
     Local state
  --------------------------- */
  let showHidden = false;
  let preferApi = true;

  // hidden names to exclude by default
  const defaultHidden = ['.github', '.git', 'node_modules', 'scripts', 'assets'];

  /* ---------------------------
     Repo detection
  --------------------------- */
  function detectRepo() {
    // 1) meta tags
    const metaOwner = document.querySelector('meta[name="gh-owner"]');
    const metaRepo = document.querySelector('meta[name="gh-repo"]');
    if (metaOwner && metaRepo && metaOwner.content && metaRepo.content) {
      return { owner: metaOwner.content.trim(), repo: metaRepo.content.trim(), source: 'meta' };
    }

    // 2) user page: username.github.io
    const host = window.location.hostname || '';
    if (host.endsWith('.github.io')) {
      const owner = host.split('.')[0];
      return { owner, repo: `${owner}.github.io`, source: 'hostname' };
    }

    // 3) infer from path: /owner/repo/...
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (pathParts.length >= 2) {
      const owner = pathParts[0];
      const repo = pathParts[1];
      return { owner, repo, source: 'pathname' };
    }

    // unable to detect
    return null;
  }

  const detectedRepo = detectRepo();
  if (repoInfoEl) {
    if (detectedRepo) {
      repoInfoEl.textContent = `${detectedRepo.owner} / ${detectedRepo.repo} (${detectedRepo.source})`;
    } else {
      repoInfoEl.textContent = 'Невизначено — додайте <meta name=\"gh-owner\"> і <meta name=\"gh-repo\">';
    }
  }

  /* ---------------------------
     Network helpers
  --------------------------- */
  async function fetchJson(url, opts = {}) {
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return res.json();
    return res.text();
  }

  /* ---------------------------
     Content discovery helpers
  --------------------------- */

  // Try to fetch local index.html and scrape title & meta description.
  async function fetchLocalIndex(folder) {
    const url = `./${encodeURIComponent(folder)}/index.html`;
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) throw new Error('no-local');
      const text = await res.text();
      const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
      const descMatch = text.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
      const title = titleMatch ? titleMatch[1].trim() : null;
      const desc = descMatch ? descMatch[1].trim() : null;

      // fallback: try first paragraph
      let firstParagraph = null;
      try {
        const pMatch = text.match(/<p[^>]*>([\s\S]{20,400}?)<\/p>/i);
        if (pMatch) firstParagraph = pMatch[1].replace(/<[^>]+>/g, '').trim();
      } catch (_) { /* ignore */ }

      return {
        title: title || maybeDecodeName(folder),
        desc: desc || firstParagraph || ''
      };
    } catch (err) {
      return null;
    }
  }

  // Use GitHub API to read README.md or index.html in a folder.
  async function fetchFromGitHub(owner, repo, folder) {
    const acceptRaw = { Accept: 'application/vnd.github.v3.raw' };
    const candidates = [`${folder}/README.md`, `${folder}/readme.md`, `${folder}/index.html`];

    for (const path of candidates) {
      const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeURIComponent(path)}`;
      try {
        const res = await fetch(url, { headers: acceptRaw });
        if (!res.ok) {
          // 404 => try next; rate-limit or other errors bubble out after trying all
          if (res.status === 404) continue;
          // For other statuses we throw to allow fallback logic in caller
          throw new Error(`GitHub API ${res.status}`);
        }

        // For raw accept header, GitHub returns raw file content as text
        const text = await res.text();
        if (!text) continue;

        if (path.endsWith('.html')) {
          const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
          const pMatch = text.match(/<p[^>]*>([\s\S]{20,400}?)<\/p>/i);
          return {
            title: titleMatch ? titleMatch[1].trim() : maybeDecodeName(folder),
            desc: pMatch ? pMatch[1].replace(/<[^>]+>/g, '').trim() : ''
          };
        } else {
          // markdown: take first non-empty paragraph
          const md = text.replace(/\r/g, '');
          const paragraphs = md.split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
          const first = paragraphs.length ? paragraphs[0].replace(/\n/g, ' ') : '';
          return {
            title: maybeDecodeName(folder),
            desc: first.substring(0, 300)
          };
        }
      } catch (err) {
        // bubble the error so caller can decide (rate-limit, CORS, network)
        throw err;
      }
    }
    return null;
  }

  /* ---------------------------
     Rendering helpers
  --------------------------- */

  function projectCard({ name, title, desc }) {
    const anchor = createEl('a', { class: 'card link', href: `./${encodeURIComponent(name)}/` });
    anchor.setAttribute('aria-label', `Відкрити ${name}`);

    const h = createEl('h3', { text: title || name });
    const p = createEl('p', { text: desc || '' });
    const meta = createEl('div', { class: 'meta' }, [
      createEl('span', { class: 'pill', text: 'Папка' }),
      createEl('span', { class: 'small muted', text: name })
    ]);

    anchor.appendChild(h);
    if (desc) anchor.appendChild(p);
    anchor.appendChild(meta);
    return anchor;
  }

  function clearProjects() {
    if (!projectsEl) return;
    projectsEl.innerHTML = '';
  }

  function renderProjects(items) {
    clearProjects();
    if (!projectsEl) return;
    if (!items.length) {
      projectsEl.appendChild(createEl('div', { class: 'muted', text: 'Папок не знайдено.' }));
      return;
    }
    items.forEach(it => projectsEl.appendChild(projectCard(it)));
  }

  /* ---------------------------
     Main scanning routine
  --------------------------- */

  async function scanFolders() {
    setStatus('Сканування папок…');
    let discovered = [];

    // Step 0: try reading index.json if present (manual override)
    try {
      const idx = await fetch(`./index.json`, { cache: 'no-cache' }).then(r => (r.ok ? r.json() : null)).catch(() => null);
      if (idx && Array.isArray(idx.folders)) {
        discovered = idx.folders.map(n => ({ name: n }));
        setStatus(`Завантажено index.json (${discovered.length} записів)`);
      }
    } catch (e) {
      // ignore
    }

    // If repo detected and preferApi = true -> try GitHub API listing
    if (detectedRepo && preferApi && discovered.length === 0) {
      try {
        setStatus('Отримую список вмісту з GitHub API…');
        const url = `https://api.github.com/repos/${encodeURIComponent(detectedRepo.owner)}/${encodeURIComponent(detectedRepo.repo)}/contents/`;
        const res = await fetch(url, { headers: { Accept: 'application/vnd.github.v3+json' } });
        if (!res.ok) {
          throw new Error(`GitHub API ${res.status}`);
        }
        const items = await res.json();
        // items may include files and dirs; keep dirs and reasonable files
        discovered = (items || []).filter(i => i.type === 'dir').map(i => ({ name: i.name }));
        setStatus(`GitHub API: знайдено ${discovered.length} директорій`);
      } catch (err) {
        console.warn('GitHub API error:', err);
        setStatus('GitHub API недоступний або лімітовано; використовую локальний режим', true);
        // continue to local heuristics
        discovered = [];
      }
    }

    // If nothing discovered yet: try local heuristics (common names)
    if (discovered.length === 0) {
      setStatus('Локальне сканування: пробую знайти поширені папки та перевіряю наявність index.html...');
      const common = ['projects', 'site', 'docs', 'IWantSomeCatGirls', 'assets', 'blog', 'examples'];
      const found = [];
      for (const name of common) {
        try {
          const head = await fetch(`./${encodeURIComponent(name)}/index.html`, { method: 'HEAD' });
          if (head.ok) found.push({ name });
        } catch (e) {
          // ignore network errors per-folder
        }
      }

      // Additionally: heuristically try to parse root index.html for links to folders (simple approach)
      try {
        const rootText = await fetch('./index.html', { cache: 'no-cache' }).then(r => (r.ok ? r.text() : null)).catch(() => null);
        if (rootText) {
          // find href="/folder/" or href="./folder/" or href="folder/"
          const matches = Array.from(rootText.matchAll(/href=(?:'|")((?:\.\/)?([a-zA-Z0-9_\-]+)\/)(?:'|")/g));
          for (const m of matches) {
            const name = m[2];
            if (name && !found.some(f => f.name === name)) found.push({ name });
          }
        }
      } catch (e) {
        // ignore
      }

      discovered = found;
    }

    // Filter out hidden/system names unless showHidden
    discovered = discovered.filter(i => showHidden || !defaultHidden.includes(i.name));

    if (discovered.length === 0) {
      setStatus('Папок не знайдено.', true);
      renderProjects([]);
      return;
    }

    setStatus(`Знайдено ${discovered.length} папок — отримую короткі описи...`);

    // For each folder, attempt: local index -> GitHub content -> fallback to name
    const results = [];
    await Promise.all(discovered.map(async (item) => {
      const name = item.name;
      let title = null, desc = null;

      // 1) try local index (same-origin)
      try {
        const local = await fetchLocalIndex(name);
        if (local) {
          title = local.title || name;
          desc = local.desc || '';
          results.push({ name, title, desc });
          return;
        }
      } catch (_) { /* ignore */ }

      // 2) try GitHub API (if repo is known)
      if (detectedRepo) {
        try {
          const gh = await fetchFromGitHub(detectedRepo.owner, detectedRepo.repo, name);
          if (gh) {
            title = gh.title || name;
            desc = gh.desc || '';
            results.push({ name, title, desc });
            return;
          }
        } catch (err) {
          // if GitHub API failed, we will fall back to name; do not fail whole scan
          console.warn('GitHub content fetch failed for', name, err);
        }
      }

      // 3) fallback: name only
      results.push({ name, title: maybeDecodeName(name), desc: '' });
    }));

    // Sort alphabetically for stable presentation
    results.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    renderProjects(results);
    setStatus(`Готово — відображено ${results.length} елементів`);
  }

  /* ---------------------------
     UI interactions & initialization
  --------------------------- */

  function setStatus(txt, isError = false) {
    if (!statusEl) {
      // try to create a small status under projects container
      if (projectsEl && !document.querySelector('#__pg_status')) {
        const s = createEl('div', { id: '__pg_status', class: 'status muted' });
        projectsEl.parentNode && projectsEl.parentNode.insertBefore(s, projectsEl.nextSibling);
        setText(s, txt);
        if (isError) s.style.color = '#ff6b6b';
        return;
      }
      return;
    }
    setText(statusEl, txt);
    statusEl.style.color = isError ? '#ff6b6b' : '';
  }

  // Theme toggle (very small helper)
  function applyTheme(theme) {
    if (theme === 'light') document.documentElement.classList.add('light');
    else document.documentElement.classList.remove('light');
    localStorage.setItem('site-theme', theme);
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const cur = localStorage.getItem('site-theme') || 'dark';
      applyTheme(cur === 'dark' ? 'light' : 'dark');
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', (e) => {
      e.preventDefault();
      scanFolders();
    });
  }

  if (showHiddenBtn) {
    showHiddenBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showHidden = !showHidden;
      showHiddenBtn.textContent = showHidden ? 'Приховати сховані' : 'Показати сховані';
      scanFolders();
    });
    // init label
    showHiddenBtn.textContent = showHidden ? 'Приховати сховані' : 'Показати сховані';
  }

  if (useApiBtn) {
    useApiBtn.addEventListener('click', (e) => {
      e.preventDefault();
      preferApi = !preferApi;
      useApiBtn.textContent = preferApi ? 'Використати GitHub API' : 'Локальний режим';
      scanFolders();
    });
    useApiBtn.textContent = preferApi ? 'Використати GitHub API' : 'Локальний режим';
  }

  // Initialize theme from localStorage
  applyTheme(localStorage.getItem('site-theme') || 'dark');

  // Initial scan
  // Slight delay to allow DOM to finish rendering if script is included in head
  setTimeout(() => {
    scanFolders().catch((err) => {
      console.error('scanFolders failed:', err);
      setStatus('Помилка при скануванні папок', true);
    });
  }, 50);

  /* Expose tiny debug API */
  window.pg = window.pg || {};
  window.pg.scan = scanFolders;
  window.pg.setPreferApi = (v) => {
    preferApi = !!v;
    if (useApiBtn) useApiBtn.textContent = preferApi ? 'Використати GitHub API' : 'Локальний режим';
    return scanFolders();
  };
  window.pg.setShowHidden = (v) => {
    showHidden = !!v;
    if (showHiddenBtn) showHiddenBtn.textContent = showHidden ? 'Приховати сховані' : 'Показати сховані';
    return scanFolders();
  };

  // expose detection result
  window.pg.repo = detectedRepo || null;

})();
