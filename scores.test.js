"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const scores = require("./scores.js");

function memory() {
  const values = new Map();
  return {
    values,
    getItem: key => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => { values.set(key, String(value)); },
    removeItem: key => { values.delete(key); }
  };
}

function reply(status, body) {
  return { ok: status >= 200 && status < 300, status, text: async () => body };
}

test("validácia a poradie oboch minihier", () => {
  const bike = { name: "NG", time: 90, falls: 1, date: "2026-05-01T10:00:00.000Z" };
  assert.deepEqual(scores.validate("bike", bike), { name: "NG", time: 90, falls: 1, date: "2026-05-01T10:00:00.000Z" });
  assert.equal(scores.validate("bike", { name: "  ", time: 90, falls: 1, date: "2026-05-01" }), null);
  assert.equal(scores.validate("bike", { name: "NG", time: 0, falls: 1, date: "2026-05-01" }), null);
  assert.equal(scores.validate("bike", { name: "NG", time: 90, falls: 1.5, date: "2026-05-01" }), null);
  assert.equal(scores.validate("bike", { name: "NG", time: 90, falls: 1, date: "nie je dátum" }), null);
  assert.equal(scores.validate("goulash", { name: "NG", score: 1001, time: 60, date: "2026-05-01" }), null);
  assert.equal(scores.validate("goulash", { name: "NG", score: 500, time: 121, date: "2026-05-01" }), null);
  assert.equal(scores.validate("goulash", { name: "NG", score: 500, time: 60, date: "2026-05-01" }).score, 500);
  const ranked = scores.rank("goulash", [
    { name: "Skorší", score: 500, time: 55, date: "2026-05-01" },
    { name: "Neskorší", score: 500, time: 20, date: "2026-05-02" },
    { name: "Najlepší", score: 900, time: 100, date: "2026-05-03" }
  ]);
  assert.deepEqual(ranked.map(entry => entry.name), ["Najlepší", "Skorší", "Neskorší"]);
  assert.equal(scores.rank("bike", new Array(15).fill(bike)).length, 10);
});

test("spoločná tabuľka zlučuje duplikáty a zahadzuje nepravdepodobné výsledky", () => {
  const first = { name: "NG", time: 90, falls: 0, date: "2026-05-01T10:00:00.000Z" };
  const second = { name: "Fifko", time: 80, falls: 0, date: "2026-05-02T10:00:00.000Z" };
  const merged = scores.merge("bike", [first], [first, second, { name: "Podvod", time: 1, falls: 0, date: "2026-05-03T10:00:00.000Z" }]);
  assert.deepEqual(merged.map(entry => entry.name), ["Fifko", "NG"]);
  const many = scores.merge("bike", new Array(30).fill(null).map((_, index) => ({ name: `Hráč ${index}`, time: 60 + index, falls: 0, date: "2026-05-01T10:00:00.000Z" })));
  assert.equal(many.length, 20);
  assert.deepEqual(scores.merge("neexistuje", [first]), []);
});

test("lokálne úložisko drží najlepších desať a prežije poškodené dáta", () => {
  const storage = memory();
  for (let index = 0; index < 14; index++) {
    assert.equal(scores.saveLocal("goulash", storage, { name: `Hráč ${index}`, score: index * 10, time: 50, date: "2026-05-01T10:00:00.000Z" }), true);
  }
  const top = scores.readLocal("goulash", storage);
  assert.equal(top.length, 10);
  assert.equal(top[0].score, 130);
  assert.equal(JSON.parse(storage.values.get("zubak-goulash-records-v1")).length, 14);
  storage.values.set("zubak-goulash-records-v1", "{poškodené");
  assert.deepEqual(scores.readLocal("goulash", storage), []);
  assert.equal(scores.saveLocal("goulash", { getItem() { throw new Error("Denied"); }, setItem() { throw new Error("Denied"); } }, { name: "NG", score: 1, time: 1, date: "2026-05-01" }), false);
});

test("odoslanie pošle jeden záznam, server vráti tabuľku a fronta sa vyprázdni", async () => {
  const storage = memory();
  const posts = [];
  const fake = async (url, init = {}) => {
    if ((init.method || "GET") === "GET") return reply(200, JSON.stringify({ ok: true, records: [] }));
    const payload = JSON.parse(init.body);
    posts.push({ url, payload });
    return reply(200, JSON.stringify({ ok: true, game: "bike", stored: 1, records: [payload] }));
  };
  const record = { name: "NG", time: 90, falls: 2, date: "2026-05-02T10:00:00.000Z" };
  assert.equal(await scores.submit("bike", record, { storage, fetch: fake }), true);
  assert.equal(posts.length, 1);
  assert.match(posts[0].url, /scores\.php$/);
  assert.equal(posts[0].payload.game, "bike");
  assert.equal(posts[0].payload.name, "NG");
  assert.equal(posts[0].payload.time, 90);
  assert.equal(scores.pending(storage, "bike").length, 0);
});

test("výpadok siete výsledok odloží a neskôr odošle", async () => {
  const storage = memory();
  const record = { name: "NG", score: 800, time: 70, date: "2026-05-02T10:00:00.000Z" };
  assert.equal(await scores.submit("goulash", record, { storage, fetch: async () => null }), false);
  assert.equal(scores.pending(storage, "goulash").length, 1);
  assert.equal(await scores.submit("goulash", record, { storage, fetch: async () => reply(500, "") }), false);
  assert.equal(scores.pending(storage, "goulash").length, 1);
  const posts = [];
  const fake = async (url, init = {}) => {
    posts.push(JSON.parse(init.body));
    return reply(200, JSON.stringify({ ok: true, records: [] }));
  };
  assert.equal(await scores.flush("goulash", { storage, fetch: fake }), 1);
  assert.equal(posts.length, 1);
  assert.equal(posts[0].name, "NG");
  assert.equal(posts[0].score, 800);
  assert.equal(scores.pending(storage, "goulash").length, 0);
});

test("načítanie tabuľky zvládne výpadok, smeti aj vyrovnávaciu pamäť", async () => {
  assert.equal(await scores.fetchTop("bike", { fetch: async () => null, fresh: true, noHistory: true }), null);
  assert.equal(await scores.fetchTop("bike", { fetch: async () => reply(503, ""), fresh: true, noHistory: true }), null);
  assert.equal(await scores.fetchTop("bike", { fetch: async () => reply(200, "to nie je json"), fresh: true, noHistory: true }), null);
  const body = JSON.stringify({ ok: true, game: "bike", records: [{ name: "NG", time: 90, falls: 0, date: "2026-05-02T10:00:00.000Z" }] });
  const list = await scores.fetchTop("bike", { fetch: async () => reply(200, body), fresh: true, noHistory: true });
  assert.deepEqual(list.map(entry => entry.name), ["NG"]);
  let calls = 0;
  const cached = await scores.fetchTop("bike", { fetch: async () => { calls++; return reply(200, body); } });
  assert.equal(calls, 0);
  assert.deepEqual(cached.map(entry => entry.name), ["NG"]);
});

test("prvé spojenie odošle lokálnu históriu iba raz", async () => {
  const storage = memory();
  scores.saveLocal("bike", storage, { name: "NG", time: 90, falls: 1, date: "2026-05-01T10:00:00.000Z" });
  scores.saveLocal("bike", storage, { name: "Fifko", time: 85, falls: 0, date: "2026-05-02T10:00:00.000Z" });
  const posts = [];
  const fake = async (url, init = {}) => {
    const payload = JSON.parse(init.body);
    posts.push(payload);
    return reply(200, JSON.stringify({ ok: true, records: [payload] }));
  };
  await scores.fetchTop("bike", { storage, fetch: fake, fresh: true });
  for (let tick = 0; tick < 20 && posts.length < 2; tick++) await new Promise(resolve => setTimeout(resolve, 5));
  assert.equal(posts.length, 2);
  assert.deepEqual(posts.map(entry => entry.name).sort(), ["Fifko", "NG"]);
  assert.equal(scores.pending(storage, "bike").length, 0);
  posts.length = 0;
  await scores.fetchTop("bike", { storage, fetch: async (url, init) => reply(200, JSON.stringify({ ok: true, records: [] })), fresh: true });
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(posts.length, 0);
});
