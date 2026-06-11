/**
 * Sube pestañas simplificadas (solo texto e imágenes).
 *
 * npm run sheets:push -- <spreadsheetId>
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { google } from 'googleapis';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const importDir = path.resolve(__dirname, '../data/sheets-import');
const defaultsPath = path.resolve(__dirname, '../src/lib/googleSheets/defaults.ts');

const TAB_NAMES = [
  'settings',
  'home',
  'releases',
  'streaming',
  'broadcasts',
  'playlists',
  'press',
  'videos',
  'live',
  'contact',
];

const CREDENTIAL_CANDIDATES = [
  process.env.GOOGLE_APPLICATION_CREDENTIALS,
  process.env.SERVICE_ACCOUNT_PATH,
  path.resolve(__dirname, '../../web-cora-ac37b5dec5b1.json'),
  path.resolve(__dirname, '../.tmp/service-account.json'),
].filter(Boolean);

const spreadsheetId =
  process.argv.slice(2).find((a) => !a.startsWith('--'))?.trim() ||
  (fs.existsSync(path.join(importDir, 'SPREADSHEET_ID.txt'))
    ? fs.readFileSync(path.join(importDir, 'SPREADSHEET_ID.txt'), 'utf8').split('\n')[0].trim()
    : '') ||
  '';

function parseCsv(text) {
  const rows = [];
  for (const line of text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')) {
    if (!line.trim()) continue;
    const row = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQuotes = !inQuotes;
        continue;
      }
      if (ch === ',' && !inQuotes) {
        row.push(cur);
        cur = '';
        continue;
      }
      cur += ch;
    }
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

function loadSheetCsv(name) {
  return parseCsv(fs.readFileSync(path.join(importDir, `${name}.csv`), 'utf8'));
}

async function main() {
  if (!spreadsheetId) {
    console.error('Uso: npm run sheets:push -- <SPREADSHEET_ID>');
    process.exit(1);
  }

  if (!fs.existsSync(importDir)) {
    console.error('Faltan CSV. Ejecuta: npm run sheets:csv');
    process.exit(1);
  }

  const credPath = CREDENTIAL_CANDIDATES.find((p) => fs.existsSync(p));
  if (!credPath) {
    console.error('No service account. Importa manualmente los CSV de data/sheets-import/');
    process.exit(1);
  }

  const creds = JSON.parse(fs.readFileSync(credPath, 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

  let meta;
  try {
    meta = await sheets.spreadsheets.get({ spreadsheetId });
  } catch {
    console.error(
      'Sin acceso. Comparte la hoja con sheets-writer@web-cora.iam.gserviceaccount.com (Editor).',
    );
    process.exit(1);
  }

  const requests = [];
  const existing = new Set((meta.data.sheets || []).map((s) => s.properties?.title));

  for (const tab of TAB_NAMES) {
    if (!existing.has(tab)) {
      requests.push({ addSheet: { properties: { title: tab } } });
    }
  }

  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } });
  }

  for (const tab of TAB_NAMES) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tab}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: loadSheetCsv(tab) },
    });
    console.log('Updated', tab);
  }

  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  fs.writeFileSync(
    defaultsPath,
    `/** Spreadsheet ID — override with GOOGLE_SHEETS_SPREADSHEET_ID. */\nexport const DEFAULT_GOOGLE_SHEETS_SPREADSHEET_ID = '${spreadsheetId}';\n\nexport const DEFAULT_GOOGLE_SHEETS_API_KEY = 'AIzaSyBHQgbSv588A3qr-Kzeo6YrZ9TbVNlrSkc';\n\nexport const DEFAULT_GOOGLE_SHEETS_URL = '${url}';\n`,
  );
  fs.writeFileSync(path.join(importDir, 'SPREADSHEET_ID.txt'), `${spreadsheetId}\n${url}\n`);

  console.log(url);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
