(function (root) {
  "use strict";
  const springDistance = 940;
  function routeDistance(distance) {
    return distance <= springDistance ? distance * .85 : distance - springDistance * .15;
  }
  function sceneryDistance(distance) {
    const spring = routeDistance(springDistance);
    return distance <= spring ? distance / .85 : distance + springDistance * .15;
  }
  const length = routeDistance(1800);
  const minimumSpeed = 20 / 3.6;
  const maximumSpeed = 100 / 3.6;
  const sections = [
    [0, "Rozhľadňa", "tower"], [160, "Kýčera", "ridge"],
    [400, "Žrnová", "ridge"], [650, "Stará železnica", "rail"],
    [940, "Sirková voda", "spring"], [1100, "Zubák", "village"],
    [1350, "Zastávka · Zubák Expres", "bus"], [1660, "Obecný úrad", "office"]
  ].map(([distance, ...details]) => [routeDistance(distance), ...details]);
  const obstacles = [
    [240, -.4, "tree"], [345, .5, "log"], [475, -.15, "tree"],
    [590, .55, "log"], [720, -.5, "rail"], [835, .2, "bear"],
    [985, .35, "ondrej"], [1050, .45, "log"], [1120, -.35, "betka"],
    [1180, .35, "simona"], [1235, 0, "suv"], [1250, -.35, "lyda"], [1330, .35, "peter"],
    [1375, 0, "suv"], [1440, -.35, "mama"], [1460, 0, "filipSUV"], [1485, .35, "kika"],
    [1555, .28, "bus"], [1630, 0, "suv"], [1660, -.5, "log"]
  ].map(([distance, ...details]) => [routeDistance(distance), ...details]);
  function create(name) {
    return { name, phase: "countdown", countdown: 3, elapsed: 0, distance: 0,
      speed: minimumSpeed, x: 0, falls: 0, recovery: 0, immunity: 0, lastPedal: -1,
      passed: [], resumePhase: null, fallCause: null };
  }
  function pedal(state) {
    if (state.phase !== "riding" || state.elapsed - state.lastPedal < .28) return;
    state.speed = Math.min(maximumSpeed, state.speed + 2.2); state.lastPedal = state.elapsed;
  }
  function section(distance) { return sections.filter(entry => entry[0] <= distance).at(-1); }
  function obstacleX(entry, elapsed, state) {
    if (entry[2] === "bus") return .28 + Math.sin(elapsed * .45) * .1;
    if (entry[2] === "filipSUV") {
      const start = Math.sin(elapsed * .45 + entry[0] * .1) * .55;
      const approach = state ? Math.max(0, Math.min(1, (100 - (obstacleDistance(entry, state.distance) - state.distance)) / 65)) : 0;
      return state ? start + (state.x - start) * approach : start;
    }
    if (entry[2] === "suv") return Math.sin(elapsed * .45 + entry[0] * .1) * .55;
    if (["ondrej", "betka", "simona", "lyda", "peter", "mama", "kika"].includes(entry[2])) return entry[1] + Math.sin(elapsed * .7) * .18;
    return entry[2] === "bear" ? Math.sin(elapsed * .8) * .58 : entry[1];
  }
  function obstacleDistance(entry, distance) {
    if (entry[2] === "filipSUV") return entry[0] - Math.max(0, Math.min(48, (distance - entry[0] + 100) * .6));
    return entry[2] === "suv" ? entry[0] - Math.max(0, Math.min(30, (distance - entry[0] + 100) * .3)) : entry[0];
  }
  function fall(state, cause = null) {
    if (state.phase !== "riding" || (state.immunity > 0 && cause !== "filipSUV")) return;
    state.phase = "fallen"; state.recovery = 3; state.speed = 0; state.falls++; state.fallCause = cause;
  }
  function update(state, duration, direction = 0, braking = false) {
    if (!Number.isFinite(duration) || duration <= 0) return;
    let remaining = duration;
    while (remaining > .000001 && !["paused", "finished"].includes(state.phase)) {
      const step = Math.min(remaining, 1 / 120); remaining -= step;
      if (state.phase === "countdown") {
        state.countdown = Math.max(0, state.countdown - step);
        if (state.countdown < .000001) state.phase = "riding";
        continue;
      }
      if (state.phase === "fallen") {
        state.elapsed += step; state.recovery -= step;
        if (state.recovery <= .000001) { state.phase = "riding"; state.speed = 16; state.immunity = 1.5; state.fallCause = null; }
        continue;
      }
      state.speed = Math.max(minimumSpeed, state.speed - (braking ? 12 : 3.2) * step);
      const speedFraction = Math.max(0, Math.min(1, (state.speed - minimumSpeed) / (maximumSpeed - minimumSpeed)));
      const highSpeed = Math.max(0, Math.min(1, (state.speed - 25) / (maximumSpeed - 25)));
      const steeringSpeed = (1.25 - .8 * speedFraction) * (1 - .35 * highSpeed);
      state.x = Math.max(-.86, Math.min(.86, state.x + Math.max(-1, Math.min(1, direction)) * step * steeringSpeed));
      state.immunity = Math.max(0, state.immunity - step);
      const previous = state.distance;
      const travelSpeed = state.speed * (1 + .4 * speedFraction);
      const travel = travelSpeed * step;
      const used = Math.min(step, (length - previous) / travelSpeed);
      state.elapsed += used; state.distance = Math.min(length, previous + travel);
      if (state.distance >= length) { state.phase = "finished"; break; }
      obstacles.forEach((entry, index) => {
        if (state.passed.includes(index) || obstacleDistance(entry, state.distance) > state.distance) return;
        if (entry[2] === "filipSUV" && state.phase !== "riding") return;
        state.passed.push(index);
        if (entry[2] === "filipSUV") { fall(state, entry[2]); return; }
        const width = entry[2] === "bus" ? .47 : entry[2] === "suv" ? .29 : entry[2] === "bear" ? .21 : .17;
        if (Math.abs(state.x - obstacleX(entry, state.elapsed)) < width) fall(state);
      });
    }
  }
  function pause(state) {
    if (["paused", "finished"].includes(state.phase)) return;
    state.resumePhase = state.phase; state.phase = "paused";
  }
  function resume(state) { if (state.phase === "paused") state.phase = state.resumePhase; }
  function format(seconds) {
    const scaled = Math.floor(seconds * 60);
    return [Math.floor(scaled / 3600), Math.floor(scaled / 60) % 60, scaled % 60].map(value => String(value).padStart(2, "0")).join(":");
  }
  root.ZubakBike = { create, pedal, update, pause, resume, fall, format, section, obstacleX, obstacleDistance, routeDistance, sceneryDistance, obstacles, sections, length };
})(globalThis);