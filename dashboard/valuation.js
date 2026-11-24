(() => {
  // Shared by the Node entrypoint and the offline dashboard.
  function launchValue(tvl, age, change, sample, globalMedian) {
    const count = sample?.count ?? 0;
    const weight = count / (count + 8);
    const sectorMedian = sample?.median ?? globalMedian;
    const multiple = Math.exp(weight * Math.log(sectorMedian) + (1 - weight) * Math.log(globalMedian));
    const ageFactor = Number.isFinite(age) ? 0.75 + 0.4 * (1 - Math.exp(-age / 270)) : 0.85;
    const growthFactor = Math.exp(Math.min(25, Math.max(-25, change ?? 0)) / 100);
    return {
      count, weight, sectorMedian, globalMedian, multiple, ageFactor, growthFactor,
      value: Math.max(1, Math.round(tvl * multiple * ageFactor * growthFactor)),
    };
  }

  globalThis.launchValue = launchValue;
})();
