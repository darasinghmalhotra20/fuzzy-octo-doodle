import sqlite3 from 'sqlite3';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ═══════════════════════════════════════════════════════════════════
//  DATABASE QUERIES — Helper functions for CRUD operations
// ═══════════════════════════════════════════════════════════════════

export class Database {
    constructor(dbPath) {
        this.dbPath = dbPath;
        this.db = null;
    }

    // ─── Initialize Connection ──────────────────────────────────────
    connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) reject(err);
                else {
                    console.log(`✅ Connected to database: ${this.dbPath}`);
                    resolve();
                }
            });
        });
    }

    // ─── Insert Jobs ─────────────────────────────────────────────────
    insertJobs(jobs) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO jobs (
                    source, external_id, job_title, company_name, location, is_wfh,
                    salary_min, salary_max, experience_min, experience_max,
                    job_description, job_url, required_skills, sector
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            let inserted = 0;
            jobs.forEach(job => {
                stmt.run(
                    [
                        job.source,
                        job.external_id || null,
                        job.job_title,
                        job.company_name,
                        job.location || null,
                        job.is_wfh ? 1 : 0,
                        job.salary_min || null,
                        job.salary_max || null,
                        job.experience_min || null,
                        job.experience_max || null,
                        job.job_description || null,
                        job.job_url,
                        job.required_skills || '[]',
                        job.sector || 'Other',
                    ],
                    (err) => {
                        if (!err) inserted++;
                    }
                );
            });

            stmt.finalize((err) => {
                if (err) reject(err);
                else {
                    console.log(`✅ Inserted ${inserted}/${jobs.length} jobs`);
                    resolve(inserted);
                }
            });
        });
    }

    // ─── Update Job with AI Analysis ─────────────────────────────────
    updateJobAnalysis(jobId, analysis) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `UPDATE jobs SET ai_analysis = ?, arbitrage_score = ?, analyzed_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [JSON.stringify(analysis), analysis.arbitrage_opportunity || 0, jobId],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    // ─── Get All Jobs with Filters ──────────────────────────────────
    getJobs(filters = {}) {
        return new Promise((resolve, reject) => {
            let query = 'SELECT * FROM jobs WHERE 1=1';
            const params = [];

            if (filters.sector) {
                query += ' AND sector = ?';
                params.push(filters.sector);
            }
            if (filters.is_wfh !== undefined) {
                query += ' AND is_wfh = ?';
                params.push(filters.is_wfh ? 1 : 0);
            }
            if (filters.min_salary) {
                query += ' AND salary_min >= ?';
                params.push(filters.min_salary);
            }
            if (filters.max_salary) {
                query += ' AND salary_max <= ?';
                params.push(filters.max_salary);
            }
            if (filters.arbitrage_only) {
                query += ' AND is_arbitrage_opportunity = 1 AND arbitrage_score > 70';
            }

            query += ' ORDER BY arbitrage_score DESC LIMIT 100';

            this.db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    // ─── Get Market Trends ──────────────────────────────────────────
    getMarketTrends(days = 30) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    sector,
                    COUNT(*) as total_jobs,
                    ROUND(SUM(CASE WHEN is_wfh = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as wfh_percentage,
                    ROUND(AVG(salary_max), 0) as avg_salary,
                    ROUND(AVG(experience_max), 1) as avg_experience,
                    DATE(scraped_at) as date
                FROM jobs
                WHERE DATE(scraped_at) >= DATE('now', '-' || ? || ' days')
                GROUP BY sector, DATE(scraped_at)
                ORDER BY date DESC, total_jobs DESC
            `;

            this.db.all(query, [days], (err, rows) => {
                if (err) reject(err);
                else {
                    const trends = {
                        by_sector: {},
                        timeline: rows || []
                    };

                    (rows || []).forEach(row => {
                        if (!trends.by_sector[row.sector]) {
                            trends.by_sector[row.sector] = [];
                        }
                        trends.by_sector[row.sector].push(row);
                    });

                    resolve(trends);
                }
            });
        });
    }

    // ─── Get Skills Demand ───────────────────────────────────────────
    getSkillsDemand() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    DISTINCT skill,
                    COUNT(DISTINCT id) as job_count,
                    ROUND(AVG(salary_max), 0) as avg_salary,
                    ROUND(AVG(experience_max), 1) as avg_experience
                FROM (
                    SELECT id, salary_max, experience_max,
                        JSON_EXTRACT(required_skills, '$[0]') as skill
                    FROM jobs
                    UNION ALL
                    SELECT id, salary_max, experience_max,
                        JSON_EXTRACT(required_skills, '$[1]') as skill
                    FROM jobs
                    UNION ALL
                    SELECT id, salary_max, experience_max,
                        JSON_EXTRACT(required_skills, '$[2]') as skill
                    FROM jobs
                )
                WHERE skill IS NOT NULL
                GROUP BY skill
                ORDER BY job_count DESC
                LIMIT 50
            `;

            this.db.all(query, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    // ─── Get Arbitrage Opportunities ─────────────────────────────────
    getArbitrageOpportunities(minScore = 70) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    id,
                    job_title,
                    company_name,
                    salary_min,
                    salary_max,
                    required_skills,
                    arbitrage_score,
                    ai_analysis,
                    job_url
                FROM jobs
                WHERE is_arbitrage_opportunity = 1 AND arbitrage_score >= ?
                ORDER BY arbitrage_score DESC
                LIMIT 50
            `;

            this.db.all(query, [minScore], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    // ─── Calculate Salary Statistics ─────────────────────────────────
    getSalaryStats(sector = null) {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT 
                    job_title,
                    ROUND(AVG(salary_min), 0) as avg_min,
                    ROUND(AVG(salary_max), 0) as avg_max,
                    ROUND(MIN(salary_min), 0) as min_entry,
                    ROUND(MAX(salary_max), 0) as max_possible,
                    COUNT(*) as total_postings,
                    ROUND(AVG(CASE WHEN is_wfh = 1 THEN salary_max ELSE NULL END), 0) as wfh_avg,
                    ROUND(AVG(CASE WHEN is_wfh = 0 THEN salary_max ELSE NULL END), 0) as onsite_avg
                FROM jobs
                WHERE 1=1
            `;
            const params = [];

            if (sector) {
                query += ' AND sector = ?';
                params.push(sector);
            }

            query += ' GROUP BY job_title ORDER BY avg_max DESC LIMIT 50';

            this.db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    // ─── Get WFH Analysis ────────────────────────────────────────────
    getWFHAnalysis() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    sector,
                    COUNT(*) as total,
                    SUM(CASE WHEN is_wfh = 1 THEN 1 ELSE 0 END) as wfh_count,
                    ROUND(SUM(CASE WHEN is_wfh = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as wfh_percentage,
                    ROUND(AVG(CASE WHEN is_wfh = 1 THEN salary_max ELSE NULL END), 0) as wfh_avg_salary,
                    ROUND(AVG(CASE WHEN is_wfh = 0 THEN salary_max ELSE NULL END), 0) as onsite_avg_salary
                FROM jobs
                GROUP BY sector
                ORDER BY wfh_percentage DESC
            `;

            this.db.all(query, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    // ─── Insert Candidate Match ─────────────────────────────────────
    insertCandidateMatch(candidatePhone, jobId, matchScore, matchReasons, aiExplanation) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO candidate_matches (
                    candidate_phone, job_id, match_score, match_reasons, ai_explanation
                ) VALUES (?, ?, ?, ?, ?)`,
                [candidatePhone, jobId, matchScore, JSON.stringify(matchReasons), aiExplanation],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    // ─── Get Unmatched Candidates ────────────────────────────────────
    getUnmatchedJobs(limit = 20) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM jobs
                WHERE analyzed_at IS NULL
                ORDER BY arbitrage_score DESC
                LIMIT ?
            `;

            this.db.all(query, [limit], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    // ─── Close Connection ────────────────────────────────────────────
    close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) reject(err);
                    else {
                        console.log('✅ Database connection closed');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }
}

export default Database;
