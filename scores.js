(function (root) {
  "use strict";
  // Relatívna cesta k PHP endpointu. Prázdny reťazec = iba lokálne tabuľky.
  const endpoint = "scores.php";
  const queueKey = "zubak-scores-queue-v1";
  const uploadedKey = "zubak-scores-uploaded-v1";
  const queueLimit = 20;
  const cacheLife = 60000;
  const maxStored = 20;
  const requestTimeout = 5000;

  const games = {
    bike: {
      storageKey: "zubak-bike-records-v1",
      limit: 10,
      validate(value) {
        if (!value || typeof value.name !== "string") return null;
        const name = value.name.trim();
        if (!name || Array.from(name).length > 20) return null;
        if (!Number.isFinite(value.time) || value.time <= 0 || value.time > 86400) return null;
        if (!Number.isSafeInteger(value.falls) || value.falls < 0 || value.falls > 100000) return null;
        if (typeof value.date !== "string" || !Number.isFinite(Date.parse(value.date))) return null;
        return { name, time: value.time, falls: value.falls, date: new Date(value.date).toISOString() };
      },
      plausible(value) { return value.time >= 20; },
      order: (first, second) => first.time - second.time || Date.parse(first.date) - Date.parse(second.date)
    },
    goulash: {
      storageKey: "zubak-goulash-records-v1",
      limit: 10,
      validate(value) {
        if (!value || typeof value.name !== "string") return null;
        const name = value.name.trim();
        if (!name || Array.from(name).length > 20) return null;
        if (!Number.isInteger(value.score) || value.score < 0 || value.score > 1000) return null;
        if (!Number.isFinite(value.time) || value.time <= 0 || value.time > 120) return null;
        if (typeof value.date !== "string" || !Number.isFinite(Date.parse(value.date))) return null;
        return { name, score: value.score, time: value.time, date: new Date(value.date).toISOString() };
      },
      plausible(value) { return value.score <= 1000; },
      order: (first, second) => second.score - first.score || Date.parse(first.date) - Date.parse(second.date)
    }
  };

  const cache = { bike: null, goulash: null };

  function validate(game, value) {
    const config = games[game];
    return config ? config.validate(value) : null;
  }

  function plausible(game, value) {
    const config = games[game];
    const clean = config ? config.validate(value) : null;
    return clean ? config.plausible(clean) : false;
  }

  function rank(game, values, limit) {
    const config = games[game];
    if (!config) return [];
    const cleaned = [];
    (Array.isArray(values) ? values : []).forEach(value => {
      const record = config.validate(value);
      if (record) cleaned.push(record);
    });
    cleaned.sort(config.order);
    return cleaned.slice(0, limit || config.limit);
  }

  function merge(game, ...lists) {
    const config = games[game];
    if (!config) return [];
    const seen = new Set();
    const combined = [];
    lists.forEach(list => {
      if (!Array.isArray(list)) return;
      list.forEach(value => {
        const record = config.validate(value);
        if (!record || !config.plausible(record)) return;
        const key = record.name + "\u0000" + record.date;
        if (seen.has(key)) return;
        seen.add(key);
        combined.push(record);
      });
    });
    return rank(game, combined, maxStored);
  }

  function storageOf() {
    try { return root.localStorage || null; } catch (_) { return null; }
  }

  function rawLocal(game, storage) {
    const config = games[game];
    if (!config || !storage) return [];
    try {
      const raw = storage.getItem(config.storageKey);
      if (raw === null || raw === undefined) return [];
      const values = JSON.parse(raw);
      return Array.isArray(values) ? values : [];
    } catch (_) { return []; }
  }

  function readLocal(game, storage) {
    const config = games[game];
    if (!config) return [];
    return rank(game, rawLocal(game, storage), config.limit);
  }

  function saveLocal(game, storage, record) {
    const config = games[game];
    const clean = config ? config.validate(record) : null;
    if (!clean || !storage) return false;
    try {
      storage.setItem(config.storageKey, JSON.stringify(rank(game, [...rawLocal(game, storage), clean], maxStored)));
      return true;
    } catch (_) { return false; }
  }

  function readQueue(storage) {
    if (!storage) return [];
    try {
      const values = JSON.parse(storage.getItem(queueKey));
      if (!Array.isArray(values)) return [];
      return values.filter(entry => Boolean(entry && games[entry.game] && games[entry.game].validate(entry.record)));
    } catch (_) { return []; }
  }

  function writeQueue(storage, entries) {
    if (!storage) return false;
    try { storage.setItem(queueKey, JSON.stringify(entries.slice(-queueLimit))); return true; }
    catch (_) { return false; }
  }

  function queue(game, record, storage) {
    const target = storage || storageOf();
    const clean = validate(game, record);
    if (!target || !clean) return false;
    const entries = readQueue(target).filter(entry => !(entry.game === game && entry.record.name === clean.name && entry.record.date === clean.date));
    entries.push({ game, record: clean, at: new Date().toISOString() });
    return writeQueue(target, entries);
  }

  function pending(storage, game) {
    return readQueue(storage || storageOf()).filter(entry => entry.game === game);
  }

  function clearQueue(storage, game) {
    const target = storage || storageOf();
    if (!target) return false;
    return writeQueue(target, readQueue(target).filter(entry => entry.game !== game));
  }

  function available(game, options = {}) {
    if (!games[game] || !endpoint) return false;
    const nav = root.navigator;
    if (nav && nav.onLine === false) return false;
    if (typeof options.fetch === "function") return true;
    return typeof root.fetch === "function";
  }

  function request(path, init, options) {
    const fetchImpl = typeof options.fetch === "function" ? options.fetch : typeof root.fetch === "function" ? root.fetch : null;
    if (!fetchImpl) return Promise.resolve(null);
    const Controller = typeof root.AbortController === "function" ? root.AbortController : null;
    const controller = Controller ? new Controller() : null;
    const settings = Object.assign({}, init);
    if (controller) settings.signal = controller.signal;
    let timer = null;
    if (typeof setTimeout === "function") {
      timer = setTimeout(() => {
        if (!controller) return;
        try { controller.abort(); } catch (_) {}
      }, options.timeout || requestTimeout);
    }
    const done = () => { if (timer !== null && typeof clearTimeout === "function") clearTimeout(timer); };
    return Promise.resolve()
      .then(() => fetchImpl(path, settings))
      .then(response => { done(); return response || null; })
      .catch(() => { done(); return null; });
  }

  function parseJson(text) {
    if (typeof text !== "string" || !text) return null;
    try { return JSON.parse(text); } catch (_) { return null; }
  }

  function readTop(game, options) {
    const url = `${endpoint}?game=${encodeURIComponent(game)}&limit=${maxStored}`;
    return request(url, { method: "GET", cache: "no-store", headers: { Accept: "application/json" } }, options).then(response => {
      if (!response || !response.ok || typeof response.text !== "function") return null;
      return response.text().then(text => {
        const payload = parseJson(text);
        return payload && Array.isArray(payload.records) ? payload.records : null;
      }).catch(() => null);
    });
  }

  function postRecord(game, record, options) {
    const body = JSON.stringify(Object.assign({ game }, record));
    return request(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body
    }, options).then(response => {
      if (!response || typeof response.text !== "function") return null;
      return response.text().then(text => {
        const payload = parseJson(text);
        if (!response.ok || !payload || payload.ok !== true) return null;
        return Array.isArray(payload.records) ? payload.records : [];
      }).catch(() => null);
    });
  }

  function fetchTop(game, options = {}) {
    if (!available(game, options)) return Promise.resolve(null);
    const cached = options.fresh ? null : cache[game];
    if (cached && Date.now() - cached.at < cacheLife) return Promise.resolve(cached.records);
    return readTop(game, options).then(server => {
      if (!server) return null;
      const records = merge(game, server);
      cache[game] = { at: Date.now(), records };
      if (!options.noHistory) syncLocal(game, options);
      return records;
    });
  }

  function uploaded(storage, game) {
    try {
      const raw = storage.getItem(uploadedKey);
      const value = raw ? JSON.parse(raw) : null;
      return Boolean(value && typeof value === "object" && value[game]);
    } catch (_) { return false; }
  }

  function markUploaded(storage, game) {
    if (!storage) return;
    try {
      const raw = storage.getItem(uploadedKey);
      const parsed = raw ? JSON.parse(raw) : null;
      const value = parsed && typeof parsed === "object" ? parsed : {};
      value[game] = true;
      storage.setItem(uploadedKey, JSON.stringify(value));
    } catch (_) {}
  }

  function syncLocal(game, options = {}) {
    const storage = options.storage || storageOf();
    if (!storage || uploaded(storage, game)) return Promise.resolve(0);
    const local = readLocal(game, storage);
    markUploaded(storage, game);
    if (!local.length) return Promise.resolve(0);
    local.forEach(record => queue(game, record, storage));
    return flush(game, options);
  }

  function removeQueueEntry(storage, game, record) {
    if (!storage) return false;
    const entries = readQueue(storage).filter(entry => !(entry.game === game && entry.record.name === record.name && entry.record.date === record.date));
    return writeQueue(storage, entries);
  }

  function flush(game, options = {}) {
    const storage = options.storage || storageOf();
    const waiting = pending(storage, game);
    if (!waiting.length || !available(game, options)) return Promise.resolve(0);
    let sent = 0;
    return waiting.reduce((chain, entry) => chain.then(() => {
      if (!available(game, options)) return null;
      return postRecord(game, entry.record, options).then(records => {
        if (!records) return null;
        removeQueueEntry(storage, game, entry.record);
        cache[game] = { at: Date.now(), records: merge(game, records) };
        sent++;
        return null;
      });
    }), Promise.resolve()).then(() => sent);
  }

  function submit(game, record, options = {}) {
    const clean = validate(game, record);
    if (!clean || !plausible(game, clean)) return Promise.resolve(false);
    queue(game, clean, options.storage);
    return flush(game, options).then(sent => sent > 0);
  }

  const api = {
    endpoint, queueKey, uploadedKey, games,
    available, validate, plausible, rank, merge,
    readLocal, saveLocal,
    queue, pending, clearQueue, flush, syncLocal,
    fetchTop, submit
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.ZubakScores = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
