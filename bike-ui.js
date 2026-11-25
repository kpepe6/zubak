(function (root) {
  "use strict";
  let serial = 0;

  function board() {
    const scores = root.ZubakScores;
    if (!scores) throw new Error("Chýba modul ZubakScores.");
    return scores;
  }

  function readRecords(storage) { return board().readLocal("bike", storage); }

  function saveRecord(storage, record) { return board().saveLocal("bike", storage, record); }

  function open(options = {}) {
    const doc = options.document || root.document;
    const view = doc.defaultView;
    const bike = root.ZubakBike;
    if (!bike) throw new Error("Chýba modul ZubakBike.");
    let storage = options.storage;
    if (storage === undefined) {
      try { storage = view.localStorage; } catch (_) { storage = null; }
    }
    const identifier = `bike-${++serial}`;
    const listeners = [];
    const previousFocus = doc.activeElement;
    const keys = new Set();
    const pointers = new Map();
    let state = null;
    let closed = false;
    let frameId = null;
    let previousTime = null;
    let exitPending = false;
    let resultShown = false;
    let chosenName = "";
    let lastHud = "";
    let pedalAngle = 0;
    let previousFalls = 0;
    const seenVehicles = new Set();
    let vehicleMessage = "";
    let vehicleMessageUntil = 0;
    const node = (tag, className, text) => {
      const element = doc.createElement(tag);
      if (className) element.className = className;
      if (text !== undefined) element.textContent = text;
      return element;
    };
    const listen = (target, type, callback, settings) => {
      target.addEventListener(type, callback, settings);
      listeners.push(() => target.removeEventListener(type, callback, settings));
    };
    const button = (text, className, action) => {
      const element = node("button", className, text);
      element.type = "button";
      listen(element, "click", action);
      return element;
    };
    const dialog = node("dialog", "bike-dialog");
    dialog.setAttribute("aria-labelledby", `${identifier}-title`);
    const header = node("header", "bike-header");
    const title = node("h2", "bike-title", "Zjazd Zubákom");
    title.id = `${identifier}-title`;
    const pauseButton = button("Pozastaviť", "bike-pause", togglePause);
    const returnButton = button("Ukončiť jazdu", "bike-return", requestExit);
    header.append(title, pauseButton, returnButton);
    const stage = node("div", "bike-stage");
    const canvas = node("canvas", "bike-canvas");
    canvas.width = 960;
    canvas.height = 540;
    canvas.style.width = "100%";
    canvas.style.maxWidth = "960px";
    canvas.style.height = "auto";
    canvas.style.imageRendering = "pixelated";
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "NG na bicykli na horskej ceste za Zubákom");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Prehliadač nepodporuje kreslenie hry.");
    const hud = node("div", "bike-hud");
    const location = node("p", "bike-location", "Rozhľadňa");
    location.setAttribute("aria-live", "polite");
    const panel = node("section", "bike-panel");
    const controls = node("div", "bike-controls");
    controls.setAttribute("aria-label", "Dotykové ovládanie");
    stage.append(canvas);
    dialog.append(header, hud, location, stage, panel, controls);

    function clearInput() {
      keys.clear();
      for (const [pointerId, value] of pointers) {
        try { if (value.element.hasPointerCapture(pointerId)) value.element.releasePointerCapture(pointerId); } catch (_) {}
      }
      pointers.clear();
    }

    function close() {
      if (closed) return;
      closed = true;
      clearInput();
      if (frameId !== null) view.cancelAnimationFrame(frameId);
      frameId = null;
      listeners.splice(0).forEach(remove => remove());
      if (dialog.open && typeof dialog.close === "function") dialog.close();
      dialog.remove();
      if (previousFocus && previousFocus.isConnected && typeof previousFocus.focus === "function") previousFocus.focus();
      if (typeof options.onClose === "function") options.onClose();
    }

    function heading(text) { panel.append(node("h3", "bike-panel-title", text)); }

    function startScreen() {
      clearInput();
      state = null;
      previousTime = null;
      exitPending = false;
      resultShown = false;
      pauseButton.disabled = true;
      controls.hidden = true;
      panel.hidden = false;
      panel.replaceChildren();
      heading("Na štart, NG!");
      panel.append(node("p", "bike-route", "NG: Vyrazím od rozhľadne cez Kýčeru a Žrnovú, minieme starú železnicu a Sirkovú vodu. Potom prejdem cez dedinu až k starostovi pred obecný úrad. Len nech sa mi do cesty nepripletie Zubák Expres!"));
      const computerInstructions = node("p", "bike-instructions", "Počítač: Šípkami vľavo a vpravo alebo A/D sa vyhýbaj, šípkou dole brzdi. Jednotlivými stlačeniami medzerníka šliap do pedálov; držanie nezrýchľuje.");
      const mobileInstructions = node("p", "bike-instructions", "Mobil: Drž tlačidlo smeru a druhým prstom ťukaj na pedál. Tlačidlom brzdy spomaľuješ.");
      const generalInstructions = node("p", "bike-instructions", "Po páde NG sama nasadne. Pauza zastaví čas, návrat do hry potvrď tlačidlom. Čas beží v mierke: sekunda jazdy je minúta na hodinách.");
      const form = node("form", "bike-start-form");
      const label = node("label", "bike-name-label", "Meno pretekárky");
      label.htmlFor = `${identifier}-name`;
      const input = node("input", "bike-name");
      input.id = label.htmlFor;
      input.name = "name";
      input.required = true;
      input.maxLength = 40;
      input.autocomplete = "nickname";
      input.value = chosenName;
      input.setAttribute("aria-describedby", `${identifier}-error`);
      const error = node("p", "bike-error");
      error.id = `${identifier}-error`;
      error.setAttribute("aria-live", "polite");
      const start = node("button", "bike-start", "Štart");
      start.type = "submit";
      form.append(label, input, error, start);
      listen(form, "submit", event => {
        event.preventDefault();
        const name = input.value.trim();
        if (!name || Array.from(name).length > 20) {
          error.textContent = "Zadaj meno s dĺžkou 1 až 20 znakov.";
          input.focus();
          return;
        }
        chosenName = name;
        begin();
      });
      panel.append(computerInstructions, mobileInstructions, generalInstructions, form,
        node("p", "bike-storage-note", "Najlepších 10 jázd sa ukladá v tomto prehliadači oddelene od príbehu. Spoločná tabuľka je dostupná, keď je pripojenie."),
        onlineSection(null, null));
      input.focus();
    }

    function begin() {
      clearInput();
      state = bike.create(chosenName);
      previousFalls = state.falls;
      pedalAngle = 0;
      seenVehicles.clear();
      vehicleMessage = "";
      vehicleMessageUntil = 0;
      previousTime = null;
      exitPending = false;
      resultShown = false;
      panel.replaceChildren();
      panel.hidden = true;
      controls.hidden = false;
      pauseButton.disabled = false;
      pauseButton.textContent = "Pozastaviť";
      pauseButton.focus();
      draw();
    }

    function pause() {
      clearInput();
      previousTime = null;
      if (!state || state.phase === "finished") return;
      bike.pause(state);
      pauseButton.textContent = "Pokračovať";
      if (exitPending) return;
      panel.hidden = false;
      panel.replaceChildren();
      heading("Jazda je pozastavená");
      const resume = button("Pokračovať v jazde", "bike-resume", resumeRide);
      panel.append(resume);
      resume.focus();
    }

    function resumeRide() {
      if (!state || exitPending || doc.hidden || (state.phase !== "paused")) return;
      clearInput();
      previousTime = null;
      bike.resume(state);
      pauseButton.textContent = "Pozastaviť";
      panel.hidden = true;
      panel.replaceChildren();
      pauseButton.focus();
    }

    function togglePause() {
      if (exitPending) return;
      if (state && state.phase === "paused") resumeRide();
      else pause();
    }

    function requestExit() {
      if (closed || exitPending) return;
      if (!state || state.phase === "finished") { close(); return; }
      pause();
      exitPending = true;
      panel.hidden = false;
      panel.replaceChildren();
      heading("Opustiť rozbehnutú jazdu?");
      panel.append(node("p", "bike-exit-copy", "Táto jazda sa neuloží do výsledkov."));
      const stay = button("Zostať v jazde", "bike-stay", () => { exitPending = false; pause(); });
      panel.append(stay, button("Opustiť jazdu", "bike-exit", close));
      stay.focus();
    }

    function onlineTable(entries, current) {
      const table = node("table", "bike-records bike-online-records");
      table.append(node("caption", "bike-records-caption", "Najlepší hráči (online)"));
      const head = node("thead");
      const row = node("tr");
      ["Poradie", "Meno", "Čas", "Pády"].forEach(text => {
        const cell = node("th", "", text);
        cell.scope = "col";
        row.append(cell);
      });
      head.append(row);
      const body = node("tbody");
      entries.forEach((entry, index) => {
        const mine = Boolean(current && entry.name === current.name && entry.date === current.date);
        const resultRow = node("tr", mine ? "bike-record-current" : "");
        if (mine) resultRow.setAttribute("aria-current", "true");
        [String(index + 1), entry.name, bike.format(entry.time), String(entry.falls)].forEach(text => resultRow.append(node("td", "", text)));
        body.append(resultRow);
      });
      table.append(head, body);
      return table;
    }

    function onlineSection(current, localTable) {
      const section = node("section", "bike-online");
      section.hidden = true;
      const scores = root.ZubakScores;
      if (!scores || !scores.available("bike")) return section;
      scores.fetchTop("bike", { storage }).then(server => {
        if (closed || !server) return;
        const entries = current ? scores.merge("bike", server, [current]) : scores.merge("bike", server);
        if (!entries.length) return;
        section.replaceChildren(onlineTable(entries, current), node("p", "bike-storage-note", "Spoločná tabuľka pre všetkých hráčov. Meno a výsledok vidia ostatní."));
        section.hidden = false;
        if (localTable && localTable.caption) localTable.caption.textContent = "Tvoje výsledky v tomto prehliadači";
      }).catch(() => {});
      return section;
    }

    function finish() {
      resultShown = true;
      clearInput();
      pauseButton.disabled = true;
      controls.hidden = true;
      const record = { name: chosenName, time: state.elapsed, falls: state.falls, date: new Date().toISOString() };
      const saved = saveRecord(storage, record);
      const records = saved ? readRecords(storage) : board().rank("bike", [...readRecords(storage), record]);
      panel.hidden = false;
      panel.replaceChildren();
      heading("Cieľ pri obecnom úrade!");
      panel.append(node("p", "bike-result", `${chosenName}: ${bike.format(state.elapsed)} · Pády: ${state.falls}`));
      panel.append(node("p", "bike-storage-status", saved ? "Výsledok bol uložený v tomto prehliadači." : "Výsledok sa nepodarilo uložiť. Zobrazený je iba dočasne."));
      const table = node("table", "bike-records");
      table.append(node("caption", "bike-records-caption", "Najlepších 10 jázd"));
      const head = node("thead");
      const row = node("tr");
      ["Poradie", "Meno", "Čas", "Pády", "Dátum"].forEach(text => {
        const cell = node("th", "", text);
        cell.scope = "col";
        row.append(cell);
      });
      head.append(row);
      const body = node("tbody");
      records.forEach((entry, index) => {
        const current = entry.name === record.name && entry.time === record.time && entry.date === record.date;
        const resultRow = node("tr", current ? "bike-record-current" : "");
        if (current) resultRow.setAttribute("aria-current", "true");
        const exactTime = `${bike.format(entry.time)} (${entry.time.toFixed(3)} s)`;
        [String(index + 1), entry.name, exactTime, String(entry.falls), new Date(entry.date).toLocaleDateString("sk-SK")]
          .forEach(text => resultRow.append(node("td", "", text)));
        body.append(resultRow);
      });
      table.append(head, body);
      const actions = node("div", "bike-actions");
      const replay = button("Ďalšia jazda", "bike-replay", startScreen);
      actions.append(replay, button("Nové meno", "bike-new-name", () => { chosenName = ""; startScreen(); }), button("Ukončiť jazdu", "bike-return", close));
      panel.append(onlineSection(record, table), table, actions);
      board().submit("bike", record, { storage }).catch(() => {});
      replay.focus();
    }

    function touchControl(label, value, className) {
      const control = node("button", `bike-control ${className}`, label);
      control.type = "button";
      control.style.touchAction = "none";
      control.style.userSelect = "none";
      control.setAttribute("aria-label", value === "pedal" ? "Šliapnuť do pedálov" : value === "brake" ? "Brzdiť" : value < 0 ? "Držať smer vľavo" : "Držať smer vpravo");
      listen(control, "pointerdown", event => {
        event.preventDefault();
        if (!state || !["riding", "countdown", "fallen"].includes(state.phase) || exitPending || pointers.has(event.pointerId)) return;
        pointers.set(event.pointerId, { value, element: control });
        try { control.setPointerCapture(event.pointerId); } catch (_) {}
        if (value === "pedal") bike.pedal(state);
      });
      const release = event => {
        pointers.delete(event.pointerId);
        try { if (control.hasPointerCapture(event.pointerId)) control.releasePointerCapture(event.pointerId); } catch (_) {}
      };
      listen(control, "pointerup", release);
      listen(control, "pointercancel", release);
      listen(control, "lostpointercapture", release);
      controls.append(control);
    }
    touchControl("◀", -1, "bike-left");
    touchControl("Šliapnuť", "pedal", "bike-pedal");
    touchControl("Brzda", "brake", "bike-brake");
    touchControl("▶", 1, "bike-right");

    const horizon = 154;
    const riderY = 451;
    function roadCenter(vertical, distance) {
      const depth = Math.max(0, Math.min(1, (vertical - horizon) / (riderY - horizon)));
      return 480 + Math.sin(distance / 175 + (1 - depth) * 2.8) * 88 * (1 - depth);
    }
    function villageBlend(distance) {
      const progress = Math.max(0, Math.min(1, (distance - 945) / 220));
      return progress * progress * (3 - 2 * progress);
    }
    function roadHalf(vertical, distance) {
      const blend = villageBlend(distance);
      return 5 + 8 * blend + Math.max(0, (vertical - horizon) / (riderY - horizon)) * (105 + 195 * blend);
    }
    function project(delta, lateral, distance) {
      const depth = 1 - delta / 130;
      const vertical = horizon + (riderY - horizon) * depth * depth;
      return { x: roadCenter(vertical, distance) + lateral * roadHalf(vertical, distance), y: vertical, scale: .13 + .87 * depth * depth };
    }
    function rectangle(left, top, width, height, color) {
      context.fillStyle = color;
      context.fillRect(Math.round(left), Math.round(top), Math.ceil(width), Math.ceil(height));
    }
    function polygon(points, color) {
      context.fillStyle = color;
      context.beginPath();
      points.forEach(([horizontal, vertical], index) => index ? context.lineTo(horizontal, vertical) : context.moveTo(horizontal, vertical));
      context.closePath();
      context.fill();
    }
    function words(text, left, top, color = "#fff4d0", size = 14) {
      context.fillStyle = color;
      context.font = `bold ${size}px monospace`;
      context.fillText(text, Math.round(left), Math.round(top));
    }
    function tree() {
      rectangle(-5, -56, 10, 56, "#71503c");
      polygon([[-35, -32], [0, -111], [35, -32]], "#183f39");
      polygon([[-30, -57], [0, -129], [29, -57]], "#22634b");
      polygon([[-22, -83], [0, -141], [23, -83]], "#3e8352");
      rectangle(-14, -77, 7, 17, "#62955c");
      rectangle(8, -48, 9, 9, "#386e45");
    }
    function building(label, color, church) {
      rectangle(-55, -86, 110, 86, color);
      polygon([[-66, -86], [0, -125], [65, -86]], "#913f46");
      rectangle(-12, -43, 23, 43, "#453f42");
      [-39, 23].forEach(left => {
        rectangle(left, -70, 18, 22, "#3c6470");
        rectangle(left + 8, -70, 2, 22, "#e7d5ad");
        rectangle(left, -60, 18, 2, "#e7d5ad");
      });
      if (church) {
        rectangle(20, -145, 30, 59, "#e4dfc8");
        polygon([[15, -145], [35, -183], [55, -145]], "#534c5a");
        rectangle(33, -203, 4, 24, "#faf0ce");
        rectangle(26, -197, 18, 4, "#faf0ce");
        rectangle(30, -128, 10, 19, "#484552");
      }
      if (label) {
        rectangle(-56, -92, 112, 22, "#263b3b");
        words(label, -51, -76, "#fff2c3", 12);
      }
    }
    function sprite(kind, projected, elapsed) {
      context.save();
      context.translate(Math.round(projected.x), Math.round(projected.y));
      context.scale(projected.scale, projected.scale);
      rectangle(-23, -2, 46, 6, "#304a3c");
      if (kind === "tree") tree();
      else if (kind === "log") {
        rectangle(-35, -19, 70, 19, "#69452f");
        rectangle(-30, -21, 60, 5, "#b18451");
        rectangle(-38, -18, 13, 16, "#dfb877");
        rectangle(-34, -14, 5, 8, "#9b693e");
        rectangle(-7, -15, 30, 3, "#432e29");
      } else if (kind === "rail") {
        for (let index = 0; index < 5; index++) rectangle(-42 + index * 6, -38 + index * 8, 77, 5, "#6e5141");
        polygon([[-30, -42], [-24, -42], [-2, 0], [-9, 0]], "#c2cac8");
        polygon([[20, -42], [26, -42], [48, 0], [41, 0]], "#8e9ba1");
      } else if (kind === "bear") {
        const gait = Math.sin(elapsed * 10) * 6;
        rectangle(-31, -42, 63, 31, "#704334");
        rectangle(-39, -57, 29, 28, "#8e5940");
        rectangle(-36, -64, 10, 12, "#54392e");
        rectangle(-16, -63, 10, 12, "#54392e");
        rectangle(-45, -43, 17, 12, "#bc9466");
        rectangle(-35, -49, 4, 4, "#171e24");
        rectangle(-26, -16, 11, 16 + gait, "#49352f");
        rectangle(18, -16, 11, 16 - gait, "#49352f");
      } else if (kind === "suv" || kind === "filipSUV") {
        rectangle(-83, -69, 166, 62, "#465b61");
        polygon([[-70, -69], [-51, -103], [50, -103], [70, -69]], "#465b61");
        polygon([[-45, -97], [44, -97], [58, -73], [-58, -73]], "#8fb3b6");
        rectangle(-4, -98, 8, 29, "#465b61");
        rectangle(-74, -59, 148, 12, "#6e8080");
        rectangle(-65, -38, 130, 16, "#29393e");
        rectangle(-77, -40, 20, 9, "#f4e3a9"); rectangle(57, -40, 20, 9, "#f4e3a9");
        rectangle(-70, -13, 27, 16, "#232b30"); rectangle(43, -13, 27, 16, "#232b30");
      } else if (kind === "bus") {
        context.scale(1.65, 1);
        rectangle(-62, -148, 124, 142, "#e6ad3e");
        rectangle(-58, -128, 116, 49, "#315468");
        rectangle(-51, -124, 38, 35, "#7dabb2");
        rectangle(6, -124, 44, 35, "#67949f");
        rectangle(-60, -74, 120, 27, "#ac343e");
        words("ZUBAK EXPRES", -56, -56, "#fff8cf", 14);
        rectangle(-58, -31, 116, 9, "#ece0af");
        rectangle(-53, -20, 19, 9, "#fff4c0");
        rectangle(34, -20, 19, 9, "#fff4c0");
        rectangle(-55, -9, 23, 13, "#242b32");
        rectangle(32, -9, 23, 13, "#242b32");
      } else if (kind === "tower") {
        polygon([[-48, 0], [-35, -150], [-25, -150], [-36, 0]], "#744c35");
        polygon([[35, 0], [24, -150], [35, -150], [48, 0]], "#744c35");
        for (let index = 0; index < 4; index++) {
          const top = -20 - index * 32;
          polygon([[-35, top], [-30, top - 8], [35, top - 32], [35, top - 24]], "#b08554");
          rectangle(-34, top - 12, 68, 5, "#92643e");
        }
        rectangle(-52, -166, 104, 24, "#bf9565");
        for (let index = 0; index < 6; index++) rectangle(-47 + index * 18, -185, 5, 39, "#69452f");
        polygon([[-63, -185], [0, -220], [63, -185]], "#573b38");
        words("ROZHĽADŇA", -47, -148, "#302c2e", 12);
      } else if (kind === "spring") {
        polygon([[-65,0],[-53,-35],[-28,-55],[13,-51],[52,-28],[64,2]], "#737d78");
        polygon([[-53,-35],[-28,-55],[-5,-48],[-22,-19]], "#abb2a9");
        polygon([[5,-48],[31,-41],[52,-28],[19,-22]], "#909b91");
        rectangle(-5,-28,28,8,"#aeb9af");
        rectangle(19,-27,8,6,"#465d54");
        rectangle(23,-21,5,20 + Math.sin(elapsed * 4)*2,"#a5e0dc");
        polygon([[12,0],[32,-5],[53,3],[35,9]],"#72a5a0");
        rectangle(23 + Math.sin(elapsed * 8)*3,1,16,2,"#e2f5e8");
        rectangle(-68,-69,5,69,"#6f6853");
        rectangle(-92,-85,74,20,"#dfd7b4");
        words("PRAMEŇ",-87,-71,"#354c3c",12);
      } else if (kind === "tractor") {
        rectangle(-65, -32, 132, 25, "#b44b40");
        rectangle(-18, -67, 45, 37, "#aa493d");
        rectangle(-12, -60, 33, 22, "#8ab2b0");
        rectangle(-20, -72, 49, 7, "#625b4b");
        rectangle(39, -49, 5, 23, "#454c43");
        rectangle(-60, -8, 39, 15, "#252f2d");
        rectangle(23, -15, 44, 22, "#252f2d");
        rectangle(-51, -5, 18, 8, "#b6b19a");
        rectangle(34, -9, 21, 12, "#b6b19a");
      } else if (kind === "village") building("POTRAVINY", "#f0d7b3", false);
      else if (kind === "church") building("", "#eee5ca", true);
      else if (kind === "house") building("", "#bfc9be", false);
      else if (kind === "houseYellow") building("", "#e4d7a8", false);
      else if (kind === "housePink") building("", "#d8b8ac", false);
      else if (kind === "cottage") {
        rectangle(-58, -75, 116, 75, "#795840");
        for (let row = 0; row < 7; row++) rectangle(-58, -70 + row * 10, 116, 3, "#b28b62");
        polygon([[-68, -75], [0, -117], [68, -75]], "#594b40");
        rectangle(-13, -43, 26, 43, "#4d3e32");
        [-44, 25].forEach(left => {
          rectangle(left, -61, 20, 23, "#9cb7b0");
          rectangle(left + 9, -61, 2, 23, "#e5dcc3");
          rectangle(left, -51, 20, 2, "#e5dcc3");
        });
      }
      else if (kind === "flats") {
        rectangle(-65, -151, 130, 151, "#c6c5b5");
        rectangle(-70, -158, 140, 8, "#646e67");
        for (let floor = 0; floor < 4; floor++) {
          rectangle(-65, -112 + floor * 31, 130, 5, "#b36e65");
          for (let column = 0; column < 4; column++) {
            rectangle(-52 + column * 29, -140 + floor * 31, 17, 21, "#527b89");
            rectangle(-51 + column * 29, -139 + floor * 31, 5, 18, "#d8e3d8");
          }
        }
        rectangle(-12, -24, 24, 24, "#4a554f");
        words("BYTOVKA", -40, -162, "#fff4d0", 12);
      } else if (kind === "chapel") {
        rectangle(-25,-57,50,57,"#f2e7cd");
        polygon([[-31,-57],[0,-83],[31,-57]],"#a65849");
        rectangle(-9,-32,18,32,"#5c594e");
        rectangle(-3,-96,6,16,"#d9d4c2");
        rectangle(-10,-92,20,5,"#d9d4c2");
      } else if (kind === "festival") {
        rectangle(-100, -42, 200, 42, "#6f9c68");
        rectangle(-100, -42, 200, 3, "#d2d7a6");
        rectangle(-87, -101, 174, 7, "#756246");
        [-82, 77].forEach(left => rectangle(left, -101, 6, 101, "#756246"));
        for (let flagIndex = 0; flagIndex < 9; flagIndex++) polygon([[-77 + flagIndex * 18, -94], [-64 + flagIndex * 18, -94], [-71 + flagIndex * 18, -75]], flagIndex % 2 ? "#e2bb57" : "#cc5e57");
        rectangle(-70, -75, 140, 22, "#334d3c");
        words("GULÁŠFEST", -55, -59, "#ffe8a3", 17);
        [-42, 34].forEach(left => {
          rectangle(left - 17, -31, 34, 24, "#343e3b");
          rectangle(left - 21, -35, 42, 6, "#a5ae95");
          rectangle(left - 12, -7, 4, 7, "#6e5942");
          rectangle(left + 8, -7, 4, 7, "#6e5942");
          rectangle(left + Math.sin(elapsed * 3) * 4, -51, 4, 12, "#dfebd1");
        });
      } else if (kind === "bednari") {
        polygon([[0, -6], [170, -40], [170, 2], [0, 13]], "#929087");
        rectangle(-4, -104, 7, 104, "#776c53");
        polygon([[-72, -100], [65, -100], [83, -86], [65, -72], [-72, -72]], "#f0e2ad");
        words("BEDNÁRE", -63, -80, "#354c3c", 16);
      }
      else if (kind === "homeTurn") {
        polygon([[-170, -40], [0, -6], [0, 13], [-170, 2]], "#929087");
        rectangle(-4, -104, 7, 104, "#776c53");
        polygon([[-90, -100], [48, -100], [48, -72], [-90, -72], [-108, -86]], "#f0e2ad");
        words("DOM NG", -76, -80, "#354c3c", 16);
        rectangle(-154, -105, 68, 64, "#d5c9aa");
        polygon([[-161, -105], [-120, -132], [-79, -105]], "#a96452");
        rectangle(-128, -73, 17, 32, "#576c60");
        words("NG", -151, -85, "#354c3c", 13);
      } else if (kind === "coop") {
        rectangle(-76, -78, 152, 78, "#e7d59b");
        rectangle(-81, -87, 162, 12, "#a8534c");
        rectangle(-70, -58, 140, 39, "#4d6e68");
        rectangle(-70, -72, 140, 12, "#d5c590");
        words("COOP JEDNOTA", -60, -62, "#263e35", 14);
        rectangle(-10, -50, 20, 50, "#51635a");
      } else if (kind === "post") {
        rectangle(-73, -72, 146, 72, "#d8d1b7");
        polygon([[-83, -72], [-56, -98], [56, -98], [84, -72]], "#866957");
        rectangle(-60, -56, 37, 32, "#819f9c"); rectangle(20, -56, 37, 32, "#819f9c");
        rectangle(-15, -42, 25, 42, "#6f786c"); rectangle(-17, -68, 34, 12, "#d0a956");
        words("POŠTA", -14, -58, "#30443b", 8);
      }
      else if (kind === "stop") {
        rectangle(-77, -100, 154, 9, "#805b43");
        rectangle(-70, -91, 8, 91, "#a5ad8b"); rectangle(62, -91, 8, 91, "#a5ad8b");
        rectangle(-60, -85, 120, 67, "#d6ceaa"); rectangle(-52, -76, 104, 48, "#829b93");
        rectangle(-45, -68, 90, 33, "#b7c8b7");
        rectangle(-58, -98, 116, 14, "#e0d9bd"); words("ZASTÁVKA ZUBÁK", -54, -87, "#41574e", 10);
      } else if (kind === "office") {
        rectangle(-96, -86, 192, 86, "#e3e1cf");
        polygon([[-105, -86], [-76, -113], [76, -113], [105, -86]], "#9c6e5c");
        [-68, -38, 30, 60].forEach(left => rectangle(left, -66, 18, 30, "#739792"));
        rectangle(-13, -53, 26, 53, "#526b64"); rectangle(-28, -83, 56, 14, "#e5e3d3");
        words("ÚRAD", -22, -72, "#344e43", 12);
        rectangle(104, -132, 4, 132, "#d3d9d4");
        rectangle(108, -130, 48, 10, "#fff8e6"); rectangle(108, -120, 48, 10, "#27558a");
        rectangle(108, -110, 48, 10, "#cf4446");
        polygon([[114, -126], [127, -126], [127, -114], [120, -110], [114, -114]], "#fff8e6");
        polygon([[116, -124], [125, -124], [125, -115], [120, -112], [116, -115]], "#cf4446");
        rectangle(120, -122, 2, 8, "#fff8e6"); rectangle(117, -120, 7, 2, "#fff8e6");
        rectangle(118, -117, 5, 2, "#fff8e6"); rectangle(117, -114, 7, 2, "#27558a");
      } else if (kind === "gym") {
        rectangle(-65, -76, 130, 76, "#c4c6b8");
        polygon([[-73, -76], [-52, -96], [52, -96], [73, -76]], "#66756e");
        rectangle(-55, -60, 35, 27, "#739792"); rectangle(20, -60, 35, 27, "#739792");
        rectangle(-12, -47, 24, 47, "#526b64"); rectangle(-38, -73, 76, 11, "#e5e3d3");
        words("POSILOVŇA", -35, -64, "#344e43", 10);
      } else if (["ondrej", "betka", "simona", "lyda", "peter", "mama", "kika"].includes(kind)) {
        const colors = { ondrej: "#657c4d", betka: "#d9736d", simona: "#76af9e", lyda: "#b183bb", peter: "#b49a67", mama: "#ce6c83", kika: "#b4bc61" };
        const labels = { ondrej: "ONDREJ", betka: "BETKA", simona: "SIMONA", lyda: "LÝDA", peter: "PETER", mama: "MAMA", kika: "KIKA" };
        const gait = Math.sin(elapsed * 8) * 5;
        rectangle(-9, -25, 7, 25 + gait, "#37474b"); rectangle(2, -25, 7, 25 - gait, "#37474b");
        rectangle(-13, -53, 26, 29, colors[kind]); rectangle(-8, -70, 16, 17, "#e2af85");
        rectangle(-10, -74, 20, 7, kind === "ondrej" ? "#48613c" : "#4a3b33");
        rectangle(-20, -49, 7, 22, "#e2af85"); rectangle(13, -49, 7, 22, "#e2af85");
        words(labels[kind], -23, -81, "#fff4d0", 9);
      }
      else if (kind === "mayor") {
        rectangle(-11, -43, 22, 32, "#324450");
        rectangle(-8, -59, 16, 17, "#e2af85");
        rectangle(-8, -64, 16, 7, "#53504c");
        rectangle(-11, -11, 8, 11, "#202b39");
        rectangle(3, -11, 8, 11, "#202b39");
        polygon([[-10, -44], [-5, -44], [11, -20], [6, -17]], "#faf3dd");
        rectangle(-30, -42 - Math.sin(elapsed * 5) * 5, 20, 7, "#e2af85");
      }
      context.restore();
    }

    const landmarks = [
      [675, 1.55, "rail"], [710, 1.6, "rail"],
      [1030, -1.72, "house"], [1135, -1.75, "house"],
      [1200, 1.75, "tractor"], [1280, -1.72, "house"],
      [1360, -1.75, "house"], [1460, 1.72, "house"],
      [1570, 1.72, "tractor"],
      [980, -1.85, "houseYellow"], [1015, 1.8, "housePink"],
      [1050, 1.85, "cottage"], [1080, -1.85, "housePink"],
      [1115, 1.8, "houseYellow"], [1150, -1.9, "house"],
      [1185, -1.82, "housePink"], [1220, -1.85, "houseYellow"],
      [1260, 1.85, "house"], [1300, -1.85, "housePink"],
      [1340, 1.82, "houseYellow"], [1380, -1.85, "house"],
      [1420, 1.85, "housePink"], [1450, -1.85, "houseYellow"],
      [1490, 1.85, "house"], [1530, -1.85, "housePink"],
      [1560, -1.85, "cottage"], [1595, 1.85, "houseYellow"],
      [1630, -1.85, "house"], [1660, -1.85, "housePink"],
      [1065, -1.32, "chapel"], [1100, 1.32, "bednari"],
      [1170, 1.32, "festival"], [1240, 1.32, "flats"],
      [1310, 1.32, "post"], [1350, 1.32, "stop"],
      [1420, -1.32, "homeTurn"], [1500, -1.32, "coop"]
    ];

    function drawRider(distance, elapsed) {
      const current = state || { x: 0, speed: 0, phase: "countdown", immunity: 0 };
      context.save();
      context.translate(Math.round(roadCenter(riderY, distance) + current.x * roadHalf(riderY, distance)), riderY);
      if (current.phase === "fallen") {
        context.translate(0, 17 + Math.abs(Math.sin(current.recovery * 9)) * 9);
        context.rotate(-1.3 + Math.sin(current.recovery * 8) * .2);
      }
      if (current.immunity > 0 && Math.floor(elapsed * 10) % 2) context.globalAlpha = .5;
      rectangle(-27, 21, 54, 9, "#3b4540");
      context.strokeStyle = "#222e38";
      context.lineWidth = 7;
      context.beginPath(); context.ellipse(0, 9, 12, 29, 0, 0, Math.PI * 2); context.stroke();
      context.strokeStyle = "#c9d0c8";
      context.lineWidth = 2;
      context.beginPath(); context.ellipse(0, 9, 7, 23, 0, 0, Math.PI * 2); context.stroke();
      const pedaling = Math.sin(pedalAngle) * 12;
      polygon([[-18, -34], [-6, -31], [-9, 3 + pedaling], [-21, 3 + pedaling]], "#405b7f");
      polygon([[6, -31], [18, -34], [21, 3 - pedaling], [9, 3 - pedaling]], "#2e4264");
      rectangle(-23, 1 + pedaling, 17, 7, "#e8e2c7");
      rectangle(7, 1 - pedaling, 17, 7, "#e8e2c7");
      rectangle(-4, -39, 8, 58, "#b84550");
      rectangle(-19, -46, 38, 5, "#d8dcce");
      rectangle(-31, -71, 8, 30, "#d6a17e");
      rectangle(23, -71, 8, 30, "#d6a17e");
      polygon([[-23, -85], [23, -85], [25, -47], [15, -32], [-16, -32], [-25, -47]], "#b44962");
      rectangle(-13, -71, 26, 29, "#d16b75");
      rectangle(-17, -111, 34, 29, "#1c202c");
      rectangle(-23, -100, 46, 39, "#242432");
      polygon([[-23, -80], [22, -80], [29, -47], [11, -52], [1, -46], [-17, -51], [-27, -46]], "#242432");
      rectangle(-13, -104, 6, 48, "#3c3545");
      rectangle(8, -96, 5, 41, "#39313f");
      rectangle(-19, -117, 38, 17, "#dfc968");
      rectangle(-14, -121, 28, 8, "#f4e3a5");
      rectangle(-7, -118, 4, 12, "#687663");
      rectangle(5, -118, 4, 12, "#687663");
      context.restore();
    }

    function draw() {
      const actualDistance = state ? state.distance : 0;
      const distance = bike.sceneryDistance(actualDistance);
      const elapsed = state ? state.elapsed : 0;
      const section = bike.section(actualDistance);
      context.imageSmoothingEnabled = false;
      rectangle(0, 0, 960, 540, "#8ec9d1");
      rectangle(0, 86, 960, 69, "#b3d5d0");
      rectangle(737, 31, 44, 36, "#fff0b0");
      [[90, 43], [350, 24], [548, 61]].forEach(([left, top]) => {
        rectangle(left, top, 74, 9, "#e3eee2"); rectangle(left + 14, top - 8, 37, 10, "#e3eee2");
      });
      polygon([[0, 157], [0, 111], [95, 74], [170, 125], [280, 47], [390, 122], [490, 85], [605, 141], [740, 56], [862, 120], [960, 91], [960, 162]], "#638e8a");
      polygon([[0, 165], [99, 121], [181, 145], [310, 93], [404, 146], [575, 107], [680, 143], [831, 102], [960, 156], [960, 540], [0, 540]], "#436f68");
      if (distance > 120 && distance < 650) {
        const ridgeName = distance < 400 ? "KÝČERA" : "ŽRNOVÁ";
        words(ridgeName, distance < 400 ? 230 : 661, 109, "#f2edcc", 15);
      }
      if (distance > 840 && distance < 1200) words("KONČITÁ", 668, 100, "#f2edcc", 14);
      const blend = villageBlend(distance);
      if (blend < 1) {
        polygon([[0,169],[120,132],[247,190],[362,213],[480,227],[660,186],[818,215],[960,179],[960,540],[0,540]], "#6e966a");
        polygon([[0,221],[210,202],[356,274],[550,313],[727,276],[960,301],[960,540],[0,540]], "#557e54");
        polygon([[0,111],[101,147],[230,226],[337,329],[398,540],[0,540]], "#53664b");
        polygon([[0,167],[85,203],[155,281],[231,392],[272,540],[0,540]], "#7d8270");
        polygon([[0,205],[62,239],[103,314],[172,402],[203,540],[134,540],[86,392],[0,304]], "#a4a48b");
        polygon([[49,244],[99,267],[141,340],[105,325]], "#c2bca0");
        polygon([[131,377],[186,410],[215,491],[176,457]], "#b7b49b");
        context.save(); context.globalAlpha = 1 - blend;
        polygon([[604,267],[735,241],[872,258],[960,239],[960,342],[715,331]],"#789b6e");
        [[642,274,1],[678,263,.8],[716,280,1.1],[759,263,.9],[799,280,1],[848,260,.8],[887,276,1.1],[926,254,.8]].forEach(([left,top,scale]) => {
          context.save(); context.translate(left,top); context.scale(scale,scale);
          rectangle(0,0,23,14,"#e1ddc2");
          polygon([[-3,0],[11,-9],[26,0]],"#a46b5d");
          rectangle(4,4,5,5,"#688985"); rectangle(15,4,5,5,"#688985");
          context.restore();
        });
        rectangle(814,249,8,27,"#e4dec6");
        polygon([[811,249],[818,237],[825,249]],"#a46b5d");
        context.restore();
      }
      for (let vertical = horizon; vertical < 540; vertical += 3) {
        const depth = (vertical - horizon) / (riderY - horizon);
        const half = roadHalf(vertical, distance);
        const center = roadCenter(vertical, distance);
        const band = Math.floor(depth * 22 + distance / 9) % 2;
        if (blend > 0) {
          context.save(); context.globalAlpha = blend;
          rectangle(0, vertical, 960, 3, band ? "#66874a" : "#6f914e");
          context.restore();
        }
        if (blend < 1) {
          context.save(); context.globalAlpha = 1 - blend;
          const terrain = depth * 22 + distance / 9;
          const edge = Math.sin(terrain * 2.3) * 9 * depth;
          rectangle(center - half + edge, vertical, half * 2 - edge * 2, 3, band ? "#998369" : "#a58e6d");
          rectangle(center + Math.sin(terrain * .65) * half * .18 - 8 * depth, vertical, 16 * depth + 1, 3, "#8b775e");
          for (let stone = 0; stone < 3; stone++) {
            const lateral = Math.sin(Math.floor(terrain) * 17 + stone * 23) * .78;
            rectangle(center + lateral * half, vertical, Math.max(1, depth * 4), 2, stone === 0 ? "#b8b6a0" : "#746e59");
          }
          rectangle(center - half + edge - 5 * depth, vertical, 7 * depth + 1, 3, "#58733e");
          rectangle(center + half - edge, vertical, 8 * depth + 1, 3, "#58733e");
          context.restore();
        }
        if (blend > 0) {
          context.save(); context.globalAlpha = blend;
          rectangle(center - half - 10 * depth, vertical, half * 2 + 20 * depth, 3, "#c0bb82");
          rectangle(center - half, vertical, half * 2, 3, "#777d78");
          if (band) rectangle(center - 2 * depth, vertical, 4 * depth + 1, 3, "#e0d4a9");
          context.restore();
        }
      }
      const objects = [];
      const firstTree = Math.floor(Math.max(0, distance - 20) / 18);
      for (let index = firstTree; index < firstTree + 11; index++) {
        if (index * 18 > 1200) continue;
        objects.push([index * 18, -1.35 - (index % 3) * .35, "tree"]);
        objects.push([index * 18 + 8, 1.45 + (index % 2) * .4, "tree"]);
      }
      objects.push(...landmarks);
      bike.obstacles.forEach((entry, index) => {
        if (state && entry[2] === "filipSUV" && state.passed.includes(index)) return;
        const position = bike.sceneryDistance(bike.obstacleDistance(entry, actualDistance));
        objects.push([position, bike.obstacleX(entry, elapsed, state), entry[2]]);
        if (state && state.phase === "riding" && entry[2] === "suv" && !seenVehicles.has(index) && position - distance >= 0 && position - distance <= 85) {
          seenVehicles.add(index);
          vehicleMessage = "Zase SUV!";
          vehicleMessageUntil = elapsed + 3;
        }
      });
      objects.filter(entry => entry[0] - distance <= 130 && entry[0] - distance >= -14)
        .sort((first, second) => second[0] - first[0])
        .forEach(entry => sprite(entry[2], project(entry[0] - distance, entry[1], distance), elapsed));
      if (distance < 160) {
        sprite("tower", { x: 168, y: 354, scale: 1.05 - distance / 500 }, elapsed);
      }
      if (distance >= 940 && distance < 1015) {
        sprite("spring", { x: 788, y: 347, scale: 1.15 }, elapsed);
      }
      if (distance >= 1660) {
        const remaining = Math.max(0, 1800 - distance);
        const office = project(remaining * 130 / 140, 1.35, distance);
        sprite("gym", { x: office.x + 110 * office.scale, y: office.y, scale: office.scale }, elapsed);
        sprite("office", { x: office.x, y: office.y, scale: office.scale }, elapsed);
        sprite("mayor", { x: office.x - 100 * office.scale, y: office.y, scale: office.scale }, elapsed);
        const gate = project(remaining * 130 / 140, 0, distance);
        context.save();
        context.translate(gate.x, gate.y);
        context.scale(gate.scale, gate.scale);
        rectangle(-341, -245, 10, 245, "#eee2bf");
        rectangle(331, -245, 10, 245, "#eee2bf");
        rectangle(-341, -245, 682, 30, "#2e4747");
        words("CIEĽ · ZUBÁK", -86, -223, "#fff3c9", 23);
        context.restore();
      }
      if (state && state.phase === "fallen" && state.fallCause === "filipSUV") {
        sprite("filipSUV", { x: 700, y: 370, scale: .8 }, elapsed);
      }
      drawRider(distance, elapsed);
      if (state && state.phase === "fallen" && state.fallCause === "filipSUV") {
        rectangle(20, 200, 320, 52, "#fff4d0");
        polygon([[250, 251], [285, 270], [275, 251]], "#fff4d0");
        words("NG: To bol Filip Turek!", 32, 233, "#263b3b", 20);
        rectangle(570, 174, 370, 70, "#fff4d0");
        polygon([[660, 243], [690, 262], [700, 243]], "#fff4d0");
        words("FILIP: Děkuj mi, že jsem tě", 582, 201, "#263b3b", 19);
        words("zachránil!", 582, 227, "#263b3b", 19);
      } else if (state && vehicleMessage && elapsed < vehicleMessageUntil) {
        const bubbleX = Math.max(12, Math.min(668, roadCenter(riderY, distance) + state.x * roadHalf(riderY, distance) - 300));
        rectangle(bubbleX, 293, 280, 38, "#fff4d0");
        polygon([[bubbleX + 238, 330], [bubbleX + 260, 342], [bubbleX + 264, 330]], "#fff4d0");
        words(vehicleMessage, bubbleX + 12, 318, "#263b3b", 18);
      }
      if (distance > 1440 && distance < 1555) {
        rectangle(198, 171, 563, 30, "#792f3c");
        words("ZUBAK EXPRES VPRAVO — PREJDI VĽAVO", 219, 192, "#fff2c4", 20);
      }
      let overlay = "";
      if (state && state.phase === "countdown") overlay = String(Math.ceil(state.countdown));
      if (state && state.phase === "fallen") overlay = `Pád! Nasadám za ${Math.ceil(state.recovery)}…`;
      if (state && state.phase === "paused") overlay = "PAUZA";
      if (state && state.phase === "finished") overlay = "V CIELI!";
      if (overlay) {
        const overlayTop = state && state.phase === "fallen" && state.fallCause === "filipSUV" ? 70 : 278;
        rectangle(240, overlayTop, 480, 59, "#253a40");
        context.textAlign = "center"; words(overlay, 480, overlayTop + 40, "#fff0bd", 30); context.textAlign = "left";
      }
      const status = `Čas ${bike.format(elapsed)} · Rýchlosť ${Math.round((state ? state.speed : 0) * 3.6)} km/h · Trať ${Math.floor(actualDistance / bike.length * 100)} % · Pády ${state ? state.falls : 0}`;
      if (status !== lastHud) { hud.textContent = status; lastHud = status; }
      if (location.textContent !== section[1]) location.textContent = section[1];
    }

    function frame(timestamp) {
      if (closed) return;
      if (state && !["paused", "finished"].includes(state.phase) && !doc.hidden) {
        if (previousTime !== null) {
          const duration = Math.max(0, (timestamp - previousTime) / 1000);
          if (duration > 1) pause();
          else {
            let left = keys.has("ArrowLeft") || keys.has("KeyA");
            let right = keys.has("ArrowRight") || keys.has("KeyD");
            let braking = keys.has("ArrowDown");
            for (const value of pointers.values()) {
              if (value.value === -1) left = true;
              if (value.value === 1) right = true;
              if (value.value === "brake") braking = true;
            }
            if (state.phase === "riding" && (keys.has("Space") || [...pointers.values()].some(value => value.value === "pedal"))) {
              pedalAngle += duration * (4 + 8 * Math.max(0, Math.min(1, (state.speed * 3.6 - 20) / 80)));
            }
            bike.update(state, duration, Number(right) - Number(left), braking);
            if (state.falls > previousFalls) {
              previousFalls = state.falls;
              if (typeof options.onCrash === "function") options.onCrash(state.fallCause);
            }
          }
        }
        previousTime = state.phase === "paused" ? null : timestamp;
      } else previousTime = null;
      draw();
      if (state && state.phase === "finished" && !resultShown) finish();
      if (!closed) frameId = view.requestAnimationFrame(frame);
    }

    listen(doc, "keydown", event => {
      if (closed || !dialog.open) return;
      if (state && state.phase === "finished" && (event.code === "Space" || event.key === " ")) {
        event.preventDefault(); event.stopImmediatePropagation();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault(); event.stopImmediatePropagation();
        if (!event.repeat) requestExit();
        return;
      }
      if (!state || state.phase === "finished") return;
      const code = event.code || ({ " ": "Space", ArrowLeft: "ArrowLeft", ArrowRight: "ArrowRight", a: "KeyA", A: "KeyA", d: "KeyD", D: "KeyD" })[event.key];
      if (!["ArrowLeft", "ArrowRight", "ArrowDown", "KeyA", "KeyD", "Space"].includes(code)) return;
      const target = event.target;
      if (target && ((typeof target.matches === "function" && target.matches("input, textarea, select")) || target.isContentEditable)) return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (event.repeat || keys.has(code) || state.phase === "paused" || exitPending) return;
      keys.add(code);
      if (code === "Space") bike.pedal(state);
    }, true);
    listen(doc, "keyup", event => {
      if (state && state.phase === "finished" && (event.code === "Space" || event.key === " ")) {
        event.preventDefault(); event.stopImmediatePropagation();
        return;
      }
      const code = event.code || ({ " ": "Space", a: "KeyA", A: "KeyA", d: "KeyD", D: "KeyD" })[event.key] || event.key;
      if (!keys.has(code)) return;
      keys.delete(code);
      event.preventDefault(); event.stopImmediatePropagation();
    }, true);
    listen(view, "pointerup", event => pointers.delete(event.pointerId));
    listen(view, "pointercancel", event => pointers.delete(event.pointerId));
    listen(view, "blur", pause);
    listen(doc, "visibilitychange", () => { if (doc.hidden) pause(); });
    listen(dialog, "cancel", event => { event.preventDefault(); requestExit(); });
    listen(dialog, "close", close);
    listen(dialog, "keydown", event => {
      if (event.key !== "Tab") return;
      const focusable = [...dialog.querySelectorAll("button, input, [tabindex]")]
        .filter(element => !element.disabled && element.tabIndex >= 0 && !element.closest("[hidden]"));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && doc.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && doc.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    doc.body.append(dialog);
    if (typeof dialog.showModal === "function") dialog.showModal();
    else { dialog.setAttribute("open", ""); dialog.setAttribute("aria-modal", "true"); dialog.setAttribute("role", "dialog"); }
    startScreen();
    draw();
    frameId = view.requestAnimationFrame(frame);
    if (root.ZubakScores) root.ZubakScores.flush("bike", { storage }).catch(() => {});
    return { close, dialog, canvas };
  }

  root.ZubakBikeUI = { open, readRecords, saveRecord };
})(globalThis);