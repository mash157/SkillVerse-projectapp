const { trendScore } = require('./ranking');

// Multi-factor recommendation:
//   40 pts  – same category
//   15 pts/tech – shared technologies (max 45)
//   20/10/0 pts – same / adjacent / far difficulty level
//   0-25 pts  – trend score boost
function getRecommendations(skill, allSkills, limit = 4) {
  const existing = new Set(skill.skills || []);
  const levels   = { Beginner: 0, Intermediate: 1, Advanced: 2 };
  const myLevel  = levels[skill.difficulty] || 0;

  return allSkills
    .filter(s => s.id !== skill.id)
    .map(s => {
      const catScore    = s.category === skill.category ? 40 : 0;
      const overlap     = (s.skills || []).filter(t => existing.has(t)).length;
      const overlapScore = Math.min(45, overlap * 15);
      const sLevel      = levels[s.difficulty] || 0;
      const diff        = Math.abs(myLevel - sLevel);
      const diffScore   = diff === 0 ? 20 : diff === 1 ? 10 : 0;
      const trendBoost  = Math.min(25, Math.round(trendScore(s) / 80));
      return { ...s, _recScore: catScore + overlapScore + diffScore + trendBoost };
    })
    .filter(s => s._recScore > 0)
    .sort((a, b) => b._recScore - a._recScore)
    .slice(0, limit)
    .map(({ _recScore, ...s }) => s);
}

function getRelatedTechnologies(skill, allSkills) {
  const existing = new Set(skill.skills || []);
  const related  = new Set();
  allSkills
    .filter(s => s.id !== skill.id && s.category === skill.category)
    .forEach(s => (s.skills || []).forEach(t => !existing.has(t) && related.add(t)));
  return [...related].slice(0, 8);
}

module.exports = { getRecommendations, getRelatedTechnologies };
