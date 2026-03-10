// ── resources.js – Resource click tracking ────────────────────────────────────

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
