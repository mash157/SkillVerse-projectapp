const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const DATA_PATH = path.join(__dirname, '..', 'data', 'skills.json');

function load() {
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
}

function save(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// POST /api/resource-click
// Body: { skillId: number, resourceIndex: number }
router.post('/resource-click', (req, res) => {
  try {
    const { skillId, resourceIndex } = req.body;

    if (skillId == null || resourceIndex == null) {
      return res.status(400).json({ error: 'skillId and resourceIndex are required' });
    }
    if (typeof resourceIndex !== 'number' || resourceIndex < 0) {
      return res.status(400).json({ error: 'resourceIndex must be a non-negative number' });
    }

    const skills = load();
    const skillIdx = skills.findIndex(s => String(s.id) === String(skillId));

    if (skillIdx === -1) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    const resources = skills[skillIdx].resources;
    if (!resources || !resources[resourceIndex]) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    skills[skillIdx].resources[resourceIndex].clicks++;
    save(skills);

    res.json({
      success: true,
      clicks: skills[skillIdx].resources[resourceIndex].clicks
    });
  } catch (err) {
    console.error('resource-click error:', err);
    res.status(500).json({ error: 'Failed to track click' });
  }
});

module.exports = router;
