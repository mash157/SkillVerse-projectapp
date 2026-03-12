// ── profile.js – My Learning page ────────────────────────────────────────────
// NOTE: API and LS_PROGRESS are already defined in main.js (loaded before this file)

const LS_SAVED   = 'sv_saved';
let achievementStatsCache = null;
let achievementActionInProgress = false;
let profileSkillsCache = [];
let profileProgressCache = {};

// ── LocalStorage helpers ──────────────────────────────────────────────────────
function getSaved() {
  try { return JSON.parse(localStorage.getItem(LS_SAVED) || '[]').map(Number).filter(Boolean); } catch { return []; }
}
function getProgress(skillId) {
  try {
    const all = JSON.parse(localStorage.getItem(LS_PROGRESS) || '{}');
    return all[String(skillId)] || [];
  } catch { return []; }
}
function unsaveSkill(id) {
  const saved = getSaved().filter(s => s !== Number(id));
  localStorage.setItem(LS_SAVED, JSON.stringify(saved));
  loadProfile();
}

// ── Difficulty badge class ────────────────────────────────────────────────────
function diffClass(d) {
  return d === 'Beginner' ? 'sv-diff-beginner' : d === 'Intermediate' ? 'sv-diff-intermediate' : 'sv-diff-advanced';
}
function catClass(c) {
  return 'cat-' + c.toLowerCase().replace(/[\s/&,]+/g, '-');
}

// ── Render profile page ───────────────────────────────────────────────────────
async function loadProfile() {
  const savedIds = getSaved();

  if (!savedIds.length) {
    // No saved skills – show empties
    renderStats([], {});
    showEmpty('inProgressEmpty', 'inProgressGrid');
    showEmpty('savedEmpty', 'savedSkillsGrid');
    return;
  }

  try {
    const all    = await window.SkillVerseData.getAllSkills();
    const skills = all.filter(s => savedIds.includes(Number(s.id)));

    // Build progress snapshot
    const progressMap = {};
    skills.forEach(s => { progressMap[s.id] = getProgress(s.id); });

    profileSkillsCache = skills;
    profileProgressCache = progressMap;

    renderStats(skills, progressMap);
    renderInProgress(skills, progressMap);
    renderSavedSkills(skills, progressMap);
  } catch (err) {
    console.error('Profile load failed:', err);
  }
}

function showEmpty(emptyId, gridId) {
  const empty = document.getElementById(emptyId);
  const grid  = document.getElementById(gridId);
  if (empty) empty.style.display = 'block';
  if (grid)  grid.innerHTML = '';
  if (empty && grid) grid.appendChild(empty);
}

function renderStats(skills, progressMap) {
  const saved     = skills.length;
  let   completed = 0;
  let   totalPct  = 0;
  let   totalStepsCompleted = 0;

  skills.forEach(s => {
    const done       = (progressMap[s.id] || []).length;
    const roadmapLen = (s.roadmap || []).length || 8;
    totalStepsCompleted += done;
    if (done > 0) {
      totalPct += Math.min(100, Math.round((done / roadmapLen) * 100));
    }
    if (done >= roadmapLen && roadmapLen > 0) completed++;
  });

  const avgPct = skills.length > 0 ? Math.round(totalPct / skills.length) : 0;
  achievementStatsCache = {
    saved,
    completed,
    totalPct: avgPct,
    totalStepsCompleted
  };

  document.getElementById('pStatSaved').textContent     = saved;
  document.getElementById('pStatCompleted').textContent = completed;
  document.getElementById('pStatProgress').textContent  = avgPct + '%';
  document.getElementById('pStatSteps').textContent     = totalStepsCompleted;
}

function renderInProgress(skills, progressMap) {
  const grid  = document.getElementById('inProgressGrid');
  const empty = document.getElementById('inProgressEmpty');
  if (!grid) return;

  const inProgress = skills.filter(s => {
    const done = (progressMap[s.id] || []).length;
    const roadmapLen = (s.roadmap || []).length || 8;
    return done > 0 && done < roadmapLen;
  });

  if (!inProgress.length) {
    if (empty) { empty.style.display = 'block'; grid.innerHTML = ''; grid.appendChild(empty); }
    return;
  }
  if (empty) empty.style.display = 'none';

  grid.innerHTML = inProgress.map(s => {
    const steps  = progressMap[s.id] || [];
    const total  = (s.roadmap || []).length || 8;
    const pct    = Math.min(100, Math.round((steps.length / total) * 100));
    const cc     = catClass(s.category);
    const dc     = diffClass(s.difficulty);
    return `
      <div class="col-sm-6 col-lg-4">
        <div class="sv-profile-card" onclick="window.location.href='/skill?id=${s.id}'">
          <div class="sv-profile-card-img">
            <img src="${s.image}" alt="${s.name}" loading="lazy" />
            <span class="card-difficulty ${dc}">${s.difficulty}</span>
          </div>
          <div class="sv-profile-card-body">
            <span class="card-category ${cc}">${s.category}</span>
            <h5 class="sv-profile-card-title">${s.name}</h5>
            <div class="sv-progress-row">
              <div class="progress sv-mini-progress flex-grow-1">
                <div class="progress-bar bg-primary" style="width:${pct}%" role="progressbar"
                     aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"></div>
              </div>
              <span class="sv-progress-pct">${pct}%</span>
            </div>
            <small class="text-muted">${steps.length} of ${total} roadmap steps done</small>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderSavedSkills(skills, progressMap) {
  const grid  = document.getElementById('savedSkillsGrid');
  const empty = document.getElementById('savedEmpty');
  if (!grid) return;

  if (!skills.length) {
    if (empty) { empty.style.display = 'block'; grid.innerHTML = ''; grid.appendChild(empty); }
    return;
  }
  if (empty) empty.style.display = 'none';

  grid.innerHTML = skills.map(s => {
    const steps = progressMap[s.id] || [];
    const total = (s.roadmap || []).length || 8;
    const pct   = Math.min(100, Math.round((steps.length / total) * 100));
    const cc    = catClass(s.category);
    const dc    = diffClass(s.difficulty);
    const barColor = pct >= 80 ? 'bg-success' : pct >= 40 ? 'bg-warning' : 'bg-primary';
    return `
      <div class="col-sm-6 col-lg-4">
        <div class="sv-profile-card">
          <div class="sv-profile-card-img" onclick="window.location.href='/skill?id=${s.id}'" style="cursor:pointer">
            <img src="${s.image}" alt="${s.name}" loading="lazy" />
            <span class="card-difficulty ${dc}">${s.difficulty}</span>
          </div>
          <div class="sv-profile-card-body">
            <span class="card-category ${cc}">${s.category}</span>
            <h5 class="sv-profile-card-title" onclick="window.location.href='/skill?id=${s.id}'" style="cursor:pointer">${s.name}</h5>
            <div class="sv-progress-row">
              <div class="progress sv-mini-progress flex-grow-1">
                <div class="progress-bar ${barColor}" style="width:${pct}%" role="progressbar"></div>
              </div>
              <span class="sv-progress-pct">${pct}%</span>
            </div>
            <div class="d-flex justify-content-between align-items-center mt-2">
              <small class="text-muted"><i class="bi bi-check2-circle me-1"></i>${steps.length} of ${total} steps done</small>
              <button class="btn btn-sm sv-unsave-btn" onclick="unsaveSkill(${s.id})" title="Remove from saved">
                <i class="bi bi-bookmark-dash me-1"></i>Remove
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ── Init ──────────────────────────────────────────────────────────────────────
// Initialize profile page when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadProfile);
} else {
  loadProfile();
}

// Refresh profile when page becomes visible (user comes back)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    loadProfile();
  }
});

// Refresh when window gets focus
window.addEventListener('focus', () => {
  loadProfile();
});

// Refresh when localStorage changes (from other tabs)
window.addEventListener('storage', (e) => {
  if (e.key === 'sv_progress' || e.key === 'sv_saved') {
    loadProfile();
  }
});

// ── Export/Import Progress Functions ──────────────────────────────────────────
function exportProgress() {
  try {
    const progressData = {
      saved: JSON.parse(localStorage.getItem(LS_SAVED) || '[]'),
      progress: JSON.parse(localStorage.getItem(LS_PROGRESS) || '{}'),
      starred: {},
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    // Get all starred skills
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('starred-')) {
        progressData.starred[key] = localStorage.getItem(key);
      }
    });
    
    const blob = new Blob([JSON.stringify(progressData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skillverse-progress-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show success message
    showToast('Progress exported successfully!', 'success');
  } catch (err) {
    console.error('Export failed:', err);
    showToast('Export failed. Please try again.', 'error');
  }
}

function importProgress(input) {
  const file = input.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      
      // Validate data structure
      if (!data.version || !data.saved || !data.progress) {
        throw new Error('Invalid progress file format');
      }
      
      // Confirm import
      if (!confirm(`Import progress from ${data.exportDate ? new Date(data.exportDate).toLocaleDateString() : 'unknown date'}?\n\nThis will replace your current progress.`)) {
        return;
      }
      
      // Import data
      localStorage.setItem(LS_SAVED, JSON.stringify(data.saved));
      localStorage.setItem(LS_PROGRESS, JSON.stringify(data.progress));
      
      // Import starred skills
      if (data.starred) {
        Object.keys(data.starred).forEach(key => {
          localStorage.setItem(key, data.starred[key]);
        });
      }
      
      // Reload profile
      loadProfile();
      showToast('Progress imported successfully!', 'success');
      
    } catch (err) {
      console.error('Import failed:', err);
      showToast('Import failed. Please check your file format.', 'error');
    }
  };
  reader.readAsText(file);
  
  // Reset input
  input.value = '';
}

// ── Social Sharing Functions ──────────────────────────────────────────────────
async function shareProgress(platform) {
  const stats = await calculateStats();
  const text = `🚀 My SkillVerse Progress:\\n• ${stats.saved} skills saved\\n• ${stats.completed} completed\\n• ${stats.totalStepsCompleted} steps finished\\n• ${stats.totalPct}% average progress\\n\\nDiscover skills at`;
  const url = 'https://skillverse.dev';
  
  let shareUrl = '';
  switch (platform) {
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
      break;
    case 'linkedin':
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`;
      break;
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
      break;
  }
  
  if (shareUrl) {
    window.open(shareUrl, '_blank', 'width=600,height=400');
    showToast(`Shared your progress on ${platform.charAt(0).toUpperCase() + platform.slice(1)}! 🎉`, 'success');
  } else {
    showToast('Unable to share. Please try again.', 'error');
  }
}

// ── Achievement Card Functions ────────────────────────────────────────────────
async function generateAchievementCard() {
  if (achievementActionInProgress) return;
  achievementActionInProgress = true;
  setAchievementActionsBusy(true, 'Generating...');

  try {
    const stats = await calculateStats();
    achievementStatsCache = stats;
    const cardHtml = `
    <div class="sv-achievement-card">
      <div class="achievement-header">
        <div class="achievement-logo">
          <span class="logo-icon">◈</span>
          <span class="brand-name">SkillVerse</span>
        </div>
        <div class="achievement-date">${new Date().toLocaleDateString()}</div>
      </div>
      
      <div class="achievement-content">
        <div class="achievement-title">
          <i class="bi bi-trophy text-warning"></i>
          <h3>Learning Achievement</h3>
        </div>
        
        <div class="achievement-stats">
          <div class="stat-item">
            <div class="stat-number">${stats.saved}</div>
            <div class="stat-label">Skills Saved</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${stats.completed}</div>
            <div class="stat-label">Completed</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${stats.totalStepsCompleted}</div>
            <div class="stat-label">Steps Done</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${stats.totalPct}%</div>
            <div class="stat-label">Avg Progress</div>
          </div>
        </div>
        
        <div class="achievement-message">
          ${getAchievementMessage(stats)}
        </div>
      </div>
      
      <div class="achievement-footer">
        <span>Discover more skills at skillverse.dev</span>
      </div>
    </div>
  `;
  
    document.getElementById('achievementCard').innerHTML = cardHtml;
    const achievementPanel = document.getElementById('achievementPanel');
    if (achievementPanel) {
      achievementPanel.classList.remove('d-none');
      achievementPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } catch (error) {
    console.error('Achievement card generation failed:', error);
    showToast('Failed to generate achievement card. Please try again.', 'error');
  } finally {
    achievementActionInProgress = false;
    setAchievementActionsBusy(false);
  }
}

function closeAchievementPanel() {
  const achievementPanel = document.getElementById('achievementPanel');
  if (achievementPanel) {
    achievementPanel.classList.add('d-none');
  }
}

function getAchievementMessage(stats) {
  if (stats.completed >= 5) return "🌟 Skill Master! You've completed multiple learning paths!";
  if (stats.completed >= 3) return "🚀 Great Progress! You're becoming a multi-skilled professional!";
  if (stats.completed >= 1) return "🎯 Well Done! You've completed your first skill!";
  if (stats.totalStepsCompleted >= 20) return "📈 Learning Champion! You're making excellent progress!";
  if (stats.totalStepsCompleted >= 10) return "💪 Keep Going! You're building great learning momentum!";
  if (stats.saved >= 5) return "📚 Skill Explorer! You've curated a great learning list!";
  if (stats.saved >= 1) return "🔖 Getting Started! You've saved your first skill to learn!";
  return "🌱 Welcome to SkillVerse! Start your learning journey today!";
}

async function calculateStats() {
  if (achievementStatsCache) {
    return achievementStatsCache;
  }

  if (profileSkillsCache.length) {
    let saved = profileSkillsCache.length;
    let completed = 0;
    let totalPct = 0;
    let totalStepsCompleted = 0;

    profileSkillsCache.forEach((skill) => {
      const done = (profileProgressCache[skill.id] || []).length;
      const roadmapLen = (skill.roadmap || []).length || 8;
      totalStepsCompleted += done;
      if (done > 0) {
        totalPct += Math.min(100, Math.round((done / roadmapLen) * 100));
      }
      if (done >= roadmapLen && roadmapLen > 0) completed++;
    });

    achievementStatsCache = {
      saved,
      completed,
      totalPct: saved > 0 ? Math.round(totalPct / saved) : 0,
      totalStepsCompleted
    };
    return achievementStatsCache;
  }

  const savedIds = getSaved();
  const saved = savedIds.length;
  let completed = 0;
  let totalPct = 0;
  let totalStepsCompleted = 0;
  let totalSteps = 0;

  if (savedIds.length === 0) {
    return { saved: 0, completed: 0, totalPct: 0, totalStepsCompleted: 0 };
  }

  try {
    const allSkills = await window.SkillVerseData.getAllSkills();
    
    savedIds.forEach(id => {
      const done = getProgress(id).length;
      const skill = allSkills.find(s => String(s.id) === String(id));
      const roadmapLen = skill ? (skill.roadmap || []).length : 8; // fallback to 8 if not found
      
      totalSteps += roadmapLen;
      totalStepsCompleted += done;
      
      if (roadmapLen > 0) {
        const pct = Math.round((done / roadmapLen) * 100);
        totalPct += Math.min(100, pct);
        if (done >= roadmapLen) completed++;
      }
    });

    return {
      saved,
      completed,
      totalPct: saved > 0 ? Math.round(totalPct / saved) : 0,
      totalStepsCompleted,
      totalSteps
    };
  } catch (error) {
    console.error('Error calculating stats:', error);
    // Fallback to approximate calculation
    savedIds.forEach(id => {
      const done = getProgress(id).length;
      const roadmapLen = 8; // approximate
      totalStepsCompleted += done;
      if (done > 0) {
        totalPct += Math.min(100, Math.round((done / roadmapLen) * 100));
      }
      if (done >= roadmapLen) completed++;
    });

    return {
      saved,
      completed,
      totalPct: saved > 0 ? Math.round(totalPct / saved) : 0,
      totalStepsCompleted
    };
  }
}

function getCachedAchievementStats() {
  return achievementStatsCache;
}

function setAchievementActionsBusy(isBusy, label) {
  const actions = document.querySelectorAll('#achievementPanel .achievement-actions button, #achievementPanel .achievement-actions a');
  actions.forEach((action) => {
    if (action.tagName === 'BUTTON') {
      action.disabled = isBusy;
    }
    action.style.pointerEvents = isBusy ? 'none' : '';
    action.style.opacity = isBusy ? '0.65' : '';
  });

  const downloadButton = document.querySelector('#achievementPanel .achievement-actions .btn-success');
  if (downloadButton) {
    downloadButton.innerHTML = isBusy && label ? label : '<i class="bi bi-download me-2"></i>Download Achievement';
    if (!isBusy) {
      downloadButton.innerHTML = '<i class="bi bi-download me-2"></i>Download Achievement';
    }
  }
}

async function ensureAchievementStats() {
  if (achievementStatsCache) return achievementStatsCache;
  const stats = await calculateStats();
  achievementStatsCache = stats;
  return stats;
}

function getAchievementShareUrl() {
  return `${window.location.origin}/profile`;
}

function getAchievementShareText(stats) {
  const message = getAchievementMessage(stats);
  return `🏆 My SkillVerse Achievement! 

📚 ${stats.saved} Skills Saved | ✅ ${stats.completed} Completed  
🚀 ${stats.totalStepsCompleted} Steps Done | 📈 ${stats.totalPct}% Progress

${message}

#SkillVerse #Learning #CareerGrowth`;
}

function renderAchievementCanvas(stats) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 675;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas context unavailable');
  }

  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#111827');
  gradient.addColorStop(1, '#1f2937');
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = 'rgba(99, 102, 241, 0.45)';
  context.lineWidth = 6;
  context.strokeRect(32, 32, canvas.width - 64, canvas.height - 64);

  context.fillStyle = '#f8fafc';
  context.font = 'bold 44px Segoe UI';
  context.fillText('SkillVerse Achievement', 90, 110);

  context.fillStyle = '#94a3b8';
  context.font = '24px Segoe UI';
  context.fillText(new Date().toLocaleDateString(), 90, 155);

  const statBoxes = [
    { label: 'Skills Saved', value: String(stats.saved), x: 90 },
    { label: 'Completed', value: String(stats.completed), x: 360 },
    { label: 'Steps Done', value: String(stats.totalStepsCompleted), x: 630 },
    { label: 'Avg Progress', value: `${stats.totalPct}%`, x: 900 }
  ];

  statBoxes.forEach((box) => {
    context.fillStyle = 'rgba(30, 41, 59, 0.9)';
    context.fillRect(box.x, 210, 210, 150);
    context.strokeStyle = 'rgba(99, 102, 241, 0.35)';
    context.lineWidth = 2;
    context.strokeRect(box.x, 210, 210, 150);
    context.fillStyle = '#a5b4fc';
    context.font = 'bold 42px Segoe UI';
    context.fillText(box.value, box.x + 24, 282);
    context.fillStyle = '#cbd5e1';
    context.font = '20px Segoe UI';
    context.fillText(box.label, box.x + 24, 324);
  });

  const message = getAchievementMessage(stats);
  context.fillStyle = '#e2e8f0';
  context.font = 'italic 30px Segoe UI';
  wrapCanvasText(context, message, 90, 450, 1020, 40);

  context.fillStyle = '#64748b';
  context.font = '22px Segoe UI';
  context.fillText('Discover more skills at skillverse.dev', 90, 600);

  return canvas;
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to create image blob'));
      }
    }, 'image/png');
  });
}

function downloadAchievementCard() {
  const cardElement = document.getElementById('achievementCard');
  if (!cardElement || !cardElement.children.length) {
    showToast('Generate the achievement card first.', 'error');
    return;
  }
  if (achievementActionInProgress) return;

  achievementActionInProgress = true;
  setAchievementActionsBusy(true, 'Preparing...');

  ensureAchievementStats().then(async (stats) => {
    const canvas = renderAchievementCanvas(stats);
    const blob = await canvasToBlob(canvas);
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = `skillverse-achievement-${new Date().toISOString().split('T')[0]}.png`;
    link.href = blobUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    showToast('Achievement card downloaded successfully! 🎉', 'success');
  }).catch(async (err) => {
    console.error('Download failed:', err);
    await downloadCardFallback();
  }).finally(() => {
    achievementActionInProgress = false;
    setAchievementActionsBusy(false);
  });
}

function wrapCanvasText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (context.measureText(testLine).width > maxWidth && line) {
      context.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  });

  if (line) {
    context.fillText(line, x, currentY);
  }
}

async function downloadCardFallback() {
  const stats = await ensureAchievementStats();
  const textContent = `🏆 SkillVerse Achievement Card 🏆

📚 Skills Saved: ${stats.saved}
✅ Completed: ${stats.completed}  
🚀 Steps Done: ${stats.totalStepsCompleted}
📈 Avg Progress: ${stats.totalPct}%

${getAchievementMessage(stats)}

Discover more skills at skillverse.dev
Generated on ${new Date().toLocaleDateString()}`;

  const blob = new Blob([textContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `skillverse-achievement-${new Date().toISOString().split('T')[0]}.txt`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast('Achievement text downloaded! 📄', 'success');
}

async function nativeShareAchievement() {
  if (achievementActionInProgress) return;
  const stats = await ensureAchievementStats();
  const shareText = getAchievementShareText(stats);
  const shareUrl = getAchievementShareUrl();

  if (!navigator.share) {
    copyAchievementLink();
    showToast('Native share is not available. Link copied instead.', 'info');
    return;
  }

  try {
    achievementActionInProgress = true;
    setAchievementActionsBusy(true, 'Sharing...');
    const canvas = renderAchievementCanvas(stats);
    const blob = await canvasToBlob(canvas);
    const file = new File([blob], 'skillverse-achievement.png', { type: 'image/png' });
    const payload = {
      title: 'My SkillVerse Achievement',
      text: shareText,
      url: shareUrl
    };

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      payload.files = [file];
    }

    await navigator.share(payload);
    showToast('Achievement shared successfully! 🎉', 'success');
  } catch (error) {
    if (error && error.name !== 'AbortError') {
      console.error('Native share failed:', error);
      showToast('Share failed. Try one of the social buttons.', 'error');
    }
  } finally {
    achievementActionInProgress = false;
    setAchievementActionsBusy(false);
  }
}

function shareAchievementCard(platform) {
  if (achievementActionInProgress) return;
  const stats = getCachedAchievementStats();
  if (!stats) {
    showToast('Generate the achievement card first.', 'error');
    return;
  }
  const text = getAchievementShareText(stats);
  const url = getAchievementShareUrl();
  
  let shareUrl = '';
  switch (platform) {
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
      break;
    case 'linkedin':
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`;
      break;
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
      break;
  }
  
  if (shareUrl) {
    const shareWindow = window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
    if (shareWindow) {
      showToast(`Achievement shared on ${platform.charAt(0).toUpperCase() + platform.slice(1)}! 🎉`, 'success');
    } else {
      showToast('Popup blocked. Allow popups for sharing.', 'error');
    }
  }
}

function copyAchievementLink() {
  const url = `${getAchievementShareUrl()}?achievement=true`;
  updateAchievementLinkBox(url, false);
  
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(url).then(() => {
      showToast('Achievement link copied to clipboard! 📋', 'success');
      updateAchievementLinkBox(url, false);
    }).catch(() => {
      fallbackCopyTextToClipboard(url);
    });
  } else {
    fallbackCopyTextToClipboard(url);
  }
}

function fallbackCopyTextToClipboard(text) {
  updateAchievementLinkBox(text, true);
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.setAttribute('readonly', 'readonly');
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  textArea.setSelectionRange(0, text.length);
  
  try {
    const successful = document.execCommand('copy');
    if (successful) {
      showToast('Achievement link copied to clipboard! 📋', 'success');
    } else {
      selectAchievementLink();
      showToast('Use Select and press Ctrl+C to copy the link.', 'info');
    }
  } catch (err) {
    console.error('Copy fallback failed:', err);
    selectAchievementLink();
    showToast('Use Select and press Ctrl+C to copy the link.', 'info');
  }
  
  document.body.removeChild(textArea);
}

function updateAchievementLinkBox(url, shouldShow) {
  const linkBox = document.getElementById('achievementLinkBox');
  const input = document.getElementById('achievementShareUrl');
  if (!linkBox || !input) return;
  input.value = url;
  if (shouldShow) {
    linkBox.classList.remove('d-none');
  }
}

function selectAchievementLink() {
  const linkBox = document.getElementById('achievementLinkBox');
  const input = document.getElementById('achievementShareUrl');
  if (!linkBox || !input) return;
  linkBox.classList.remove('d-none');
  input.focus();
  input.select();
  input.setSelectionRange(0, input.value.length);
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

// ── Newsletter Subscription ───────────────────────────────────────────────────
function subscribeNewsletter() {
  const email = document.getElementById('newsletterEmail').value.trim();
  if (!email) {
    showToast('Please enter your email address', 'error');
    return;
  }
  
  if (!isValidEmail(email)) {
    showToast('Please enter a valid email address', 'error');
    return;
  }
  
  // Simulate API call (replace with actual newsletter service)
  showToast('Thank you for subscribing! 🎉', 'success');
  document.getElementById('newsletterEmail').value = '';
  
  // Here you would typically send to your newsletter service:
  // fetch('/api/newsletter/subscribe', { method: 'POST', body: JSON.stringify({email}) })
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


