const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { getRecommendations } = require('../utils/recommendation');
const { trendScore, rankSkills } = require('../utils/ranking');
const { generateRoadmap } = require('../utils/roadmap');

const DATA_PATH = path.join(__dirname, '..', 'data', 'skills.json');

function load() {
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
}

function save(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// GET /api/skills/categories — must be BEFORE /:id
router.get('/categories', (req, res) => {
  try {
    const skills = load();
    const categories = [...new Set(skills.map(s => s.category))].sort();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

// GET /api/skills/dashboard — must be BEFORE /:id
router.get('/dashboard', (req, res) => {
  try {
    const skills = load();

    // Trending skills (top 5 by trendScore)
    const trending = rankSkills(skills).slice(0, 5).map(s => ({
      id: s.id,
      name: s.name,
      trendScore: trendScore(s)
    }));

    // Most viewed (top 5)
    const mostViewed = [...skills]
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
      .map(s => ({ id: s.id, name: s.name, views: s.views }));

    // Category distribution
    const categoryDist = {};
    skills.forEach(s => {
      categoryDist[s.category] = (categoryDist[s.category] || 0) + 1;
    });

    // Difficulty distribution
    const diffDist = { Beginner: 0, Intermediate: 0, Advanced: 0 };
    skills.forEach(s => {
      if (diffDist[s.difficulty] !== undefined) diffDist[s.difficulty]++;
    });

    // Most clicked resources
    const allResources = [];
    skills.forEach(skill => {
      (skill.resources || []).forEach(r => {
        allResources.push({ skillName: skill.name, skillId: skill.id, ...r });
      });
    });
    const popularResources = allResources
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);

    // Summary stats
    const stats = {
      totalSkills: skills.length,
      avgPopularity: Math.round(
        skills.reduce((sum, s) => sum + s.popularity, 0) / skills.length
      ),
      totalViews: skills.reduce((sum, s) => sum + s.views, 0),
      totalResources: allResources.length
    };

    res.json({ trending, mostViewed, categoryDist, diffDist, popularResources, stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// GET /api/skills
router.get('/', (req, res) => {
  try {
    let skills = load();
    const { q, category, difficulty, sort } = req.query;

    if (q) {
      const query = q.toLowerCase();
      skills = skills.filter(s =>
        s.name.toLowerCase().includes(query) ||
        (s.description || '').toLowerCase().includes(query) ||
        (s.skills || []).some(sk => sk.toLowerCase().includes(query))
      );
    }
    if (category) skills = skills.filter(s => s.category === category);
    if (difficulty) skills = skills.filter(s => s.difficulty === difficulty);

    if (sort === 'popular') {
      skills = [...skills].sort((a, b) => b.popularity - a.popularity);
    } else if (sort === 'views') {
      skills = [...skills].sort((a, b) => b.views - a.views);
    } else {
      skills = rankSkills(skills);
    }

    skills = skills.map(s => ({ ...s, trendScore: trendScore(s) }));
    res.json(skills);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load skills' });
  }
});

// GET /api/skills/suggest?q=... — smart category + skill suggestions
router.get('/suggest', (req, res) => {
  try {
    const q = (req.query.q || '').toLowerCase().trim();
    if (!q || q.length < 2) return res.json([]);

    const skills = load();
    const seen = new Set();
    const results = [];

    const categoryHints = {
      'ai':         'Technology',    'artificial':   'Technology',    'neural':     'Technology',
      'machine':    'Data Science',  'deep learning':'Data Science',  'data':       'Data Science',
      'python':     'Technology',    'ml':           'Data Science',  'model':      'Data Science',
      'web':        'Web Development','html':         'Web Development','css':        'Web Development',
      'javascript': 'Web Development','react':        'Web Development','node':       'Web Development',
      'design':     'Design',        'figma':        'Design',        'ui':         'Design',
      'ux':         'Design',        'prototype':    'Design',        'wireframe':  'Design',
      'security':   'Security',      'cyber':        'Security',      'hack':       'Security',
      'network':    'Security',      'encrypt':      'Security',      'firewall':   'Security',
      'devops':     'DevOps',        'docker':       'DevOps',        'cloud':      'DevOps',
      'aws':        'DevOps',        'ci':           'DevOps',        'pipeline':   'DevOps',
      'mobile':     'Mobile',        'android':      'Mobile',        'ios':        'Mobile',
      'app':        'Mobile',        'flutter':      'Mobile',        'swift':      'Mobile',
      'marketing':  'Business',      'seo':          'Business',      'analytics':  'Business',
      'blockchain': 'Technology',    'crypto':       'Technology',    'nft':        'Technology',
    };

    let suggestedCategory = null;
    for (const [keyword, cat] of Object.entries(categoryHints)) {
      if (q.includes(keyword)) { suggestedCategory = cat; break; }
    }

    for (const s of skills) {
      const score = [
        s.name.toLowerCase().includes(q) ? 3 : 0,
        (s.skills || []).some(sk => sk.toLowerCase().includes(q)) ? 2 : 0,
        (s.description || '').toLowerCase().includes(q) ? 1 : 0,
        suggestedCategory && s.category === suggestedCategory ? 2 : 0,
      ].reduce((a, b) => a + b, 0);

      if (score > 0 && !seen.has(s.id)) {
        seen.add(s.id);
        results.push({ id: s.id, name: s.name, category: s.category, score,
          suggestedCategory: suggestedCategory || null });
      }
    }

    if (results.length === 0 && suggestedCategory) {
      skills
        .filter(s => s.category === suggestedCategory)
        .slice(0, 4)
        .forEach(s => results.push({ id: s.id, name: s.name, category: s.category,
          score: 1, suggestedCategory }));
    }

    results.sort((a, b) => b.score - a.score);
    res.json(results.slice(0, 6));
  } catch (err) {
    res.status(500).json({ error: 'Suggest failed' });
  }
});

// GET /api/skills/:id
router.get('/:id', (req, res) => {
  try {
    const skills = load();
    const idx = skills.findIndex(s => String(s.id) === String(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Skill not found' });

    // Increment views
    skills[idx].views++;
    save(skills);

    const skill = skills[idx];
    const roadmap = generateRoadmap(skill);
    const recommendations = getRecommendations(skill, skills);

    res.json({
      ...skill,
      trendScore: trendScore(skill),
      roadmap,
      recommendations: recommendations.map(r => ({
        id: r.id,
        name: r.name,
        category: r.category,
        difficulty: r.difficulty,
        popularity: r.popularity,
        image: r.image,
        trendScore: trendScore(r)
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load skill' });
  }
});

module.exports = router;
