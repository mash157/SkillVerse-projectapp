// Test script for SkillVerse Profile page functionality
// Run this in browser console on http://localhost:3000/profile

console.log('=== SkillVerse Profile Page Test ===');

// Test 1: Check if main functions exist
const functionsToTest = [
  'loadProfile',
  'shareProgress', 
  'generateAchievementCard',
  'shareAchievementCard',
  'showToast',
  'calculateStats',
  'exportProgress',
  'importProgress'
];

console.log('\n=== Function Availability Test ===');
functionsToTest.forEach(funcName => {
  const exists = typeof window[funcName] === 'function';
  console.log(`${funcName}: ${exists ? '✅ Available' : '❌ Missing'}`);
});

// Test 2: Check localStorage data
console.log('\n=== LocalStorage Data Test ===');
const progressData = localStorage.getItem('sv_progress');
const savedData = localStorage.getItem('sv_saved');
console.log('Progress data exists:', progressData ? '✅ Yes' : '❌ No');
console.log('Saved data exists:', savedData ? '✅ Yes' : '❌ No');
if (progressData) console.log('Progress data:', JSON.parse(progressData));
if (savedData) console.log('Saved data:', JSON.parse(savedData));

// Test 3: Test showToast function
console.log('\n=== Toast Function Test ===');
try {
  if (typeof showToast === 'function') {
    showToast('Test toast message - functions are working! 🎉', 'success');
    console.log('✅ showToast function executed successfully');
  } else {
    console.log('❌ showToast function not available');
  }
} catch (error) {
  console.log('❌ showToast function error:', error);
}

// Test 4: Test calculateStats function
console.log('\n=== Stats Calculation Test ===');
try {
  if (typeof calculateStats === 'function') {
    const stats = calculateStats();
    console.log('✅ calculateStats result:', stats);
  } else {
    console.log('❌ calculateStats function not available');
  }
} catch (error) {
  console.log('❌ calculateStats error:', error);
}

// Test 5: Check if DOM elements exist
console.log('\n=== DOM Elements Test ===');
const elementsToCheck = [
  'profileStatsGrid',
  'toastContainer'
];
elementsToCheck.forEach(elementId => {
  const element = document.getElementById(elementId);
  console.log(`${elementId}: ${element ? '✅ Found' : '❌ Missing'}`);
});

// Test 6: Test sharing functions
console.log('\n=== Share Functions Test ===');
try {
  if (typeof shareProgress === 'function') {
    console.log('✅ shareProgress function available');
    // Don't actually call it to avoid opening windows
  } else {
    console.log('❌ shareProgress function not available');
  }
} catch (error) {
  console.log('❌ shareProgress error:', error);
}

console.log('\n=== Test Complete ===');
console.log('If you see any ❌ marks above, those indicate issues that need fixing.');
console.log('Try clicking the "Share My Journey" buttons to test them manually.');