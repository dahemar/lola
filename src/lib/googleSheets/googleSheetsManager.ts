import fs from 'node:fs/promises';
import path from 'node:path';
import type { SiteContent } from '../../data/site';
import { googleSheetsConfig, isGoogleSheetsConfigured, SHEET_TABS } from './config';
import { parseSiteFromSheets, type SheetRowsBundle } from './parseSiteData';

const CACHE_PATH = path.resolve(process.cwd(), '.cache/lola-cms.json');
const CACHE_KEY = 'siteCms';
const memoryCache = new Map<string, SiteContent>();

export function clearMemoryCache(): void {
  memoryCache.delete(CACHE_KEY);
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      out.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  out.push(current.trim());
  return out;
}

function parseCsvText(csvContent: string): string[][] {
  return (csvContent || '')
    .split('\n')
    .map((line) => line.replace(/\r$/, ''))
    .filter((line) => line.trim().length > 0)
    .map((line) => parseCsvLine(line));
}

async function fetchGvizSheetAsRows(sheetName: string, timeoutMs = 12000): Promise<string[][]> {
  const { spreadsheetId } = googleSheetsConfig;
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return [];
    const text = await response.text();
    if (text.trimStart().startsWith('<')) return [];
    return parseCsvText(text);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

async function batchFetchSheetValues(ranges: string[], timeoutMs = 12000): Promise<string[][][]> {
  const { spreadsheetId, apiKey } = googleSheetsConfig;
  const qs = ranges.map((range) => `ranges=${encodeURIComponent(range)}`).join('&');
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${qs}&key=${apiKey}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      console.warn(`[googleSheets] batchGet returned ${response.status}`);
      return ranges.map(() => []);
    }
    const data = await response.json();
    const valueRanges = Array.isArray(data?.valueRanges) ? data.valueRanges : [];
    return ranges.map((_, index) => {
      const values = valueRanges[index]?.values;
      return Array.isArray(values) ? (values as string[][]) : [];
    });
  } catch (error) {
    console.warn('[googleSheets] batchGet failed', error);
    return ranges.map(() => []);
  } finally {
    clearTimeout(timeout);
  }
}

async function loadSheetRows(sheetName: string, apiRows: string[][]): Promise<string[][]> {
  if (apiRows.length) return apiRows;
  return fetchGvizSheetAsRows(sheetName);
}

export async function loadFromCache(): Promise<SiteContent | null> {
  try {
    const raw = await fs.readFile(CACHE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as SiteContent;
    if (parsed?.releases) return parsed;
    return null;
  } catch {
    return null;
  }
}

export async function saveToCache(data: SiteContent): Promise<void> {
  await fs.mkdir(path.dirname(CACHE_PATH), { recursive: true });
  await fs.writeFile(CACHE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function fetchFromGoogleSheets(): Promise<SiteContent | null> {
  if (!isGoogleSheetsConfigured()) {
    return null;
  }

  const useMemoryCache = !import.meta.env.DEV;
  if (useMemoryCache && memoryCache.has(CACHE_KEY)) {
    return memoryCache.get(CACHE_KEY) ?? null;
  }

  const tabNames = Object.values(SHEET_TABS);
  const [
    settingsRows,
    homeRows,
    releasesRows,
    streamingRows,
    broadcastsRows,
    playlistsRows,
    pressRows,
    videosRows,
    liveRows,
    contactRows,
  ] = await batchFetchSheetValues(tabNames);

  const bundle: SheetRowsBundle = {
    settings: await loadSheetRows(SHEET_TABS.settings, settingsRows),
    home: await loadSheetRows(SHEET_TABS.home, homeRows),
    releases: await loadSheetRows(SHEET_TABS.releases, releasesRows),
    streaming: await loadSheetRows(SHEET_TABS.streaming, streamingRows),
    broadcasts: await loadSheetRows(SHEET_TABS.broadcasts, broadcastsRows),
    playlists: await loadSheetRows(SHEET_TABS.playlists, playlistsRows),
    press: await loadSheetRows(SHEET_TABS.press, pressRows),
    videos: await loadSheetRows(SHEET_TABS.videos, videosRows),
    live: await loadSheetRows(SHEET_TABS.live, liveRows),
    contact: await loadSheetRows(SHEET_TABS.contact, contactRows),
  };

  const parsed = parseSiteFromSheets(bundle);
  if (!parsed) return null;

  if (useMemoryCache) {
    memoryCache.set(CACHE_KEY, parsed);
  }

  try {
    await saveToCache(parsed);
  } catch (error) {
    console.warn('[googleSheets] saveToCache failed', error);
  }

  return parsed;
}

export async function loadCmsFromSheets(options?: { force?: boolean }): Promise<SiteContent | null> {
  if (options?.force) clearMemoryCache();
  if (!isGoogleSheetsConfigured()) return null;

  try {
    return await fetchFromGoogleSheets();
  } catch (error) {
    console.warn('[googleSheets] fetch failed', error);
    return null;
  }
}
