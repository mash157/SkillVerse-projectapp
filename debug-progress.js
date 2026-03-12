// Debug script to test localStorage progress data consistency
// Run this in browser console to diagnose the issue

console.log('=== SkillVerse Progress Debug ===');

// Read localStorage data
const progressData = JSON.parse(localStorage.getItem('sv_progress') || '{}');
const savedSkills = JSON.parse(localStorage.getItem('sv_saved') || '[]');

console.log('Progress data keys:', Object.keys(progressData));
console.log('Progress data:', progressData);
console.log('Saved skills:', savedSkills);

// Test key types
Object.keys(progressData).forEach(key => {
  console.log(`Key: ${key} (${typeof key}), Value:`, progressData[key]);
});

// Test access patterns
console.log('\n=== Testing access patterns ===');
savedSkills.forEach(skillId => {
  console.log(`Skill ID: ${skillId} (${typeof skillId})`);
  console.log(`  Access with skillId:`, progressData[skillId]);
  console.log(`  Access with String(skillId):`, progressData[String(skillId)]);
});

// Test getProgress functions
function getProgressMain(skillId) {
  try {
    const all = JSON.parse(localStorage.getItem('sv_progress') || '{}');
    return all[String(skillId)] || [];
  } catch { return []; }
}

function getProgressOld(skillId) {
  try {
    const all = JSON.parse(localStorage.getItem('sv_progress') || '{}');
    return all[skillId] || [];
  } catch { return []; }
}

console.log('\n=== Testing getProgress functions ===');
savedSkills.forEach(skillId => {
  const mainResult = getProgressMain(skillId);
  const oldResult = getProgressOld(skillId);
  console.log(`Skill ${skillId}:`);
  console.log(`  Main.js method:`, mainResult);
  console.log(`  Old profile.js method:`, oldResult);
  console.log(`  Do they match?`, JSON.stringify(mainResult) === JSON.stringify(oldResult));
});