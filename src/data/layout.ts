import type { NavLink, StreamingPlatform } from './site';

/** Menú fijo — no editable en Sheets. */
export const NAV_LINKS: NavLink[] = [
  { href: '/', label: 'music' },
  { href: '/live', label: 'live' },
  { href: '/contact', label: 'contact' },
];

/** Plataformas de streaming reconocidas por el componente de iconos. */
export const STREAMING_PLATFORMS: StreamingPlatform[] = [
  'spotify',
  'bandcamp',
  'youtube',
  'apple',
  'tidal',
];

export function isStreamingPlatform(value: string): value is StreamingPlatform {
  return (STREAMING_PLATFORMS as string[]).includes(value);
}
