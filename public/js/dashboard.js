// ── dashboard.js – Analytics dashboard with Chart.js ─────────────────────────

// ── Chart.js global defaults ──────────────────────────────────────────────────
Chart.defaults.color          = '#94a3b8';
Chart.defaults.borderColor    = 'rgba(148,163,184,0.1)';
Chart.defaults.font.family    = 'Inter, system-ui, sans-serif';
Chart.defaults.font.size      = 12;

const PALETTE = ['#6366f1','#06b6d4','#8b5cf6','#ec4899','#ef4444','#f59e0b','#10b981','#3b82f6'];

// ── Load and render all dashboard data ───────────────────────────────────────
async function loadDashboard() {
  try {
    const res  = await fetch('/api/skills/dashboard');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    renderStats(data.stats);
    renderTrendingChart(data.trending);
    renderCategoryChart(data.categoryDist);
    renderDifficultyChart(data.diffDist);
    renderViewsChart(data.mostViewed);
    renderTrendingTable(data.trending);
    renderPopularResources(data.popularResources);
  } catch (err) {
    console.error('Dashboard load failed:', err);
  }
}

// ── Animated counter helper ────────────────────────────────────────────────
function animateCount(el, target, duration, suffix, useLocale) {
  if (!el) return;
  const steps = 42;
  let step = 0;
  const timer = setInterval(() => {
    step++;
    const eased = 1 - Math.pow(1 - step / steps, 3);
    const val = Math.round(target * eased);
    el.textContent = useLocale ? val.toLocaleString() + suffix : val + suffix;
    if (step >= steps) {
      el.textContent = useLocale ? target.toLocaleString() + suffix : target + suffix;
      clearInterval(timer);
    }
  }, duration / steps);
}

// ── Stat Cards ─────────────────────────────────────────────────────────────
function renderStats(stats) {
  if (!stats) return;
  animateCount(document.getElementById('statTotal'),     stats.totalSkills,    800, '',  false);
  animateCount(document.getElementById('statAvgPop'),    stats.avgPopularity,  900, '%', false);
  animateCount(document.getElementById('statViews'),     stats.totalViews,    1100, '',  true);
  animateCount(document.getElementById('statResources'), stats.totalResources, 800, '',  false);
}

// ── Trending Skills Bar Chart ──────────────────────────────────────────────
function renderTrendingChart(trending) {
  const ctx = document.getElementById('trendingChart');
  if (!ctx || !trending) return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: trending.map(s => shorten(s.name, 15)),
      datasets: [{
        label: 'Trend Score',
        data: trending.map(s => s.trendScore),
        backgroundColor: PALETTE.slice(0, trending.length).map(c => c + 'cc'),
        borderColor:     PALETTE.slice(0, trending.length),
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

// ── Category Distribution Pie Chart ───────────────────────────────────────
function renderCategoryChart(categoryDist) {
  const ctx = document.getElementById('categoryChart');
  if (!ctx || !categoryDist) return;
  const labels = Object.keys(categoryDist);
  const data   = Object.values(categoryDist);
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: PALETTE.slice(0, labels.length).map(c => c + 'cc'),
        borderColor:     PALETTE.slice(0, labels.length),
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      animation: { duration: 850, easing: 'easeOutQuart' },
      plugins: {
        legend: { position: 'right', labels: { padding: 14, font: { size: 12 }, boxWidth: 14 } }
      }
    }
  });
}

// ── Difficulty Doughnut Chart ────────────────────────────────────────────
function renderDifficultyChart(diffDist) {
  const ctx = document.getElementById('difficultyChart');
  if (!ctx || !diffDist) return;
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Beginner', 'Intermediate', 'Advanced'],
      datasets: [{
        data:            [diffDist.Beginner, diffDist.Intermediate, diffDist.Advanced],
        backgroundColor: ['rgba(16,185,129,0.8)', 'rgba(245,158,11,0.8)', 'rgba(239,68,68,0.8)'],
        borderColor:     ['#10b981', '#f59e0b', '#ef4444'],
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

// ── Most Viewed Horizontal Bar Chart ────────────────────────────────────
function renderViewsChart(mostViewed) {
  const ctx = document.getElementById('viewsChart');
  if (!ctx || !mostViewed) return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: mostViewed.map(s => shorten(s.name, 15)),
      datasets: [{
        label: 'Views',
        data: mostViewed.map(s => s.views),
        backgroundColor: 'rgba(6,182,212,0.75)',
        borderColor:     '#06b6d4',
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

// ── Trending Table ───────────────────────────────────────────────────────
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

// ── Popular Resources List ───────────────────────────────────────────────
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

// ── Helper ───────────────────────────────────────────────────────────────
function shorten(str, len) {
  return str.length > len ? str.substring(0, len) + '…' : str;
}

// ── Page exit transition ─────────────────────────────────────────────────
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

// ── Init ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadDashboard);
