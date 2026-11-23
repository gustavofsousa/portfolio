/* ============================================
   ROUTER — Hash-based SPA navigation
   ============================================ */
(function () {
  var pages = {
    '': 'page-home',
    '#home': 'page-home',
    '#projects': 'page-projects',
    '#blog': 'page-blog',
    '#about': 'page-about'
  };

  var routed = false;

  function navigate() {
    var hash = window.location.hash || '';

    /* Hide all pages */
    document.querySelectorAll('.page').forEach(function (p) {
      p.classList.remove('page--active');
    });

    /* Show target page */
    var targetId = pages[hash] || pages[''];
    var target = document.getElementById(targetId);
    if (target) {
      target.classList.add('page--active');
    }

    /* Update active nav link */
    document.querySelectorAll('.nav__link').forEach(function (link) {
      link.classList.remove('nav__link--active');
      var href = link.getAttribute('href');
      if (href === hash || (hash === '' && href === '#home')) {
        link.classList.add('nav__link--active');
      }
    });

    /* Scroll to top */
    window.scrollTo({ top: 0, behavior: 'instant' });

    /* Close mobile menu if open */
    setMenuOpen(false);

    /* A route change moves focus to the new page heading, so a screen reader does not stay on the nav.
       The first load keeps the browser's own focus. */
    if (routed && target) {
      var heading = target.querySelector('h1');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    }
    routed = true;

    document.dispatchEvent(new Event('navchange'));
  }

  window.addEventListener('hashchange', navigate);

  /* Initial route after content loads */
  window.addEventListener('DOMContentLoaded', function () {
    loadContent().then(function () {
      navigate();
      observeReveals();
    });
  });

  /* Mobile menu: the hamburger toggles it and shows its state as an X. */
  function setMenuOpen(open) {
    var menu = document.querySelector('.nav__mobile-menu');
    var button = document.querySelector('.nav__hamburger');
    var focusWasInside = menu && menu.contains(document.activeElement);
    if (menu) menu.classList.toggle('open', open);
    if (button) {
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    if (window.renderMenuLabels) window.renderMenuLabels();
    /* The open menu is modal: the page behind it leaves the focus order and the reading order. */
    document.querySelectorAll('main, footer').forEach(function (el) { el.inert = open; });
    if (open) {
      var first = menu && menu.querySelector('.nav__link');
      if (first) first.focus({ preventScroll: true });
    } else if (focusWasInside && button) {
      button.focus({ preventScroll: true });
    }
  }

  document.addEventListener('keydown', function (e) {
    var menu = document.querySelector('.nav__mobile-menu');
    if (e.key === 'Escape' && menu && menu.classList.contains('open')) setMenuOpen(false);
  });

  document.addEventListener('click', function (e) {
    if (e.target.closest('.nav__hamburger')) {
      var menu = document.querySelector('.nav__mobile-menu');
      setMenuOpen(!(menu && menu.classList.contains('open')));
    }
    if (e.target.classList.contains('nav__link') && e.target.closest('.nav__mobile-menu')) {
      setMenuOpen(false);
    }
  });
})();
