/* ============================================
   THEME — Light/Dark mode toggle
   ============================================ */
(function () {
  const root = document.documentElement;
  const toggle = document.querySelector('[data-theme-toggle]');

  /* Detect system preference */
  let theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  root.setAttribute('data-theme', theme);
  updateToggleIcon();

  /* One switch: the theme attribute and the icon change together, inside one view transition. */
  function applyTheme() {
    root.setAttribute('data-theme', theme);
    updateToggleIcon();
    turnToggleIcon();
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      theme = theme === 'dark' ? 'light' : 'dark';

      var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!document.startViewTransition || reduced) {
        applyTheme();
        return;
      }

      /* A view transition snapshots the old page and the new page, so every surface changes at the
         same instant. The new page then grows as a circle from the toggle. Surface color transitions
         stop for the capture, or the snapshot would hold half-faded colors. */
      var box = toggle.getBoundingClientRect();
      var x = box.left + box.width / 2;
      var y = box.top + box.height / 2;
      var radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

      root.classList.add('theme-switching');
      var transition = document.startViewTransition(applyTheme);
      transition.ready.then(function () {
        root.animate(
          { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)'] },
          { duration: 650, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', pseudoElement: '::view-transition-new(root)' }
        );
      }).catch(function () {});
      transition.finished.finally(function () {
        root.classList.remove('theme-switching');
      });
    });
  }

  /* One-shot turn on the new icon. It follows a touch, so the elastic spring may overshoot. */
  function turnToggleIcon() {
    if (!toggle) return;
    var icon = toggle.querySelector('svg');
    if (!icon) return;
    icon.classList.remove('icon-turn');
    void icon.getBoundingClientRect();
    icon.classList.add('icon-turn');
  }

  function updateToggleIcon() {
    if (!toggle) return;
    const sunIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
    const moonIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    toggle.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
    toggle.setAttribute('aria-label', theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro');
  }
})();
