/* ============================================
   ADMIN — Hidden CMS Panel
   Access via #admin in URL
   Data persisted in-memory (edits last per session)
   ============================================ */

window.adminMode = false;

/* Editable data overrides (in-memory) */
var editedProjects = null;
var editedPosts = null;

/* Admin password (change this) */
var ADMIN_PASS = 'gfs2026admin';

/* --- Get editable data (with overrides) --- */
function getEditableProjects() {
  if (editedProjects) return editedProjects;
  var data = window.contentData();
  if (!data) return [];
  var lang = window.currentLang();
  return JSON.parse(JSON.stringify(data[lang].projects.items));
}

function getEditablePosts() {
  if (editedPosts) return editedPosts;
  var data = window.contentData();
  if (!data) return [];
  var lang = window.currentLang();
  return JSON.parse(JSON.stringify(data[lang].blog.posts));
}

/* Expose globally for i18n.js */
window.getEditableProjects = getEditableProjects;
window.getEditablePosts = getEditablePosts;

/* --- Show Admin Login --- */
function showAdminLogin() {
  if (window.adminMode) {
    enableAdminMode();
    window.location.hash = '#home';
    return;
  }
  var overlay = document.getElementById('admin-login-overlay');
  if (overlay) overlay.classList.add('active');
}

window.showAdminLogin = showAdminLogin;

/* --- Login --- */
document.addEventListener('click', function (e) {
  /* Login button */
  if (e.target.closest('#admin-login-btn')) {
    var input = document.getElementById('admin-password');
    var errorEl = document.getElementById('admin-login-error');
    if (input && input.value === ADMIN_PASS) {
      window.adminMode = true;
      document.getElementById('admin-login-overlay').classList.remove('active');
      input.value = '';
      if (errorEl) errorEl.style.display = 'none';
      enableAdminMode();
      window.location.hash = '#home';
    } else {
      if (errorEl) {
        errorEl.textContent = 'Senha incorreta';
        errorEl.style.display = 'block';
      }
    }
    return;
  }

  /* Cancel login */
  if (e.target.closest('#admin-login-cancel')) {
    var overlay = document.getElementById('admin-login-overlay');
    if (overlay) overlay.classList.remove('active');
    window.location.hash = '#home';
    return;
  }

  /* Logout */
  if (e.target.closest('#admin-logout')) {
    window.adminMode = false;
    document.body.classList.remove('admin-mode');
    document.querySelector('.admin-bar').classList.remove('active');
    editedProjects = null;
    editedPosts = null;
    renderAll();
    return;
  }

  /* Add Project */
  if (e.target.closest('#admin-add-project')) {
    openEditModal('project', null);
    return;
  }

  /* Add Post */
  if (e.target.closest('#admin-add-post')) {
    openEditModal('post', null);
    return;
  }

  /* Click on editable element */
  if (window.adminMode && e.target.closest('.editable')) {
    var el = e.target.closest('.editable');
    var type = el.getAttribute('data-edit-type');
    var id = el.getAttribute('data-edit-id');
    if (type && id) {
      openEditModal(type, id);
    }
    return;
  }

  /* Save from modal */
  if (e.target.closest('#edit-modal-save')) {
    saveEditModal();
    return;
  }

  /* Cancel modal */
  if (e.target.closest('#edit-modal-cancel')) {
    closeEditModal();
    return;
  }

  /* Delete from modal */
  if (e.target.closest('#edit-modal-delete')) {
    deleteFromModal();
    return;
  }
});

/* Enter key on password */
document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && e.target.id === 'admin-password') {
    document.getElementById('admin-login-btn').click();
  }
});

/* --- Enable Admin Mode UI --- */
function enableAdminMode() {
  document.body.classList.add('admin-mode');
  var bar = document.querySelector('.admin-bar');
  if (bar) bar.classList.add('active');
  renderAll();
}

/* --- Edit Modal --- */
var currentEditType = null;
var currentEditId = null;

function openEditModal(type, id) {
  currentEditType = type;
  currentEditId = id;

  var overlay = document.getElementById('edit-modal-overlay');
  var modal = document.getElementById('edit-modal');
  var deleteBtn = document.getElementById('edit-modal-delete');

  if (!overlay || !modal) return;

  var fieldsHtml = '';

  if (type === 'project') {
    var item = id ? getEditableProjects().find(function (p) { return p.id === id; }) : null;
    modal.querySelector('h3').textContent = id ? 'Editar Projeto' : 'Novo Projeto';
    fieldsHtml =
      '<label>Título<input type="text" id="edit-field-title" value="' + esc(item ? item.title : '') + '"></label>' +
      '<label>Descrição<textarea id="edit-field-description">' + esc(item ? item.description : '') + '</textarea></label>' +
      '<label>Tags (separadas por vírgula)<input type="text" id="edit-field-tags" value="' + esc(item ? item.tags.join(', ') : '') + '"></label>' +
      '<label>Link<input type="url" id="edit-field-link" value="' + esc(item ? item.link : '') + '"></label>';
  } else if (type === 'post') {
    var item = id ? getEditablePosts().find(function (p) { return p.id === id; }) : null;
    modal.querySelector('h3').textContent = id ? 'Editar Post' : 'Novo Post';
    fieldsHtml =
      '<label>Título<input type="text" id="edit-field-title" value="' + esc(item ? item.title : '') + '"></label>' +
      '<label>Resumo<textarea id="edit-field-excerpt">' + esc(item ? item.excerpt : '') + '</textarea></label>' +
      '<label>Categoria<input type="text" id="edit-field-category" value="' + esc(item ? item.category : '') + '"></label>' +
      '<label>Data<input type="date" id="edit-field-date" value="' + esc(item ? item.date : new Date().toISOString().split('T')[0]) + '"></label>' +
      '<label>Tempo de leitura<input type="text" id="edit-field-readtime" value="' + esc(item ? item.readTime : '5 min') + '"></label>';
  }

  document.getElementById('edit-fields').innerHTML = fieldsHtml;
  if (deleteBtn) deleteBtn.style.display = id ? 'block' : 'none';
  overlay.classList.add('active');
}

function closeEditModal() {
  document.getElementById('edit-modal-overlay').classList.remove('active');
  currentEditType = null;
  currentEditId = null;
}

function saveEditModal() {
  if (currentEditType === 'project') {
    var projects = getEditableProjects();
    var data = {
      id: currentEditId || 'proj-' + Date.now(),
      title: document.getElementById('edit-field-title').value,
      description: document.getElementById('edit-field-description').value,
      tags: document.getElementById('edit-field-tags').value.split(',').map(function (s) { return s.trim(); }).filter(Boolean),
      link: document.getElementById('edit-field-link').value || '#',
      featured: false
    };

    if (currentEditId) {
      var idx = projects.findIndex(function (p) { return p.id === currentEditId; });
      if (idx >= 0) {
        data.featured = projects[idx].featured;
        projects[idx] = data;
      }
    } else {
      projects.push(data);
    }
    editedProjects = projects;
  } else if (currentEditType === 'post') {
    var posts = getEditablePosts();
    var data = {
      id: currentEditId || 'post-' + Date.now(),
      title: document.getElementById('edit-field-title').value,
      excerpt: document.getElementById('edit-field-excerpt').value,
      category: document.getElementById('edit-field-category').value,
      date: document.getElementById('edit-field-date').value,
      readTime: document.getElementById('edit-field-readtime').value
    };

    if (currentEditId) {
      var idx = posts.findIndex(function (p) { return p.id === currentEditId; });
      if (idx >= 0) posts[idx] = data;
    } else {
      posts.unshift(data);
    }
    editedPosts = posts;
  }

  closeEditModal();
  renderAll();
}

function deleteFromModal() {
  if (!currentEditId) return;
  if (!confirm('Tem certeza que deseja excluir?')) return;

  if (currentEditType === 'project') {
    var projects = getEditableProjects().filter(function (p) { return p.id !== currentEditId; });
    editedProjects = projects;
  } else if (currentEditType === 'post') {
    var posts = getEditablePosts().filter(function (p) { return p.id !== currentEditId; });
    editedPosts = posts;
  }

  closeEditModal();
  renderAll();
}

function esc(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* --- Export data (admin can copy JSON to update content.json) --- */
document.addEventListener('click', function (e) {
  if (e.target.closest('#admin-export')) {
    var data = {
      projects: getEditableProjects(),
      posts: getEditablePosts()
    };
    var json = JSON.stringify(data, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'content-export.json';
    a.click();
    URL.revokeObjectURL(url);
  }
});
