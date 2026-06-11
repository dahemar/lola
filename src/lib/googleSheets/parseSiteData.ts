import { fallbackSite } from '../../data/fallback';
import { NAV_LINKS, STREAMING_PLATFORMS, isStreamingPlatform } from '../../data/layout';
import type {
  LinkItem,
  LiveShow,
  Release,
  SiteContent,
  SiteMeta,
  StreamingLink,
  VideoEmbed,
} from '../../data/site';

export type SheetRowsBundle = {
  settings: string[][];
  home: string[][];
  releases: string[][];
  streaming: string[][];
  broadcasts: string[][];
  playlists: string[][];
  press: string[][];
  videos: string[][];
  live: string[][];
  contact: string[][];
};

function rowsToObjects(rows: string[][]): Record<string, string>[] {
  if (!rows.length) return [];
  const headers = rows[0].map((h) => String(h ?? '').trim().toLowerCase());
  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (header) obj[header] = String(row[index] ?? '').trim();
    });
    return obj;
  });
}

function rowHasContent(row: Record<string, string>, fields: string[]): boolean {
  return fields.some((field) => Boolean(row[field]));
}

function parseSettingsRows(rows: string[][]): SiteMeta | null {
  const objects = rowsToObjects(rows);
  if (!objects.length) return null;

  const keyed = Object.fromEntries(
    objects.filter((row) => row.field).map((row) => [row.field, row.value ?? '']),
  );

  if (keyed.name || keyed.description) {
    return {
      name: keyed.name || fallbackSite.siteMeta.name,
      description: keyed.description || fallbackSite.siteMeta.description,
    };
  }

  return {
    name: objects[0].name || fallbackSite.siteMeta.name,
    description: objects[0].description || fallbackSite.siteMeta.description,
  };
}

function parseHomeRows(rows: string[][]): { image: string; alt: string } {
  const objects = rowsToObjects(rows);
  const hero = objects.find((row) => row.tile === 'hero') ?? objects[0];
  return {
    image: hero?.image || fallbackSite.heroImage,
    alt: hero?.alt || fallbackSite.heroAlt,
  };
}

function parseReleaseRows(rows: string[][]): Release[] {
  return rowsToObjects(rows)
    .filter((row) => rowHasContent(row, ['title', 'image']))
    .map((row) => ({
      title: row.title || 'untitled',
      image: row.image || '',
    }));
}

function parseStreamingRows(rows: string[][]): StreamingLink[] {
  const byPlatform = new Map<string, StreamingLink>();
  for (const row of rowsToObjects(rows)) {
    const platform = row.platform?.toLowerCase();
    if (!platform || !isStreamingPlatform(platform)) continue;
    byPlatform.set(platform, {
      platform,
      label: row.label || platform,
      href: row.url || row.href || '',
    });
  }

  const fromSheet = STREAMING_PLATFORMS.map((platform) => byPlatform.get(platform)).filter(
    (link): link is StreamingLink => Boolean(link?.href),
  );

  return fromSheet.length ? fromSheet : fallbackSite.streaming;
}

function parseLinkRows(rows: string[][]): LinkItem[] {
  return rowsToObjects(rows)
    .filter((row) => rowHasContent(row, ['label', 'url']))
    .map((row) => ({
      label: row.label || row.url,
      url: row.url || row.href || '',
    }));
}

function parseVideoRows(rows: string[][]): VideoEmbed[] {
  return rowsToObjects(rows)
    .map((row) => row.embed_url || row.embedurl || row.url || '')
    .filter(Boolean)
    .map((embedUrl) => ({ embedUrl }));
}

function parseLiveRows(rows: string[][]): LiveShow[] {
  return rowsToObjects(rows)
    .filter((row) => rowHasContent(row, ['date', 'text']))
    .map((row) => ({
      date: row.date,
      text: row.text,
    }));
}

function parseContactRows(rows: string[][]): string[] {
  return rowsToObjects(rows)
    .map((row) => row.email)
    .filter(Boolean);
}

export function parseSiteFromSheets(rows: SheetRowsBundle): SiteContent | null {
  const siteMeta = parseSettingsRows(rows.settings);
  const home = parseHomeRows(rows.home);
  const releases = parseReleaseRows(rows.releases);
  const streaming = parseStreamingRows(rows.streaming);
  const broadcasts = parseLinkRows(rows.broadcasts);
  const playlists = parseLinkRows(rows.playlists);
  const press = parseLinkRows(rows.press);
  const videos = parseVideoRows(rows.videos);
  const liveShows = parseLiveRows(rows.live);
  const contactEmails = parseContactRows(rows.contact);

  const hasSheetStreaming = rowsToObjects(rows.streaming).some((row) =>
    Boolean(row.platform && (row.url || row.href)),
  );

  if (
    !releases.length &&
    !broadcasts.length &&
    !playlists.length &&
    !press.length &&
    !videos.length &&
    !liveShows.length &&
    !contactEmails.length &&
    !hasSheetStreaming &&
    home.image === fallbackSite.heroImage
  ) {
    return null;
  }

  return {
    siteMeta: siteMeta ?? fallbackSite.siteMeta,
    navLinks: NAV_LINKS,
    heroImage: home.image,
    heroAlt: home.alt,
    releases: releases.length ? releases : fallbackSite.releases,
    streaming,
    broadcasts: broadcasts.length ? broadcasts : fallbackSite.broadcasts,
    playlists: playlists.length ? playlists : fallbackSite.playlists,
    press: press.length ? press : fallbackSite.press,
    videos: videos.length ? videos : fallbackSite.videos,
    liveShows: liveShows.length ? liveShows : fallbackSite.liveShows,
    contactEmails: contactEmails.length ? contactEmails : fallbackSite.contactEmails,
  };
}
