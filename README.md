# SkillVerse – Interactive Skill Discovery Platform

> A full-stack Node.js web application for discovering, exploring, and tracking in-demand tech skills — ranked by a real-time trend algorithm.

---

## Screenshots

### 🏠 Home — Explore Page
![SkillVerse Home Page](screenshots/home.png)

### 📄 Skill Detail Page
![Skill Detail Page](screenshots/skill-detail.png)

### 📊 Analytics Dashboard
![Analytics Dashboard](screenshots/dashboard.png)

---

## Features

| Feature | Description |
|---|---|
| **Trend Ranking** | All 15 skills ranked by `trendScore = popularity + views + growth` |
| **Smart Search + Auto-Suggest** | Instant search with AI-style category detection and dropdown suggestions |
| **Skill Detail Pages** | Full description, tech stack, career paths, learning roadmap, resources |
| **Bookmark / Save Skills** | Save skills to browser localStorage, count shown in header |
| **Copy Roadmap** | One-click clipboard copy of a skill's full learning roadmap |
| **Resource Click Tracking** | Tracks how many times each learning resource is clicked (persisted to JSON) |
| **Recommendation Engine** | Category-based similar skill suggestions on each detail page |
| **Analytics Dashboard** | 4 animated Chart.js charts + animated stat counters |
| **Premium UI** | Glassmorphism dark theme, skeleton loaders, staggered animations, page transitions |

---

## Tech Stack

- **Backend**: Node.js + Express 4
- **Data**: `data/skills.json` (flat-file JSON, no database needed)
- **Frontend**: Vanilla HTML / CSS / JavaScript
- **Charts**: Chart.js 4.4.0 (CDN)
- **Fonts**: Inter (Google Fonts)
- **Images**: Unsplash (topic-specific per skill)

---

## Project Structure

```
skillverse/
├── app.js                     # Express entry point (port 3000)
├── data/
│   └── skills.json            # 15 skills — single source of truth
├── routes/
│   ├── skills.js              # GET /api/skills, /suggest, /categories, /dashboard, /:id
│   └── resources.js           # POST /api/resource-click
├── utils/
│   ├── ranking.js             # trendScore = popularity + views + growth
│   ├── recommendation.js      # Category-based related skills
│   └── roadmap.js             # Auto-generated 8-step learning roadmaps
├── screenshots/
│   ├── home.png               # Home / Explore page
│   ├── skill-detail.png       # Skill detail page
│   └── dashboard.png          # Analytics dashboard
└── public/
    ├── index.html             # Homepage — skill card grid
    ├── skill.html             # Skill detail page
    ├── dashboard.html         # Analytics dashboard
    ├── css/
    │   └── style.css          # Full design system (1300+ lines)
    └── js/
        ├── main.js            # Card rendering, detail page, bookmarks, counters
        ├── search.js          # Search, filters, auto-suggest dropdown
        ├── dashboard.js       # Chart.js rendering + animated stats
        └── resources.js       # Resource click tracking
```

---

## Getting Started

### Prerequisites
- Node.js v18+

### Install & Run

```bash
cd skillverse
npm install
node app.js
```

Open [http://localhost:3000](http://localhost:3000)

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/skills` | All skills. Params: `q`, `category`, `difficulty`, `sort` |
| `GET` | `/api/skills/suggest?q=...` | Smart auto-suggest with category detection |
| `GET` | `/api/skills/categories` | All unique categories |
| `GET` | `/api/skills/dashboard` | Stats, trending, charts data |
| `GET` | `/api/skills/:id` | Single skill detail (increments views) |
| `POST` | `/api/resource-click` | Track a resource click `{ skillId, resourceIndex }` |

---

## Trend Score Algorithm

```
trendScore = popularity + views + growth
```

- `popularity` — curated 0–100 relevance score
- `views` — incremented each time the skill detail page is visited
- `growth` — estimated YoY market growth rate

Skills are sorted descending by trendScore on the homepage.

---

## Skills Included

Artificial Intelligence · Web Development · Machine Learning · UI/UX Design · Node.js · Data Science · React.js · Cybersecurity · DevOps & CI/CD · Figma · Digital Marketing · Blockchain · Python · Mobile App Development · Cloud Computing (AWS)

---

*Built with Node.js — Developed with ❤️ by @mash157 — © 2026 SkillVerse*
