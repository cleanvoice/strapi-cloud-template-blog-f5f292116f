"use strict";

// On startup, ensure the Features grid (title contains "Check out all our Features")
// has 11 items populated. Uses mediaUrl so editors see items in the UI immediately.
module.exports = async ({ strapi }) => {
  // Disable all seeding/migration logic by default; enable explicitly via env in non-prod.
  if (process.env.ENABLE_BOOTSTRAP_SEED !== 'true') {
    return;
  }


  async function resolveMediaUrlMaybe(value) {
    try {
      if (!value) return '';
      if (typeof value === 'string') return value;
      if (typeof value === 'number') {
        const f = await strapi.entityService.findOne('plugin::upload.file', value);
        return (f && f.url) || '';
      }
      if (typeof value === 'object') {
        if (typeof value.url === 'string') return value.url;
        if (value.data && value.data.attributes && typeof value.data.attributes.url === 'string') {
          return value.data.attributes.url;
        }
        if (value.formats) {
          const candidates = ['url', 'large', 'medium', 'small', 'thumbnail'];
          for (const key of candidates) {
            const fmt = key === 'url' ? value : value.formats[key];
            if (fmt && typeof fmt.url === 'string') return fmt.url;
          }
        }
        if (typeof value.id === 'number') {
          const f = await strapi.entityService.findOne('plugin::upload.file', value.id);
          return (f && f.url) || '';
        }
        if (value.Media) {
          return await resolveMediaUrlMaybe(value.Media);
        }
      }
      return '';
    } catch (_) {
      return '';
    }
  }

  async function deepNormalizeMedia(obj) {
    if (Array.isArray(obj)) {
      const out = [];
      for (const item of obj) out.push(await deepNormalizeMedia(item));
      return out;
    }
    if (obj && typeof obj === 'object') {
      const copy = { ...obj };
      // If Media relation exists, verify it's valid; otherwise drop it and keep mediaUrl
      if (copy.Media) {
        try {
          const mediaId = typeof copy.Media === 'number' ? copy.Media : (copy.Media && copy.Media.id);
          if (mediaId) {
            const file = await strapi.entityService.findOne('plugin::upload.file', mediaId);
            if (!file || !file.id) {
              const guessed = await resolveMediaUrlMaybe(copy.Media);
              if (guessed && !copy.mediaUrl) copy.mediaUrl = guessed;
              delete copy.Media;
            }
          } else {
            const guessed = await resolveMediaUrlMaybe(copy.Media);
            if (guessed && !copy.mediaUrl) copy.mediaUrl = guessed;
            delete copy.Media;
          }
        } catch (_) {
          const guessed = await resolveMediaUrlMaybe(copy.Media);
          if (guessed && !copy.mediaUrl) copy.mediaUrl = guessed;
          delete copy.Media;
        }
      }
      if (copy.Media && !copy.mediaUrl) {
        const url = await resolveMediaUrlMaybe(copy.Media);
        if (url) copy.mediaUrl = url;
      }
      // If we have mediaUrl but not Media relation, try to attach the Upload file
      if (!copy.Media && copy.mediaUrl && typeof copy.mediaUrl === 'string') {
        try {
          const files = await strapi.entityService.findMany('plugin::upload.file', { filters: { url: copy.mediaUrl }, limit: 1 });
          if (files && files[0] && files[0].id) {
            copy.Media = files[0].id;
          } else {
            const ensured = await ensureUploadForUrl(copy.mediaUrl);
            if (ensured) copy.Media = ensured;
          }
        } catch (_) {}
      }
      // Also handle common media keys
      for (const key of Object.keys(copy)) {
        const val = copy[key];
        if (key.toLowerCase() === 'media' && !copy.mediaUrl) {
          const url = await resolveMediaUrlMaybe(val);
          if (url) copy.mediaUrl = url;
        } else if (key.toLowerCase().endsWith('media') && !copy[`${key}Url`]) {
          const url = await resolveMediaUrlMaybe(val);
          if (url) copy[`${key}Url`] = url;
        } else if (key.toLowerCase().includes('image') && !copy[`${key}Url`]) {
          const url = await resolveMediaUrlMaybe(val);
          if (url) copy[`${key}Url`] = url;
          // If relation field like 'image' is empty but we now have imageUrl, attach Upload file id
          if (!val && copy[`${key}Url`]) {
            try {
              const files = await strapi.entityService.findMany('plugin::upload.file', { filters: { url: copy[`${key}Url`] }, limit: 1 });
              if (files && files[0] && files[0].id) {
                copy[key] = files[0].id;
              } else {
                const ensured = await ensureUploadForUrl(copy[`${key}Url`]);
                if (ensured) copy[key] = ensured;
              }
            } catch (_) {}
          }
        } else if (typeof val === 'object') {
          copy[key] = await deepNormalizeMedia(val);
        }
      }
      return copy;
    }
    return obj;
  }

  // Find v3 SQLite DB in the parent folder to import legacy 1-2-3 items
  function findV3DbPath() {
    const fs = require('fs');
    const path = require('path');
    const candidates = [];
    const parent = path.resolve(__dirname, '..', '..');
    // Common locations
    candidates.push(path.join(parent, '.tmp', 'data.db'));
    // Known migration repo path (features seeding script used this)
    candidates.push('/Users/edijs/Developer/strapi-migrate/strapi-cloud-template-blog-no-no/.tmp/data.db');
    try {
      const entries = fs.readdirSync(parent, { withFileTypes: true });
      for (const e of entries) {
        if (e.isDirectory()) {
          candidates.push(path.join(parent, e.name, '.tmp', 'data.db'));
        }
      }
    } catch (_) {}
    for (const p of candidates) {
      try {
        const st = fs.statSync(p);
        if (st && st.isFile() && st.size > 0) return p;
      } catch (_) {}
    }
    return null;
  }

  async function loadV3DemoSeed() {
    const cp = require('child_process');
    const db = findV3DbPath();
    if (!db) return null;
    try {
      const tblRaw = cp.execSync(
        `sqlite3 "${db}" "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'components%demo%section%';"`,
        { encoding: 'utf8' }
      );
      const tableNames = String(tblRaw || '').split(/\n+/).filter(Boolean);
      const candidates = tableNames.length ? tableNames : ['components_sections_demo_section'];
      for (const table of candidates) {
        try {
          const colsRaw = cp.execSync(`sqlite3 "${db}" "PRAGMA table_info(${table});"`, { encoding: 'utf8' });
          const colLines = String(colsRaw || '').split(/\n+/).filter(Boolean);
          const colNames = colLines.map((l) => l.split('|')[1]).filter(Boolean);
          const preferred = ['demo', 'Demo', 'demos', 'items', 'data', 'json', 'value', 'values', 'content'];
          const scanCols = [...preferred.filter((c) => colNames.includes(c)), ...colNames];
          for (const col of scanCols) {
            try {
              const valRaw = cp.execSync(
                `sqlite3 "${db}" "SELECT \"${col}\" FROM ${table} WHERE \"${col}\" IS NOT NULL AND TRIM(\"${col}\") <> '' LIMIT 20;"`,
                { encoding: 'utf8' }
              );
              const lines = String(valRaw || '').split(/\n+/).filter(Boolean);
              for (const line of lines) {
                try {
                  const arr = JSON.parse(line);
                  if (Array.isArray(arr) && arr.length) {
                    return arr;
                  }
                } catch (_) {}
              }
            } catch (_) {}
          }
        } catch (_) {}
      }
    } catch (_) {}
    return null;
  }

  // Attempt to read glossary entries directly from a local v3 SQLite database
  async function loadV3GlossaryFromDb(limit = 1000) {
    const cp = require('child_process');
    const db = findV3DbPath();
    if (!db) return [];
    try {
      const tblRaw = cp.execSync(
        `sqlite3 "${db}" "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'components%glossary%';"`,
        { encoding: 'utf8' }
      );
      const tableNames = String(tblRaw || '').split(/\n+/).filter(Boolean);
      const candidates = tableNames.length ? tableNames : [];
      const collected = [];
      for (const table of candidates) {
        try {
          const colsRaw = cp.execSync(`sqlite3 "${db}" "PRAGMA table_info(${table});"`, { encoding: 'utf8' });
          const colLines = String(colsRaw || '').split(/\n+/).filter(Boolean);
          const colNames = colLines.map((l) => l.split('|')[1]).filter(Boolean);
          const pick = (names) => names.find((n) => colNames.includes(n));
          const nameCol = pick(['Title', 'title', 'Name', 'name', 'term', 'Term']) || colNames.find((c) => /title|name|term/i.test(c));
          const descCol = pick(['Description', 'description', 'Text', 'text', 'content', 'Content', 'definition', 'Definition']) || colNames.find((c) => /desc|text|content|definition/i.test(c));
          const metaCol = pick(['Metadata', 'metadata', 'meta', 'Meta']);
          if (!nameCol) continue;
          const selected = [nameCol, descCol, metaCol].filter(Boolean).map((c) => `"${c}"`).join(', ');
          const sql = `SELECT ${selected} FROM ${table} LIMIT ${limit};`;
          const rowsRaw = cp.execSync(`sqlite3 -json "${db}" "${sql}"`, { encoding: 'utf8' });
          const rows = JSON.parse(rowsRaw || '[]');
          for (const r of rows) {
            const Title = String(r[nameCol] || '').trim();
            if (!Title) continue;
            const Description = descCol ? String(r[descCol] || '').trim() : '';
            let Metadata = null;
            if (metaCol && r[metaCol]) {
              if (typeof r[metaCol] === 'string') {
                try { Metadata = JSON.parse(r[metaCol]); } catch (_) { Metadata = null; }
              } else if (typeof r[metaCol] === 'object') {
                Metadata = r[metaCol];
              }
            }
            collected.push({ Title, ...(Description ? { Description } : {}), ...(Metadata ? { Metadata } : {}) });
          }
          if (collected.length) break; // good enough
        } catch (_) {}
      }
      return collected;
    } catch (_) {
      return [];
    }
  }

  async function normalizeDemoIcon(iconLike) {
    try {
      if (!iconLike) return '';
      if (typeof iconLike === 'string') return await resolveMediaUrlMaybe(iconLike);
      if (typeof iconLike === 'number') {
        const f = await strapi.entityService.findOne('plugin::upload.file', iconLike);
        return (f && f.url) || '';
      }
      if (typeof iconLike === 'object') {
        const url = await resolveMediaUrlMaybe(iconLike);
        return url || '';
      }
      return '';
    } catch (_) {
      return '';
    }
  }

  async function normalizeDemoItem(raw) {
    const Title = (raw && (raw.Title || raw.title || raw.Label || raw.label || raw.name)) || '';
    const Label = (raw && (raw.Label || raw.label || raw.Title || raw.title)) || Title || '';
    const Subtitle = (raw && (raw.Subtitle || raw.subtitle || raw.Text || raw.text)) || '';
    const DemoType = (raw && (raw.DemoType || raw.demoType || raw.type)) || '';
    const DemoData = (raw && (raw.DemoData || raw.demoData || raw.data || raw.payload)) || null;
    const Icon = await normalizeDemoIcon(raw && (raw.Icon || raw.icon));
    return { Label, Subtitle, DemoType, DemoData, Icon, Title };
  }

  async function loadV3Seed123() {
    const cp = require('child_process');
    const db = findV3DbPath();
    if (!db) return null;
    try {
      // Discover table and column dynamically
      const tblRaw = cp.execSync(`sqlite3 "${db}" "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'components_sections%1%2%3%';"`, { encoding: 'utf8' });
      const tableNames = String(tblRaw || '').split(/\n+/).filter(Boolean);
      const candidates = tableNames.length ? tableNames : ['components_sections_1_2_3'];
      for (const table of candidates) {
        try {
          const colsRaw = cp.execSync(`sqlite3 "${db}" "PRAGMA table_info(${table});"`, { encoding: 'utf8' });
          const colLines = String(colsRaw || '').split(/\n+/).filter(Boolean);
          const colNames = colLines.map((l) => l.split('|')[1]).filter(Boolean);
          const preferred = ['items', 'Items', 'data', 'value', 'values', 'json', 'content'];
          const scanCols = [...preferred.filter((c) => colNames.includes(c)), ...colNames];
          for (const col of scanCols) {
            try {
              const valRaw = cp.execSync(`sqlite3 "${db}" "SELECT \"${col}\" FROM ${table} WHERE \"${col}\" IS NOT NULL AND TRIM(\"${col}\") <> '' LIMIT 20;"`, { encoding: 'utf8' });
              const lines = String(valRaw || '').split(/\n+/).filter(Boolean);
              for (const line of lines) {
                try {
                  const arr = JSON.parse(line);
                  if (Array.isArray(arr) && arr.length) {
                    const mapped = arr.map((it) => {
                      const Title = (it && (it.Title || it.title || it.Text || it.text)) || '';
                      const Text = (it && (it.Text || it.text || '')) || '';
                      const media = it && (it.Media || it.media);
                      const mediaUrl = (media && (media.url || (media.data && media.data.attributes && media.data.attributes.url))) || '';
                      return { Title, Text, mediaUrl };
                    }).filter((x) => x.Title);
                    if (mapped.length) return mapped;
                  }
                } catch (_) {}
              }
            } catch (_) {}
          }
        } catch (_) {}
      }
    } catch (_) {}
    return null;
  }

  function findUploadUrlByPrefix(prefix) {
    try {
      const fs = require('fs');
      const path = require('path');
      const dir = path.join(__dirname, '..', 'public', 'uploads');
      const files = fs.readdirSync(dir).filter((f) => f.startsWith(prefix));
      if (files && files[0]) return `/uploads/${files[0]}`;
    } catch (_) {}
    return '';
  }

  function listUploadUrls(limit = 6) {
    try {
      const fs = require('fs');
      const path = require('path');
      const dir = path.join(__dirname, '..', 'public', 'uploads');
      const all = fs
        .readdirSync(dir)
        .filter((f) => /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(f))
        .map((f) => `/uploads/${f}`);
      return all.slice(0, limit);
    } catch (_) {
      return [];
    }
  }

  async function getDefault123Seed() {
    const a = findUploadUrlByPrefix('1_') || '/uploads/1_568c4af47e.png';
    const b = findUploadUrlByPrefix('2_') || '/uploads/2_9a6a23f535.png';
    const c = findUploadUrlByPrefix('3_') || '/uploads/3_682635ee73.png';
    return [
      { Header: 'Drag and Drop Your Files', SubHeader: '', Number: '1', Media: a },
      { Header: 'Sit Back and Let AI Do the Magic', SubHeader: '', Number: '2', Media: b },
      { Header: 'Download Or Export Clean Files', SubHeader: '', Number: '3', Media: c },
    ];
  }

  async function resolveUploadIdByUrl(possibleUrl) {
    try {
      if (!possibleUrl) return null;
      const url = await resolveMediaUrlMaybe(possibleUrl);
      if (!url) return null;
      const files = await strapi.entityService.findMany('plugin::upload.file', { filters: { url }, limit: 1 });
      const f = files && files[0];
      if (f && f.id) return f.id;
      // If no upload entry exists yet for this URL, try to create it from local disk
      const createdId = await ensureUploadForUrl(url);
      return createdId || null;
    } catch (_) {
      return null;
    }
  }

  async function normalize123Item(raw, idx) {
    const Header = raw.Header || raw.Title || raw.title || raw.name || '';
    const SubHeader = raw.SubHeader || raw.Text || raw.text || raw.subtitle || '';
    const Number = raw.Number || String((idx || 0) + 1);
    let Media = raw.Media;
    if (!Media) {
      const candidate = raw.mediaUrl || raw.url || raw.image || raw.src || '';
      const id = await resolveUploadIdByUrl(candidate);
      Media = id || null;
    } else if (typeof Media === 'number') {
      try {
        const f = await strapi.entityService.findOne('plugin::upload.file', Media);
        if (!f || !f.id) {
          const fallbackUrl = idx === 0 ? findUploadUrlByPrefix('1_') : idx === 1 ? findUploadUrlByPrefix('2_') : findUploadUrlByPrefix('3_');
          const createdId = await ensureUploadForUrl(fallbackUrl);
          Media = createdId || null;
        }
      } catch (_) {
        const fallbackUrl = idx === 0 ? findUploadUrlByPrefix('1_') : idx === 1 ? findUploadUrlByPrefix('2_') : findUploadUrlByPrefix('3_');
        const createdId = await ensureUploadForUrl(fallbackUrl);
        Media = createdId || null;
      }
    } else if (typeof Media === 'string') {
      const id = await resolveUploadIdByUrl(Media);
      Media = id || null;
    } else if (typeof Media === 'object' && Media.url) {
      const id = await resolveUploadIdByUrl(Media.url);
      Media = id || null;
    }
    return { Header, SubHeader, Number, ...(Media ? { Media } : {}) };
  }

  function isBad123Item(it) {
    if (!it || typeof it !== 'object') return true;
    const hasHeader = typeof it.Header === 'string' && it.Header.trim().length > 0;
    const hasNumber = typeof it.Number === 'string' && it.Number.trim().length > 0;
    const hasMedia = !!it.Media || typeof it.mediaUrl === 'string';
    return !(hasHeader && hasNumber && hasMedia);
  }

  async function ensureUploadForUrl(url) {
    try {
      const resolved = await resolveMediaUrlMaybe(url);
      if (!resolved) return null;
      // If a file entry already exists for this URL, reuse it
      const existing = await strapi.entityService.findMany('plugin::upload.file', { filters: { url: resolved }, limit: 1 });
      if (existing && existing[0] && existing[0].id) return existing[0].id;
      // Otherwise, create a new upload entry from disk (local provider)
      const fs = require('fs');
      const path = require('path');
      const mime = require('mime-types');
      const publicDir = path.join(__dirname, '..', 'public');
      // Normalize leading slash and ensure we point inside public dir
      const cleaned = String(resolved).replace(/^\/+/, ''); // drop leading '/'
      const absPath = path.join(publicDir, cleaned);
      const stat = fs.existsSync(absPath) ? fs.statSync(absPath) : null;
      if (!stat || !stat.isFile()) return null;
      const name = path.basename(absPath);
      const type = mime.lookup(name) || 'application/octet-stream';
      const size = stat.size;
      const [created] = await strapi.plugin('upload').service('upload').upload({
        data: { fileInfo: { name } },
        files: { path: absPath, name, type, size },
      });
      return created && created.id ? created.id : null;
    } catch (_) {
      return null;
    }
  }

  try {
    const items = [
      { Text: "Filler Words Remover", mediaUrl: "/uploads/Filler_Words_Remover_f9f26ec736.png", Link: { url: "/filler-words", newTab: false, text: "Filler Words Remover" } },
      { Text: "Background Noise Remover", mediaUrl: "/uploads/Background_Noise_Remover_971f7160ea.png", Link: { url: "/remove-background-noise", newTab: false, text: "Background Noise Remover" } },
      { Text: "Studio Sound (Audio Enhancer)", mediaUrl: "/uploads/Audio_Enhancement_1_bb603a4d47.svg", Link: { url: "/audio-enhancer", newTab: false, text: "Studio Sound (Audio Enhancer)" } },
      { Text: "Podcast Summary & Shownotes", mediaUrl: "/uploads/Podcast_Summary_and_Shownotes_737421cb99.png", Link: { url: "/podcast-summarization", newTab: false, text: "Podcast Summary & Shownotes" } },
      { Text: "Silence Remover", mediaUrl: "/uploads/Silence_Remover_cbd215beb6.png", Link: { url: "/deadair-remover", newTab: false, text: "Silence Remover" } },
      { Text: "Podcast Transcription", mediaUrl: "/uploads/Podcast_Transcription_2b70a20c99.png", Link: { url: "/podcast-transcript", newTab: false, text: "Podcast Transcription" } },
      { Text: "Podcast Mixing", mediaUrl: "/uploads/Podcast_Mixing_6e5f3c983d.png", Link: { url: "/podcast-mixing", newTab: false, text: "Podcast Mixing" } },
      { Text: "Breath Remover", mediaUrl: "/uploads/Breath_Remover_43836b99f8.png", Link: { url: "/breath-remover", newTab: false, text: "Breath Remover" } },
      { Text: "Stutter Remover", mediaUrl: "/uploads/lip_smacking_1_2026b85545.png", Link: { url: "/stutter-remover", newTab: false, text: "Stutter Remover" } },
      { Text: "Integrations", mediaUrl: "/uploads/Integrations_3bc985891f.png", Link: { url: "/integrations", newTab: false, text: "Integrations" } },
      { Text: "Mouth Sound Remover", mediaUrl: "/uploads/Mouth_Sound_Remover_6210f0e0d8.png", Link: { url: "/mouth-sounds", newTab: false, text: "Mouth Sound Remover" } },
    ];
    const byText = Object.fromEntries(items.map((i) => [i.Text, i.Link]));

    // Fix media issues on 'features' grid-image
    const pages = await strapi.entityService.findMany('api::page.page', {
      filters: { slug: 'features', locale: 'en' },
      populate: { contentSections: { populate: '*' } },
    });

    for (const page of pages) {
      const sections = Array.isArray(page.contentSections) ? page.contentSections : [];
      let changed = false;
      const nextSections = [];
      for (const sec of sections) {
        if (sec.__component === 'sections.grid-image') {
          const current = Array.isArray(sec.ImageGrid) ? sec.ImageGrid : (Array.isArray(sec.imageGrid) ? sec.imageGrid : []);
          // If empty, seed all
          if (!current || current.length === 0) {
            const newItems = items.map((it) => ({ ...it }));
            changed = true;
            nextSections.push({ ...sec, ImageGrid: newItems, imageGrid: newItems });
            continue;
          }
          // Otherwise, fill missing Link per item and attach Media by URL if possible
          const patched = [];
          for (const it of current) {
            let next = it;
            if (next && !next.Link && next.Text && byText[next.Text]) {
              changed = true;
              next = { ...next, Link: byText[next.Text] };
            }
            if (next && !next.Media && next.mediaUrl) {
              const fileUrl = await resolveMediaUrlMaybe(next.mediaUrl);
              if (fileUrl) {
                const files = await strapi.entityService.findMany('plugin::upload.file', { filters: { url: fileUrl }, limit: 1 });
                const f = files && files[0];
                if (f && f.id) {
                  changed = true;
                  next = { ...next, Media: f.id };
                }
              }
            }
            patched.push(next);
          }
          nextSections.push({ ...sec, ImageGrid: patched, imageGrid: patched });
        } else {
          nextSections.push(sec);
        }
      }
      const patch = { contentSections: changed ? nextSections : sections };
      await strapi.entityService.update('api::page.page', page.id, { data: patch });
    }
  } catch (e) {
    strapi.log.warn(`Features grid seed skipped: ${e.message}`);
  }

  // Migrate 1-2-3 sections: convert JSON Items into repeatable component with mediaUrl fallback
  try {
    const v3Seed = await loadV3Seed123();
    const defaultSeed = await getDefault123Seed();
    const allPages = await strapi.entityService.findMany('api::page.page', {
      populate: { contentSections: { populate: '*' } },
      limit: 1000,
    });
    for (const page of allPages) {
      const sections = Array.isArray(page.contentSections) ? page.contentSections : [];
      let changed = false;
      const nextSections = [];
      for (const sec of sections) {
        if (sec.__component === 'sections.1-2-3') {
          const items = Array.isArray(sec.Items) ? sec.Items : [];
          const looksMigrated = items.length > 0 && items.every((it) => typeof it === 'object' && (it.Media || it.mediaUrl || it.Header || it.SubHeader || it.Title || it.Text));
          if (looksMigrated) {
            const fixed = [];
            for (let idx = 0; idx < items.length; idx++) {
              const normalized = await normalize123Item(items[idx], idx);
              if (!normalized.Media && idx < 3) {
                const urlByIdx = idx === 0 ? findUploadUrlByPrefix('1_') : idx === 1 ? findUploadUrlByPrefix('2_') : findUploadUrlByPrefix('3_');
                const id = await ensureUploadForUrl(urlByIdx);
                if (id) normalized.Media = id;
              }
              fixed.push(normalized);
            }
            // If still bad, fallback to default seed with correct headers
            const anyBad = fixed.some((it) => isBad123Item(it));
            if (anyBad) {
              const seeded = [];
              const rawSeed = await getDefault123Seed();
              for (let i = 0; i < rawSeed.length; i++) {
                const it = await normalize123Item(rawSeed[i], i);
                if (!it.Media) {
                  const urlByIdx = i === 0 ? findUploadUrlByPrefix('1_') : i === 1 ? findUploadUrlByPrefix('2_') : findUploadUrlByPrefix('3_');
                  const id = await ensureUploadForUrl(urlByIdx);
                  if (id) it.Media = id;
                }
                seeded.push(it);
              }
              nextSections.push({ ...sec, Items: seeded });
            } else {
              nextSections.push({ ...sec, Items: fixed });
            }
            changed = true;
            continue;
          }
          if (!items || items.length === 0) {
            const seedRaw = (v3Seed && v3Seed.length >= 3) ? v3Seed.slice(0, 3) : defaultSeed;
            const seed = [];
            for (let i = 0; i < seedRaw.length; i++) {
              const item = await normalize123Item(seedRaw[i], i);
              if (!item.Media) {
                const urlByIdx = i === 0 ? findUploadUrlByPrefix('1_') : i === 1 ? findUploadUrlByPrefix('2_') : findUploadUrlByPrefix('3_');
                const id = await ensureUploadForUrl(urlByIdx);
                if (id) item.Media = id;
              }
              seed.push(item);
            }
            nextSections.push({ ...sec, Items: seed });
            changed = true;
            continue;
          }
          const mapped = [];
          for (let idx = 0; idx < items.length; idx++) {
            const it = items[idx];
            if (typeof it === 'string') {
              mapped.push({ Header: it, SubHeader: '', Number: String(idx + 1) });
            } else if (it && typeof it === 'object') {
              const item = await normalize123Item(it, idx);
              if (!item.Media && idx < 3) {
                const urlByIdx = idx === 0 ? findUploadUrlByPrefix('1_') : idx === 1 ? findUploadUrlByPrefix('2_') : findUploadUrlByPrefix('3_');
                const id = await ensureUploadForUrl(urlByIdx);
                if (id) item.Media = id;
              }
              mapped.push(item);
            } else {
              mapped.push({ Header: '', SubHeader: '', Number: String(idx + 1) });
            }
          }
          // If any mapped item is still missing header/media, fallback to default seed
          if (mapped.some((it) => isBad123Item(it))) {
            const seeded = [];
            const rawSeed = await getDefault123Seed();
            for (let i = 0; i < rawSeed.length; i++) {
              const it = await normalize123Item(rawSeed[i], i);
              if (!it.Media) {
                const urlByIdx = i === 0 ? findUploadUrlByPrefix('1_') : i === 1 ? findUploadUrlByPrefix('2_') : findUploadUrlByPrefix('3_');
                const id = await ensureUploadForUrl(urlByIdx);
                if (id) it.Media = id;
              }
              seeded.push(it);
            }
            nextSections.push({ ...sec, Items: seeded });
          } else {
            nextSections.push({ ...sec, Items: mapped });
          }
          changed = true;
          continue;
        }
        if (sec.__component === 'sections.brand-logos') {
          const logos = Array.isArray(sec.brand) ? sec.brand : [];
          if (!logos || logos.length === 0) {
            const urls = listUploadUrls(8);
            const seeded = urls.map((u) => ({ name: '', mediaUrl: u }));
            nextSections.push({ ...sec, brand: seeded });
            changed = true;
            continue;
          }
          const mapped = [];
          let needsChange = false;
          for (const it of logos) {
            if (typeof it === 'string') {
              needsChange = true;
              mapped.push({ name: '', mediaUrl: it });
              continue;
            }
            if (it && typeof it === 'object') {
              if (it.Media || it.mediaUrl) {
                mapped.push(it);
              } else {
                needsChange = true;
                const name = it.name || it.Title || '';
                const mediaUrl = it.url || it.image || it.src || '';
                const url = it.href || it.link || '';
                mapped.push({ name, mediaUrl, ...(url ? { url } : {}) });
              }
              continue;
            }
            needsChange = true;
            mapped.push({ name: '', mediaUrl: '' });
          }
          if (needsChange) {
            nextSections.push({ ...sec, brand: mapped });
            changed = true;
            continue;
          }
        }
        if (sec.__component === 'sections.bento-box') {
          const bentoItems = Array.isArray(sec.bento) ? sec.bento : [];
          if (!bentoItems || bentoItems.length === 0) {
            const urls = listUploadUrls(6);
            const seed = urls.slice(0, 4).map((u, i) => ({
              Title: `Tile ${i + 1}`,
              Content: '',
              Subtitle: '',
              mediaUrl: u,
              ButtonText: '',
              ButtonLink: '',
              Size: '',
              ImagePosition: '',
            }));
            nextSections.push({ ...sec, bento: seed });
            changed = true;
            continue;
          }
          const mapped = [];
          let needsChange = false;
          for (const it of bentoItems) {
            if (typeof it === 'string') {
              needsChange = true;
              mapped.push({ Title: it, Content: '', Subtitle: '', mediaUrl: '' });
              continue;
            }
            if (it && typeof it === 'object') {
              if (it.Media || it.mediaUrl || it.Title || it.Subtitle || it.Content) {
                mapped.push(it);
              } else {
                needsChange = true;
                mapped.push({ Title: '', Content: '', Subtitle: '', mediaUrl: '' });
              }
              continue;
            }
            needsChange = true;
            mapped.push({ Title: '', Content: '', Subtitle: '', mediaUrl: '' });
          }
          if (needsChange) {
            nextSections.push({ ...sec, bento: mapped });
            changed = true;
            continue;
          }
        }
        if (sec.__component === 'sections.big-image-cta') {
          const hasImage = !!(sec.image && (typeof sec.image === 'number' || typeof sec.image === 'object' || typeof sec.image === 'string'));
          if (!hasImage) {
            const urls = listUploadUrls(1);
            const imgUrl = urls[0] || findUploadUrlByPrefix('1_') || '';
            const patch = { ...sec };
            if (imgUrl) patch.image = imgUrl;
            if (!patch.Title) patch.Title = 'Edit video or audio without the hassle';
            if (!patch.subtitle) patch.subtitle = 'Fast, accurate and simple.';
            if (!patch.buttonText) patch.buttonText = 'Upload for Free';
            if (!patch.buttonLink) patch.buttonLink = 'https://app.cleanvoice.ai/beta';
            nextSections.push(patch);
            changed = true;
            continue;
          }
        }
        nextSections.push(sec);
      }
      if (changed) {
        await strapi.entityService.update('api::page.page', page.id, { data: { contentSections: nextSections } });
      }
    }
  } catch (e) {
    strapi.log.warn(`1-2-3 migration skipped: ${e.message}`);
  }

  // Pass 2: recursively resolve any lingering Media IDs to URLs across all pages/sections
  try {
    const allPages2 = await strapi.entityService.findMany('api::page.page', {
      populate: { contentSections: { populate: '*' } },
      limit: 1000,
    });
    for (const page of allPages2) {
      const sections = Array.isArray(page.contentSections) ? page.contentSections : [];
      const normalized = [];
      for (const sec of sections) normalized.push(await deepNormalizeMedia(sec));
      await strapi.entityService.update('api::page.page', page.id, { data: { contentSections: normalized } });
    }
  } catch (e) {
    strapi.log.warn(`Deep media normalization skipped: ${e.message}`);
  }

  // Pass 3: Ensure Bento Box and Brand Logos have items seeded if still empty
  try {
    const pages = await strapi.entityService.findMany('api::page.page', {
      populate: { contentSections: { populate: '*' } },
      limit: 1000,
    });
    for (const page of pages) {
      const sections = Array.isArray(page.contentSections) ? page.contentSections : [];
      let changed = false;
      const nextSections = [];
      for (const sec of sections) {
        if (sec.__component === 'sections.bento-box') {
          const items = Array.isArray(sec.bento) ? sec.bento : [];
          if (!items || items.length === 0) {
            const urls = listUploadUrls(6);
            const seed = urls.slice(0, 4).map((u, i) => ({ Title: `Tile ${i + 1}`, Subtitle: '', mediaUrl: u }));
            nextSections.push({ ...sec, bento: seed });
            changed = true;
            continue;
          }
        }
        if (sec.__component === 'sections.brand-logos') {
          const logos = Array.isArray(sec.brand) ? sec.brand : [];
          if (!logos || logos.length === 0) {
            const urls = listUploadUrls(8);
            const seed = urls.map((u) => ({ name: '', mediaUrl: u }));
            nextSections.push({ ...sec, brand: seed });
            changed = true;
            continue;
          }
        }
        nextSections.push(sec);
      }
      if (changed) {
        await strapi.entityService.update('api::page.page', page.id, { data: { contentSections: nextSections } });
      }
    }
  } catch (e) {
    strapi.log.warn(`Bento/Brand seed pass skipped: ${e.message}`);
  }

  // Pass 4: Ensure Demo Section has 3 proper demo items (Label, Subtitle, DemoType, DemoData, Icon, Title)
  try {
    const v3Seed = await loadV3DemoSeed();
    const pages = await strapi.entityService.findMany('api::page.page', {
      populate: { contentSections: { populate: '*' } },
      limit: 1000,
    });
    for (const page of pages) {
      const sections = Array.isArray(page.contentSections) ? page.contentSections : [];
      let changed = false;
      const nextSections = [];
      for (const sec of sections) {
        if (sec.__component === 'sections.demo-section') {
          const existing = Array.isArray(sec.demo) ? sec.demo : [];
          const normalized = [];
          if (existing && existing.length) {
            for (const it of existing) normalized.push(await normalizeDemoItem(it));
          } else if (v3Seed && v3Seed.length) {
            for (let i = 0; i < Math.min(3, v3Seed.length); i++) {
              normalized.push(await normalizeDemoItem(v3Seed[i]));
            }
          } else {
            const defaults = [
              { Title: 'Background Noise', Label: 'Background Noise', Subtitle: '', DemoType: '', DemoData: null, Icon: '' },
              { Title: 'Filler Words', Label: 'Filler Words', Subtitle: '', DemoType: '', DemoData: null, Icon: '' },
              { Title: 'Transcription & Summary', Label: 'Transcription & Summary', Subtitle: '', DemoType: '', DemoData: null, Icon: '' },
            ];
            for (const it of defaults) normalized.push(await normalizeDemoItem(it));
          }
          // Always keep only 3 in the demo list
          const finalThree = normalized.slice(0, 3);
          nextSections.push({ ...sec, demo: finalThree });
          changed = true;
          continue;
        }
        nextSections.push(sec);
      }
      if (changed) {
        await strapi.entityService.update('api::page.page', page.id, { data: { contentSections: nextSections } });
      }
    }
  } catch (e) {
    strapi.log.warn(`Demo section seed pass skipped: ${e.message}`);
  }

  // 2) Articles from CSV - Always run this
  try {
    const existingCount = await strapi.entityService.count('api::article.article');
    console.log(`📊 Articles existing count: ${existingCount}`);

    // Force create articles for debugging
    console.log('🚀 Creating articles from CSV file (forced)...');

    try {

      // Read CSV file
      const fs = require('fs');
      const path = require('path');
      const csvPath = path.join(__dirname, '..', 'cleanvoice_complete_blog_cleaned.csv');

      const csvContent = fs.readFileSync(csvPath, 'utf8');
      const lines = csvContent.split('\n').filter(Boolean).slice(1); // Skip header

      console.log(`📊 Found ${lines.length} articles in CSV`);

      // Get admin user
      const adminUsers = await strapi.entityService.findMany('admin::user', { limit: 1 });
      const adminUser = adminUsers[0];
      if (!adminUser) {
        throw new Error('No admin user found');
      }

      console.log(`Using admin user ID: ${adminUser.id}`);

      let createdCount = 0;
      const now = new Date().toISOString();

      for (const line of lines) {
        // Handle CSV parsing with quoted fields that contain commas
        const parts = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];

          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            parts.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        parts.push(current.trim());

        // Clean up quoted values
        const [title, slug, image] = parts.map(s => s.replace(/^"|"$/g, ''));

        if (!title || !slug) continue;

        try {
          // Find or create image file if it exists
          let imageId = null;
          if (image && image.startsWith('/uploads/')) {
            const filename = image.substring(9); // Remove '/uploads/' prefix

            // Check if file already exists in media library
            const existingFiles = await strapi.entityService.findMany('plugin::upload.file', {
              filters: { name: filename },
              limit: 1
            });

            if (existingFiles.length > 0) {
              imageId = existingFiles[0].id;
            } else {
              // Try to find the actual file in the uploads directory
              const fs = require('fs');
              const path = require('path');
              const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
              const filePath = path.join(uploadsDir, filename);

              if (fs.existsSync(filePath)) {
                // Read file and create media entry
                const fileBuffer = fs.readFileSync(filePath);
                const fileStats = fs.statSync(filePath);

                const uploadedFile = await strapi.entityService.create('plugin::upload.file', {
                  data: {
                    name: filename,
                    alternativeText: title,
                    caption: '',
                    width: null,
                    height: null,
                    formats: null,
                    hash: '',
                    ext: path.extname(filename),
                    mime: 'image/' + path.extname(filename).substring(1),
                    size: fileStats.size,
                    url: image,
                    provider: 'local',
                    related: []
                  }
                });

                imageId = uploadedFile.id;
                console.log(`✅ Created image: ${filename} (ID: ${imageId})`);
              } else {
                console.log(`⚠️  Image file not found: ${filePath}`);
              }
            }
          }

          const articleData = {
            document_id: `article-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            locale: 'en',
            title: title,
            slug: slug,
            description: `Description for ${title}`,
            content: `<p>Content for ${title}</p>`,
            toc: false,
            created_at: now,
            updated_at: now,
            published_at: now,
            created_by_id: adminUser.id,
            updated_by_id: adminUser.id,
            ...(imageId ? { image: imageId } : {})
          };

          const article = await strapi.entityService.create('api::article.article', {
            data: articleData
          });

          console.log(`✅ Created article: ${article.title} (ID: ${article.id})`);
          createdCount++;

        } catch (error) {
          console.error(`❌ Error creating article "${title}":`, error.message);
        }
      }

      // Verify final count
      const finalArticles = await strapi.entityService.findMany('api::article.article', {
        fields: ['id', 'title', 'slug'],
        limit: 1000
      });

      console.log(`\n🎉 SUCCESS: Created ${createdCount} articles total`);
      console.log(`📊 Verification: Found ${finalArticles.length} articles in Strapi content manager`);

      strapi.log.info(`Created ${createdCount} articles from CSV`);
    } catch (e) {
      strapi.log.warn(`Articles creation skipped: ${e.message}`);
    }
  } catch (e) {
    strapi.log.warn(`Articles section skipped: ${e.message}`);
  }

  // 3) Update articles with content from v3 SQL dump
  try {
    console.log('🚀 Starting article content update from SQL dump...');

    // Import the update function
    const updateArticlesFromSQL = require('../scripts/update-articles-from-sql.js');

    // Run the update
    await updateArticlesFromSQL({ strapi });

    console.log('✅ Article content update completed');
  } catch (e) {
    strapi.log.warn(`Article content update skipped: ${e.message}`);
  }

  // 4) Fix escaped content in articles
  try {
    console.log('🔧 Starting article content fix...');

    // Import the fix function
    const fixArticleContent = require('../scripts/fix-article-content.js');

    // Run the fix
    await fixArticleContent({ strapi });

    console.log('✅ Article content fix completed');
  } catch (e) {
    strapi.log.warn(`Article content fix skipped: ${e.message}`);
  }

  // 5) Check article content to verify import
  try {
    console.log('🔍 Checking article content...');

    // Import the check function
    const checkArticleContent = require('../scripts/check-article-content.js');

    // Run the check
    await checkArticleContent({ strapi });

    console.log('✅ Article content check completed');
  } catch (e) {
    strapi.log.warn(`Article content check skipped: ${e.message}`);
  }

  // Import v3 content (categories, articles, podcast titles) if enabled
  try {
    if (process.env.IMPORT_V3_CONTENT === 'true') {
      const axios = require('axios');
      const baseUrl = process.env.V3_BASE_URL || 'https://content.cleanvoice.ai';
      const v3Token = process.env.V3_API_TOKEN || '';
      const headers = v3Token ? { Authorization: `Bearer ${v3Token}` } : {};

      async function fetchAll(pathname) {
        const url = `${baseUrl.replace(/\/$/, '')}/${pathname.replace(/^\//, '')}`;
        const withLimit = url.includes('?') ? `${url}&_limit=-1` : `${url}?_limit=-1`;
        const res = await axios.get(withLimit, { headers, validateStatus: () => true });
        if (res.status >= 200 && res.status < 300) return Array.isArray(res.data) ? res.data : [];
        strapi.log.warn(`v3 fetch failed ${withLimit} → ${res.status}`);
        return [];
      }

      async function fetchOne(pathname) {
        const url = `${baseUrl.replace(/\/$/, '')}/${pathname.replace(/^\//, '')}`;
        const res = await axios.get(url, { headers, validateStatus: () => true });
        if (res.status >= 200 && res.status < 300) {
          if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) return res.data;
          if (Array.isArray(res.data) && res.data[0] && typeof res.data[0] === 'object') return res.data[0];
          return null;
        }
        strapi.log.warn(`v3 fetchOne failed ${url} → ${res.status}`);
        return null;
      }

      async function getAdminJwt() {
        try {
          if (process.env.V3_ADMIN_JWT) return process.env.V3_ADMIN_JWT;
          const email = process.env.V3_ADMIN_EMAIL;
          const password = process.env.V3_ADMIN_PASSWORD;
          if (!email || !password) return null;
          const url = `${baseUrl.replace(/\/$/, '')}/admin/login`;
          const res = await axios.post(url, { email, password }, { validateStatus: () => true });
          if (res.status >= 200 && res.status < 300 && res.data && res.data.jwt) return res.data.jwt;
          strapi.log.warn(`v3 admin login failed ${res.status}`);
          return null;
        } catch (e) {
          strapi.log.warn(`v3 admin login error: ${e.message}`);
          return null;
        }
      }

      async function fetchCM(pathname) {
        const jwt = await getAdminJwt();
        if (!jwt) return null;
        const authHeaders = { Authorization: `Bearer ${jwt}` };
        const url = `${baseUrl.replace(/\/$/, '')}/${pathname.replace(/^\//, '')}`;
        const res = await axios.get(url, { headers: authHeaders, validateStatus: () => true });
        if (res.status >= 200 && res.status < 300) return res.data || null;
        return null;
      }

      function getString(obj, keys, def = '') {
        for (const k of keys) {
          const v = obj && obj[k];
          if (typeof v === 'string' && v.trim()) return v.trim();
        }
        return def;
      }

      function getObject(obj, keys) {
        for (const k of keys) {
          const v = obj && obj[k];
          if (v && typeof v === 'object' && !Array.isArray(v)) return v;
        }
        return null;
      }

      function getByPath(obj, dotPath) {
        try {
          if (!obj || !dotPath) return undefined;
          const parts = String(dotPath).split('.').filter(Boolean);
          let cur = obj;
          for (const p of parts) {
            cur = cur?.[p];
            if (cur === undefined || cur === null) return undefined;
          }
          return cur;
        } catch (_) {
          return undefined;
        }
      }

      function extractGlossaryEntries(source) {
        try {
          const titleKeys = ['Title', 'title', 'name', 'Name', 'term', 'Term', 'word', 'Word'];
          const descKeys = ['Description', 'description', 'content', 'Content', 'text', 'Text', 'definition', 'Definition', 'meaning', 'Meaning', 'body', 'Body', 'desc', 'Desc'];

          function pickFields(obj) {
            if (!obj || typeof obj !== 'object') return null;
            // Support nested holders like fields/attributes
            const holders = [obj, obj.fields || null, obj.attributes || null, obj.data && obj.data.attributes ? obj.data.attributes : null];
            let Title = '';
            let Description = '';
            let Metadata = null;
            for (const h of holders) {
              if (!h || typeof h !== 'object') continue;
              if (!Title) Title = getString(h, titleKeys);
              if (!Description) Description = getString(h, descKeys);
              if (!Metadata) Metadata = getObject(h, ['Metadata', 'metadata', 'meta', 'Meta']);
              if (!Metadata) {
                const raw = h && (h.Metadata || h.metadata || h.meta || h.Meta);
                if (typeof raw === 'string') {
                  try { Metadata = JSON.parse(raw); } catch (_) { /* ignore */ }
                }
              }
            }
            if (!Title && !Description && !Metadata) return null;
            const out = {};
            if (Title) out.Title = Title;
            if (Description) out.Description = Description;
            if (Metadata) out.Metadata = Metadata;
            return Object.keys(out).length ? out : null;
          }

          function isItemLike(obj) {
            if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
            const picked = pickFields(obj);
            return !!picked;
          }

          const candidateArrays = [];
          function walk(node) {
            if (!node) return;
            if (Array.isArray(node)) {
              const objs = node.filter((x) => x && typeof x === 'object' && !Array.isArray(x));
              if (objs.length) {
                const likeCount = objs.reduce((acc, x) => acc + (isItemLike(x) ? 1 : 0), 0);
                const ratio = likeCount / objs.length;
                candidateArrays.push({ arr: objs, likeCount, total: objs.length, ratio });
              }
              return;
            }
            if (node && typeof node === 'object') {
              for (const k of Object.keys(node)) walk(node[k]);
            }
          }

          walk(source);
          // Explicit common paths first
          const directArrays = [];
          const tryPaths = [
            ['Glossary'],
            ['glossary'],
            ['data', 'attributes', 'Glossary'],
            ['data', 'attributes', 'glossary'],
            ['attributes', 'Glossary'],
            ['attributes', 'glossary'],
            ['fields', 'Glossary'],
            ['fields', 'glossary']
          ];
          for (const path of tryPaths) {
            let cur = source;
            for (const seg of path) cur = cur && typeof cur === 'object' ? cur[seg] : undefined;
            if (Array.isArray(cur) && cur.length) directArrays.push(cur);
          }
          for (const arr of directArrays) {
            const objs = arr.filter((x) => x && typeof x === 'object' && !Array.isArray(x));
            if (objs.length) {
              const likeCount = objs.reduce((acc, x) => acc + (isItemLike(x) ? 1 : 0), 0);
              const ratio = likeCount / objs.length;
              candidateArrays.push({ arr: objs, likeCount, total: objs.length, ratio });
            }
          }
          if (!candidateArrays.length) return [];
          // Prefer the largest array with high ratio of item-like objects
          candidateArrays.sort((a, b) => (b.ratio - a.ratio) || (b.total - a.total));
          const picked = candidateArrays[0].arr;
          const out = [];
          for (const item of picked) {
            const fields = pickFields(item);
            if (fields && fields.Title) out.push(fields);
          }
          return out;
        } catch (_) {
          return [];
        }
      }

      // 1) Categories
      try {
        const existingCount = await strapi.entityService.count('api::category.category');
        if (existingCount === 0) {
          const v3CategoriesEndpoint = process.env.V3_ENDPOINT_CATEGORIES || 'categories';
          const v3Categories = await fetchAll(v3CategoriesEndpoint);
          for (const c of v3Categories) {
            const name = getString(c, ['name', 'Name', 'title', 'Title']);
            if (!name) continue;
            // Avoid duplicates by name
            const dup = await strapi.entityService.findMany('api::category.category', { filters: { name }, limit: 1 });
            if (dup && dup[0]) continue;
            await strapi.entityService.create('api::category.category', { data: { name } });
          }
          strapi.log.info(`Imported ${v3Categories.length} v3 categories`);
        }
      } catch (e) {
        strapi.log.warn(`v3 categories import skipped: ${e.message}`);
      }

      // Build category name → id map
      const allCats = await strapi.entityService.findMany('api::category.category', { fields: ['id', 'name'], limit: 1000 });
      const catNameToId = {};
      for (const c of allCats) catNameToId[String(c.name).trim().toLowerCase()] = c.id;

      // 2) Articles from CSV
      try {
        const existingCount = await strapi.entityService.count('api::article.article');
        console.log(`📊 Articles existing count: ${existingCount}`);

        // Force create articles for debugging
        console.log('🚀 Creating articles from CSV file (forced)...');

        try {

        // Read CSV file
        const fs = require('fs');
        const path = require('path');
        const csvPath = path.join(__dirname, '..', 'cleanvoice_complete_blog_cleaned.csv');

        const csvContent = fs.readFileSync(csvPath, 'utf8');
        const lines = csvContent.split('\n').filter(Boolean).slice(1); // Skip header

        console.log(`📊 Found ${lines.length} articles in CSV`);

        // Get admin user
        const adminUsers = await strapi.entityService.findMany('admin::user', { limit: 1 });
        const adminUser = adminUsers[0];
        if (!adminUser) {
          throw new Error('No admin user found');
        }

        console.log(`Using admin user ID: ${adminUser.id}`);

        let createdCount = 0;
        const now = new Date().toISOString();

        for (const line of lines) {
          const [title, slug, image] = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));

          if (!title || !slug) continue;

          try {
            const articleData = {
              document_id: `article-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              locale: 'en',
              title: title,
              slug: slug,
              description: `Description for ${title}`,
              content: `<p>Content for ${title}</p>`,
              toc: false,
              created_at: now,
              updated_at: now,
              published_at: now,
              created_by_id: adminUser.id,
              updated_by_id: adminUser.id
            };

            const article = await strapi.entityService.create('api::article.article', {
              data: articleData
            });

            console.log(`✅ Created article: ${article.title} (ID: ${article.id})`);
            createdCount++;

          } catch (error) {
            console.error(`❌ Error creating article "${title}":`, error.message);
          }
        }

        // Verify final count
        const finalArticles = await strapi.entityService.findMany('api::article.article', {
          fields: ['id', 'title', 'slug'],
          limit: 1000
        });

          console.log(`\n🎉 SUCCESS: Created ${createdCount} articles total`);
          console.log(`📊 Verification: Found ${finalArticles.length} articles in Strapi content manager`);

          strapi.log.info(`Created ${createdCount} articles from CSV`);
        } catch (e) {
          strapi.log.warn(`Articles creation skipped: ${e.message}`);
        }
      } catch (e) {
        strapi.log.warn(`Articles section skipped: ${e.message}`);
      }

      // 3) Podcast titles → api::podcast.podcast (Name)
      try {
        const existingCount = await strapi.entityService.count('api::podcast.podcast');
        const v3PodTitlesEndpoint = process.env.V3_ENDPOINT_PODCAST_TITLES || 'podcast-titles';
        const v3PodTitles = await fetchAll(v3PodTitlesEndpoint);
        let imported = 0;
        for (const p of v3PodTitles) {
          const name = getString(p, ['title', 'Title', 'name', 'Name']);
          if (!name) continue;
          // Avoid duplicates by Name
          const dup = await strapi.entityService.findMany('api::podcast.podcast', { filters: { Name: name }, limit: 1 });
          if (dup && dup[0]) continue;
          await strapi.entityService.create('api::podcast.podcast', { data: { Name: name } });
          imported++;
        }
        if (imported > 0) {
          strapi.log.info(`Imported ${imported} v3 podcast titles`);
        } else if (existingCount > 0) {
          strapi.log.info('Skipped podcast titles import: existing podcasts present');
        }
      } catch (e) {
        strapi.log.warn(`v3 podcast titles import skipped: ${e.message}`);
      }

      // 4) Glossary (single type)
      try {
        const v3GlossaryEndpoint = process.env.V3_ENDPOINT_GLOSSARY || 'glossary';
        let g = await fetchOne(v3GlossaryEndpoint);
        // Try common alternative endpoints if empty
        if (!g) g = await fetchOne(`${v3GlossaryEndpoint}?_limit=-1&_populate=*&_publicationState=preview`);
        if (!g) g = await fetchOne('glossaries');
        if (!g) g = await fetchOne('glossary?_limit=-1');
        // As a last resort, try content-manager secured endpoints
        if (!g) {
          const cmCandidates = [
            'content-manager/single-types/application::glossary.glossary',
            'content-manager/single-types/glossary',
            'content-manager/single-types?uid=application::glossary.glossary'
          ];
          for (const p of cmCandidates) {
            try {
              const data = await fetchCM(p);
              if (data && typeof data === 'object') { g = data.data || data; break; }
            } catch (_) {}
          }
        }
        if (g && typeof g === 'object') {
          const title = getString(g, ['Title', 'title', 'name', 'Name']);
          const description = getString(g, ['Description', 'description', 'content', 'Content', 'body', 'Body']);
          // Glossary-level metadata
          let meta = getObject(g, ['Metadata', 'metadata', 'meta', 'Meta']);
          if (!meta) {
            const rawMeta = g && (g.Metadata || g.metadata || g.meta || g.Meta);
            if (typeof rawMeta === 'string') {
              try { meta = JSON.parse(rawMeta); } catch (_) { meta = null; }
            }
          }
          // Glossary entries (repeatable component)
          let entries;
          const pathOverride = process.env.V3_GLOSSARY_ITEMS_PATH;
          if (pathOverride) {
            const val = getByPath(g, pathOverride);
            if (Array.isArray(val)) entries = val;
          }
          if (!entries) entries = extractGlossaryEntries(g);
          if (!entries || entries.length === 0) {
            // Try DB fallback
            const dbEntries = await loadV3GlossaryFromDb();
            if (dbEntries && dbEntries.length) entries = dbEntries;
          }
          // Normalize entries to include keys expected by types
          /** @type {{ Title: string; Description: string; Metadata: any }[]} */
          const normalizedEntries = Array.isArray(entries)
            ? entries.map((e) => ({ Title: String(e?.Title || '').trim(), Description: String(e?.Description || '').trim(), Metadata: (e && e.Metadata) ? e.Metadata : {} }))
            : [];
          const existing = await strapi.entityService.findMany('api::glossary.glossary', { populate: { Entries: true }, limit: 1 });
          const data = {};
          if (title) data.Title = title;
          if (description) data.Description = description;
          if (meta) data.Metadata = meta;
          if (normalizedEntries && normalizedEntries.length) data.Entries = normalizedEntries;
          // Seed SEO using Title/Description if empty
          data.SEO = {
            metaTitle: title || 'Glossary',
            metaDescription: description || ''
          };
          if (existing && existing[0]) {
            await strapi.entityService.update('api::glossary.glossary', existing[0].id, { data });
            strapi.log.info('Updated glossary single type from v3');
          } else {
            await strapi.entityService.create('api::glossary.glossary', { data });
            strapi.log.info('Created glossary single type from v3');
          }
        } else {
          strapi.log.warn('v3 glossary not found or invalid response');
        }
      } catch (e) {
        strapi.log.warn(`v3 glossary import skipped: ${e.message}`);
      }
    }
  } catch (e) {
    strapi.log.warn(`v3 content import wrapper failed: ${e.message}`);
  }
};
