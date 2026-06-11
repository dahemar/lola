import { defineMiddleware } from 'astro:middleware';
import { loadSiteData, type LoadedSiteData } from './lib/cms/loadSiteData';

declare module 'astro' {
  interface Locals {
    site: LoadedSiteData;
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.site = await loadSiteData();
  return next();
});
