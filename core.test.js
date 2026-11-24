"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const game = require("./core.js");

test("rozhovor s lesníkom o oprave nepotrebuje studňu ani odliatok", () => {
  const state = game.createState();
  state.location = "spring";
  state.flags.bearSafe = true;
  assert.ok(game.scene(state).people.includes("ondrej"));
  assert.ok(game.availableTopics(state, "ondrej").some(([topic]) => topic === "explain"));
  const reply = game.interact(state, { type: "talk", target: "ondrej", topic: "explain" });
  assert.match(reply.text, /Presný postup opravy.*nepoznám/);
  assert.ok(state.flags.foresterAsked);
  assert.ok(!state.flags.dry);
  assert.ok(!state.flags.bootMatched);
  assert.ok(!state.flags.drain);
});

test("návrat vody ukončí mamine sprchovanie na bytovke", () => {
  const state = game.createState();
  state.location = "well";
  const inspect = () => game.interact(state, { type: "object", target: "water" }).text;
  game.interact(state, { type: "object", target: "hatch" });
  assert.ok(!inspect().includes("sprchovať"));
  state.flags.waterFixed = true;
  assert.match(inspect(), /Mama sa už nebude musieť chodiť sprchovať na bytovku/);
  assert.ok(state.flags.wellChecked);
});

test("papier z rozhľadne odhalí iba prvé dve noty", () => {
  const state = game.createState();
  state.location = "tower";
  const reply = game.interact(state, { type: "object", target: "melody" });
  for (const text of [reply.text, game.items.notes.description]) {
    assert.match(text, /E–G/);
    assert.match(text, /rozmazaná/);
    assert.ok(!text.includes("E–G–A"));
  }
  assert.ok(state.inventory.includes("notes"));
});

test("učiteľka doplní časy cesty a hráč vyberie najneskorší vhodný autobus", () => {
  const state = game.createState();
  state.location = "bus";
  const inspect = extra => game.interact(state, { type: "object", target: "timetable", ...extra }).text;
  assert.match(inspect(), /odchody autobusov/);
  assert.doesNotMatch(inspect(), /5:20|Peter/);
  state.location = "bus";
  const opening = game.interact(state, { type: "talk", target: "peter", topic: "brno" }).text;
  assert.match(opening, /o 12:30/);
  assert.match(opening, /neviem, ako dlho trvá cesta/);
  assert.match(inspect(), /5:20, 6:45, 8:10, 10:05 a 13:30/);
  assert.doesNotMatch(inspect(), /40 minút|20 minút|7:45/);
  state.location = "school";
  const teacher = game.interact(state, { type: "talk", target: "teacher", topic: "route" }).text;
  assert.match(teacher, /40 minút.*20 minút.*7:45.*4 hodiny/);
  state.location = "bus";
  assert.match(game.items.route.description, /40 minút.*20 minút.*7:45.*4 hodiny/);
  state.inventory.push("route");
  assert.match(inspect({ item: "route", answer: "5:20" }), /čakal zbytočne dlho/);
  assert.ok(!state.flags.routeChecked);
  assert.match(inspect({ item: "route", answer: "10:05" }), /prestup nestihol/);
  assert.ok(!state.flags.routeChecked);
  assert.match(inspect({ item: "route", answer: "8:10" }), /prestup nestihol/);
  assert.ok(!state.flags.routeChecked);
  assert.match(inspect({ item: "route", answer: "6:45" }), /presne 20 minút/);
  assert.ok(state.flags.routeChecked);
  assert.match(game.interact(state, { type: "talk", target: "peter", topic: "itinerary" }).text, /6:45.*7:25.*7:45.*štyri hodiny.*11:45.*12:30/);
});

test("krčmárova dávnejšia oprava vysvetlí nákres v oboch poradiach objavenia", () => {
  for (const foresterFirst of [true, false]) {
    const state = game.createState();
    state.flags.pubOpen = true;
    state.flags.bearSafe = true;
    const explain = () => {
      state.location = "spring";
      return game.interact(state, { type: "talk", target: "ondrej", topic: "explain" }).text;
    };
    const enter = () => {
      state.location = "pub";
      return game.interact(state, { type: "object", target: "door" }).text;
    };
    const texts = [];
    if (foresterFirst) {
      texts.push(explain());
      assert.match(texts[0], /Presný postup opravy/);
      assert.ok(!state.flags.drain);
    }
    texts.push(enter());
    assert.match(texts[texts.length - 1], /krčmárov zápisník a plán opravy/);
    assert.ok(!state.flags.drain);
    texts.push(explain());
    assert.ok(texts.every(text => !/dedo|dedom|dedov/i.test(text)));
    assert.match(texts[texts.length - 1], /Priniesla som krčmárov zápisník aj plán.*podľa nákresu/);
    assert.match(game.items.journal.description, /kedysi opravoval žliabok/);
    assert.ok(state.inventory.includes("journal") && state.inventory.includes("plan"));
    assert.ok(state.flags.drain && state.flags.journalFound);
  }
});

function festivalState() {
  const state = game.createState();
  state.location = "field";
  state.inventory.push("key", "math", "mixer", "pump", "ladle", "audioTrack");
  Object.assign(state.flags, {
    dry: true, festival: true, pubNotice: true, pubOpen: true, journalFound: true,
    tracks: true, bootMatched: true, ladleSpotted: true, repairLead: true, pubCodeKnown: true,
    bearSafe: true, transport: true, drain: true, waterFixed: true,
    wellChecked: true, witness: true, ladleTip: true, fenceChecked: true,
    fifkoCleared: true, equipmentReturned: true, recordingAsked: true,
    phoneReturned: true, audioConsent: true, festivalReady: true, brnoReady: true
  });
  return state;
}

test("matcha je voliteľná stopa a káva sa objaví až pri otvorení bez duplikátov", () => {
  const state = game.createState();
  state.location = "pub";
  const use = (target, item, answer) => game.interact(state, { type: "object", target, item, answer });
  const inventory = state.inventory.slice();
  assert.ok(!game.places.find(place => place.id === "pub").objects.includes("coffee"));
  use("door", "key");
  assert.ok(!state.flags.pubOpen && !state.flags.coffeeSeen);
  assert.equal(state.clues.length, 0);
  assert.match(use("matcha").text, /matcha/);
  use("matcha");
  assert.ok(state.flags.matchaSeen && !state.flags.pubOpen);
  assert.equal(state.clues.length, 1);
  assert.deepEqual(state.inventory, inventory);
  state.flags.pubCodeKnown = true;
  state.inventory.push("math");
  assert.match(use("door", null, "225").text, /Výberová káva/);
  assert.ok(state.flags.pubOpen && state.flags.coffeeSeen && state.flags.journalFound);
  assert.ok(state.inventory.includes("journal") && state.inventory.includes("plan"));
  const clues = state.clues.slice();
  assert.match(use("door").text, /Viac už v krčme nie je/);
  use("matcha");
  assert.deepEqual(state.clues, clues);
  assert.equal(state.clues.length, 3);
  assert.deepEqual(state.inventory, [...inventory, "math", "journal", "plan"]);
});

test("staré otvorené uloženie objaví kávu pri vstupe bez samostatného predmetu", () => {
  const legacy = game.createState();
  legacy.location = "pub";
  legacy.flags.pubOpen = true;
  const state = game.restore(JSON.stringify(legacy));
  assert.ok(!state.flags.coffeeSeen && !state.flags.matchaSeen);
  assert.ok(!game.places.find(place => place.id === "pub").objects.includes("coffee"));
  const entry = game.interact(state, { type: "object", target: "door" }).text;
  assert.match(entry, /Výberová káva/);
  assert.ok(!entry.includes("Kľúč sedí"));
  assert.ok(state.flags.coffeeSeen && state.flags.journalFound && !state.flags.matchaSeen);
  assert.deepEqual(state.inventory, ["notebook", "journal", "plan"]);
  const snapshot = game.restore(JSON.stringify(state));
  assert.match(game.interact(state, { type: "object", target: "door" }).text, /Viac už v krčme nie je/);
  assert.deepEqual(state, snapshot);
  assert.equal(state.clues.length, 2);
  assert.deepEqual(game.restore(JSON.stringify(state)), state);
});

test("Fifko prevezme naberačku až po kontrole studne a príprave na vystúpenie", () => {
  for (const missing of ["ladle", "wellChecked", "festivalReady"]) {
    const state = festivalState();
    Object.assign(state.flags, { matchaSeen: true, coffeeSeen: true });
    if (missing === "ladle") state.inventory = state.inventory.filter(item => item !== "ladle");
    else delete state.flags[missing];
    const reply = game.interact(state, { type: "talk", target: "fifko", topic: "returnLadle" });
    assert.equal(state.finished, false, missing);
    assert.doesNotMatch(reply.text, /kaviareň|hipster|matcha|výberová káva|strech/i);
    if (missing === "wellChecked") assert.match(reply.text, /skontrolujem studňu/);
    if (missing === "festivalReady") assert.match(reply.text, /sa pripravím na vystúpenie/);
    assert.equal(reply.speaker, "NG");
  }
  const state = festivalState();
  delete state.flags.wellChecked; delete state.flags.festivalReady;
  const reply = game.interact(state, { type: "talk", target: "fifko", topic: "returnLadle" });
  assert.match(reply.text, /skontrolujem studňu.*pripravím sa na vystúpenie/);
  assert.ok(!state.finished);
});

test("Fifko prevezme naberačku aj bez voliteľných úloh", () => {
  const state = game.createState();
  state.location = "field";
  state.inventory.push("ladle");
  state.flags.wellChecked = true;
  state.flags.festivalReady = true;
  assert.match(game.items.ladle.description, /Fifkovi/);
  assert.match(game.hint(state), /Odovzdaj.*Fifkovi/);
  assert.ok(game.availableTopics(state, "fifko").some(([topic]) => topic === "returnLadle"));
  const ending = game.interact(state, { type: "talk", target: "fifko", topic: "returnLadle" });
  assert.ok(state.finished);
  assert.match(ending.text, /hipsterská kaviareň/);
  assert.doesNotMatch(ending.text, /Fifko sa pred celým ihriskom ospravedlnil|Peter priznal pohovor|Miešačka zavrela knihu/);
});

test("finále bez voliteľných stôp aj s každou kombináciou spája iba videné dôkazy", () => {
  for (const matchaSeen of [false, true]) {
    for (const coffeeSeen of [false, true]) {
      const state = festivalState();
      if (matchaSeen) state.flags.matchaSeen = true;
      if (coffeeSeen) state.flags.coffeeSeen = true;
      const clues = state.clues.slice();
      const ending = game.interact(state, { type: "talk", target: "fifko", topic: "returnLadle" });
      assert.equal(state.finished, true);
      assert.match(ending.text, /Starosta na festivale oznámil: Namiesto krčmy.*hipsterská kaviareň/);
      assert.equal(/matcha/.test(ending.text), matchaSeen);
      assert.equal(/výberová káva/.test(ending.text), coffeeSeen);
      if (!matchaSeen && !coffeeSeen) assert.match(ending.text, /Tak to je prekvapenie/);
      assert.doesNotMatch(ending.text, /strech/i);
      for (const text of ["Lesník si požičal naberačku", "Fifko sa pred celým ihriskom ospravedlnil", "NG zahrala s kapelou", "Simonino video zostalo súkromné", "Peter priznal pohovor v Brne", "Tato vrátil miešačku", "Voda je späť."]) {
        assert.ok(ending.text.includes(text));
      }
      assert.deepEqual(state.clues, clues);
      assert.equal(Boolean(state.flags.matchaSeen), matchaSeen);
      assert.equal(Boolean(state.flags.coffeeSeen), coffeeSeen);
    }
  }
});

test("starosta ani Miešačka pred finále nevysvetľujú zatvorenú krčmu", () => {
  const state = festivalState();
  state.location = "office";
  const key = game.interact(state, { type: "talk", target: "mayor", topic: "key" });
  assert.match(key.text, /Dvere majú číselný zámok, kľúč netreba/);
  assert.doesNotMatch(key.text, /strech|kaviareň|hipster/i);
  state.location = "mixer";
  for (const topic of ["loan", "nickname"]) {
    const reply = game.interact(state, { type: "talk", target: "michacka", topic });
    assert.doesNotMatch(reply.text, /strech|kaviareň|hipster/i);
  }
  assert.doesNotMatch(game.items.journal.description, /strech|kaviareň|hipster/i);
});

test("Odliatok spojí stopu s lesníkom a nájdenou naberačkou", () => {
  const state = game.createState();
  state.location = "forest";
  state.inventory.push("chalk");
  const cast = game.interact(state, { type: "object", target: "tracks", item: "chalk" });
  assert.match(cast.text, /Popolušku.*vyskúšam ho ľuďom na topánky/);
  assert.ok(game.activeInventory(state).includes("footprint"));
  state.location = "spring";
  Object.assign(state.flags, { bearSafe: true, transport: true, drain: true });
  state.inventory.push("plan", "mixer", "pump");
  assert.match(game.interact(state, { type: "object", target: "repair" }).text, /Tato priviezol miešačku/);
  assert.ok(state.flags.waterFixed);
  assert.ok(game.availableTopics(state, "ondrej").some(([topic]) => topic === "compareBoot"));
  assert.ok(!state.flags.bootMatched && !state.flags.ladleSpotted);
  const comparison = game.interact(state, { type: "talk", target: "ondrej", topic: "compareBoot" });
  assert.ok(state.flags.bootMatched && state.flags.ladleSpotted);
  assert.ok(!state.inventory.includes("ladle"));
  assert.doesNotMatch(comparison.text, /Popýtam sa po Zubáku|plán opravy/);
  assert.ok(!comparison.text.includes("čo videla Lyda"));
  assert.ok(!game.availableTopics(state, "ondrej").some(([topic]) => topic === "compareBoot"));
  const ending = game.interact(state, { type: "talk", target: "ondrej", topic: "ladletruth" });
  assert.ok(ending.text.includes("okolo škôlky smerom k lesnému rázcestiu"));
  assert.ok(state.inventory.includes("ladle"));
});

test("odliatok možno porovnávať, kým sa nepotvrdí lesníkova stopa", () => {
  const state = game.createState();
  const visible = person => game.availableTopics(state, person).some(([topic]) => topic === "compareBoot");
  const personIds = Object.keys(game.people);
  for (const person of personIds) {
    assert.ok(game.people[person].topics.some(([topic]) => topic === "compareBoot"), person);
    assert.ok(!visible(person), person);
    state.location = person === "warden" ? "spring" : game.places.find(place => place.people.includes(person)).id;
    game.interact(state, { type: "talk", target: person, topic: "compareBoot" });
    assert.ok(!state.flags[`compared:${person}`] && !state.flags.bootMatched, person);
  }
  state.location = "forest";
  state.inventory.push("chalk");
  game.interact(state, { type: "object", target: "tracks", item: "chalk" });
  for (const person of personIds) assert.ok(visible(person), person);
  for (const person of personIds.filter(id => id !== "ondrej")) {
    state.location = person === "warden" ? "spring" : game.places.find(place => place.people.includes(person)).id;
    const before = game.restore(JSON.stringify(state));
    const reply = game.interact(state, { type: "talk", target: person, topic: "compareBoot" });
    assert.match(reply.text, /Vzor podrážky sa nezhoduje.*Budem hľadať ďalej/);
    before.flags[`compared:${person}`] = true;
    assert.deepEqual(state, before);
    assert.ok(!visible(person) && visible("ondrej"), person);
    assert.ok(!game.availableTopics(game.restore(state), person).some(([topic]) => topic === "compareBoot"));
  }
  state.location = "spring";
  state.flags.bearSafe = true;
  game.interact(state, { type: "talk", target: "ondrej", topic: "compareBoot" });
  assert.ok(state.flags.bootMatched && state.flags.ladleSpotted);
  assert.ok(!state.flags["compared:ondrej"] && !state.inventory.includes("ladle"));
  assert.ok(personIds.every(person => !visible(person)));
  const matched = game.restore(JSON.stringify(state));
  game.interact(state, { type: "talk", target: "ondrej", topic: "compareBoot" });
  assert.deepEqual(state, matched);
});

test("plán odporučí mama alebo tato až po rozhovore s lesníkom a otázka zmizne po nájdení plánu", () => {
  const providers = ["mama", "tato"];
  for (const provider of providers) {
    const state = game.createState();
    const visible = person => game.availableTopics(state, person).some(([topic]) => topic === "repairLead");
    assert.deepEqual(Object.keys(game.people).filter(person => game.people[person].topics.some(([topic]) => topic === "repairLead")).sort(), providers.slice().sort());
    assert.ok(providers.every(person => !visible(person)));
    state.flags.bootMatched = true;
    assert.ok(providers.every(person => !visible(person)));
    assert.equal(game.quests(state).some(quest => quest.title === "Plán opravy žliabka"), false);
    state.flags.bootMatched = false;
    state.location = game.places.find(place => place.people.includes(provider)).id;
    assert.match(game.interact(state, { type: "talk", target: provider, topic: "repairLead" }).text, /Najprv sa porozprávaj s lesníkom/);
    assert.ok(!state.flags.repairLead);
    state.flags.dry = true;
    assert.ok(providers.every(person => !visible(person)));
    assert.equal(game.quests(state).some(quest => quest.title === "Plán opravy žliabka"), false);
    state.flags.foresterAsked = true;
    assert.ok(providers.every(visible));
    assert.ok(!visible("teacher"));
    state.location = "school";
    const before = game.restore(JSON.stringify(state));
    assert.match(game.interact(state, { type: "talk", target: "teacher", topic: "repairLead" }).text, /nemôžem pýtať/);
    assert.deepEqual(state, before);
    state.location = game.places.find(place => place.people.includes(provider)).id;
    assert.match(game.interact(state, { type: "talk", target: provider, topic: "repairLead" }).text, /Kalus.*Plán bude.*v krčme.*starostu/);
    assert.ok(state.flags.repairLead);
    assert.ok(providers.every(visible));
    assert.ok(providers.every(person => game.availableTopics(game.restore(state), person).some(([topic]) => topic === "repairLead")));
    state.flags.journalFound = true;
    assert.ok(providers.every(person => !visible(person)));
    assert.ok(providers.every(person => !game.availableTopics(game.restore(state), person).some(([topic]) => topic === "repairLead")));
    const clues = state.clues.slice();
    for (const person of providers) {
      state.location = game.places.find(place => place.people.includes(person)).id;
      game.interact(state, { type: "talk", target: person, topic: "repairLead" });
    }
    assert.deepEqual(state.clues, clues);
  }
});

test("rozhovor s lesníkom odomkne plán len mame a tatovi aj bez kontroly studne", () => {
  const state = game.createState();
  const providers = ["mama", "tato"];
  const visible = person => game.availableTopics(state, person).some(([topic]) => topic === "repairLead");
  state.location = "spring";
  state.flags.bearSafe = true;
  assert.match(game.interact(state, { type: "talk", target: "ondrej", topic: "explain" }).text, /Presný postup opravy.*nepoznám/);
  assert.ok(state.flags.foresterAsked && !state.flags.dry);
  assert.ok(providers.every(visible) && !visible("lida") && !visible("betka"));
  assert.ok(game.quests(state).some(quest => quest.title === "Plán opravy žliabka" && quest.next === "Popýtaj sa v dedine, kde nájdeš plán opravy žliabka."));
  const restored = game.restore(JSON.stringify(state));
  assert.ok(providers.every(person => game.availableTopics(restored, person).some(([topic]) => topic === "repairLead")));
  state.location = "home";
  assert.match(game.interact(state, { type: "talk", target: "mama", topic: "repairLead" }).text, /netečie voda.*Kalus.*krčme.*starostu/);
  assert.ok(state.flags.repairLead && providers.every(visible));
  assert.ok(game.availableTopics(state, "mayor").some(([topic]) => topic === "key"));
  state.inventory.push("plan"); state.flags.journalFound = true;
  assert.ok(providers.every(person => !visible(person)));
});

test("starosta prezradí kód až po odporúčaní a tým odomkne učiteľkinu matematiku bez kľúča", () => {
  const state = game.createState();
  const visible = (person, topic) => game.availableTopics(state, person).some(([id]) => id === topic);
  state.location = "office";
  assert.ok(!visible("mayor", "key") && !visible("teacher", "math"));
  game.interact(state, { type: "talk", target: "mayor", topic: "key" });
  assert.ok(!state.flags.pubCodeKnown && !state.inventory.includes("key"));
  state.flags.bootMatched = true;
  assert.ok(!visible("mayor", "key"));
  state.flags.repairLead = true;
  assert.ok(visible("mayor", "key") && !visible("teacher", "math"));
  const inventory = state.inventory.slice();
  assert.match(game.interact(state, { type: "talk", target: "mayor", topic: "key" }).text, /číselný zámok, kľúč netreba/);
  assert.deepEqual(state.inventory, inventory);
  assert.ok(state.flags.pubCodeKnown && !visible("mayor", "key") && visible("teacher", "math"));
  state.location = "school";
  game.interact(state, { type: "talk", target: "teacher", topic: "math" });
  assert.ok(state.inventory.includes("math") && !visible("teacher", "math"));
});

test("dvere vyžadujú informáciu, matematiku a správny kód; kľúč ani skrinka ich neobídu", () => {
  for (const pubCodeKnown of [false, true]) {
    for (const math of [false, true]) {
      for (const answer of [undefined, "", "224", "226", "0225", "225 ", "abc", 0, 225, "225"]) {
        const state = game.createState();
        state.location = "pub";
        state.inventory.push("key");
        if (math) state.inventory.push("math");
        state.flags.pubCodeKnown = pubCodeKnown;
        const before = game.restore(JSON.stringify(state));
        assert.match(game.interact(state, { type: "object", target: "box", answer: "225" }).text, /Skrinku netreba odomykať/);
        assert.deepEqual(state, before);
        game.interact(state, { type: "object", target: "door", item: "key", answer });
        const opens = pubCodeKnown && math && String(answer) === "225";
        assert.equal(Boolean(state.flags.pubOpen), opens);
        if (!opens) {
          assert.deepEqual(state, before);
          continue;
        }
        assert.ok(state.flags.journalFound && state.flags.coffeeSeen);
        assert.ok(state.inventory.includes("journal") && state.inventory.includes("plan"));
        const entered = game.restore(JSON.stringify(state));
        for (const repeatAnswer of [undefined, "224", "225"]) {
          assert.match(game.interact(state, { type: "object", target: "door", answer: repeatAnswer }).text, /Viac už v krčme nie je/);
          game.interact(state, { type: "object", target: "box", answer: repeatAnswer });
          assert.deepEqual(state, entered);
        }
      }
    }
  }
});

test("lesník bez plánu nepozná postup, oprava vyžaduje všetky podmienky a až potom vráti naberačku", () => {
  for (const bootMatched of [false, true]) {
    const state = game.createState();
    state.location = "spring";
    state.flags.bootMatched = bootMatched;
    state.flags.bearSafe = true;
    state.inventory.push("journal");
    const before = JSON.parse(JSON.stringify(state));
    assert.match(game.interact(state, { type: "talk", target: "ondrej", topic: "explain" }).text, /Presný postup opravy/);
    assert.match(game.interact(state, { type: "object", target: "repair" }).text, /Zatiaľ neviem, ako žliabok opraviť.*popýtať po dedine/);
    before.flags.foresterAsked = true;
    assert.deepEqual(state, before);
    state.inventory.push("plan");
    game.interact(state, { type: "talk", target: "ondrej", topic: "explain" });
    assert.ok(state.flags.drain);
    const missingReply = game.interact(state, { type: "object", target: "repair" }).text;
    assert.match(missingReply, /Na opravu ešte potrebujem: miešačku, dohodnutý odvoz s tatom/);
    assert.ok(!state.flags.waterFixed);
    const explained = game.restore(JSON.stringify(state));
    game.interact(state, { type: "talk", target: "ondrej", topic: "explain" });
    assert.deepEqual(state, explained);
  }
  for (const missing of ["bearSafe", "plan", "mixer", "transport", "drain", null]) {
    const state = game.createState();
    state.location = "spring";
    state.inventory.push("plan", "mixer");
    Object.assign(state.flags, { ladleSpotted: true, bearSafe: true, transport: true, drain: true });
    if (["plan", "mixer"].includes(missing)) state.inventory = state.inventory.filter(item => item !== missing);
    else if (missing) delete state.flags[missing];
    const before = JSON.parse(JSON.stringify(state));
    assert.match(game.interact(state, { type: "talk", target: "ondrej", topic: "ladletruth" }).text, missing === "bearSafe" ? /postava tu nie je/ : /Najprv dokončíme opravu/);
    assert.deepEqual(state, before);
    game.interact(state, { type: "object", target: "repair" });
    assert.equal(Boolean(state.flags.waterFixed), missing === null, missing);
    assert.ok(!state.inventory.includes("ladle"));
    if (missing) {
      assert.deepEqual(state, before);
      continue;
    }
    assert.ok(game.availableTopics(state, "ondrej").some(([topic]) => topic === "ladletruth"));
    game.interact(state, { type: "talk", target: "ondrej", topic: "ladletruth" });
    assert.ok(state.inventory.includes("ladle") && state.flags.equipmentReturned);
    assert.ok(!game.availableTopics(state, "ondrej").some(([topic]) => topic === "ladletruth"));
    const returned = game.restore(JSON.stringify(state));
    game.interact(state, { type: "talk", target: "ondrej", topic: "ladletruth" });
    assert.deepEqual(state, returned);
  }
});

test("Bubon prezradí poruchu až po rozhovore s Miešačkou", () => {
  const state = game.createState();
  state.location = "mixer";
  const before = game.interact(state, { type: "object", target: "drum" });
  assert.doesNotMatch(before.text, /remeň/);
  state.flags.drain = true;
  game.interact(state, { type: "talk", target: "michacka", topic: "loan" });
  assert.ok(state.flags.mixerBroken);
  const after = game.interact(state, { type: "object", target: "drum" });
  assert.match(after.text, /remeň/);
});

test("Dielňa vydá diel až po súhlase a zaistení psa", () => {
  const state = game.createState();
  state.location = "cousin";
  state.flags.drain = true;
  state.location = "mixer";
  game.interact(state, { type: "talk", target: "michacka", topic: "loan" });
  state.location = "cousin";
  game.interact(state, { type: "talk", target: "cousin", topic: "sparePart" });
  game.interact(state, { type: "object", target: "tools" });
  assert.ok(!state.inventory.includes("sparePart"));
  game.interact(state, { type: "talk", target: "husband", topic: "secure" });
  game.interact(state, { type: "object", target: "tools" });
  assert.ok(state.inventory.includes("sparePart"));
});

test("Festivalový kotlík najprv nasmeruje na Fifka", () => {
  const state = game.createState();
  state.location = "field";
  const before = game.interact(state, { type: "object", target: "finish" });
  assert.match(before.text, /chýba slávnostná naberačka/);
  assert.ok(!before.text.includes("Lydou"));
  state.inventory.push("ladle");
  const after = game.interact(state, { type: "object", target: "finish" });
  assert.match(after.text, /odovzdám Fifkovi/);
  assert.ok(!state.finished);
});

test("Plot škôlky poskytne dôkaz až po Fifkovej teórii", () => {
  const state = game.createState();
  assert.ok(game.availableTopics(state, "fifko").some(([topic]) => topic === "ladle"));
  state.location = "nursery";
  game.interact(state, { type: "object", target: "fence" });
  assert.ok(!state.flags.fenceChecked);
  assert.equal(state.clues.length, 0);
  state.location = "field";
  game.interact(state, { type: "talk", target: "fifko", topic: "ladle" });
  state.location = "nursery";
  game.interact(state, { type: "object", target: "fence" });
  assert.ok(state.flags.fenceChecked);
});

test("Sadru od Kiky odomkne až prezretie stôp a informácia pri pulte", () => {
  const state = game.createState();
  state.location = "shop";
  game.interact(state, { type: "object", target: "shelf" });
  assert.ok(!state.flags.plasterLead);
  assert.ok(!game.availableTopics(state, "kika").some(([topic]) => topic === "chalk"));
  game.interact(state, { type: "talk", target: "kika", topic: "chalk" });
  assert.ok(!state.inventory.includes("chalk"));
  state.location = "forest";
  game.interact(state, { type: "object", target: "tracks" });
  assert.ok(state.flags.tracksSeen);
  assert.ok(!state.flags.tracks);
  state.location = "shop";
  assert.ok(!game.availableTopics(state, "kika").some(([topic]) => topic === "chalk"));
  game.interact(state, { type: "talk", target: "kika", topic: "chalk" });
  assert.ok(!state.inventory.includes("chalk"));
  game.interact(state, { type: "object", target: "shelf" });
  assert.ok(state.flags.plasterLead);
  assert.ok(game.availableTopics(state, "kika").some(([topic]) => topic === "chalk"));
  game.interact(state, { type: "talk", target: "kika", topic: "chalk" });
  assert.ok(game.activeInventory(state).includes("chalk"));
  assert.ok(!game.availableTopics(state, "kika").some(([topic]) => topic === "chalk"));
  state.location = "forest";
  game.interact(state, { type: "object", target: "tracks", item: "chalk" });
  assert.ok(state.flags.tracks);
});

test("batoh skryje nepotrebné predmety, ale zachová náradie do vrátenia", () => {
  const state = game.createState();
  state.inventory = Object.keys(game.items);
  assert.deepEqual(game.activeInventory(state), state.inventory.filter(item => item !== "rehearsal"));
  Object.assign(state.flags, {
    tracks: true, pubOpen: true, journalFound: true, musicSolved: true,
    recording: true, phoneReturned: true, festivalReady: true,
    brnoReady: true, waterFixed: true
  });
  assert.deepEqual(game.activeInventory(state), ["footprint", "notebook", "notes", "audioTrack", "mixer", "ladle", "sparePart"]);
  state.flags.equipmentReturned = true;
  assert.deepEqual(game.activeInventory(state), ["footprint", "notebook", "notes", "audioTrack", "ladle"]);
  state.finished = true;
  assert.deepEqual(game.activeInventory(game.restore(JSON.stringify(state))), ["footprint", "notebook", "notes", "audioTrack"]);
  assert.deepEqual(state.inventory, Object.keys(game.items));
});

test("v rozhovoroch zostanú nevyriešené úlohy a bežné témy", () => {
  const state = game.createState();
  const topics = person => game.availableTopics(state, person).map(([topic]) => topic);
  state.location = "bus";
  state.flags.contact = true;
  game.interact(state, { type: "talk", target: "peter", topic: "callForest" });
  assert.ok(!state.flags.bearSafe);
  state.flags.tracks = true;
  assert.ok(!topics("peter").includes("callForest"));
  game.interact(state, { type: "talk", target: "peter", topic: "callForest" });
  assert.ok(!state.flags.bearSafe);
  Object.assign(state.flags, { wardenMet: true, brnoReady: true });
  assert.ok(topics("peter").includes("permission"));
  game.interact(state, { type: "talk", target: "peter", topic: "permission" });
  assert.ok(state.flags.bearSafe && !topics("peter").includes("permission"));
  assert.ok(!topics("peter").includes("callForest"));
  assert.ok(!topics("peter").includes("contact"));
  assert.ok(topics("peter").includes("poker"));
  state.inventory.push("mixer");
  assert.ok(!topics("michacka").includes("loan"));
  assert.ok(topics("michacka").includes("nickname"));
  assert.ok(!game.availableTopics(game.restore(JSON.stringify(state)), "peter").some(([topic]) => topic === "callForest"));
});

test("prečítané vedľajšie témy zmiznú iba pri danej postave a zostanú uložené", () => {
  const state = game.createState();
  const visible = (person, topic, saved = state) => game.availableTopics(saved, person).some(([id]) => id === topic);
  assert.ok(visible("fifko", "looksmaxing"));
  game.interact(state, { type: "talk", target: "fifko", topic: "looksmaxing" });
  assert.ok(visible("fifko", "looksmaxing"));
  state.location = "field";
  game.interact(state, { type: "talk", target: "fifko", topic: "looksmaxing" });
  assert.ok(!visible("fifko", "looksmaxing"));
  assert.ok(visible("fifko", "goulash"));
  assert.ok(!visible("fifko", "looksmaxing", game.restore(JSON.stringify(state))));
  state.location = "home";
  game.interact(state, { type: "talk", target: "mama", topic: "familyHistory" });
  assert.ok(!visible("mama", "familyHistory"));
  assert.ok(!visible("tato", "familyHistory"));
  state.location = "bus";
  game.interact(state, { type: "talk", target: "peter", topic: "itinerary" });
  state.flags.routeChecked = true;
  assert.ok(visible("peter", "itinerary"));
});

test("úlohové témy sa odomykajú až po potrebných zisteniach a odporúčaniach", () => {
  const state = game.createState();
  const visible = (person, topic) => game.availableTopics(state, person).some(([id]) => id === topic);
  assert.ok(!visible("michacka", "loan"));
  assert.ok(!visible("teacher", "route"));
  assert.ok(!visible("betka", "consent"));
  assert.ok(!visible("peter", "itinerary"));
  assert.ok(!visible("peter", "contact"));
  assert.ok(!visible("peter", "callForest"));
  assert.ok(visible("mama", "case"));
  assert.ok(visible("peter", "brno"));
  assert.ok(visible("fifko", "looksmaxing"));
  state.flags.dry = true;
  assert.ok(!visible("mama", "referral"));
  assert.ok(!visible("tato", "transport"));
  assert.ok(!visible("michacka", "loan"));
  state.flags.drain = true;
  assert.ok(!visible("mama", "referral"));
  assert.ok(visible("michacka", "loan"));
  state.location = "bus";
  game.interact(state, { type: "talk", target: "peter", topic: "brno" });
  assert.ok(visible("teacher", "route"));
  state.flags.routeChecked = true;
  assert.ok(visible("peter", "itinerary"));
  game.interact(state, { type: "talk", target: "peter", topic: "itinerary" });
  assert.ok(!visible("peter", "permission"));
  state.location = "spring";
  game.interact(state, { type: "talk", target: "warden", topic: "entry" });
  assert.ok(visible("peter", "permission"));
  state.location = "bus";
  game.interact(state, { type: "talk", target: "peter", topic: "permission" });
  assert.ok(state.flags.bearSafe && !visible("peter", "permission"));
  state.flags.recordingAsked = true;
  assert.ok(visible("betka", "consent"));
  assert.ok(!visible("simona", "edit"));
  state.flags.audioConsent = true;
  state.inventory.push("rehearsal");
  assert.ok(!visible("simona", "edit"));
  state.inventory.push("phone");
  assert.ok(visible("simona", "returnPhone"));
  state.location = "field";
  game.interact(state, { type: "talk", target: "simona", topic: "returnPhone" });
  assert.ok(!visible("simona", "returnPhone"));
  assert.ok(visible("simona", "edit"));
});

test("náhradný diel a odvoz sa sprístupňujú postupne", () => {
  for (const askFather of [false, true]) {
    const state = game.createState();
    const visible = (person, topic) => game.availableTopics(state, person).some(([id]) => id === topic);
    const talk = (target, topic) => game.interact(state, { type: "talk", target, topic });
    assert.ok(!visible("michacka", "loan") && !visible("tato", "partLead") && !visible("tato", "transport"));
    Object.assign(state.flags, { bearSafe: true, drain: true });
    state.inventory.push("plan");
    assert.ok(visible("michacka", "loan") && !visible("tato", "transport"));
    state.location = "home"; talk("tato", "transport"); assert.ok(!state.flags.transport);
    state.location = "mixer"; assert.match(talk("michacka", "loan").text, /pokazila.*remeň/);
    assert.ok(visible("tato", "partLead") && visible("cousin", "sparePart") && visible("husband", "sparePart"));
    if (askFather) { state.location = "home"; assert.match(talk("tato", "partLead").text, /sesternica/); }
    state.location = "cousin"; talk(askFather ? "husband" : "cousin", "sparePart");
    assert.ok(!visible("tato", "partLead") && !visible("cousin", "sparePart") && !visible("husband", "sparePart"));
    game.interact(state, { type: "object", target: "tools" }); assert.ok(!state.inventory.includes("sparePart"));
    talk("husband", "secure"); game.interact(state, { type: "object", target: "tools" });
    assert.ok(state.inventory.includes("sparePart") && !visible("tato", "transport"));
    state.location = "mixer"; talk("michacka", "loan");
    assert.ok(state.inventory.includes("mixer") && !state.inventory.includes("sparePart"));
    assert.ok(visible("tato", "transport") && !visible("michacka", "loan"));
    state.location = "spring"; game.interact(state, { type: "object", target: "repair" }); assert.ok(!state.flags.waterFixed);
    state.location = "home"; talk("tato", "transport"); assert.ok(!visible("tato", "transport"));
    state.location = "spring"; game.interact(state, { type: "object", target: "repair" }); assert.ok(state.flags.waterFixed);
  }
});

test("nápoveda a denník sledujú náhradný diel", () => {
  const state = game.createState();
  Object.assign(state.flags, { bearSafe: true, foresterAsked: true, journalFound: true, drain: true, transport: true, pubOpen: true });
  state.location = "mixer";
  game.interact(state, { type: "talk", target: "michacka", topic: "loan" });
  assert.ok(state.flags.mixerBroken);
  const equipmentQuest = () => game.quests(state).find(quest => quest.title === "Pokazená miešačka");
  assert.match(game.hint(state), /sesternice/);
  assert.match(equipmentQuest().next, /sesternice/);
  state.location = "cousin";
  game.interact(state, { type: "talk", target: "cousin", topic: "sparePart" });
  assert.match(game.hint(state), /psa/);
  game.interact(state, { type: "object", target: "tools" });
  assert.ok(!state.inventory.includes("sparePart"));
  game.interact(state, { type: "talk", target: "husband", topic: "secure" });
  assert.match(game.hint(state), /dielne/);
  game.interact(state, { type: "object", target: "tools" });
  assert.match(game.hint(state), /Odovzdaj náhradný diel/);
  assert.match(equipmentQuest().next, /Odnes náhradný diel/);
});

test("rozpracovaná oprava má v nápovede prednosť pred voliteľným pátraním", () => {
  const state = game.createState();
  state.flags.bearSafe = true;
  state.location = "spring";
  game.interact(state, { type: "talk", target: "ondrej", topic: "explain" });
  assert.match(game.hint(state), /mamy alebo tata/);
  state.location = "home";
  game.interact(state, { type: "talk", target: "mama", topic: "repairLead" });
  assert.match(game.hint(state), /starostu/);
  state.flags.pubCodeKnown = true;
  assert.match(game.hint(state), /učiteľka/);
  state.flags.pubOpen = true;
  state.flags.journalFound = true;
  state.inventory.push("plan");
  assert.match(game.hint(state), /Prines plán/);
  state.location = "spring";
  game.interact(state, { type: "talk", target: "ondrej", topic: "explain" });
  assert.match(game.hint(state), /Miešačky/);
  state.inventory.push("mixer");
  assert.match(game.hint(state), /tata/i);
  state.flags.transport = true;
  assert.match(game.hint(state), /za lesníkom a skontroluj opravu/);
  state.flags.waterFixed = true;
  assert.match(game.hint(state), /lesnom rázcestí/);
  state.flags.tracks = true;
  assert.match(game.hint(state), /Porovnaj.*lesníka/);
  assert.ok(!game.availableTopics(state, "ondrej").some(([topic]) => topic === "ladletruth"));
  state.flags.bootMatched = true;
  assert.match(game.hint(state), /Vypýtaj.*naberačku/);
  assert.ok(!state.flags.dry && !state.flags.ladleTip);
});

test("lesník pri vrátení naberačky potvrdí cestu okolo škôlky", () => {
  const state = game.createState();
  state.location = "spring";
  Object.assign(state.flags, { bearSafe: true, bootMatched: true, waterFixed: true });
  const reply = game.interact(state, { type: "talk", target: "ondrej", topic: "ladletruth" });
  assert.match(reply.text, /okolo škôlky smerom k lesnému rázcestiu/);
  assert.doesNotMatch(reply.text, /od krčmy cez rázcestie/);
});

test("tato voliteľne poradí kde nájsť náhradný diel", () => {
  const state = game.createState();
  state.flags.mixerBroken = true;
  const visible = (person, topic) => game.availableTopics(state, person).some(([id]) => id === topic);
  assert.ok(visible("tato", "partLead") && !visible("mama", "referral"));
  assert.match(game.interact(state, { type: "talk", target: "tato", topic: "partLead" }).text, /sesternica/);
  assert.ok(!visible("tato", "partLead") && !visible("tato", "transport"));
});

test("staré uloženia s náradím sa prevedú na nový postup", () => {
  for (const stage of ["started", "coupling", "settled", "mixer", "fixed"]) {
    const saved = game.createState();
    Object.assign(saved.flags, { drain: true, ledgerStarted: true });
    saved.inventory.push("plan", "pump");
    saved.clues.push("Podľa krčmárovho plánu treba žliabok vyčistiť a vybetónovať. Miešačka pripraví betón, čerpadlo s hadicou odvedie vodu a ťažké vybavenie treba odviezť SUV.", "Záznam v dielni: hadicu so spojkou M-07 požičali na upratovanie pri Opustenej chatke. Spojku treba dohľadať zvonka.", "Iná stopa zostáva.");
    if (stage === "coupling") saved.inventory.push("coupling");
    if (stage === "settled") saved.flags.ledgerSettled = true;
    if (stage === "mixer" || stage === "fixed") saved.inventory.push("mixer");
    if (stage === "fixed") saved.flags.waterFixed = true;
    const restored = game.restore(JSON.stringify(saved));
    assert.ok(!restored.inventory.includes("pump") && !restored.inventory.includes("coupling"));
    assert.ok(restored.clues.includes("Iná stopa zostáva."));
    assert.doesNotMatch(restored.clues.join(" "), /hadic|čerpad|spojk|M-07/i);
    if (stage === "started") assert.ok(restored.flags.mixerBroken && !restored.inventory.includes("sparePart"));
    if (stage === "coupling" || stage === "settled") assert.ok(restored.flags.mixerBroken && restored.inventory.includes("sparePart"));
    if (stage === "mixer") assert.ok(restored.inventory.includes("mixer") && game.availableTopics(restored, "tato").some(([topic]) => topic === "transport"));
    if (stage === "fixed") assert.ok(restored.flags.waterFixed && restored.flags.bearSafe);
    assert.deepEqual(game.restore(JSON.stringify(restored)), restored);
  }
});

test("po oprave staré uloženie nehľadá znovu miešačku", () => {
  const saved = game.createState();
  Object.assign(saved.flags, { waterFixed: true, drain: true, journalFound: true, pubOpen: true, tracks: true, bootMatched: true });
  const restored = game.restore(JSON.stringify(saved));
  assert.match(game.hint(restored), /Vypýtaj.*naberačku/);
  assert.ok(restored.flags.equipmentReturned);
});

test("naberačka sa dá vypýtať až po porovnaní odliatku s lesníkovou topánkou", () => {
  const state = game.createState();
  state.location = "spring";
  Object.assign(state.flags, { bearSafe: true, drain: true, transport: true, tracks: true });
  state.inventory.push("plan", "mixer", "footprint");
  const visible = () => game.availableTopics(state, "ondrej").some(([topic]) => topic === "ladletruth");
  const repair = game.interact(state, { type: "object", target: "repair" }).text;
  assert.doesNotMatch(repair, /sľúbenú/);
  assert.ok(state.flags.waterFixed && state.flags.equipmentReturned && !visible());
  game.interact(state, { type: "talk", target: "ondrej", topic: "ladletruth" });
  assert.ok(!state.inventory.includes("ladle"));
  const comparison = game.interact(state, { type: "talk", target: "ondrej", topic: "compareBoot" }).text;
  assert.match(comparison, /už opravený/);
  assert.ok(visible());
  game.interact(state, { type: "talk", target: "ondrej", topic: "ladletruth" });
  assert.ok(state.inventory.includes("ladle"));
});

test("dialogy v dielni a u psa zodpovedajú postupu", () => {
  const state = game.createState();
  state.location = "cousin";
  assert.match(game.interact(state, { type: "object", target: "tools" }).text, /nepotrebujem ísť/);
  assert.match(game.interact(state, { type: "object", target: "dog" }).text, /nebudem približovať/);
  state.flags.mixerBroken = true;
  assert.match(game.interact(state, { type: "talk", target: "husband", topic: "sparePart" }).text, /najprv ho zavriem/);
  assert.ok(game.availableTopics(state, "husband").some(([topic]) => topic === "tools"));
  game.interact(state, { type: "talk", target: "husband", topic: "tools" });
  assert.ok(!game.availableTopics(state, "husband").some(([topic]) => topic === "tools"));
});

test("celý prípad sa dá vyriešiť bez spotrebovania nevyhnutných predmetov", () => {
  const state = game.createState();
  const go = target => game.interact(state, { type: "travel", target });
  const use = (target, item, answer) => game.interact(state, { type: "object", target, item, answer });
  const talk = (target, topic) => game.interact(state, { type: "talk", target, topic });
  go("well"); use("hatch"); use("water");
  go("field"); use("poster"); talk("simona", "recording"); talk("fifko", "ladle");
  go("nursery"); use("fence");
  go("field"); talk("fifko", "fenceReport");
  go("flats"); talk("lida", "witness");
  go("field"); talk("fifko", "verdict");
  go("bednari"); talk("betka", "consent");
  go("cabin"); use("phone");
  go("field"); talk("simona", "returnPhone"); talk("simona", "edit");
  go("pub"); use("notice");
  go("tower"); use("melody");
  go("forest"); use("tracks");
  go("shop"); use("shelf"); talk("kika", "chalk"); talk("kika", "chalk");
  assert.equal(state.inventory.filter(item => item === "chalk").length, 1);
  go("forest"); use("tracks", "chalk");
  go("spring"); talk("warden", "entry");
  go("bus"); talk("peter", "brno");
  talk("peter", "permission"); assert.ok(!state.flags.bearSafe);
  go("school"); talk("teacher", "route");
  go("bus"); use("timetable", "route", "8:10"); assert.ok(!state.flags.routeChecked);
  use("timetable", "route", "6:45"); talk("peter", "itinerary"); talk("peter", "permission");
  go("spring"); talk("ondrej", "compareBoot"); talk("ondrej", "explain");
  assert.ok(state.flags.bootMatched && state.flags.ladleSpotted);
  assert.ok(!state.flags.drain && !state.inventory.includes("ladle"));
  go("home"); talk("mama", "repairLead");
  assert.ok(state.flags.repairLead);
  go("office"); talk("mayor", "key");
  assert.ok(state.flags.pubCodeKnown && !state.inventory.includes("key"));
  go("school"); talk("teacher", "math");
  go("church"); use("bells");
  go("pub"); use("door", null, "224");
  assert.ok(!state.flags.pubOpen && !state.inventory.includes("journal"));
  use("door", null, "225");
  assert.ok(state.inventory.includes("journal") && state.inventory.includes("plan"));
  go("spring"); talk("ondrej", "explain");
  assert.ok(state.flags.drain);
  go("mixer"); talk("michacka", "loan");
  assert.ok(!state.inventory.includes("mixer"));
  go("cousin"); talk("cousin", "sparePart"); talk("husband", "secure"); use("tools");
  go("mixer"); talk("michacka", "loan");
  go("spring"); use("repair"); assert.ok(!state.flags.waterFixed);
  go("home"); talk("tato", "transport");
  go("spring");
  use("repair"); talk("ondrej", "ladletruth");
  go("field"); talk("fifko", "returnLadle"); assert.equal(state.finished, false);
  go("well"); use("water");
  assert.ok(state.flags.equipmentReturned);
  assert.ok(!state.flags.festivalReady);
  go("field"); talk("fifko", "returnLadle"); assert.equal(state.finished, false);
  go("home");
  game.interact(state, { type: "object", target: "piano", answer: "EGA", festivalAttempt: true });
  go("field"); const ending = talk("fifko", "returnLadle"); assert.equal(state.finished, true);
  assert.match(ending.text, /NG zahrala s kapelou/);
  assert.match(ending.text, /hipsterská kaviareň/);
  assert.match(ending.text, /výberová káva/);
  assert.doesNotMatch(ending.text, /matcha|strech/i);
  assert.equal(game.quests(state).length, 5);
  assert.ok(game.quests(state).every(quest => quest.done));
  assert.ok(state.flags.waterFixed && state.flags.bearSafe && state.flags.wellChecked);
  assert.deepEqual(game.restore(JSON.stringify(state)), state);
});

test("miestne podmienky a podmienky postupu nemožno preskočiť", () => {
  const state = game.createState();
  game.interact(state, { type: "talk", target: "mayor", topic: "key" });
  assert.ok(!state.inventory.includes("key"));
  game.interact(state, { type: "travel", target: "spring" });
  assert.equal(state.location, "spring");
  game.interact(state, { type: "object", target: "repair" });
  assert.ok(!state.flags.waterFixed);
  game.interact(state, { type: "travel", target: "pub" });
  game.interact(state, { type: "object", target: "box", answer: "225" });
  assert.ok(!state.inventory.includes("journal"));
});

test("neplatné uloženia sa obnovia a popisy pokrývajú každé miesto", () => {
  for (const value of ["{", "null", {}, { version: 1, location: "missing" }]) assert.deepEqual(game.restore(value), game.createState());
  for (const place of game.places) {
    for (const person of place.people) assert.ok(game.people[person]);
    for (const object of place.objects) assert.ok(game.objects[object]);
  }
  assert.ok(game.hint(game.createState()).includes("studňu"));
});

test("slovenské názvy a rodinné detaily zostávajú zachované", () => {
  assert.equal(game.people.mama.name, "Mama");
  assert.equal(game.people.tato.name, "Tato");
  assert.equal(game.items.chalk.name, "Sadra");
  assert.equal(game.items.key.name, "Kľúč od krčmy");
  assert.equal(game.items.ladle.name, "Slávnostná naberačka");
  assert.equal(game.objects.suv[0], "Tatovo SUV");
  const suvState = game.createState();
  assert.match(game.interact(suvState, { type: "object", target: "suv" }).text, /nemám rada.*stanicu do Púchova.*výnimka.*prižmúrim oči/);
  assert.match(game.places.find(place => place.id === "home").sub, /hneď vedľa materskej školy/i);
  assert.match(game.places.find(place => place.id === "flats").sub, /pri hlavnej ceste, neďaleko školy/i);
  assert.match(game.people.cousin.role, /protiľahlom kopci/);
  assert.match(game.people.tato.role, /Breznice.*SUV/);
  const state = game.createState();
  const talk = (target, topic) => game.interact(state, { type: "talk", target, topic }).text;
  const go = target => game.interact(state, { type: "travel", target });
  assert.match(talk("mama", "case"), /S tatom.*cigarete/);
  assert.match(talk("tato", "breznice"), /z Breznice/);
  go("school");
  assert.match(talk("teacher", "olympiad"), /matematickej olympiáde.*klavíri/);
  go("cousin");
  state.flags.mixerBroken = true;
  assert.match(talk("cousin", "sparePart"), /bojíš psa/);
  go("bus");
  assert.match(game.people.peter.role, /Brno/);
  assert.match(talk("peter", "brno"), /pozvanie na pohovor.*o 12:30/);
  assert.ok(state.flags.brnoStarted);
  go("field");
  game.interact(state, { type: "object", target: "poster" });
  assert.ok(state.clues.some(clue => /festival.*je na ihrisku/.test(clue)));
  assert.equal(game.hint(game.createState()), "Mama chcela skontrolovať studňu za domom.");
});

test("mapa zachováva vzťahy z troch dodaných podkladov", () => {
  const place = id => game.places.find(value => value.id === id);
  assert.ok(place("home").y < place("nursery").y);
  assert.ok(place("school").x < place("nursery").x);
  assert.ok(place("field").x < place("school").x);
  assert.ok(Math.hypot(place("flats").x - place("school").x, place("flats").y - place("school").y) < 9);
  assert.ok(place("shop").y < place("office").y);
  assert.ok(place("church").x > place("nursery").x);
  assert.ok(place("bus").x > place("flats").x);
  assert.ok(place("bus").x < place("office").x);
  assert.equal(place("bus").y, place("office").y);
  assert.ok(place("cousin").x > place("bus").x);
  assert.ok(place("bednari").x < place("school").x);
  assert.deepEqual(place("bednari").people, ["betka"]);
  assert.ok(place("mixer").x < place("school").x);
  assert.match(place("mixer").sub, /Bednári/);
  assert.deepEqual(place("mixer").people, ["michacka"]);
  assert.ok(place("tower").x > 80 && place("tower").y < 30);
  assert.ok(place("spring").x < 10 && place("spring").y > 40);
});

test("studňu možno skontrolovať iba s otvoreným poklopom", () => {
  const state = game.createState();
  game.interact(state, { type: "travel", target: "well" });
  game.interact(state, { type: "object", target: "hatch" });
  assert.equal(state.flags.wellOpen, true);
  game.interact(state, { type: "object", target: "hatch" });
  assert.equal(state.flags.wellOpen, false);
  assert.match(game.interact(state, { type: "object", target: "water" }).text, /Najprv musím otvoriť poklop/);
  assert.ok(!state.flags.wellOpen && !state.flags.dry && !state.flags.wellChecked);
  state.flags.waterFixed = true;
  assert.match(game.interact(state, { type: "object", target: "water" }).text, /Najprv musím otvoriť poklop/);
  assert.ok(!state.flags.wellChecked && !state.flags.dry);
  game.interact(state, { type: "object", target: "hatch" });
  game.interact(state, { type: "object", target: "water" });
  assert.ok(state.flags.wellOpen && state.flags.dry && state.flags.wellChecked);
});

test("mikropríbehy vyžadujú dôkazy, súhlas a správneho partnera", () => {
  const state = game.createState();
  const go = target => game.interact(state, { type: "travel", target });
  const talk = (target, topic) => game.interact(state, { type: "talk", target, topic });
  const use = target => game.interact(state, { type: "object", target });
  go("field"); talk("fifko", "ladle"); talk("fifko", "verdict");
  assert.ok(!state.flags.fifkoCleared);
  go("nursery"); use("fence");
  go("field"); talk("fifko", "verdict"); assert.ok(!state.flags.fifkoCleared); talk("fifko", "fenceReport");
  talk("simona", "recording"); talk("simona", "edit"); assert.ok(!state.flags.recording);
  go("cabin"); use("phone");
  go("field"); talk("simona", "returnPhone");
  go("field"); talk("simona", "edit"); assert.ok(!state.flags.recording);
  go("bednari"); talk("betka", "consent");
  go("field"); talk("simona", "edit"); assert.ok(state.flags.recording);
  go("flats"); talk("lida", "witness");
  go("field"); talk("fifko", "verdict"); assert.ok(state.flags.fifkoCleared);
  talk("fifko", "secure"); assert.ok(!state.flags.dogSafe);
  assert.deepEqual(game.quests(game.restore(JSON.stringify(state))), game.quests(state));
});

test("telefón je samostatný, skorý nález neodhalí majiteľku a súhlas funguje v oboch poradiach", () => {
  for (const earlyPhone of [false, true]) {
    for (const consentFirst of [false, true]) {
      const state = game.createState();
      const go = target => game.interact(state, { type: "travel", target });
      const talk = (target, topic) => game.interact(state, { type: "talk", target, topic });
      const take = () => game.interact(state, { type: "object", target: "phone" });
      const visible = (person, topic) => game.availableTopics(state, person).some(([id]) => id === topic);
      go("cabin");
      const memory = game.interact(state, { type: "object", target: "cabinMemory" });
      assert.match(memory.text, /s kamarátmi pili alkohol/);
      assert.doesNotMatch(memory.text, /spojk/);
      assert.doesNotMatch(memory.text, /notami|E–G|rozmazaná/);
      assert.ok(!state.inventory.includes("phone") && !state.inventory.includes("rehearsal"));
      if (earlyPhone) {
        assert.doesNotMatch(take().text, /Simon/i);
        take();
        assert.equal(state.inventory.filter(item => item === "phone").length, 1);
      }
      go("bednari"); talk("betka", "consent");
      assert.ok(!state.flags.audioConsent && !visible("betka", "consent"));
      go("field"); talk("simona", "returnPhone");
      assert.ok(!state.flags.phoneReturned && !visible("simona", "returnPhone"));
      assert.ok(!state.flags.festival && visible("simona", "recording"));
      const intro = talk("simona", "recording");
      assert.ok(!visible("simona", "recording"));
      assert.match(intro.text, /Dohňany/);
      assert.match(intro.text, /Ozaj a prečo ju nezastúpiš ty/);
      assert.match(intro.text, /Ja hrám hádzanú/);
      assert.ok(visible("betka", "consent"));
      if (consentFirst) { go("bednari"); talk("betka", "consent"); }
      go("field"); talk("simona", "edit");
      assert.ok(!state.flags.recording && !visible("simona", "edit"));
      if (!earlyPhone) { go("cabin"); assert.match(take().text, /Simonin/); }
      go("field");
      assert.ok(visible("simona", "returnPhone"));
      talk("simona", "returnPhone");
      assert.ok(state.flags.phoneReturned && !game.activeInventory(state).includes("phone"));
      if (!consentFirst) {
        talk("simona", "edit"); assert.ok(!state.flags.recording);
        go("bednari"); talk("betka", "consent"); go("field");
      }
      assert.ok(visible("simona", "edit"));
      talk("simona", "edit"); talk("simona", "edit");
      assert.ok(state.flags.recording && state.flags.audioConsent);
      assert.equal(state.inventory.filter(item => item === "audioTrack").length, 1);
      assert.ok(!state.inventory.includes("video") && !visible("simona", "edit"));
      assert.doesNotMatch(game.items.audioTrack.description, /E.?G.?A/);
      go("cabin"); take();
      assert.equal(state.inventory.filter(item => item === "phone").length, 1);
      game.interact(state, { type: "object", target: "cabinMemory" });
      assert.ok(!state.inventory.includes("sparePart"));
    }
  }
});

test("voľná hra nikdy nehodnotí EGA, iba výslovný festivalový pokus s nahrávkou", () => {
  const state = game.createState();
  const play = extra => game.interact(state, { type: "object", target: "piano", answer: "EGA", ...extra });
  play(); play({ festivalAttempt: true });
  assert.ok(!state.flags.festivalReady);
  state.inventory.push("audioTrack");
  play(); play({ festivalAttempt: "true" });
  assert.ok(!state.flags.festivalReady);
  for (const answer of ["CEG", "EG", "EGAA", "", undefined]) {
    assert.equal(play({ festivalAttempt: true, answer }).text, "To nebolo ono. Skúsim to znova.");
    assert.ok(!state.flags.festivalReady);
  }
  play(); assert.ok(!state.flags.festivalReady);
  assert.equal(play({ festivalAttempt: true }).text, "A mám to! Som pripravená vystúpiť na festivale.");
  assert.ok(state.flags.festivalReady && !state.flags.musicSolved);
  assert.ok(!state.inventory.includes("plan") && !state.inventory.includes("notes") && !state.inventory.includes("journal"));
  const clues = state.clues.slice();
  play({ festivalAttempt: true }); play();
  assert.deepEqual(state.clues, clues);
  assert.ok(game.activeInventory(state).includes("audioTrack"));
});

test("Lyda svedčí až po rozhovore s Fifkom a neidentifikuje chodca", () => {
  const state = game.createState();
  state.location = "flats";
  const visible = () => game.availableTopics(state, "lida").some(([topic]) => topic === "witness");
  for (const ladleTip of [false, true]) {
    state.flags.ladleTip = ladleTip;
    assert.ok(!visible());
    game.interact(state, { type: "talk", target: "lida", topic: "witness" });
    assert.ok(!state.flags.witness && !state.clues.length);
  }
  state.flags.fenceChecked = true;
  assert.ok(!visible());
  state.location = "field";
  game.interact(state, { type: "talk", target: "fifko", topic: "fenceReport" });
  state.location = "flats";
  assert.ok(visible());
  const reply = game.interact(state, { type: "talk", target: "lida", topic: "witness" });
  assert.match(reply.text, /neznámy človek.*od festivalu cez škôlku.*lesnému rázcestiu.*vysoké topánky.*tvár som nevidela/i);
  assert.doesNotMatch(reply.text, /neviem, kto to bol|Motor z cesty|čo presne Fifko videl/);
  assert.doesNotMatch(reply.text, /krčm/i);
  assert.doesNotMatch(reply.text + state.clues.join(), /lesník/i);
  assert.ok(state.flags.witness && !visible());
});

test("zamknutý prameň má viditeľného neprístupného lesníka a priame akcie ani starý kontakt ho neobídu", () => {
  const state = game.createState();
  state.location = "spring";
  Object.assign(state.flags, { tracks: true, journalFound: true, contact: true, brnoReady: true, transport: true, drain: true });
  state.inventory.push("footprint", "plan", "mixer", "pump");
  assert.deepEqual(game.scene(state).people, ["warden"]);
  assert.deepEqual(game.scene(state).visiblePeople, ["warden", "ondrej"]);
  assert.deepEqual(game.scene(state).personPositions, { warden: [140, 480], ondrej: [700, 445] });
  assert.deepEqual(game.scene(state).objects, []);
  assert.deepEqual(game.scene(state).entry, { x: 65, y: 494 });
  const before = JSON.parse(JSON.stringify(state));
  for (const topic of ["compareBoot", "explain", "ladletruth"]) game.interact(state, { type: "talk", target: "ondrej", topic });
  for (const target of ["channel", "repair"]) game.interact(state, { type: "object", target });
  assert.ok(game.availableTopics(state, "warden").some(([topic]) => topic === "compareBoot"));
  game.interact(state, { type: "talk", target: "warden", topic: "compareBoot" });
  assert.ok(state.flags["compared:warden"]);
  delete state.flags["compared:warden"];
  assert.deepEqual(state, before);
  assert.deepEqual(game.availableTopics(state, "warden").map(([topic]) => topic), ["compareBoot"]);
  state.location = "bus";
  for (const topic of ["contact", "callForest", "permission"]) game.interact(state, { type: "talk", target: "peter", topic });
  assert.ok(!state.flags.bearSafe && !state.flags.wardenMet);
});

test("Peter vybaví povolenie v oboch poradiach Brna bez ďalších stôp a iba raz", () => {
  for (const brnoFirst of [false, true]) {
    const state = game.createState();
    const go = target => game.interact(state, { type: "travel", target });
    const talk = (target, topic) => game.interact(state, { type: "talk", target, topic });
    const finishBrno = () => {
      go("bus"); talk("peter", "brno");
      go("school"); talk("teacher", "route");
      go("bus"); game.interact(state, { type: "object", target: "timetable", item: "route", answer: "6:45" });
      talk("peter", "itinerary");
    };
    if (brnoFirst) finishBrno();
    go("spring");
    assert.ok(game.scene(state).locked);
    assert.match(talk("warden", "entry").text, /pohraničná zóna.*Čehúni.*českým susedom.*poznáš Petra.*Brna/);
    assert.ok(state.flags.wardenMet && !state.flags.bearSafe);
    go("bus");
    assert.ok(game.availableTopics(state, "peter").some(([topic]) => topic === "permission"));
    if (!brnoFirst) {
      const reply = talk("peter", "permission");
      assert.match(reply.text, /^NG: Peter, nepoznáš sa náhodou s colníkom\?.*fakt potrebujem dostať.*prihovoriť\?.*najprv mi pomôž/);
      assert.ok(!state.flags.bearSafe);
      assert.ok(game.availableTopics(state, "peter").some(([topic]) => topic === "permission"));
      finishBrno();
    }
    const reply = talk("peter", "permission");
    assert.match(reply.text, /^NG: Peter, nepoznáš sa náhodou s colníkom\?.*Predtým si pomohla ty mne.*vytáča colníka.*NG poznám.*Zaručím sa za ňu.*Colník:.*povolenie/);
    assert.ok(state.flags.bearSafe && !state.flags.tracks && !state.flags.fifkoCleared && !state.flags.contact);
    const clues = state.clues.slice();
    talk("peter", "permission");
    assert.deepEqual(state.clues, clues);
    assert.ok(!game.availableTopics(state, "peter").some(([topic]) => topic === "permission"));
    go("spring");
    assert.deepEqual(game.scene(state).people, ["ondrej"]);
    assert.deepEqual(game.scene(state).visiblePeople, ["ondrej"]);
    assert.deepEqual(game.scene(state).objects, ["channel", "repair"]);
    assert.ok(!game.scene(state).locked && !game.scene(state).entry);
    assert.deepEqual(game.restore(state), state);
  }
});

test("staré povolenie a dokončené opravy ostanú otvorené, samotné Brno nie", () => {
  for (const flag of ["bearSafe", "waterFixed", "finished", "brnoReady", "bootMatched", "journalFound", "contact"]) {
    const legacy = game.createState();
    legacy.location = "spring";
    if (flag === "finished") legacy.finished = true;
    else legacy.flags[flag] = true;
    const restored = game.restore(JSON.stringify(legacy));
    assert.equal(game.scene(restored).locked, !["bearSafe", "waterFixed", "finished"].includes(flag), flag);
    assert.deepEqual(game.restore(restored), restored);
  }
});

test("vstup dá plán bez hudby a obnova starých uložení nepreskočí nové vystúpenie", () => {
  const state = game.createState();
  state.location = "pub"; state.flags.pubOpen = true;
  game.interact(state, { type: "object", target: "door" });
  game.interact(state, { type: "object", target: "door" });
  assert.equal(state.inventory.filter(item => item === "plan").length, 1);
  assert.ok(state.inventory.includes("journal") && !state.flags.festivalReady && !state.flags.recording);
  state.location = "spring";
  Object.assign(state.flags, { bearSafe: true, bootMatched: true, drain: true, transport: true });
  state.inventory.push("mixer", "pump");
  game.interact(state, { type: "object", target: "repair" });
  assert.ok(state.flags.waterFixed && !state.flags.festivalReady);
  for (const recording of [false, true]) {
    for (const musicSolved of [false, true]) {
      const legacy = game.createState();
      legacy.inventory.push("journal", "rehearsal");
      Object.assign(legacy.flags, { recording, musicSolved });
      const restored = game.restore(JSON.stringify(legacy));
      assert.ok(restored.inventory.includes("plan") && !restored.flags.festivalReady);
      assert.ok(!game.activeInventory(restored).includes("rehearsal"));
      assert.equal(restored.inventory.includes("audioTrack"), recording);
      if (recording) {
        assert.ok(restored.flags.recordingAsked && restored.flags.phoneReturned && restored.flags.audioConsent);
        game.interact(restored, { type: "object", target: "piano", answer: "EGA", festivalAttempt: true });
        assert.ok(restored.flags.festivalReady);
      }
      assert.deepEqual(game.restore(restored), restored);
      legacy.finished = true;
      assert.equal(game.restore(legacy).finished, true);
    }
  }
});