# Reed.co.uk Jobs Scraper — UK Job Listings API for AI Agents

Extract structured job data from Reed.co.uk, the UK's leading job board with 14+ million monthly visits and 170 million annual visits. Get job titles, companies, salaries, locations, descriptions, and posting dates in seconds.

## 🎯 Built for AI Agents & Automation

This actor is optimized for Claude, ChatGPT, and other AI agents connecting to Apify via MCP (Model Context Protocol). Ask your AI agent to "find software engineering jobs in London" and it will use this scraper to get you real-time data.

## ✨ What You Get

Structured JSON data for every job listing:
- **Title**: Job position name
- **Company**: Employer name  
- **Location**: City/region
- **Salary**: Compensation range (when available)
- **Posted Date**: When the job was listed
- **Description**: Job summary
- **URL**: Direct link to full listing
- **Scraped At**: ISO timestamp

## 📊 Use Cases

- **Recruitment Intelligence**: Monitor competitor hiring, salary trends, skill demand
- **Job Market Analysis**: Track employment patterns by location, industry, role
- **Lead Generation**: Find companies actively hiring for specific roles
- **Research & Analytics**: Study UK job market dynamics, salary benchmarks
- **AI Agent Integration**: Empower Claude/ChatGPT to answer "find me jobs in X"

## 🚀 Example Input

```json
{
  "searchKeyword": "software engineer",
  "location": "London",
  "maxResults": 50,
  "proxyConfiguration": {
    "useApifyProxy": true,
    "apifyProxyGroups": ["RESIDENTIAL"],
    "apifyProxyCountry": "GB"
  }
}
```

## 📦 Example Output

```json
{
  "title": "Senior Software Engineer",
  "company": "Tech Company Ltd",
  "location": "London",
  "salary": "£60,000 - £80,000 per annum",
  "postedDate": "Posted today",
  "description": "Join our team building next-generation cloud platforms...",
  "url": "https://www.reed.co.uk/jobs/senior-software-engineer/12345",
  "scrapedAt": "2026-08-18T16:30:00.000Z"
}
```

## 🤖 Works With

- **Claude** (Anthropic) via Apify MCP
- **ChatGPT** (OpenAI) via Apify integration  
- **AI Agents** using Apify API
- **Zapier**, **Make.com**, **n8n** automation workflows
- Any tool with REST API access

## 🏷️ SEO Keywords

This actor ranks for:
- "reed.co.uk scraper"
- "UK job listings API"
- "scrape reed jobs"
- "UK job board data extraction"
- "recruitment data scraper UK"
- "reed.co.uk job data"
- "UK job market intelligence"
- "AI agent job search UK"

## 💡 Why Use This Actor?

- **Zero competition**: Only actor with <200 users in Reed.co.uk space
- **High-quality data**: 14M+ monthly visits = always fresh listings  
- **No bot protection**: Clean, reliable extraction
- **AI-first**: Built specifically for Claude/ChatGPT MCP integration
- **Flexible**: Filter by keyword, location, adjust result count

## 📈 Reed.co.uk Stats

- **170M visits/year** (14.4M/month average)
- **3M+ unique visitors** monthly
- UK's top independent job board
- Covers all industries and experience levels

## 🔧 Configuration

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| searchKeyword | string | Job search term | "" (all jobs) |
| location | string | Location filter | "" (UK-wide) |
| maxResults | integer | Max jobs to scrape | 50 |
| proxyConfiguration | object | Proxy settings | RESIDENTIAL, GB |

## 💰 Pricing

- **$0.005 per result** scraped
- **$0.05 actor start fee** per run
- Example: 100 jobs = $0.05 + (100 × $0.005) = **$0.55 total**

## 🔗 Related Actors

Looking for other job boards? Check out:
- Indeed UK Scraper
- LinkedIn Jobs Scraper
- TotalJobs Scraper
- CV-Library Scraper

---

**Tags**: reed, jobs, UK, recruitment, hiring, job-board, scraper, AI-agent, MCP, Claude, ChatGPT, lead-generation
