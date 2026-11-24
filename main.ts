import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { buildRadar, type Snapshot } from './lib/radar.ts';
import { buildDossier } from './vendor/makefun-board.ts';
import './dashboard/plans.js';

function option(name: string, fallback: string): string {
  const index = process.argv.indexOf(name);
  return index < 0 ? fallback : process.argv[index + 1] ?? fallback;
}

const root = fileURLToPath(new URL('.', import.meta.url));
const input = option('--input', '/input/snapshot.json');
const output = option('--output', process.env.MAKEFUN_OUTPUT_DIR ?? '/output');
const inputFile = input.endsWith('.json') ? input : join(input, 'snapshot.json');
const snapshot = JSON.parse(readFileSync(inputFile, 'utf8')) as Snapshot;
const radar = buildRadar(snapshot);
const plan = (globalThis as typeof globalThis & {
  launchPlan: (row: (typeof radar.ranked)[number]) => { steps: { action: string; time: string; cost: string }[] };
}).launchPlan;

const rows = radar.ranked.map(row => ({
  slug: row.slug,
  name: row.name,
  rank: row.rank,
  implied_value_usd: row.value,
  farm_steps: plan(row).steps.map(step => `${step.action} Time ${step.time}. Cost ${step.cost}.`),
}));
const rankedSlugs = new Set(rows.map(row => row.slug));
if (rows.length < 100 || rows.length > 4_000 || rankedSlugs.size !== rows.length || snapshot.watchlist.some(slug => !rankedSlugs.has(slug))) {
  throw new Error('The ranked board must contain 100–4,000 unique entries and cover every watchlist slug.');
}
for (const row of rows) {
  if (!Number.isSafeInteger(row.implied_value_usd) || row.implied_value_usd < 1 || row.implied_value_usd > 100_000_000_000_000 ||
      row.farm_steps.some(step => step.length < 20 || step.length > 600)) {
    throw new Error(`Invalid board row for ${row.slug}`);
  }
}

mkdirSync(output, { recursive: true });
const dashboard = join(output, 'dashboard');
cpSync(join(root, 'dashboard'), dashboard, { recursive: true });
const { ranked, comparables, ...metadata } = radar;
const fields = (Object.keys(ranked[0]) as (keyof (typeof ranked)[number])[])
  .filter(field => field !== 'rank' && field !== 'issuedAsset' && field !== 'value');
const categories = [...new Set([...ranked, ...comparables].map(row => row.category))];
const chains = [...new Set(ranked.flatMap(row => row.chains))];
const routes = [...new Set(ranked.map(row => row.route))];
const categoryIds = new Map(categories.map((name, index) => [name, index]));
const chainIds = new Map(chains.map((name, index) => [name, index]));
const issuedAssets = Object.fromEntries(ranked.filter(row => row.issuedAsset).map(row => [row.slug, row.issuedAsset]));
const records = ranked.map(row => {
  const packed = {
    ...row, category: categoryIds.get(row.category), chains: row.chains.map(chain => chainIds.get(chain)),
    route: routes.indexOf(row.route), status: row.status === 'watchlist' ? 1 : 0, review: row.review ? 1 : 0,
  };
  return fields.map(field => packed[field]);
});
const trades = comparables.map(({ name, category, symbol, tvl, mcap }) =>
  [name, categoryIds.get(category), symbol, Math.round(tvl / 10_000), mcap === null ? null : Math.round(mcap / 10_000)]);
const archive = gzipSync(JSON.stringify({ ...metadata, categories, chains, routes, issuedAssets, fields, records, trades }), { level: 9 });
writeFileSync(join(dashboard, 'z-data.js'), `globalThis.launchArchive = "${archive.toString('base64')}";\n`);
writeFileSync(join(output, 'board.json'), JSON.stringify({ as_of: snapshot.as_of, rows }) + '\n');

const screenshots = join(root, 'screenshots');
if (!process.argv.includes('--preview')) {
  if (!existsSync(screenshots) || readdirSync(screenshots).filter(name => /\.(png|jpe?g)$/i.test(name)).length !== 3) {
    throw new Error('Capture three screenshots before a full build.');
  }
  cpSync(screenshots, join(output, 'screenshots'), { recursive: true });
  writeFileSync(join(output, 'dossier.json'), buildDossier(output, { text_max_bytes: 65_536 }));
}

console.log(`Ranked ${rows.length} protocols from ${radar.scanned} records, including all ${radar.watch} watchlist slugs.`);
