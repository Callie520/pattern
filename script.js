// English for Real Australia — focused Quick Add + spaced memory.
// Existing efra_* storage keys are intentionally preserved so upgrades keep user data.

const REVIEW_KEY = 'efra_reviews';
const CUSTOM_ITEMS_KEY = 'efra_custom_items';
const QUICKADD_PENDING_KEY = 'efra_quickadd_pending';
const NOTES_KEY = 'efra_notes';
const SETTINGS_KEY = 'efra_planSettings';
const VOICE_KEY = 'efra_voice';
const REVIEW_INTERVALS = [1, 3, 7, 14, 30];

let selectedVoiceCode = localStorage.getItem(VOICE_KEY) || 'au';
let selectedVoice = null;

function safeJSON(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch (_) {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function addDays(time, days) {
  const date = new Date(time);
  date.setDate(date.getDate() + days);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function localDateString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(time) {
  if (!time) return '';
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(new Date(time));
}

function loadPending() {
  const items = safeJSON(QUICKADD_PENDING_KEY, []);
  return Array.isArray(items) ? items : [];
}

function savePending(items) {
  saveJSON(QUICKADD_PENDING_KEY, items);
}

function loadLearned() {
  const items = safeJSON(CUSTOM_ITEMS_KEY, []);
  if (!Array.isArray(items)) return [];
  return items.filter(item => item && (item.module === 'quickadd' || item.category === 'quickadd'));
}

function saveLearned(items) {
  const existing = safeJSON(CUSTOM_ITEMS_KEY, []);
  const unrelated = Array.isArray(existing)
    ? existing.filter(item => item && item.module !== 'quickadd' && item.category !== 'quickadd')
    : [];
  saveJSON(CUSTOM_ITEMS_KEY, [...unrelated, ...items]);
}

function loadReviews() {
  const reviews = safeJSON(REVIEW_KEY, {});
  return reviews && typeof reviews === 'object' && !Array.isArray(reviews) ? reviews : {};
}

function saveReviews(reviews) {
  saveJSON(REVIEW_KEY, reviews);
}

function loadNotes() {
  const notes = safeJSON(NOTES_KEY, {});
  return notes && typeof notes === 'object' && !Array.isArray(notes) ? notes : {};
}

function saveNotes(notes) {
  saveJSON(NOTES_KEY, notes);
}

function settings() {
  return Object.assign({ newGoal: 5, reviewGoal: 20 }, safeJSON(SETTINGS_KEY, {}));
}

function saveSettings(next) {
  saveJSON(SETTINGS_KEY, Object.assign({}, safeJSON(SETTINGS_KEY, {}), next));
}

function itemNote(item) {
  return item.note || loadNotes()[item.id] || '';
}

function reviewLevel(record) {
  return typeof record?.reviewLevel === 'number' ? record.reviewLevel : (record?.stage || 0);
}

function reviewDate(record) {
  return record?.nextReviewDate || record?.nextReview || 0;
}

function isMastered(itemId) {
  return reviewLevel(loadReviews()[itemId]) >= REVIEW_INTERVALS.length;
}

function dueItems() {
  const reviews = loadReviews();
  const today = startOfToday();
  return loadLearned().filter(item => {
    const record = reviews[item.id];
    return !record || (reviewLevel(record) < REVIEW_INTERVALS.length && reviewDate(record) <= today);
  });
}

function promoteItem(item) {
  const learned = loadLearned();
  const promoted = Object.assign({}, item, { module: 'quickadd', category: 'quickadd' });
  if (!learned.some(candidate => candidate.id === item.id)) learned.push(promoted);
  saveLearned(learned);
  savePending(loadPending().filter(candidate => candidate.id !== item.id));
  return promoted;
}

function addToReview(itemId) {
  const reviews = loadReviews();
  const today = startOfToday();
  if (!reviews[itemId]) {
    reviews[itemId] = {
      reviewLevel: 0,
      stage: 0,
      learnDate: today,
      nextReviewDate: addDays(today, REVIEW_INTERVALS[0]),
      nextReview: addDays(today, REVIEW_INTERVALS[0]),
      count: 0
    };
  }
  saveReviews(reviews);
}

function remembered(itemId) {
  const reviews = loadReviews();
  if (!reviews[itemId]) addToReview(itemId);
  const fresh = loadReviews();
  const record = fresh[itemId];
  const nextLevel = Math.min(reviewLevel(record) + 1, REVIEW_INTERVALS.length);
  record.reviewLevel = nextLevel;
  record.stage = nextLevel;
  record.count = (record.count || 0) + 1;
  const nextDate = nextLevel >= REVIEW_INTERVALS.length
    ? 0
    : addDays(startOfToday(), REVIEW_INTERVALS[nextLevel]);
  record.nextReviewDate = nextDate;
  record.nextReview = nextDate;
  fresh[itemId] = record;
  saveReviews(fresh);
}

function again(itemId) {
  const reviews = loadReviews();
  if (!reviews[itemId]) addToReview(itemId);
  const fresh = loadReviews();
  const record = fresh[itemId];
  const level = Math.max(0, reviewLevel(record) - 1);
  record.reviewLevel = level;
  record.stage = level;
  record.count = (record.count || 0) + 1;
  record.nextReviewDate = addDays(startOfToday(), 1);
  record.nextReview = record.nextReviewDate;
  fresh[itemId] = record;
  saveReviews(fresh);
}

function markMastered(itemId) {
  const reviews = loadReviews();
  reviews[itemId] = Object.assign({}, reviews[itemId] || {}, {
    reviewLevel: REVIEW_INTERVALS.length,
    stage: REVIEW_INTERVALS.length,
    learnDate: reviews[itemId]?.learnDate || startOfToday(),
    nextReviewDate: 0,
    nextReview: 0
  });
  saveReviews(reviews);
}

function moveBackToReview(itemId) {
  const reviews = loadReviews();
  reviews[itemId] = Object.assign({}, reviews[itemId] || {}, {
    reviewLevel: 0,
    stage: 0,
    nextReviewDate: startOfToday(),
    nextReview: startOfToday()
  });
  saveReviews(reviews);
}

function escapeHTML(value) {
  return String(value || '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));
}

function updateVoiceList() {
  if (!('speechSynthesis' in window)) return;
  const voices = speechSynthesis.getVoices();
  const language = selectedVoiceCode === 'uk' ? 'en-GB' : selectedVoiceCode === 'us' ? 'en-US' : 'en-AU';
  selectedVoice = voices.find(voice => voice.lang === language) ||
    voices.find(voice => voice.lang?.toLowerCase().startsWith(language.toLowerCase().slice(0, 2))) || null;
}

function speak(text) {
  if (!text || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = selectedVoiceCode === 'uk' ? 'en-GB' : selectedVoiceCode === 'us' ? 'en-US' : 'en-AU';
  if (selectedVoice) utterance.voice = selectedVoice;
  utterance.rate = 0.92;
  speechSynthesis.speak(utterance);
}

function emptyState(title, text, link = '') {
  return `<div class="empty-state"><div class="empty-mark">✓</div><h3>${escapeHTML(title)}</h3><p>${escapeHTML(text)}</p>${link}</div>`;
}

function sentenceCard(item, options = {}) {
  const card = document.createElement('article');
  card.className = 'sentence-card';
  const note = itemNote(item);
  const status = options.status || '';
  card.innerHTML = `
    <div class="sentence-topline">
      ${status ? `<span class="status-badge ${escapeHTML(status.className || '')}">${escapeHTML(status.label)}</span>` : '<span></span>'}
      <button type="button" class="icon-btn speak-btn" aria-label="Listen">🔊</button>
    </div>
    <h3>${escapeHTML(item.english)}</h3>
    <button type="button" class="text-btn reveal-btn">Show Chinese</button>
    <p class="translation" hidden>${escapeHTML(item.chinese)}</p>
    ${note ? `<p class="note"><span>Note</span>${escapeHTML(note)}</p>` : ''}
    <div class="card-actions"></div>`;

  card.querySelector('.speak-btn').addEventListener('click', () => speak(item.english));
  const reveal = card.querySelector('.reveal-btn');
  const translation = card.querySelector('.translation');
  reveal.addEventListener('click', () => {
    translation.hidden = !translation.hidden;
    reveal.textContent = translation.hidden ? 'Show Chinese' : 'Hide Chinese';
  });

  const actions = card.querySelector('.card-actions');
  (options.actions || []).forEach(action => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `btn ${action.className || 'quiet-btn'}`;
    button.textContent = action.label;
    button.addEventListener('click', action.onClick);
    actions.appendChild(button);
  });
  if (!actions.children.length) actions.remove();
  return card;
}

function showStudySession(container, items, mode, onFinish) {
  if (!container) return;
  container.hidden = false;
  document.body.classList.add('study-open');
  let index = 0;

  function close() {
    container.hidden = true;
    container.innerHTML = '';
    document.body.classList.remove('study-open');
    if (onFinish) onFinish();
  }

  function render() {
    if (index >= items.length) {
      container.innerHTML = `<div class="study-shell"><div class="study-complete"><div class="complete-mark">✓</div><p class="step-label">Session complete</p><h2>Nice work.</h2><p>You kept today’s learning small and useful.</p><button class="btn primary-btn finish-session-btn">Done</button></div></div>`;
      container.querySelector('.finish-session-btn').addEventListener('click', close);
      return;
    }

    const item = items[index];
    container.innerHTML = `<div class="study-shell"><div class="study-toolbar"><button class="text-btn close-study-btn">Close</button><span>${index + 1} / ${items.length}</span></div><div class="study-card-wrap"></div></div>`;
    container.querySelector('.close-study-btn').addEventListener('click', close);
    const wrap = container.querySelector('.study-card-wrap');

    const actions = mode === 'new'
      ? [
          { label: 'Keep learning', className: 'secondary-btn', onClick: () => { const learned = promoteItem(item); addToReview(learned.id); index += 1; render(); } },
          { label: 'Already mastered', className: 'quiet-btn', onClick: () => { const learned = promoteItem(item); markMastered(learned.id); index += 1; render(); } }
        ]
      : [
          { label: 'Again tomorrow', className: 'quiet-btn', onClick: () => { again(item.id); index += 1; render(); } },
          { label: 'Remembered', className: 'primary-btn', onClick: () => { remembered(item.id); index += 1; render(); } },
          { label: 'Mastered', className: 'text-action-btn', onClick: () => { markMastered(item.id); index += 1; render(); } }
        ];
    wrap.appendChild(sentenceCard(item, { actions }));
    speak(item.english);
  }

  render();
}

function updateQuickAddStats() {
  const learned = loadLearned();
  const values = {
    'pending-count': loadPending().length,
    'due-count': dueItems().length,
    'mastered-count': learned.filter(item => isMastered(item.id)).length
  };
  Object.entries(values).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });
}

function initQuickAddPage() {
  const form = document.getElementById('quick-add-form');
  const list = document.getElementById('quick-add-list');
  const startButton = document.getElementById('quick-add-start-btn');
  const studyContainer = document.getElementById('quick-add-study-container');
  const status = document.getElementById('form-status');
  const saveButton = document.getElementById('save-sentence-btn');
  const cancelButton = document.getElementById('cancel-edit-btn');
  let editingId = null;

  function clearForm() {
    editingId = null;
    form.reset();
    saveButton.textContent = 'Save sentence';
    cancelButton.hidden = true;
  }

  function editItem(item) {
    editingId = item.id;
    document.getElementById('qa-english').value = item.english || '';
    document.getElementById('qa-chinese').value = item.chinese || '';
    document.getElementById('qa-note').value = itemNote(item);
    saveButton.textContent = 'Update sentence';
    cancelButton.hidden = false;
    document.querySelector('.add-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('qa-english').focus();
  }

  function renderList() {
    const pending = loadPending();
    list.innerHTML = '';
    startButton.hidden = pending.length === 0;
    if (!pending.length) {
      list.innerHTML = emptyState('Your new list is clear', 'Add a sentence above whenever you hear something worth keeping.');
      updateQuickAddStats();
      return;
    }
    pending.slice().reverse().forEach(item => {
      list.appendChild(sentenceCard(item, {
        status: { label: item.createdDate ? formatDate(new Date(item.createdDate).getTime()) : 'New', className: 'new' },
        actions: [
          { label: 'Edit', onClick: () => editItem(item) },
          { label: 'Delete', className: 'danger-text-btn', onClick: () => {
            if (!window.confirm('Delete this sentence?')) return;
            savePending(loadPending().filter(candidate => candidate.id !== item.id));
            const notes = loadNotes();
            delete notes[item.id];
            saveNotes(notes);
            renderList();
          } }
        ]
      }));
    });
    updateQuickAddStats();
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const english = document.getElementById('qa-english').value.trim();
    const chinese = document.getElementById('qa-chinese').value.trim();
    const note = document.getElementById('qa-note').value.trim();
    if (!english || !chinese) return;

    const pending = loadPending();
    if (editingId) {
      const index = pending.findIndex(item => item.id === editingId);
      if (index >= 0) pending[index] = Object.assign({}, pending[index], { english, chinese, note });
      status.textContent = 'Sentence updated.';
    } else {
      const id = `quick-${Date.now()}`;
      pending.push({ id, english, chinese, note, module: 'quickadd-pending', category: 'quickadd-pending', createdDate: new Date().toISOString() });
      status.textContent = 'Saved to your new-sentence list.';
    }
    savePending(pending);
    clearForm();
    renderList();
    window.setTimeout(() => { status.textContent = ''; }, 2500);
  });

  cancelButton.addEventListener('click', clearForm);
  document.getElementById('speak-draft-btn').addEventListener('click', () => speak(document.getElementById('qa-english').value.trim()));
  startButton.addEventListener('click', () => {
    const queue = loadPending().slice(0, Math.max(1, Number(settings().newGoal) || 5));
    showStudySession(studyContainer, queue, 'new', renderList);
  });
  renderList();
}

function initMemoryPage() {
  const list = document.getElementById('memory-list');
  const title = document.getElementById('library-title');
  const search = document.getElementById('memory-search');
  const reviewButton = document.getElementById('start-due-review-btn');
  const studyContainer = document.getElementById('memory-study-container');
  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  let activeFilter = 'due';

  function itemStatus(item, pendingIds) {
    if (pendingIds.has(item.id)) return { label: 'New · not learned', className: 'new' };
    const record = loadReviews()[item.id];
    if (reviewLevel(record) >= REVIEW_INTERVALS.length) return { label: 'Mastered', className: 'mastered' };
    if (!record || reviewDate(record) <= startOfToday()) return { label: 'Due today', className: 'due' };
    return { label: `Next ${formatDate(reviewDate(record))}`, className: 'learning' };
  }

  function refreshStats() {
    const learned = loadLearned();
    const active = learned.filter(item => !isMastered(item.id));
    const values = {
      'memory-due-count': dueItems().length,
      'memory-learning-count': active.length,
      'memory-mastered-count': learned.filter(item => isMastered(item.id)).length,
      'memory-total-count': learned.length + loadPending().length
    };
    Object.entries(values).forEach(([id, value]) => document.getElementById(id).textContent = value);
    reviewButton.disabled = dueItems().length === 0;
    reviewButton.textContent = dueItems().length ? `Review due (${dueItems().length})` : 'Nothing due';
  }

  function render() {
    const learned = loadLearned();
    const pending = loadPending();
    const pendingIds = new Set(pending.map(item => item.id));
    const reviews = loadReviews();
    const query = search.value.trim().toLowerCase();
    const headings = { due: 'Due today', learning: 'Learning', mastered: 'Mastered', all: 'All saved' };
    title.textContent = query ? 'Search results' : headings[activeFilter];

    let items;
    if (query) {
      items = [...pending, ...learned].filter(item =>
        (item.english || '').toLowerCase().includes(query) ||
        (item.chinese || '').toLowerCase().includes(query) ||
        itemNote(item).toLowerCase().includes(query));
    } else if (activeFilter === 'due') {
      items = dueItems();
    } else if (activeFilter === 'learning') {
      items = learned.filter(item => !isMastered(item.id));
    } else if (activeFilter === 'mastered') {
      items = learned.filter(item => isMastered(item.id));
    } else {
      items = [...pending, ...learned];
    }

    list.innerHTML = '';
    if (!items.length) {
      const text = query ? 'Try a different English or Chinese word.' : activeFilter === 'due'
        ? 'You have finished today’s reviews.'
        : 'No sentences are in this group yet.';
      list.innerHTML = emptyState(query ? 'No matches' : 'Nothing here', text, activeFilter === 'all' ? '<a class="btn primary-btn" href="index.html">Add a sentence</a>' : '');
      refreshStats();
      return;
    }

    items.forEach(item => {
      const isPending = pendingIds.has(item.id);
      const actions = [];
      if (isPending) {
        actions.push({ label: 'Learn in Quick Add', className: 'secondary-btn', onClick: () => { window.location.href = 'index.html'; } });
      } else if (isMastered(item.id)) {
        actions.push({ label: 'Move back to review', onClick: () => { moveBackToReview(item.id); render(); } });
      } else {
        const record = reviews[item.id];
        if (!record || reviewDate(record) <= startOfToday()) {
          actions.push({ label: 'Again tomorrow', onClick: () => { again(item.id); render(); } });
          actions.push({ label: 'Remembered', className: 'primary-btn', onClick: () => { remembered(item.id); render(); } });
        }
        actions.push({ label: 'Mastered', className: 'text-action-btn', onClick: () => { markMastered(item.id); render(); } });
      }
      list.appendChild(sentenceCard(item, { status: itemStatus(item, pendingIds), actions }));
    });
    refreshStats();
  }

  filterButtons.forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    search.value = '';
    filterButtons.forEach(candidate => candidate.classList.toggle('active', candidate === button));
    render();
  }));
  search.addEventListener('input', render);
  reviewButton.addEventListener('click', () => {
    const queue = dueItems().slice(0, Math.max(1, Number(settings().reviewGoal) || 20));
    if (queue.length) showStudySession(studyContainer, queue, 'review', render);
  });
  render();
}

function initSettingsPage() {
  const form = document.getElementById('settings-form');
  const current = settings();
  document.getElementById('setting-new-goal').value = current.newGoal;
  document.getElementById('setting-review-goal').value = current.reviewGoal;
  const voiceSelect = document.getElementById('voice-select');
  voiceSelect.value = selectedVoiceCode;

  form.addEventListener('submit', event => {
    event.preventDefault();
    const newGoal = Math.min(30, Math.max(1, Number(document.getElementById('setting-new-goal').value) || 5));
    const reviewGoal = Math.min(100, Math.max(1, Number(document.getElementById('setting-review-goal').value) || 20));
    selectedVoiceCode = voiceSelect.value;
    localStorage.setItem(VOICE_KEY, selectedVoiceCode);
    saveSettings({ newGoal, reviewGoal });
    updateVoiceList();
    const status = document.getElementById('settings-status');
    status.textContent = 'Settings saved.';
    window.setTimeout(() => { status.textContent = ''; }, 2500);
  });

  const exportButton = document.getElementById('export-data-btn');
  const importButton = document.getElementById('import-data-btn');
  const fileInput = document.getElementById('import-data-file');
  const backupStatus = document.getElementById('backup-status');

  exportButton.addEventListener('click', () => {
    const data = {};
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key?.startsWith('efra_')) data[key] = localStorage.getItem(key);
    }
    const backup = { app: 'English for Real Australia', version: 2, exportedAt: new Date().toISOString(), data };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `english_backup_${localDateString()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    backupStatus.textContent = 'Backup exported.';
  });

  importButton.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const data = parsed.data && typeof parsed.data === 'object' ? parsed.data : parsed;
        const keys = Object.keys(data).filter(key => key.startsWith('efra_') && typeof data[key] === 'string');
        if (!keys.length) throw new Error('This file does not contain a valid backup.');
        keys.forEach(key => localStorage.setItem(key, data[key]));
        backupStatus.textContent = `Restored ${keys.length} data groups. Reloading…`;
        window.setTimeout(() => window.location.reload(), 900);
      } catch (error) {
        backupStatus.textContent = error.message || 'Could not import this backup.';
      }
    };
    reader.readAsText(file);
  });
}

function initPWA() {
  let installPrompt;
  const installButton = document.getElementById('install-button');
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    if (installButton) installButton.hidden = false;
  });
  installButton?.addEventListener('click', async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    installButton.hidden = true;
  });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js').catch(() => {});
}

document.addEventListener('DOMContentLoaded', () => {
  updateVoiceList();
  if ('speechSynthesis' in window && speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = updateVoiceList;
  }
  initPWA();
  const page = document.body.dataset.page;
  if (page === 'quickadd') initQuickAddPage();
  if (page === 'memory') initMemoryPage();
  if (page === 'settings') initSettingsPage();
});
