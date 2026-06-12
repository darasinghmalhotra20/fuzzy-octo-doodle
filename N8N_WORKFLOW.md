# Job Market Research AI — n8n Workflow Configuration

## 🔗 Webhook Integration Setup

### Step 1: Create n8n Workflow

1. Open n8n dashboard
2. Create new workflow: **"Job Market AI Alerts"**
3. Add HTTP node with webhook trigger

### Step 2: Configure Webhook Node

```json
{
  "method": "POST",
  "url": "http://YOUR_N8N_URL/webhook/job-match",
  "responseMode": "onReceived"
}
```

### Step 3: Add AI Analysis Node

**Node Type:** Code
**Language:** JavaScript

```javascript
// ChatGPT Analysis Node
const job = $input.first().json;

// Prepare prompt for analysis
const prompt = `
Analyze this job opportunity briefly:
- Title: ${job.job_title}
- Company: ${job.company_name}
- Salary: ₹${job.salary_min} - ₹${job.salary_max}
- Sector: ${job.sector}

Provide a 1-line recommendation for why candidates should apply.
`;

return [{ json: { prompt, job } }];
```

### Step 4: Add OpenAI Node (ChatGPT)

**Node Type:** OpenAI (or similar AI)
**Model:** gpt-4 or gpt-3.5-turbo
**Input:** `{{ $node["Code"].json.prompt }}`

### Step 5: Format WhatsApp Message

**Node Type:** Code

```javascript
const job = $input.first().json;
const aiReason = $('AI Agent').first().json.text;

return [{
  json: {
    message: `🚀 *NEW AI OPS MATCH FOUND*\n\n*Role:* ${job.job_title}\n*Company:* ${job.company_name}\n*Location:* ${job.location}\n*Salary:* ₹${job.salary_min?.toLocaleString()} - ₹${job.salary_max?.toLocaleString()}\n*Match Score:* ${job.arbitrage_score}/100\n\n*Why You:* ${aiReason}\n\n*Apply Here:* ${job.job_url}`,
    phone: null // Will be filled from database
  }
}];
```

### Step 6: Add WhatsApp Node

**Node Type:** Twilio or WhatsApp API
**Inputs:**
- To: `{{ $node["Code"].json.phone }}`
- Message: `{{ $node["Code"].json.message }}`

### Step 7: Test Workflow

Send test data from Job Market Tool:

```bash
curl -X POST http://localhost:5678/webhook/job-match \
  -H "Content-Type: application/json" \
  -d '{
    "job_title": "AI Operations Engineer",
    "company_name": "TechCorp India",
    "location": "Bangalore",
    "salary_min": 1200000,
    "salary_max": 1800000,
    "sector": "AI Ops",
    "arbitrage_score": 85,
    "job_url": "https://example.com/job/123"
  }'
```

## 📡 Configure Job Market Tool

### Update .env

```env
N8N_WEBHOOK_URL=http://localhost:5678/webhook/job-match
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=your_n8n_api_key
```

### Trigger from Job Market Tool

The tool automatically sends jobs to n8n when arbitrage score > 75:

```bash
npm run n8n-sync
```

## 🔄 Full Workflow Flow

```
Job Market Tool
    ↓
Scrape Jobs (Naukri, Indeed, LinkedIn)
    ↓
AI Analysis (ChatGPT)
    ↓
Calculate Arbitrage Score
    ↓
Filter (score > 75)
    ↓
Send to n8n Webhook
    ↓
n8n: AI Analysis
    ↓
Format WhatsApp Message
    ↓
Send via Twilio/WhatsApp API
    ↓
Candidate Receives Alert! ✅
```

## 📊 Sample n8n Workflow JSON

```json
{
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "job-match",
        "authentication": "none"
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "jsCode": "const job = $input.first().json;\nreturn [{ json: { ...job, processed: true } }];"
      },
      "name": "Process Job Data",
      "type": "n8n-nodes-base.code",
      "position": [450, 300]
    },
    {
      "parameters": {
        "model": "gpt-4",
        "prompt": "{{ $node['Process Job Data'].json.prompt }}"
      },
      "name": "AI Analysis",
      "type": "n8n-nodes-base.openai",
      "position": [650, 300]
    },
    {
      "parameters": {
        "jsCode": "const job = $input.first().json;\nreturn [{ json: { message: `Job: ${job.job_title}` } }];"
      },
      "name": "Format Message",
      "type": "n8n-nodes-base.code",
      "position": [850, 300]
    },
    {
      "parameters": {
        "to": "{{ $node['Format Message'].json.phone }}",
        "message": "{{ $node['Format Message'].json.message }}"
      },
      "name": "Send WhatsApp",
      "type": "n8n-nodes-base.twilioSms",
      "position": [1050, 300]
    }
  ],
  "connections": {
    "Webhook": { "main": [[ { "node": "Process Job Data", "branch": 0 } ]] },
    "Process Job Data": { "main": [[ { "node": "AI Analysis", "branch": 0 } ]] },
    "AI Analysis": { "main": [[ { "node": "Format Message", "branch": 0 } ]] },
    "Format Message": { "main": [[ { "node": "Send WhatsApp", "branch": 0 } ]] }
  }
}
```

## ✅ Validation Checklist

- [ ] n8n running and accessible
- [ ] Webhook URL configured in .env
- [ ] OpenAI API key added to n8n
- [ ] WhatsApp/Twilio credentials configured
- [ ] Test workflow sends message successfully
- [ ] Job Market Tool connects to webhook
- [ ] Arbitrage opportunities detected
- [ ] WhatsApp messages received by candidates

## 🚀 Production Deployment

### n8n Cloud

1. Deploy n8n to cloud (n8n.cloud)
2. Update webhook URL to cloud instance
3. Enable SSL/TLS for secure communication

### Job Market Tool

Deploy to:
- AWS EC2
- DigitalOcean
- Heroku
- Docker container

## 📞 Support

For issues:
1. Check n8n logs: `docker logs n8n`
2. Verify webhook is receiving data
3. Check OpenAI API credits
4. Review WhatsApp provider limits

---

**Built for India's Job Market** 🇮🇳
