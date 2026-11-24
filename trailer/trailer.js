(function () {
  "use strict";
  const canvas = document.getElementById("trailer");
  const context = canvas.getContext("2d");
  const scene = document.getElementById("scene");
  const foreground = document.getElementById("foreground");
  const playButton = document.getElementById("play");
  const exportButton = document.getElementById("export");
  const webmButton = document.getElementById("export-webm");
  const status = document.getElementById("status");
  const duration = 30;
  const shots = [
    { start: 0, end: 4.5, location: "field", eyebrow: "JEDNA DEDINA. JEDNA VEĽKÁ SOBOTA.", lines: ["Najväčšia udalosť roka", "v Zubáku."], focus: [960, 540] },
    { start: 4.5, end: 8, location: "field", eyebrow: "KOTLÍKY SÚ PRIPRAVENÉ. ALE…", lines: ["Kde je naberačka?"], focus: [1050, 650] },
    { start: 8, end: 11, location: "well", eyebrow: "NIEČO TU NESEDÍ.", lines: ["Studňa vysychá."], focus: [1100, 700] },
    { start: 11, end: 14, location: "pub", eyebrow: "A DEDINA MÁ ĎALŠÍ PROBLÉM.", lines: ["Krčma je zatvorená."], focus: [1000, 550] },
    { start: 14, end: 17, location: "home", eyebrow: "A TERAZ PRICHÁDZA NG", lines: ["Káva v ruke. Otázky pripravené."], focus: [1120, 760], arrival: true },
    { start: 17, end: 19, location: "forest", eyebrow: "SLEDUJ STOPY.", lines: ["Never každej klebete."], focus: [1000, 650] },
    { start: 19, end: 21, location: "tower", eyebrow: "POSKLADAJ SÚVISLOSTI.", lines: ["Každý vie niečo."], focus: [1050, 600] },
    { start: 21, end: 24.5, location: "field", eyebrow: "FIFKO MÁ JASNO.", lines: ["„Poker aj pingpong už mám.", "Teraz vyhrám gulášfest!“"], focus: [490, 780] },
    { start: 24.5, end: 30, location: "tower", eyebrow: "DETEKTÍVNA ADVENTÚRA Z BIELYCH KARPÁT", lines: ["ZUBÁK", "Záhada zatvorenej krčmy"], focus: [960, 540], final: true }
  ];
  let running = false;
  let animation = 0;
  let audio = null;
  let recorder = null;
  let recordingStream = null;
  const videoUrls = {};
  let musicNodes = [];
  const formats = {
    mp4: ["video/mp4;codecs=avc1.42001E,mp4a.40.2", "video/mp4"],
    webm: ["video/webm;codecs=vp8,opus", "video/webm;codecs=vp9,opus", "video/webm"]
  };
  const supportedTypes = Object.fromEntries(Object.entries(formats).map(([format, types]) => [format,
    typeof MediaRecorder !== "undefined" ? types.find(type => MediaRecorder.isTypeSupported(type)) : null
  ]));
  function updateExportButtons() {
    exportButton.disabled = running || !supportedTypes.mp4 || !canvas.captureStream;
    webmButton.disabled = running || !supportedTypes.webm || !canvas.captureStream;
  }
  updateExportButtons();
  if (exportButton.disabled && webmButton.disabled) status.textContent = "Export videa tento prehliadač nepodporuje.";

  function draw(time) {
    const shot = shots.find(value => time >= value.start && time < value.end) || shots[shots.length - 1];
    const progress = Math.max(0, Math.min(1, (time - shot.start) / (shot.end - shot.start)));
    const sceneTime = shot.arrival ? shot.start + Math.max(0, time - shot.start - 2) : time;
    const motionProgress = shot.arrival ? Math.max(0, time - shot.start - 2) / 3 : progress;
    const playerX = 560 + Math.sin(sceneTime * .65) * 55;
    const state = Zubak.createState();
    state.location = shot.location;
    ZubakArt.draw(state, false, sceneTime, { x: playerX, y: 476, walking: time < 24.5 });
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = "#172b24";
    context.fillRect(0, 0, 1920, 1080);
    const zoom = 1.02 + motionProgress * .07;
    context.save();
    context.translate(960, 540);
    context.scale(zoom, zoom);
    context.translate(-960 - (shot.focus[0] - 960) * motionProgress * .15, -540 - (shot.focus[1] - 540) * motionProgress * .15);
    context.drawImage(scene, 0, 0);
    if (!shot.arrival) context.drawImage(foreground, 0, 0);
    context.restore();
    const shade = context.createLinearGradient(0, 350, 0, 1080);
    shade.addColorStop(0, "#14271e00");
    shade.addColorStop(.55, "#14271eaa");
    shade.addColorStop(1, "#102319f5");
    context.fillStyle = shade;
    context.fillRect(0, 0, 1920, 1080);
    context.fillStyle = "#102319";
    context.fillRect(0, 0, 1920, 60);
    context.fillRect(0, 1020, 1920, 60);
    context.textAlign = "center";
    context.fillStyle = "#f2cd72";
    context.font = "bold 25px Georgia";
    if (!shot.arrival) context.fillText(shot.eyebrow, 960, shot.final ? 640 : 742, 1750);
    if (shot.arrival) {
      context.fillStyle = "#10231977";
      context.fillRect(0, 60, 1920, 960);
      context.fillStyle = "#fff3d4";
      context.font = "bold 88px Georgia";
      context.fillText("A TERAZ", 680, 310, 1200);
      context.font = "bold 118px Georgia";
      context.fillText("PRICHÁDZA", 680, 455, 1200);
      context.fillStyle = "#f2cd72";
      context.font = "bold 280px Georgia";
      context.fillText("NG", 680, 745, 1200);
    }
    const reveal = Math.min(1, progress * 5);
    context.globalAlpha = reveal;
    context.fillStyle = "#fff3d4";
    shot.lines.forEach((text, index) => {
      context.font = `bold ${shot.arrival ? 42 : shot.final && index === 0 ? 132 : shot.final ? 66 : 74}px Georgia`;
      context.fillText(text, shot.arrival ? 680 : 960, (shot.final ? 800 : 840) + index * 90 + (1 - reveal) * 20, shot.arrival ? 1150 : 1730);
    });
    if (shot.final) {
      context.font = "28px Georgia";
      context.fillStyle = "#f2cd72";
      context.fillText("Už čoskoro na vašich počítačoch.", 960, 975);
    }
    context.globalAlpha = 1;
    if (shot.arrival) {
      const entrance = 1 - (1 - Math.min(1, (time - shot.start) / .4)) ** 3;
      context.drawImage(foreground, playerX * 2 - 48, 772, 120, 190, 1410 + (1 - entrance) * 420, 230, 480, 760);
    }
    const fade = Math.max(0, 1 - (time - shot.start) / .22, (time - (shot.end - .22)) / .22);
    context.fillStyle = `rgba(16,35,25,${Math.min(1, fade)})`;
    context.fillRect(0, 0, 1920, 1080);
  }

  function stopMusic() {
    musicNodes.forEach(node => { try { node.stop(); } catch {} });
    musicNodes = [];
  }

  async function music() {
    audio ??= new AudioContext();
    await audio.resume();
    const output = audio.createGain();
    output.gain.value = document.getElementById("sound").checked ? .65 : 0;
    output.connect(audio.destination);
    const destination = audio.createMediaStreamDestination();
    output.connect(destination);
    const melody = [64, 67, 69, 67, 64, 62, 60, 62, 64, 67, 72, 71, 69, 67, 64, 62];
    const start = audio.currentTime + .05;
    function note(pitch, when, length, volume, type) {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = type;
      oscillator.frequency.value = 440 * 2 ** ((pitch - 69) / 12);
      gain.gain.setValueAtTime(0, when);
      gain.gain.linearRampToValueAtTime(volume, when + .015);
      gain.gain.exponentialRampToValueAtTime(.0001, when + length);
      oscillator.connect(gain); gain.connect(output);
      oscillator.start(when); oscillator.stop(when + length);
      musicNodes.push(oscillator);
    }
    for (let beat = 0; beat < 64; beat++) {
      const when = start + beat * .375;
      const base = [48, 45, 53, 55][Math.floor(beat / 8) % 4];
      note(melody[beat % melody.length], when, .28, .09, "triangle");
      if (beat % 2 === 0) note(base - 12, when, .28, .14, "sine");
      if (beat % 4 === 0) [0, 4, 7].forEach(interval => note(base + interval, when, .7, .025, "triangle"));
    }
    [67, 69, 71, 72, 74, 76, 79, 83].forEach((pitch, index) => {
      note(pitch, start + 22.5 + index * .22, .4, .045 + index * .009, "triangle");
    });
    [36, 48, 55, 60, 64, 67, 72].forEach(pitch => {
      note(pitch, start + 24.5, 5.2, pitch < 48 ? .2 : .065, pitch < 48 ? "sine" : "triangle");
    });
    [79, 76, 72].forEach((pitch, index) => {
      note(pitch, start + 25 + index * .5, 2.8, .075, "triangle");
    });
    return destination.stream;
  }

  function finish() {
    running = false;
    cancelAnimationFrame(animation);
    stopMusic();
    if (recorder?.state === "recording") recorder.stop();
    playButton.textContent = "Prehrať znova";
    updateExportButtons();
    document.getElementById("sound").disabled = false;
  }

  async function start(exporting) {
    if (running) { finish(); return; }
    running = true;
    updateExportButtons();
    document.getElementById("sound").disabled = true;
    playButton.textContent = "Zastaviť";
    status.textContent = exporting ? "Pripravujem video…" : "00:00 / 00:30";
    try {
      const audioStream = await music();
      if (exporting) {
        const supportedType = supportedTypes[exporting];
        recordingStream = canvas.captureStream(30);
        audioStream.getAudioTracks().forEach(track => recordingStream.addTrack(track));
        const chunks = [];
        recorder = new MediaRecorder(recordingStream, { mimeType: supportedType, videoBitsPerSecond: 8000000 });
        recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: supportedType });
          recordingStream.getTracks().forEach(track => track.stop());
          if (blob.size < 10000) {
            status.textContent = "Video sa nenahralo správne. Skús export v samostatnom okne Chrome alebo Edge.";
            return;
          }
          if (videoUrls[exporting]) URL.revokeObjectURL(videoUrls[exporting]);
          videoUrls[exporting] = URL.createObjectURL(blob);
          const link = document.getElementById(exporting === "mp4" ? "download" : "download-webm");
          link.href = videoUrls[exporting];
          link.download = `zubak-trailer.${exporting}`;
          link.hidden = false;
          status.textContent = `${exporting.toUpperCase()} pripravené (${(blob.size / 1048576).toFixed(1)} MB)`;
        };
        recorder.start();
      }
      const started = performance.now();
      function frame(now) {
        const time = Math.min(duration, (now - started) / 1000);
        draw(time);
        status.textContent = `${exporting ? "Nahrávam video · " : ""}00:${String(Math.floor(time)).padStart(2, "0")} / 00:30`;
        if (time < duration && running) animation = requestAnimationFrame(frame);
        else { draw(29.5); finish(); }
      }
      animation = requestAnimationFrame(frame);
    } catch (error) {
      finish();
      status.textContent = `Nepodarilo sa spustiť trailer: ${error.message}`;
    }
  }
  playButton.addEventListener("click", () => start(false));
  exportButton.addEventListener("click", () => start("mp4"));
  webmButton.addEventListener("click", () => start("webm"));
  draw(1);
})();