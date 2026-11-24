(() => {
  const pick = selector => document.querySelector(selector);
  const all = selector => [...document.querySelectorAll(selector)];
  const data = globalThis.launchData;
  if (!data) {
    pick('#board').hidden = true;
    pick('#error').hidden = false;
    return;
  }
  data.ranked = globalThis.launchRecords.map((record, index) => {
    const row = Object.fromEntries(globalThis.launchFields.map((field, column) => [field, record[column]]));
    row.category = data.categories[row.category];
    row.chains = row.chains.map(index => data.chains[index]);
    row.rank = index + 1;
    row.low = Math.max(1, Math.round(row.value / row.band));
    row.high = Math.round(row.value * row.band);
    return row;
  });
  const dollars = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 });
  const integer = new Intl.NumberFormat('en-US');
  const pageSize = 8;
  const state = { scope: 'all', sort: 'value', direction: -1, page: 0 };
  const labels = { watchlist: 'Watchlist', early: 'Beyond watchlist' };
  const safe = value => String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
  const money = value => value == null ? '—' : dollars.format(value);
  const growth = value => value == null ? '—' : `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  const color = value => value == null ? '' : value < 0 ? 'negative' : 'positive';
  const stat = (value, label) => `<div><dt>${label}</dt><dd>${integer.format(value)}</dd></div>`;
  const rowBySlug = new Map(data.ranked.map(row => [row.slug, row]));
  const scope = all('[data-scope]');
  const sort = all('[data-sort]');
  const views = ['board', 'detail', 'peers', 'method'];

  pick('#date').textContent = data.asOf;
  pick('#stats').innerHTML = stat(data.scanned, 'Records scanned') + stat(data.ranked.length, 'Ranked candidates') + stat(data.watch, 'Watchlist covered');
  pick('#peer-rows').innerHTML = data.comparables.map(row => `<tr><td><strong>${safe(row.name)}</strong><small>${safe(row.symbol ?? 'Token record available')}</small></td><td>${safe(row.category)}</td><td class="num">${money(row.tvl)}</td><td class="num">${money(row.mcap)}</td></tr>`).join('');

  function populate(selector, values) {
    const ordered = [...new Set(values)].sort((a, b) => a.localeCompare(b));
    for (const value of ordered) pick(selector).add(new Option(value, value));
  }
  populate('#sector', data.ranked.map(row => row.category));
  populate('#network', data.ranked.flatMap(row => row.chains));

  function activate(view) {
    for (const id of views) pick('#' + id).hidden = id !== view;
    for (const button of all('[data-view]')) {
      const active = button.dataset.view === (view === 'detail' ? 'board' : view);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    }
  }

  function compare(a, b) {
    const left = a[state.sort];
    const right = b[state.sort];
    if (left == null || right == null) return (left == null) - (right == null) || a.rank - b.rank;
    const delta = typeof left === 'string' ? left.localeCompare(right) : left - right;
    return state.direction * delta || a.rank - b.rank;
  }

  function rowMarkup(row) {
    const network = row.chains[0] ?? 'Unspecified network';
    return `<tr>
      <td class="rankCol">${String(row.rank).padStart(2, '0')}</td>
      <td><button class="protocol" data-open="${safe(row.slug)}">${safe(row.name)}</button><small>${safe(row.category)} · ${safe(network)}${row.chains.length > 1 ? ' +' + (row.chains.length - 1) : ''}</small></td>
      <td><span class="pill ${row.status}">${labels[row.status]}</span>${row.review ? '<small class="review">Verify classification</small>' : ''}</td>
      <td class="num">${money(row.tvl)}</td>
      <td class="num ${color(row.growth)}">${growth(row.growth)}</td>
      <td class="num estimate"><strong>${money(row.value)}</strong><small>${money(row.low)}–${money(row.high)}</small></td>
      <td class="navCol" aria-hidden="true">↗</td>
    </tr>`;
  }

  function render() {
    const text = pick('#query').value.trim().toLocaleLowerCase();
    const sector = pick('#sector').value;
    const network = pick('#network').value;
    const shown = data.ranked.filter(row =>
      (state.scope === 'all' || state.scope === row.status) &&
      (!sector || row.category === sector) && (!network || row.chains.includes(network)) &&
      (!text || [row.name, row.slug, row.category, ...row.chains].some(value => value.toLocaleLowerCase().includes(text))));
    shown.sort(compare);
    const pages = Math.max(1, Math.ceil(shown.length / pageSize));
    state.page = Math.min(state.page, pages - 1);
    const start = state.page * pageSize;
    pick('#rows').innerHTML = shown.length ? shown.slice(start, start + pageSize).map(rowMarkup).join('') :
      '<tr><td colspan="7" class="empty">No matching protocols. Change a filter to widen the search.</td></tr>';
    pick('#results').textContent = shown.length ? `${start + 1}–${Math.min(start + pageSize, shown.length)} of ${shown.length} protocols` : '0 protocols';
    pick('#page').textContent = `${state.page + 1} / ${pages}`;
    pick('#prev').disabled = state.page === 0;
    pick('#next').disabled = state.page >= pages - 1;
    for (const button of scope) button.setAttribute('aria-pressed', button.dataset.scope === state.scope);
    for (const button of sort) {
      const active = button.dataset.sort === state.sort;
      if (active) button.parentElement.setAttribute('aria-sort', state.direction < 0 ? 'descending' : 'ascending');
      else button.parentElement.removeAttribute('aria-sort');
      button.querySelector('span').textContent = active ? state.direction < 0 ? '↓' : '↑' : '';
    }
  }

  const factor = (label, value, caption) => `<div><dt>${label}</dt><dd>${value}</dd><small>${caption}</small></div>`;
  const multiple = value => value.toFixed(2) + '×';

  function showDetail(row) {
    const plan = globalThis.launchPlan(row);
    const stepNames = ['Verify access', 'Preview the route', 'Observe the position', 'Plan your exit'];
    pick('#detail').innerHTML = `
      <button class="back" id="back">← Back to radar</button>
      <div class="hero detailHero">
        <div><div class="detailMeta"><span class="pill ${row.status}">${labels[row.status]}</span> Rank ${row.rank} · ${safe(row.category)}</div>
        <h1 id="detail-heading" tabindex="-1">${safe(row.name)}</h1>
        <p>${safe(row.chains.join(' · ') || 'Network unspecified in the snapshot')}${row.review ? ' · Verify classification before using this route' : ''}</p></div>
        <div class="detailValue"><small>Implied launch value</small><strong>${money(row.value)}</strong><span>${money(row.low)}–${money(row.high)} scenario range</span></div>
      </div>
      <div class="detailGrid">
        <article class="panel">
          <h2>Farm research plan</h2>
          <div class="planMeta"><span>${safe(plan.time)}</span><span>${safe(plan.cost)}</span></div>
          <ol class="steps">${plan.steps.map((step, i) => `<li><h3>${stepNames[i]}</h3><p>${safe(step)}</p></li>`).join('')}</ol>
        </article>
        <div class="detailSide">
          <article class="panel">
            <h2>Value breakdown</h2>
            <dl class="factors">
              ${factor('Snapshot TVL', money(row.tvl), 'Starting scale')}
              ${factor('Peer multiple', multiple(row.multiple), `${row.peers} sector comparable${row.peers === 1 ? '' : 's'} · blended with global median`)}
              ${factor('Age factor', multiple(row.ageFactor), row.age == null ? 'Tracking age missing' : integer.format(row.age) + ' days tracked')}
              ${factor('Momentum factor', multiple(row.growthFactor), growth(row.growth) + ' weekly change in TVL')}
            </dl>
            <p class="formula">TVL × peer multiple × age × momentum</p>
          </article>
          <article class="panel risk"><h2>What to verify</h2><p>${safe(plan.risk)}. The snapshot leaves token status and rewards eligibility unconfirmed.</p></article>
        </div>
      </div>`;
    pick('#back').addEventListener('click', () => {
      activate('board');
      pick(`[data-open="${CSS.escape(row.slug)}"]`)?.focus();
    });
    activate('detail');
    pick('#detail-heading').focus();
  }

  for (const button of scope) button.addEventListener('click', () => {
    state.scope = button.dataset.scope;
    state.page = 0;
    render();
  });
  for (const button of sort) button.addEventListener('click', () => {
    state.direction = state.sort === button.dataset.sort ? -state.direction : button.dataset.sort === 'name' ? 1 : -1;
    state.sort = button.dataset.sort;
    state.page = 0;
    render();
  });
  for (const button of all('[data-view]')) button.addEventListener('click', () => activate(button.dataset.view));
  function refreshFilters() {
    state.page = 0;
    render();
  }
  pick('#query').addEventListener('input', refreshFilters);
  for (const field of all('#sector, #network')) field.addEventListener('change', refreshFilters);
  pick('#reset').addEventListener('click', () => {
    for (const field of all('#query, #sector, #network')) field.value = '';
    Object.assign(state, { scope: 'all', sort: 'value', direction: -1, page: 0 });
    render();
  });
  pick('#prev').addEventListener('click', () => { state.page--; render(); });
  pick('#next').addEventListener('click', () => { state.page++; render(); });
  pick('#rows').addEventListener('click', event => {
    const slug = event.target.closest('[data-open]')?.dataset.open;
    if (slug && rowBySlug.has(slug)) showDetail(rowBySlug.get(slug));
  });
  render();
})();
