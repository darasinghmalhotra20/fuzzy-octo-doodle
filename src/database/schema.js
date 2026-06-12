import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ═══════════════════════════════════════════════════════════════════
//  DATABASE INITIALIZATION — SQLite Schema
// ═══════════════════════════════════════════════════════════════════

export function initializeDatabase(db) {
    // ─── Jobs Table ─────────────────────────────────────────────────
    db.run(`
        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source TEXT NOT NULL,                 -- 'linkedin', 'naukri', 'indeed'
            external_id TEXT UNIQUE,              -- original job ID from source
            job_title TEXT NOT NULL,
            company_name TEXT NOT NULL,
            company_logo_url TEXT,
            location TEXT,
            is_wfh BOOLEAN DEFAULT 0,             -- 1 = WFH, 0 = On-site
            is_hybrid BOOLEAN DEFAULT 0,
            salary_min INTEGER,
            salary_max INTEGER,
            currency TEXT DEFAULT 'INR',
            experience_min REAL,
            experience_max REAL,
            job_description TEXT,
            job_url TEXT UNIQUE,
            required_skills JSON,                 -- ["Python", "AI", "ML"]
            sector TEXT,                          -- "AI Ops", "Mental Health", etc
            ai_analysis JSON,                     -- ChatGPT analysis results
            arbitrage_score REAL,                 -- 0-100 (opportunity score)
            demand_level TEXT,                    -- "High", "Medium", "Low"
            supply_level TEXT,
            salary_competitiveness TEXT,          -- "Above", "Average", "Below"
            is_arbitrage_opportunity BOOLEAN,
            scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            analyzed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_source_external ON jobs(source, external_id);
        CREATE INDEX IF NOT EXISTS idx_sector ON jobs(sector);
        CREATE INDEX IF NOT EXISTS idx_wfh ON jobs(is_wfh);
        CREATE INDEX IF NOT EXISTS idx_arbitrage ON jobs(is_arbitrage_opportunity);
    `);

    // ─── Market Trends Table ─────────────────────────────────────────
    db.run(`
        CREATE TABLE IF NOT EXISTS market_trends (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date DATE NOT NULL,
            sector TEXT NOT NULL,
            total_jobs INTEGER,
            wfh_percentage REAL,
            avg_salary INTEGER,
            avg_experience REAL,
            top_skills JSON,
            demand_change REAL,                   -- % change from previous day
            supply_change REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_trend_date_sector ON market_trends(date, sector);
    `);

    // ─── Arbitrage Opportunities Table ──────────────────────────────
    db.run(`
        CREATE TABLE IF NOT EXISTS arbitrage_opportunities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            skill TEXT NOT NULL,
            demand_level TEXT,
            supply_level TEXT,
            salary_range_min INTEGER,
            salary_range_max INTEGER,
            experience_required REAL,
            opportunity_score REAL,               -- 0-100
            related_jobs JSON,                    -- IDs of related jobs
            ai_recommendation TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_opportunity_score ON arbitrage_opportunities(opportunity_score DESC);
    `);

    // ─── Skills Analysis Table ──────────────────────────────────────
    db.run(`
        CREATE TABLE IF NOT EXISTS skills_analysis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            skill TEXT UNIQUE NOT NULL,
            total_demand INTEGER,
            job_ids JSON,
            avg_salary INTEGER,
            experience_trend REAL,
            growth_percentage REAL,
            market_saturation TEXT,               -- "High", "Medium", "Low"
            recommendation TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // ─── Salary Analysis Table ──────────────────────────────────────
    db.run(`
        CREATE TABLE IF NOT EXISTS salary_analysis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_title TEXT,
            sector TEXT,
            experience_level TEXT,                -- "Fresher", "Mid", "Senior"
            location TEXT,
            wfh_salary_avg INTEGER,
            onsite_salary_avg INTEGER,
            salary_growth_percentage REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_salary_title_exp ON salary_analysis(job_title, experience_level);
    `);

    // ─── Candidate Matches Table ────────────────────────────────────
    db.run(`
        CREATE TABLE IF NOT EXISTS candidate_matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            candidate_phone TEXT,
            job_id INTEGER NOT NULL,
            match_score REAL,                     -- 0-100
            match_reasons JSON,                   -- Why this is a good match
            ai_explanation TEXT,                  -- ChatGPT analysis
            is_sent BOOLEAN DEFAULT 0,
            sent_at TIMESTAMP,
            whatsapp_message_id TEXT,
            candidate_applied BOOLEAN,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (job_id) REFERENCES jobs(id)
        );
        CREATE INDEX IF NOT EXISTS idx_candidate_phone ON candidate_matches(candidate_phone);
        CREATE INDEX IF NOT EXISTS idx_match_score ON candidate_matches(match_score DESC);
    `);

    // ─── Reports Table ──────────────────────────────────────────────
    db.run(`
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            report_type TEXT,                     -- 'market_snapshot', 'arbitrage', 'trends'
            title TEXT,
            content JSON,
            pdf_path TEXT,
            csv_path TEXT,
            generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    console.log('✅ Database schema initialized successfully!');
}

// ═══════════════════════════════════════════════════════════════════
//  SEED DATA — Initial market insights
// ═══════════════════════════════════════════════════════════════════

export function seedInitialData(db) {
    const seedJobs = [
        {
            source: 'linkedin',
            job_title: 'AI Operations Engineer',
            company_name: 'TechCorp India',
            location: 'Bangalore',
            is_wfh: 1,
            salary_min: 1200000,
            salary_max: 1800000,
            experience_min: 3,
            experience_max: 7,
            sector: 'AI Ops',
            required_skills: JSON.stringify(['Python', 'MLOps', 'AWS', 'Kubernetes']),
            job_url: 'https://linkedin.com/jobs/ai-ops-engineer-1',
        },
        {
            source: 'naukri',
            job_title: 'Mental Health Chatbot Developer',
            company_name: 'MindCare Tech',
            location: 'Remote',
            is_wfh: 1,
            salary_min: 800000,
            salary_max: 1200000,
            experience_min: 2,
            experience_max: 5,
            sector: 'Mental Health Tech',
            required_skills: JSON.stringify(['Python', 'NLP', 'React', 'API Design']),
            job_url: 'https://naukri.com/jobs/mental-health-dev-2',
        },
        {
            source: 'indeed',
            job_title: 'Senior Infrastructure Engineer (WFH)',
            company_name: 'CloudSys India',
            location: 'Work From Home',
            is_wfh: 1,
            salary_min: 1500000,
            salary_max: 2200000,
            experience_min: 5,
            experience_max: 10,
            sector: 'Remote Engineering',
            required_skills: JSON.stringify(['Terraform', 'Docker', 'AWS', 'CI/CD']),
            job_url: 'https://indeed.com/jobs/infra-engineer-3',
        },
    ];

    seedJobs.forEach(job => {
        db.run(
            `INSERT OR IGNORE INTO jobs (
                source, job_title, company_name, location, is_wfh, salary_min, salary_max,
                experience_min, experience_max, sector, required_skills, job_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                job.source,
                job.job_title,
                job.company_name,
                job.location,
                job.is_wfh,
                job.salary_min,
                job.salary_max,
                job.experience_min,
                job.experience_max,
                job.sector,
                job.required_skills,
                job.job_url,
            ]
        );
    });

    console.log('✅ Seed data inserted!');
}

// ═══════════════════════════════════════════════════════════════════
//  EXPORT CONFIG
// ═══════════════════════════════════════════════════════════════════

export const DB_CONFIG = {
    dbPath: process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'market_research.db'),
    csvOutputPath: process.env.CSV_OUTPUT_PATH || path.join(__dirname, '..', '..', 'data', 'exports'),
};
