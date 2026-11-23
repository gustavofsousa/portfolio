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
