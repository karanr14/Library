const BIN_ID = '6a8bb04dda38895dfe08ba02';
const MASTER_KEY = '$2a$10$3Tx1t295CzrJr3eLHaPZm.qIZg5hxysCL11Qepzj4F4eGl7x3PWie';
const API_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

let links = [];
let selectedCategory = 'all';
let toastTimer = null;
let isListView = false;
let themeClickCount = 0;
let themeClickTimer = null;

const viewLibrary = document.getElementById('view-library');
const viewAdd = document.getElementById('view-add');
const grid = document.getElementById('grid');
const tally = document.getElementById('tally');
const searchInput = document.getElementById('search-input');
const openAddBtn = document.getElementById('open-add-btn');
const cancelAddBtn = document.getElementById('cancel-add-btn');
const cancelFormBtn = document.getElementById('cancel-form-btn');
const form = document.getElementById('intake-form');
const formTitle = document.getElementById('form-title');
const editIdInput = document.getElementById('edit-id');
const nameInput = document.getElementById('name-input');
const categorySelect = document.getElementById('category-select');
const urlInput = document.getElementById('url-input');
const submitBtn = document.getElementById('submit-btn');
const toastEl = document.getElementById('toast');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importInput = document.getElementById('import-input');
const toggleViewBtn = document.getElementById('toggle-view-btn');
const viewIconGrid = document.getElementById('view-icon-grid');
const viewIconList = document.getElementById('view-icon-list');
const viewText = document.getElementById('view-text');
const themeBtn = document.getElementById('theme-btn');
const themeIconMoon = document.getElementById('theme-icon-moon');
const themeIconSun = document.getElementById('theme-icon-sun');
const themeText = document.getElementById('theme-text');

function pad(n){ return String(n).padStart(2, '0'); }

function hostnameOf(url){
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch(e){ return 'external link'; }
}

function showToast(msg){
  toastEl.textContent = msg;
  toastEl.hidden = false;
  if(toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, 3000);
}

// 10-Click Easter Egg to toggle Admin Mode
themeBtn.addEventListener('click', () => {
  themeClickCount++;
  
  if (themeClickTimer) clearTimeout(themeClickTimer);

  if (themeClickCount >= 10) {
    themeClickCount = 0;
    const isAdmin = document.body.classList.toggle('admin-mode');

    if (isAdmin) {
      document.documentElement.setAttribute('data-theme', 'admin');
      themeIconMoon.style.display = 'block';
      themeIconSun.style.display = 'none';
      themeText.textContent = 'Admin';
      showToast('Admin mode activated!');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeIconMoon.style.display = 'block';
      themeIconSun.style.display = 'none';
      themeText.textContent = 'Dark';
      showToast('Admin mode deactivated');
    }
    return;
  }

  themeClickTimer = setTimeout(() => {
    themeClickCount = 0;
  }, 3000);

  // Normal Theme switch
  const currentTheme = document.documentElement.getAttribute('data-theme');
  if (currentTheme === 'admin') return;

  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  themeIconMoon.style.display = newTheme === 'dark' ? 'block' : 'none';
  themeIconSun.style.display = newTheme === 'light' ? 'block' : 'none';
  themeText.textContent = newTheme === 'dark' ? 'Dark' : 'Light';
});

// Filter selection
document.querySelectorAll('.sticky-controls .bubble-btn[data-cat]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.sticky-controls .bubble-btn[data-cat]').forEach(b => b.classList.remove('active-filter'));
    e.target.classList.add('active-filter');
    selectedCategory = e.target.getAttribute('data-cat');
    render();
  });
});

function switchView(target, isEdit = false){
  if(target === 'add'){
    if(!isEdit) {
      formTitle.textContent = 'Log New Package';
      editIdInput.value = '';
      form.reset();
    }
    viewLibrary.classList.remove('active');
    viewAdd.classList.add('active');
    nameInput.focus();
  } else {
    viewAdd.classList.remove('active');
    viewLibrary.classList.add('active');
  }
}

toggleViewBtn.addEventListener('click', () => {
  isListView = !isListView;
  grid.className = isListView ? 'list-layout' : 'grid-layout';
  viewIconGrid.style.display = isListView ? 'none' : 'block';
  viewIconList.style.display = isListView ? 'block' : 'none';
  viewText.textContent = isListView ? 'Grid' : 'List';
});

async function persist(){
  try {
    showToast('Syncing to cloud...');
    const response = await fetch(API_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': MASTER_KEY
      },
      body: JSON.stringify(links)
    });
    if (!response.ok) throw new Error('Cloud save failed');
  } catch(e){
    console.error('Save failed', e);
    showToast('Cloud sync failed');
  }
}

async function loadLinks(){
  try {
    const response = await fetch(`${API_URL}/latest`, {
      headers: { 'X-Master-Key': MASTER_KEY }
    });
    if (response.ok) {
      const data = await response.json();
      links = Array.isArray(data.record) ? data.record : [];
      render();
      return;
    }
  } catch(e){
    console.error('Fetch failed', e);
  }
  
  links = [];
  render();
}

function render(){
  const query = searchInput.value.trim().toLowerCase();
  const filtered = links.filter(l => {
    const matchesQuery = l.name.toLowerCase().includes(query) || l.url.toLowerCase().includes(query);
    const matchesCat = selectedCategory === 'all' || (l.category || 'apps') === selectedCategory;
    return matchesQuery && matchesCat;
  });

  tally.textContent = pad(links.length) + ' LOGGED';
  grid.innerHTML = '';

  if(filtered.length === 0){
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.innerHTML = query || selectedCategory !== 'all' ? 'No matching packages found.' : 'Your library is empty.';
    grid.appendChild(empty);
    return;
  }

  filtered.forEach((link) => {
    const card = document.createElement('article');
    card.className = 'card';

    const catBadge = document.createElement('span');
    catBadge.className = 'category-badge';
    catBadge.textContent = link.category || 'apps';

    // Edit / Delete Container
    const actions = document.createElement('div');
    actions.className = 'card-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'action-btn';
    editBtn.title = 'Edit ' + link.name;
    editBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'action-btn';
    removeBtn.title = 'Remove ' + link.name;
    removeBtn.textContent = '×';

    actions.appendChild(editBtn);
    actions.appendChild(removeBtn);

    const body = document.createElement('div');
    body.className = 'body';
    const nameEl = document.createElement('h2');
    nameEl.className = 'name';
    nameEl.textContent = link.name;
    const metaEl = document.createElement('div');
    metaEl.className = 'meta';
    metaEl.textContent = hostnameOf(link.url);
    body.appendChild(nameEl);
    body.appendChild(metaEl);

    const btnGroup = document.createElement('div');
    btnGroup.className = 'bottom-btn-group';

    const dl = document.createElement('button');
    dl.type = 'button';
    dl.className = 'download-btn';
    dl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/></svg><span>Download</span>';

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'copy-btn';
    copyBtn.title = 'Copy Download Link';
    copyBtn.innerHTML = '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="1" ry="1"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';

    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(link.url);
      showToast('Link copied to clipboard!');
    });

    btnGroup.appendChild(dl);
    btnGroup.appendChild(copyBtn);

    card.appendChild(catBadge);
    card.appendChild(actions);
    card.appendChild(body);
    card.appendChild(btnGroup);
    grid.appendChild(card);

    editBtn.addEventListener('click', () => {
      formTitle.textContent = 'Edit Package';
      editIdInput.value = link.id;
      nameInput.value = link.name;
      categorySelect.value = link.category || 'apps';
      urlInput.value = link.url;
      switchView('add', true);
    });

    removeBtn.addEventListener('click', async () => {
      links = links.filter(l => l.id !== link.id);
      render();
      await persist();
      showToast('Package removed globally');
    });

    dl.addEventListener('click', () => window.open(link.url, '_blank', 'noopener,noreferrer'));
  });
}

openAddBtn.addEventListener('click', () => {
  switchView('add');
});

cancelAddBtn.addEventListener('click', () => switchView('library'));
cancelFormBtn.addEventListener('click', () => switchView('library'));

searchInput.addEventListener('input', render);

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = nameInput.value.trim();
  const category = categorySelect.value;
  let url = urlInput.value.trim();
  const editId = editIdInput.value;

  if(!name || !url) return;
  if(!/^https?:\/\//i.test(url)) url = 'https://' + url;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving…';

  if(editId) {
    const idx = links.findIndex(l => l.id === editId);
    if(idx !== -1) {
      links[idx].name = name;
      links[idx].category = category;
      links[idx].url = url;
    }
  } else {
    links.unshift({
      id: 'pkg-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      name,
      category,
      url,
      addedAt: Date.now()
    });
  }

  render();
  switchView('library');
  await persist();
  
  form.reset();
  submitBtn.disabled = false;
  submitBtn.textContent = 'Save Package';
  showToast(editId ? 'Package updated!' : 'Package added for everyone!');
});

exportBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(links, null, 2)], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'library-backup.json';
  a.click(); URL.revokeObjectURL(url);
});

importBtn.addEventListener('click', () => {
  importInput.click();
});

importInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if(!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if(Array.isArray(data)){
      links = data;
      render();
      await persist();
      showToast('Library updated globally');
    }
  } catch(err){ showToast('Failed to import backup'); }
});

loadLinks();