(function (root) {
  "use strict";
  const duration = 10;
  const scenes = [
    { title: "Naberačka je zachránená!", detail: "Fifko vyhral gulášový festival.", label: "GULÁŠFEST / VYHLÁSENIE" },
    { title: "Kapela môže hrať ďalej", detail: "NG zaskočila za klaviristku a Betka sa pridala na flaute.", label: "GULÁŠFEST / KONCERT" },
    { title: "Voda je späť v studni", detail: "Mama sa už nemusí chodiť umývať na bytovku.", label: "DOMA / PO OPRAVE" },
    { title: "Peter je v Brne", detail: "Jeho cesta sa začína na námestí Slobody.", label: "BRNO / NÁMESTIE SLOBODY" },
    { title: "Záhada zatvorenej krčmy je vyriešená", detail: "Starosta veľkolepo odhalil, že namiesto krčmy otvorí hipsterskú kaviareň.", label: "ZUBÁK / VEĽKÉ ODHALENIE" },
    { title: "Real Life Hardcore Simulator Zubák", detail: "Koniec. NG zase všetkých zachránila!", label: "A TAK SA KONČÍ" }
  ];
  const brnoImage = new Image();
  brnoImage.src = "brno-namesti.png";
  const palette = { ink: "#263b34", skin: "#efc4a0", hair: "#5c4034", red: "#b94c43", gold: "#ebc65f", white: "#f6efe0" };
  function rect(context, x, y, width, height, color) { context.fillStyle = color; context.fillRect(x, y, width, height); }
  function ellipse(context, x, y, rx, ry, color) { context.fillStyle = color; context.beginPath(); context.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); context.fill(); }
  function line(context, points, color, width = 4) {
    context.strokeStyle = color; context.lineWidth = width; context.lineCap = "round"; context.lineJoin = "round"; context.beginPath();
    points.forEach(([x, y], index) => index ? context.lineTo(x, y) : context.moveTo(x, y)); context.stroke();
  }
  function text(context, value, x, y, size, color, align = "center") {
    context.font = `bold ${size}px Georgia, serif`; context.textAlign = align; context.fillStyle = color; context.fillText(value, x, y);
  }
  function person(context, x, y, scale, options = {}) {
    const { shirt = "#68977d", hero = false, character = "" } = options;
    const color = root.Zubak.people[character]?.color || shirt;
    root.ZubakArt.drawCharacter(context, x, y, color, scale * 2.4, hero, 0, character);
  }
  function hills(context) {
    rect(context, 0, 0, 960, 540, "#a9d2d0");
    ellipse(context, 792, 75, 43, 43, "#f8e6ab");
    context.fillStyle = "#8eae98"; context.beginPath(); context.moveTo(0, 210); context.lineTo(130, 110); context.lineTo(255, 197); context.lineTo(388, 95); context.lineTo(570, 210); context.lineTo(700, 125); context.lineTo(960, 219); context.lineTo(960, 540); context.lineTo(0, 540); context.fill();
    context.fillStyle = "#5e8b6c"; context.beginPath(); context.moveTo(0, 253); context.quadraticCurveTo(250, 195, 460, 254); context.quadraticCurveTo(700, 192, 960, 244); context.lineTo(960, 540); context.lineTo(0, 540); context.fill();
    rect(context, 0, 354, 960, 186, "#a7b77b");
  }
  function kettle(context, x, y, scale, time) {
    context.save(); context.translate(x, y); context.scale(scale, scale);
    line(context, [[-31, -8], [-40, 32], [-56, 62]], "#5d4a39", 6); line(context, [[31, -8], [40, 32], [56, 62]], "#5d4a39", 6);
    rect(context, -56, -13, 112, 6, "#594b3d");
    ellipse(context, 0, 37, 38, 15, "#d56b38");
    ellipse(context, 0, 6, 38, 28, "#344c48"); ellipse(context, 0, -10, 39, 9, "#293e3b"); ellipse(context, 0, -11, 33, 5, "#d39251");
    for (let index = 0; index < 3; index++) { const drift = Math.sin(time * 2 + index) * 5; ellipse(context, -17 + index * 17 + drift, -25 - (time * 13 + index * 13) % 40, 5, 9, "#f5f1e4a0"); }
    context.restore();
  }
  function festival(context, time) {
    hills(context);
    for (let index = 0; index < 12; index++) { const x = index * 90; line(context, [[x, 92 + Math.sin(index) * 8], [x + 90, 92 + Math.sin(index + 1) * 8]], "#f2edcc", 2); context.fillStyle = ["#d85849", "#e9c85d", "#eef0d5"][index % 3]; context.beginPath(); context.moveTo(x + 10, 94); context.lineTo(x + 28, 94); context.lineTo(x + 19, 112); context.fill(); }
    rect(context, 326, 333, 309, 91, "#bd8d60"); rect(context, 306, 405, 350, 16, "#7d604a");
    person(context, 480, 341, .9, { character: "fifko" });
    person(context, 604, 374, .85, { character: "mayor" });
    person(context, 230, 421, .87, { shirt: "#c67567", hero: true, wave: Math.sin(time * 2) * 6 });
    person(context, 742, 422, .91, { character: "simona" });
    person(context, 824, 429, .72, { character: "lida" });
    kettle(context, 109, 405, 1, time); kettle(context, 860, 375, .75, time + 1);
    context.save(); context.translate(510, 213 + Math.sin(time * 3) * 3); rect(context, -7, 25, 14, 21, "#d3a443"); rect(context, -20, 43, 40, 7, "#a97832"); ellipse(context, 0, 3, 25, 26, "#efd16c"); rect(context, -16, -18, 32, 25, "#e8bd4d"); text(context, "1", 0, 10, 22, "#805d2d"); context.restore();
    text(context, "GULÁŠFEST ZUBÁK", 480, 175, 25, "#fff4d6");
  }
  function band(context, time) {
    hills(context); rect(context, 110, 125, 740, 330, "#284d46"); rect(context, 125, 139, 710, 300, "#42685a");
    rect(context, 85, 405, 790, 26, "#8b604a"); rect(context, 100, 430, 760, 36, "#664d3c");
    for (let index = 0; index < 8; index++) ellipse(context, 160 + index * 90, 155, 5, 5, index % 2 ? "#f6d68d" : "#e6926f");
    person(context, 307, 407, 1.1, { shirt: palette.red, hero: true, wave: Math.sin(time * 7) * 4 });
    rect(context, 222, 326, 190, 51, "#263b38"); rect(context, 230, 331, 175, 15, "#f4eedc"); for (let key = 0; key < 12; key++) rect(context, 239 + key * 14, 331, 3, 10, "#263b38");
    line(context, [[237, 378], [226, 414]], "#293e3b", 5); line(context, [[397, 378], [406, 414]], "#293e3b", 5);
    person(context, 515, 407, 1.1, { character: "betka" });
    line(context, [[520, 306], [590, 306]], "#e6d9aa", 6);
    for (let hole = 0; hole < 5; hole++) ellipse(context, 541 + hole * 8, 306, 1.5, 1.5, "#6c6857");
    person(context, 714, 408, 1.08, { character: "simona" });
    ellipse(context, 716, 351, 35, 29, "#c08351"); ellipse(context, 716, 351, 25, 19, "#e6b778"); line(context, [[727, 339], [767, 300]], "#74513c", 9);
    text(context, "NG & KAPELA", 480, 212, 25, "#f8e9b9");
    for (let index = 0; index < 5; index++) text(context, "♪", 185 + index * 145, 245 - (time * 25 + index * 30) % 65, 20, "#ead192");
  }
  function bathroom(context, time) {
    rect(context, 0, 0, 960, 540, "#e1e9dd"); rect(context, 0, 0, 960, 330, "#c8dcd5");
    for (let x = 0; x < 960; x += 65) line(context, [[x, 0], [x, 330]], "#a8c6bd", 1);
    for (let y = 0; y < 330; y += 65) line(context, [[0, y], [960, y]], "#a8c6bd", 1);
    rect(context, 132, 65, 165, 165, "#f7f1df"); rect(context, 145, 78, 139, 139, "#a9d4db"); line(context, [[214, 78], [214, 217]], "#f7f1df", 7); line(context, [[145, 147], [284, 147]], "#f7f1df", 7);
    rect(context, 691, 130, 84, 162, "#eab16e"); rect(context, 701, 145, 64, 130, "#f4ce91");
    rect(context, 0, 330, 960, 210, "#a7947c");
    ellipse(context, 474, 395, 270, 83, "#f7f4e8"); ellipse(context, 474, 373, 252, 68, "#9fd2d7");
    ellipse(context, 484, 337, 40, 45, "#181c1b"); ellipse(context, 484, 342, 34, 39, "#eab38b"); ellipse(context, 472, 337, 3, 3, palette.ink); ellipse(context, 496, 337, 3, 3, palette.ink); line(context, [[474, 354], [484, 358], [494, 354]], "#aa5c50", 3);
    ellipse(context, 450, 365, 9, 36, "#181c1b"); ellipse(context, 518, 365, 9, 36, "#181c1b");
    ellipse(context, 445, 392, 122, 34, "#c5e1dd");
    for (let bubble = 0; bubble < 16; bubble++) { const x = 280 + bubble * 25; const y = 365 + Math.sin(bubble * 2 + time * 2) * 8; ellipse(context, x, y, 13 + bubble % 3 * 3, 13 + bubble % 3 * 3, "#f8faf2"); }
    line(context, [[714, 325], [714, 281], [682, 281], [682, 305]], "#7d9d9a", 9);
    for (let drop = 0; drop < 3; drop++) ellipse(context, 682, 313 + (time * 80 + drop * 18) % 48, 3, 6, "#7cbec7");
    text(context, "KONEČNE DOMA", 477, 190, 20, "#55827b");
  }
  function cafe(context, time) {
    rect(context, 0, 0, 960, 540, "#e2d5be"); rect(context, 0, 0, 960, 185, "#b9d1c5"); rect(context, 0, 425, 960, 115, "#b99672");
    rect(context, 48, 93, 310, 260, "#43675d"); rect(context, 62, 107, 282, 232, "#d4e5d7"); line(context, [[203, 108], [203, 338]], "#f2ead8", 9); line(context, [[62, 220], [344, 220]], "#f2ead8", 9);
    rect(context, 394, 112, 275, 242, "#345149"); rect(context, 411, 129, 241, 210, "#e6c690"); text(context, "VÝBEROVÁ KÁVA", 531, 174, 22, "#344d43"); text(context, "FILTER  /  MATCHA", 531, 214, 17, "#5a6f53"); text(context, "ESPRESSO  /  V60", 531, 242, 16, "#5a6f53");
    rect(context, 697, 75, 188, 208, "#7d6754"); for (let shelf = 0; shelf < 3; shelf++) { rect(context, 704, 125 + shelf * 55, 174, 8, "#ad9878"); for (let cup = 0; cup < 5; cup++) rect(context, 717 + cup * 30, 104 + shelf * 55, 17, 20, ["#f0e2c9", "#bf7b60", "#c5d6bd"][cup % 3]); }
    person(context, 178, 440, 1, { shirt: "#c47a64", glasses: true, wave: Math.sin(time * 2) * 6 });
    person(context, 292, 441, .93, { shirt: "#d0b253", glasses: true, wave: 9 });
    person(context, 570, 415, .9, { character: "mayor" });
    person(context, 817, 445, 1.05, { shirt: "#937987", glasses: true, wave: 10 });
    rect(context, 376, 378, 313, 22, "#82654c"); rect(context, 391, 400, 283, 100, "#a68360");
    ellipse(context, 468, 371, 22, 6, "#f5edda"); rect(context, 452, 348, 32, 23, "#f5edda"); ellipse(context, 468, 348, 16, 5, "#78614a");
    line(context, [[529, 327], [544, 350], [559, 327]], "#f0e2c9", 4); line(context, [[544, 350], [544, 370]], "#f0e2c9", 4); ellipse(context, 544, 370, 16, 3, "#f0e2c9");
    for (let index = 0; index < 3; index++) ellipse(context, 465 + index * 7 + Math.sin(time + index) * 3, 333 - (time * 10 + index * 7) % 20, 3, 7, "#f8f6e8aa");
    rect(context, 707, 312, 169, 13, "#6e5443"); line(context, [[730, 324], [718, 452]], "#6e5443", 8); line(context, [[853, 324], [865, 452]], "#6e5443", 8);
  }
  function brno(context, time) {
    rect(context, 0, 0, 960, 540, "#80b3e4");
    if (brnoImage.complete && brnoImage.naturalWidth) {
      const sourceHeight = brnoImage.naturalWidth * 540 / 960;
      context.drawImage(brnoImage, 0, (brnoImage.naturalHeight - sourceHeight) / 2, brnoImage.naturalWidth, sourceHeight, 0, 0, 960, 540);
    }
    person(context, 700, 489 + Math.sin(time * 2) * 2, 1.35, { character: "peter" });
  }
  function finale(context, time, options = {}) {
    hills(context);
    rect(context, 0, 0, 960, 540, "#102319aa");
    text(context, "NG", options.ngX ?? 335, 245, 130, "#f2cd72");
    person(context, 650, 502, 2.6, { hero: true });
  }
  const drawings = [festival, band, bathroom, brno, cafe, finale];
  function draw(canvas, index, time, options = {}) {
    const context = canvas.getContext("2d"); if (!context) return;
    context.setTransform(canvas.width / 960, 0, 0, canvas.height / 540, 0, 0);
    drawings[Math.max(0, Math.min(drawings.length - 1, index))](context, time, options);
  }
  function soundtrack() {
    let audio; let nextNote = 0; let playing = true; let ambienceEnabled = true; let ambienceScene = -1; const voices = new Set();
    const melody = [329.63, 392, 440, 392, 329.63, 293.66, 329.63, 392, 440, 523.25, 493.88, 440, 392, 329.63, 293.66, 329.63];
    try { audio = new (root.AudioContext || root.webkitAudioContext)(); audio.resume().catch(() => {}); } catch { return { tick() {}, toggle() { return false; }, stop() {} }; }
    function note(frequency, start, length, volume, type) {
      const oscillator = audio.createOscillator(); const gain = audio.createGain();
      oscillator.type = type; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(.0001, start); gain.gain.exponentialRampToValueAtTime(volume, start + .025); gain.gain.exponentialRampToValueAtTime(.0001, start + length);
      oscillator.connect(gain); gain.connect(audio.destination); voices.add(oscillator);
      oscillator.onended = () => { voices.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(start); oscillator.stop(start + length);
    }
    function ambience(index, now) {
      if (!ambienceEnabled || index === ambienceScene) return;
      ambienceScene = index;
      if (index === 0) {
        [659.25, 783.99, 987.77].forEach((frequency, partial) => note(frequency, now + partial * .13, .22, .009, "sine"));
      } else if (index === 1) {
        [392, 493.88, 587.33].forEach((frequency, partial) => note(frequency, now + partial * .12, .3, .008, "sine"));
      } else if (index === 2) {
        for (let drop = 0; drop < 5; drop++) note(700 + (drop % 2) * 180, now + drop * .11, .13, .008, "sine");
      } else if (index === 3) {
        [180, 240, 310].forEach((frequency, partial) => note(frequency, now + partial * .08, .55, .012, "sawtooth"));
        [660, 880].forEach((frequency, partial) => note(frequency, now + .28 + partial * .12, .12, .005, "sine"));
      } else if (index === 4) {
        [523.25, 659.25, 783.99].forEach((frequency, partial) => note(frequency, now + partial * .12, .27, .008, "sine"));
      } else if (index === 5) {
        [392, 493.88, 587.33, 783.99].forEach((frequency, partial) => note(frequency, now + partial * .18, .7, .009, "sine"));
      }
    }
    return {
      tick(elapsed) {
        if (!playing || audio.state !== "running") return;
        if (nextNote < audio.currentTime) nextNote = audio.currentTime + .03;
        ambience(Math.floor(elapsed / duration), nextNote);
        while (nextNote < audio.currentTime + .18) {
          const beat = Math.floor(elapsed / .42); const intensity = Math.min(1, .48 + elapsed / 120);
          note(melody[beat % melody.length], nextNote, .34, .075 * intensity, "triangle");
          if (beat % 2 === 0) note([164.81, 146.83, 130.81, 146.83][Math.floor(beat / 4) % 4], nextNote, .8, .048 * intensity, "sine");
          if (elapsed > duration && beat % 4 === 0) note(melody[beat % melody.length] * 1.5, nextNote, .55, .022 * intensity, "sine");
          nextNote += .42;
        }
      },
      toggle() { playing = !playing; ambienceEnabled = playing; if (playing) { audio.resume().catch(() => {}); nextNote = 0; ambienceScene = -1; } else voices.forEach(voice => { try { voice.stop(); } catch {} }); return playing; },
      stop() { playing = false; voices.forEach(voice => { try { voice.stop(); } catch {} }); audio.close().catch(() => {}); }
    };
  }
  function start(onComplete) {
    const overlay = document.createElement("section"); overlay.className = "finale"; overlay.setAttribute("role", "dialog"); overlay.setAttribute("aria-modal", "true"); overlay.setAttribute("aria-label", "Záverečný film");
    overlay.innerHTML = '<canvas class="finale-canvas" width="960" height="540" aria-hidden="true"></canvas><div class="finale-shade"></div><div class="finale-copy" aria-live="polite"><p class="finale-label"></p><h2></h2><p class="finale-detail"></p></div><div class="finale-controls"><button class="finale-next" type="button" title="Ďalšia scéna">Choď ďalej</button><button class="finale-sound" type="button" title="Vypnúť hudbu" aria-label="Vypnúť hudbu" aria-pressed="true"><svg class="sound-icon-on" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9h3.5L13 5v14l-5.5-4H4z"/><path d="M16 8.5a5 5 0 0 1 0 7"/><path d="M18.5 6a9 9 0 0 1 0 12"/></svg><svg class="sound-icon-off" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9h3.5L13 5v14l-5.5-4H4z"/><path d="m16 9.5 5 5M21 9.5l-5 5"/></svg></button></div><div class="finale-progress" aria-hidden="true"><span></span></div>';
    document.body.append(overlay);
    const canvas = overlay.querySelector("canvas"); const title = overlay.querySelector("h2"); const label = overlay.querySelector(".finale-label"); const detail = overlay.querySelector(".finale-detail"); const progress = overlay.querySelector(".finale-progress span");
    const sound = soundtrack(); let frameId = 0; let startTime; let currentScene = -1; let stopped = false; let sceneOffset = 0;
    function finish() { if (stopped) return; stopped = true; cancelAnimationFrame(frameId); sound.stop(); overlay.remove(); onComplete(); }
    overlay.querySelector(".finale-sound").addEventListener("click", event => { const enabled = sound.toggle(); event.currentTarget.setAttribute("aria-pressed", String(enabled)); event.currentTarget.title = enabled ? "Vypnúť hudbu" : "Zapnúť hudbu"; event.currentTarget.setAttribute("aria-label", event.currentTarget.title); });
    overlay.querySelector(".finale-next").addEventListener("click", () => {
      const next = Math.max(0, currentScene) + 1;
      if (next >= scenes.length) { finish(); return; }
      sceneOffset = next * duration;
      startTime = undefined;
      currentScene = next;
      title.textContent = scenes[next].title; label.textContent = scenes[next].label; detail.textContent = scenes[next].detail; overlay.dataset.scene = String(next);
      draw(canvas, next, 0); sound.tick(sceneOffset); progress.style.width = `${sceneOffset / (scenes.length * duration) * 100}%`;
    });
    function frame(timestamp) {
      if (startTime === undefined) startTime = timestamp;
      const elapsed = sceneOffset + Math.max(0, (timestamp - startTime) / 1000);
      if (elapsed >= scenes.length * duration) { finish(); return; }
      const index = Math.floor(elapsed / duration);
      if (index !== currentScene) { currentScene = index; title.textContent = scenes[index].title; label.textContent = scenes[index].label; detail.textContent = scenes[index].detail; overlay.dataset.scene = String(index); }
      draw(canvas, index, elapsed - index * duration); sound.tick(elapsed); progress.style.width = `${elapsed / (scenes.length * duration) * 100}%`;
      frameId = requestAnimationFrame(frame);
    }
    frameId = requestAnimationFrame(frame);
    return { stop: finish };
  }
  root.ZubakEnding = { start, draw, scenes, duration };
})(globalThis);