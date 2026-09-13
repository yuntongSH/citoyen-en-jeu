/* SPDX-License-Identifier: MIT */
(function (root) {
  const fields = ['known', 'review'];
  const stamp = v => Number.isFinite(v) && v >= 0 ? Math.min(v, Date.now() + 300000) : 0;
  function clean(input, valid) {
    const x = input && typeof input === 'object' ? input : {};
    const ids = a => Array.isArray(a) ? [...new Set(a.filter(id => valid.has(id)))] : [];
    const out = {done: ids(x.done), known: ids(x.known), review: ids(x.review), best: Math.max(0, Math.min(100, Number(x.best) || 0)), english: x.english !== false, clocks: {known: {}, review: {}, english: stamp(x.clocks?.english), resume: stamp(x.clocks?.resume)}, resume: null};
    for (const f of fields) for (const id of valid) {
      const value = stamp(x.clocks?.[f]?.[id]);
      if (value || out[f].includes(id)) out.clocks[f][id] = value || 1;
    }
    const r = x.resume;
    if (r && typeof r === 'object') {
      const route = typeof r.route === 'string' && /^(parcours|cartes|quiz|reperes|sources|theme-[a-z-]+)$/.test(r.route) ? r.route : 'parcours';
      out.resume = {route, lessonId: valid.has(r.lessonId) ? r.lessonId : null, step: [0,1,2].includes(r.step) ? r.step : 0};
    }
    return out;
  }
  function changed(previous, next, valid, time = Date.now()) {
    const a = clean(previous, valid), b = clean(next, valid);
    for (const f of fields) for (const id of valid) if (a[f].includes(id) !== b[f].includes(id)) b.clocks[f][id] = time;
    if (a.english !== b.english) b.clocks.english = time;
    if (JSON.stringify(a.resume) !== JSON.stringify(b.resume)) b.clocks.resume = time;
    return b;
  }
  function merge(first, second, valid) {
    const a = clean(first, valid), b = clean(second, valid), out = clean(a, valid);
    out.done = [...new Set([...a.done, ...b.done])];
    out.best = Math.max(a.best, b.best);
    for (const f of fields) for (const id of valid) {
      const ac = a.clocks[f][id] || 0, bc = b.clocks[f][id] || 0;
      if (bc > ac || (bc === ac && b[f].includes(id))) {
        out[f] = out[f].filter(x => x !== id);
        if (b[f].includes(id)) out[f].push(id);
        if (bc) out.clocks[f][id] = bc;
      }
    }
    for (const f of ['english', 'resume']) if (b.clocks[f] > a.clocks[f]) {
      out[f] = b[f]; out.clocks[f] = b.clocks[f];
    }
    return out;
  }
  const api = {clean, changed, merge, key: id => id ? `citoyen-account-v2:${id}` : 'citoyen-guest-v2'};
  if (typeof module !== 'undefined') module.exports = api;
  root.CitoyenProgress = api;
})(typeof window !== 'undefined' ? window : globalThis);
