(async function () {
  "use strict";
  const files = ["index.html", "styles.css", "core.js", "art.js", "game.js", "core.test.js", "bike.js", "bike-ui.js", "goulash.js", "goulash-ui.js", "goulash.css", "ending.js", "ending.css", "scores.js"];
  const [html, css, core, art, ui, tests, bike, bikeUI, goulash, goulashUI, goulashCSS, ending, endingCSS, scores] = await Promise.all(files.map(async file => (await fetch(file)).text()));
  const iframe = document.getElementById("test-game");
  if (new URLSearchParams(location.search).get("viewport") === "mobile") iframe.style.width = "390px";
  const results = [];
  const check = (value, message) => { if (!value) throw new Error(message); };
  const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
  const assert = {
    ok: check,
    equal: (actual, expected, message) => check(actual === expected, message || `${actual} !== ${expected}`),
    deepEqual: (actual, expected) => check(JSON.stringify(canonical(actual)) === JSON.stringify(canonical(expected)), "deepEqual failed"),
    match: (text, pattern) => check(pattern.test(text), `${pattern}: ${text}`),
    doesNotMatch: (text, pattern) => check(!pattern.test(text), `${pattern}: ${text}`)
  };
  function test(name, run) {
    try { run(); results.push({ name, passed: true }); }
    catch (error) { results.push({ name, passed: false, error: error.message }); }
  }
  const isolated = {};
  new Function("globalThis", core)(isolated);
  new Function("globalThis", bike)(isolated);
  new Function("globalThis", scores)(isolated);
  new Function("globalThis", bikeUI)(isolated);
  new Function("globalThis", goulash)(isolated);
  new Function("globalThis", goulashUI)(isolated);
  test("Cooking: ingredients, timing, tofu, pause and timeout", () => {
    const cooking = isolated.ZubakGoulash;
    const state = cooking.create("NG"); const before = JSON.stringify(state);
    assert.match(cooking.ingredient(state, "tofu"), /nikto nejedol/); assert.equal(JSON.stringify(state), before);
    cooking.act(state); assert.equal(state.hits, 0);
    cooking.ingredient(state, "meat"); assert.equal(state.mistakes, 1);
    cooking.ingredient(state, "onion"); cooking.update(state, 1 / 2.52); cooking.act(state);
    check(cooking.score(state) >= 49, "Correct timing gave no points");
    cooking.act(state); assert.equal(state.hits, 1);
    cooking.pause(state); const elapsed = state.elapsed; cooking.update(state, 5); assert.equal(state.elapsed, elapsed);
    cooking.resume(state); cooking.update(state, 120); assert.equal(state.phase, "finished");
    check(Math.abs(state.elapsed - 120) < .001, "Timeout finish wrong");
    const fine = cooking.create("NG"); const coarse = cooking.create("NG");
    for (let tick = 0; tick < 1200; tick++) cooking.update(fine, .1);
    cooking.update(coarse, 120); assert.equal(fine.phase, coarse.phase); check(Math.abs(fine.elapsed - coarse.elapsed) < .001, "FPS changes cooking time");
  });
  test("Cooking: local top ten, validation and storage failures", () => {
    const values = new Map(); const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
    const board = isolated.ZubakGoulashUI;
    for (let index = 0; index < 12; index++) check(board.saveRecord(storage, { name: index ? "NG" : "<img>", score: index * 50, time: 50, date: "2026-01-01" }), "Cooking save failed");
    const entries = board.readRecords(storage); assert.equal(entries.length, 10); assert.equal(entries[0].score, 550);
    values.clear();
    check(board.saveRecord(storage, { name: "NG", score: 0, time: 120, date: "2026-01-01" }), "Full-length cooking save failed");
    values.clear();
    board.saveRecord(storage, { name: "Skorší", score: 500, time: 55, date: "2026-01-01" });
    board.saveRecord(storage, { name: "Rýchlejší", score: 500, time: 20, date: "2026-01-02" });
    assert.equal(board.readRecords(storage)[0].name, "Skorší");
    check(!board.saveRecord(storage, { name: "NG", score: 1001, time: 50, date: "2026-01-01" }), "Invalid score saved");
    values.set("zubak-goulash-records-v1", "{bad"); assert.equal(board.readRecords(storage).length, 0);
    check(!board.saveRecord({ getItem() { throw Error(); }, setItem() { throw Error(); } }, { name: "NG", score: 50, time: 50, date: "2026-01-01" }), "Storage failure hidden");
  });
  test("Scores: shared board helpers, dedupe, queue and offline fallback", () => {
    const shared = isolated.ZubakScores;
    check(shared, "Missing ZubakScores module");
    const values = new Map();
    const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
    const bike = { name: "NG", time: 90, falls: 1, date: "2026-05-01T10:00:00.000Z" };
    const goulash = { name: "NG", score: 700, time: 60, date: "2026-05-01T10:00:00.000Z" };
    assert.equal(shared.validate("bike", bike).time, 90);
    assert.equal(shared.validate("bike", { name: "NG", time: 90, falls: -1, date: "2026-05-01" }), null);
    assert.equal(shared.validate("goulash", { name: "NG", score: 1001, time: 60, date: "2026-05-01" }), null);
    assert.equal(shared.validate("goulash", goulash).score, 700);
    assert.equal(shared.plausible("bike", { name: "NG", time: 5, falls: 0, date: "2026-05-01" }), false);
    check(shared.saveLocal("bike", storage, bike), "Local bike save failed");
    assert.equal(shared.readLocal("bike", storage)[0].name, "NG");
    const other = { name: "Fifko", time: 80, falls: 0, date: "2026-05-02T10:00:00.000Z" };
    const merged = shared.merge("bike", [bike, bike], [other, { name: "<img>", time: 10, falls: 0, date: "2026-05-02T10:00:00.000Z" }]);
    assert.equal(merged.length, 2);
    assert.equal(merged[0].name, "Fifko");
    assert.equal(merged[1].name, "NG");
    check(shared.queue("bike", bike, storage), "Queue failed");
    check(shared.queue("bike", bike, storage), "Repeated queue failed");
    assert.equal(shared.pending(storage, "bike").length, 1);
    assert.equal(shared.pending(storage, "goulash").length, 0);
    shared.clearQueue(storage, "bike");
    assert.equal(shared.pending(storage, "bike").length, 0);
    assert.equal(shared.available("bike"), false);
    shared.submit("goulash", goulash, { storage });
    assert.equal(shared.pending(storage, "goulash").length, 1);
    assert.equal(shared.pending(storage, "bike").length, 0);
    shared.clearQueue(storage, "goulash");
  });
  test("Bike: cadence, falls, pause, clock and frame rates", () => {
    const ride = (pedalling, step) => {
      const state = isolated.ZubakBike.create("NG");
      for (let tick = 0; tick < 20000 && state.phase !== "finished"; tick++) {
        state.x = -.85;
        if (pedalling && tick % Math.round(.5 / step) === 0) isolated.ZubakBike.pedal(state);
        isolated.ZubakBike.update(state, step);
      }
      assert.equal(state.phase, "finished"); return state.elapsed;
    };
    check(ride(true, .05) < ride(false, .05), "Pedalling did not improve time");
    check(Math.abs(ride(false, .05) - ride(false, 1 / 60)) < .02, "Clock depends on frame rate");
    assert.equal(isolated.ZubakBike.format(90), "01:30:00");
    assert.equal(isolated.ZubakBike.format(75), "01:15:00");
    const coasting = isolated.ZubakBike.create("NG");
    isolated.ZubakBike.update(coasting, 3); coasting.speed = 28;
    isolated.ZubakBike.update(coasting, 1);
    check(coasting.speed < 24.9 && coasting.speed > 24.7, "Bike did not slow down enough without pedalling");
    isolated.ZubakBike.update(coasting, 10); check(Math.abs(coasting.speed * 3.6 - 20) < .001, "Coasting speed is not 20 km/h");
    const slowTurn = isolated.ZubakBike.create("NG");
    slowTurn.phase = "riding"; slowTurn.speed = 20 / 3.6;
    const fastTurn = isolated.ZubakBike.create("NG");
    fastTurn.phase = "riding"; fastTurn.speed = 28;
    isolated.ZubakBike.update(slowTurn, .5, 1); isolated.ZubakBike.update(fastTurn, .5, 1);
    check(fastTurn.x < slowTurn.x * .5, "Steering does not become harder at speed");
    const state = isolated.ZubakBike.create("NG");
    isolated.ZubakBike.update(state, 3); isolated.ZubakBike.fall(state);
    isolated.ZubakBike.update(state, 3);
    assert.equal(state.falls, 1); assert.equal(state.phase, "riding");
    check(Math.abs(state.elapsed - 3) < .02, "Fall did not cost three seconds");
    isolated.ZubakBike.pause(state); const elapsed = state.elapsed;
    isolated.ZubakBike.update(state, 10); assert.equal(state.elapsed, elapsed);
    isolated.ZubakBike.resume(state); assert.equal(state.phase, "riding");
    isolated.ZubakBike.update(state, 2, -1); assert.equal(state.x, -.86);
  });
  test("Bike: local top ten, malformed storage and safe names", () => {
    const records = new Map();
    const storage = { getItem: key => records.get(key), setItem: (key, value) => records.set(key, value) };
    for (let index = 0; index < 12; index++) check(isolated.ZubakBikeUI.saveRecord(storage, { name: index ? "NG" : "<img>", time: 70 + index, falls: 0, date: "2026-01-01T00:00:00Z" }), "Save failed");
    const top = isolated.ZubakBikeUI.readRecords(storage);
    assert.equal(top.length, 10); assert.equal(top[0].name, "<img>"); assert.equal(top[0].time, 70);
    records.set("zubak-bike-records-v1", "{bad"); assert.equal(isolated.ZubakBikeUI.readRecords(storage).length, 0);
    assert.equal(isolated.ZubakBikeUI.saveRecord({ setItem() { throw Error("Denied"); }, getItem() { throw Error("Denied"); } }, { name: "NG", time: 90, falls: 0, date: "2026-01-01" }), false);
  });
  test("Bike: speed increases travel smoothly and reduces steering", () => {
    const bikeGame = isolated.ZubakBike;
    const compare = speed => {
      const state = bikeGame.create("NG");
      state.phase = "riding"; state.speed = speed;
      bikeGame.update(state, .25, 1);
      return state;
    };
    check(Math.abs(bikeGame.create("NG").speed * 3.6 - 20) < .001, "Starting speed is not 20 km/h");
    const below = compare(25);
    const above = compare(100 / 3.6);
    check(above.distance > below.distance * 1.1 && above.distance < below.distance * 1.25, "High speed travel is not smooth");
    check(above.x < below.x * .75, "High speed did not make steering harder");
    const at = speed => {
      const state = bikeGame.create("NG"); state.phase = "riding"; state.speed = speed / 3.6;
      bikeGame.update(state, .01); return state.distance;
    };
    const distances = [20, 40, 60, 80, 90, 100].map(at);
    check(distances.every((distance, index) => !index || distance > distances[index - 1]), "Travel speed is not increasing");
    check(at(90.1) - at(89.9) < .002, "Travel speed jumps at 90 km/h");
    const almostFinished = bikeGame.create("NG");
    almostFinished.phase = "riding"; almostFinished.speed = 28; almostFinished.distance = bikeGame.length - 1;
    almostFinished.passed = bikeGame.obstacles.map((entry, index) => index);
    bikeGame.update(almostFinished, .25);
    assert.equal(almostFinished.phase, "finished");
    check(almostFinished.elapsed < .03, "Finish time did not account for increased travel speed");
  });
  test("Bike: braking slows faster than coasting and stays above minimum", () => {
    const bikeGame = isolated.ZubakBike;
    const coasting = bikeGame.create("NG"); const braking = bikeGame.create("NG");
    coasting.phase = braking.phase = "riding"; coasting.speed = braking.speed = 25;
    bikeGame.update(coasting, 1); bikeGame.update(braking, 1, 0, true);
    check(braking.speed < coasting.speed - 8, "Braking did not slow the bike faster");
    check(braking.distance < coasting.distance, "Braking did not reduce travel");
    bikeGame.update(braking, 5, 0, true);
    check(Math.abs(braking.speed * 3.6 - 20) < .001, "Braking went below minimum speed");
  });
  test("Bike: villagers move, collide and leave a passing lane", () => {
    const bikeGame = isolated.ZubakBike;
    const names = ["ondrej", "betka", "simona", "lyda", "peter", "mama", "kika"];
    const villagers = bikeGame.obstacles.filter(entry => names.includes(entry[2]));
    assert.equal(villagers.length, names.length);
    villagers.forEach(entry => {
      check(Math.abs(bikeGame.obstacleX(entry, 0) - bikeGame.obstacleX(entry, 2)) > .1, `${entry[2]} does not move`);
      for (let time = 0; time < 10; time += .1) {
        check(Math.abs(-.86 - bikeGame.obstacleX(entry, time)) >= .17, `${entry[2]} blocks the passing lane`);
      }
      const state = bikeGame.create("NG");
      state.phase = "riding";
      state.distance = entry[0] - .1;
      state.passed = bikeGame.obstacles.map((obstacle, index) => obstacle[0] < entry[0] ? index : -1).filter(index => index >= 0);
      state.x = bikeGame.obstacleX(entry, 0);
      bikeGame.update(state, .02);
      assert.equal(state.falls, 1, `${entry[2]} did not cause a fall`);
    });
  });
  test("Bike: wider bus and approaching lane-changing SUVs", () => {
    const bikeGame = isolated.ZubakBike;
    const vehicles = bikeGame.obstacles.filter(entry => entry[2] === "suv");
    assert.equal(vehicles.length, 3);
    vehicles.forEach(entry => {
      check(entry[0] >= bikeGame.routeDistance(1165), "SUV appeared before the road");
      check(bikeGame.obstacleX(entry, 0) * bikeGame.obstacleX(entry, Math.PI / .45) < 0, "SUV did not change lanes");
      check(bikeGame.obstacleDistance(entry, entry[0] - 40) < bikeGame.obstacleDistance(entry, entry[0] - 100), "SUV did not approach");
      const state = bikeGame.create("NG");
      state.phase = "riding";
      state.distance = entry[0] - 24;
      state.passed = bikeGame.obstacles.map((obstacle, index) => obstacle !== entry ? index : -1).filter(index => index >= 0);
      state.x = bikeGame.obstacleX(entry, 0);
      bikeGame.update(state, .5);
      assert.equal(state.falls, 1, "SUV collision did not cause a fall");
    });
    const bus = bikeGame.obstacles.find(entry => entry[2] === "bus");
    const state = bikeGame.create("NG");
    state.phase = "riding"; state.distance = bus[0] - .1;
    state.passed = bikeGame.obstacles.map((entry, index) => entry !== bus ? index : -1).filter(index => index >= 0);
    state.x = bikeGame.obstacleX(bus, 0) - .4;
    bikeGame.update(state, .02);
    assert.equal(state.falls, 1, "Wider bus collision was missed");
  });
  test("Bike: shorter mountain and unchanged road length", () => {
    const bikeGame = isolated.ZubakBike;
    assert.equal(bikeGame.routeDistance(940), 940 * .85);
    assert.equal(bikeGame.length - bikeGame.routeDistance(940), 1800 - 940);
    [0, 400, 940, 1350, 1800].forEach(distance => {
      check(Math.abs(bikeGame.sceneryDistance(bikeGame.routeDistance(distance)) - distance) < .001, "Scenery and route distances diverged");
    });
  });
  test("Bike: special SUV hits every lane even with immunity", () => {
    const bikeGame = isolated.ZubakBike;
    const vehicle = bikeGame.obstacles.find(entry => entry[2] === "filipSUV");
    check(vehicle, "Special SUV missing");
    [-.86, 0, .86].forEach(lane => {
      const state = bikeGame.create("NG");
      state.phase = "riding"; state.distance = vehicle[0] - 25; state.x = lane; state.immunity = 10;
      state.speed = 16;
      state.passed = bikeGame.obstacles.map((entry, index) => entry !== vehicle ? index : -1).filter(index => index >= 0);
      bikeGame.update(state, .5);
      assert.equal(state.phase, "fallen"); assert.equal(state.fallCause, "filipSUV");
      assert.equal(state.falls, 1);
      bikeGame.update(state, 3.1); assert.equal(state.phase, "riding");
      assert.equal(state.falls, 1, "Special SUV hit twice");
    });
  });
  test("Bike: special SUV is the first collision near the junction", () => {
    const bikeGame = isolated.ZubakBike;
    const state = bikeGame.create("NG");
    state.phase = "riding"; state.speed = 16;
    state.distance = bikeGame.routeDistance(1400); state.x = -.35;
    state.passed = bikeGame.obstacles.map((entry, index) => entry[2] !== "mama" && entry[2] !== "filipSUV" ? index : -1).filter(index => index >= 0);
    bikeGame.update(state, 1.5);
    assert.equal(state.phase, "fallen");
    assert.equal(state.fallCause, "filipSUV", "Another obstacle caused the first fall");
    assert.equal(state.falls, 1);
    bikeGame.update(state, 3.2);
    assert.equal(state.phase, "riding");
    assert.equal(state.falls, 1, "A second collision occurred after recovery");
  });
  new Function("require", tests)(id => {
    if (id === "./core.js") return isolated.Zubak;
    if (id === "node:assert/strict") return assert;
    if (id === "node:test") return { test: (name, run) => test(`Core: ${name}`, run) };
    throw new Error(`Unsupported module: ${id}`);
  });
  let harness;
  function setup(saved) {
    const doc = iframe.contentDocument;
    doc.open();
    doc.write(html.replace(/<script[\s\S]*?<\/script>/g, "").replace('<link rel="stylesheet" href="styles.css">', `<style>${css}</style>`).replace('<link rel="stylesheet" href="goulash.css">', `<style>${goulashCSS}</style>`).replace('<link rel="stylesheet" href="ending.css">', `<style>${endingCSS}</style>`));
    doc.close();
    const privateGlobal = { testEffects: [] };
    const parameter = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} });
    const audioNode = () => ({ frequency: parameter(), gain: parameter(), connect() {}, disconnect() {}, start() {}, stop() {} });
    privateGlobal.AudioContext = class {
      constructor() { this.currentTime = 0; this.sampleRate = 44100; this.state = "running"; this.destination = {}; }
      createOscillator() { return audioNode(); }
      createGain() { return audioNode(); }
      createBiquadFilter() { return audioNode(); }
      createBufferSource() { return audioNode(); }
      createBuffer(channels, length) { return { getChannelData: () => new Float32Array(length) }; }
      resume() { return Promise.resolve(); }
      close() { return Promise.resolve(); }
    };
    const storage = new Map();
    if (saved) storage.set("zubak-adventure-v1", JSON.stringify(saved));
    new Function("globalThis", core)(privateGlobal);
    new Function("globalThis", "document", art)(privateGlobal, doc);
    new Function("globalThis", bike)(privateGlobal);
    new Function("globalThis", scores)(privateGlobal);
    new Function("globalThis", bikeUI)(privateGlobal);
    new Function("globalThis", goulash)(privateGlobal);
    new Function("globalThis", goulashUI)(privateGlobal);
    new Function("globalThis", "document", "requestAnimationFrame", "cancelAnimationFrame", ending)(privateGlobal, doc, callback => iframe.contentWindow.requestAnimationFrame(callback), iframe.contentWindow.cancelAnimationFrame.bind(iframe.contentWindow));
    let callback;
    let time = 0;
    const anchor = "  render(); requestAnimationFrame(frame);";
    check(ui.includes(anchor), "UI loader anchor missing");
    const instrumented = ui.replace(/function playEffect\(kind\) \{\s*if \(!sound\) return;/, 'function playEffect(kind) {\n    if (!sound) return;\n    globalThis.testEffects.push(kind);').replace(anchor, `  globalThis.testAPI = {
      snapshot: () => ({ state: JSON.parse(JSON.stringify(state)), player: {...player}, mapVisible, activePerson, pending: Boolean(pendingInteraction) }),
      load: value => { state = game.restore(value); mapVisible = true; activePerson = null; cancelApproach(); render(); },
      travel, approach, frame, showPerson, showMap, execute, clearSavedData, resetEverything
    };\n${anchor}`);
    new Function("globalThis", "document", "localStorage", "requestAnimationFrame", instrumented)(privateGlobal, doc,
      { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) }, next => { callback = next; });
    doc.getElementById("startup-loading").close();
    doc.getElementById("intro").close();
    harness = { doc, api: privateGlobal.testAPI, game: privateGlobal.Zubak, ending: privateGlobal.ZubakEnding, storage, effects: privateGlobal.testEffects,
      tick: (count = 1) => { for (let frame = 0; frame < count; frame++) { time += 50; callback(time); } } };
    harness.tick();
    return harness;
  }
  const close = () => harness.doc.querySelectorAll("dialog[open]").forEach(dialog => dialog.close());
  function click(selector) {
    const element = harness.doc.querySelector(selector);
    check(element, `Missing ${selector}`);
    element.click(); harness.tick(65); close();
  }
  function go(place) {
    click("#map-button");
    const label = harness.game.places.find(value => value.id === place).name;
    click(`#hotspots button[aria-label="${label}"]`);
    assert.equal(harness.api.snapshot().state.location, place);
  }
  function talk(person, topic) {
    click(`#hotspots button[data-target="${person}"]`);
    const label = harness.game.availableTopics(harness.api.snapshot().state, person).find(([id]) => id === topic)?.[1];
    const choice = [...harness.doc.querySelectorAll("#choices button")].find(button => button.textContent === label);
    check(choice, `Missing topic ${person}/${topic}`);
    choice.click(); harness.tick(); close();
  }
  const use = target => click(`#hotspots button[data-target="${target}"]`);
  const select = item => click(`#inventory button[aria-label="${harness.game.items[item].name}"]`);
  function brno() {
    go("bus"); talk("peter", "brno");
    go("school"); talk("teacher", "route");
    go("bus"); select("route"); use("timetable");
    const choice = [...harness.doc.querySelectorAll("#modal-content button")].find(button => button.textContent.includes("6:45"));
    check(choice, "Missing timetable answer"); choice.click(); close();
    talk("peter", "itinerary");
  }
  function pixels(rectangle) {
    const data = harness.doc.getElementById("scene").getContext("2d").getImageData(...rectangle).data;
    let red = 0;
    const colors = new Set();
    for (let offset = 0; offset < data.length; offset += 4) {
      const [redChannel, green, blue, alpha] = data.slice(offset, offset + 4);
      if (redChannel === 172 && green === 88 && blue === 80 && alpha) red++;
      colors.add(`${redChannel},${green},${blue}`);
    }
    return { red, colors: colors.size };
  }
  test("UI: journal shows quests without individual clues", () => {
    const saved = isolated.Zubak.createState();
    saved.flags.recordingAsked = true;
    saved.clues = ["Prvý detail stopy", "Druhý detail stopy"];
    setup(saved);
    harness.doc.getElementById("journal-button").click();
    const content = harness.doc.getElementById("modal-content").textContent;
    assert.match(content, /ROZPRACOVANÉ \/ Náhradná klaviristka/);
    assert.match(content, /Nájdi telefón pri opustenej chatke/);
    assert.doesNotMatch(content, /Prvý detail stopy|Druhý detail stopy|01 \/|02 \//);
    assert.deepEqual(harness.api.snapshot().state.clues, saved.clues);
  });
  test("UI: selected repair plan can be given to forester", () => {
    const saved = isolated.Zubak.createState();
    saved.flags.bearSafe = true;
    saved.inventory.push("plan", "journal");
    setup(saved); go("spring"); select("plan");
    use("ondrej");
    check(harness.api.snapshot().state.flags.drain, "Giving the plan did not advance the repair");
    assert.match(harness.doc.getElementById("speech").textContent, /Priniesla som krčmárov zápisník aj plán/);
    check(!harness.doc.querySelector('#inventory button[aria-label="Plán opravy žliabka"][aria-pressed="true"]'), "Plan remained selected");
  });
  test("UI: mixer stays until transport and repair is checked with forester", () => {
    const saved = isolated.Zubak.createState();
    Object.assign(saved.flags, { bearSafe: true, drain: true, mixerBroken: true });
    saved.inventory.push("plan", "sparePart");
    setup(saved); go("mixer"); select("sparePart"); use("michacka");
    check(harness.api.snapshot().state.inventory.includes("mixer"), "Part was not given to Miešačka");
    assert.match(harness.doc.getElementById("speech").textContent, /Priniesla som náhradný ozubený remeň/);
    check(harness.doc.querySelector('[data-target="drum"]'), "Mixer disappeared before transport");
    go("home"); talk("tato", "transport"); go("mixer");
    check(!harness.doc.querySelector('[data-target="drum"]'), "Mixer remained after transport");
    go("spring"); talk("ondrej", "checkRepair");
    check(harness.api.snapshot().state.flags.waterFixed, "Forester did not confirm repair");
    go("mixer"); check(harness.doc.querySelector('[data-target="drum"]'), "Returned mixer is missing");
  });
  test("UI: spring water changes between frames", () => {
    setup(); go("spring");
    const context = harness.doc.getElementById("scene").getContext("2d");
    const before = Array.from(context.getImageData(948, 710, 18, 90).data);
    harness.tick(5);
    const after = context.getImageData(948, 710, 18, 90).data;
    check(before.some((value, index) => value !== after[index]), "Spring water is stationary");
  });
  test("UI: closed spring blocks background, approach and frame; manager dialogue ends; map works", () => {
    setup(); go("spring");
    assert.deepEqual([...harness.doc.querySelectorAll("#hotspots button")].map(button => button.dataset.target), ["warden"]);
    assert.deepEqual(harness.game.scene(harness.api.snapshot().state).visiblePeople, ["warden", "ondrej"]);
    check(!harness.doc.querySelector('[data-target="ondrej"]'), "Visible locked forester is interactive");
    for (const canvas of harness.doc.querySelectorAll("canvas")) assert.equal(harness.doc.defaultView.getComputedStyle(canvas).objectFit, "fill");
    const worldBounds = harness.doc.querySelector(".world").getBoundingClientRect();
    const managerBounds = harness.doc.querySelector('[data-target="warden"]').getBoundingClientRect();
    check(managerBounds.left >= worldBounds.left && managerBounds.right <= worldBounds.right, "Manager label outside scene");
    const before = harness.api.snapshot().player;
    harness.doc.getElementById("hotspots").dispatchEvent(new iframe.contentWindow.MouseEvent("click", { bubbles: true, clientX: 800, clientY: 400 }));
    harness.api.approach("channel", () => { throw new Error("Blocked approach executed"); });
    harness.tick(120);
    assert.deepEqual(harness.api.snapshot().player, before);
    use("warden");
    assert.deepEqual(harness.api.snapshot().player, before);
    check(harness.api.snapshot().state.flags.wardenMet, "Manager not met");
    assert.equal(harness.doc.getElementById("choices").children.length, 0);
    check(!harness.api.snapshot().activePerson && !harness.api.snapshot().pending, "Dialogue still active");
    check(pixels([444, 904, 156, 12]).red > 500, "Closed muted red-white barrier missing");
    check(pixels([0, 0, 1920, 1080]).colors > 100, "Blank canvas");
    click("#back-button"); check(harness.api.snapshot().mapVisible, "Cannot leave");
    go("spring"); assert.deepEqual(harness.api.snapshot().player, before);
  });
  test("UI: manager offers boot comparison after the footprint is found", () => {
    setup();
    const state = harness.game.createState();
    state.flags.tracks = true;
    state.inventory.push("footprint");
    harness.api.load(state);
    go("spring");
    use("warden");
    check(harness.api.snapshot().state.flags.wardenMet, "Manager not met");
    const label = harness.game.people.warden.topics.find(([id]) => id === "compareBoot")[1];
    const choice = [...harness.doc.querySelectorAll("#choices button")].find(button => button.textContent === label);
    check(choice, "Missing manager boot comparison");
    choice.click();
    check(harness.api.snapshot().state.flags["compared:warden"], "Manager boot not compared");
    assert.match(harness.doc.getElementById("speech").textContent, /Vzor podrážky sa nezhoduje/);
    use("warden");
    check(![...harness.doc.querySelectorAll("#choices button")].some(button => button.textContent === label), "Comparison still offered");
  });
  for (const brnoFirst of [false, true]) test(`UI: real Brno ${brnoFirst ? "before" : "after"} manager, permission, open movement and restore`, () => {
    setup();
    if (brnoFirst) brno();
    go("spring"); use("warden"); go("bus");
    if (!brnoFirst) {
      talk("peter", "permission");
      assert.match(harness.doc.getElementById("speech").textContent, /^NG: Peter, nepoznáš.*fakt potrebujem dostať.*najprv mi pomôž/);
      check(!harness.api.snapshot().state.flags.bearSafe, "Early opening");
      brno();
    }
    talk("peter", "permission");
    assert.match(harness.doc.getElementById("speech").textContent, /^NG: Peter, nepoznáš.*Predtým si pomohla ty mne.*vytáča/);
    const saved = harness.api.snapshot().state;
    check(saved.flags.bearSafe && !saved.flags.tracks, "Permission wrongly requires tracks");
    go("spring");
    assert.deepEqual([...harness.doc.querySelectorAll("#hotspots button")].map(button => button.dataset.target), ["ondrej", "channel", "repair"]);
    check(pixels([438, 754, 12, 156]).red > 500, "Raised muted red-white barrier missing");
    check(pixels([460, 904, 140, 12]).red === 0, "Closed barrier remains");
    const initial = harness.api.snapshot().player.x;
    harness.doc.getElementById("hotspots").dispatchEvent(new iframe.contentWindow.MouseEvent("click", { bubbles: true, clientX: 150, clientY: 450 }));
    harness.tick(40);
    check(harness.api.snapshot().player.x !== initial, "Open scene movement blocked");
    const persisted = JSON.parse(harness.storage.get("zubak-adventure-v1"));
    setup(persisted); go("spring");
    check(!harness.doc.querySelector('[data-target="warden"]'), "Restore closed permission");
  });
  test("UI: wiping storage removes progress and both record tables", () => {
    setup();
    harness.storage.set("zubak-bike-records-v1", "[]");
    harness.storage.set("zubak-goulash-records-v1", "[]");
    go("field");
    check(harness.storage.has("zubak-adventure-v1"), "Progress was not saved");
    harness.api.resetEverything();
    ["zubak-adventure-v1", "zubak-bike-records-v1", "zubak-goulash-records-v1"].forEach(key => check(!harness.storage.has(key), `${key} survived the wipe`));
    assert.deepEqual(harness.api.snapshot().state, harness.game.createState());
    check(harness.doc.getElementById("intro").open, "Intro did not reopen after the wipe");
    assert.equal(harness.doc.getElementById("save-status").textContent, "Uložená hra a rekordy vymazané");
  });
  test("UI: Fifko confrontation unlocks Lyda after fence", () => {
    setup(); go("field"); talk("fifko", "ladle");
    check(!harness.api.snapshot().state.flags.festival, "Festival unexpectedly required");
    go("flats"); use("lida");
    check(!harness.doc.getElementById("choices").textContent.includes("Koho si ráno videla"), "Early witness visible");
    go("nursery"); use("fence"); go("flats"); use("lida");
    check(!harness.doc.getElementById("choices").textContent.includes("Koho si ráno videla"), "Witness visible before Fifko confrontation");
    go("field"); talk("fifko", "fenceReport"); go("flats"); talk("lida", "witness");
    assert.doesNotMatch(harness.doc.getElementById("speech").textContent, /lesník/i);
    check(harness.api.snapshot().state.flags.witness, "Witness not granted");
  });
  test("UI: gym at the municipal office is interactive", () => {
    setup(); go("office");
    const gym = harness.doc.querySelector('#hotspots button[data-target="gym"]');
    check(gym && gym.textContent === "Posilovňa", "Missing gym button");
    use("gym");
    assert.match(harness.doc.getElementById("speech").textContent, /hotačky z Brna, Nikča a Verka/);
  });
  test("UI: mayor launches repeatable downhill without changing quests", () => {
    setup(); go("office"); use("mayor");
    const before = harness.api.snapshot().state.flags;
    const loan = [...harness.doc.querySelectorAll("#choices button")].find(button => button.textContent.includes("na zjazd"));
    check(loan, "Missing bike topic"); loan.click();
    check(harness.doc.querySelector(".bike-dialog[open]"), "Bike did not open");
    assert.deepEqual(harness.api.snapshot().state.flags, before);
    harness.doc.querySelector(".bike-return").click();
    check(!harness.doc.querySelector(".bike-dialog"), "Bike did not clean up");
    check(harness.doc.querySelector('[data-target="mayor"]'), "Mayor disappeared");
  });
  test("UI: mayor description and rear wheel repair animation", () => {
    setup(); go("office");
    assert.equal(harness.game.people.mayor.role, "Zubácky starosta. Svojím umom sa vyrovná našim velikánom, ktorých podobizne máme na úrade.");
    const context = harness.doc.getElementById("scene").getContext("2d");
    const sample = (left, top) => Array.from(context.getImageData(left, top, 24, 24).data);
    const rear = sample(550, 830); const front = sample(718, 816);
    harness.tick(7);
    const sampleRear = sample(550, 830);
    check(rear.some((value, index) => value !== sampleRear[index]), "Rear wheel did not turn");
    const frontAfter = sample(718, 816);
    check(front.every((value, index) => value === frontAfter[index]), "Front wheel moved");
  });
  test("UI: kettle starts cooking, tofu, pause, replay and story isolation", () => {
    setup(); go("field");
    const before = harness.api.snapshot().state;
    use("finish");
    assert.match(harness.doc.getElementById("speech").textContent, /kotlíku chýba slávnostná naberačka/);
    check(!harness.doc.getElementById("modal").open, "Kettle invitation opened a modal");
    const join = harness.doc.querySelector("#choices .goulash-join"); check(join, "Missing cooking invitation in dialogue"); join.click();
    const dialog = harness.doc.querySelector(".goulash-dialog[open]"); check(dialog, "Cooking not open");
    assert.match(dialog.querySelector(".goulash-feedback").textContent, /30 sekúnd.*5-krát.*medzerník.*stredu.*bodov/);
    dialog.querySelector(".goulash-start-button").click();
    assert.match(dialog.querySelector(".goulash-stage .goulash-feedback").textContent, /Vyber surovinu/);
    dialog.querySelector(".goulash-action").click();
    assert.match(dialog.querySelector(".goulash-stage .goulash-feedback").textContent, /Najprv vyber surovinu/);
    dialog.querySelector(".goulash-tofu").click();
    assert.match(dialog.querySelector(".goulash-feedback").textContent, /nikto nejedol/);
    assert.equal(harness.doc.activeElement, dialog.querySelector(".goulash-action"));
    check(dialog.querySelector(".goulash-stage .goulash-feedback"), "Tofu line is not in NG's speech bubble");
    dialog.querySelector(".goulash-pause").click(); check(dialog.querySelector(".goulash-resume"), "No pause state");
    dialog.querySelector(".goulash-resume").click();
    dialog.querySelector(".goulash-return").click(); check(dialog.querySelector(".goulash-confirm-exit"), "No exit confirmation");
    assert.equal(harness.doc.activeElement, dialog.querySelector(".goulash-confirm-exit"));
    dialog.querySelector(".goulash-confirm-exit").click(); check(!harness.doc.querySelector(".goulash-dialog"), "Cooking leaked dialog");
    assert.deepEqual(harness.api.snapshot().state, before);
    use("finish"); harness.doc.querySelector(".goulash-join").click();
    harness.doc.querySelector(".goulash-return").click(); assert.deepEqual(harness.api.snapshot().state, before);
    use("simona"); check(!harness.doc.querySelector("#choices .goulash-join"), "Kettle choice remained after selecting a person");
    use("finish"); harness.doc.getElementById("map-button").click();
    check(!harness.doc.querySelector("#choices .goulash-join"), "Kettle choice remained on map");
  });
  test("UI: cooking completes good and idle rounds with separate records", () => {
    setup(); go("field");
    const before = harness.api.snapshot().state;
    const view = harness.doc.defaultView; const nativeFrame = view.requestAnimationFrame;
    let callback; let time = 0;
    view.requestAnimationFrame = next => { callback = next; return 0; };
    const tick = seconds => { time += seconds * 1000; callback(time); };
    try {
      use("finish"); harness.doc.querySelector(".goulash-join").click();
      const dialog = harness.doc.querySelector(".goulash-dialog");
      dialog.querySelector(".goulash-start-button").click(); tick(0);
      for (const ingredient of ["onion", "meat", null, "paprika"]) {
        if (ingredient) dialog.querySelector(`[data-ingredient="${ingredient}"]`).click();
        if (ingredient === null) {
          const fire = dialog.querySelector('input[type="range"]'); fire.value = "60";
          fire.dispatchEvent(new view.Event("input", { bubbles: true }));
        }
        tick(1 / 2.52); dialog.querySelector(".goulash-action").click();
        for (let action = 1; action < 5; action++) { tick(1 / 1.26); dialog.querySelector(".goulash-action").click(); }
      }
      check(dialog.querySelector(".goulash-replay"), "Good round did not finish");
      assert.match(dialog.querySelector(".goulash-feedback").textContent, /tentoraz vyhrám/);
      const records = JSON.parse(harness.storage.get("zubak-goulash-records-v1"));
      check(records[0].score > 900, "Good cooking scored too low");
      dialog.querySelector(".goulash-replay").click(); dialog.querySelector(".goulash-start-button").click(); tick(0);
      dialog.querySelector(".goulash-pause").click(); tick(30);
      check(!dialog.querySelector(".goulash-replay"), "Paused round advanced");
      dialog.querySelector(".goulash-resume").click(); tick(0); tick(120);
      check(dialog.querySelector(".goulash-replay"), "Idle round did not finish");
      const after = JSON.parse(harness.storage.get("zubak-goulash-records-v1"));
      assert.equal(after.length, 2); assert.equal(after[1].score, 0);
      dialog.querySelector(".goulash-return").click();
      assert.deepEqual(harness.api.snapshot().state, before);
      assert.match(harness.doc.getElementById("speech").textContent, /tentoraz vyhrám/);
    } finally { view.requestAnimationFrame = nativeFrame; }
  });
  function finishFinale(start) {
    const view = harness.doc.defaultView;
    const nativeFrame = view.requestAnimationFrame;
    let frame;
    view.requestAnimationFrame = callback => { frame = callback; return 0; };
    try {
      start();
      check(harness.doc.querySelector(".finale"), "Finale film did not open");
      check(!harness.doc.querySelector(".finale-skip"), "Skip button still exists");
      assert.equal(harness.doc.querySelectorAll(".finale canvas").length, 1);
      frame(0);
      frame(harness.ending.scenes.length * harness.ending.duration * 1000);
    } finally { view.requestAnimationFrame = nativeFrame; }
  }
  test("UI: finale advances one scene and finishes from last scene", () => {
    setup();
    const view = harness.doc.defaultView; const nativeFrame = view.requestAnimationFrame;
    let frame; let completed = 0;
    view.requestAnimationFrame = callback => { frame = callback; return 0; };
    try {
      harness.ending.start(() => { completed++; });
      frame(0);
      const overlay = harness.doc.querySelector(".finale"); const next = overlay.querySelector(".finale-next");
      check(next, "Missing next scene button");
      next.click(); assert.equal(overlay.dataset.scene, "1");
      next.click(); assert.equal(overlay.dataset.scene, "2");
      frame(1000); frame(11000); assert.equal(overlay.dataset.scene, "3");
      next.click(); assert.equal(overlay.dataset.scene, "4");
      next.click(); assert.equal(overlay.dataset.scene, "5");
      next.click(); assert.equal(completed, 1);
      check(!harness.doc.querySelector(".finale"), "Finale remains open");
    } finally { view.requestAnimationFrame = nativeFrame; }
  });
  test("UI: Fifko's handoff immediately opens the finale", () => {
    setup();
    const saved = harness.game.createState();
    saved.inventory.push("ladle");
    Object.assign(saved.flags, { wellChecked: true, festivalReady: true });
    harness.api.load(saved); go("field"); use("fifko");
    const choice = [...harness.doc.querySelectorAll("#choices button")].find(button => button.textContent === "Našla som slávnostnú naberačku.");
    check(choice, "Missing handoff dialogue");
    finishFinale(() => choice.click());
    check(harness.api.snapshot().state.finished, "Handoff did not finish game");
    assert.equal(harness.game === undefined, false);
    check(harness.doc.getElementById("intro").open && harness.doc.getElementById("intro-continue").hidden, "Finished game did not return to new-game screen");
    check(!harness.doc.getElementById("intro-start").hidden, "New game is not available");
  });
  test("UI: skipping finale returns to intro with trailer and new game", () => {
    setup();
    const saved = harness.game.createState();
    saved.inventory.push("ladle");
    Object.assign(saved.flags, { wellChecked: true, festivalReady: true });
    harness.api.load(saved); go("field"); use("fifko");
    const choice = [...harness.doc.querySelectorAll("#choices button")].find(button => button.textContent === "Našla som slávnostnú naberačku.");
    check(choice, "Missing handoff dialogue");
    choice.click();
    const next = harness.doc.querySelector(".finale-next");
    check(next, "Missing next scene button");
    for (let index = 0; index < harness.ending.scenes.length; index++) next.click();
    check(harness.doc.getElementById("intro").open, "Intro did not open");
    check(harness.doc.getElementById("intro-continue").hidden, "Finished game can still be continued");
    check(!harness.doc.getElementById("intro-start").hidden, "New game is missing");
    check(!harness.doc.getElementById("intro-trailer").hidden, "Trailer is missing");
    check(!harness.doc.getElementById("intro-finale").hidden, "Finale replay is missing");
    harness.doc.getElementById("intro-continue").click();
    check(harness.doc.getElementById("intro").open, "Finished game continued");
    const finished = harness.api.snapshot().state;
    harness.doc.getElementById("intro-finale").click();
    check(!harness.doc.getElementById("intro").open, "Intro remained open over finale");
    const replayNext = harness.doc.querySelector(".finale-next");
    check(replayNext, "Finale replay did not start");
    for (let index = 0; index < harness.ending.scenes.length; index++) replayNext.click();
    check(harness.doc.getElementById("intro").open, "Intro did not reopen after replay");
    assert.deepEqual(harness.api.snapshot().state, finished);
    setup(finished);
    check(!harness.doc.getElementById("intro-finale").hidden, "Saved finished game lost finale replay");
    setup();
    check(harness.doc.getElementById("intro-finale").hidden, "Finale replay unlocked before finishing");
  });
  test("UI: quiet effects follow new game events and respect mute", () => {
    setup();
    const button = harness.doc.getElementById("sound-button");
    assert.equal(button.getAttribute("aria-pressed"), "true", "Sound is not on by default");
    const saved = harness.game.createState();
    saved.location = "field"; harness.api.load(saved);
    harness.api.execute({ type: "object", target: "poster" });
    assert.equal(harness.effects.pop(), "clue");
    saved.location = "cabin"; harness.api.load(saved);
    const phoneResult = harness.api.execute({ type: "object", target: "phone" });
    assert.equal(harness.effects.pop(), "item", `Phone: ${phoneResult.text}; sound: ${button.getAttribute("aria-pressed")}`);
    harness.api.execute({ type: "object", target: "phone" });
    assert.deepEqual(harness.effects, []);
    saved.location = "field"; harness.api.load(saved);
    harness.api.execute({ type: "object", target: "poster" });
    assert.equal(harness.effects.pop(), "clue");
    saved.location = "pub"; saved.inventory.push("math"); saved.flags.pubCodeKnown = true; harness.api.load(saved);
    harness.api.execute({ type: "object", target: "door", answer: "123" });
    assert.equal(harness.effects.pop(), "lockWrong");
    harness.api.execute({ type: "object", target: "door", answer: "225" });
    assert.equal(harness.effects.pop(), "lockOpen");
    harness.api.execute({ type: "object", target: "door" });
    assert.deepEqual(harness.effects, []);
    saved.location = "spring"; saved.inventory.push("plan", "mixer");
    Object.assign(saved.flags, { bearSafe: true, drain: true, transport: true }); harness.api.load(saved);
    harness.api.execute({ type: "object", target: "repair" });
    assert.equal(harness.effects.pop(), "repair");
    harness.api.execute({ type: "object", target: "repair" });
    assert.deepEqual(harness.effects, []);
    saved.location = "bus"; Object.assign(saved.flags, { routeChecked: true, brnoStarted: true }); harness.api.load(saved);
    harness.api.execute({ type: "talk", target: "peter", topic: "itinerary" });
    assert.equal(harness.effects.pop(), "quest");
    button.click();
    assert.equal(button.getAttribute("aria-pressed"), "false", "Mute is not reflected on the sound button");
    saved.location = "field"; harness.api.load(saved);
    harness.api.execute({ type: "object", target: "poster" });
    assert.deepEqual(harness.effects, []);
  });
  test("UI: full playthrough including pub code, tools, music and finale", () => {
    setup(); go("well"); use("water");
    assert.match(harness.doc.getElementById("speech").textContent, /Najprv musím otvoriť poklop/);
    check(!harness.api.snapshot().state.flags.dry, "Closed well was inspected");
    use("hatch"); use("water");
    go("field"); use("poster"); talk("fifko", "ladle"); talk("simona", "recording");
    go("nursery"); use("fence"); go("field"); talk("fifko", "fenceReport"); go("flats"); talk("lida", "witness");
    go("field"); talk("fifko", "verdict");
    go("bednari"); talk("betka", "consent"); go("cabin"); use("phone");
    go("field"); talk("simona", "returnPhone"); talk("simona", "edit");
    go("forest"); use("tracks"); go("shop"); use("shelf"); talk("kika", "chalk");
    go("forest"); select("chalk"); use("tracks");
    go("spring"); use("warden"); brno(); talk("peter", "permission");
    go("spring"); talk("ondrej", "compareBoot"); talk("ondrej", "explain"); go("home"); talk("mama", "repairLead");
    go("office"); talk("mayor", "key"); go("school"); talk("teacher", "math");
    go("pub"); use("door");
    const input = harness.doc.querySelector('#modal-content input');
    check(input, "Missing door code"); input.value = "225";
    harness.doc.querySelector('#modal-content form').dispatchEvent(new iframe.contentWindow.Event("submit", { bubbles: true, cancelable: true }));
    close();
    check(harness.api.snapshot().state.inventory.includes("plan"), "Door did not grant plan");
    go("spring"); talk("ondrej", "explain");
    go("mixer"); talk("michacka", "loan");
    go("cousin"); talk("cousin", "sparePart"); talk("husband", "secure"); use("tools");
    go("mixer"); talk("michacka", "loan");
    go("spring"); use("repair");
    check(!harness.api.snapshot().state.flags.waterFixed, "Repair succeeded without transport");
    go("home"); talk("tato", "transport");
    go("spring"); use("repair"); talk("ondrej", "ladletruth");
    go("well"); use("water"); go("home"); use("piano");
    check([...harness.doc.querySelectorAll('#modal-content button')].some(button => button.textContent === "Prehrať skladbu od Simony"), "Missing recording replay button");
    const attempt = [...harness.doc.querySelectorAll('#modal-content button')].find(button => button.textContent === "Skúsiť na festival");
    check(attempt, "Missing festival attempt"); attempt.click();
    for (const note of ["E", "G", "A"]) {
      const key = [...harness.doc.querySelectorAll('.piano-key')].find(button => button.dataset.note === note || button.textContent === note);
      check(key, `Missing piano ${note}`); key.click();
    }
    assert.equal(harness.doc.querySelector(".piano-output").textContent, "A mám to! Som pripravená vystúpiť na festivale.");
    close(); go("field"); finishFinale(() => talk("fifko", "returnLadle"));
    check(harness.api.snapshot().state.finished, "Finale not completed");
    check(harness.game.quests(harness.api.snapshot().state).every(quest => quest.done), "Unfinished quests");
    check(harness.doc.getElementById("intro").open, "Finale did not return to intro");
    check(harness.doc.getElementById("intro-continue").hidden, "Finished game can still be continued");
    check(!harness.doc.getElementById("intro-start").hidden, "New game is not available");
  });
  function view(open) {
    setup();
    const saved = harness.game.createState(); saved.flags.bearSafe = open;
    harness.api.load(saved); go("spring"); harness.tick();
  }
  document.getElementById("desktop").onclick = () => { iframe.style.width = "1100px"; };
  document.getElementById("mobile").onclick = () => { iframe.style.width = "390px"; };
  document.getElementById("closed").onclick = () => view(false);
  document.getElementById("opened").onclick = () => view(true);
  globalThis.browserTestResults = results;
  document.getElementById("results").textContent = `${results.filter(result => result.passed).length}/${results.length} passed\n${results.filter(result => !result.passed).map(result => `${result.name}: ${result.error}`).join("\n")}`;
  view(false);
})().catch(error => { document.getElementById("results").textContent = error.stack; });