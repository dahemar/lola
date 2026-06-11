import {
  DEFAULT_GOOGLE_SHEETS_API_KEY,
  DEFAULT_GOOGLE_SHEETS_SPREADSHEET_ID,
} from './defaults';

const trim = (value: string | undefined) => String(value ?? '').trim();

/** Solo pestañas con texto e imágenes editables por el cliente. */
export const SHEET_TABS = {
  settings: 'settings',
  home: 'home',
  releases: 'releases',
  streaming: 'streaming',
  broadcasts: 'broadcasts',
  playlists: 'playlists',
  press: 'press',
  videos: 'videos',
  live: 'live',
  contact: 'contact',
} as const;

export const googleSheetsConfig = {
  spreadsheetId:
    trim(import.meta.env.GOOGLE_SHEETS_SPREADSHEET_ID ?? process.env.GOOGLE_SHEETS_SPREADSHEET_ID) ||
    DEFAULT_GOOGLE_SHEETS_SPREADSHEET_ID,
  apiKey:
    trim(import.meta.env.GOOGLE_SHEETS_API_KEY ?? process.env.GOOGLE_SHEETS_API_KEY) ||
    DEFAULT_GOOGLE_SHEETS_API_KEY,
  tabs: SHEET_TABS,
};

export function isGoogleSheetsConfigured(): boolean {
  return Boolean(googleSheetsConfig.spreadsheetId && googleSheetsConfig.apiKey);
}
