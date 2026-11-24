(() => {
  const routes = {
    vault: {
      action: 'Compare two vaults by asset, curator, fee, share price and withdrawal queue. Preview a deposit and a full withdrawal of the same amount.',
      follow: 'Record the receipt-share balance and redeemable amount, then compare both after seven days. Inspect curator allocation or cap changes before adding exposure.',
      exit: 'Preview redeeming all shares. Keep gas on the source chain and account for any withdrawal queue or transfer restriction.',
      time: '15–25 min setup · 7-day observation',
      cost: 'Two gas quotes plus vault fees · test with a $10–25 cap only if the minimum allows',
      risk: 'Curator discretion, share price changes, withdrawal delays',
    },
    lending: {
      action: 'Open a supported supply market. Compare available liquidity, utilization and collateral rules and simulate supplying its smallest allowed amount.',
      follow: 'Watch the supply rate and withdrawal liquidity for a week. Model liquidation thresholds in a simulator if exploring a borrow flow.',
      exit: 'Preview reclaiming the full supply with no open debt. Record whether withdrawal is instant and whether liquidity remains during high utilization.',
      time: '15–25 min setup · 7-day observation',
      cost: 'Approval, supply and withdrawal gas · collateral requirements vary',
      risk: 'Oracle, liquidation and withdrawal-liquidity risk',
    },
    exchange: {
      action: 'Read the venue’s pool liquidity, fee tier and quoted price impact. Preview a swap in the deepest eligible pair and compare a reverse quote.',
      follow: 'Check seven-day pool volume and fee earnings. Simulate adding and removing liquidity at a narrow and a broad range, including divergence loss.',
      exit: 'Inspect the reverse quote, withdrawal gas and any unclaimed fees. Keep a transaction or simulation receipt for the route tested.',
      time: '10–20 min setup · 7-day observation',
      cost: 'Two gas quotes plus venue fees and the quoted spread · set a hard test cap',
      risk: 'Slippage, adverse selection and divergence loss',
    },
    derivatives: {
      action: 'Use demo mode or a paper position. Record margin, order size, funding and both sides of the trade before simulating an entry.',
      follow: 'Track funding, collateral health and unrealized P&L for seven days. Compare those results with the collateral-only route.',
      exit: 'Simulate a full reduce-only close and withdrawal. Reconcile fees and funding against the paper-trade log.',
      time: '20 min setup · 7-day paper trial',
      cost: 'Demo or paper route costs $0 · log estimated venue fees',
      risk: 'Funding, liquidation and counterparty exposure',
    },
    prediction: {
      action: 'Check geographic access and stop at the public order book if your location is restricted. Pick a liquid market and record the bid, ask and written resolution criteria.',
      follow: 'Paper trade a small limit order and track spread and liquidity until the market settles. Save the resolution source and any dispute timeline.',
      exit: 'Compare an early exit at the visible bid with holding until resolution. Include spread, venue fees and the settlement wait in the comparison.',
      time: '15–25 min setup · observe until settlement',
      cost: 'Public order-book review and paper trading cost $0',
      risk: 'Geographic restrictions, thin books and disputed settlement',
    },
    rwa: {
      action: 'Check jurisdiction, investor eligibility, asset terms, minimum size and redemption days. Use read-only research if the route requires eligibility you lack.',
      follow: 'Track NAV updates, backing disclosures and whether redemption is open for a week. Record the servicing entity and asset settlement window.',
      exit: 'Read the stated redemption timeline and request minimum. Save the dated terms and stop if they leave custody or redemption unclear.',
      time: '20–35 min research · 7-day term check',
      cost: 'Research costs $0 · any transaction minimum must come from published terms',
      risk: 'Custody, eligibility, NAV staleness and redemption gates',
    },
    cdp: {
      action: 'Review collateral ratios, oracle sources, debt minimums and mint/redemption fees. Simulate opening a vault with a large collateral buffer.',
      follow: 'Watch peg, oracle price and liquidation distance for seven days. Compare redemption quotes with available market liquidity.',
      exit: 'Simulate debt repayment and collateral unlock in one round trip. Include mint fees, gas and the peg spread in the cost.',
      time: '20–30 min setup · 7-day paper trial',
      cost: 'Simulation costs $0 · live costs include gas, fees and collateral',
      risk: 'Liquidation, peg and collateral concentration',
    },
    security: {
      action: 'Identify the staking or security pool, its operator set, slashing conditions and unlock period. Preview stake and unstake on a demo route.',
      follow: 'Check operator concentration, slashing notices and the reward accounting over a week. Confirm which routes are independently withdrawable.',
      exit: 'Read the full unbonding procedure and any epoch limits. Calculate the time until the underlying asset would be spendable.',
      time: '20–30 min research · check unbonding before entry',
      cost: 'Research costs $0 · gas and any minimum depend on the route',
      risk: 'Slashing, operator concentration, unbonding delays',
    },
    network: {
      action: 'Choose a documented native action such as a testnet transfer, opening a payment channel in a simulator, or signing a read-only message.',
      follow: 'Watch confirmation time, route availability and any channel or account reserve. Record a test transaction or simulator result.',
      exit: 'Simulate returning the balance to the starting wallet. Include closure fees, finality delay and any minimum reserve.',
      time: '15–30 min setup · confirm finality',
      cost: 'Use a faucet or simulator · record any quoted network fees',
      risk: 'Finality, route liquidity and wallet compatibility',
    },
  };

  const research = {
    'sentora-curator': {
      action: 'Choose a publicly documented Sentora vault. Record its deposit asset, underlying loan markets, who can allocate capital and whether the route is open to individual wallets.',
      follow: 'Compare the vault share claim against available withdrawal liquidity. Record allocator or market changes after seven days and separate vault shares from any protocol incentive.',
      exit: 'Simulate asset redemption and check whether an institutional access gate or notice period would affect the exit.',
    },
    'steakhouse-financial': {
      action: 'Compare the Steakhouse Prime Instant USDC vault on Base with its Ethereum counterpart. Record the vault version, quoted withdrawal liquidity and three largest underlying markets.',
      follow: 'Track share price and underlying supply caps for seven days. Inspect outstanding timelock proposals for cap increases or new collateral markets.',
      exit: 'Preview a full redemption in the same interface. Record the gas quote and the liquid amount available before treating the route as instant.',
    },
    gauntlet: {
      action: 'Compare Gauntlet USDC Prime and Frontier on Morpho using the same asset and network. Record liquidity, fees and how much collateral exposure is concentrated in the largest market.',
      follow: 'Recheck liquidity and the largest market weights after seven days. Compare underlying yield with the displayed incentive component before interpreting the change.',
      exit: 'Preview reclaiming the entire USDC balance. Check for cap or adapter changes and note whether withdrawal liquidity covers the simulated size.',
    },
    veda: {
      action: 'Pick a live Veda-powered vault whose deposit terms you can verify. Identify the Teller, the Accountant rate and whether the available exit uses the instant buffer or BoringQueue.',
      follow: 'Record the share exchange rate and exit asset. Compare both after seven days and check whether a rate update or a queue could change the simulated exit date.',
      exit: 'Preview a full on-chain withdrawal. For a queued route, record the target asset, deadline, relevant fee and the procedure for cancellation.',
    },
    upshift: {
      action: 'Find an open Upshift vault in the deployment registry. Record its underlying asset, the curator’s whitelist and whether instant redemption is enabled.',
      follow: 'Record the previewDeposit and previewRedeem quotes for a paper position. Recheck the share ratio, vault allocations and liquidity buffer after seven days.',
      exit: 'Compare instant redemption after its fee with requesting an epoch redemption. Record the claimable epoch and count the request and claim transactions separately.',
    },
    usdd: {
      action: 'Use the USDD collateral dashboard to compare available vaults on Tron. Record the stability fee, collateral threshold and whether the asset you are testing is the already-issued USDD stablecoin.',
      follow: 'Track the USDD peg and collateral ratio in a paper vault. Simulate a 20% drop in collateral value and check the remaining liquidation buffer.',
      exit: 'Model repaying minted USDD plus accrued stability fees and reclaiming all collateral. Add transaction fees and a potentially adverse conversion spread.',
    },
    onre: {
      action: 'Read the ONyc investor and redemption terms. Separate the existing tokenized reinsurance exposure from a possible governance launch.',
      follow: 'Record ONyc NAV and a same-size secondary quote on Solana across seven days. Compare the spread and available depth with the primary redemption terms.',
      exit: 'Check qualification before modeling primary redemption and record the published wait. If you can use only the secondary route, simulate a full-size quote without trading.',
    },
  };

  function plan(row) {
    const detail = Object.hasOwn(research, row.slug) ? research[row.slug] : undefined;
    const route = { ...routes[row.route], ...detail };
    const chain = row.chains.slice(0, 2).join(' or ') || 'a documented network';
    const observation = route.time.split(' · ')[1];
    return {
      risk: route.risk,
      steps: [
        { action: `Open the official ${row.name} docs and confirm the route on ${chain}. Check eligibility, points terms and existing token information.`, time: '5 min', cost: '$0 for documentation review' },
        { action: route.action, time: '10–20 min', cost: route.cost },
        { action: route.follow, time: observation, cost: '$0 for monitoring or the paper trial' },
        { action: route.exit, time: '10 min to model the exit', cost: '$0 to preview. Record redemption fees and the network quote for a live exit' },
      ],
    };
  }

  globalThis.launchPlan = plan;
})();
