// spring.js: an interruptible spring for the juice patterns that CSS cannot do alone
// (stretch from velocity, an indicator that chases a moving target, drag release).
// It reads the temperament from the CSS tokens of juice.css, so CSS and JS share one feel.
//
//   const knob = createSpring({ value: 0, onFrame: (x, v) => render(x, v) });
//   knob.set(16);          // retarget at any time; the current velocity carries over
//
// INVARIANT: set() never restarts from rest. A second click mid-flight reverses the motion from
// where it is, at the speed it has. That is what keeps the control from blocking input.

const STEP = 1 / 240; // fixed substep in seconds: stable for stiff springs at any frame rate
const REST_DISTANCE = 0.01;
const REST_SPEED = 0.05;

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function readTemperament(el = document.documentElement) {
  const css = getComputedStyle(el);
  const number = (name, fallback) => {
    const value = parseFloat(css.getPropertyValue(name));
    return Number.isFinite(value) ? value : fallback;
  };
  return {
    response: number('--spring-response', 220) / 1000,
    bounce: number('--spring-bounce', 0),
    stretch: number('--stretch', 0),
    squash: number('--squash', 0),
  };
}

// `pace` scales the response: 0.8 is a faster spring, 1.25 a lazier one (the trailing edge).
export function createSpring({ value = 0, onFrame, onRest, el, pace: initialPace = 1 } = {}) {
  let pace = initialPace;
  let position = value;
  let velocity = 0;
  let target = value;
  let frame = 0;
  let last = 0;
  let carry = 0;

  const tick = (now) => {
    const { response, bounce } = readTemperament(el);
    const omega = (2 * Math.PI) / (response * pace);
    const zeta = 1 - bounce;
    carry += Math.min((now - last) / 1000, 0.064); // a hidden tab never makes one giant step
    last = now;
    while (carry >= STEP) {
      const accel = -omega * omega * (position - target) - 2 * zeta * omega * velocity;
      velocity += accel * STEP; // semi-implicit Euler: update velocity first, then position
      position += velocity * STEP;
      carry -= STEP;
    }
    if (Math.abs(position - target) < REST_DISTANCE && Math.abs(velocity) < REST_SPEED) {
      position = target;
      velocity = 0;
      frame = 0;
      onFrame?.(position, velocity);
      onRest?.(position);
      return;
    }
    onFrame?.(position, velocity);
    frame = requestAnimationFrame(tick);
  };

  return {
    set(next) {
      target = next;
      if (reducedMotion()) return this.jump(next);
      if (!frame) {
        last = performance.now();
        carry = 0;
        frame = requestAnimationFrame(tick);
      }
    },
    jump(next) {
      cancelAnimationFrame(frame);
      frame = 0;
      position = target = next;
      velocity = 0;
      onFrame?.(position, velocity);
    },
    nudge(impulse) {
      velocity += impulse; // a flick or a lean: add speed without moving the target
      this.set(target);
    },
    get position() { return position; },
    get velocity() { return velocity; },
    get target() { return target; },
    get pace() { return pace; },
    set pace(next) { pace = next; },
  };
}

// Rubber band past a boundary: the further the drag goes, the less the element follows.
// The band scales with the allowed range (max - min). Adapted from pmndrs/use-gesture (MIT).
export function rubberband(position, min, max, constant = 0.15) {
  const range = max - min;
  const band = (distance) => (distance * range * constant) / (range + constant * distance);
  if (position < min) return min - band(min - position);
  if (position > max) return max + band(position - max);
  return position;
}

// Release velocity of a drag in px/s, from the last 100 ms of pointer samples.
// A release faster than ~110 px/s (0.11 px/ms) counts as a flick: dismiss even before the distance
// threshold. Seed the release spring with it: spring.nudge(tracker.velocity()).
export function createVelocityTracker(windowMs = 100) {
  let samples = [];
  return {
    add(position, time = performance.now()) {
      samples.push({ position, time });
      samples = samples.filter((s) => time - s.time <= windowMs);
    },
    velocity() {
      if (samples.length < 2) return 0;
      const first = samples[0], last = samples[samples.length - 1];
      const elapsed = last.time - first.time;
      return elapsed > 0 ? ((last.position - first.position) / elapsed) * 1000 : 0;
    },
    reset() { samples = []; },
  };
}

// Stretch along the motion, squash across it, and keep the area constant (volume conservation).
// `travel` is the usual distance of the move in px; it sets which speed counts as "fast".
export function stretchFromVelocity(velocity, travel, el) {
  const { response, stretch } = readTemperament(el);
  // The peak speed of a critically damped spring over `travel` is about 0.37 × omega × travel.
  const peak = 0.37 * ((2 * Math.PI) / response) * travel;
  const speed = Math.min(Math.abs(velocity) / peak, 1);
  const along = 1 + stretch * speed;
  return { along, across: 1 / along };
}
