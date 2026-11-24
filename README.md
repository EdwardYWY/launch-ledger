# Launch Ledger

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/EdwardYWY/launch-ledger/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/EdwardYWY/launch-ledger/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

Launch Ledger ranks protocols with no token recorded in a sealed DefiLlama snapshot. It covers the official watchlist and surfaces additional candidates. Each profile shows its valuation inputs, a scenario range, and a research plan with time, cost, and exit checks.

## Run it

Use Node.js 22.18 or later and the snapshot from the [make.fun kit](https://make.fun/c/token-radar-01/kit).

```sh
node main.ts --input /path/to/snapshot.json --output out
```

Open `out/dashboard/index.html` directly in a browser. The output includes the ranked `board.json`, three screenshots, and the make.fun `dossier.json`. Use `--preview` when regenerating the dashboard and board before capturing updated screenshots.

## How it ranks

Each central estimate multiplies TVL by a peer multiple, a tracking-age factor, and a bounded seven-day TVL momentum factor. The peer multiple blends sector and global medians to reduce the influence of sparse sectors. Traded peers have a separate view. The range widens when evidence is thin or classification needs review. These estimates describe a hypothetical circulating market cap if a token launches.

The farm plans use sector-specific research steps and draw on primary product documentation. [Sentora vault overview](https://www.sec.gov/files/ctf-memo-sentora-081026.pdf) · [Steakhouse Prime Instant](https://www.steakhouse.financial/docs/products/vault-products/current/prime-instant) · [Gauntlet vaults on Morpho](https://app.morpho.org/curator/gauntlet) · [Veda vault components](https://docs.veda.tech/architecture-and-flow-of-funds/core-components) · [Upshift redemption paths](https://docs.upshift.finance/introduction/integration-guide) · [USDD user guide](https://docs.usdd.io/user-guide/getting-started) · [OnRe and ONyc](https://docs.onre.finance/introduction/onre-tokenized-reinsurance-onyc)

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
