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
  if (btn) btn.textContent = currentLang === 'pt' ? 'EN' : 'PT';
  renderAll();
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
  renderHomeBlog();
  renderProjectsPage();
  renderBlogPage();
  renderAboutPage();
  renderFooter();

  /* Re-check admin mode */
  if (window.adminMode) {
    document.body.classList.add('admin-mode');
  }
}

/* --- Navigation --- */
function renderNav() {
  document.querySelectorAll('[data-nav]').forEach(function (el) {
    const key = el.getAttribute('data-nav');
    el.textContent = t('nav.' + key);
  });
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

/* --- Home Projects (preview) --- */
function renderHomeProjects() {
  const container = document.getElementById('home-projects-grid');
  if (!container) return;
  const data = getEditableProjects();
  const viewText = t('projects.viewProject');

  container.innerHTML = data.slice(0, 4).map(function (p) {
    return '<div class="home-project-card reveal editable" data-edit-type="project" data-edit-id="' + p.id + '">' +
      '<h3 class="home-project-card__title">' + p.title + '</h3>' +
      '<p class="home-project-card__description">' + p.description + '</p>' +
      '<div class="home-project-card__tags">' +
        p.tags.map(function (tag) { return '<span class="tag">' + tag + '</span>'; }).join('') +
      '</div>' +
    '</div>';
  }).join('');

  observeReveals();
}

/* --- Home Blog (preview) --- */
function renderHomeBlog() {
  const container = document.getElementById('home-blog-grid');
  if (!container) return;
  const posts = getEditablePosts();

  container.innerHTML = posts.slice(0, 3).map(function (p) {
    return '<article class="blog-card reveal editable" data-edit-type="post" data-edit-id="' + p.id + '">' +
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
  const data = getEditableProjects();
  const viewText = t('projects.viewProject');

  const projTitle = document.getElementById('projects-page-title');
  const projSub = document.getElementById('projects-page-subtitle');
  if (projTitle) projTitle.textContent = t('projects.title');
  if (projSub) projSub.textContent = t('projects.subtitle');

  container.innerHTML = data.map(function (p) {
    return '<div class="project-card reveal editable" data-edit-type="project" data-edit-id="' + p.id + '">' +
      '<div class="project-card__image"><div class="project-card__image-inner">' + p.title.split(' ')[0] + '</div></div>' +
      '<div class="project-card__info">' +
        '<h3 class="project-card__title">' + p.title + '</h3>' +
        '<p class="project-card__description">' + p.description + '</p>' +
        '<div class="project-card__tags">' +
          p.tags.map(function (tag) { return '<span class="tag">' + tag + '</span>'; }).join('') +
        '</div>' +
        (p.link && p.link !== '#' ?
          '<a href="' + p.link + '" class="btn btn--accent project-card__link" target="_blank" rel="noopener noreferrer">' +
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

  const posts = getEditablePosts();
  const blogTitle = document.getElementById('blog-page-title');
  const blogSub = document.getElementById('blog-page-subtitle');
  if (blogTitle) blogTitle.textContent = t('blog.title');
  if (blogSub) blogSub.textContent = t('blog.subtitle');

  if (posts.length > 0) {
    const fp = posts[0];
    featured.innerHTML =
      '<div class="blog-featured__image"><div class="blog-featured__image-inner">' + fp.category + '</div></div>' +
      '<div class="blog-featured__content editable" data-edit-type="post" data-edit-id="' + fp.id + '">' +
        '<div class="blog-featured__meta">' +
          '<span class="tag--category">' + fp.category + '</span>' +
          '<span class="blog-featured__date">' + formatDate(fp.date) + '</span>' +
        '</div>' +
        '<h2 class="blog-featured__title">' + fp.title + '</h2>' +
        '<p class="blog-featured__excerpt">' + fp.excerpt + '</p>' +
      '</div>';
  }

  grid.innerHTML = posts.slice(1).map(function (p) {
    return '<article class="blog-card reveal editable" data-edit-type="post" data-edit-id="' + p.id + '">' +
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
      return '<li class="education-item">' +
        '<span class="education-item__name">' + e.name + '</span>' +
        '<span class="education-item__detail">' + e.detail + '</span>' +
        '<span class="education-item__period">' + e.period + '</span>' +
      '</li>';
    }).join('');
  }
}

/* --- Footer --- */
function renderFooter() {
  const copy = document.getElementById('footer-copy');
  if (copy) copy.textContent = t('footer.copyright');
}

/* --- Helpers --- */
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
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
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
window.loadContent = loadContent;
window.contentData = function () { return contentData; };
