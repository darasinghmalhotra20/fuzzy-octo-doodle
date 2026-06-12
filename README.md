````markdown
# 🚀 Job Market Research AI — India 2026

A comprehensive market research tool that combines **real-time job data** with **AI analysis** to identify trends, opportunities, and arbitrage angles in the Indian job market (June 2026).

## 📋 Features

### 🔍 **Job Data Aggregation**
- Scrapes LinkedIn, Indeed, Naukri, Times Jobs
- Real-time job updates (WFH, On-site, Hybrid)
- Salary range extraction & analysis
- Job description parsing with NLP

### 🤖 **AI-Powered Analysis**
- ChatGPT/Claude integration for job insights
- Matches candidates to opportunities
- Arbitrage detection (skill gaps, salary mismatches)
- Trend prediction & market forecasting

### 📊 **Market Intelligence Dashboard**
- WFH vs On-site hiring breakdown
- Top sectors & growth metrics
- Salary trends by role & experience
- Skills demand heatmap
- Real-time market alerts

### 🎯 **Focus Areas** (India Market, June 2026)
- **AI Operations Roles** — Rapid growth, high salaries
- **Mental Health Tech** — Emerging sector
- **Remote Engineering** — WFH dominance
- **Arbitrage Opportunities** — Low supply, high demand
- **Career Path Analytics** — Skill progression insights

### 🔗 **n8n Integration**
- Seamless workflow automation
- Custom job matching rules
- Trigger WhatsApp alerts for candidates
- Export to CRM/email marketing

### 💬 **WhatsApp Automation**
- AI-matched job alerts with reasoning
- Bulk reminders for interviews/joining
- Market trend updates
- Zintok signature integration

## 🛠️ Installation

```bash
# Clone repository
git clone https://github.com/darasinghmalhotra20/fuzzy-octo-doodle.git
cd fuzzy-octo-doodle

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys
```

## 📚 Environment Setup

```bash
# Required API Keys:
OPENAI_API_KEY=sk-...          # ChatGPT API
N8N_WEBHOOK_URL=...            # n8n automation
LINKEDIN_EMAIL=...             # LinkedIn scraping
NAUKRI_API_KEY=...             # Naukri India jobs
```

## 🚀 Quick Start

### 1. **Scrape Job Market Data**
```bash
npm run scrape
```
Fetches jobs from all major Indian job boards, stores in SQLite.

### 2. **Run AI Analysis**
```bash
npm run analyze
```
Processes jobs through ChatGPT for insights, detects arbitrage, identifies trends.

### 3. **View Dashboard**
```bash
npm run dashboard
# Visit http://localhost:3000
```

### 4. **Generate Market Report**
```bash
npm run market-report
```
Creates detailed CSV & PDF reports on market trends.

### 5. **Integrate with n8n**
```bash
npm run n8n-sync
```
Syncs job data to n8n for WhatsApp automation.

## 📁 Project Structure

```
fuzzy-octo-doodle/
├── src/
│   ├── scrapers/
│   │   ├── jobScraper.js         # Multi-source job aggregation
│   │   ├── linkedinScraper.js    # LinkedIn crawler
│   │   ├── naukriScraper.js      # Naukri.com crawler
│   │   └── indeedScraper.js      # Indeed India scraper
│   │
│   ├── ai/
│   │   ├── analyzer.js            # AI analysis engine
│   │   ├── trendDetector.js       # Market trend analysis
│   │   ├── arbitrageDetector.js   # Opportunity detection
│   │   └── promptTemplates.js     # ChatGPT prompts
│   │
│   ├── database/
│   │   ├── schema.js              # SQLite schema
│   │   ├── queries.js             # DB helper functions
│   │   └── seeds.js               # Sample data
│   │
│   ├── dashboard/
│   │   ├── server.js              # Express server
│   │   ├── routes.js              # API endpoints
│   │   └── public/
│   │       ├── index.html         # Dashboard UI
│   │       ├── charts.js          # Chart rendering
│   │       └── styles.css         # Styling
│   │
│   ├── integrations/
│   │   ├── n8nSync.js             # n8n webhook sync
│   │   ├── whatsappAlert.js       # WhatsApp notifications
│   │   └── emailAlert.js          # Email reports
│   │
│   ├── reports/
│   │   ├── marketReport.js        # PDF/CSV generation
│   │   ├── templates/
│   │   │   ├── executive.ejs      # Executive summary
│   │   │   ├── trends.ejs         # Trend analysis
│   │   │   └── opportunities.ejs  # Arbitrage opportunities
│   │   └── exports/
│   │
│   └── utils/
│       ├── logger.js              # Logging utility
│       ├── validators.js          # Data validation
│       └── helpers.js             # Helper functions
│
├── data/
│   ├── market_research.db         # SQLite database
│   ├── raw/
│   │   ├── jobs_linkedin.json
│   │   ├── jobs_naukri.json
│   │   └── jobs_indeed.json
│   └── exports/
│       ├── market_report_june2026.csv
│       └── arbitrage_opportunities.json
│
├── .env.example
├── package.json
└── index.js                        # Main entry point
```

## 🔌 API Endpoints (Dashboard)

```
GET  /api/jobs                     # All jobs with filters
GET  /api/jobs/:id                # Job details + AI analysis
GET  /api/trends                   # Market trends
GET  /api/arbitrage                # Arbitrage opportunities
GET  /api/sectors                  # Sector breakdown
GET  /api/salary-analysis          # Salary insights
GET  /api/wfh-analysis             # WFH vs On-site stats
POST /api/export                   # Export CSV/PDF report
```

## 🤖 n8n Workflow Integration

### Example n8n Workflow:

1. **Trigger:** HTTP Webhook (job match found)
2. **Node:** AI Analysis (ChatGPT response)
3. **Node:** Format Message (as per your snippet)
4. **Node:** WhatsApp Send
5. **Node:** Log to Database

### Your n8n Code Block:
```javascript
const job = $input.first().json;
const aiReason = $('AI Agent').first().json.text;

return [{
  json: {
    message: `🚀 *NEW AI OPS MATCH FOUND*\n\n*Role:* ${job.job_title}\n*Company:* ${job.company_name}\n*Match Reason:* ${aiReason}\n*Apply Here:* ${job.url}`
  }
}];
```

This tool will POST matching jobs to your n8n webhook automatically! ✅

## 📊 Sample Market Insights (June 2026 India)

```json
{
  "market_snapshot": {
    "total_jobs_tracked": 45230,
    "wfh_percentage": 68,
    "ai_ops_growth": "+145% YoY",
    "mental_health_tech_growth": "+89% YoY",
    "avg_salary_ai_ops": 850000,
    "avg_salary_mental_health": 620000,
    "top_cities": ["Bangalore", "Pune", "Hyderabad", "Remote"]
  },
  "arbitrage_opportunities": [
    {
      "skill": "AI Prompt Engineering",
      "demand": "Very High",
      "supply": "Low",
      "salary_range": "1200000-2500000",
      "experience_required": "2-5 years"
    },
    {
      "skill": "Mental Health Chatbot Dev",
      "demand": "High",
      "supply": "Low",
      "salary_range": "800000-1500000",
      "experience_required": "3-7 years"
    }
  ]
}
```

## 🧪 Testing

```bash
# Run scrapers in test mode
npm test

# Generate sample data
npm run test-data

# Validate AI responses
npm run test-ai
```

## 📝 Example Usage

```javascript
import { JobScraper } from './src/scrapers/jobScraper.js';
import { AIAnalyzer } from './src/ai/analyzer.js';
import { Database } from './src/database/queries.js';

// 1. Scrape jobs
const scraper = new JobScraper();
const jobs = await scraper.scrapeAll(['linkedin', 'naukri', 'indeed']);

// 2. Analyze with AI
const analyzer = new AIAnalyzer();
for (const job of jobs) {
  job.ai_insights = await analyzer.analyze(job);
  job.arbitrage_score = analyzer.detectArbitrage(job);
}

// 3. Store in database
const db = new Database();
await db.insertJobs(jobs);

// 4. Generate report
const report = await db.generateMarketReport();
console.log(report);
```

## 🔐 Security

- API keys stored in `.env` (never commit)
- Authentication required for dashboard
- Rate limiting on scrapers
- Data encryption for sensitive fields

## 📞 Support & Contact

**Zintok Group**
- 📧 Email: manpower@zintokgroup.com
- 📱 WhatsApp: +91 9909 888 761 / 762 / 763
- 🌐 Website: www.zintokgroup.com

## 📄 License

MIT License — See LICENSE file

---

**Built with ❤️ for India's Job Market** 🇮🇳
````
