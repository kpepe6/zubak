(function (root) {
  "use strict";
  const places = [
    { id: "home", name: "Doma u NG", sub: "Dom NG · hneď vedľa materskej školy", x: 55, y: 31, kind: "house", people: ["mama", "tato"], objects: ["piano", "suv"] },
    { id: "well", name: "Studňa za domom", sub: "V lese za domom · otvárateľný poklop v zemi", x: 49, y: 26, kind: "well", people: [], objects: ["hatch", "water"] },
    { id: "nursery", name: "Materská škola", sub: "Južne od domu NG, nad hlavnou cestou", x: 58, y: 44, kind: "nursery", people: [], objects: ["fence"] },
    { id: "school", name: "Základná škola", sub: "Západne od centra, pri školskom ihrisku · bližšie k potoku než bytovka", x: 26, y: 70, kind: "school", people: ["teacher"], objects: ["board"] },
    { id: "field", name: "Ihrisko a gulášfest", sub: "Športoviská západne od základnej školy · dnes sa tu koná gulášfest", x: 17, y: 62, kind: "festival", people: ["simona", "fifko"], objects: ["poster", "finish"] },
    { id: "bednari", name: "Bednári · u Betky", sub: "Západne od základnej školy · strmý kopec, Betkin dom so psom", x: 8, y: 82, kind: "house", people: ["betka"], objects: [] },
    { id: "flats", name: "Bytovka", sub: "Pri hlavnej ceste, neďaleko školy · tu sme kedysi bývali", x: 33, y: 67, kind: "flats", people: ["lida"], objects: ["balcony"] },
    { id: "shop", name: "COOP Jednota", sub: "Nad hlavnou cestou · západne od obecného úradu", x: 65, y: 54, kind: "shop", people: ["kika"], objects: ["shelf"] },
    { id: "pub", name: "Zatvorená krčma", sub: "Pri zastávke Zubák · medzi hlavnou cestou a potokom", x: 82, y: 68, kind: "pub", people: ["zubacan"], objects: ["notice", "door", "box", "matcha"] },
    { id: "office", name: "Obecný úrad", sub: "Pod hlavnou cestou · juhovýchodne od COOP Jednoty", x: 67, y: 68, kind: "office", people: ["mayor"], objects: ["archive", "gym"] },
    { id: "church", name: "Kostol sv. Vendelína", sub: "Východne od škôlky, severne od hlavnej cesty", x: 76, y: 42, kind: "church", people: [], objects: ["bells"] },
    { id: "cross", name: "Krížová cesta", sub: "Nad kostolom", x: 79, y: 27, kind: "cross", people: [], objects: ["view"] },
    { id: "mixer", name: "U Miešačky", sub: "Bednári · dvor s miešačkou neďaleko Betky", x: 20, y: 88, kind: "mixer", people: ["michacka"], objects: ["drum"] },
    { id: "cousin", name: "Malušinec · u sesternice", sub: "Východný koniec mapy · dom na svahu", x: 92, y: 82, kind: "house", people: ["cousin", "husband"], objects: ["dog", "tools"] },
    { id: "bus", name: "Zastávka Zubák", sub: "Pri hlavnej ceste medzi bytovkou a obecným úradom", x: 50, y: 68, kind: "bus", people: ["peter"], objects: ["timetable"] },
    { id: "forest", name: "Lesné rázcestie", sub: "Les nad obcou", x: 26, y: 28, kind: "forest", people: [], objects: ["tracks", "railTraces", "bear"] },
    { id: "cabin", name: "Opustená chatka", sub: "Les neďaleko NG", x: 43, y: 33, kind: "cottage", people: [], objects: ["cabinMemory", "phone"] },
    { id: "spring", name: "Sirková voda", sub: "Za kaplnkou smerom k lesu · odtiaľ sa už ďalej nechodí", x: 3, y: 64, kind: "spring", people: ["ondrej"], objects: ["channel", "repair"] },
    { id: "tower", name: "Obľúbená rozhľadňa", sub: "V kopcoch nad Zubákom", x: 91, y: 25, kind: "tower", people: [], objects: ["melody", "panorama", "tireRuts"] },
    { id: "ridge", name: "Žrnová a Kýčera", sub: "Biele Karpaty", x: 68, y: 31, kind: "ridge", people: [], objects: ["ridgeview"] }
  ];
  const people = {
    zubacan: { name: "Zubáčan", color: "#879877", role: "Som smädný a krčma je zatvorená.", topics: [["thirst", "Ako sa máte?"]] },
    mama: { name: "Mama", color: "#ce6c83", role: "Má prehľad. Aj o tom, o čom ešte nevieš.", topics: [["case", "Čo sa dnes deje?"], ["orchard", "Bolo zase niečo pri ovocných stromoch?"], ["soup", "Čo je dnes na obed? Vývar so slížami?"], ["television", "Čo zase hovoríš o Agáte?"], ["familyHistory", "Poznali ste sa kedysi s Kalusovcami?"]] },
    tato: { name: "Tato", color: "#4e8db7", role: "Z Breznice. S SUV a vlastným názorom.", topics: [["breznice", "Porozprávaj mi o Breznici."], ["partLead", "Kde zoženiem náhradný diel do miešačky?"], ["transport", "Odvezieš miešačku svojím SUV?"], ["towerCars", "Prečo ľudia jazdia SUV k rozhľadni?"], ["familyHouse", "Ako sa vlastne staval náš dom?"]] },
    fifko: { name: "Fifko", color: "#ebbc4e", role: "Malý braček, looksmaxer, filmový fanúšik a budúci autor herných scenárov.", topics: [["ladle", "Nevidel si slávnostnú naberačku?"], ["returnLadle", "Našla som slávnostnú naberačku."], ["fenceReport", "Za škôlkou som našla žltý fúrik."], ["verdict", "Preverila som tvojho podozrivého."], ["goulash", "Koľko gulášov už máš za sebou?"], ["screenplays", "Stále chceš písať scenáre k hrám?"], ["looksmaxing", "Zase si kontroluješ účes?"]] },
    michacka: { name: "Miešačka", color: "#eb8854", role: "Mamina známa. Mieša maltu aj dianie v obci.", topics: [["loan", "Požičiaš nám miešačku?"], ["nickname", "Prečo vlastne Miešačka?"]] },
    mayor: { name: "Starosta", color: "#789da2", role: "Zubácky starosta. Svojím umom sa vyrovná našim velikánom, ktorých podobizne máme na úrade.", topics: [["key", "Potrebujem sa pozrieť do krčmy."], ["village", "Čo sa tu pripravuje?"], ["ebike", "Zase ste prišli na elektrobicykli?"], ["bikeRide", "Požičiate mi elektrobicykel na zjazd?"], ["railway", "Chodieval sem kedysi vlak z Lednice?"]] },
    lida: { name: "Lyda", color: "#b183bb", role: "V bytovke nebýva, ale má o nej informácie.", topics: [["witness", "Koho si ráno videla pri škôlke?"], ["oldhome", "Pamätáš si, keď sme tu bývali?"], ["hallway", "Stále sa tu tak stráži čistota chodby?"], ["oldshops", "Koľko obchodov tu kedysi bývalo?"]] },
    betka: { name: "Betka", color: "#d9736d", role: "Kamarátka, ktorá už zase niečo organizuje.", topics: [["festival", "Čo chýba na festivale?"], ["consent", "Môžeme použiť zvuk zo skúšky?"], ["rumor", "Čo sa hovorí o krčme?"], ["rail", "Našli ste v lese ešte koľajnice?"]] },
    simona: { name: "Simona", color: "#76af9e", role: "Kamarátka", topics: [["recording", "Kto dnes hrá s kapelou?"], ["returnPhone", "Našla som tvoj telefón."], ["edit", "Pripravíš mi iba zvuk skladby?"], ["music", "Ako sa pripravím na vystúpenie?"], ["jozo", "A tvoj vysnívaný frajer?"], ["disco", "Pamätáš naše diskotéky v Lednických Rovniach?"]] },
    kika: { name: "Kika", color: "#b4bc61", role: "Kamarátka NG, ktorá dnes čaká pred COOP Jednotou.", topics: [["chalk", "Nemáš sadru na odliatok stopy?"], ["shop", "Pamätáš staré obchody v dedine?"], ["denmark", "Čo ťa láka na Dánsku?"]] },
    teacher: { name: "Pani učiteľka", color: "#8090cb", role: "Vie, že olympionička sa čísel nezľakne.", topics: [["math", "Potrebujem rozlúštiť starý kód."], ["route", "Pomôžeme Petrovi naplánovať prestup?"], ["olympiad", "Spomínate si na olympiádu?"]] },
    cousin: { name: "Tatova sesternica", color: "#df92a2", role: "Býva s manželom v Malušinci, na protiľahlom kopci oproti NG.", topics: [["sparePart", "Nemáte náhradný diel do miešačky?"]] },
    husband: { name: "Jej manžel", color: "#82a48b", role: "V dielni má všetko.", topics: [["secure", "Bojím sa vášho psa."], ["sparePart", "Nemáte náhradný diel do miešačky?"], ["tools", "Čo máte v dielni?"]] },
    peter: { name: "Peter", color: "#ca9269", role: "Telom Zubák. Myšlienkami už Brno.", topics: [["brno", "Niekam ideš?"], ["itinerary", "Skontrolujeme cestu na pohovor."], ["permission", "Prihovoríš sa za mňa colníkovi?"], ["poker", "Fifko tu naozaj vyhral pokerový turnaj?"]] },
    warden: { name: "Colník", color: "#344f48", role: "Stráži závoru v pohraničnej zóne.", topics: [["entry", "Môžem prejsť za závoru?"]] },
    ondrej: { name: "Lesník", color: "#496b42", role: "Miestny lesník. Pozná lesné chodníky aj prepad pri prameni.", topics: [["compareBoot", "Môžeme porovnať tento odliatok s vašou topánkou?"], ["explain", "Čo tu opravujete?"], ["checkRepair", "Ako pokračuje oprava žliabka?"], ["ladletruth", "A tá naberačka?"]] }
  };
  Object.values(people).forEach(person => {
    if (!person.topics.some(([topic]) => topic === "compareBoot")) person.topics.push(["compareBoot", "Môžeme porovnať odliatok s tvojou topánkou?"]);
  });
  ["tato", "mama"].forEach(person => people[person].topics.push(["repairLead", "Kde nájdem plán opravy žliabka?"]));
  people.mayor.topics = people.mayor.topics.map(([topic, label]) => [topic, topic === "key" ? "Ako sa dostanem k plánu v krčme?" : label]);
  const items = {
    footprint: { name: "Sadrový odliatok stopy", icon: "note", description: "Odtlačok pracovnej topánky. Vo vzore podrážky chýba trojuholníkový kúsok. Môžem ho porovnať s topánkou človeka, ktorý tadiaľ prešiel." },
    notebook: { name: "Zápisník NG", icon: "book", description: "Na stopy, nie na domáce úlohy." },
    chalk: { name: "Sadra", icon: "chalk", description: "Sadra s vodou v nádobke na odliatok podozrivej stopy pri lese." },
    key: { name: "Kľúč od krčmy", icon: "key", description: "Požičaný od starostu. Žiadne páčenie." },
    math: { name: "Číselná nápoveda", icon: "note", description: "Sčítaj číslice roku založenia kostola. Súčet vynásob sám sebou." },
    notes: { name: "Noty z rozhľadne", icon: "music", description: "Na papieri sú čitateľné iba prvé dve noty: E–G. Posledná nota je rozmazaná a nedá sa prečítať." },
    phone: { name: "Nájdený telefón", icon: "note", description: "Telefón nájdený pri opustenej chatke. Súkromný obsah neotváram; vrátim ho majiteľovi." },
    audioTrack: { name: "Zvuková nahrávka", icon: "music", description: "Iba zvuk skladby zo skúšky kapely, bez súkromného videa. Môžem si ho vypočuť a naučiť sa skladbu na festival." },
    journal: { name: "Krčmárov zápisník", icon: "book", description: "Krčmár si sem popri receptoch zapisoval aj robotu okolo dediny. Keď kedysi opravoval žliabok, zakreslil sem, ako na to." },
    plan: { name: "Plán opravy žliabka", icon: "map", description: "Nákres prívodu vody, ktorý si krčmár urobil pri dávnejšej oprave. Lesník ho využije pri oprave poškodeného žliabka." },
    mixer: { name: "Požičaná miešačka", icon: "mixer", description: "Zatiaľ stojí u Miešačky. Odvoz a prácu zabezpečia dospelí." },
    ladle: { name: "Slávnostná naberačka", icon: "ladle", description: "Nájdená naberačka pre gulášfest. Zanesiem ju Fifkovi na ihrisko, on sa o ňu postará." },
    rehearsal: { name: "Starý program", icon: "note", description: "Starý záznam z predchádzajúceho uloženia. Už nie je potrebný." },
    route: { name: "Peterov plán cesty", icon: "note", description: "Autobus zo Zubáka do Púchova trvá 40 minút. Na prestup treba 20 minút. Vlak z Púchova odchádza o 7:45 a do Brna ide 4 hodiny." },
    sparePart: { name: "Náhradný diel do miešačky", icon: "mixer", description: "Náhradný diel z dielne tatovej sesternice. Odnesiem ho Miešačke." }
  };
  const objects = {
    piano: ["Klavír NG", "play"], suv: ["Tatovo SUV", "inspect"], hatch: ["Otvoriť / zavrieť poklop", "inspect"], water: ["Pozrieť sa do studne", "inspect"], fence: ["Plot škôlky", "inspect"],
    board: ["Školská kronika", "inspect"], poster: ["Program gulášfestu", "inspect"], finish: ["Festivalový kotlík", "finish"], balcony: ["Bytovka", "inspect"],
    shelf: ["Pult obchodu", "inspect"], notice: ["Tabuľa na krčme", "inspect"], door: ["Vstúpiť do krčmy", "use"], box: ["Krčmárova skrinka", "code"], railTraces: ["Stopy po vlaku z Lednice", "inspect"],
    matcha: ["Zelený prášok", "inspect"],
    archive: ["Obecná tabuľa", "inspect"], gym: ["Posilovňa", "inspect"], bells: ["História kostola", "inspect"], view: ["Cesta nad kostolom", "inspect"], drum: ["Miešačka na dvore", "inspect"],
    dog: ["Pes za bránkou", "inspect"], tools: ["Dielňa", "inspect"], timetable: ["Cestovný poriadok", "inspect"],
    tracks: ["Podozrivé stopy", "use"], bear: ["Pohyb medzi stromami", "inspect"], channel: ["Starý prepad", "inspect"], repair: ["Opraviť žliabok", "repair"],
    melody: ["Papier na lavičke", "take"], panorama: ["Výhľad z rozhľadne", "inspect"], tireRuts: ["Koľaje po SUV", "inspect"], ridgeview: ["Hrebeňová panoráma", "inspect"], cabinMemory: ["Spomienka na chatku", "inspect"], phone: ["Telefón pri chatke", "take"]
  };
  function createState() { return { version: 1, location: "home", inventory: ["notebook"], flags: {}, clues: [], visited: ["home"], moves: 0, finished: false }; }
  function hasProgress(value) {
    if (!value || typeof value !== "object") return false;
    if (value.finished) return true;
    if (value.flags && value.flags.introSeen) return true;
    if ((value.moves || 0) > 0) return true;
    if (Array.isArray(value.clues) && value.clues.length > 0) return true;
    if (Array.isArray(value.visited) && value.visited.length > 1) return true;
    if (typeof value.location === "string" && value.location !== "home") return true;
    if (Array.isArray(value.inventory) && value.inventory.some(item => item !== "notebook")) return true;
    if (value.flags) return Object.keys(value.flags).some(key => key !== "introSeen" && Boolean(value.flags[key]));
    return false;
  }
  function scene(state) {
    const place = places.find(place => place.id === state.location);
    const locked = place.id === "spring" && !state.flags.bearSafe;
    return { ...place, people: locked ? ["warden"] : place.people, objects: locked ? [] : place.objects, locked,
      visiblePeople: place.id === "spring" ? (locked ? ["warden", "ondrej"] : place.people) : place.people,
      entry: locked ? { x: 65, y: 494 } : null,
      personPositions: place.id === "spring" ? { warden: [140, 480], ondrej: [700, 445] } : place.id === "field" ? { fifko: [630, 437] } : {} };
  }
  function restore(value) {
    try {
      const saved = typeof value === "string" ? JSON.parse(value) : value;
      if (!saved || saved.version !== 1 || !places.some(place => place.id === saved.location) || !Array.isArray(saved.inventory) || !Array.isArray(saved.clues) || !Array.isArray(saved.visited) || !saved.flags || typeof saved.flags !== "object" || Array.isArray(saved.flags)) return createState();
      const state = { ...createState(), ...saved, inventory: [...new Set(saved.inventory.filter(item => items[item]))], clues: saved.clues.filter(clue => typeof clue === "string"), visited: saved.visited.filter(id => places.some(place => place.id === id)), flags: { ...saved.flags } };
      if (state.flags.ledgerStarted && !state.flags.waterFixed && !state.inventory.includes("mixer")) state.flags.mixerBroken = true;
      if ((saved.inventory.includes("coupling") || state.flags.ledgerSettled) && !state.flags.waterFixed && !state.inventory.includes("mixer")) { state.flags.mixerBroken = true; state.flags.partAvailable = true; if (!state.inventory.includes("sparePart")) state.inventory.push("sparePart"); }
      const oldClues = {
        "Podľa krčmárovho plánu treba žliabok vyčistiť a vybetónovať. Miešačka pripraví betón, čerpadlo s hadicou odvedie vodu a ťažké vybavenie treba odviezť SUV.": "Podľa krčmárovho plánu treba žliabok vyčistiť a vybetónovať. Na prípravu betónu potrebujeme miešačku.",
        "Záznam v dielni: hadicu so spojkou M-07 požičali na upratovanie pri Opustenej chatke. Spojku treba dohľadať zvonka.": null,
        "Spojka M-07 sa našla pri chatke po upratovaní. Miešačka opravila evidenciu; sesternica ju nestratila.": null,
        "Tato vrátil umytú miešačku aj čerpadlo; Miešačka uzavrela evidenciu a potvrdila spojku M-07.": "Tato vrátil umytú miešačku.",
        "Tato vrátil požičané vybavenie a Miešačka uzavrela evidenciu.": "Tato vrátil požičanú miešačku."
      };
      state.clues = [...new Set(state.clues.map(clue => Object.prototype.hasOwnProperty.call(oldClues, clue) ? oldClues[clue] : clue).filter(Boolean))];
      if (state.flags.waterFixed) state.flags.equipmentReturned = true;
      if (state.flags.waterFixed || state.finished) state.flags.bearSafe = true;
      if (state.inventory.includes("journal") && !state.flags.waterFixed && !state.inventory.includes("plan")) state.inventory.push("plan");
      if (state.flags.recording) {
        Object.assign(state.flags, { recordingAsked: true, phoneReturned: true, audioConsent: true });
        if (!state.inventory.includes("audioTrack")) state.inventory.push("audioTrack");
      }
      return state;
    } catch { return createState(); }
  }
  function act(state, action) {
    const flags = state.flags;
    const add = item => { if (!state.inventory.includes(item)) state.inventory.push(item); };
    const clue = (flag, text) => { flags[flag] = true; if (!state.clues.includes(text)) state.clues.push(text); };
    const has = item => state.inventory.includes(item);
    const say = (text, speaker = "NG") => ({ text, speaker });
    const here = scene(state);
    function finishFestival() {
      if (!has("ladle")) return say("Najprv musím nájsť slávnostnú naberačku.");
      if (!flags.wellChecked && !flags.festivalReady) return say("Naberačku Fifkovi odovzdám, až keď skontrolujem studňu za domom a pripravím sa na vystúpenie s kapelou.");
      if (!flags.wellChecked) return say("Naberačku Fifkovi odovzdám, až keď skontrolujem studňu za domom.");
      if (!flags.festivalReady) return say("Naberačku Fifkovi odovzdám, až keď sa pripravím na vystúpenie s kapelou.");
      const pubReaction = flags.matchaSeen && flags.coffeeSeen
        ? "NG: Tak preto tá matcha pred krčmou a výberová káva vnútri! Konečne mi to dáva zmysel."
        : flags.matchaSeen ? "NG: Tak preto tá matcha pred krčmou! Konečne mi to dáva zmysel."
        : flags.coffeeSeen ? "NG: Tak preto tá výberová káva v krčme! Konečne mi to dáva zmysel."
        : "NG: Hipsterská kaviareň v Zubáku? Tak to je prekvapenie!";
      state.finished = true;
      return say(`Prípad uzavretý! Starosta na festivale oznámil: Namiesto krčmy sa v Zubáku otvorí hipsterská kaviareň! ${pubReaction} Lesník si požičal naberačku na čistenie prepadu a vietor odniesol odkaz. ${flags.fifkoCleared ? "Fifko sa pred celým ihriskom ospravedlnil nevinnému fúriku. " : ""}Betka uviedla koncert a NG zahrala s kapelou namiesto klaviristky. Simonino video zostalo súkromné. ${flags.brnoReady ? "Peter priznal pohovor v Brne. " : ""}${flags.equipmentReturned ? "Tato vrátil miešačku. " : ""}Tato odložil kľúče od SUV. Voda je späť. NG: Dnes som nevyriešila celú dedinu. Ale konečne sme sa začali počúvať. Fifko: A jesť. Nezabudni jesť.`);
    }
    if (action.type === "travel") {
      if (!places.some(place => place.id === action.target)) return say("Tam cesta nevedie.");
      state.location = action.target; state.moves++;
      if (!state.visited.includes(action.target)) state.visited.push(action.target);
      if (action.target === "tower") return say("Zubácka rozhľadňa. Niektorí jej hovoria všelijako inak, ale pre mňa je to ZUBÁCKA ROZHĽADŇA! Keď ju niekto nazve inak, fakt ma naštve. Výhľad môžeme zdieľať, o názve nevyjednávam. Zrazu je celá dolina prehľadná a problémy vyzerajú menšie. Len sa mi nepáči, keď sem občas ľudia prídu na SUV. Chcem počuť vietor v stromoch, nie motor.");
      return say(places.find(place => place.id === action.target).sub);
    }
    if (action.type === "talk") {
      if (!here.people.includes(action.target)) return say("Táto postava tu nie je.");
      if (!people[action.target].topics.some(([topic]) => topic === action.topic)) return say("Na túto otázku sa tejto postavy nemôžem pýtať.");
      const speaker = people[action.target].name;
      const talk = text => say(text, speaker);
      switch (action.topic) {
        case "entry":
          flags.wardenMet = true;
          return talk("Colník: Za túto závoru ťa teraz nepustím. Je tu pohraničná zóna a ďalej už bývajú Čehúni, ako tu hovoríme našim českým susedom. Bez povolenia nemôžeš ďalej. Mimochodom, poznáš Petra? Chcel ísť tiež za hranicu, až do Brna, zaujímalo by ma, ako to dopadlo. NG: Poznám ho. Zistím.");
        case "permission": {
          if (!flags.wardenMet) return talk("Najprv sa porozprávaj s colníkom pri Sirkovej vode.");
          const request = "NG: Peter, nepoznáš sa náhodou s colníkom? Pri Sirkovej vode ma nepustil za závoru a ja sa tam fakt potrebujem dostať. Nemohol by si sa za mňa prihovoriť? ";
          if (flags.bearSafe) return talk(request + "Peter: Povolenie už máme, drž sa overenej cesty.");
          if (!flags.brnoReady) return talk(request + "Peter: Poznám ho, ale najprv mi pomôž s cestou do Brna. Potom sa za teba prihovorím.");
          clue("bearSafe", "Peter sa colníkovi zaručil za NG: má povolenie prejsť za závoru po overenej bezpečnej trase k lesníkovi. Medveď je mimo cesty.");
          return talk(request + "Peter: Predtým si pomohla ty mne, teraz pomôžem ja tebe. Peter vytáča colníka a zapína hlasný odposluch. Peter: NG poznám, je to moja kamarátka. Zaručím sa za ňu. Colník: Keď sa za ňu zaručíš, NG môže prejsť za závoru. Peter: Ďakujem. NG, teraz máš povolenie.");
        }
        case "compareBoot":
          if (!flags.tracks) return talk("Najprv potrebujeme odliatok stopy, inak nemáme čo porovnávať.");
          if (action.target !== "ondrej") {
            flags[`compared:${action.target}`] = true;
            return talk("NG: Priložím odliatok k topánke. Vzor podrážky sa nezhoduje a chýbajúci trojuholník tu nie je. Budem hľadať ďalej.");
          }
          clue("bootMatched", "Odliatok sa zhoduje s lesníkovou poškodenou podrážkou. Lesník má naberačku na čistenie žliabka; vráti ju po oprave.");
          clue("ladleSpotted", "Lesník priznal, že si požičal slávnostnú naberačku na čistenie žliabka.");
          return talk("Lesník: Ten chýbajúci trojuholník poznám. Tu sa mi odtrhol kus podrážky. NG: Priložím odliatok… Vzor aj poškodenie sedia! Takže stopa patrí vám. A čo slávnostná naberačka? Lesník: Mám ju tu. Požičal som si ju na čistenie žliabka a nechal odkaz pri krčme, ale asi ho odniesol vietor. NG: Potrebujeme ju na gulášfest! " + (flags.waterFixed ? "Lesník: Žliabok je už opravený, takže vám ju rád vrátim." : "Lesník: Vrátim ju, len čo opravíme žliabok."));
        case "repairLead":
          if (!flags.foresterAsked) return talk("Najprv sa porozprávaj s lesníkom o oprave žliabka.");
          if (flags.repairLead) return talk("Plán nájdeš v krčme, to už vieme.");
          clue("repairLead", "Plán opravy žliabka je v krčmárovom zápisníku v krčme. Starosta vie, ako otvoriť dvere.");
          return talk("Aha, preto nám netečie voda. Kalus už žliabok kedysi opravoval. Plán bude dakde v jeho zápisníku v krčme. Spýtaj sa starostu, ako sa dostaneš dovnútra.");
        case "thirst": return talk("Som smädný a krčma je zatvorená.");
        case "case": return talk("Na ihrisku sa začína gulášfest, najväčšia udalosť roka v Zubáku! Celá dedina sa naň chystá celé mesiace a práve dnes niekto odniesol slávnostnú naberačku. A pozri sa, prosím, za dom na studňu. Zase tečie málo vody. Tvoje pianíno už tato priviezol z bytovky. Musíme mu ešte urobiť miesto v dome, preto zatiaľ stojí vonku. S tatom sme vonku na cigarete, ale vieme o tebe!");
          case "familyHistory": return talk("Mama: Dedo občas chodieval do Kalusovej krčmy. A s Kalusovcami sme sa kedysi kamarátili aj my. Spomienky si môžeme porozprávať, ale nikoho z nich netreba podozrievať z dnešnej záhady.");
        case "partLead": if (!flags.mixerBroken || has("sparePart") || has("mixer")) return talk("Náhradný diel už teraz nemusíme hľadať."); flags.partLead = true; return talk("Moja sesternica a jej manžel majú v dielni všeličo. Skús sa ich opýtať, či majú náhradný diel do miešačky.");
        case "breznice": return talk("Ja som z Breznice, to vieš. Aj tam sa všetko najprv riešilo pri plote a až potom na úrade. Keď niekde mizne voda, sleduj rúru, nie klebety.");
        case "towerCars": if (!flags.towerRuts) return talk("Občas sa niekto chce odviezť až k výhľadu. NG: Lenže ja tam chodím pre pokoj, nie počúvať motory. Tato: Rozumiem. Keď pôjdeš na rozhľadňu, pozri sa na chodník. O aute môžeme hovoriť aj bez toho, aby sme sa hádali o moje kľúče."); flags.towerDiscussed = true; return talk("NG: Hore sú vyjazdené koľaje. Nepáči sa mi, keď ľudia chodia SUV až k rozhľadni. Rozhľadňa je moje pokojné miesto, nie parkovisko. Tato: Súhlasím. Auto nám pomáha odviezť ťažké veci, ale na výletný chodník sa nemá jazdiť. NG: Áno, až spolu pôjdeme na rozhľadňu, tak pešo. Tato: Už som vedel, že táto debata skončí kopcom.");
        case "transport": if (!has("mixer") && !flags.waterFixed) return talk("Najprv dohodni požičanie miešačky."); flags.transport = true; if (flags.waterFixed) return talk("Oprava je hotová a miešačka vrátená."); return talk("SUV si požičiavať nebudeš. Miešačku odveziem ja a s lesníkom opravu zariadime. Potom sa za ním zastav a skontroluj, ako to dopadlo.");
        case "ladle": clue("ladleTip", "Fifko má teóriu o žltom aute a veľkých topánkach pri škôlke. Treba ju preveriť."); return talk("Zapísal som si: hen pri škôlke žlté auto, veľké topánky! Určite únos naberačky!");
        case "fenceReport": if (!flags.ladleTip || !flags.fenceChecked) return talk("Najprv prever, čo je za plotom škôlky."); flags.fifkoLydaLead = true; return talk("NG: Boha jeho, za plotom je žltý fúrik, nie auto. Fifko: Hentam za plotom? To malo byť to podozrivé auto? Ja som len počul motor a ostatné si domyslel. Niekoho tam videla Lyda. Asi bude niekde pri bytovke, skús sa jej opýtať.");
        case "returnLadle": return finishFestival();
        case "verdict": if (!flags.ladleTip || !flags.witness || !flags.fenceChecked) return talk("Najprv prever plot škôlky a porozprávaj sa s Lydou. Potom porovnáme zápisky."); clue("fifkoCleared", "Fifkova teória o žltom aute sa nepotvrdila. Lyda videla neznámeho človeka smerovať k lesnému rázcestiu."); return talk("NG: Lyda videla len neznámeho človeka smerovať k lesnému rázcestiu. Fifko: Takže žltý fúrik nebol auto! Henten ten ma normálne oklamal. NG: Čo si vlastne videl, zostáva nejasné. Pozriem sa na rázcestie.");
        case "goulash": return talk("Fifko: To nie sú porcie, to je príprava na víťazstvo. Už som tu v dedine vyhral pokerový aj pingpongový turnaj. A teraz sa chystám všetkých poraziť na gulášovom festivale! NG: A v čom vlastne súťažíš, vo varení alebo v jedení? Fifko: Ešte vyhodnocujem, kde mám väčší náskok. NG: Čo ti šiši? Veď toto je už tvoja štvrtá porcia! Fifko: Podaj mi chlieb k vzorke číslo štyri.");
        case "looksmaxing": return talk("Fifko: Som looksmaxer. Účes musí sedieť aj počas vyšetrovania. NG: Preto sa pozeráš do každej lyžice? Fifko: Kontrolujem odraz.");
        case "loan": if (!flags.drain && !flags.mixerBroken) return talk("Najprv zisti od lesníka, čo bude na opravu potrebné."); if (has("mixer")) return talk("Miešačku už máte dohodnutú."); if (!flags.mixerBroken) { flags.mixerBroken = true; return talk("Rada vám miešačku požičiam, ale pokazila sa. Dačo v nej preskočilo. Potrebujem náhradný ozubený remeň. Keď ho zoženieš, opravím ju."); } if (!has("sparePart")) return talk("Miešačka je stále pokazená. Potrebujem náhradný ozubený remeň."); state.inventory = state.inventory.filter(item => item !== "sparePart"); add("mixer"); return talk("NG: Priniesla som náhradný ozubený remeň! Miešačka: Výborne, presne ten potrebujem. Hneď ho vymením a miešačku vám požičiam. Je ťažká, dohodni si odvoz.");
        case "nickname": return talk("Na dvore mám miešačku a vraj sa do všetkého miešam. Preto Miešačka. Ale keď sa človek neopýta, nič sa nedozvie! Povedz mi, čo sa deje pri krčme. Nie že by som sa do toho chcela miešať.");
        case "key": if (!flags.repairLead) return talk("Najprv zisti, kde je plán opravy žliabka."); clue("pubCodeKnown", "Dvere krčmy majú číselný zámok. Pani učiteľka pozná hádanku s rokom založenia kostola."); return talk("Plán je v krčme. Dvere majú číselný zámok, kľúč netreba. Šak pani učiteľka pozná starú hádanku, jej výsledok je kód dverí.");
        case "village": return talk("V Zubáku sa teraz stavia veľa nových domov. Sotva si zapamätám jednu bránku, vedľa vyrastie ďalšia strecha. Ale Žrnová aj Kýčera sú krásne miesta. Tie si pred developermi musíme ochrániť!");
        case "railway": return talk("Starosta: Kedysi sem z Lednice chodieval vlak. Už dávno nejazdí, ale v lese sa ešte dajú nájsť zvyšky násypu a starých železničných stôp.");
        case "oldshops": return talk("Kedysi bolo v Zubáku viac obchodov. Niektoré už zavreli a zostali po nich len staré výklady a spomienky.");
        case "rail": return talk("Betka: V lese sa ešte dajú nájsť stopy po starej železnici z Lednice. Vlak tadiaľ už dávno nechodí. Betka: A ďalej než po Sirkovú vodu sa nepúšťajte. Tam sa končí naša bezpečná trasa. Za hranicou je neprehľadný terén a hlboké blato.");
        case "poker": return talk("Peter: Vyhral! Na turnaji v Zubáku si Fifko sadol k stolom a nakoniec bral prvé miesto. NG: A potom si za výhru kúpil čo? Peter: Sladkosť a filmové DVD.");
        case "bikeRide": return talk("Požičiam. Prilbu máš, tak môžeš vyraziť od rozhľadne cez Kýčeru a Žrnovú. Po ceste minieš Sirkovú vodu a v dedine dávaj pozor na Zubák Expres. Počkám ťa v cieli pred úradom!");
        case "ebike": return talk("Rád jazdím na elektrobicykli. V týchto kopcoch tú pomoc ocením. Starosta: Počul som, že aj tvoja mama sa zaujíma o elektrobicykle. NG: Hej, hej.");
        case "familyHouse": return talk("Náš dom začali stavať tvoji starí rodičia. Potom sme ho s mamou dostavali my. NG: Takže to nie je len náš dom, ale kus roboty viacerých generácií. Tato: Presne. Kým sme sa z bytovky presťahovali, bolo ešte čo dokončovať. Čo bolo, to bolo. NG: A teraz máme vpredu verandu a za domom ovocné stromy. Tato: A stále sa nájde niečo, čo treba opraviť.");
        case "television": return talk("Mama: Pozerala som zase Agátu Hanychovú. Počkaj, čo som ti o nej chcela povedať... NG: O Agáte máš vždy niečo nové. A tú knižku si už otvorila? Mama: Čože? Akú? Agáta nejakú napísala? Inak ma to nezaujíma.");
        case "screenplays": return talk("Fifko: Jasné! Chcem písať scenáre k hrám. A pozerám filmy, všímam si, kedy príde zvrat a ako sa predstavia postavy. NG: A náš prípad? Fifko: Výborný začiatok. Zatvorená krčma, zmiznutá naberačka.");
        case "witness": if (!flags.fifkoLydaLead && !flags.witness) return talk("Najprv sa porozprávam s Fifkom o náleze pri škôlke."); clue("witness", "Lyda videla neznámeho človeka ísť od festivalu cez škôlku smerom k lesnému rázcestiu. Mal vysoké topánky; v blate tam mohli zostať stopy."); return talk("NG: Fifko vravel, že si ráno niekoho videla pri škôlke. Lyda: Áno, neznámy človek šiel od festivalu cez škôlku smerom k lesnému rázcestiu. To s tým žltým autom je somarina, videla som človeka. Mal vysoké topánky, tvár som nevidela. NG: Na rázcestí by mohli zostať stopy v blate.");
        case "oldhome": return talk("Jasné. V tejto bytovke pri škole ste bývali, kým ste sa presťahovali do domu pri škôlke. Ja tu nebývam, ale o bytovke mám informácie. NG: Teraz máme za domom ovocné stromy a občas návštevu z lesa. Lyda: A pred domom lavičky pod strieškou. Rodičia tam chodia na cigaretu, však? NG: Hej, hneď pri dome.");
        case "hallway": return talk("Lyda: Podľa toho, čo mi hovoria ľudia z bytovky, stále neznesú na chodbe ani smietku. Sotva niekto prejde v zablatených topánkach, už sa zisťuje, kto má službu. NG: Kokos, to si pamätám. Človek ešte ani nevyšiel z bytu a už bolo treba zase upratovať. NG: Tu by som stopy z lesa neskúmala. Kým vytiahnem zápisník, niekto ich vytrie.");
        case "orchard": return talk("Pod ovocnými stromami za domom bolo ráno zase popadané ovocie a nové stopy. Občas tam z lesa prídu zvieratá. Pozerať sa môžeš, ale nechaj ich na pokoji.");
        case "soup": return talk("Mama: Vývar so slížami. Veď vieš, u nás sa polievka nevynecháva. NG: To je jediná záhada, ktorú vyriešim ešte pred otázkou, čo je na obed. Mama: Tak si daj, kým je teplá. Pátranie chvíľu počká. NG: Krčma zatvorená, naberačka preč, ale doma vývar so slížami. Aspoň na niečo sa dá spoľahnúť.");
        case "disco": return talk("Simona: Ako by som zabudla! S kamoškami sme chodievali na diskotéku do Lednických Rovní a ty si tam mala tých svojich diskotékových frajerov. NG: Mali výborný nástup na parket. Horšie to bolo s rozhovorom po pesničke. Simona: Aspoň vedeli tancovať? NG: Vo vlastnej verzii rytmu určite. Dnes radšej rozlúštim záhadu.");
        case "festival": clue("festival", "Na najväčšej udalosti roka v Zubáku chýba slávnostná naberačka. Pátranie sa začína."); return talk("Gulášfest je najväčšia udalosť roka v Zubáku. Stretnú sa tu susedia aj rodáci, ktorí sa domov dostanú len párkrát do roka. Všetky kotlíky sú tu, len slávnostná naberačka nie! Zisti, čo sa stalo. Bez nej Fifko odmieta uznať výsledky degustácie.");
        case "rumor": return talk("Tú krčmu kedysi vlastnil Kalus. NG: Aj dedo sem chodieval a rodičia sa s Kalusovcami kedysi kamarátili. Ľudia teraz hovoria, že tam niečo straší. Ale ľudia tiež hovoria, že guláš netreba miešať. Ver dôkazom.");
        case "recording": if (flags.recording) return talk("Zvuk skladby už máš. Video zostáva súkromné. Teším sa, keď zahráš s kapelou!"); clue("recordingAsked", "Kapele vypadla klaviristka. NG ju zastúpi; Simona má video skúšky v telefóne pri chatke a potrebuje Betkin súhlas na vystrihnutie iba zvuku."); return talk("Simona: Vypadla klaviristka. Naposledy sme ju videli bežať cez kopec smerom na Dohňany. NG: Môžem ju zastúpiť, ale nepoznám skladbu. Ozaj a prečo ju nezastúpiš ty? Simona: Ja hrám hádzanú. Ty hráš na klavíri. Zo skúšky mám video tej skladby, ale Betka na ňom spadla a bojí sa, že to niekto uvidí a bude mať medzi Zubáčanmi trápas. Telefón som nechala pri opustenej chatke. Skoč mi, prosím, poň a dohodni sa s Betkou na použití iba zvuku; potom ti skladbu vystrihnem.");
        case "returnPhone": if (!flags.recordingAsked) return talk("Najprv si povedzme, čo sa deje s kapelou."); if (flags.phoneReturned) return talk("Telefón už mám späť, ďakujem."); if (!has("phone")) return talk("Telefón som nechala pri opustenej chatke."); flags.phoneReturned = true; return talk("To je môj telefón, ďakujem! Video nebudeme nikomu ukazovať. So súhlasom Betky pripravím iba zvuk skladby.");
        case "edit": if (!flags.recordingAsked || !flags.phoneReturned || !flags.audioConsent) return talk("Potrebujem svoj telefón späť a Betkin súhlas s použitím iba zvuku skladby. Najprv sa porozprávajme o kapele; video zostane súkromné."); add("audioTrack"); clue("recording", "Simona so súhlasom Betky pripravila iba zvuk skladby pre NG. Súkromné video nikto iný neuvidí."); return talk("Hotovo, tu je iba zvuk skladby. Video s Betkiným pádom zostáva u mňa a nikto iný ho neuvidí. NG: Naučím sa ju doma na klavíri a na festivale zahrám s kapelou.");
        case "consent": if (!flags.recordingAsked) return talk("Čo sa má púšťať? Najprv sa opýtaj Simony, čo vlastne nahrala."); flags.audioConsent = true; return talk("S použitím iba zvuku skladby súhlasím. Video s mojím pádom nech zostane u Simony, nikto iný ho neuvidí. Organizujem festival, nie súťaž o najrýchlejší pád.");
        case "music": return talk(flags.recording ? "Vypočuj si nahrávku skladby a nauč sa ju doma na klavíri. Kapela sa na teba teší." : "Najprv potrebujem telefón a Betkin súhlas na vystrihnutie iba zvuku skladby.");
        case "chalk": if (!flags.plasterLead) return talk("Najprv sa skús na sadru opýtať pri pulte v obchode."); add("chalk"); return talk("Áno, tú poslednú sadru som kúpila ja, chcela som z nej niečo tvoriť. Mám aj nádobku a vodu. Vezmi si ich a urob odliatok, nech si ten vzor môžeš poriadne prezrieť. Chcela by som byť sochárkou.");
        case "shop": return talk("Kým tu čakám pred COOP Jednotou, spomínam si, koľko obchodov tu kedysi bolo. Niektoré už zavreli a zostali po nich len spomienky. NG: A COOP je dnes jediné otvorené miesto na nákup? Kika: To sa radšej opýtaj dospelých.");
        case "denmark": return talk("Dánsko! Bicykle, more a škoricové pečivo. Raz by som sa tam chcela pozrieť. NG: A gulášfest? Kika: Ten by som im predviedla.");
        case "jozo": return talk("Môj vysnívaný frajer je Jožo. Keby teraz prišiel, chcela by som pôsobiť pokojne a záhadne. NG: A namiesto toho zachraňujeme koncert. Simona: Aspoň bude o čom hovoriť.");
        case "kalus": return talk("Simona: Tvoji rodičia sa kedysi kamarátili s Kalusovcami. A tvoj dedo chodieval do tejto krčmy ešte v čase, keď ju vlastnil Kalus. NG: Takže krčma je súčasťou rodinných spomienok. Simona: Aj preto je škoda, že je zavretá. Ale staré príbehy si radšej over u rodiny, nie z dedinských rečí.");
        case "math": add("math"); return talk("Starý krčmár zapísal kód takto: sčítaj číslice roku založenia kostola a výsledok umocni na druhú.");
        case "route": if (!flags.brnoStarted) return talk("Peter chce niekam cestovať? Najprv od neho zisti, dokedy tam musí prísť."); add("route"); return talk("Peter musí byť v Brne o 12:30. Autobus zo Zubáka do Púchova ide 40 minút. Na prestup treba 20 minút. Vlak odchádza o 7:45 a do Brna ide 4 hodiny. Pozri sa na odchody autobusov a nájdi najneskorší spoj, ktorým príde načas.");
        case "olympiad": return talk("Na matematickej olympiáde si ukázala, že vieš premýšľať, nielen hádať. Urob to rovnako aj teraz. A neprestávaj hrať na klavíri.");
        case "sparePart": if (!flags.mixerBroken || has("sparePart") || has("mixer")) return talk("Teraz náhradný diel nepotrebujeme."); flags.partAvailable = true; return talk("Náhradný ozubený remeň máme v dielni. Pokojne si ho vezmi. " + (action.target === "husband" ? "Ak sa bojíš psa, najprv ho zavriem do záhrady." : "Ak sa bojíš psa, manžel ho najprv zavrie do záhrady."));
        case "secure": if (!flags.mixerBroken) return talk("Teraz do dielne nepotrebuješ ísť."); flags.dogSafe = true; return talk("Jasné. Psa som zavrel do zadnej záhrady a bránku zaistil. Nemusíš sa k nemu približovať.");
        case "tools": return talk("V dielni máme náradie a náhradné diely na opravy.");
        case "brno": if (flags.brnoReady) return talk("Môj sen je bývať v Brne. Už mám plán, ktorý nevyžaduje teleport. A Simona mi povedala, že ak odídem, nemusím prestať byť kamarát."); clue("brnoStarted", "Peter sa potrebuje dostať do Brna na pohovor o 12:30. Nevie, ako dlho trvá cesta ani koľko času potrebuje na prestup; pani učiteľka mu to zistí."); return talk("Peter: Oné, mám pozvanie na pohovor až v Brne. Musím tam byť o 12:30, ale neviem, ako dlho trvá cesta. Verejnou dopravou to nie je len tak. Neviem ani, koľko času si nechať na prestup. Ty sa dobre poznáš s našou učiteľkou. Možno by vedela, ako sa tam dostať. Mohla by nám s tým pomôcť? NG: Jasné, spýtam sa jej. Jazdiť MHD nie je hanba. Zubák Expres je zážitok!");
        case "itinerary": if (!flags.routeChecked) return talk("Najprv si vyžiadaj od pani učiteľky, ako dlho trvá cesta do Púchova a koľko času treba na prestup. Potom porovnaj jej informácie s odchodmi autobusov na zastávke."); clue("brnoReady", "Peter prijal plán cesty do Brna na pohovor o 12:30."); return talk("Autobus o 6:45 príde do Púchova o 7:25, takže stihnem vlak o 7:45. Cesta vlakom trvá štyri hodiny; v Brne budem o 11:45, ešte pred pohovorom o 12:30. Vďaka!");
        case "explain":
          flags.foresterAsked = true;
          if (!has("plan")) return talk("Žliabok je popraskaný a voda uniká. Preto niektorí ľudia v dedine nemajú v studni vodu. Presný postup opravy, žiaľ, nepoznám. NG: Skúsim sa popýtať v dedine.");
          clue("drain", "Podľa krčmárovho plánu treba žliabok vyčistiť a vybetónovať. Na prípravu betónu potrebujeme miešačku.");
          return talk("NG: Priniesla som krčmárov zápisník aj plán! Lesník: Teraz vidím, ako ten poondený žliabok opraviť. Poškodený žliabok treba vyčistiť a vybetónovať podľa nákresu. Na betón potrebujeme miešačku.");
        case "checkRepair": return act(state, { type: "object", target: "repair" });
        case "ladletruth": if (!flags.bootMatched && !flags.ladleSpotted) return talk("Teraz riešim hlavne prepad pri prameni."); if (!flags.waterFixed) return talk("Najprv dokončíme opravu, potom sa pozrieme, čo ďalej."); add("ladle"); return talk("NG: Keď ste ráno šli okolo škôlky smerom k lesnému rázcestiu, niesli ste už túto naberačku? Lesník: Áno. Požičal som si ju na čistenie prepadu. Odkaz som nechal pri krčme, ale asi ho odniesol vietor. Lesník má nosiť lopatku, nie si požičiavať festivalovú naberačku. Nabudúce budem pripravený. Tu je, môžete ju vrátiť na gulášfest.");
        default: return talk("Teraz mi nič ďalšie nenapadá.");
      }
    }
    if (!here.objects.includes(action.target)) return say("Tento predmet tu nie je.");
    switch (action.target) {
      case "hatch": flags.wellOpen = !flags.wellOpen; return say(flags.wellOpen ? "Odklápam poklop zarovno so zemou. Pod ním je studňa. Zostávam na pevnom okraji, dolu neleziem." : "Poklop je opäť zavretý, aby do otvoru nikto nespadol.");
      case "water": if (!flags.wellOpen) return say("Najprv musím otvoriť poklop studne."); clue("dry", "Studňa pod poklopom v lese za domom NG má veľmi nízku hladinu. Neskôr treba studňu znovu skontrolovať."); if (flags.waterFixed) { flags.wellChecked = true; return say("Hladina v našej studni za domom sa vracia! Oprava žliabka pri Sirkovej vode zabrala: voda už neuniká a zase priteká až sem do studne. Mama sa už nebude musieť chodiť sprchovať na bytovku!"); } return say("V studni je zase takmer sucho. Na vnútornom obložení je stará značka hladiny. Niečo prerušilo prítok, nebudem liezť dolu.");
      case "poster": clue("festival", "Gulášový festival, najväčšia udalosť roka v Zubáku, je na ihrisku. Zmizla slávnostná naberačka."); return say("GULÁŠFEST ZUBÁK - NAJVÄČŠIA UDALOSŤ ROKA! Ihrisko, ochutnávky, hudba, vyhlásenie. Celá dedina pri jednom kotlíku! A rukou dopísané: KTO MÁ NABERAČKU?");
      case "notice": clue("pubNotice", "Na dverách krčmy je tabuľa ZATVORENÉ."); return say("Túto krčmu kedysi vlastnil Kalus. Na dverách je dnes tabuľa: ZATVORENÉ. To je čudné.");
      case "matcha": clue("matchaSeen", "Pred zatvorenou krčmou je rozsypaná matcha. Čo tu robí?"); return say("Hm, matcha. Čo tá robí pred zubáckou krčmou?");
      case "door":
        if (flags.pubOpen && flags.journalFound && flags.coffeeSeen) return say("Dvere zostávajú otvorené. Viac už v krčme nie je.");
        if (!flags.pubOpen) {
          if (!flags.pubCodeKnown) return say("Zamknuté.");
          if (!has("math")) return say("Dvere majú číselný zámok. Pani učiteľka pozná hádanku, ktorá mi pomôže zistiť kód.");
          if (String(action.answer) !== "225") return say(action.answer ? "Zámok sa ani nepohne. Tento kód nie je správny." : "Dvere majú číselný zámok.");
          flags.pubOpen = true;
        }
        add("journal"); add("plan");
        clue("journalFound", "V krčme je krčmárov zápisník s plánom opravy žliabka a prívodu k studni.");
        clue("coffeeSeen", "V zatvorenej krčme je balíček výberovej kávy.");
        return say("Dvere sú otvorené a nechám ich odomknuté. V skrinke nájdem krčmárov zápisník a plán opravy žliabka aj prívodu k našej studni. Beriem ich lesníkovi. Ale čo je toto? Výberová káva? Čudné, čo robí v zubáckej krčme? To by som tu teda nečakala.");
      case "box": return say("Skrinku netreba odomykať. Plán aj zápisník nájdem pri vstupe do krčmy.");
      case "piano":
        if (action.festivalAttempt !== true || flags.festivalReady) return say("Moje pianíno z bytovky. Tato ho už priviezol, zatiaľ stojí pred domom. Môžem si na ňom voľne zahrať.");
        if (!has("audioTrack")) return say("Najprv potrebujem zvukovú nahrávku od Simony, aby som sa naučila skladbu na festival.");
        if (action.answer !== "EGA") return say("To nebolo ono. Skúsim to znova.");
        clue("festivalReady", "NG sa naučila skladbu a je pripravená zastúpiť klaviristku na gulášfeste.");
        return say("A mám to! Som pripravená vystúpiť na festivale.");
      case "tracks": flags.tracksSeen = true; if (flags.tracks) { add("footprint"); return say("Odliatok už mám. Vo vzore pracovnej podrážky chýba trojuholníkový kúsok. Treba nájsť topánku s rovnakým poškodením."); } if (action.item !== "chalk" || !has("chalk")) return say("Časť stôp má podozrivo pravidelný vzor. Chcelo by to nejako zachytiť, kým sa obrysy stratia. Sadrou by sa dal urobiť odliatok a potom vzor porovnať. Skúsim sa na sadru opýtať v obchode."); add("footprint"); clue("tracks", "Sadrový odliatok zachytil pracovnú podrážku s chýbajúcim trojuholníkom vo vzore. Majiteľa zatiaľ nepoznáme. Medvedia stopa to nie je."); return say("Zmiešam sadru s vodou, nalejem ju do stopy a počkám, kým stuhne. Je to pracovná topánka! Vo vzore chýba malý trojuholník, akoby sa z podrážky odtrhol kúsok gumy. Odliatok si vezmem a teraz si zahrám na Popolušku: vyskúšam ho ľuďom na topánky a zistím, komu táto stopa patrí.");
      case "railTraces": return say("Medzi koreňmi vidno zarovnaný násyp a kus starého podvalu. Takto tu kedysi viedla železnica z Lednice; vlak už dávno nejazdí. Za Sirkovú vodu sa nevydám: tam začína hranica, husté blato a nebezpečný terén. Ďalej sa teraz dostanem už len autobusom Zubák Expres.");
      case "melody": add("notes"); return say("Hmm, nejaký papier s notami. Prvé dve prečítam: E–G. Posledná je rozmazaná, tú nedokážem prečítať.");
      case "repair":
        if (flags.waterFixed) return say("Žliabok je už opravený a voda opäť priteká do studne.");
        if (!flags.bearSafe) return say("K práci na prepade sa zatiaľ nedostanem. Najprv potrebujem povolenie od colníka a bezpečnú trasu.");
        if (!flags.drain) return say("Zatiaľ neviem, ako žliabok opraviť. Musím sa popýtať po dedine.");
        const missing = [];
        if (!has("plan")) missing.push("plán opravy z krčmy");
        if (!has("mixer")) missing.push("miešačku");
        if (!flags.transport) missing.push("dohodnutý odvoz s tatom");
        if (missing.length) return say(`Na opravu ešte potrebujem: ${missing.join(", ")}.`);
        clue("waterFixed", "Tato a lesník vyčistili žliabok a vybetónovali poškodenú časť. Po vytvrdnutí betónu obnovili prítok do studne.");
        clue("equipmentReturned", "Tato po oprave vrátil umytú miešačku Miešačke.");
        return say("Lesník: Tato priviezol miešačku SUV. Spolu sme vyčistili žliabok a podľa plánu vybetónovali poškodené dno aj okraje. Po vytvrdnutí betónu sme pustili vodu späť. Už neuniká bokom, ale tečie k studni. Tato potom odviezol umytú miešačku späť Miešačke. " + (flags.bootMatched ? "NG: Hotovo! Teraz si od lesníka vypýtam sľúbenú naberačku." : "NG: Hotovo! Voda zase tečie k studni."));
      case "finish": {
        return say(has("ladle") ? "Naberačku odovzdám Fifkovi, ten sa o festival postará." : "Vo festivalovom kotlíku chýba slávnostná naberačka.");
      }
      case "board": return say("V školskej kronike je zápis o klavírnej súťaži v Trenčíne, na ktorú sa NG prebojovala.");
      case "bells": clue("history", "Kostol sv. Vendelína sa začal stavať v roku 1806. Kameň na stavbu dovážali z Lysej pod Makytou. V roku 1915 boli zhabané dva zvony."); return say("Kostol sv. Vendelína sa začal stavať v roku 1806. Kameň na stavbu dovážali z Lysej pod Makytou. Počas prvej svetovej vojny boli v roku 1915 zhabané dva zvony. Na rozsiahle opravy v roku 1928 prispeli aj vysťahovalci zo Zubáka žijúci v Amerike.");
      case "dog": return say(flags.dogSafe ? "Pes je bezpečne v zadnej záhrade. Môžem pokojne prejsť." : flags.mixerBroken && !has("mixer") && !flags.equipmentReturned ? "Bojím sa psov. Požiadam majiteľa, aby psa zaistil, namiesto toho, aby som sa nútila prejsť okolo neho." : "Bojím sa psov. Teraz tu nič nepotrebujem, tak sa k nemu nebudem približovať.");
      case "bear": return say("V diaľke sa niečo pohybuje. Nezisťujem to zblízka. Medveď nie je podozrivý, ktorého treba vypočúvať.");
      case "suv": return say("Tatovo SUV. SUV síce nemám rada, ale keď ma tato vezie na stanicu do Púchova, to je výnimka. Vtedy nad SUV prižmúrim oči.");
      case "fence": if (!flags.ladleTip) return say("Materská škola má oplotený dvor a malú bránku. Dnes je tu pokoj."); clue("fenceChecked", "Za plotom škôlky stojí žltý fúrik. Cez úzku bránku auto neprejde."); return say("Za plotom stojí žltý fúrik. Bránka je príliš úzka na auto. Poviem Fifkovi, čo som našla.");
      case "balcony": return say("Bytovka hneď vedľa školy a pri ihrisku, kde sme kedysi bývali. Odtiaľto sme počuli každý zápas.");
      case "shelf": if (flags.tracksSeen && !flags.tracks && !has("chalk")) { clue("plasterLead", "V obchode už sadru nemajú. Posledné balenie kúpila Kika, ktorá stojí pred COOP Jednotou."); return say("Pri pulte sa opýtam na sadru. Dozviem sa, že posledné balenie dnes kúpila Kika. Ešte stojí pred obchodom, skúsim sa jej opýtať, či mi trochu nedá."); } return say("V obchode sa dnes rieši hlavne gulášfest. Na pulte pribúdajú nákupy na varenie a rozhovory o tom, kto tento rok vyhrá.");
      case "archive": return say("Na výveske sú miestne podujatia a úradné oznamy. Nič také konkrétne.");
      case "gym": return say("Konečne môžu na návštevu do Zubáka prísť aj hotačky z Brna, Nikča a Verka!");
      case "view": return say("Nad kostolom stúpa krížová cesta. Jej vybudovanie stálo veľa peňazí, o tom sa v dedine ešte stále rozpráva. Betónu je tu veru požehnane. Ešte chvíľu a ľudia sa budú môcť pri jednotlivých zastaveniach prežehnať rovno zo SUV. Ani vystupovať nebude treba.");
      case "drum": return say(flags.mixerBroken && !has("mixer") && !flags.equipmentReturned ? "Miešačka je pokazená. Potrebuje náhradný ozubený remeň." : "Na dvore stojí miešačka na betón.");
      case "tools": if (!flags.mixerBroken) return say("Do dielne teraz nepotrebujem ísť."); if (has("mixer") || flags.equipmentReturned || flags.waterFixed) return say("Náhradný diel už Miešačka dostala."); if (has("sparePart")) return say("Náhradný diel už mám. Odnesiem ho Miešačke."); if (!flags.partAvailable) return say("Najprv sa opýtam sesternice alebo jej manžela na náhradný diel."); if (!flags.dogSafe) return say("Do dielne nepôjdem okolo psa. Najprv poprosím manžela sesternice, aby ho zaistil."); add("sparePart"); return say("V dielni nájdem náhradný ozubený remeň do miešačky. Vezmem ho Miešačke.");
      case "timetable":
        if (!flags.brnoStarted) return say("Na tabuli sú odchody autobusov do Púchova. Keď zistíme cieľ cesty, budeme vedieť, ktorý spoj hľadať.");
        if (!has("route")) return say("Na tabuli vidím päť autobusov do Púchova: 5:20, 6:45, 8:10, 10:05 a 13:30.");
        if (action.item !== "route") return say("Peterov plán mám v batohu. Vyber ho a použi na cestovný poriadok, potom porovnáme časy.");
        if (action.answer !== "6:45") return say(["8:10", "10:05", "13:30"].includes(action.answer) ? "Tento autobus príde do Púchova až po odchode vlaku o 7:45. Peter by prestup nestihol." : action.answer === "5:20" ? "Autobus o 5:20 príde do Púchova o 6:00. Peter by čakal zbytočne dlho. Skús nájsť neskorší spoj, ktorý príde najneskôr o 7:25." : "Vyber jeden z odchodov na tabuli a počítaj so 40 minútami cesty a 20 minútami na prestup.");
        clue("routeChecked", "Spoj do Púchova: autobus zo Zubáka o 6:45 príde o 7:25. Vlak do Brna odchádza o 7:45, takže zostáva 20 minút na prestup; po štvorhodinovej ceste príde Peter o 11:45, pred pohovorom o 12:30.");
        return say("Autobus o 6:45 príde do Púchova o 7:25. Na prestup do vlaku o 7:45 zostáva presne 20 minút. To je najneskorší vhodný spoj.");
      case "channel": return say(flags.waterFixed ? "Opravený žliabok. Prípad tečie správnym smerom." : "Zanesený povrchový prepad. Lesník vie viac; ja sem sama žiadne stroje ťahať nebudem.");
      case "panorama": return say("Z veže vidno lesy Bielych Karpát, dolinu aj dedinu pod nami. Odtiaľto všetko vyzerá pokojnejšie.");
      case "tireRuts": clue("towerRuts", "Pri rozhľadni sú vyjazdené koľaje po SUV. NG sa nepáči jazdenie k jej obľúbenému výletnému miestu; chce o tom hovoriť s tatom."); return say(flags.towerDiscussed ? "Koľaje ešte nezmizli, ale s tatom sme sa dohodli: vybavenie odvezie tam, kde je dohodnutý prístup, a k rozhľadni pôjdeme pešo. SUV nemusí byť na každej rodinnej fotke." : "Dve široké koľaje a rozjazdená tráva. Občas sem ľudia prídu na SUV a mne sa to vôbec nepáči. Auto nech zostane dole, výhľad si rada vyšliapem. Tato má tiež SUV; doma mu poviem, prečo mi na tomto mieste záleží. Tieto stopy nie sú dôkazom v prípade naberačky.");
      case "ridgeview": return say("Žrnová a Kýčera patria k miestnym výletným cieľom. Biele Karpaty, lesy a konečne chvíľka bez gulášových teórií.");
      case "phone": if (flags.phoneReturned || has("phone")) return say("Telefón už pri chatke nie je."); add("phone"); return say(flags.recordingAsked ? "Pri chatke leží Simonin telefón. Beriem ho, aby som jej ho vrátila. Obsah neotváram." : "Pri chatke leží neznámy telefón. Vezmem ho, aby som ho mohla vrátiť majiteľovi. Súkromný obsah neotváram.");
      case "cabinMemory": return say("Táto opustená chatka mi pripomína, ako sme tu kedysi s kamarátmi pili alkohol. Zostanem vonku.");
      default: return say("Zatiaľ nič zvláštne.");
    }
  }
  const optionalTopics = new Set([
    "orchard", "soup", "television", "familyHistory",
    "breznice", "familyHouse", "goulash", "screenplays", "looksmaxing", "nickname",
    "village", "ebike", "railway", "oldhome", "hallway", "oldshops", "rumor", "rail",
    "jozo", "disco", "shop", "denmark", "olympiad", "poker", "tools"
  ]);
  function interact(state, action) {
    const result = act(state, action);
    if (action.type === "talk" && optionalTopics.has(action.topic)
      && places.find(place => place.id === state.location).people.includes(action.target)
      && people[action.target].topics.some(([topic]) => topic === action.topic)) {
      state.flags[`heard:${action.target}:${action.topic}`] = true;
    }
    return result;
  }
  function hint(state) {
    const flags = state.flags;
    if (state.finished) return "Prípad je vyriešený. Dedina je naďalej tvoja.";
    if (state.inventory.includes("ladle")) {
      if (!flags.wellChecked) return "Po oprave znovu skontroluj studňu za domom.";
      if (flags.festivalReady) return "Odovzdaj slávnostnú naberačku Fifkovi na ihrisku.";
      if (!flags.recordingAsked) return "Opýtaj sa Simony na ihrisku, kto dnes hrá s kapelou.";
      if (!flags.phoneReturned && !state.inventory.includes("phone")) return "Pri opustenej chatke nájdeš Simonin telefón.";
      if (!flags.phoneReturned) return "Vráť nájdený telefón Simone na ihrisku.";
      if (!flags.audioConsent) return "Dohodni s Betkou v Bednároch použitie iba zvuku skladby.";
      if (!state.inventory.includes("audioTrack")) return "Požiadaj Simonu o vystrihnutie iba zvuku skladby.";
      return "Vypočuj si nahrávku a doma pri klavíri sa priprav na vystúpenie s kapelou.";
    }
    const tracksHint = () => {
      if (!flags.tracksSeen && !flags.tracks) return "Na lesnom rázcestí si prezri podozrivé stopy z bezpečnej cesty.";
      if (!flags.tracks && !state.inventory.includes("chalk") && !flags.plasterLead) return "Na odliatok potrebuješ sadru. Opýtaj sa na ňu pri pulte v COOP Jednote.";
      if (!flags.tracks && !state.inventory.includes("chalk")) return "Poslednú sadru kúpila Kika. Opýtaj sa jej pred COOP Jednotou.";
      if (!flags.tracks) return "Vyber sadru v batohu a použi ju na podozrivé stopy pri lesnom rázcestí.";
      return null;
    };
    const repairInProgress = flags.foresterAsked || flags.repairLead || flags.journalFound || flags.drain || flags.waterFixed;
    if (!repairInProgress) {
      if (!flags.dry) return "Mama chcela skontrolovať studňu za domom.";
      if (!flags.festival) return "Prezri program gulášfestu na ihrisku alebo sa opýtaj Betky doma v Bednároch.";
      const tracks = tracksHint();
      if (tracks) return tracks;
    }
    if (!flags.bearSafe && !flags.wardenMet) return "Pri Sirkovej vode sa porozprávaj s colníkom pred závorou.";
    if (!flags.bearSafe && !flags.brnoStarted) return "Peter pri zastávke potrebuje hovoriť o svojom pláne s Brnom. Môžeš ho už požiadať aj o prihovorenie u colníka.";
    if (!flags.bearSafe && !flags.brnoReady && !state.inventory.includes("route")) return "Pani učiteľka zistí dĺžku cesty do Púchova aj potrebný čas na prestup.";
    if (!flags.bearSafe && !flags.brnoReady && !flags.routeChecked) return "Vyber Peterov plán v batohu a použi ho na cestovný poriadok. Autobus ide 40 minút, vlak odchádza o 7:45 a prestup trvá 20 minút. Ktorý autobus príde najneskôr o 7:25?";
    if (!flags.bearSafe && !flags.brnoReady) return "Vráť sa k Petrovi s overeným itinerárom.";
    if (!flags.bearSafe) return "Požiadaj Petera, aby sa za teba prihovoril colníkovi. Priamo zavolá a vybaví povolenie za závoru.";
    if (!flags.foresterAsked && !flags.journalFound) return "Pri Sirkovej vode sa porozprávaj s lesníkom o oprave žliabka.";
    if (!flags.repairLead && !flags.journalFound) return "Lesník nepozná presný postup opravy. Opýtaj sa mamy alebo tata, kde nájdeš Kalusov plán.";
    if (!flags.pubCodeKnown && !flags.pubOpen) return "Plán je v krčme. Spýtaj sa starostu, ako otvoríš dvere.";
    if (!state.inventory.includes("math") && !flags.pubOpen) return "Pani učiteľka pozná číselnú hádanku ku dverám krčmy.";
    if (!flags.journalFound) return "Kostol: 1806. Súčet číslic umocnený na druhú otvorí dvere krčmy. Pri vstupe nájdeš plán.";
    if (!flags.drain && !flags.waterFixed) return "Prines plán z krčmy lesníkovi a spolu prejdite postup opravy.";
    if (!flags.waterFixed) {
      if (!state.inventory.includes("mixer") && !flags.mixerBroken) return "Opýtaj sa Miešačky na požičanie miešačky.";
      if (!state.inventory.includes("mixer") && state.inventory.includes("sparePart")) return "Odovzdaj náhradný diel Miešačke.";
      if (!state.inventory.includes("mixer") && !flags.partAvailable) return "Opýtaj sa sesternice alebo jej manžela na náhradný diel do miešačky. Tato ti môže poradiť, kde ho hľadať.";
      if (!state.inventory.includes("mixer") && !flags.dogSafe) return "Popros manžela sesternice, aby zaistil psa.";
      if (!state.inventory.includes("mixer")) return "Vezmi náhradný diel z dielne v Malušinci.";
      if (!flags.transport) return "Požiadaj tata, aby odviezol miešačku a pomohol pri oprave.";
    }
    if (!flags.drain) return "Pri prameni sa porozprávaj s lesníkom o prepade.";
    if (!flags.waterFixed) return "Zastav sa pri prameni za lesníkom a skontroluj opravu žliabka.";
    const tracks = tracksHint();
    if (tracks) return tracks;
    if (!flags.bootMatched) return "Porovnaj sadrový odliatok s topánkou lesníka pri Sirkovej vode.";
    return "Žliabok je opravený. Vypýtaj si od lesníka sľúbenú naberačku.";
  }
  function quests(state) {
    const flags = state.flags;
    return [
      { title: "Plán opravy žliabka", started: Boolean(flags.foresterAsked || flags.repairLead), done: flags.waterFixed, next: !flags.foresterAsked && !flags.journalFound ? "Porozprávaj sa s lesníkom o oprave žliabka." : !flags.repairLead && !flags.journalFound ? "Popýtaj sa v dedine, kde nájdeš plán opravy žliabka." : !flags.pubCodeKnown && !flags.pubOpen ? "Spýtaj sa starostu na dvere krčmy." : !flags.journalFound ? "Zisti hádanku od učiteľky a odomkni dvere krčmy kódom." : !flags.drain ? "Prejdi nájdený plán s lesníkom." : "Zabezpeč vybavenie a opravte žliabok." },
      { title: "Fifkov prvý prípad", started: flags.ladleTip, done: flags.fifkoCleared, next: !flags.fenceChecked ? "Prever žltý predmet za plotom škôlky." : !flags.fifkoLydaLead && !flags.witness ? "Povedz Fifkovi o fúriku." : !flags.witness ? "Opýtaj sa Lydy pri bytovke na chodca." : "Vráť sa k Fifkovi a porovnaj dôkazy." },
      { title: "Náhradná klaviristka", started: flags.recordingAsked || flags.recording, done: flags.festivalReady, next: !flags.phoneReturned ? (state.inventory.includes("phone") ? "Vráť telefón Simone." : "Nájdi telefón pri opustenej chatke.") : !flags.audioConsent ? "Dohodni s Betkou použitie iba zvuku skladby." : !state.inventory.includes("audioTrack") ? "Požiadaj Simonu o zvuk skladby." : "Vypočuj si nahrávku a priprav sa pri klavíri na vystúpenie." },
      { title: "Brno nie je teleport", started: flags.brnoStarted || flags.wardenMet, done: flags.brnoReady, next: !flags.brnoStarted ? "Peter pomôže s povolením za závoru, keď mu pomôžeš s Brnom. Opýtaj sa ho na cestu." : !state.inventory.includes("route") ? "Zisti od učiteľky dĺžku cesty do Púchova a čas potrebný na prestup." : !flags.routeChecked ? "Porovnaj časy od učiteľky s cestovným poriadkom a vyber najneskorší vhodný autobus." : "Ukáž výsledok Petrovi a vypočuj si jeho rozhodnutie." },
      { title: "Pokazená miešačka", started: flags.mixerBroken || state.inventory.includes("mixer"), done: flags.equipmentReturned, next: state.inventory.includes("mixer") ? (!flags.transport ? "Dohodni s tatom odvoz miešačky." : "Zastav sa za lesníkom a skontroluj opravu žliabka.") : state.inventory.includes("sparePart") ? "Odnes náhradný diel Miešačke." : !flags.partAvailable ? "Opýtaj sa sesternice alebo jej manžela na náhradný diel." : !flags.dogSafe ? "Popros manžela, aby zaistil psa." : "Vezmi náhradný diel z dielne." }
    ].filter(quest => quest.started).map(quest => ({ ...quest, done: Boolean(quest.done) }));
  }
  function availableTopics(state, person) {
    const flags = state.flags;
    const has = item => state.inventory.includes(item);
    const unlocked = {
      partLead: Boolean(flags.mixerBroken),
      transport: Boolean(has("mixer") && !flags.waterFixed),
      towerCars: Boolean(flags.towerRuts),
      ladle: true,
      fenceReport: Boolean(flags.ladleTip && flags.fenceChecked),
      returnLadle: has("ladle"),
      verdict: Boolean(flags.ladleTip && flags.witness && flags.fenceChecked),
      loan: Boolean(flags.drain || flags.mixerBroken),
      key: Boolean(flags.repairLead),
      repairLead: Boolean(flags.foresterAsked),
      witness: Boolean(flags.fifkoLydaLead || flags.witness),
      recording: true,
      returnPhone: Boolean(flags.recordingAsked && has("phone")),
      edit: Boolean(flags.recordingAsked && flags.phoneReturned && flags.audioConsent),
      consent: Boolean(flags.recordingAsked),
      music: Boolean(flags.recording),
      chalk: Boolean(flags.plasterLead),
      math: Boolean(flags.pubCodeKnown),
      route: Boolean(flags.brnoStarted),
      sparePart: Boolean(flags.mixerBroken),
      secure: Boolean(flags.mixerBroken),
      tools: true,
      itinerary: Boolean(flags.routeChecked),
      permission: Boolean(flags.wardenMet),
      compareBoot: Boolean(flags.tracks && !flags.bootMatched),
      explain: true,
      checkRepair: Boolean(flags.drain && flags.transport && has("plan") && has("mixer") && !flags.waterFixed),
      ladletruth: Boolean(flags.bootMatched || flags.ladleSpotted)
    };
    const completed = {
      case: flags.dry && flags.festival,
      partLead: flags.partLead || flags.partAvailable || has("sparePart") || has("mixer") || flags.waterFixed,
      transport: flags.transport,
      towerCars: flags.towerDiscussed,
      ladle: flags.ladleTip || flags.fifkoCleared,
      fenceReport: flags.fifkoLydaLead || flags.witness || flags.fifkoCleared,
      returnLadle: state.finished,
      verdict: flags.fifkoCleared,
      loan: has("mixer") || flags.equipmentReturned,
      key: flags.pubCodeKnown || flags.pubOpen,
      repairLead: flags.journalFound,
      witness: flags.witness,
      festival: flags.festival,
      recording: flags.recordingAsked || flags.recording,
      returnPhone: flags.phoneReturned,
      edit: flags.recording,
      consent: flags.audioConsent || flags.recording,
      music: flags.festivalReady,
      chalk: has("chalk") || flags.tracks,
      math: has("math") || flags.journalFound,
      route: has("route") || flags.brnoReady,
      sparePart: flags.partAvailable || has("sparePart") || has("mixer") || flags.waterFixed,
      secure: flags.dogSafe || has("mixer") || flags.waterFixed,
      tools: false,
      brno: flags.brnoStarted || flags.brnoReady,
      itinerary: flags.brnoReady,
      permission: flags.bearSafe,
      compareBoot: person === "ondrej" ? flags.bootMatched : flags[`compared:${person}`],
      explain: flags.drain || flags.waterFixed,
      ladletruth: has("ladle") || state.finished
    };
    return people[person].topics.filter(([topic]) => (person !== "warden" || topic === "compareBoot") && unlocked[topic] !== false && !completed[topic] && !flags[`heard:${person}:${topic}`])
      .map(([topic, label]) => [topic, person === "ondrej" && topic === "explain" && has("plan") ? "Priniesla som plán opravy žliabka." : person === "michacka" && topic === "loan" && has("sparePart") ? "Priniesla som náhradný remeň." : label]);
  }
  function activeInventory(state) {
    const flags = state.flags;
    const obsolete = {
      chalk: flags.tracks,
      key: flags.pubOpen,
      math: flags.journalFound,
      journal: flags.waterFixed,
      phone: flags.phoneReturned,
      plan: flags.waterFixed,
      mixer: flags.equipmentReturned,
      ladle: state.finished,
      rehearsal: true,
      route: flags.brnoReady,
      sparePart: flags.equipmentReturned
    };
    return state.inventory.filter(item => !obsolete[item]);
  }
  const api = { places, people, items, objects, createState, hasProgress, restore, scene, interact, hint, quests, availableTopics, activeInventory };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.Zubak = api;
})(typeof globalThis !== "undefined" ? globalThis : this);