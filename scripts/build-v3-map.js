/*
  Build a mapping of feature slugs → v3 image URLs by reading the v3 SQLite DB.
  Writes config/v3-image-map.json inside the current Strapi project.
*/
const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const V3_DB_PATH = process.env.V3_DB_PATH || '/app/.tmp/data.db';

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function buildMapFromV3() {
  const sql = 'SELECT image_grid FROM components_sections_grid_image;';
  const raw = cp.execSync(`sqlite3 "${V3_DB_PATH}" "${sql}"`, { encoding: 'utf8' });
  const lines = raw.split(/\n+/).filter(Boolean);
  const slugToUrl = {};

  for (const line of lines) {
    try {
      const arr = JSON.parse(line);
      for (const item of arr) {
        const linkUrl = (item && item.Link && item.Link.url) || '';
        const slugFromLink = linkUrl.split('/').filter(Boolean).pop();
        const slug = slugFromLink || slugify(item && item.Text);
        const media = item && item.Media;
        const mediaUrl = media && (media.url || (media.data && media.data.attributes && media.data.attributes.url));
        if (slug && mediaUrl && !slugToUrl[slug]) {
          slugToUrl[slug] = mediaUrl;
        }
      }
    } catch (e) {
      // ignore unparsable rows
    }
  }

  const dest = path.join(__dirname, '..', 'config', 'v3-image-map.json');
  fs.writeFileSync(dest, JSON.stringify(slugToUrl, null, 2));
  console.log('Wrote', Object.keys(slugToUrl).length, 'entries to', dest);
}

buildMapFromV3();


