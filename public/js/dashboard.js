// -- dashboard.js - Analytics dashboard with live Chart.js refresh -----------

// -- Chart.js global defaults -------------------------------------------------
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = 'rgba(148,163,184,0.1)';
Chart.defaults.font.family = 'Inter, system-ui, sans-serif';
Chart.defaults.font.size = 12;

const PALETTE = ['#6366f1', '#06b6d4', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#3b82f6'];

// persist chart instances + previous stats for diff-animations
const _charts = {};
let _prevStats = {};
const REFRESH_INTERVAL = 30000; // 30 s

// -- Load / refresh all dashboard data ----------------------------------------
async function loadDashboard(isRefresh) {
  try {
    const data = await window.SkillVerseData.getDashboardData();

    renderStats(data.stats, isRefresh);

    if (!isRefresh) {
      renderTrendingChart(data.trending);
      renderCategoryChart(data.categoryDist);
      renderDifficultyChart(data.diffDist);
      renderViewsChart(data.mostViewed);
    } else {
      updateTrendingChart(data.trending);
      updateViewsChart(data.mostViewed);
    }

    renderTrendingTable(data.trending);
    renderPopularResources(data.popularResources);
    updateLastRefreshed();
  } catch (err) {
    console.error('Dashboard load failed:', err);
  }
}

function updateLastRefreshed() {
  const el = document.getElementById('lastRefreshed');
  if (el) el.textContent = 'Updated ' + new Date().toLocaleTimeString();
}

// -- Animated counter (from -> target) ----------------------------------------
function animateCount(el, from, target, duration, suffix, useLocale) {
  if (!el) return;
  const steps = 42;
  let step = 0;
  const timer = setInterval(() => {
    step++;
    const eased = 1 - Math.pow(1 - step / steps, 3);
    const val = Math.round(from + (target - from) * eased);
    el.textContent = useLocale ? val.toLocaleString() + suffix : val + suffix;
    if (step >= steps) {
      el.textContent = useLocale ? target.toLocaleString() + suffix : target + suffix;
      clearInterval(timer);
    }
  }, duration / steps);
}

// -- Stat Cards ----------------------------------------------------------------
function renderStats(stats, isRefresh) {
  if (!stats) return;
  const prev = isRefresh ? _prevStats : {};
  animateCount(document.getElementById('statTotal'), prev.totalSkills || 0, stats.totalSkills, 800, '', false);
  animateCount(document.getElementById('statAvgPop'), prev.avgPopularity || 0, stats.avgPopularity, 900, '%', false);
  animateCount(document.getElementById('statViews'), prev.totalViews || 0, stats.totalViews, 1100, '', true);
  animateCount(document.getElementById('statResources'), prev.totalResources || 0, stats.totalResources, 800, '', false);

  if (isRefresh) {
    document.querySelectorAll('.stat-card').forEach((card, i) => {
      const keys = ['totalSkills', 'avgPopularity', 'totalViews', 'totalResources'];
      if (stats[keys[i]] !== prev[keys[i]]) {
        card.classList.add('stat-updated');
        setTimeout(() => card.classList.remove('stat-updated'), 1200);
      }
    });
  }
  _prevStats = { ...stats };
}

// -- Chart live-update helpers -------------------------------------------------
function updateTrendingChart(trending) {
  const chart = _charts.trending;
  if (!chart || !trending) return;
  chart.data.labels = trending.map(s => shorten(s.name, 15));
  chart.data.datasets[0].data = trending.map(s => s.trendScore);
  chart.update('active');
}

function updateViewsChart(mostViewed) {
  const chart = _charts.views;
  if (!chart || !mostViewed) return;
  chart.data.labels = mostViewed.map(s => shorten(s.name, 15));
  chart.data.datasets[0].data = mostViewed.map(s => s.views);
  chart.update('active');
}

// -- Trending Skills Bar Chart -------------------------------------------------
function renderTrendingChart(trending) {
  const ctx = document.getElementById('trendingChart');
  if (!ctx || !trending) return;
  if (_charts.trending) _charts.trending.destroy();
  _charts.trending = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: trending.map(s => shorten(s.name, 15)),
      datasets: [{
        label: 'Trend Score',
        data: trending.map(s => s.trendScore),
        backgroundColor: PALETTE.slice(0, trending.length).map(c => c + 'cc'),
        borderColor: PALETTE.slice(0, trending.length),
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false
      }]
  },
    options: {
    responsive: true,
    animation: {
      duration: 900,
      easing: 'easeOutQuart',
      delay(ctx) { return ctx.type === 'data' ? ctx.dataIndex * 70 : 0; }
    },
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => ` Trend Score: ${ctx.parsed.y}` } }
    },
    scales: {
      y: { grid: { color: 'rgba(148,163,184,0.08)' }, beginAtZero: true },
      x: { grid: { display: false } }
    }
  }
  });
}

// -- Category Distribution Pie Chart ------------------------------------------
function renderCategoryChart(categoryDist) {
  const ctx = document.getElementById('categoryChart');
  if (!ctx || !categoryDist) return;
  if (_charts.category) _charts.category.destroy();
  const labels = Object.keys(categoryDist);
  const data = Object.values(categoryDist);
  _charts.category = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: PALETTE.slice(0, labels.length).map(c => c + 'cc'),
        borderColor: PALETTE.slice(0, labels.length),
        borderWidth: 2
      }]
  },
    options: {
    responsive: true,
    animation: { duration: 850, easing: 'easeOutQuart' },
    plugins: {
      legend: { position: 'right', labels: { padding: 14, font: { size: 12 }, boxWidth: 14 }
    }
  }
    }
  });
}

// -- Difficulty Doughnut Chart -------------------------------------------------
function renderDifficultyChart(diffDist) {
  const ctx = document.getElementById('difficultyChart');
  if (!ctx || !diffDist) return;
  if (_charts.difficulty) _charts.difficulty.destroy();
  _charts.difficulty = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Beginner', 'Intermediate', 'Advanced'],
      datasets: [{
        data: [diffDist.Beginner, diffDist.Intermediate, diffDist.Advanced],
        backgroundColor: ['rgba(16,185,129,0.8)', 'rgba(245,158,11,0.8)', 'rgba(239,68,68,0.8)'],
        borderColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 2
      }]
  },
    options: {
    responsive: true,
    cutout: '62%',
    animation: { duration: 850, easing: 'easeOutBack' },
    plugins: {
      legend: { position: 'bottom', labels: { padding: 18 } }
    }
  }
  });
}

// -- Most Viewed Horizontal Bar Chart -----------------------------------------
function renderViewsChart(mostViewed) {
  const ctx = document.getElementById('viewsChart');
  if (!ctx || !mostViewed) return;
  if (_charts.views) _charts.views.destroy();
  _charts.views = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: mostViewed.map(s => shorten(s.name, 15)),
      datasets: [{
        label: 'Views',
        data: mostViewed.map(s => s.views),
        backgroundColor: 'rgba(6,182,212,0.75)',
        borderColor: '#06b6d4',
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false
      }]
  },
    options: {
    indexAxis: 'y',
    responsive: true,
    animation: {
      duration: 900,
      easing: 'easeOutQuart',
      delay(ctx) { return ctx.type === 'data' ? ctx.dataIndex * 80 : 0; }
    },
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => ` Views: ${ctx.parsed.x.toLocaleString()}` } }
    },
    scales: {
      x: { grid: { color: 'rgba(148,163,184,0.08)' }, beginAtZero: true },
      y: { grid: { display: false } }
    }
  }
  });
}

// -- Trending Table ------------------------------------------------------------
function renderTrendingTable(trending) {
  const tbody = document.getElementById('trendingTable');
  if (!tbody || !trending) return;
  tbody.innerHTML = trending.map((s, i) => `
    <tr onclick="window.location.href='/skill?id=${s.id}'" style="cursor:pointer">
      <td><span class="rank-num rank-${i + 1}">${i + 1}</span></td>
      <td><strong>${s.name}</strong></td>
      <td><span class="trend-score">🔥 ${s.trendScore}</span></td>
    </tr>
  `).join('');
}

// -- Popular Resources List ----------------------------------------------------
function renderPopularResources(resources) {
  const container = document.getElementById('popularResources');
  if (!container || !resources) return;
  container.innerHTML = resources.map(r => {
    const typeClass = 'type-' + (r.type || 'link').toLowerCase().replace(/\s+/g, '-');
    return `
      <div class="popular-resource">
        <div class="resource-type ${typeClass}">${r.type || 'Link'}</div>
        <div class="popular-resource-info">
          <a href="${r.link}" target="_blank" rel="noopener noreferrer">${r.title}</a>
          <small>${r.skillName || ''}</small>
        </div>
        <span class="resource-clicks-badge">🖱️ ${r.clicks}</span>
      </div>
    `;
  }).join('');
}

// -- Your Learning Progress Stats ---------------------------------------------
async function renderProgressStats() {
  const progressSection = document.getElementById('progressSection');
  const progressStats = document.getElementById('progressStats');
  if (!progressStats) return;

  // Get progress data from localStorage
  const LS_PROGRESS = 'sv_progress';
  const LS_SAVED = 'sv_saved';
  let progressData = {};
  let savedIds = [];
  try {
    progressData = JSON.parse(localStorage.getItem(LS_PROGRESS) || '{}');
    savedIds = JSON.parse(localStorage.getItem(LS_SAVED) || '[]');
  } catch (e) {
    console.error('Failed to load progress data:', e);
  }

  const skillsWithProgress = Object.keys(progressData).filter(id => progressData[id].length > 0);
  
  if (skillsWithProgress.length === 0 && savedIds.length === 0) {
    progressStats.innerHTML = `
      <div class="text-center py-5" style="color: var(--text3);">
        <i class="bi bi-mortarboard" style="font-size: 48px; opacity: 0.3;"></i>
        <p class="mt-3">No learning progress yet</p>
        <p class="small">Start learning skills to see your progress here!</p>
        <a href="/" class="btn sv-btn-primary mt-3"><i class="bi bi-compass me-1"></i>Explore Skills</a>
      </div>
    `;
    return;
  }

  // Fetch all skills to get names and roadmap lengths
  try {
    const allSkills = await window.SkillVerseData.getAllSkills();
    
    let totalSteps = 0;
    let completedSteps = 0;
    const progressList = [];

    skillsWithProgress.forEach(skillId => {
      const skill = allSkills.find(s => String(s.id) === String(skillId));
      if (!skill) return;
      const roadmapLength = (skill.roadmap || []).length;
      const doneSteps = (progressData[skillId] || []).length;
      const pct = roadmapLength > 0 ? Math.round((doneSteps / roadmapLength) * 100) : 0;
      
      totalSteps += roadmapLength;
      completedSteps += doneSteps;
      
      progressList.push({
        id: skill.id,
        name: skill.name,
        category: skill.category,
        done: doneSteps,
        total: roadmapLength,
        pct
      });
    });

    progressList.sort((a, b) => b.pct - a.pct);

    const overallPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    progressStats.innerHTML = `
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-icon">📚</div>
            <div class="stat-value">${savedIds.length}</div>
            <div class="stat-label">Saved Skills</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-icon">📝</div>
            <div class="stat-value">${skillsWithProgress.length}</div>
            <div class="stat-label">In Progress</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-value">${completedSteps}</div>
            <div class="stat-label">Steps Completed</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-icon">🎯</div>
            <div class="stat-value">${overallPct}%</div>
            <div class="stat-label">Overall Progress</div>
          </div>
        </div>
      </div>
      ${progressList.length > 0 ? `
        <div>
          <h4 class="mb-3" style="font-size: 16px; color: var(--text1);">
            <i class="bi bi-list-check me-2"></i>Skills in Progress
          </h4>
          ${progressList.map(item => {
            const catClass = 'cat-' + item.category.toLowerCase().replace(/[\s/&,]+/g, '-');
            return `
              <div class="sv-progress-row mb-3" style="cursor: pointer;" onclick="window.location.href='/skill?id=${item.id}'">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <strong style="color: var(--text1);">${item.name}</strong>
                    <span class="card-category ${catClass} ms-2" style="font-size: 11px;">${item.category}</span>
                  </div>
                  <span style="color: var(--text2); font-size: 13px;">${item.done}/${item.total} steps</span>
                </div>
                <div class="progress sv-mini-progress">
                  <div class="progress-bar ${item.pct === 100 ? 'bg-success' : 'bg-primary'}" 
                       style="width: ${item.pct}%"></div>
                </div>
                <span style="color: var(--text3); font-size: 12px;">${item.pct}% complete</span>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}
    `;
  } catch (err) {
    console.error('Failed to render progress stats:', err);
    progressStats.innerHTML = '<p class="text-danger">Failed to load progress data</p>';
  }
}

// -- Helper -------------------------------------------------------------------
function shorten(str, len) {
  return str.length > len ? str.substring(0, len) + '...' : str;
}

// -- Page exit transition -----------------------------------------------------
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

// -- Init ---------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  loadDashboard(false);
  renderProgressStats();
  setInterval(() => {
    loadDashboard(true);
    renderProgressStats(); // Refresh progress stats too
  }, REFRESH_INTERVAL);

  // Refresh progress when page becomes visible (user comes back from another tab/page)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      renderProgressStats();
    }
  });

  // Refresh progress when localStorage changes (if using multiple tabs)
  window.addEventListener('storage', (e) => {
    if (e.key === 'sv_progress' || e.key === 'sv_saved') {
      renderProgressStats();
    }
  });

  // Refresh progress when window gets focus (user comes back from skill page)
  window.addEventListener('focus', () => {
    renderProgressStats();
  });
});

// Newsletter Subscription Function  
function subscribeNewsletter() {
  const email = document.getElementById('newsletterEmail')?.value.trim();
  if (!email) {
    alert('Please enter your email address');
    return;
  }
  
  if (!isValidEmail(email)) {
    alert('Please enter a valid email address');
    return;
  }
  
  alert('Thank you for subscribing! \uD83C\uDF89');
  document.getElementById('newsletterEmail').value = '';
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
