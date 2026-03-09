const roadmaps = {
  'Technology': [
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
  'Design': [
    'Design Fundamentals & Principles',
    'Color Theory & Typography',
    'User Research & UX Thinking',
    'Wireframing & Information Architecture',
    'Prototyping in Figma / Adobe XD',
    'Interaction Design & Animation',
    'Design Systems & Developer Handoff'
  ],
  'Security': [
    'Networking Fundamentals (TCP/IP)',
    'Linux Command Line Mastery',
    'Cryptography & PKI',
    'Web Application Security (OWASP)',
    'Network Security & Firewalls',
    'Ethical Hacking & Penetration Testing',
    'Incident Response & Digital Forensics'
  ],
  'DevOps': [
    'Linux & Shell Scripting',
    'Version Control (Git & GitHub)',
    'CI/CD Pipelines (GitHub Actions/Jenkins)',
    'Docker & Containerization',
    'Kubernetes & Orchestration',
    'Cloud Services (AWS/GCP/Azure)',
    'Monitoring & Observability (Prometheus/Grafana)'
  ],
  'Business': [
    'Marketing & Consumer Psychology',
    'Digital Analytics & Google Analytics',
    'SEO & Content Marketing',
    'Social Media Strategy',
    'Email Marketing & Automation',
    'Paid Advertising (Google/Meta)',
    'Growth Experiments & Measurement'
  ],
  'Mobile': [
    'Mobile UI/UX Principles',
    'React Native or Flutter Basics',
    'State Management',
    'Device APIs & Sensors',
    'REST API Integration',
    'Performance Optimization',
    'App Store Submission & Distribution'
  ]
};

function generateRoadmap(skill) {
  return roadmaps[skill.category] || skill.skills || [
    'Learn the Fundamentals',
    'Build Practice Projects',
    'Contribute to Open Source',
    'Get Industry Certified',
    'Build Your Portfolio'
  ];
}

module.exports = { generateRoadmap, roadmaps };
