/**
 * CSV simplificado: solo texto e imágenes editables.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fallbackSite } from '../src/data/fallback.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '../data/sheets-import');

function escapeCsv(value: unknown) {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(headers: string[], rows: Record<string, string>[]) {
  const lines = [headers.map(escapeCsv).join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsv(row[h])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

const settingsRows = [
  { field: 'name', value: fallbackSite.siteMeta.name },
  { field: 'description', value: fallbackSite.siteMeta.description },
];

const homeRows = [
  { tile: 'hero', image: fallbackSite.heroImage, alt: fallbackSite.heroAlt },
];

const releasesRows = fallbackSite.releases.map((release) => ({
  title: release.title,
  image: release.image,
}));

const streamingRows = fallbackSite.streaming.map((link) => ({
  platform: link.platform,
  label: link.label,
  url: link.href,
}));

const broadcastsRows = fallbackSite.broadcasts.map((item) => ({
  label: item.label,
  url: item.url,
}));

const playlistsRows = fallbackSite.playlists.map((item) => ({
  label: item.label,
  url: item.url,
}));

const pressRows = fallbackSite.press.map((item) => ({
  label: item.label,
  url: item.url,
}));

const videosRows = fallbackSite.videos.map((video) => ({
  embed_url: video.embedUrl,
}));

const liveRows = fallbackSite.liveShows.map((show) => ({
  date: show.date,
  text: show.text,
}));

const contactRows = fallbackSite.contactEmails.map((email) => ({ email }));

const files: Record<string, string> = {
  settings: toCsv(['field', 'value'], settingsRows),
  home: toCsv(['tile', 'image', 'alt'], homeRows),
  releases: toCsv(['title', 'image'], releasesRows),
  streaming: toCsv(['platform', 'label', 'url'], streamingRows),
  broadcasts: toCsv(['label', 'url'], broadcastsRows),
  playlists: toCsv(['label', 'url'], playlistsRows),
  press: toCsv(['label', 'url'], pressRows),
  videos: toCsv(['embed_url'], videosRows),
  live: toCsv(['date', 'text'], liveRows),
  contact: toCsv(['email'], contactRows),
};

await fs.mkdir(outDir, { recursive: true });

for (const [name, content] of Object.entries(files)) {
  await fs.writeFile(path.join(outDir, `${name}.csv`), content);
}

console.log('Wrote', Object.keys(files).join(', '), '→', outDir);
