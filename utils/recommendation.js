const { trendScore } = require('./ranking');

function getRecommendations(skill, allSkills, limit = 4) {
  return allSkills
    .filter(s => s.id !== skill.id && s.category === skill.category)
    .sort((a, b) => trendScore(b) - trendScore(a))
    .slice(0, limit);
}

function getRelatedTechnologies(skill, allSkills) {
  const existing = new Set(skill.skills || []);
  const related = new Set();
  allSkills
    .filter(s => s.id !== skill.id && s.category === skill.category)
    .forEach(s => (s.skills || []).forEach(t => !existing.has(t) && related.add(t)));
  return [...related].slice(0, 8);
}

module.exports = { getRecommendations, getRelatedTechnologies };
