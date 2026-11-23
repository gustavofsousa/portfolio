/* ============================================
   JUICE — Motion that CSS cannot do alone
   Imports the interruptible spring of spring.js.
   ============================================ */
import { createSpring } from './spring.js';

/* --- Nav indicator ---
   One underline layer, clipped to the active link. Two springs drive its edges. The edge that leads
   runs at pace 0.8 and the edge that trails at pace 1.25, so the line stretches toward the new link
   and contracts when it arrives (DESIGN.md: the nav is a firm island, so there is no overshoot). */
(function navIndicator() {
  var list = document.querySelector('.nav__links');
  if (!list) return;

  var indicator = document.createElement('span');
  indicator.className = 'nav__indicator';
  indicator.setAttribute('aria-hidden', 'true');
  list.appendChild(indicator);
  list.classList.add('js-indicator');

  var render = function () {
    indicator.style.clipPath =
      'inset(0 ' + right.position + 'px 0 ' + left.position + 'px round 1px)';
  };
  var left = createSpring({ value: 0, el: list, onFrame: render });
  var right = createSpring({ value: 0, el: list, onFrame: render });
  var placed = false;

  function targets() {
    var active = list.querySelector('.nav__link--active');
    if (!active || !list.offsetWidth) return null;
    var box = list.getBoundingClientRect();
    var link = active.getBoundingClientRect();
    return { left: link.left - box.left, right: box.right - link.right };
  }

  function sync(immediate) {
    var to = targets();
    if (!to) return;
    if (!placed || immediate) {
      left.jump(to.left);
      right.jump(to.right);
      placed = true;
      return;
    }
    var movingRight = to.left > left.target;
    right.pace = movingRight ? 0.8 : 1.25;
    left.pace = movingRight ? 1.25 : 0.8;
    left.set(to.left);
    right.set(to.right);
  }

  document.addEventListener('navchange', function () { sync(false); });
  /* A language swap changes the link widths: place the line again without a trip. */
  document.addEventListener('langchange', function () { sync(true); });
  window.addEventListener('resize', function () { sync(true); });
  sync(true);
})();

/* --- Scroll state shared by the reading effects ---
   One passive scroll listener per frame. The reading effects below track the scroll 1:1: no spring
   sits between the reader's wheel and the part (ui-juice §5, drag and scroll). */
var scrollFeatures = [];
var lastY = window.scrollY;
var lastTime = performance.now();
var scrollFrame = 0;

function onScroll() {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(function () {
    scrollFrame = 0;
    var now = performance.now();
    var y = window.scrollY;
    var state = { y: y, dy: y - lastY, speed: (y - lastY) / Math.max(now - lastTime, 1) };
    lastY = y;
    lastTime = now;
    scrollFeatures.forEach(function (feature) { feature(state); });
  });
}

window.addEventListener('scroll', onScroll, { passive: true });
document.addEventListener('navchange', onScroll);
document.addEventListener('langchange', onScroll);
window.addEventListener('resize', onScroll);

var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* --- Reading progress ---
   A bar fills as the reader moves down the page. A glow rides its tip and grows with the scroll
   speed, then fades on a firm spring when the reader stops. */
(function readProgress() {
  var bar = document.createElement('div');
  bar.className = 'read-progress';
  bar.setAttribute('aria-hidden', 'true');
  /* The scroll is the reader's, not a touch on this part: the glow never overshoots. */
  bar.setAttribute('data-temperament', 'firm');
  var tip = document.createElement('div');
  tip.className = 'read-progress__tip';
  tip.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  document.body.appendChild(tip);

  var progress = 0;
  var glow = createSpring({
    value: 0,
    el: bar,
    onFrame: function (value) { tip.style.opacity = Math.max(value, 0).toFixed(3); }
  });
  var idle = 0;

  function paint() {
    bar.style.clipPath = 'inset(0 ' + ((1 - progress) * 100).toFixed(3) + '% 0 0)';
    tip.style.translate = (progress * window.innerWidth).toFixed(2) + 'px 0';
  }

  scrollFeatures.push(function (state) {
    var room = document.documentElement.scrollHeight - window.innerHeight;
    progress = room > 0 ? Math.min(Math.max(state.y / room, 0), 1) : 0;
    paint();
    if (reducedMotion.matches) return;
    glow.set(Math.min(Math.abs(state.speed) / 2.5, 1));
    clearTimeout(idle);
    idle = setTimeout(function () { glow.set(0); }, 120);
  });
  paint();
})();

/* --- Reading mode for the nav ---
   Scrolling down past the top hides the nav. Scrolling up, or reaching the top, brings it back. The
   nav stays when the menu is open or a control inside it has keyboard focus. A mouse click also
   focuses a control, so :focus-visible is the test, not :focus-within. */
(function navReadingMode() {
  var nav = document.querySelector('.nav');
  if (!nav) return;

  scrollFeatures.push(function (state) {
    if (reducedMotion.matches) return nav.classList.remove('nav--hidden');
    var menuOpen = document.querySelector('.nav__mobile-menu.open');
    if (menuOpen || nav.matches(':has(:focus-visible)') || state.y < 80 || state.dy < -4) {
      nav.classList.remove('nav--hidden');
    } else if (state.dy > 4 && state.y > 160) {
      nav.classList.add('nav--hidden');
    }
  });
})();

/* --- Depth while reading ---
   The hero recedes as the reader scrolls out of it, and the profile photo drifts slower than the
   text beside it. Both follow the scroll 1:1, written on the moving element itself. */
(function readingDepth() {
  var hero = document.getElementById('hero-content');
  var photo = document.querySelector('.about-photo');

  scrollFeatures.push(function (state) {
    var still = reducedMotion.matches;
    if (hero) {
      var gone = still ? 0 : Math.min(state.y / 520, 1);
      hero.style.translate = '0 ' + (-gone * 90).toFixed(1) + 'px';
      hero.style.opacity = (1 - gone * 0.65).toFixed(3);
    }
    if (photo) {
      photo.style.translate = still ? '' : '0 ' + (Math.min(state.y, 900) * 0.07).toFixed(1) + 'px';
    }
  });
})();

/* --- Now rail ---
   A line fills as the reader moves down the Now list. Each dot lands (squashes once) the first time
   it passes the reading line at 60% of the viewport. Scrolling back up un-reads it quietly. */
(function nowRail() {
  var wrap = document.querySelector('.now-wrap');
  var fill = document.querySelector('.now-rail__fill');
  var list = document.getElementById('now-list');
  if (!wrap || !fill || !list) return;

  var landed = [];

  scrollFeatures.push(function () {
    var box = wrap.getBoundingClientRect();
    if (!box.height || !wrap.offsetParent) return;
    var line = window.innerHeight * 0.6;
    var done = Math.min(Math.max((line - box.top) / box.height, 0), 1);
    fill.style.scale = '1 ' + done.toFixed(4);
    list.querySelectorAll('.now-item').forEach(function (item, index) {
      var passed = item.getBoundingClientRect().top < line;
      item.classList.toggle('is-read', passed);
      /* The landing plays the first time a dot is read, by position, so a language swap that rebuilds
         the list does not replay it either. */
      if (passed && !landed[index]) {
        landed[index] = true;
        item.classList.add('land');
      }
    });
  });
})();
