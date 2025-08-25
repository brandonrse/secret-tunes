import {
  loadLocalSongsCsv
} from "./data.js";

import {
  getRandInt,
  getSongName,
  getGameName
} from "./playerUtility.js";

var songs;

loadLocalSongsCsv().then(
  (songs) => {
    setup(songs);
  }
);

function setup(res) {
  songs = res;
  console.log(songs);
  populateFilters();
  applyFilters();
}
const hamburger = document.getElementById('hamburger');
const menu = document.getElementById('navbarMenu');

hamburger.addEventListener('click', () => {
  menu.classList.toggle('active');
});

// --- Utilities ---
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const toArray = v => Array.isArray(v) ? v : (v == null || v === "" ? [] : [v]);

function unique(list) { return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b)); }
function createOptionList(select, values, label) {
  select.innerHTML = "";
  const any = document.createElement('option');
  any.value = "";
  any.textContent = label || "Any";
  select.appendChild(any);
  for (const v of values) {
    const o = document.createElement('option');
    o.value = v;
    o.textContent = v;
    select.appendChild(o);
  }
}
function diffClass(n) {
  return `diff-${Math.max(1, Math.min(5, +n || 1))}`;
}
// --- Utilities ---
function getYouTubeID(url) {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  return match ? match[1] : '';
}

// --- Rendering ---
function render(list) {
  els.grid.setAttribute('aria-busy', 'true');
  els.grid.innerHTML = '';
  if (list.length === 0) {
    els.empty.hidden = false;
    els.count.textContent = '0 results';
    els.grid.setAttribute('aria-busy', 'false');
    return;
  }
  els.empty.hidden = true;

  const frag = document.createDocumentFragment();
  for (const s of list) {
    const card = document.createElement('article');
    card.className = 'card';
    const game = getGameName(s.title);
    const song = getSongName(s.title);

    card.innerHTML = `
            <div class="title">${escapeHtml(song)}</div>
            <div class="meta">
                <span title="Game">🎮 ${escapeHtml(game)}</span>
                <span title="Series">🧩 ${escapeHtml(toArray(s.series).join(', '))}</span>
                <span class="difficulty ${diffClass(s.difficulty)}" title="Difficulty">⬤ ${escapeHtml(s.difficulty || 1)}</span>
            </div>
            <div class="badges" aria-label="Categories">
                ${toArray(s.categories).map(c => `<span class="pill">${escapeHtml(c)}</span>`).join('')}
            </div>
            ${toArray(s.hints).length ? `<details><summary>Hints (${toArray(s.hints).length})</summary><ul>${toArray(s.hints).map(h => `<li>${escapeHtml(h)}</li>`).join('')}</ul></details>` : ''}
<div class="actions">
  ${s.youtube
        ? `<button class="btn play-inline" data-video-id="${escapeAttr(getYouTubeID(s.youtube))}">▶️ Play</button>`
        : ''}
</div>


        `;
    frag.appendChild(card);
  }

  els.grid.appendChild(frag);
  els.count.textContent = `${list.length} ${list.length === 1 ? 'result' : 'results'}`;
  els.grid.setAttribute('aria-busy', 'false');


}


function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[s]));
}
function escapeAttr(str = '') {
  return escapeHtml(str).replace(/"/g, '&quot;');
}

// --- State ---
const els = {
  grid: $('#grid'),
  empty: $('#empty'),
  count: $('#count'),
  search: $('#search'),
  game: $('#game'),
  series: $('#series'),
  category: $('#category'),
  sort: $('#sort'),
  clear: $('#clear'),
  playerDialog: $('#playerDialog'),
  player: $('#player'),
  modalTitle: $('#modalTitle'),
  modalMeta: $('#modalMeta'),
  closeDialog: $('#closeDialog')
};

// --- Filtering ---
function populateFilters() {
  const games = unique(songs.map(s => getGameName(s.title)).filter(Boolean));
  const series = unique(songs.flatMap(s => toArray(s.series)).filter(Boolean));
  const cats = unique(songs.flatMap(s => toArray(s.categories)).filter(Boolean));
  createOptionList(els.game, games, 'Any game');
  createOptionList(els.series, series, 'Any series');
  createOptionList(els.category, cats, 'Any category');
}
function getFilters() {
  return {
    q: els.search.value.trim().toLowerCase(),
    game: els.game.value,
    series: els.series.value,
    category: els.category.value,
    sort: els.sort.value
  };
}
function applyFilters() {
  const f = getFilters();
  let list = songs.slice();

  if (f.q) {
    list = list.filter(s =>
      s.title.toLowerCase().includes(f.q) ||
      getGameName(s.title).toLowerCase().includes(f.q) ||
      toArray(s.series).some(v => v.toLowerCase().includes(f.q)) ||
      toArray(s.categories).some(c => (c || '').toLowerCase().includes(f.q))
    );
  }
  if (f.game) { list = list.filter(s => getGameName(s.title) === f.game); }
  if (f.series) { list = list.filter(s => toArray(s.series).includes(f.series)); }
  if (f.category) { list = list.filter(s => toArray(s.categories).includes(f.category)); }

  const [key, dir] = f.sort.split('-');
  const mul = dir === 'asc' ? 1 : -1;
  list.sort((a, b) => {
    switch (key) {
      case 'title': return mul * getSongName(a.title).localeCompare(getSongName(b.title));
      case 'game': return mul * getGameName(a.title).localeCompare(getGameName(b.title));
      case 'diff': return mul * ((a.difficulty || 0) - (b.difficulty || 0));
      default: return 0;
    }
  });

  render(list);
}


// --- Events ---
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); } }



els.search.addEventListener('input', debounce(applyFilters, 150));
['change', 'input'].forEach(ev => {
  [els.game, els.series, els.category, els.sort].forEach(c => c.addEventListener(ev, applyFilters));
});
els.clear.addEventListener('click', () => {
  els.search.value = '';
  els.game.value = '';
  els.series.value = '';
  els.category.value = '';
  els.sort.value = 'title-asc';
  applyFilters();
});
function closePlayer() {
  els.player.src = '';
  els.playerDialog.close();
}

els.closeDialog.addEventListener('click', closePlayer);
els.playerDialog.addEventListener('click', (e) => {
  if (e.target === els.playerDialog) closePlayer();
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && els.playerDialog.open) closePlayer();
});
const inlinePlayerTemplate = document.getElementById('inlinePlayerTemplate');
const inlinePlayer = document.getElementById('inlinePlayer');

document.addEventListener('click', (e) => {
  const btn = e.target.closest('.play-inline');
  if (!btn) return;

  const videoId = btn.dataset.videoId;
  if (!videoId) return;

  // Find the card containing the button
  const card = btn.closest('.card');

  // Move the player container into this card
  card.appendChild(inlinePlayerTemplate);
  inlinePlayerTemplate.hidden = false;

  // Set the iframe source
  inlinePlayer.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;

});

// Optional: pause video if user clicks a close button or another play button
