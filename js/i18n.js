/* ============================================
   I18N — Language switcher (PT / EN)
   ============================================ */
let currentLang = 'pt';
let contentData = null;

async function loadContent() {
  const resp = await fetch('./data/content.json');
  contentData = await resp.json();
  renderAll();
}

function toggleLanguage() {
  currentLang = currentLang === 'pt' ? 'en' : 'pt';
  const btn = document.querySelector('[data-lang-toggle]');
  if (btn) {
    btn.textContent = currentLang === 'pt' ? 'EN' : 'PT';
    /* One answer to the touch, by transition: the button rises to 1.08 and its spring brings it back.
       A second tap mid-bump retargets from the current scale, so nothing restarts. */
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      btn.style.scale = '1.08';
      clearTimeout(btn._bumpTimer);
      btn._bumpTimer = setTimeout(function () { btn.style.scale = ''; }, 90);
    }
  }
  renderAll();
  keepRevealedBlocksVisible();
  document.dispatchEvent(new Event('langchange'));
}

/* A language swap rebuilds the DOM. Blocks that were on screen or above it stay in place, with no
   second entrance. Blocks below the fold still reveal when the reader scrolls to them. */
function keepRevealedBlocksVisible() {
  document.querySelectorAll('.reveal:not(.visible)').forEach(function (el) {
    if (el.getBoundingClientRect().top >= window.innerHeight) return;
    el.style.transition = 'none';
    el.classList.add('visible');
    void el.offsetWidth;
    el.style.transition = '';
  });
}

function t(path) {
  if (!contentData) return '';
  const keys = path.split('.');
  let val = contentData[currentLang];
  for (const k of keys) {
    if (val === undefined) return '';
    val = val[k];
  }
  return val;
}

function renderAll() {
  if (!contentData) return;
  renderNav();
  renderHero();
  renderHomeProjects();
  renderNow();
  renderHomeBlog();
  renderProjectsPage();
  renderBlogPage();
  renderAboutPage();
  renderAboutClosing();
  renderFooter();
}

/* --- Navigation --- */
function renderNav() {
  document.querySelectorAll('[data-nav]').forEach(function (el) {
    const key = el.getAttribute('data-nav');
    el.textContent = t('nav.' + key);
  });
  renderMenuLabels();
}

/* The hamburger names its state and the menu names itself, in the current language. */
function renderMenuLabels() {
  const button = document.querySelector('.nav__hamburger');
  const menu = document.querySelector('.nav__mobile-menu');
  if (!button || !menu || !contentData) return;
  const open = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-label', t(open ? 'nav.closeMenu' : 'nav.openMenu'));
  menu.setAttribute('aria-label', t('nav.menuLabel'));
}

/* --- Hero --- */
function renderHero() {
  const hero = document.getElementById('hero-content');
  if (!hero) return;
  const h = t('hero');
  hero.querySelector('.hero__heading').innerHTML =
    h.tagline + '<br><span class="hero__highlight">' + h.highlight + '</span>';
  hero.querySelector('.hero__description').textContent = h.description;
}

/* --- Project card parts (status badge, visibility, metric) --- */
function statusBadge(p) {
  if (!p.status) return '';
  return '<span class="status status--' + p.status + '">' + t('projects.status.' + p.status) + '</span>';
}

function visibilityChip(p) {
  if (!p.visibility) return '';
  return '<span class="visibility visibility--' + p.visibility + '">' + t('projects.visibility.' + p.visibility) + '</span>';
}

function metricLine(p) {
  return p.metric ? '<p class="project-metric">' + p.metric + '</p>' : '';
}

/* --- Home Projects (preview) --- */
function renderHomeProjects() {
  const container = document.getElementById('home-projects-grid');
  if (!container) return;
  const data = t('projects.items');

  container.innerHTML = data.slice(0, 4).map(function (p) {
    return '<div class="home-project-card reveal">' +
      '<div class="project-head">' +
        '<h3 class="home-project-card__title">' + p.title + '</h3>' +
        statusBadge(p) +
      '</div>' +
      '<p class="home-project-card__description">' + p.description + '</p>' +
      metricLine(p) +
      '<div class="home-project-card__tags">' +
        p.tags.map(function (tag) { return '<span class="tag">' + tag + '</span>'; }).join('') +
      '</div>' +
    '</div>';
  }).join('');

  observeReveals();
}

/* --- Now log --- */
function renderNow() {
  const container = document.getElementById('now-list');
  if (!container) return;
  const now = t('now');
  if (!now || !now.items) return;

  const title = document.getElementById('now-title');
  const sub = document.getElementById('now-subtitle');
  if (title) title.textContent = now.title;
  if (sub) sub.textContent = now.subtitle;

  container.innerHTML = now.items.map(function (n) {
    return '<li class="now-item reveal">' +
      '<time class="now-item__date" datetime="' + n.date + '">' + formatMonth(n.date) + '</time>' +
      '<span class="now-item__text">' + n.text + '</span>' +
    '</li>';
  }).join('');

  observeReveals();
}

/* --- Home Blog (preview) --- */
function renderHomeBlog() {
  const container = document.getElementById('home-blog-grid');
  if (!container) return;
  const posts = t('blog.posts');

  container.innerHTML = posts.slice(0, 3).map(function (p) {
    return '<article class="blog-card reveal">' +
      '<div class="blog-card__meta">' +
        '<span class="tag--category">' + p.category + '</span>' +
        '<span class="blog-card__date">' + formatDate(p.date) + '</span>' +
        '<span class="blog-card__readtime">' + p.readTime + '</span>' +
      '</div>' +
      '<h3 class="blog-card__title">' + p.title + '</h3>' +
      '<p class="blog-card__excerpt">' + p.excerpt + '</p>' +
    '</article>';
  }).join('');

  observeReveals();
}

/* --- Projects Page --- */
function renderProjectsPage() {
  const container = document.getElementById('projects-grid');
  if (!container) return;
  const data = t('projects.items');
  const viewText = t('projects.viewProject');

  const projTitle = document.getElementById('projects-page-title');
  const projSub = document.getElementById('projects-page-subtitle');
  if (projTitle) projTitle.textContent = t('projects.title');
  if (projSub) projSub.textContent = t('projects.subtitle');

  const legend = document.getElementById('projects-legend');
  if (legend) {
    const labels = t('projects.status');
    legend.innerHTML = '<span class="legend__label">' + t('projects.legend') + '</span>' +
      ['usable', 'building', 'spec'].map(function (s) {
        return '<span class="status status--' + s + '">' + labels[s] + '</span>';
      }).join('');
  }

  container.innerHTML = data.map(function (p) {
    const hasLink = p.link && p.link !== '#';
    return '<div class="project-card reveal">' +
      '<div class="project-head">' +
        '<h3 class="project-card__title">' + p.title + '</h3>' +
        statusBadge(p) +
      '</div>' +
      '<p class="project-card__description">' + p.description + '</p>' +
      metricLine(p) +
      '<div class="project-card__tags">' +
        p.tags.map(function (tag) { return '<span class="tag">' + tag + '</span>'; }).join('') +
      '</div>' +
      '<div class="project-card__footer">' +
        visibilityChip(p) +
        (hasLink ?
          '<a href="' + p.link + '" class="project-card__link" target="_blank" rel="noopener noreferrer">' +
            viewText +
            ' <svg class="btn__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
          '</a>' : '') +
      '</div>' +
    '</div>';
  }).join('');

  observeReveals();
}

/* --- Blog Page --- */
function renderBlogPage() {
  const featured = document.getElementById('blog-featured');
  const grid = document.getElementById('blog-grid');
  if (!featured || !grid) return;

  const posts = t('blog.posts');
  const blogTitle = document.getElementById('blog-page-title');
  const blogSub = document.getElementById('blog-page-subtitle');
  if (blogTitle) blogTitle.textContent = t('blog.title');
  if (blogSub) blogSub.textContent = t('blog.subtitle');

  if (posts.length > 0) {
    const fp = posts[0];
    featured.innerHTML =
      '<div class="blog-featured__image"><div class="blog-featured__image-inner">' + fp.category + '</div></div>' +
      '<div class="blog-featured__content">' +
        '<div class="blog-featured__meta">' +
          '<span class="tag--category">' + fp.category + '</span>' +
          '<span class="blog-featured__date">' + formatDate(fp.date) + '</span>' +
        '</div>' +
        '<h2 class="blog-featured__title">' + fp.title + '</h2>' +
        '<p class="blog-featured__excerpt">' + fp.excerpt + '</p>' +
      '</div>';
  }

  grid.innerHTML = posts.slice(1).map(function (p) {
    return '<article class="blog-card reveal">' +
      '<div class="blog-card__meta">' +
        '<span class="tag--category">' + p.category + '</span>' +
        '<span class="blog-card__date">' + formatDate(p.date) + '</span>' +
        '<span class="blog-card__readtime">' + p.readTime + '</span>' +
      '</div>' +
      '<h3 class="blog-card__title">' + p.title + '</h3>' +
      '<p class="blog-card__excerpt">' + p.excerpt + '</p>' +
    '</article>';
  }).join('');

  observeReveals();
}

/* --- About Page --- */
function renderAboutPage() {
  const storyContainer = document.getElementById('about-story');
  if (!storyContainer) return;

  const about = t('about');

  /* Story title */
  const storyTitle = document.getElementById('about-story-title');
  if (storyTitle) storyTitle.textContent = about.story.title;

  /* Story paragraphs */
  storyContainer.innerHTML = about.story.paragraphs.map(function (p) {
    return '<p class="about-story__text">' + p + '</p>';
  }).join('');

  /* Value Proposition */
  const vpContainer = document.getElementById('about-value-prop');
  if (vpContainer && about.valueProposition) {
    const vpTitle = document.getElementById('about-vp-title');
    if (vpTitle) vpTitle.textContent = about.valueProposition.title;
    vpContainer.innerHTML = '<p class="about-story__text">' + about.valueProposition.text + '</p>';
  }

  /* Principles / What drives me */
  const principlesContainer = document.getElementById('about-principles');
  if (principlesContainer && about.principles) {
    const prTitle = document.getElementById('about-principles-title');
    if (prTitle) prTitle.textContent = about.principles.title;
    principlesContainer.innerHTML = about.principles.items.map(function (p) {
      var iconSvg = '';
      if (p.icon === 'impact') iconSvg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>';
      else if (p.icon === 'autonomy') iconSvg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
      else if (p.icon === 'purpose') iconSvg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 12l-4-4-4 4M12 16V8"/></svg>';
      return '<div class="principle-card">' +
        '<div class="principle-card__icon">' + iconSvg + '</div>' +
        '<h4 class="principle-card__name">' + p.name + '</h4>' +
        '<p class="principle-card__desc">' + p.description + '</p>' +
      '</div>';
    }).join('');
  }

  /* Skills (categorized) */
  const skillsContainer = document.getElementById('about-skills');
  if (skillsContainer && about.skills) {
    const skillsTitle = document.getElementById('about-skills-title');
    if (skillsTitle) skillsTitle.textContent = about.skills.title;
    if (about.skills.categories) {
      skillsContainer.innerHTML = about.skills.categories.map(function (cat) {
        return '<div class="skills-category">' +
          '<span class="skills-category__label">' + cat.label + '</span>' +
          '<div class="skills-grid">' +
            cat.items.map(function (s) { return '<span class="tag">' + s + '</span>'; }).join('') +
          '</div>' +
        '</div>';
      }).join('');
    } else if (about.skills.items) {
      skillsContainer.innerHTML = '<div class="skills-grid">' +
        about.skills.items.map(function (s) { return '<span class="tag">' + s + '</span>'; }).join('') +
      '</div>';
    }
  }

  /* Education */
  const eduContainer = document.getElementById('about-education');
  if (eduContainer && about.education) {
    const eduTitle = document.getElementById('about-edu-title');
    if (eduTitle) eduTitle.textContent = about.education.title;
    eduContainer.innerHTML = about.education.items.map(function (e) {
      const name = e.link
        ? '<a href="' + e.link + '" target="_blank" rel="noopener noreferrer">' + e.name + '</a>'
        : e.name;
      return '<li class="education-item">' +
        '<span class="education-item__name">' + name + '</span>' +
        '<span class="education-item__detail">' + e.detail + '</span>' +
        '<span class="education-item__period">' + e.period + '</span>' +
      '</li>';
    }).join('');
  }
}

/* --- About: beyond code + open to --- */
function renderAboutClosing() {
  const about = t('about');
  const list = document.getElementById('about-beyond');
  if (!list || !about.beyond) return;

  document.getElementById('about-beyond-title').textContent = about.beyond.title;
  list.innerHTML = about.beyond.items.map(function (item) {
    return '<li>' + item + '</li>';
  }).join('');

  document.getElementById('about-open-title').textContent = about.openTo.title;
  document.getElementById('about-open-text').textContent = about.openTo.text;
}

/* --- Footer --- */
function renderFooter() {
  const copy = document.getElementById('footer-copy');
  if (copy) copy.textContent = t('footer.copyright');
}

/* --- Helpers --- */
function formatMonth(monthStr) {
  const parts = monthStr.split('-');
  const names = currentLang === 'pt'
    ? ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return names[parseInt(parts[1], 10) - 1] + ' ' + parts[0];
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return day + '/' + month + '/' + year;
}

function observeReveals() {
  var reveals = document.querySelectorAll('.reveal:not(.observed)');
  if (!('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('visible'); });
    return;
  }
  var observer = new IntersectionObserver(function (entries) {
    /* Blocks that enter in the same frame arrive one after another, 55 ms apart. */
    var entering = entries.filter(function (entry) { return entry.isIntersecting; });
    entering.forEach(function (entry, index) {
      entry.target.style.setProperty('--stagger', Math.min(index, 5) * 55 + 'ms');
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1 });

  reveals.forEach(function (el) {
    el.classList.add('observed');
    observer.observe(el);
  });
}

/* Expose globally */
window.toggleLanguage = toggleLanguage;
window.t = t;
window.currentLang = function () { return currentLang; };
window.renderAll = renderAll;
window.renderMenuLabels = renderMenuLabels;
window.loadContent = loadContent;
window.contentData = function () { return contentData; };
