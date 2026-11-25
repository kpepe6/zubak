(function () {
  "use strict";
  const game = globalThis.Zubak;
  const storageKey = "zubak-adventure-v1";
  const recordKeys = ["zubak-bike-records-v1", "zubak-goulash-records-v1", "zubak-scores-queue-v1", "zubak-scores-uploaded-v1"];
  const byId = id => document.getElementById(id);
  let state = game.createState();
  let saveAvailable = true;
  try { const saved = localStorage.getItem(storageKey); if (saved) state = game.restore(saved); } catch { saveAvailable = false; }
  let mapVisible = true;
  let selectedItem = null;
  let activePerson = null;
  let kettleSelected = false;
  let pendingInteraction = null;
  let sound = true;
  let audio = null;
  let effectSources = [];
  let lastChurchBell = 0;
  let musicSources = [];
  let playbackGeneration = 0;
  let bikeActive = false;
  let goulashActive = false;
  const pianoFrequencies = { C: 261.63, "C#": 277.18, D: 293.66, "D#": 311.13, E: 329.63, F: 349.23, "F#": 369.99, G: 392, "G#": 415.30, A: 440, "A#": 466.16, H: 493.88 };
  const player = { x: 560, y: 476, targetX: 560, targetY: 476, walking: false };
  const modal = byId("modal");
  const heldItem = document.createElement("div");
  heldItem.className = "held-item"; heldItem.hidden = true; heldItem.setAttribute("aria-hidden", "true");
  document.body.append(heldItem);
  let scenePointer = null;
  const icons = {
    book: '<path d="M4 3h14v18H4zM7 3v18M10 7h5M10 11h5"/>',
    chalk: '<path d="M5 8h14l-2 13H7zM8 8V5a4 4 0 0 1 8 0v3M9 13h6M12 10v6"/>',
    key: '<circle cx="8" cy="8" r="4"/><path d="m11 11 9 9M16 16l3-3M18 18l3-3"/>',
    note: '<path d="M5 3h11l4 4v14H5zM16 3v5h4M8 12h9M8 16h6"/>',
    music: '<path d="M9 17V5l11-2v12M9 8l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="17" cy="16" rx="3" ry="2"/>',
    map: '<path d="m3 5 6-2 6 3 6-2v16l-6 2-6-3-6 2zM9 3v16M15 6v16"/>',
    mixer: '<path d="m5 7 9-4 6 6-7 6-8-3zM10 15l-4 6M16 13l4 8M7 18h11"/>',
    pump: '<path d="M5 8h13v11H5zM8 8V4h7v4M18 12h3v7M2 19h19M8 12h7"/>',
    ladle: '<path d="M16 3v11M12 14h8v3a4 4 0 0 1-8 0zM16 3h4"/>'
  };
  function button(label, handler, className = "") {
    const element = document.createElement("button"); element.type = "button"; element.textContent = label; element.className = className; element.addEventListener("click", handler); return element;
  }
  function paragraph(text, className = "") { const element = document.createElement("p"); element.textContent = text; element.className = className; return element; }
  function renderHeldItem() {
    const item = game.items[selectedItem];
    heldItem.hidden = !item || !scenePointer || mapVisible || modal.open || byId("intro").open;
    if (heldItem.hidden) return;
    heldItem.innerHTML = `<svg viewBox="0 0 24 24">${icons[item.icon] || icons.note}</svg>`;
    heldItem.style.left = `${scenePointer.x}px`; heldItem.style.top = `${scenePointer.y}px`;
  }
  function tone(note = "C", duration = .25) {
    if (!sound) return;
    try {
      audio ??= new (globalThis.AudioContext || globalThis.webkitAudioContext)();
      if (audio.state === "suspended") audio.resume();
      const oscillator = audio.createOscillator(); const volume = audio.createGain();
      oscillator.type = "triangle"; oscillator.frequency.value = { C: 261.63, D: 293.66, E: 329.63, F: 349.23, G: 392, A: 440, H: 493.88 }[note] || 261.63;
      volume.gain.setValueAtTime(.055, audio.currentTime); volume.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
      oscillator.connect(volume); volume.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + duration);
    } catch { setSound(false); }
  }
  function stopEffects() {
    effectSources.forEach(source => { try { source.stop(); } catch {} });
    effectSources = [];
  }
  function setSound(enabled) {
    sound = enabled;
    const toggle = byId("sound-button");
    toggle.setAttribute("aria-pressed", String(sound));
    const label = sound ? "Vypnúť zvuk" : "Zapnúť zvuk";
    toggle.title = label; toggle.setAttribute("aria-label", label);
    if (!sound) { stopEffects(); stopMusic(); }
  }
  function playEffect(kind) {
    if (!sound) return;
    try {
      audio ??= new (globalThis.AudioContext || globalThis.webkitAudioContext)();
      if (audio.state === "suspended") audio.resume();
      stopEffects();
      const start = audio.currentTime + .01;
      const note = (frequency, offset, duration, level, type = "sine") => {
        const oscillator = audio.createOscillator();
        const envelope = audio.createGain();
        const onset = start + offset;
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, onset);
        envelope.gain.setValueAtTime(.0001, onset);
        envelope.gain.linearRampToValueAtTime(level, onset + .01);
        envelope.gain.exponentialRampToValueAtTime(.0001, onset + duration);
        oscillator.connect(envelope); envelope.connect(audio.destination);
        effectSources.push(oscillator);
        oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); effectSources = effectSources.filter(source => source !== oscillator); };
        oscillator.start(onset); oscillator.stop(onset + duration);
      };
      const noise = (offset, duration, level, cutoff) => {
        const buffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * duration), audio.sampleRate);
        const samples = buffer.getChannelData(0);
        for (let index = 0; index < samples.length; index++) samples[index] = Math.random() * 2 - 1;
        const source = audio.createBufferSource(); const filter = audio.createBiquadFilter(); const envelope = audio.createGain();
        source.buffer = buffer; filter.type = "lowpass"; filter.frequency.value = cutoff;
        const onset = start + offset;
        envelope.gain.setValueAtTime(.0001, onset); envelope.gain.linearRampToValueAtTime(level, onset + .025);
        envelope.gain.exponentialRampToValueAtTime(.0001, onset + duration);
        source.connect(filter); filter.connect(envelope); envelope.connect(audio.destination);
        effectSources.push(source);
        source.onended = () => { source.disconnect(); filter.disconnect(); envelope.disconnect(); effectSources = effectSources.filter(item => item !== source); };
        source.start(onset); source.stop(onset + duration);
      };
      if (kind === "item") { note(880, 0, .13, .018); note(1175, .07, .16, .012); }
      if (kind === "clue") noise(0, .16, .016, 1800);
      if (kind === "lockOpen") { note(640, 0, .06, .016, "triangle"); note(410, .08, .1, .014, "triangle"); }
      if (kind === "lockWrong") note(170, 0, .09, .012, "triangle");
      if (kind === "quest") { note(440, 0, .18, .014); note(554, .14, .18, .014); note(659, .28, .25, .014); }
      if (kind === "repair") { note(260, 0, .08, .014, "triangle"); note(340, .12, .08, .012, "triangle"); noise(.25, .85, .018, 700); }
      if (kind === "bear") { noise(0, .42, .035, 260); note(78, .02, .38, .025, "sawtooth"); }
      if (kind === "hatch") { noise(0, .48, .024, 900); note(190, .02, .42, .014, "sawtooth"); }
      if (kind === "suv") { note(68, 0, .42, .04, "sawtooth"); note(104, .12, .32, .018, "triangle"); }
      if (kind === "bell") { note(784, 0, 1.15, .022); note(1175, .015, .85, .009); }
      if (kind === "crash") { noise(0, .22, .04, 1100); note(120, .01, .19, .035, "triangle"); }
    } catch { stopEffects(); }
  }
  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(state)); byId("save-status").textContent = "Postup uložený"; saveAvailable = true; }
    catch { saveAvailable = false; byId("save-status").textContent = "Ukladanie nie je dostupné"; }
  }
  function clearSavedData() {
    try { [storageKey, ...recordKeys].forEach(key => localStorage.removeItem(key)); saveAvailable = true; return true; }
    catch { saveAvailable = false; return false; }
  }
  function resetEverything() {
    const cleared = clearSavedData();
    state = game.createState();
    mapVisible = true; selectedItem = null; activePerson = null; kettleSelected = false; pendingInteraction = null;
    closeModal();
    render();
    byId("save-status").textContent = cleared ? "Uložená hra a rekordy vymazané" : "Ukladanie nie je dostupné";
    showIntro();
  }
  function stopMusic() {
    playbackGeneration++;
    musicSources.forEach(source => { try { source.stop(); } catch {} });
    musicSources = [];
  }
  async function playPianoNotes(notes, replace = true) {
    if (replace) stopMusic();
    const generation = playbackGeneration;
    try {
      audio ??= new (globalThis.AudioContext || globalThis.webkitAudioContext)();
      await audio.resume();
      if (generation !== playbackGeneration) return;
      const start = audio.currentTime + .025;
      notes.forEach((note, index) => {
        [1, 2, 3].forEach((harmonic, partial) => {
          const oscillator = audio.createOscillator();
          const envelope = audio.createGain();
          const onset = start + index * .65;
          oscillator.type = "sine";
          oscillator.frequency.value = pianoFrequencies[note] * harmonic;
          envelope.gain.setValueAtTime(0, onset);
          envelope.gain.linearRampToValueAtTime([.16, .045, .018][partial], onset + .008);
          envelope.gain.exponentialRampToValueAtTime(.0001, onset + .95);
          oscillator.connect(envelope); envelope.connect(audio.destination);
          musicSources.push(oscillator);
          oscillator.onended = () => {
            oscillator.disconnect(); envelope.disconnect();
            musicSources = musicSources.filter(source => source !== oscillator);
          };
          oscillator.start(onset); oscillator.stop(onset + 1);
        });
      });
    } catch {
      speak({ text: "Zvuk sa nepodarilo spustiť. Skontroluj zvuk prehliadača a skús to znova." });
    }
  }
  function playRecording() { return playPianoNotes(["E", "G", "A"]); }
  function speak(result) {
    byId("speaker").textContent = result.speaker || "NG";
    const names = ["NG", ...Object.values(game.people).map(person => person.name), "Sesternica", "Manžel", "Učiteľka"];
    const turns = result.text.split(new RegExp(`\\s+(?=(?:${names.join("|")}):)`, "u"));
    const speech = byId("speech");
    speech.replaceChildren();
    turns.forEach((turn, index) => {
      if (index) speech.append(document.createElement("br"));
      speech.append(document.createTextNode(turn));
    });
  }
  function openModal(title, build) { cancelApproach(); byId("modal-title").textContent = title; byId("modal-content").replaceChildren(); build(byId("modal-content")); if (!modal.open) modal.showModal(); renderHeldItem(); }
  function closeModal() { stopMusic(); modal.close(); }
  modal.addEventListener("close", stopMusic);
  function showIntro() {
    const opening = game.createState(); opening.location = "pub";
    globalThis.ZubakArt.draw(opening, false, 0, player);
    byId("intro").style.backgroundImage = `url("${byId("scene").toDataURL("image/png")}")`;
    byId("intro-continue").hidden = state.finished || !game.hasProgress(state);
    byId("intro-finale").hidden = !state.finished;
    byId("intro").showModal();
  }
  function startStory() {
    state = game.createState();
    state.flags.introSeen = true;
    byId("intro").close();
    travel("home");
    speak({ speaker: "NG", text: "Najprv zistím, čo vie mama, a pozriem sa na studňu v lese za domom. Potom zájdem na ihrisko. Klebety si zapíšem, ale za dôkazy ich vydávať nebudem." });
  }
  function continueStory() {
    if (state.finished) return;
    byId("intro").close();
    mapVisible = true;
    render();
    speak(state.moves || state.clues.length ? { text: game.hint(state), speaker: "NG · pokračujeme" } : { text: "Začnem doma a potom sa pozriem na studňu a gulášfest.", speaker: "NG" });
  }
  function journal() {
    openModal("Denník NG", content => {
      content.append(paragraph(`${state.clues.length} stôp • ${state.visited.length} navštívených miest`, "muted"));
      const quests = game.quests(state);
      quests.forEach(quest => {
        content.append(paragraph(`${quest.done ? "VYRIEŠENÉ" : "ROZPRACOVANÉ"} / ${quest.title}`, "journal-entry"));
        if (!quest.done) content.append(paragraph(quest.next));
      });
      if (!quests.length) content.append(paragraph("Zatiaľ čistá stránka. Začnem studňou za domom a festivalom na ihrisku."));
      content.append(button("Čo teraz?", () => { closeModal(); showHint(); }));
    });
  }
  function showHint() { speak({ text: game.hint(state), speaker: "NG · ďalšia stopa" }); }
  function showSources() {
    openModal("O príbehu a miestach", content => {
      content.append(paragraph("Rozmiestnenie centra vychádza z troch dodaných máp: dom NG severne od materskej školy, základná škola a športoviská na západe, COOP nad cestou, úrad pod cestou, kostol a zastávka Hostinec na východe. Kultúrny dom a kaplnka pri Bednári sú orientačné body. Vzdialenosti sú skrátené; presný dom sesternice, Miešačky, chatku a budovu krčmy podklady neurčujú."));
      content.append(paragraph("Žrnová, Kýčera a Sirková voda vychádzajú z verejných miestopisných podkladov. Obecný web uvádza aj rozhľadňu nad obcou Dohňany; obľúbená rozhľadňa NG je tu herne priblížená. Nie je to navigačná mapa."));
      content.append(paragraph("Príbeh spája rodinu, priateľov a gulášfest na ihrisku. NG pátra po slávnostnej naberačke a pomáha s opravou žliabka pri Sirkovej vode."));
      const list = document.createElement("ul");
      [["Oficiálny web obce Zubák", "https://www.obeczubak.sk/"], ["Zubák – miestopis", "https://sk.wikipedia.org/wiki/Zub%C3%A1k_(obec)"], ["Kostol sv. Vendelína – história a zvony", "https://www.pamiatkynaslovensku.sk/zubak-kostol-sv-vendelina"]].forEach(([label, url]) => { const entry = document.createElement("li"); const link = document.createElement("a"); link.textContent = label; link.href = url; link.target = "_blank"; link.rel = "noopener noreferrer"; entry.append(link); list.append(entry); });
      content.append(list, paragraph("Historický podklad: stavba kostola od roku 1806 a rekvirácia dvoch zvonov v roku 1915.", "muted"));
    });
  }
  function walkthrough() {
    openModal("Kompletný návod (spoilery)", content => {
      const steps = [
        ["Začiatok doma a studňa", "Doma klikni na mamu a vyber Čo sa dnes deje? Na mape choď k Studni za domom, otvor poklop a klikni na Pozrieť sa do studne. Tým zistíš, že chýba voda."],
        ["Ihrisko a gulášfest", "Na ihrisku prezri Program gulášfestu. Klikni na Fifka a opýtaj sa: „Nevidel si slávnostnú naberačku?“ Simony sa opýtaj: „Kto dnes hrá s kapelou?“ Zistíš, že kapela potrebuje náhradnú klaviristku."],
        ["Prever Fifkovu teóriu", "Pri Materskej škole prezri Plot škôlky. Na ihrisku povedz Fifkovi o žltom fúriku. Pri bytovke sa potom Lydy opýtaj, koho ráno videla pri škôlke. Nakoniec sa vráť za Fifkom a porovnaj dôkazy."],
        ["Telefón a Betkin súhlas", "Pri Opustenej chatke klikni na Telefón pri chatke. Nájsť ho môžeš aj pred rozhovorom so Simonou; súkromný obsah neotváraj. Po rozhovore o kapele sa vráť za Simonou a vyber Našla som tvoj telefón. U Betky v Bednároch vyber tému „Môžeme použiť zvuk zo skúšky?“ Betkin súhlas môžeš vybaviť pred vrátením telefónu aj po ňom."],
        ["Simonina zvuková stopa", "Keď má Simona telefón späť a Betka súhlasila, na ihrisku vyber Pripravíš mi iba zvuk skladby? Simona pripraví iba zvuk; súkromné video nikto iný neuvidí."],
        ["Klavír a vystúpenie: E – G – A", "Doma klikni na Klavír NG. Voľne hrať môžeš vždy, aj bez nahrávky. Simoninu nahrávku si po získaní môžeš opakovane prehrať v batohu aj pri klavíri. Klikni na Skúsiť na festival; až toto tlačidlo zapne hodnotenie nasledujúcich troch zahraných tónov. Zahraj E, G, A v tomto poradí a NG bude pripravená vystúpiť. Prehratie nahrávky sa do pokusu nepočíta a voľné hranie úlohu nedokončí. Po neúspechu začni nový pokus opätovným kliknutím na Skúsiť na festival. Papier na lavičke na Obľúbenej rozhľadni je iba voliteľná notová pomôcka; nepotrebuješ ho na klavír ani opravu."],
        ["Stopy v lese", "Na Lesnom rázcestí najprv klikni na Podozrivé stopy bez predmetu. NG navrhne sadrový odliatok a návštevu obchodu. Pri COOP Jednote klikni na Pult obchodu. Dozvieš sa, že poslednú sadru kúpila Kika. Až potom sa jej opýtaj: „Nemáš sadru na odliatok stopy?“ Vráť sa do lesa, vyber sadru v batohu a použi ju na Podozrivé stopy. Odliatok ukáže vzor pracovnej topánky. Za pohybom medzi stromami nechoď."],
        ["Peter a plán cesty", "Na Zastávke Zubák sa Petra opýtaj Niekam ideš? Peter vie, že musí byť v Brne o 12:30, ale nepozná dĺžku cesty ani čas na prestup. V Základnej škole sa opýtaj učiteľky, ako dlho ide autobus a vlak a koľko trvá prestup."],
        ["Cestovný poriadok: 6:45", "Po rozhovore s Petrom sa na tabuli ukáže päť autobusov: 5:20, 6:45, 8:10, 10:05 a 13:30. Učiteľka povie, že autobus do Púchova trvá 40 minút, na prestup treba 20 minút a vlak z Púchova o 7:45 ide do Brna 4 hodiny. Vyber Peterov plán v batohu a použi ho na tabuľu. Autobus o 6:45 príde o 7:25, vlak príde do Brna o 11:45 pred pohovorom o 12:30. Skorší autobus 5:20 je zbytočný a 8:10 už vlak nestihneš."],
        ["Colník a povolenie za závoru", "Navštív Sirkovú vodu a klikni na colníka. NG stojí pred zatvorenou závorou; colník spomenie pohraničnú zónu, Petra a Brno. Pri zastávke sa Petra opýtaj Prihovoríš sa za mňa colníkovi? Pred dokončením Brna najprv žiada pomoc s cestou, téma zostane. Po Skontrolujeme cestu na pohovor ho požiadaj znova: zavolá colníkovi, zaručí sa za NG a vybaví povolenie aj bezpečnú trasu. Brno môžeš dokončiť už pred návštevou colníka. Odliatok ani Fifkov záver nie sú podmienkou telefonátu."],
        ["Porovnávanie a lesník", "Po odliatí stopy môžeš porovnať odliatok s topánkou každej postavy, aj colníka pred otvorením závory. Po Petrovom telefonáte colník zmizne, závora sa zdvihne a pri Sirkovej vode sa môžeš pohybovať. Lesníka sa opýtaj: Môžeme porovnať tento odliatok s vašou topánkou? Stopa sa zhoduje a lesník prizná, že má naberačku na čistenie žliabka. Vráti ju až po oprave, ktorej presný postup nepozná."],
        ["Pátranie po pláne", "Až keď sa u Sirkovej vody opýtaš lesníka na opravu a dozvieš sa, že nepozná presný postup, spýtaj sa mamy alebo tata, kde nájdeš Kalusov plán. Poradia ti krčmu a starostu. Otázka zmizne, keď plán nájdeš v krčme."],
        ["Kód dverí krčmy: 225", "Starostu sa opýtaj Ako sa dostanem k plánu v krčme? Vysvetlí číselný zámok dverí. U učiteľky vyber Potrebujem rozlúštiť starý kód a pri kostole zisti rok 1806. Súčet číslic je 15; 15 krát 15 je 225. Pri krčme klikni na Vstúpiť do krčmy a zadaj 225. Pri prvom vstupe nájdeš zápisník, plán aj výberovú kávu. Skrinka nemá ďalšiu hádanku, dvere zostanú otvorené a ďalšie návštevy oznámia, že viac už v krčme nie je. Matcha pred dverami je voliteľná stopa."],
        ["Plán u lesníka", "S plánom sa vráť za lesníkom a vyber Čo tu opravujete? Podľa nákresu vysvetlí opravu a povie, že na betón treba miešačku."],
        ["Pokazená miešačka", "U Miešačky sa opýtaj Požičiaš nám miešačku? Dozvieš sa, že potrebuje náhradný ozubený remeň. Tato ti môže poradiť, kde ho hľadať, ale môžeš ísť aj rovno do Malušinca."],
        ["Náhradný diel", "Sesternice alebo jej manžela sa opýtaj na náhradný diel. Povedia ti, že je v dielni. Požiadaj manžela, aby zaistil psa, a potom klikni na Dielňu a vezmi remeň."],
        ["Požičanie a odvoz", "Vyber náhradný diel v batohu a odovzdaj ho Miešačke. Opraví miešačku a požičia ju. Doma dohodni s tatom odvoz SUV a potom sa zastav za lesníkom skontrolovať opravu."],
        ["Oprava", "S plánom, dohodnutou miešačkou a odvozom sa vráť k Sirkovej vode a klikni na Opraviť žliabok. Tato potom miešačku sám vráti Miešačke."],
        ["Vrátená naberačka a kontrola vody", "Otázka A tá naberačka? sa u lesníka objaví až po porovnaní sadrového odliatku s jeho topánkou. Po oprave sa ho na ňu opýtaj a dostaneš naberačku. Pri Studni za domom znovu klikni na Pozrieť sa do studne, aby NG overila návrat vody."],
        ["Uzavri prípad", "Keď máš naberačku, skontroluj studňu za domom a priprav sa na vystúpenie s kapelou. Potom na ihrisku povedz Fifkovi Našla som slávnostnú naberačku. Fifko ju prevezme a hra sa skončí. Starosta na festivale oznámi, že namiesto krčmy sa otvorí hipsterská kaviareň. Matcha pred krčmou je voliteľná stopa; výberovú kávu nájdeš automaticky pri prvom vstupe do krčmy spolu s plánom."]
      ];
      const list = document.createElement("ol");
      steps.forEach(([title, text]) => {
        const entry = document.createElement("li");
        const heading = document.createElement("h3"); heading.textContent = title;
        entry.append(heading, paragraph(text)); list.append(entry);
      });
      content.append(list);
    });
  }
  function settings() {
    openModal("Uložená hra", content => {
      content.append(paragraph(saveAvailable ? "Postup sa ukladá automaticky v tomto prehliadači." : "Prehliadač nepovolil miestne ukladanie. Stiahni si zálohu postupu."));
      const actions = document.createElement("div"); actions.className = "modal-actions";
      actions.append(button("Kompletný návod (spoilery)", walkthrough));
      actions.append(button("Stiahnuť zálohu", () => {
        const url = URL.createObjectURL(new Blob([JSON.stringify(state)], { type: "application/json" }));
        const anchor = document.createElement("a"); anchor.href = url; anchor.download = "zubak-ulozena-hra.json"; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      }));
      const file = document.createElement("input"); file.type = "file"; file.accept = ".json,application/json"; file.hidden = true;
      file.addEventListener("change", async () => {
        if (!file.files[0]) return;
        try { const text = await file.files[0].text(); const data = JSON.parse(text); if (data.version !== 1 || !game.places.some(place => place.id === data.location) || !Array.isArray(data.inventory) || !Array.isArray(data.clues) || !data.flags) throw new Error("save"); state = game.restore(data); mapVisible = true; selectedItem = null; activePerson = null; kettleSelected = false; closeModal(); save(); render(); speak({ text: "Záloha načítaná. Môžem pokračovať v pátraní." }); }
        catch { content.append(paragraph("Súbor nie je platná uložená hra Zubáka.")); }
      });
      actions.append(button("Načítať zálohu", () => file.click()), file, button("Nová hra…", () => {
        openModal("Začať znova?", confirmation => {
          confirmation.append(paragraph("Súčasný postup sa nahradí. Zálohu si môžeš najprv stiahnuť v nastaveniach."));
          const row = document.createElement("div"); row.className = "modal-actions";
          row.append(button("Zrušiť", closeModal), button("Začať novú hru", () => { state = game.createState(); mapVisible = true; selectedItem = null; activePerson = null; kettleSelected = false; closeModal(); save(); render(); showIntro(); }, "danger")); confirmation.append(row);
        });
      }, "danger"));
      actions.append(button("Vymazať uloženú hru a rekordy…", () => {
        openModal("Vymazať všetko?", confirmation => {
          confirmation.append(paragraph("Vymaže sa postup hry aj najlepšie výsledky z minihier v tomto prehliadači. Spoločná online tabuľka zostane nedotknutá. Akciu nie je možné vrátiť."));
          const row = document.createElement("div"); row.className = "modal-actions";
          row.append(button("Zrušiť", closeModal), button("Vymazať všetko", resetEverything, "danger"));
          confirmation.append(row);
        });
      }, "danger"));
      content.append(actions);
    });
  }
  function execute(action) {
    const wasFinished = state.finished;
    const previousInventory = new Set(state.inventory);
    const previousClues = state.clues.length;
    const wasOpen = Boolean(state.flags.pubOpen);
    const wasFixed = Boolean(state.flags.waterFixed);
    const wasWellOpen = Boolean(state.flags.wellOpen);
    const milestones = () => [
      ...game.quests(state),
      { title: "Záhada miznúcej vody", done: Boolean(state.flags.waterFixed) }
    ];
    const previouslyDone = new Set(milestones().filter(quest => quest.done).map(quest => quest.title));
    const result = game.interact(state, action);
    const completed = milestones().filter(quest => quest.done && !previouslyDone.has(quest.title));
    if (action.type === "object" && action.target === "bear") playEffect("bear");
    else if (action.type === "object" && action.target === "suv") playEffect("suv");
    else if (action.type === "object" && action.target === "hatch" && !wasWellOpen && state.flags.wellOpen) playEffect("hatch");
    else if (!wasFixed && state.flags.waterFixed) playEffect("repair");
    else if (!wasOpen && state.flags.pubOpen) playEffect("lockOpen");
    else if (action.type === "object" && action.target === "door" && action.answer && !state.flags.pubOpen && state.flags.pubCodeKnown && previousInventory.has("math")) playEffect("lockWrong");
    else if (completed.length || (!wasFinished && state.finished)) playEffect("quest");
    else if (state.inventory.some(item => !previousInventory.has(item))) playEffect("item");
    else if (state.clues.length > previousClues) playEffect("clue");
    speak(result); save(); render();
    if (!wasFinished && state.finished) {
      stopMusic(); cancelApproach();
      globalThis.ZubakEnding.start(() => { mapVisible = true; activePerson = null; selectedItem = null; kettleSelected = false; render(); showIntro(); });
    } else if (completed.length) {
      openModal("Záhada vyriešená!", content => {
        content.append(paragraph("HOTOVO", "muted"));
        completed.forEach(quest => content.append(paragraph(quest.title, "ending")));
        content.append(paragraph(result.text), button("Pokračovať v pátraní", closeModal));
      });
    }
    return result;
  }
  function travel(id) {
    stopMusic();
    cancelApproach();
    activePerson = null;
    kettleSelected = false;
    const result = execute({ type: "travel", target: id });
    if (state.location === id) { mapVisible = false; selectedItem = null; const entry = game.scene(state).entry || { x: 560, y: 476 }; player.x = entry.x; player.y = entry.y; player.targetX = entry.x; player.targetY = entry.y; player.walking = false; render(); }
    speak(result);
  }
  function cancelApproach() {
    pendingInteraction = null;
    player.targetX = player.x; player.targetY = player.y; player.walking = false;
  }
  function approach(id, interaction) {
    if (game.scene(state).locked) {
      cancelApproach();
      if (!mapVisible && id === "warden") interaction();
      return;
    }
    const target = [...byId("hotspots").children].find(element => element.dataset.target === id);
    if (!target || mapVisible) return;
    const bounds = byId("hotspots").getBoundingClientRect();
    const targetBounds = target.getBoundingClientRect();
    player.targetX = Math.max(50, Math.min(910, (targetBounds.left + targetBounds.width / 2 - bounds.left) / bounds.width * 960));
    player.targetY = 466;
    activePerson = null;
    kettleSelected = false;
    renderChoices();
    pendingInteraction = interaction;
  }
  function showPerson(id, arrived = false) {
    if (!arrived) return approach(id, () => showPerson(id, true));
    if (id === "michacka" && selectedItem === "sparePart" && state.inventory.includes("sparePart") && state.flags.mixerBroken && !state.inventory.includes("mixer")) {
      selectedItem = null;
      activePerson = id;
      execute({ type: "talk", target: id, topic: "loan" });
      return;
    }
    if (id === "ondrej" && selectedItem === "plan" && state.inventory.includes("plan") && !state.flags.drain && !state.flags.waterFixed) {
      selectedItem = null;
      activePerson = id;
      execute({ type: "talk", target: id, topic: "explain" });
      return;
    }
    if (id === "warden") {
      activePerson = null;
      execute({ type: "talk", target: id, topic: "entry" });
      if (game.availableTopics(state, id).length) {
        activePerson = id;
        renderChoices();
      }
      return;
    }
    if (id === "zubacan" && !state.flags.tracks) {
      activePerson = null;
      execute({ type: "talk", target: id, topic: "thirst" });
      return;
    }
    activePerson = id;
    speak({ speaker: game.people[id].name, text: game.people[id].role });
    renderChoices();
  }
  function renderChoices() {
    const choices = byId("choices"); choices.replaceChildren();
    if (mapVisible) {
      choices.append(button("Pokračovať doma", () => travel("home")), button("Čo teraz?", showHint), button("Denník stôp", journal)); return;
    }
    if (kettleSelected) {
      choices.append(button("Zúčastniť sa gulášfestu", () => {
        cancelApproach(); player.targetX = player.x; player.targetY = player.y; player.walking = false;
        goulashActive = true;
        globalThis.ZubakGoulashUI.open({ document, storage: localStorage, onClose: result => {
          goulashActive = false;
          speak({ text: result.finished ? "Som zvedavá, či tentoraz vyhrám." : "Ku kotlíku sa môžem kedykoľvek vrátiť." });
        } });
      }, "goulash-join"));
      return;
    }
    if (activePerson) {
      game.availableTopics(state, activePerson).forEach(([topic, label]) => choices.append(button(label, () => {
        if (activePerson === "mayor" && topic === "bikeRide") {
          cancelApproach(); player.targetX = player.x; player.targetY = player.y; player.walking = false;
          execute({ type: "talk", target: "mayor", topic: "bikeRide" });
          bikeActive = true;
          globalThis.ZubakBikeUI.open({ document, storage: localStorage, onCrash: () => playEffect("crash"), onClose: () => { bikeActive = false; renderChoices(); } });
          return;
        }
        execute({ type: "talk", target: activePerson, topic });
      })));
      choices.append(button("Zatiaľ ahoj", () => { activePerson = null; renderChoices(); speak({ text: "Vďaka. Idem sa pozrieť ďalej." }); }));
    }
  }
  function codePuzzle(entryText = "") {
    openModal("Dvere krčmy", content => {
      if (entryText) content.append(paragraph(entryText));
      if (state.flags.pubOpen) {
        content.append(paragraph("Dvere zostávajú otvorené. Viac už v krčme nie je."), button("Odísť", closeModal));
        return;
      }
      if (!state.inventory.includes("math")) {
        content.append(paragraph("Tri číselné kolieska. Pani učiteľka možno pozná krčmárovu číselnú nápovedu."), button("Odísť", closeModal));
        return;
      }
      const form = document.createElement("form"); const input = document.createElement("input"); input.type = "text"; input.inputMode = "numeric"; input.pattern = "[0-9]{3}"; input.maxLength = 3; input.required = true; input.placeholder = "000"; input.setAttribute("aria-label", "Trojciferný kód");
      const submit = button("Odomknúť", () => {}); submit.type = "submit"; submit.className = "submit-code";
      const message = paragraph("");
      form.append(input, submit); form.addEventListener("submit", event => { event.preventDefault(); const result = execute({ type: "object", target: "door", answer: input.value }); if (state.flags.pubOpen) closeModal(); else message.textContent = result.text; });
      content.append(form, message); requestAnimationFrame(() => input.focus());
    });
  }
  function pianoPuzzle() {
    openModal("Klavír NG", content => {
      let attempt = null;
      const output = paragraph(state.flags.festivalReady ? "A mám to! Som pripravená vystúpiť na festivale." : "", "piano-output");
      output.setAttribute("aria-live", "polite");
      const controls = document.createElement("div"); controls.className = "piano-controls";
      const counter = paragraph("", "piano-counter");
      const attemptButton = button("Skúsiť na festival", () => {
        stopMusic(); attempt = []; output.textContent = "";
        counter.textContent = "0 / 3"; attemptButton.disabled = true;
      });
      attemptButton.disabled = state.flags.festivalReady || !state.inventory.includes("audioTrack");
      if (state.inventory.includes("audioTrack")) {
        const replay = button("Prehrať skladbu od Simony", playRecording, "piano-replay");
        controls.append(replay);
        controls.append(attemptButton, counter);
      }
      const keys = document.createElement("div"); keys.className = "festival-piano";
      const layout = [["C",0],["C#",1],["D",1],["D#",2],["E",2],["F",3],["F#",4],["G",4],["G#",5],["A",5],["A#",6],["H",6]];
      layout.forEach(([note, position]) => {
        const key = button(note.replace("#", "♯"), () => {
          playPianoNotes([note], false);
          if (!attempt) return;
          attempt.push(note); counter.textContent = `${attempt.length} / 3`;
          if (attempt.length !== 3) return;
          const answer = attempt.join(""); attempt = null;
          const wasReady = state.flags.festivalReady;
          const result = game.interact(state, { type: "object", target: "piano", answer, festivalAttempt: true });
          output.textContent = result.text;
          attemptButton.disabled = Boolean(state.flags.festivalReady);
          if (!wasReady && state.flags.festivalReady) { speak(result); save(); render(); }
        }, `piano-key${note.includes("#") ? " black-key" : " white-key"}`);
        key.style.setProperty("--key-position", position);
        key.setAttribute("aria-label", `Tón ${note}`); key.title = `Tón ${note}`;
        keys.append(key);
      });
      content.append(controls, keys, output);
    });
  }
  function object(id, arrived = false, item = selectedItem) {
    if (!arrived) return approach(id, () => object(id, true, item));
    activePerson = null;
    if (id === "box") return;
    if (id === "door") {
      const result = execute({ type: "object", target: "door", item });
      if (!state.flags.pubOpen && state.flags.pubCodeKnown && state.inventory.includes("math")) codePuzzle(result.text);
      return;
    }
    if (id === "piano") return pianoPuzzle();
    if (id === "finish") {
      const description = game.interact(game.restore(state), { type: "object", target: id, item });
      kettleSelected = true;
      speak({ text: `${description.text} Čo keby som sa tento rok zapojila aj do varenia?` });
      renderChoices();
      return;
    }
    if (id === "panorama") {
      execute({ type: "object", target: id, item });
      globalThis.ZubakArt.drawPanorama();
      const image = document.createElement("img");
      image.className = "panorama-view";
      image.alt = "Výhľad z rozhľadne ponad zalesnené svahy a dedinu v doline na vysoké hory v diaľke.";
      image.src = byId("scene").toDataURL("image/png");
      openModal("Výhľad z rozhľadne", content => {
        content.append(image, button("Späť na rozhľadňu", closeModal));
      });
      return;
    }
    if (id === "timetable" && item === "route" && state.inventory.includes("route")) {
      openModal("Peterova cesta", content => {
        content.append(paragraph("Peter musí byť v Brne o 12:30. Autobus do Púchova trvá 40 minút, na prestup treba 20 minút a vlak o 7:45 ide do Brna 4 hodiny. Vyber najneskorší autobus, ktorým príde načas."));
        const message = paragraph("");
        ["5:20", "6:45", "8:10", "10:05", "13:30"].forEach(answer => content.append(button(answer, () => {
          const result = execute({ type: "object", target: id, item: "route", answer });
          if (state.flags.routeChecked) closeModal(); else message.textContent = result.text;
        })));
        content.append(message);
      });
      return;
    }
    execute({ type: "object", target: id, item });
  }
  function renderInventory() {
    const inventory = game.activeInventory(state);
    if (selectedItem && !inventory.includes(selectedItem)) selectedItem = null;
    renderHeldItem();
    const container = byId("inventory"); container.replaceChildren();
    byId("selected-label").textContent = selectedItem ? game.items[selectedItem].name : "Nič nie je vybrané";
    inventory.forEach(id => {
      const item = game.items[id];
      const element = button("", () => {
        if (id === "audioTrack") { playRecording(); speak({ text: item.description }); return; }
        selectedItem = selectedItem === id ? null : id;
        if (id === "notebook") { journal(); return; }
        speak({ text: item.description }); renderInventory();
      }, `item${selectedItem === id ? " active" : ""}`);
      element.title = `${item.name}: ${item.description}`; element.setAttribute("aria-label", item.name); element.setAttribute("aria-pressed", String(selectedItem === id));
      element.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[item.icon] || icons.note}</svg>`;
      const label = document.createElement("span"); label.textContent = item.name; element.append(label); container.append(element);
    });
  }
  function renderHotspots() {
    const container = byId("hotspots"); container.replaceChildren();
    if (mapVisible) {
      game.places.forEach(place => {
        const element = button("", () => travel(place.id), `map-spot${state.visited.includes(place.id) ? " visited" : ""}`);
        element.style.left = `${place.x}%`; element.style.top = `${place.y}%`; element.setAttribute("aria-label", place.name);
        const pin = document.createElement("span"); pin.className = "pin"; const label = document.createElement("span"); label.className = "place-label";
        if (place.id === "spring") label.style.transform = "translateX(calc(50% - 4px))";
        label.textContent = place.name; element.append(pin, label); container.append(element);
      });
    } else {
      const place = game.scene(state);
      place.people.forEach((id, index) => {
        const position = place.personPositions[id] || [245 + index * 215, 421.2];
        const element = button(game.people[id].name, () => showPerson(id), "scene-spot person"); element.style.left = `${position[0] / 9.6}%`; element.style.top = `${position[1] / 5.4}%`; container.append(element);
        if (place.id === "spring" && id === "ondrej") element.style.top = `${(position[1] - 104) / 5.4}%`;
        element.dataset.target = id;
      });
      place.objects.forEach((id, index) => {
        if (id === "box") return;
        if (id === "phone" && (state.inventory.includes("phone") || state.flags.phoneReturned)) return;
        if (id === "melody" && state.inventory.includes("notes")) return;
        if (id === "fence" && !state.flags.ladleTip) return;
        if (id === "drum" && state.flags.transport && !state.flags.equipmentReturned && !state.flags.waterFixed) return;
        const positions = { piano: [33, 65], suv: [77, 66], water: [52, 60], door: [51, 61], notice: [46, 62], box: [60, 74], finish: [52, 64], poster: [75, 79], melody: [32, 69], panorama: [66, 42], bear: [83, 49], tracks: [53, 67], dog: [74, 56], phone: [70.5, 76], timetable: [66.25, 75.2], channel: [55, 62], repair: [72, 81] };
        const position = id === "matcha" ? [45.5,83] : id === "archive" ? [48,68] : id === "gym" ? [86,65] : id === "door" ? [52,70] : id === "fence" ? [12,72] : id === "railTraces" ? [25,65] : id === "hatch" ? [43,74] : id === "water" ? [59,79] : id === "tireRuts" ? [78,87] : positions[id] || [48 + index * 18, 54 + index % 2 * 13];
        const label = id === "drum" && state.flags.waterFixed && !state.flags.equipmentReturned ? "Vrátiť miešačku" : game.objects[id][0];
        const element = button(label, () => object(id), "scene-spot"); element.style.left = `${position[0]}%`; element.style.top = `${position[1]}%`; container.append(element);
        element.dataset.target = id;
        if (id === "drum") { element.style.left = "63%"; element.style.top = "84%"; }
        if (id === "notice") element.style.top = "calc(70% - 48px)";
        if (id === "dog") element.style.top = "85%";
        if (id === "melody") { element.style.left = "37%"; element.style.top = "calc(83% - 28px)"; }
        if (id === "ridgeview") { element.style.left = "50%"; element.style.top = "43%"; }
        if (id === "panorama") element.style.left = "62.5%";
        if (id === "fence") { element.style.left = "89%"; element.style.top = "80%"; }
      });
    }
  }
  function walk(event) {
    if (game.scene(state).locked) { cancelApproach(); return; }
    if (event.target !== byId("hotspots") || mapVisible) return;
    kettleSelected = false; activePerson = null; renderChoices();
    pendingInteraction = null;
    const bounds = byId("hotspots").getBoundingClientRect(); player.targetX = Math.max(50, Math.min(910, (event.clientX - bounds.left) / bounds.width * 960)); player.targetY = Math.max(450, Math.min(510, (event.clientY - bounds.top) / bounds.height * 540));
  }
  function render() {
    backgroundDirty = true;
    byId("scene").closest(".world").dataset.scene = mapVisible ? "map" : state.location;
    const place = game.places.find(value => value.id === state.location);
    byId("location-name").textContent = mapVisible ? "Zubák" : place.name;
    byId("location-sub").textContent = mapVisible ? "" : place.sub;
    byId("back-button").hidden = mapVisible;
    byId("chapter").textContent = state.finished ? "PRÍPAD 01 / VYRIEŠENÉ" : "PRÍPAD 01 / BIELE KARPATY";
    byId("clue-count").textContent = state.clues.length;
    byId("progress").textContent = `${state.clues.length} stôp · ${state.visited.length}/${game.places.length} miest`;
    byId("world-status").textContent = mapVisible ? "Biele Karpaty • herná mapa" : "Sobota • gulášový festival";
    byId("scene").setAttribute("aria-label", mapVisible ? "Pixelová mapa Zubáka" : `Herná scéna: ${place.name}`);
    renderHotspots(); renderChoices(); renderInventory();
  }
  function showMap() { cancelApproach(); activePerson = null; kettleSelected = false; mapVisible = true; render(); }
  byId("hotspots").addEventListener("click", walk);
  byId("hotspots").addEventListener("pointermove", event => {
    scenePointer = event.pointerType === "touch" ? null : { x: event.clientX, y: event.clientY };
    renderHeldItem();
  });
  byId("hotspots").addEventListener("pointerleave", () => { scenePointer = null; renderHeldItem(); });
  byId("map-button").addEventListener("click", showMap); byId("back-button").addEventListener("click", showMap);
  byId("journal-button").addEventListener("click", journal); byId("help-button").addEventListener("click", showHint);
  byId("settings-button").addEventListener("click", settings); byId("sources-button").addEventListener("click", showSources);
  byId("close-modal").addEventListener("click", closeModal);
  byId("sound-button").addEventListener("click", () => { setSound(!sound); if (sound) tone("C"); });
  document.addEventListener("keydown", event => {
    if (bikeActive || goulashActive || modal.open || byId("intro").open || /INPUT|TEXTAREA/.test(event.target.tagName) || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key.toLowerCase() === "m") showMap();
    if (event.key.toLowerCase() === "d") journal();
    if (event.key === "Escape") { cancelApproach(); selectedItem = null; activePerson = null; kettleSelected = false; render(); }
  });
  let previousTime = 0;
  let lastBackgroundTime = -Infinity;
  let backgroundDirty = true;
  byId("intro-start").addEventListener("click", startStory);
  byId("intro-continue").addEventListener("click", continueStory);
  byId("intro-finale").addEventListener("click", () => {
    if (!state.finished) return;
    byId("intro").close();
    globalThis.ZubakEnding.start(showIntro);
  });
  byId("intro").addEventListener("cancel", event => {
    event.preventDefault();
    if (state.finished) return;
    if (game.hasProgress(state)) continueStory(); else startStory();
  });
  function frame(timestamp) {
    const delta = Math.min((timestamp - previousTime) / 1000, .05); previousTime = timestamp;
    if (bikeActive || goulashActive) { requestAnimationFrame(frame); return; }
    if (sound && !mapVisible && !modal.open && !byId("intro").open && state.location === "church" && timestamp - lastChurchBell > 9000) {
      lastChurchBell = timestamp; playEffect("bell");
    }
    if (!mapVisible && game.scene(state).locked) {
      Object.assign(player, game.scene(state).entry);
      cancelApproach();
    }
    const distance = Math.hypot(player.targetX - player.x, player.targetY - player.y); player.walking = !mapVisible && distance > 2;
    if (player.walking) { const factor = Math.min(1, delta * 200 / distance); player.x += (player.targetX - player.x) * factor; player.y += (player.targetY - player.y) * factor; }
    if (!mapVisible && !modal.open && !byId("intro").open && pendingInteraction && Math.hypot(player.targetX - player.x, player.targetY - player.y) <= 2) {
      const interaction = pendingInteraction; pendingInteraction = null; player.walking = false; interaction();
    }
    // 1 ms tolerance keeps exactly every second frame on 60 Hz displays.
    const redrawBackground = backgroundDirty || timestamp - lastBackgroundTime >= 1000 / 30 - 1;
    if (redrawBackground) { lastBackgroundTime = timestamp; backgroundDirty = false; }
    globalThis.ZubakArt.draw(state, mapVisible, timestamp / 1000, player, redrawBackground); requestAnimationFrame(frame);
  }
  render(); requestAnimationFrame(frame);
  showIntro();
  const startupLoading = byId("startup-loading");
  startupLoading.addEventListener("cancel", event => event.preventDefault());
  const startupUrl = new URL(document.location.href);
  if (startupUrl.searchParams.get("from") === "trailer") {
    startupUrl.searchParams.delete("from");
    document.defaultView.history.replaceState(null, "", startupUrl.href);
  } else {
    startupLoading.showModal();
    setTimeout(() => { if (startupLoading.open) startupLoading.close(); }, 5000);
  }
  if (state.clues.length) speak({ text: game.hint(state), speaker: "NG · pokračujeme" });
  if (!saveAvailable) byId("save-status").textContent = "Ukladanie nie je dostupné";
})();