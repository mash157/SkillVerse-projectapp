function trendScore(skill) {
  return (skill.popularity || 0) + (skill.views || 0) + (skill.growth || 0);
}

function rankSkills(skills) {
  return [...skills].sort((a, b) => trendScore(b) - trendScore(a));
}

function getTopN(skills, n = 5) {
  return rankSkills(skills).slice(0, n);
}

module.exports = { trendScore, rankSkills, getTopN };
