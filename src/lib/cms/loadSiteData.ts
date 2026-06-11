import { fallbackSite } from '../../data/fallback';
import type { SiteContent } from '../../data/site';
import { loadCmsFromSheets, loadFromCache } from '../googleSheets/googleSheetsManager';

export type SiteDataSource = 'sheets' | 'cache' | 'fallback';

export type LoadedSiteData = SiteContent & {
  source: SiteDataSource;
};

function hasRemoteContent(data: SiteContent): boolean {
  return Boolean(
    data.releases.length ||
      data.broadcasts.length ||
      data.playlists.length ||
      data.press.length ||
      data.videos.length ||
      data.liveShows.length ||
      data.contactEmails.length ||
      data.heroImage,
  );
}

export async function loadSiteData(options?: { force?: boolean }): Promise<LoadedSiteData> {
  const remote = await loadCmsFromSheets(options);
  if (remote && hasRemoteContent(remote)) {
    return { ...remote, source: 'sheets' };
  }

  if (!options?.force && !import.meta.env.DEV) {
    const cached = await loadFromCache();
    if (cached && hasRemoteContent(cached)) {
      return { ...cached, source: 'cache' };
    }
  }

  return { ...fallbackSite, source: 'fallback' };
}
