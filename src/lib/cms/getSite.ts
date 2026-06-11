import type { APIContext } from 'astro';
import { loadSiteData, type LoadedSiteData } from './loadSiteData';

export function getSiteFromLocals(locals: APIContext['locals']): LoadedSiteData | undefined {
  return locals.site;
}

export async function getSiteData(locals: APIContext['locals']): Promise<LoadedSiteData> {
  if (locals.site) return locals.site;
  return loadSiteData();
}
