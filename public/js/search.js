// ── search.js – Debounced search, filter handlers, auto-suggest ────────────────────

let _searchTimer;
let _suggestTimer;
let _suggestIndex = -1;

function initSearch() {
  const searchInput      = document.getElementById('searchInput');
  const clearBtn         = document.getElementById('clearSearch');
  const categoryFilter   = document.getElementById('categoryFilter');
  const difficultyFilter = document.getElementById('difficultyFilter');
  const sortFilter       = document.getElementById('sortFilter');
  const dropdown         = document.getElementById('suggestDropdown');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(_searchTimer);
      clearTimeout(_suggestTimer);
      const val = searchInput.value.trim();
      if (clearBtn) clearBtn.style.display = val ? 'block' : 'none';

      // Debounce main search
      _searchTimer = setTimeout(() => {
        if (typeof loadSkills === 'function') loadSkills();
      }, 280);

      // Debounce suggest (faster)
      if (val.length >= 2) {
        _suggestTimer = setTimeout(() => fetchSuggestions(val), 180);
      } else {
        hideSuggest();
      }
    });

    searchInput.addEventListener('keydown', (e) => {
      if (dropdown && dropdown.children.length > 0 && dropdown.style.display !== 'none') {
        const items = dropdown.querySelectorAll('.suggest-item');
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          _suggestIndex = Math.min(_suggestIndex + 1, items.length - 1);
          items.forEach((el, i) => el.classList.toggle('suggest-active', i === _suggestIndex));
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          _suggestIndex = Math.max(_suggestIndex - 1, 0);
          items.forEach((el, i) => el.classList.toggle('suggest-active', i === _suggestIndex));
          return;
        }
        if (e.key === 'Enter' && _suggestIndex >= 0) {
          e.preventDefault();
          items[_suggestIndex]?.click();
          return;
        }
        if (e.key === 'Escape') { hideSuggest(); return; }
      }
      if (e.key === 'Enter') {
        clearTimeout(_searchTimer);
        if (typeof loadSkills === 'function') loadSkills();
        hideSuggest();
      }
    });

    // Hide dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-wrapper') && !e.target.closest('.suggest-dropdown')) {
        hideSuggest();
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) { searchInput.value = ''; searchInput.focus(); }
      clearBtn.style.display = 'none';
      hideSuggest();
      if (typeof loadSkills === 'function') loadSkills();
    });
  }

  if (categoryFilter)   categoryFilter.addEventListener('change',   () => { if (typeof loadSkills === 'function') loadSkills(); });
  if (difficultyFilter) difficultyFilter.addEventListener('change', () => { if (typeof loadSkills === 'function') loadSkills(); });
  if (sortFilter)       sortFilter.addEventListener('change',       () => { if (typeof loadSkills === 'function') loadSkills(); });
}

async function fetchSuggestions(q) {
  const dropdown = document.getElementById('suggestDropdown');
  if (!dropdown) return;
  try {
    const res  = await fetch(`/api/skills/suggest?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    _suggestIndex = -1;
    if (!data.length) { hideSuggest(); return; }

    // Group: if a category was suggested, show a hint row first
    const catHint = data[0]?.suggestedCategory;
    let html = '';
    if (catHint) {
      html += `<div class="suggest-category-hint">Category detected: <strong>${catHint}</strong></div>`;
    }
    html += data.map(s => `
      <div class="suggest-item" tabindex="-1" onclick="selectSuggestion(${s.id}, '${s.name.replace(/'/g,"&apos;")}')">
        <span class="suggest-icon">${getCatIcon(s.category)}</span>
        <span class="suggest-name">${highlightMatch(s.name, q)}</span>
        <span class="suggest-cat">${s.category}</span>
      </div>
    `).join('');

    dropdown.innerHTML = html;
    dropdown.style.display = 'block';
  } catch (_) { hideSuggest(); }
}

function selectSuggestion(id, name) {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = name;
  hideSuggest();
  // navigate straight to the skill page
  document.body.classList.add('page-exit');
  setTimeout(() => { window.location.href = `/skill?id=${id}`; }, 160);
}

function hideSuggest() {
  const d = document.getElementById('suggestDropdown');
  if (d) { d.style.display = 'none'; d.innerHTML = ''; }
  _suggestIndex = -1;
}

function highlightMatch(text, q) {
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return text.slice(0, idx)
    + `<mark class="suggest-highlight">${text.slice(idx, idx + q.length)}</mark>`
    + text.slice(idx + q.length);
}

function getCatIcon(cat) {
  const map = {
    'Technology':'\ud83e\udd16','Web Development':'\ud83d\udcbb','Data Science':'\ud83d\udcca',
    'Design':'\ud83c\udfa8','Security':'\ud83d\udd12','DevOps':'\u2699\ufe0f',
    'Business':'\ud83d\udcc8','Mobile':'\ud83d\udcf1'
  };
  return map[cat] || '\ud83d\udcd6';
}

document.addEventListener('DOMContentLoaded', initSearch);
