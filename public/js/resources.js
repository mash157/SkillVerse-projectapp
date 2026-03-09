// ── resources.js – Resource click tracking + skill starring ─────────────────

async function toggleStar(skillId) {
  const btn      = document.getElementById('starBtn');
  const countEl  = document.getElementById('starCount');
  const iconEl   = btn ? btn.querySelector('.star-icon')  : null;
  const labelEl  = btn ? btn.querySelector('.star-label') : null;
  if (!btn) return;

  const isStarred = btn.classList.contains('starred');
  const action    = isStarred ? 'unstar' : 'star';
  const prev      = parseInt(countEl ? countEl.textContent : '0', 10);

  // Optimistic UI update
  btn.classList.toggle('starred', !isStarred);
  btn.classList.toggle('unstarred', isStarred);
  btn.classList.add('star-pop');
  setTimeout(() => btn && btn.classList.remove('star-pop'), 500);

  if (action === 'star') {
    if (iconEl)  iconEl.textContent  = '⭐';
    if (labelEl) labelEl.textContent = 'Starred';
    if (countEl) countEl.textContent = prev + 1;
    btn.title = 'Click to unstar';
  } else {
    if (iconEl)  iconEl.textContent  = '☆';
    if (labelEl) labelEl.textContent = 'Star';
    if (countEl) countEl.textContent = Math.max(0, prev - 1);
    btn.title = 'Click to star';
  }

  try {
    const res = await fetch(`/api/skills/${skillId}/star`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    if (res.ok) {
      const data = await res.json();
      if (countEl) countEl.textContent = data.popularity;
      if (action === 'star') {
        localStorage.setItem(`starred-${skillId}`, '1');
      } else {
        localStorage.removeItem(`starred-${skillId}`);
      }
    } else {
      // Revert on failure
      btn.classList.toggle('starred', isStarred);
      btn.classList.toggle('unstarred', !isStarred);
      if (iconEl)  iconEl.textContent  = isStarred ? '⭐' : '☆';
      if (labelEl) labelEl.textContent = isStarred ? 'Starred' : 'Star';
      if (countEl) countEl.textContent = prev;
    }
  } catch (err) {
    console.warn('Star toggle failed:', err);
  }
}

// keep backward compat alias
const starSkill = toggleStar;


/**
 * Called when a user clicks a resource link.
 * POSTs to /api/resource-click to increment the click counter,
 * then updates the UI badge in real-time.
 */
async function trackResourceClick(skillId, resourceIndex, linkEl) {
  try {
    const res = await fetch('/api/resource-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId, resourceIndex })
    });

    if (res.ok) {
      const data = await res.json();
      const clicksEl = document.getElementById(`clicks-${skillId}-${resourceIndex}`);
      if (clicksEl) {
        clicksEl.innerHTML = `<span>🖱️ ${data.clicks}</span>`;
        clicksEl.classList.add('click-highlight');
        setTimeout(() => clicksEl.classList.remove('click-highlight'), 600);
      }
    }
  } catch (err) {
    // Silent fail – the link itself still opens normally
    console.warn('Could not track resource click:', err);
  }
  // Return true so the default anchor href opens the link
  return true;
}
