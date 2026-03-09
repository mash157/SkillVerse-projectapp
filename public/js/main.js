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

// ═══════════════════════════════════════════════════════════════
//  HOMEPAGE – Skill Card Grid
// ═══════════════════════════════════════════════════════════════

async function loadSkills() {
  const q          = (document.getElementById('searchInput')?.value     || '').trim();
  const category   =  document.getElementById('categoryFilter')?.value  || '';
  const difficulty =  document.getElementById('difficultyFilter')?.value || '';
  const sort       =  document.getElementById('sortFilter')?.value       || 'trendScore';

  const params = new URLSearchParams();
  if (q)          params.set('q', q);
  if (category)   params.set('category', category);
  if (difficulty) params.set('difficulty', difficulty);
  if (sort)       params.set('sort', sort);

  try {
    const res    = await fetch(`${API}?${params.toString()}`);
    const skills = await res.json();
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

    return `
      <div class="skill-card" onclick="window.location.href='/skill?id=${skill.id}'"
           style="animation-delay:${i * 0.04}s">
        <div class="card-img-wrap">
          <img src="${skill.image}" alt="${skill.name}" loading="lazy" />
          <span class="card-difficulty ${diffClass}">${skill.difficulty}</span>
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
    const res  = await fetch(`${API}/categories`);
    const cats = await res.json();
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

// ═══════════════════════════════════════════════════════════════
//  DETAIL PAGE – Skill Detail
// ═══════════════════════════════════════════════════════════════

async function loadSkillDetail() {
  const params = new URLSearchParams(window.location.search);
  const id     = params.get('id');
  if (!id) { window.location.href = '/'; return; }

  try {
    const res = await fetch(`${API}/${id}`);
    if (!res.ok) { window.location.href = '/'; return; }
    const skill = await res.json();
    renderDetail(skill);
  } catch (err) {
    console.error('Failed to load skill:', err);
  }
}

function renderDetail(skill) {
  document.title = `${skill.name} – SkillVerse`;
  const container = document.getElementById('skillDetail');
  if (!container) return;

  const catClass  = 'cat-' + skill.category.toLowerCase().replace(/[\s/&,]+/g, '-');
  const diffClass = 'diff-' + skill.difficulty.toLowerCase();

  // ── Roadmap HTML
  const roadmapHtml = (skill.roadmap || []).map((step, i, arr) => `
    <div class="roadmap-step">
      <div class="roadmap-num">${i + 1}</div>
      <div class="roadmap-content">
        <span class="roadmap-label">${step}</span>
      </div>
    </div>
    ${i < arr.length - 1 ? '<div class="roadmap-connector"></div>' : ''}
  `).join('');

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

  const params2 = new URLSearchParams(window.location.search);
  const detailId = Number(params2.get('id'));
  updateBookmarkBtn(detailId);

  const starred = localStorage.getItem(`starred-${skill.id}`) === '1';

  container.innerHTML = `
    <div class="detail-hero">
      <img src="${skill.image}" alt="${skill.name}" class="detail-img" />
      <div class="detail-hero-overlay">
        <span class="cat-badge ${catClass}">${skill.category}</span>
        <h1 class="detail-title">${skill.name}</h1>
        <div class="detail-badges">
          <span class="diff-badge ${diffClass}">${skill.difficulty}</span>
          <span class="stat-badge" id="liveViews">👁️ ${skill.views.toLocaleString()} Views</span>
          <span class="stat-badge">🔥 ${skill.trendScore} Trend Score</span>
          <button class="star-btn${starred ? ' starred' : ''}" id="starBtn"
            onclick="toggleStar(${skill.id})" title="${starred ? 'Click to unstar' : 'Click to star'}">
            <span class="star-icon">${starred ? '⭐' : '☆'}</span>
            <span id="starCount">${skill.popularity}</span>
            <span class="star-label">${starred ? 'Starred' : 'Star'}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="detail-body">

      <section class="detail-section">
        <h2>About This Skill</h2>
        <p class="detail-desc">${skill.description}</p>
      </section>

      <section class="detail-section">
        <h2>🛠️ Technologies &amp; Tools</h2>
        <div class="tech-tags">
          ${(skill.skills || []).map(t => `<span class="tech-tag">${t}</span>`).join('')}
        </div>
      </section>

      <section class="detail-section">
        <h2>💼 Career Opportunities</h2>
        <div class="career-grid">${careerHtml}</div>
      </section>

      <section class="detail-section">
        <h2>🗺️ Learning Roadmap</h2>
        <button class="copy-roadmap-btn" onclick="copyRoadmap(JSON.parse(decodeURIComponent('${encodeURIComponent(JSON.stringify(skill.roadmap || []))}')), this)">📋 Copy Roadmap</button>
        <div class="roadmap">${roadmapHtml}</div>
      </section>

      <section class="detail-section">
        <h2>📚 Learning Resources</h2>
        <p style="font-size:13px;color:var(--text3);margin-block-end:14px">Click any resource to track it &amp; open the link.</p>
        <div class="resources-list">${resourcesHtml}</div>
      </section>

      ${skill.recommendations && skill.recommendations.length > 0 ? `
      <section class="detail-section">
        <h2>🎯 Similar Skills You Might Like</h2>
        <div class="recs-grid">${recsHtml}</div>
      </section>
      ` : ''}

    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════
//  BOOKMARKS (localStorage)
// ═══════════════════════════════════════════════════════════════
const LS_KEY = 'sv_saved';
function getSaved()     { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]').map(Number).filter(Boolean); } catch { return []; } }
function setSaved(arr)  { localStorage.setItem(LS_KEY, JSON.stringify(arr)); }
function isSaved(id)    { return getSaved().includes(Number(id)); }

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
  btn.innerHTML = saved ? '🔖 Saved' : '🔖 Save';
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

function initSavedBadge() {
  updateSavedBadge();
}

function viewSaved() {
  const saved = getSaved();
  if (!saved.length) return;
  fetch(API)
    .then(r => r.json())
    .then(all => {
      const filtered = all.filter(s => saved.includes(Number(s.id)));
      const count = document.getElementById('skillCount');
      if (count) count.textContent = `${filtered.length} saved skill${filtered.length !== 1 ? 's' : ''}`;
      renderGrid(filtered);
      document.getElementById('skillsGrid')?.scrollIntoView({ behavior: 'smooth' });
    })
    .catch(err => console.error('viewSaved error:', err));
}

// ═══════════════════════════════════════════════════════════════
//  COPY ROADMAP
// ═══════════════════════════════════════════════════════════════
function copyRoadmap(steps, btnEl) {
  const text = steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
  navigator.clipboard.writeText(text).then(() => {
    btnEl.textContent = '✅ Roadmap Copied!';
    btnEl.classList.add('copy-success');
    setTimeout(() => { btnEl.textContent = '📋 Copy Roadmap'; btnEl.classList.remove('copy-success'); }, 2000);
  }).catch(() => {
    btnEl.textContent = '❌ Copy failed';
    setTimeout(() => { btnEl.textContent = '📋 Copy Roadmap'; }, 2000);
  });
}

// ═══════════════════════════════════════════════════════════════
//  HERO COUNTERS
// ═══════════════════════════════════════════════════════════════
function initHeroCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.getAttribute('data-count'), 10);
    const suffix = el.getAttribute('data-suffix') || '';
    const steps  = 38;
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

// ═══════════════════════════════════════════════════════════════
//  PAGE TRANSITIONS
// ═══════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════
//  INIT – detect which page we're on
// ═══════════════════════════════════════════════════════════════
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
}
