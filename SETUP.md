# Job Market Research AI — Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Run the Tool
```bash
npm start
```

This will:
- ✅ Initialize SQLite database
- ✅ Scrape jobs from Naukri, Indeed, Times Jobs
- ✅ Run AI analysis with ChatGPT
- ✅ Sync with n8n
- ✅ Start dashboard at http://localhost:3000

## 📋 Configuration

### Required Environment Variables

```env
# OpenAI API (ChatGPT)
OPENAI_API_KEY=sk-...
AI_MODEL=gpt-4

# n8n Integration
N8N_WEBHOOK_URL=http://localhost:5678/webhook/job-match
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=...

# Job Scraping (Optional)
LINKEDIN_EMAIL=your_email@example.com
LINKEDIN_PASSWORD=your_password
NAUKRI_API_KEY=...

# Database
DB_PATH=./data/market_research.db
CSV_OUTPUT_PATH=./data/exports/

# Server
PORT=3000
NODE_ENV=development
```

## 🔧 Usage

### Run Full Pipeline
```bash
npm start
```

### Scrape Jobs Only
```bash
npm run scrape
```

### Run AI Analysis
```bash
npm run analyze
```

### Start Dashboard
```bash
npm run dashboard
```

### Generate Market Report
```bash
npm run market-report
```

### Sync with n8n
```bash
npm run n8n-sync
```

## 📊 Dashboard Features

Access at **http://localhost:3000**

- **Summary Stats:** Total jobs, WFH %, avg salary, arbitrage opportunities
- **Sector Analysis:** Jobs and salaries by sector
- **WFH Breakdown:** Work-from-home vs on-site percentages
- **Skills Demand:** Top 10 most demanded skills
- **Arbitrage Opportunities:** High-opportunity jobs with AI analysis
- **Export:** Download data as CSV

## 🔗 n8n Integration

### Setup Webhook

1. Create workflow in n8n
2. Add HTTP node with webhook:
   ```
   Method: POST
   URL: http://localhost:5678/webhook/job-match
   ```

3. Add data transformer:
   ```javascript
   const job = $input.first().json;
   const aiReason = $('AI Agent').first().json.text;
   
   return [{
     json: {
       message: `🚀 *NEW AI OPS MATCH FOUND*\n\n*Role:* ${job.job_title}\n*Company:* ${job.company_name}\n*Match Reason:* ${aiReason}\n*Apply Here:* ${job.job_url}`
     }
   }];
   ```

4. Connect to WhatsApp node

### Test Webhook
```bash
curl -X POST http://localhost:3000/api/n8n-trigger \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "919909888761",
    "job_title": "AI Operations Engineer",
    "company_name": "TechCorp"
  }'
```

## 📈 API Endpoints

### Jobs
```
GET  /api/jobs                     # Filter by sector, WFH, salary range
GET  /api/jobs/:id                 # Job details with AI analysis
POST /api/export                   # Export to CSV
```

### Market Data
```
GET  /api/trends                   # 30-day market trends
GET  /api/arbitrage                # Arbitrage opportunities (min_score=70)
GET  /api/sectors                  # Sector breakdown
GET  /api/salary-analysis          # Salary insights by role
GET  /api/wfh-analysis             # WFH vs on-site stats
GET  /api/skills-demand            # Top skills demand
```

### Summary
```
GET  /api/summary                  # Dashboard summary
```

## 🤖 AI Analysis Features

### Job Analysis
- Market demand assessment
- Supply competition analysis
- Salary competitiveness scoring
- Career growth potential (0-10)
- Arbitrage opportunity detection
- Skill relevance matching

### Arbitrage Scoring (0-100)
- **80-100:** Extreme opportunity (low supply, high demand)
- **60-79:** Strong opportunity
- **40-59:** Moderate opportunity
- **<40:** Limited opportunity

### Detected Sectors
- **AI Ops** — Rapid growth, high salaries
- **Mental Health Tech** — Emerging sector
- **Remote Engineering** — WFH dominance
- **Arbitrage Trading** — Niche opportunities

## 📊 Database Schema

### Main Tables
- `jobs` — Job listings with AI analysis
- `market_trends` — Daily market metrics
- `arbitrage_opportunities` — High-opportunity skills
- `skills_analysis` — Skill demand & trends
- `salary_analysis` — Salary statistics
- `candidate_matches` — Job-candidate matches
- `reports` — Generated reports

## 🐛 Troubleshooting

### Database locked
```bash
rm data/market_research.db
npm start
```

### API rate limiting
Increase `messageDelay` in `src/scrapers/jobScraper.js`

### ChatGPT errors
Check `OPENAI_API_KEY` is valid and has credits

### n8n not receiving webhooks
Verify `N8N_WEBHOOK_URL` is accessible

## 📝 Sample Data

Default seed data includes:
- AI Operations Engineer @ TechCorp
- Mental Health Chatbot Developer @ MindCare
- Infrastructure Engineer @ CloudSys

Run `npm start` to see these jobs analyzed.

## 🚀 Deployment

### Using PM2
```bash
npm install -g pm2
pm2 start index.js --name "job-market-ai"
pm2 save
```

### Using Docker
Create `Dockerfile`:
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
CMD ["npm", "start"]
```

Build & run:
```bash
docker build -t job-market-ai .
docker run -p 3000:3000 job-market-ai
```

## 📞 Support

**Zintok Group**
- 📧 manpower@zintokgroup.com
- 📱 +91 9909 888 761 / 762 / 763

## 📄 License

MIT License — See LICENSE file

---

**For more details, see README.md**
