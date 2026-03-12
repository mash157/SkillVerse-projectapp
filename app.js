//Importing necessary modules and setting up the Express server for SkillVerse, a platform to manage and track skills development. The server serves static files from the 'public' directory and defines API routes for skills and resources management. It also serves the main pages of the application, including the dashboard.
const express = require('express');
const path = require('path');
const cors = require('cors');
const skillsRouter = require('./routes/skills');
const resourcesRouter = require('./routes/resources');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/skills', skillsRouter);
app.use('/api', resourcesRouter);

// Serve frontend pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/skill', (req, res) => res.sendFile(path.join(__dirname, 'public', 'skill.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/profile', (req, res) => res.sendFile(path.join(__dirname, 'public', 'profile.html')));

// New content pages
app.get('/community', (req, res) => res.sendFile(path.join(__dirname, 'public', 'community.html')));
app.get('/resources', (req, res) => res.sendFile(path.join(__dirname, 'public', 'resources.html')));
app.get('/blog', (req, res) => res.sendFile(path.join(__dirname, 'public', 'blog.html')));
app.get('/forums', (req, res) => res.sendFile(path.join(__dirname, 'public', 'forums.html')));
app.get('/support', (req, res) => res.sendFile(path.join(__dirname, 'public', 'support.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n  ◈  SkillVerse running at http://localhost:${PORT}`);
  console.log(`  📊  Dashboard:           http://localhost:${PORT}/dashboard\n`);
});
