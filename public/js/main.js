// ── main.js – Homepage & Skill Detail page ───────────────────────────────────

const API = '/api/skills';

const CATEGORY_ICONS = {
  'Technology':       '🤖',
  'Web Development':  '💻',
  'Data Science':     '📊',
  'Design':           '🎨',
  'Security':         '🔒',
  'DevOps':           '⚙️',
  'Business':         '📈',
  'Mobile':           '📱',
};

// ╔═══════════════════════════════════════════════════════════════
//  HOMEPAGE – Skill Card Grid
// ╚═══════════════════════════════════════════════════════════════

async function loadSkills() {
  const q          = (document.getElementById('searchInput')?.value     || '').trim();
  const category   =  document.getElementById('categoryFilter')?.value  || '';
  const difficulty =  document.getElementById('difficultyFilter')?.value || '';
  const sort       =  document.getElementById('sortFilter')?.value       || 'trendScore';

  try {
    const skills = await window.SkillVerseData.getFilteredSkills({ q, category, difficulty, sort });
    renderGrid(skills);
  } catch (err) {
    console.error('Failed to load skills:', err);
    const grid = document.getElementById('skillsGrid');
    if (grid) grid.innerHTML = '<p style="color:var(--red);padding:20px">Failed to load skills. Is the server running?</p>';
  }
}

function renderGrid(skills) {
  const grid  = document.getElementById('skillsGrid');
  const empty = document.getElementById('emptyState');
  const count = document.getElementById('skillCount');

  if (!grid) return;

  if (count) count.textContent = `${skills.length} skill${skills.length !== 1 ? 's' : ''} found`;

  if (skills.length === 0) {
    grid.innerHTML = '';
    if (empty) empty.style.display = 'flex';
    return;
  }
  if (empty) empty.style.display = 'none';

  const maxTrend = Math.max(...skills.map(s => s.trendScore), 1);
  grid.innerHTML = skills.map((skill, i) => {
    const catClass  = 'cat-' + skill.category.toLowerCase().replace(/[\s/&,]+/g, '-');
    const diffClass = 'diff-' + skill.difficulty.toLowerCase();
    const desc      = (skill.description || '').substring(0, 100) + '…';
    const tags      = (skill.skills || []).slice(0, 3).map(t => `<span class="tag">${t}</span>`).join('');
    const icon      = CATEGORY_ICONS[skill.category] || '📖';
    const trendPct  = Math.round((skill.trendScore / maxTrend) * 100);
    const isSelected = _compareIds.includes(skill.id);
    const compareOverlay = _compareMode ? `
      <div class="sv-compare-overlay ${isSelected ? 'selected' : ''}"
           onclick="event.stopPropagation();selectForCompare(${skill.id},'${skill.name.replace(/'/g, "\\'")}')">
        <span>${isSelected ? '✓ Selected' : '+ Compare'}</span>
      </div>` : '';

    return `
      <div class="skill-card ${isSelected ? 'sv-compare-selected' : ''}"
           onclick="${_compareMode
             ? `selectForCompare(${skill.id},'${skill.name.replace(/'/g, "\\'")}')`
             : `window.location.href='/skill?id=${skill.id}'`}"
           style="animation-delay:${i * 0.04}s">
        <div class="card-img-wrap">
          <img src="${skill.image}" alt="${skill.name}" loading="lazy" />
          <span class="card-difficulty ${diffClass}">${skill.difficulty}</span>
          ${compareOverlay}
        </div>
        <div class="card-body">
          <span class="card-category ${catClass}">${skill.category}</span>
          <h3 class="card-title"><span class="card-icon">${icon}</span>${skill.name}</h3>
          <p class="card-desc">${desc}</p>
          <div class="trend-bar-wrap">
            <div class="trend-bar-label">
              <span>Trend Strength</span>
              <span class="trend-bar-score">🔥 ${skill.trendScore}</span>
            </div>
            <div class="trend-bar-track">
              <div class="trend-bar-fill" style="inline-size:${trendPct}%;animation-delay:${i * 0.05 + 0.25}s"></div>
            </div>
          </div>
          <div class="card-footer">
            <div class="card-tags">${tags}</div>
            <div class="card-stats">
              <span title="Popularity">⭐ ${skill.popularity}</span>
              <span title="Views">👁 ${skill.views.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function loadCategories() {
  try {
    const cats = await window.SkillVerseData.getCategories();
    const sel  = document.getElementById('categoryFilter');
    if (!sel) return;
    cats.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat; opt.textContent = cat;
      sel.appendChild(opt);
    });
  } catch (err) {
    console.error('Failed to load categories:', err);
  }
}

// ╔═══════════════════════════════════════════════════════════════
//  COMPARE MODE
// ╚═══════════════════════════════════════════════════════════════
let _compareMode  = false;
let _compareIds   = [];
let _compareNames = [];

function toggleCompareMode() {
  _compareMode  = !_compareMode;
  _compareIds   = [];
  _compareNames = [];
  const bar = document.getElementById('compareBar');
  const btn = document.getElementById('compareModeBtn');
  if (bar) bar.style.display = _compareMode ? 'block' : 'none';
  if (btn) btn.classList.toggle('active', _compareMode);
  updateCompareBar();
  loadSkills();
}

function selectForCompare(id, name) {
  const idx = _compareIds.indexOf(id);
  if (idx !== -1) { _compareIds.splice(idx, 1); _compareNames.splice(idx, 1); }
  else if (_compareIds.length < 2) { _compareIds.push(id); _compareNames.push(name); }
  updateCompareBar();
  loadSkills();
}

function updateCompareBar() {
  const slot1 = document.getElementById('compareSlot1');
  const slot2 = document.getElementById('compareSlot2');
  const btn   = document.getElementById('compareBtn');
  if (slot1) slot1.innerHTML = _compareNames[0]
    ? `<strong>✓ ${_compareNames[0]}</strong>`
    : '<i class="bi bi-plus-circle me-1"></i>Pick 1st skill';
  if (slot2) slot2.innerHTML = _compareNames[1]
    ? `<strong>✓ ${_compareNames[1]}</strong>`
    : '<i class="bi bi-plus-circle me-1"></i>Pick 2nd skill';
  if (btn) btn.disabled = _compareIds.length < 2;
}

async function doCompare() {
  if (_compareIds.length < 2) return;
  const modalEl = document.getElementById('compareModal');
  const body    = document.getElementById('compareModalBody');
  if (!modalEl || !body) return;
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  body.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p class="mt-3 text-muted">Loading…</p></div>';
  modal.show();
  try {
    const skills = await window.SkillVerseData.getCompareSkills(_compareIds);
    body.innerHTML = renderCompareTable(skills);
  } catch {
    body.innerHTML = '<p class="text-danger text-center py-4">Failed to load comparison data.</p>';
  }
}

function renderCompareTable(skills) {
  if (!Array.isArray(skills) || skills.length < 2)
    return '<p class="text-danger">Comparison data unavailable.</p>';
  const [a, b] = skills;
  const diffLevels = { Beginner: 1, Intermediate: 2, Advanced: 3 };
  function win(av, bv, hi = true) {
    return hi ? (av > bv ? 'sv-cmp-winner' : av < bv ? 'sv-cmp-loser' : '')
              : (av < bv ? 'sv-cmp-winner' : av > bv ? 'sv-cmp-loser' : '');
  }
  const cc = c => 'cat-' + c.toLowerCase().replace(/[\s/&,]+/g, '-');
  const dc = d => 'diff-' + d.toLowerCase();
  const al = diffLevels[a.difficulty] || 0;
  const bl = diffLevels[b.difficulty] || 0;

  return `
    <div class="row g-0 mb-4">
      <div class="col-5 text-center">
        <img src="${a.image}" class="sv-cmp-img" alt="${a.name}" />
        <h4 class="sv-cmp-title mt-2">${a.name}</h4>
        <span class="card-category ${cc(a.category)}">${a.category}</span>
      </div>
      <div class="col-2 d-flex align-items-center justify-content-center">
        <span class="sv-cmp-vs">VS</span>
      </div>
      <div class="col-5 text-center">
        <img src="${b.image}" class="sv-cmp-img" alt="${b.name}" />
        <h4 class="sv-cmp-title mt-2">${b.name}</h4>
        <span class="card-category ${cc(b.category)}">${b.category}</span>
      </div>
    </div>
    <table class="table table-dark table-bordered sv-cmp-table">
      <tbody>
        <tr>
          <td class="${win(a.popularity, b.popularity)}">${a.popularity}</td>
          <td class="sv-cmp-label">Popularity</td>
          <td class="${win(b.popularity, a.popularity)}">${b.popularity}</td>
        </tr>
        <tr>
          <td class="${win(a.trendScore, b.trendScore)}">🔥 ${a.trendScore}</td>
          <td class="sv-cmp-label">Trend Score</td>
          <td class="${win(b.trendScore, a.trendScore)}">🔥 ${b.trendScore}</td>
        </tr>
        <tr>
          <td class="${win(a.views, b.views)}">${a.views.toLocaleString()}</td>
          <td class="sv-cmp-label">Views</td>
          <td class="${win(b.views, a.views)}">${b.views.toLocaleString()}</td>
        </tr>
        <tr>
          <td class="${win(a.growth, b.growth)}">+${a.growth}%</td>
          <td class="sv-cmp-label">Growth</td>
          <td class="${win(b.growth, a.growth)}">+${b.growth}%</td>
        </tr>
        <tr>
          <td><span class="diff-badge ${dc(a.difficulty)}">${a.difficulty}</span></td>
          <td class="sv-cmp-label">Difficulty</td>
          <td><span class="diff-badge ${dc(b.difficulty)}">${b.difficulty}</span></td>
        </tr>
        <tr>
          <td>${(a.resources || []).length}</td>
          <td class="sv-cmp-label">Resources</td>
          <td>${(b.resources || []).length}</td>
        </tr>
        <tr>
          <td>${(a.careerOpportunities || []).length} roles</td>
          <td class="sv-cmp-label">Career Paths</td>
          <td>${(b.careerOpportunities || []).length} roles</td>
        </tr>
        <tr>
          <td>${(a.skills ||  []).map(t => `<span class="sv-cmp-tag">${t}</span>`).join(' ')}</td>
          <td class="sv-cmp-label">Technologies</td>
          <td>${(b.skills || []).map(t => `<span class="sv-cmp-tag">${t}</span>`).join(' ')}</td>
        </tr>
      </tbody>
    </table>
    <div class="row mt-3 g-3">
      <div class="col-6 text-center">
        <a href="/skill?id=${a.id}" class="btn sv-btn-primary btn-sm">View ${a.name} →</a>
      </div>
      <div class="col-6 text-center">
        <a href="/skill?id=${b.id}" class="btn sv-btn-primary btn-sm">View ${b.name} →</a>
      </div>
    </div>
  `;
}

// ╔═══════════════════════════════════════════════════════════════
//  PROGRESS TRACKING (localStorage)
// ╚═══════════════════════════════════════════════════════════════
const LS_PROGRESS = 'sv_progress';

function getProgress(skillId) {
  try {
    const all = JSON.parse(localStorage.getItem(LS_PROGRESS) || '{}');
    return all[String(skillId)] || [];
  } catch { return []; }
}

function setProgress(skillId, steps) {
  try {
    const all = JSON.parse(localStorage.getItem(LS_PROGRESS) || '{}');
    all[String(skillId)] = steps;
    localStorage.setItem(LS_PROGRESS, JSON.stringify(all));
  } catch { /* silent */ }
}

function toggleStep(skillId, stepIdx) {
  const steps = getProgress(skillId);
  const pos   = steps.indexOf(stepIdx);
  if (pos !== -1) steps.splice(pos, 1);
  else steps.push(stepIdx);
  setProgress(skillId, steps);
  updateProgressUI(skillId);
}

function updateProgressUI(skillId) {
  const checks  = document.querySelectorAll(`.sv-step-check[data-skill="${skillId}"]`);
  const total   = checks.length;
  const done    = getProgress(skillId);
  const pct     = total > 0 ? Math.round((done.length / total) * 100) : 0;

  const bar     = document.getElementById('roadmapProgressBar');
  const pctEl   = document.getElementById('roadmapProgressPct');
  if (bar)   { bar.style.width = pct + '%'; bar.setAttribute('aria-valuenow', pct); }
  if (pctEl) pctEl.textContent = pct + '%';

  checks.forEach(cb => {
    const idx       = parseInt(cb.dataset.step, 10);
    const isChecked = done.includes(idx);
    cb.checked      = isChecked;
    const label = document.querySelector(`label[for="${cb.id}"]`);
    const num   = document.getElementById(`step-num-${skillId}-${idx}`);
    const row   = cb.closest('.sv-roadmap-step');
    if (label) label.classList.toggle('sv-label-done', isChecked);
    if (num)   num.classList.toggle('sv-step-num-done', isChecked);
    if (row)   row.classList.toggle('sv-step-done', isChecked);
  });
}

// ╔═══════════════════════════════════════════════════════════════
//  DETAIL PAGE – Skill Detail
// ╚═══════════════════════════════════════════════════════════════

async function loadSkillDetail() {
  const params = new URLSearchParams(window.location.search);
  const id     = params.get('id');
  if (!id) { window.location.href = '/'; return; }

  try {
    const skill = await window.SkillVerseData.getSkillDetail(id);
    if (!skill) { window.location.href = '/'; return; }
    renderDetail(skill);
  } catch (err) {
    console.error('Failed to load skill:', err);
  }
}

function renderDetail(skill) {
  document.title = `${skill.name} – SkillVerse`;
  const container = document.getElementById('skillDetail');
  if (!container) return;

  const catClass   = 'cat-' + skill.category.toLowerCase().replace(/[\s/&,]+/g, '-');
  const diffClass  = 'diff-' + skill.difficulty.toLowerCase();
  const doneSteps  = getProgress(skill.id);
  const totalSteps = (skill.roadmap || []).length;
  const pct        = totalSteps > 0 ? Math.round((doneSteps.length / totalSteps) * 100) : 0;
  const detailId   = skill.id;

  // ── Roadmap HTML (with checkboxes + progress)
  const roadmapHtml = (skill.roadmap || []).map((step, i) => {
    const isDone = doneSteps.includes(i);
    return `
      <div class="sv-roadmap-step ${isDone ? 'sv-step-done' : ''}">
        <div class="sv-step-left">
          <input type="checkbox" class="form-check-input sv-step-check" id="step-${skill.id}-${i}"
                 data-skill="${skill.id}" data-step="${i}"
                 ${isDone ? 'checked' : ''}
                 onchange="toggleStep(${skill.id}, ${i})" />
          <div class="roadmap-num ${isDone ? 'sv-step-num-done' : ''}" id="step-num-${skill.id}-${i}">${i + 1}</div>
        </div>
        <div class="roadmap-content">
          <label class="roadmap-label ${isDone ? 'sv-label-done' : ''}" for="step-${skill.id}-${i}">${step}</label>
        </div>
      </div>
      ${i < totalSteps - 1 ? '<div class="roadmap-connector"></div>' : ''}
    `;
  }).join('');

  // ── Resources HTML
  const resourcesHtml = (skill.resources || []).map((r, i) => {
    const typeClass = 'type-' + (r.type || 'link').toLowerCase().replace(/\s+/g, '-');
    return `
      <div class="resource-item">
        <div class="resource-type ${typeClass}">${r.type || 'Link'}</div>
        <div class="resource-info">
          <a href="${r.link}" target="_blank" rel="noopener noreferrer"
             class="resource-link"
             onclick="trackResourceClick(${skill.id}, ${i}, this)">
            ${r.title}
          </a>
        </div>
        <div class="resource-clicks" id="clicks-${skill.id}-${i}">
          <span>🖱️ ${r.clicks}</span>
        </div>
      </div>
    `;
  }).join('');

  // ── Career cards HTML
  const careerHtml = (skill.careerOpportunities || []).map(c => `
    <div class="career-card">
      <span class="career-icon">👤</span>
      <span>${c}</span>
    </div>
  `).join('');

  // ── Recommendations HTML
  const recsHtml = (skill.recommendations || []).map(r => {
    const rc = 'cat-' + r.category.toLowerCase().replace(/[\s/&,]+/g, '-');
    const rd = 'diff-' + r.difficulty.toLowerCase();
    return `
      <div class="mini-card" onclick="window.location.href='/skill?id=${r.id}'">
        <img src="${r.image}" alt="${r.name}" loading="lazy" />
        <div class="mini-card-body">
          <span class="mini-cat ${rc}">${r.category}</span>
          <h4>${r.name}</h4>
          <span class="mini-diff ${rd}">${r.difficulty}</span>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <!-- Hero Image -->
    <div class="detail-hero">
      <img class="detail-img" src="${skill.image}" alt="${skill.name}" />
      <div class="detail-hero-overlay">
        <div class="detail-badges">
          <span class="card-category ${catClass}">${skill.category}</span>
          <span class="stat-badge ${diffClass}">${skill.difficulty}</span>
          <span class="stat-badge">🔥 ${skill.trendScore} trend</span>
          <span class="stat-badge">⭐ ${skill.popularity} popularity</span>
          <span class="stat-badge">👁 ${skill.views.toLocaleString()} views</span>
        </div>
        <h1 class="detail-title">${skill.name}</h1>
        <div class="d-flex flex-wrap gap-3 align-items-center mt-3">
          <button class="sv-star-btn" id="starBtn" onclick="toggleStar(${detailId})" title="Star this skill">
            <span class="star-icon">☆</span>
            <span class="star-label">Star</span>
            <span class="sv-star-count ms-1" id="starCount">${skill.popularity}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- OVERVIEW -->
    <div class="detail-section">
      <h2><i class="bi bi-card-text me-2"></i>About</h2>
      <p class="detail-desc">${skill.description || ''}</p>
    </div>

    <div class="detail-section">
      <h2><i class="bi bi-tools me-2"></i>Technologies &amp; Tools</h2>
      <div class="tech-tags">
        ${(skill.skills || []).map(t => `<span class="tech-tag">${t}</span>`).join('')}
      </div>
    </div>

    <!-- ROADMAP -->
    <div class="detail-section">
      <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <h2 class="mb-0"><i class="bi bi-signpost-split me-2"></i>Learning Roadmap</h2>
        <button class="btn btn-sm sv-copy-btn"
                onclick="copyRoadmap(JSON.parse(decodeURIComponent('${encodeURIComponent(JSON.stringify(skill.roadmap || []))}')), this)">
          <i class="bi bi-clipboard me-1"></i>Copy
        </button>
      </div>
      <p class="sv-roadmap-hint">
        <i class="bi bi-check2-square me-1"></i>Check off each step as you complete it — progress is saved locally.
      </p>
      <div class="sv-progress-summary-row mb-3">
        <span class="sv-progress-label">Progress</span>
        <div class="progress sv-detail-progress flex-grow-1">
          <div class="progress-bar ${pct === 100 ? 'bg-success' : 'bg-primary'}" id="roadmapProgressBar"
               style="width:${pct}%" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
        <span class="sv-progress-pct" id="roadmapProgressPct">${pct}%</span>
      </div>
      <div class="roadmap">${roadmapHtml}</div>
    </div>

    <!-- RESOURCES -->
    <div class="detail-section">
      <h2><i class="bi bi-bookmarks me-2"></i>Learning Resources</h2>
      <p style="font-size:13px;color:var(--text3);margin-block-end:14px">
        <i class="bi bi-cursor me-1"></i>Click a resource to track it &amp; open the link.
      </p>
      <div class="resources-list">${resourcesHtml}</div>
    </div>

    <!-- CAREERS -->
    <div class="detail-section">
      <h2><i class="bi bi-briefcase me-2"></i>Career Opportunities</h2>
      <div class="career-grid">${careerHtml}</div>
    </div>

    <!-- RELATED -->
    ${(skill.recommendations && skill.recommendations.length > 0) ? `
    <div class="detail-section">
      <h2><i class="bi bi-stars me-2"></i>Similar Skills You Might Like</h2>
      <div class="recs-grid">${recsHtml}</div>
    </div>
    ` : ''}
  `;

  updateBookmarkBtn(detailId);
  updateProgressUI(detailId);
  initStarState(detailId);
}

// ╔═══════════════════════════════════════════════════════════════
//  STAR TOGGLE
// ╚═══════════════════════════════════════════════════════════════
async function toggleStar(id) {
  const key = `starred-${id}`;
  const currentStarred = localStorage.getItem(key) === '1';
  const newStarred = !currentStarred;
  localStorage.setItem(key, newStarred ? '1' : '0');
  
  try {
    await fetch(`${API}/${id}/star`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ starred: newStarred }) });
    const skill = await window.SkillVerseData.getSkillDetail(id);
    const countEl = document.getElementById('starCount');
    if (countEl && skill) countEl.textContent = skill.popularity;
  } catch (err) {
    const countEl = document.getElementById('starCount');
    if (countEl) {
      const currentCount = parseInt(countEl.textContent || '0', 10) || 0;
      countEl.textContent = Math.max(0, currentCount + (newStarred ? 1 : -1));
    }
    console.error('Star toggle failed:', err);
  }
  
  initStarState(id);
}

function initStarState(id) {
  const starred = localStorage.getItem(`starred-${id}`) === '1';
  const btn     = document.getElementById('starBtn');
  const icon    = btn?.querySelector('.star-icon');
  const label   = btn?.querySelector('.star-label');
  if (!btn) return;
  btn.classList.toggle('starred', starred);
  if (icon)  icon.textContent  = starred ? '⭐' : '☆';
  if (label) label.textContent = starred ? 'Starred' : 'Star';
}

// ╔═══════════════════════════════════════════════════════════════
//  BOOKMARKS (localStorage)
// ╚═══════════════════════════════════════════════════════════════
const LS_KEY = 'sv_saved';
function getSaved()    { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]').map(Number).filter(Boolean); } catch { return []; } }
function setSaved(arr) { localStorage.setItem(LS_KEY, JSON.stringify(arr)); }
function isSaved(id)   { return getSaved().includes(Number(id)); }

function toggleBookmark() {
  const params = new URLSearchParams(window.location.search);
  const id     = Number(params.get('id'));
  if (!id) return;
  const saved = getSaved();
  const idx   = saved.indexOf(id);
  if (idx === -1) saved.push(id); else saved.splice(idx, 1);
  setSaved(saved.filter((v, i, a) => a.indexOf(v) === i));
  updateBookmarkBtn(id);
  updateSavedBadge();
}

function updateBookmarkBtn(id) {
  const btn = document.getElementById('bookmarkBtn');
  if (!btn) return;
  const saved = isSaved(id);
  btn.innerHTML = saved
    ? '<i class="bi bi-bookmark-fill me-1"></i>Saved'
    : '<i class="bi bi-bookmark me-1"></i>Save';
  btn.classList.toggle('bookmarked', saved);
  btn.title = saved ? 'Remove from saved' : 'Save this skill';
}

function updateSavedBadge() {
  const badge  = document.getElementById('savedBadge');
  const navBtn = document.getElementById('savedNavBtn');
  const count  = getSaved().length;
  if (badge)  badge.textContent = count;
  if (navBtn) navBtn.style.display = count > 0 ? 'flex' : 'none';
}

function initSavedBadge() { updateSavedBadge(); }

function viewSaved() {
  const saved = getSaved();
  if (!saved.length) return;
  window.SkillVerseData.getAllSkills()
    .then(all => {
      const filtered = all.filter(s => saved.includes(Number(s.id)));
      const count = document.getElementById('skillCount');
      if (count) count.textContent = `${filtered.length} saved skill${filtered.length !== 1 ? 's' : ''}`;
      renderGrid(filtered);
      document.getElementById('skillsGrid')?.scrollIntoView({ behavior: 'smooth' });
    })
    .catch(err => console.error('viewSaved error:', err));
}

// ╔═══════════════════════════════════════════════════════════════
//  RESOURCE CLICK TRACKING
// ╚═══════════════════════════════════════════════════════════════
function trackResourceClick(skillId, resourceIdx, linkEl) {
  fetch(`${API}/${skillId}/resource/${resourceIdx}/click`, { method: 'POST' })
    .then(r => r.json())
    .then(data => {
      const el = document.getElementById(`clicks-${skillId}-${resourceIdx}`);
      if (el && data.clicks !== undefined) el.innerHTML = `<span>🖱️ ${data.clicks}</span>`;
    })
    .catch(err => {
      const el = document.getElementById(`clicks-${skillId}-${resourceIdx}`);
      if (el) {
        const current = parseInt((el.textContent || '0').replace(/\D/g, ''), 10) || 0;
        el.innerHTML = `<span>🖱️ ${current + 1}</span>`;
      }
      console.error('Click tracking failed:', err);
    });
}

// ╔═══════════════════════════════════════════════════════════════
//  COPY ROADMAP
// ╚═══════════════════════════════════════════════════════════════
function copyRoadmap(steps, btnEl) {
  const text = steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
  navigator.clipboard.writeText(text).then(() => {
    const orig = btnEl.innerHTML;
    btnEl.innerHTML = '<i class="bi bi-check2 me-1"></i>Copied!';
    btnEl.classList.add('copy-success');
    setTimeout(() => { btnEl.innerHTML = orig; btnEl.classList.remove('copy-success'); }, 2000);
  }).catch(() => {
    btnEl.textContent = '✗ Copy failed';
    setTimeout(() => { btnEl.innerHTML = '<i class="bi bi-clipboard me-1"></i>Copy'; }, 2000);
  });
}

// ╔═══════════════════════════════════════════════════════════════
//  HERO COUNTERS
// ╚═══════════════════════════════════════════════════════════════
function initHeroCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target   = parseInt(el.getAttribute('data-count'), 10);
    const suffix   = el.getAttribute('data-suffix') || '';
    const steps    = 38;
    const duration = 1400;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const eased = 1 - Math.pow(1 - step / steps, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (step >= steps) { el.textContent = target + suffix; clearInterval(timer); }
    }, duration / steps);
  });
}

// ╔═══════════════════════════════════════════════════════════════
//  PAGE TRANSITIONS
// ╚═══════════════════════════════════════════════════════════════
document.addEventListener('click', e => {
  const link = e.target.closest('a[href]');
  if (!link) return;
  const href = link.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('http') ||
      href.startsWith('javascript') || link.target === '_blank') return;
  e.preventDefault();
  document.body.classList.add('page-exit');
  setTimeout(() => { window.location.href = href; }, 185);
});

// ╔═══════════════════════════════════════════════════════════════
//  INIT – detect which page we're on
// ╚═══════════════════════════════════════════════════════════════
if (document.getElementById('skillsGrid')) {
  // Homepage
  initSavedBadge();
  initHeroCounters();
  loadCategories();
  loadSkills();
} else if (document.getElementById('skillDetail')) {
  // Detail page
  initSavedBadge();
  loadSkillDetail();
} else if (document.getElementById('profileStatsGrid')) {
  // Profile page - functions are in profile.js
  initSavedBadge();
}

// Newsletter Subscription Function
function subscribeNewsletter() {
  const email = document.getElementById('newsletterEmail')?.value.trim();
  if (!email) {
    showToast('Please enter your email address', 'error');
    return;
  }
  
  if (!isValidEmail(email)) {
    showToast('Please enter a valid email address', 'error');
    return;
  }
  
  showToast('Thank you for subscribing! 🎉', 'success');
  document.getElementById('newsletterEmail').value = '';
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── Toast Notification System ─────────────────────────────────────────────────
function showToast(message, type = 'info') {
  // Create toast container if it doesn't exist
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    container.style.zIndex = '1055';
    document.body.appendChild(container);
  }
  
  const toastId = 'toast_' + Date.now();
  const iconClass = type === 'success' ? 'bi-check-circle-fill' : 
                   type === 'error' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill';
  const bgClass = type === 'success' ? 'bg-success' : 
                 type === 'error' ? 'bg-danger' : 'bg-primary';
  
  const toastHtml = `
    <div class="toast" role="alert" id="${toastId}">
      <div class="toast-header ${bgClass} text-white">
        <i class="bi ${iconClass} me-2"></i>
        <strong class="me-auto">SkillVerse</strong>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
      </div>
      <div class="toast-body">${message}</div>
    </div>
  `;
  
  container.insertAdjacentHTML('beforeend', toastHtml);
  const toast = new bootstrap.Toast(document.getElementById(toastId));
  toast.show();
  
  // Remove toast from DOM after it's hidden
  document.getElementById(toastId).addEventListener('hidden.bs.toast', () => {
    document.getElementById(toastId)?.remove();
  });
}
