(function (root) {
  "use strict";
  const recordKey = "zubak-goulash-records-v1";
  function validated(value) {
    if (!value || typeof value.name !== "string" || !value.name.trim() || Array.from(value.name.trim()).length > 20 ||
        !Number.isInteger(value.score) || value.score < 0 || value.score > 1000 ||
        !Number.isFinite(value.time) || value.time <= 0 || value.time > 120 ||
        typeof value.date !== "string" || !Number.isFinite(Date.parse(value.date))) return null;
    return { name: value.name.trim(), score: value.score, time: value.time, date: new Date(value.date).toISOString() };
  }
  function ranked(records) {
    return records.sort((first, second) => second.score - first.score || Date.parse(first.date) - Date.parse(second.date)).slice(0, 10);
  }
  function readRecords(storage) {
    try { const values = JSON.parse(storage.getItem(recordKey)); return Array.isArray(values) ? ranked(values.map(validated).filter(Boolean)) : []; }
    catch { return []; }
  }
  function saveRecord(storage, record) {
    const clean = validated(record);
    if (!clean) return false;
    try { storage.setItem(recordKey, JSON.stringify(ranked([...readRecords(storage), clean]))); return true; }
    catch { return false; }
  }
  function open(options = {}) {
    const doc = options.document || root.document;
    const view = doc.defaultView;
    const game = root.ZubakGoulash;
    let storage = options.storage;
    if (storage === undefined) { try { storage = view.localStorage; } catch { storage = null; } }
    const previousFocus = doc.activeElement;
    const listeners = [];
    let state = null;
    let frameId;
    let previousTime = null;
    let closed = false;
    let resultShown = false;
    let resultRecord = null;
    let toastUntil = 0;
    function element(tag, text, className = "") {
      const node = doc.createElement(tag); node.textContent = text; node.className = className; return node;
    }
    function listen(target, type, handler) { target.addEventListener(type, handler); listeners.push(() => target.removeEventListener(type, handler)); }
    function button(text, handler, className = "") {
      const node = element("button", text, className); node.type = "button"; node.addEventListener("click", handler); return node;
    }
    const dialog = element("dialog", "", "goulash-dialog");
    dialog.setAttribute("aria-label", "Gulášfest · NG pri kotlíku");
    const header = element("header", "", "goulash-header");
    const title = element("h2", "Gulášfest", "goulash-title");
    const pauseButton = button("Ⅱ", togglePause, "goulash-pause");
    pauseButton.title = "Pozastaviť varenie"; pauseButton.setAttribute("aria-label", pauseButton.title); pauseButton.hidden = true;
    const exitButton = button("Späť na festival", exit, "goulash-return");
    header.append(title, pauseButton, exitButton);
    const canvas = element("canvas", "", "goulash-canvas"); canvas.width = 800; canvas.height = 360;
    canvas.setAttribute("aria-label", "NG varí guláš v kotlíku na festivalovom stanovišti");
    const stage = element("div", "", "goulash-stage");
    const hud = element("div", "", "goulash-hud");
    const panel = element("section", "", "goulash-panel");
    const feedback = element("p", "", "goulash-feedback"); feedback.setAttribute("role", "status");
    stage.append(canvas, feedback);
    dialog.append(header, stage, hud, panel); doc.body.append(dialog);
    const context = canvas.getContext("2d");
    function close() {
      if (closed) return;
      closed = true; view.cancelAnimationFrame(frameId); listeners.forEach(remove => remove()); dialog.close(); dialog.remove();
      if (previousFocus && previousFocus.isConnected) previousFocus.focus();
      if (options.onClose) options.onClose({ finished: Boolean(state && state.phase === "finished") });
    }
    function exit() {
      if (!state || state.phase === "finished") { close(); return; }
      game.pause(state); previousTime = null;
      const confirmExit = button("Odísť", close, "goulash-confirm-exit");
      panel.replaceChildren(element("h3", "Odísť od rozvareného guláša?"), element("p", "Tento pokus sa do tabuľky nezapíše."),
        button("Pokračovať vo varení", () => { game.resume(state); controls(); }), confirmExit);
      confirmExit.focus();
    }
    function togglePause() {
      if (!state || state.phase === "finished") return;
      if (state.phase === "cooking") game.pause(state); else game.resume(state);
      previousTime = null; controls();
    }
    function autoPause() {
      if (state && state.phase === "cooking") { game.pause(state); previousTime = null; controls(); }
    }
    function records(current) {
      const table = element("table", "", "goulash-records");
      table.append(element("caption", "Najlepších 10 kotlíkov"));
      const head = element("tr", ""); ["#", "Meno", "Body"].forEach(label => head.append(element("th", label))); table.append(head);
      const entries = readRecords(storage);
      entries.forEach((entry, index) => {
        const row = element("tr", "");
        if (current && entry.name === current.name && entry.date === current.date) row.className = "goulash-record-current";
        [index + 1, entry.name, entry.score].forEach(value => row.append(element("td", String(value)))); table.append(row);
      });
      if (!entries.length) { const row = element("tr", ""); const cell = element("td", "Zatiaľ tu žiadny kotlík nesúťažil."); cell.colSpan = 3; row.append(cell); table.append(row); }
      return table;
    }
    function startScreen() {
      state = null; resultShown = false; resultRecord = null; pauseButton.hidden = true; hud.textContent = "NG · súťažný kotlík"; feedback.textContent = "V každej fáze máš 30 sekúnd. Ak treba, vyber surovinu a 5-krát stlač tlačidlo alebo medzerník, keď je ukazovateľ čo najbližšie k stredu. Čím bližšie, tým viac bodov.";
      stage.classList.add("goulash-rules");
      const form = element("form", "", "goulash-start");
      const label = element("label", "Meno kuchárky / kuchára");
      const input = element("input", ""); input.name = "cook"; input.required = true; input.maxLength = 40; input.value = "NG"; label.append(input);
      const error = element("p", "", "goulash-error"); error.setAttribute("role", "alert");
      const submit = element("button", "Začať variť", "goulash-start-button"); submit.type = "submit";
      form.append(label, submit, error);
      form.addEventListener("submit", event => {
        event.preventDefault(); const name = input.value.trim();
        if (!name || Array.from(name).length > 20) { error.textContent = "Zadaj meno do 20 znakov."; return; }
        state = game.create(name); previousTime = null; pauseButton.hidden = false; stage.classList.remove("goulash-rules"); controls();
      });
      panel.replaceChildren(form, records(), element("p", "Výsledky zostávajú iba v tomto prehliadači, rovnako ako pri zjazde.", "goulash-storage-note"));
      input.focus();
    }
    let markerNode;
    let stageLabel;
    let actionButton;
    let ingredientButtons = [];
    function controls() {
      panel.replaceChildren(); ingredientButtons = [];
      pauseButton.textContent = state.phase === "paused" ? "▶" : "Ⅱ";
      pauseButton.title = state.phase === "paused" ? "Pokračovať vo varení" : "Pozastaviť varenie";
      pauseButton.setAttribute("aria-label", pauseButton.title);
      if (state.phase === "paused") { feedback.textContent = "Dám si chvíľku pauzu."; panel.append(element("h3", "Varenie je pozastavené"), button("Pokračovať", togglePause, "goulash-resume")); return; }
      feedback.textContent = state.stage === 2 ? "Miešaj, keď je ukazovateľ v strede zeleného pásma." : "Vyber surovinu a traf stred ukazovateľa.";
      stageLabel = element("h3", game.stages[state.stage].name);
      const ingredients = element("div", "", "goulash-ingredients");
      [["onion", "Cibuľa"], ["meat", "Mäso"], ["paprika", "Paprika"], ["tofu", "Tofu"]].forEach(([id, name]) => {
        const choice = button(name, () => { feedback.textContent = game.ingredient(state, id); toastUntil = view.performance.now() + 2200; actionButton.focus(); }, `goulash-ingredient goulash-${id}`);
        choice.dataset.ingredient = id; ingredientButtons.push(choice); ingredients.append(choice);
      });
      const rhythm = element("div", "", "goulash-rhythm"); rhythm.setAttribute("aria-label", "Načasovanie");
      rhythm.append(element("span", "", "goulash-target")); markerNode = element("span", "", "goulash-marker"); rhythm.append(markerNode);
      actionButton = button(game.stages[state.stage].action, action, "goulash-action");
      panel.append(stageLabel, ingredients, rhythm, actionButton); actionButton.focus();
    }
    function action() {
      if (!state || state.phase !== "cooking") return;
      const stage = state.stage; game.act(state);
      feedback.textContent = state.feedback; toastUntil = 0;
      if (state.phase === "finished") finish(); else if (stage !== state.stage) controls();
    }
    function finish() {
      if (resultShown) return;
      resultShown = true; pauseButton.hidden = true;
      resultRecord = { name: state.name, score: game.score(state), time: state.elapsed, date: new Date().toISOString() };
      const saved = saveRecord(storage, resultRecord);
      const grade = resultRecord.score >= 750 ? "Guláš ako od víťazky!" : resultRecord.score >= 400 ? "Guláš je navarený." : "Tento kotlík porotu poriadne preverí.";
      feedback.textContent = "Som zvedavá, či tentoraz vyhrám.";
      panel.replaceChildren(element("h3", grade), element("p", `${resultRecord.score} / 1000 bodov`, "goulash-result"),
        records(resultRecord), element("p", saved ? "Výsledok je uložený v tomto prehliadači." : "Výsledok sa nepodarilo uložiť.", "goulash-storage-note"),
        button("Variť znova", startScreen, "goulash-replay"), button("Späť na festival", close));
    }
    function draw(time) {
      const stage = state ? Math.min(state.stage, 3) : 0;
      context.fillStyle = "#b8dadd"; context.fillRect(0, 0, 800, 360);
      context.fillStyle = "#558263"; context.beginPath(); context.moveTo(0, 150); context.lineTo(130, 70); context.lineTo(270, 156); context.lineTo(470, 66); context.lineTo(800, 160); context.lineTo(800, 300); context.lineTo(0, 300); context.fill();
      context.fillStyle = "#a84f53"; context.fillRect(0, 28, 800, 35);
      context.fillStyle = "#f2e5ad"; context.font = "bold 22px Georgia"; context.textAlign = "center"; context.fillText("ZUBÁCKY GULÁŠFEST", 400, 53);
      context.fillStyle = "#758a55"; context.fillRect(0, 215, 800, 145);
      context.fillStyle = "#e4d7b3"; context.fillRect(34, 220, 215, 55); context.fillStyle = "#535c4b"; context.fillRect(49, 275, 14, 70); context.fillRect(220, 275, 14, 70);
      ["#e8c17c", "#b06453", "#d65337", "#f0e9ce"].forEach((color, index) => { context.fillStyle = color; context.beginPath(); context.ellipse(65 + index * 49, 222, 19, 10, 0, 0, Math.PI * 2); context.fill(); });
      context.fillStyle = "#3b403d"; context.fillRect(345, 251, 12, 90); context.fillRect(489, 251, 12, 90);
      for (let flame = 0; flame < 7; flame++) {
        const height = 18 + Math.sin(time * 7 + flame * 3) * 9 + (state ? Math.min(state.stage, 3) * 5 : 0);
        context.fillStyle = flame % 2 ? "#f6cf58" : "#e86a3c"; context.beginPath(); context.moveTo(365 + flame * 18, 333); context.lineTo(376 + flame * 18, 333 - height); context.lineTo(387 + flame * 18, 333); context.fill();
      }
      context.fillStyle = "#303f40"; context.beginPath(); context.ellipse(425, 247, 110, 63, 0, 0, Math.PI); context.fill();
      context.fillStyle = "#798781"; context.beginPath(); context.ellipse(425, 244, 110, 27, 0, 0, Math.PI * 2); context.fill();
      context.fillStyle = ["#c89a42", "#a96038", "#b9532c", "#a4452f"][stage]; context.beginPath(); context.ellipse(425, 244, 99, 20, 0, 0, Math.PI * 2); context.fill();
      for (let bubble = 0; bubble < 9; bubble++) { context.strokeStyle = "#eab16c"; context.beginPath(); context.ellipse(350 + bubble * 18, 242 + Math.sin(time * 3 + bubble) * 7, 3 + Math.sin(time * 4 + bubble) * 2, 2, 0, 0, Math.PI * 2); context.stroke(); }
      context.strokeStyle = "#e9eee2a0"; context.lineWidth = 5;
      for (let steam = 0; steam < 3; steam++) { const top = 215 - ((time * 24 + steam * 29) % 80); context.beginPath(); context.moveTo(395 + steam * 30, top); context.quadraticCurveTo(380 + steam * 30 + Math.sin(time * 2) * 8, top - 13, 400 + steam * 30, top - 28); context.stroke(); }
      context.fillStyle = "#bd3540"; context.fillRect(620, 184, 67, 91);
      context.fillStyle = "#fff4e9"; for (let stripe = 195; stripe < 270; stripe += 20) context.fillRect(620, stripe, 67, 9);
      context.fillStyle = "#f5f2e7"; context.beginPath(); context.moveTo(638, 193); context.lineTo(670, 193); context.lineTo(680, 269); context.quadraticCurveTo(654, 281, 627, 269); context.closePath(); context.fill();
      context.strokeStyle = "#c2cbbd"; context.lineWidth = 3; context.beginPath(); context.moveTo(641, 194); context.quadraticCurveTo(652, 211, 667, 194); context.moveTo(640, 242); context.lineTo(668, 242); context.lineTo(666, 254); context.lineTo(642, 254); context.closePath(); context.stroke();
      context.fillStyle = "#eac39e"; context.beginPath(); context.ellipse(652, 155, 27, 32, 0, 0, Math.PI * 2); context.fill();
      context.fillStyle = "#33251f"; context.beginPath(); context.ellipse(652, 132, 31, 19, -.1, 0, Math.PI * 2); context.fill();
      [616, 677].forEach(left => { for (let segment = 0; segment < 6; segment++) { context.fillStyle = segment % 2 ? "#5b3e2d" : "#39291f"; context.beginPath(); context.ellipse(left + (segment % 2 ? 2 : 0), 145 + segment * 8, 7, 7, 0, 0, Math.PI * 2); context.fill(); } context.fillStyle = "#244b46"; context.fillRect(left - 4, 192, 12, 5); });
      context.fillStyle = "#f8f8ef"; context.fillRect(625, 115, 55, 16); context.beginPath(); context.ellipse(634, 112, 16, 13, 0, 0, Math.PI * 2); context.ellipse(652, 105, 19, 16, 0, 0, Math.PI * 2); context.ellipse(672, 112, 16, 13, 0, 0, Math.PI * 2); context.fill();
      context.strokeStyle = "#c4cec4"; context.lineWidth = 2; context.beginPath(); context.moveTo(625, 129); context.lineTo(680, 129); context.stroke();
      context.strokeStyle = "#302729"; context.lineWidth = 3;
      [640, 664].forEach(left => { context.beginPath(); context.ellipse(left, 155, 10, 9, 0, 0, Math.PI * 2); context.stroke(); });
      context.beginPath(); context.moveTo(650, 155); context.lineTo(654, 155); context.stroke();
      context.fillStyle = "#304a56"; context.fillRect(623, 275, 23, 60); context.fillRect(660, 275, 23, 60);
      context.fillStyle = "#283d38"; context.beginPath(); context.ellipse(631, 335, 15, 6, 0, 0, Math.PI * 2); context.ellipse(671, 335, 15, 6, 0, 0, Math.PI * 2); context.fill();
      context.strokeStyle = "#eac39e"; context.lineWidth = 13; context.beginPath(); context.moveTo(625, 199); context.lineTo(574, 208); context.lineTo(522, 181 + Math.sin(time * 4) * 6); context.stroke();
      context.beginPath(); context.moveTo(685, 198); context.lineTo(699, 220); context.lineTo(685, 244); context.stroke();
      context.strokeStyle = "#bc965e"; context.lineWidth = 6; context.beginPath(); context.moveTo(524, 176); context.lineTo(432 + Math.sin(time * 4) * 25, 249); context.stroke();
      context.fillStyle = "#303c36"; context.fillRect(641, 151, 4, 4); context.fillRect(660, 151, 4, 4);
      context.strokeStyle = "#8d574c"; context.lineWidth = 2; context.beginPath(); context.moveTo(644, 175); context.quadraticCurveTo(652, 181, 661, 175); context.stroke();
    }
    function frame(time) {
      if (closed) return;
      const duration = previousTime === null ? 0 : Math.max(0, (time - previousTime) / 1000); previousTime = time;
      if (state && state.phase === "cooking") {
        const stage = state.stage; game.update(state, duration);
        if (state.phase === "finished") finish();
        else {
          if (stage !== state.stage) controls();
          markerNode.style.left = `${game.marker(state) * 100}%`;
          stageLabel.textContent = `${state.stage + 1}/4 · ${game.stages[state.stage].name} · ${state.hits}/5 · ${Math.ceil(game.stages[state.stage].seconds - state.stageTime)} s`;
          actionButton.textContent = game.stages[state.stage].action;
          ingredientButtons.forEach(choice => { choice.setAttribute("aria-pressed", String(state.ingredient && choice.dataset.ingredient === game.stages[state.stage].ingredient)); });
          if (time > toastUntil) feedback.textContent = state.feedback || (state.stage === 2 ? "Miešaj, keď je ukazovateľ v strede zeleného pásma." : "Vyber surovinu a traf stred ukazovateľa.");
        }
      }
      if (state) hud.textContent = `${state.name} · ${game.score(state)} / 1000 bodov`;
      draw(state && state.phase === "paused" ? state.elapsed : time / 1000);
      frameId = view.requestAnimationFrame(frame);
    }
    listen(dialog, "cancel", event => { event.preventDefault(); exit(); });
    listen(dialog, "close", close);
    listen(doc, "visibilitychange", () => { if (doc.hidden) autoPause(); });
    listen(view, "blur", autoPause);
    listen(dialog, "keydown", event => {
      if (event.repeat && (event.code === "Space" || event.code === "Enter")) { event.preventDefault(); return; }
      if (event.code === "Space" && state && state.phase === "cooking" && !/INPUT|BUTTON/.test(event.target.tagName)) { event.preventDefault(); if (!event.repeat) action(); }
    });
    dialog.showModal(); startScreen(); draw(0); frameId = view.requestAnimationFrame(frame);
    return { close };
  }
  root.ZubakGoulashUI = { open, readRecords, saveRecord };
})(typeof globalThis !== "undefined" ? globalThis : this);