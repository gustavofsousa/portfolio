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

  function navigate() {
    var hash = window.location.hash || '';

    /* Handle admin route */
    if (hash === '#admin') {
      showAdminLogin();
      return;
    }

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
    var mobileMenu = document.querySelector('.nav__mobile-menu');
    if (mobileMenu) mobileMenu.classList.remove('open');
  }

  window.addEventListener('hashchange', navigate);

  /* Initial route after content loads */
  window.addEventListener('DOMContentLoaded', function () {
    loadContent().then(function () {
      navigate();
      observeReveals();
    });
  });

  /* Mobile menu */
  document.addEventListener('click', function (e) {
    if (e.target.closest('.nav__hamburger')) {
      var menu = document.querySelector('.nav__mobile-menu');
      if (menu) menu.classList.add('open');
    }
    if (e.target.closest('.nav__mobile-close')) {
      var menu = document.querySelector('.nav__mobile-menu');
      if (menu) menu.classList.remove('open');
    }
    if (e.target.classList.contains('nav__link') && e.target.closest('.nav__mobile-menu')) {
      var menu = document.querySelector('.nav__mobile-menu');
      if (menu) menu.classList.remove('open');
    }
  });
})();
