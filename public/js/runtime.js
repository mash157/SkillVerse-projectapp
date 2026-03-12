const SKILLVERSE_API = '/api/skills';
const SKILLVERSE_STATIC_SKILLS_URL = '/data/skills.json';
let __skillVerseSkillsPromise = null;

const SKILLVERSE_CLIENT_ROADMAPS = {
  Technology: [
    'Computer Science Fundamentals',
    'Programming Basics (Python/Java)',
    'Data Structures & Algorithms',
    'System Design Principles',
    'Advanced Topics & Specialization',
    'Real-World Projects & Portfolio'
  ],
  'Web Development': [
    'HTML & Semantic Markup',
    'CSS & Responsive Design',
    'JavaScript Fundamentals',
    'Frontend Framework (React/Vue/Angular)',
    'Backend Development (Node.js/Python)',
    'Database Design (SQL/MongoDB)',
    'REST APIs & Authentication',
    'DevOps & Deployment'
  ],
  'Data Science': [
    'Statistics & Probability',
    'Python for Data Science',
    'Data Wrangling (Pandas/NumPy)',
    'Data Visualization (Matplotlib/Seaborn)',
    'Machine Learning (Scikit-Learn)',
    'Deep Learning (TensorFlow/PyTorch)',
    'Big Data & Model Deployment'
  ],
  Design: [
    'Design Fundamentals & Principles',
    'Color Theory & Typography',
    'User Research & UX Thinking',
    'Wireframing & Information Architecture',
    'Prototyping in Figma / Adobe XD',
    'Interaction Design & Animation',
    'Design Systems & Developer Handoff'
  ],
  Security: [
    'Networking Fundamentals (TCP/IP)',
    'Linux Command Line Mastery',
    'Cryptography & PKI',
    'Web Application Security (OWASP)',
    'Network Security & Firewalls',
    'Ethical Hacking & Penetration Testing',
    'Incident Response & Digital Forensics'
  ],
  DevOps: [
    'Linux & Shell Scripting',
    'Version Control (Git & GitHub)',
    'CI/CD Pipelines (GitHub Actions/Jenkins)',
    'Docker & Containerization',
    'Kubernetes & Orchestration',
    'Cloud Services (AWS/GCP/Azure)',
    'Monitoring & Observability (Prometheus/Grafana)'
  ],
  Business: [
    'Marketing & Consumer Psychology',
    'Digital Analytics & Google Analytics',
    'SEO & Content Marketing',
    'Social Media Strategy',
    'Email Marketing & Automation',
    'Paid Advertising (Google/Meta)',
    'Growth Experiments & Measurement'
  ],
  Mobile: [
    'Mobile UI/UX Principles',
    'React Native or Flutter Basics',
    'State Management',
    'Device APIs & Sensors',
    'REST API Integration',
    'Performance Optimization',
    'App Store Submission & Distribution'
  ]
};

function skillVerseTrendScore(skill) {
  return (skill.popularity || 0) + (skill.views || 0) + (skill.growth || 0);
}

function skillVerseGenerateRoadmap(skill) {
  return SKILLVERSE_CLIENT_ROADMAPS[skill.category] || skill.skills || [
    'Learn the Fundamentals',
    'Build Practice Projects',
    'Contribute to Open Source',
    'Get Industry Certified',
    'Build Your Portfolio'
  ];
}

function skillVerseGetRecommendations(skill, allSkills, limit = 4) {
  const existing = new Set(skill.skills || []);
  const levels = { Beginner: 0, Intermediate: 1, Advanced: 2 };
  const myLevel = levels[skill.difficulty] || 0;

  return allSkills
    .filter((candidate) => candidate.id !== skill.id)
    .map((candidate) => {
      const categoryScore = candidate.category === skill.category ? 40 : 0;
      const overlap = (candidate.skills || []).filter((tag) => existing.has(tag)).length;
      const overlapScore = Math.min(45, overlap * 15);
      const candidateLevel = levels[candidate.difficulty] || 0;
      const diff = Math.abs(myLevel - candidateLevel);
      const diffScore = diff === 0 ? 20 : diff === 1 ? 10 : 0;
      const trendBoost = Math.min(25, Math.round(skillVerseTrendScore(candidate) / 80));
      return { ...candidate, _recScore: categoryScore + overlapScore + diffScore + trendBoost };
    })
    .filter((candidate) => candidate._recScore > 0)
    .sort((a, b) => b._recScore - a._recScore)
    .slice(0, limit)
    .map(({ _recScore, ...candidate }) => candidate);
}

function skillVerseNormalizeSkill(skill, allSkills) {
  const normalized = {
    ...skill,
    roadmap: skill.roadmap || skillVerseGenerateRoadmap(skill),
    trendScore: skill.trendScore || skillVerseTrendScore(skill)
  };

  if (allSkills) {
    normalized.recommendations = skill.recommendations || skillVerseGetRecommendations(normalized, allSkills);
  }

  return normalized;
}

async function skillVerseGetAllSkills() {
  if (__skillVerseSkillsPromise) return __skillVerseSkillsPromise;

  __skillVerseSkillsPromise = (async () => {
    try {
      const response = await fetch(SKILLVERSE_API);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (_) {
      const response = await fetch(SKILLVERSE_STATIC_SKILLS_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const rawSkills = await response.json();
      const normalized = rawSkills.map((skill) => skillVerseNormalizeSkill(skill));
      return normalized.map((skill) => skillVerseNormalizeSkill(skill, normalized));
    }
  })();

  return __skillVerseSkillsPromise;
}

async function skillVerseGetCategories() {
  const skills = await skillVerseGetAllSkills();
  return [...new Set(skills.map((skill) => skill.category))].sort();
}

async function skillVerseGetSkillDetail(id) {
  const skills = await skillVerseGetAllSkills();
  const skill = skills.find((candidate) => String(candidate.id) === String(id));
  return skill ? skillVerseNormalizeSkill(skill, skills) : null;
}

async function skillVerseGetCompareSkills(ids) {
  const skills = await skillVerseGetAllSkills();
  return ids
    .slice(0, 2)
    .map((id) => skills.find((skill) => String(skill.id) === String(id)))
    .filter(Boolean)
    .map((skill) => skillVerseNormalizeSkill(skill, skills));
}

async function skillVerseGetFilteredSkills(filters = {}) {
  let skills = await skillVerseGetAllSkills();
  const { q = '', category = '', difficulty = '', sort = 'trendScore' } = filters;
  const query = q.trim().toLowerCase();

  if (query) {
    skills = skills.filter((skill) =>
      skill.name.toLowerCase().includes(query) ||
      (skill.description || '').toLowerCase().includes(query) ||
      (skill.skills || []).some((tag) => tag.toLowerCase().includes(query))
    );
  }
  if (category) skills = skills.filter((skill) => skill.category === category);
  if (difficulty) skills = skills.filter((skill) => skill.difficulty === difficulty);

  if (sort === 'popular') {
    skills = [...skills].sort((a, b) => b.popularity - a.popularity);
  } else if (sort === 'views') {
    skills = [...skills].sort((a, b) => b.views - a.views);
  } else {
    skills = [...skills].sort((a, b) => (b.trendScore || skillVerseTrendScore(b)) - (a.trendScore || skillVerseTrendScore(a)));
  }

  return skills;
}

async function skillVerseGetSuggestions(q) {
  const query = (q || '').toLowerCase().trim();
  if (!query || query.length < 2) return [];

  const skills = await skillVerseGetAllSkills();
  const seen = new Set();
  const results = [];
  const categoryHints = {
    ai: 'Technology', artificial: 'Technology', neural: 'Technology',
    machine: 'Data Science', data: 'Data Science', model: 'Data Science',
    web: 'Web Development', html: 'Web Development', css: 'Web Development', javascript: 'Web Development', react: 'Web Development', node: 'Web Development',
    design: 'Design', figma: 'Design', ui: 'Design', ux: 'Design', prototype: 'Design', wireframe: 'Design',
    security: 'Security', cyber: 'Security', hack: 'Security', network: 'Security', encrypt: 'Security', firewall: 'Security',
    devops: 'DevOps', docker: 'DevOps', cloud: 'DevOps', aws: 'DevOps', ci: 'DevOps', pipeline: 'DevOps',
    mobile: 'Mobile', android: 'Mobile', ios: 'Mobile', app: 'Mobile', flutter: 'Mobile', swift: 'Mobile',
    marketing: 'Business', seo: 'Business', analytics: 'Business', blockchain: 'Technology', crypto: 'Technology', nft: 'Technology'
  };

  let suggestedCategory = null;
  Object.entries(categoryHints).some(([keyword, category]) => {
    if (query.includes(keyword)) {
      suggestedCategory = category;
      return true;
    }
    return false;
  });

  skills.forEach((skill) => {
    const score = [
      skill.name.toLowerCase().includes(query) ? 3 : 0,
      (skill.skills || []).some((tag) => tag.toLowerCase().includes(query)) ? 2 : 0,
      (skill.description || '').toLowerCase().includes(query) ? 1 : 0,
      suggestedCategory && skill.category === suggestedCategory ? 2 : 0
    ].reduce((sum, value) => sum + value, 0);

    if (score > 0 && !seen.has(skill.id)) {
      seen.add(skill.id);
      results.push({
        id: skill.id,
        name: skill.name,
        category: skill.category,
        score,
        suggestedCategory: suggestedCategory || null
      });
    }
  });

  if (results.length === 0 && suggestedCategory) {
    skills
      .filter((skill) => skill.category === suggestedCategory)
      .slice(0, 4)
      .forEach((skill) => results.push({
        id: skill.id,
        name: skill.name,
        category: skill.category,
        score: 1,
        suggestedCategory
      }));
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 6);
}

async function skillVerseGetDashboardData() {
  const skills = await skillVerseGetAllSkills();
  const ranked = [...skills].sort((a, b) => (b.trendScore || skillVerseTrendScore(b)) - (a.trendScore || skillVerseTrendScore(a)));
  const trending = ranked.slice(0, 5).map((skill) => ({ id: skill.id, name: skill.name, trendScore: skill.trendScore || skillVerseTrendScore(skill) }));
  const mostViewed = [...skills].sort((a, b) => b.views - a.views).slice(0, 5).map((skill) => ({ id: skill.id, name: skill.name, views: skill.views }));
  const categoryDist = {};
  const diffDist = { Beginner: 0, Intermediate: 0, Advanced: 0 };
  const allResources = [];

  skills.forEach((skill) => {
    categoryDist[skill.category] = (categoryDist[skill.category] || 0) + 1;
    if (diffDist[skill.difficulty] !== undefined) diffDist[skill.difficulty]++;
    (skill.resources || []).forEach((resource) => {
      allResources.push({ skillName: skill.name, skillId: skill.id, ...resource });
    });
  });

  return {
    trending,
    mostViewed,
    categoryDist,
    diffDist,
    popularResources: [...allResources].sort((a, b) => b.clicks - a.clicks).slice(0, 5),
    stats: {
      totalSkills: skills.length,
      avgPopularity: Math.round(skills.reduce((sum, skill) => sum + skill.popularity, 0) / Math.max(skills.length, 1)),
      totalViews: skills.reduce((sum, skill) => sum + skill.views, 0),
      totalResources: allResources.length
    }
  };
}

window.SkillVerseData = {
  apiUrl: SKILLVERSE_API,
  getAllSkills: skillVerseGetAllSkills,
  getCategories: skillVerseGetCategories,
  getSkillDetail: skillVerseGetSkillDetail,
  getCompareSkills: skillVerseGetCompareSkills,
  getFilteredSkills: skillVerseGetFilteredSkills,
  getSuggestions: skillVerseGetSuggestions,
  getDashboardData: skillVerseGetDashboardData,
  trendScore: skillVerseTrendScore,
  generateRoadmap: skillVerseGenerateRoadmap
};
