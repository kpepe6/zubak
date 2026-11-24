(function (root) {
  "use strict";
  const stages = [
    { name: "Cibuľový základ", ingredient: "onion", action: "Nakrájať", seconds: 30 },
    { name: "Opiecť mäso", ingredient: "meat", action: "Opiecť", seconds: 30 },
    { name: "Dusiť a miešať", ingredient: null, action: "Zamiešať", seconds: 30 },
    { name: "Dochutiť guláš", ingredient: "paprika", action: "Dochutiť", seconds: 30 }
  ];
  function create(name) {
    return { name, phase: "cooking", stage: 0, stageTime: 0, elapsed: 0, hits: 0, points: 0,
      mistakes: 0, ingredient: false, lastAction: -1, feedback: "" };
  }
  function marker(state) { return (1 - Math.cos(state.stageTime * Math.PI * 1.26)) / 2; }
  function score(state) { return Math.max(0, Math.min(1000, Math.round(state.points))); }
  function advance(state) {
    state.stage++;
    if (state.stage === stages.length) { state.phase = "finished"; return; }
    state.stageTime = 0; state.hits = 0; state.ingredient = false; state.lastAction = -1;
    state.feedback = "";
  }
  function ingredient(state, value) {
    if (state.phase !== "cooking") return "";
    if (value === "tofu") return "To by v Zubáku nikto nejedol.";
    if (state.ingredient || !stages[state.stage].ingredient) return "Teraz treba miešať, nie pridávať ďalšie suroviny.";
    if (value !== stages[state.stage].ingredient) {
      state.mistakes++; state.points = Math.max(0, state.points - 15);
      return state.feedback = "Táto surovina sem ešte nepatrí.";
    }
    state.ingredient = true;
    return state.feedback = "Surovina je pripravená.";
  }
  function act(state) {
    if (state.phase !== "cooking") return;
    if (stages[state.stage].ingredient && !state.ingredient) { state.feedback = "Najprv vyber surovinu."; return; }
    if (state.stageTime - state.lastAction < .45) return;
    state.lastAction = state.stageTime;
    const accuracy = Math.max(0, 1 - Math.abs(marker(state) - .5) / .32);
    const points = 50 * accuracy;
    state.points += points; state.hits++;
    if (points < 20) state.mistakes++;
    state.feedback = points >= 40 ? "Výborne!" : points >= 20 ? "Celkom dobré." : "Pozor na načasovanie!";
    if (state.hits >= 5) advance(state);
  }
  function update(state, duration) {
    if (state.phase !== "cooking" || !Number.isFinite(duration) || duration <= 0) return;
    let remaining = duration;
    while (remaining > .0000001 && state.phase === "cooking") {
      const step = Math.min(remaining, 1 / 120, stages[state.stage].seconds - state.stageTime);
      state.elapsed += step; state.stageTime += step; remaining -= step;
      if (state.stageTime >= stages[state.stage].seconds - .0000001) {
        state.mistakes += 5 - state.hits;
        advance(state);
      }
    }
  }
  function pause(state) { if (state.phase === "cooking") state.phase = "paused"; }
  function resume(state) { if (state.phase === "paused") state.phase = "cooking"; }
  root.ZubakGoulash = { stages, create, marker, score, ingredient, act, update, pause, resume };
})(typeof globalThis !== "undefined" ? globalThis : this);