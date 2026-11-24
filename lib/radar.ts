export interface Protocol {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  listed_at: string | null;
  mcap_usd: number | null;
  gecko_id: string | null;
  symbol: string | null;
}

export interface Snapshot {
  as_of: string;
  floor_usd: number;
  protocols: Protocol[];
  watchlist: string[];
}

type Route = 'vault' | 'lending' | 'exchange' | 'derivatives' | 'prediction' | 'rwa' | 'cdp' | 'security' | 'network';

const day = 86_400_000;
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const live = (p: Protocol) => Boolean(p.symbol || p.gecko_id || p.mcap_usd);
const sector = (p: Protocol) => p.category ?? 'Unclassified';
const nonStandalone = /^(?:bridges?|canonical bridge|cross chain bridge|liquid staking|liquid restaking|staking pool|restaked btc|anchor btc|decentralized btc|stablecoin wrapper|cex)$/i;
const wrappedName = /\b(?:wrapped|staked|staking|bridged)\b|^(?:Binance|Coinbase|Bybit|Kraken|Bitget|OKX|Bitfinex|Gemini)\b|\s(?:v\d+|\d+\.\d+)$/i;
// Primary product docs identify these as issued assets. Keep required watchlist
// records and distinct governance scenarios while surfacing the evidence gap.
const issuedAssets: Record<string, string> = { usdd: 'USDD stablecoin', onre: 'ONyc receipt asset' };

function median(numbers: number[]): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function comparableMultiples(protocols: Protocol[]) {
  const groups = new Map<string, number[]>();
  const pool: number[] = [];
  for (const p of protocols) {
    if (p.mcap_usd === null || p.mcap_usd <= 0 || p.tvl_usd < 5_000_000 || nonStandalone.test(sector(p))) continue;
    const ratio = clamp(p.mcap_usd / p.tvl_usd, 0.05, 8);
    const group = groups.get(sector(p)) ?? [];
    group.push(ratio);
    groups.set(sector(p), group);
    pool.push(ratio);
  }
  const global = pool.length ? median(pool) : 0.5;
  return (name: string) => {
    const peers = groups.get(name) ?? [];
    const weight = peers.length / (peers.length + 8);
    const multiple = peers.length ? Math.exp(weight * Math.log(median(peers)) + (1 - weight) * Math.log(global)) : global;
    return { multiple, peers: peers.length };
  };
}

function routeFor(p: Protocol): Route {
  const type = sector(p).toLowerCase();
  if (/lending|collateral market/.test(type)) return 'lending';
  if (/dex|liquidity manager/.test(type)) return 'exchange';
  if (type === 'prediction market') return 'prediction';
  if (/derivatives|basis|option/.test(type)) return 'derivatives';
  if (/^rwa$|credit/.test(type)) return 'rwa';
  if (/cdp|stablecoin/.test(type)) return 'cdp';
  if (/staking|restaking|security/.test(type)) return 'security';
  if (/chain|payment|bridge/.test(type) && type !== 'onchain capital allocator') return 'network';
  return 'vault';
}

export function buildRadar(snapshot: Snapshot) {
  const watchlist = new Set(snapshot.watchlist);
  const peersFor = comparableMultiples(snapshot.protocols);
  const cutoff = Date.parse(snapshot.as_of);
  const candidates = snapshot.protocols.filter(p =>
    watchlist.has(p.slug) || (!live(p) && !nonStandalone.test(sector(p)) && !wrappedName.test(p.name)));

  const scored = candidates.map(p => {
    const age = p.listed_at ? Math.max(0, Math.floor((cutoff - Date.parse(p.listed_at)) / day)) : null;
    const ageFactor = age === null || !Number.isFinite(age) ? 0.85 : 0.75 + 0.4 * (1 - Math.exp(-age / 270));
    const growthFactor = Math.exp(clamp(p.change_7d ?? 0, -25, 25) / 100);
    const { multiple, peers } = peersFor(sector(p));
    const issuedAsset = issuedAssets[p.slug] ?? null;
    const review = Boolean(issuedAsset) || nonStandalone.test(sector(p)) || wrappedName.test(p.name) || /staking|restaking|wrapper/i.test(sector(p));
    const status = watchlist.has(p.slug) ? 'watchlist' : 'early';
    const base = Math.max(1, Math.round(p.tvl_usd * multiple * ageFactor * growthFactor));
    const coverage = (age !== null ? 1 : 0) + (p.change_7d !== null ? 1 : 0) + (peers >= 5 ? 1 : 0);
    const band = review || coverage < 2 ? 2.2 : coverage === 2 ? 1.85 : 1.5;
    return {
      slug: p.slug, name: p.name, category: sector(p), chains: p.chains, tvl: p.tvl_usd,
      growth: p.change_7d, age, ageFactor, growthFactor, multiple, peers, review, issuedAsset, status,
      value: base, band,
      route: routeFor(p),
    };
  });

  scored.sort((a, b) => b.value - a.value || (a.slug < b.slug ? -1 : 1));
  const ranked = scored.map((row, index) => ({ ...row, rank: index + 1 }));
  const traded = snapshot.protocols.filter(live);
  const comparables = traded
    .sort((a, b) => (b.mcap_usd ?? 0) - (a.mcap_usd ?? 0) || (a.slug < b.slug ? -1 : 1))
    .slice(0, 30)
    .map(p => ({ name: p.name, category: sector(p), symbol: p.symbol, tvl: p.tvl_usd, mcap: p.mcap_usd }));

  return {
    asOf: snapshot.as_of, floor: snapshot.floor_usd, scanned: snapshot.protocols.length,
    watch: watchlist.size, watchCovered: ranked.filter(row => row.status === 'watchlist').length,
    tradedCount: traded.length, ranked, comparables,
  };
}
