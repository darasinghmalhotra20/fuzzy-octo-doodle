import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from '../database/queries.js';
import { createObjectCsvWriter } from 'csv-writer';
import moment from 'moment';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// ═══════════════════════════════════════════════════════════════════
//  DASHBOARD SERVER — REST API + Web Interface
// ═══════════════════════════════════════════════════════════════════

let db = null;

// ─── Middleware ─────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── API Routes ─────────────────────────────────────────────────────

// Get all jobs with optional filters
app.get('/api/jobs', async (req, res) => {
    try {
        const filters = {
            sector: req.query.sector,
            is_wfh: req.query.wfh === 'true' ? true : (req.query.wfh === 'false' ? false : undefined),
            min_salary: req.query.min_salary ? parseInt(req.query.min_salary) : null,
            max_salary: req.query.max_salary ? parseInt(req.query.max_salary) : null,
            arbitrage_only: req.query.arbitrage === 'true',
        };

        const jobs = await db.getJobs(filters);
        res.json({ success: true, data: jobs, count: jobs.length });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get single job details
app.get('/api/jobs/:id', async (req, res) => {
    try {
        const query = 'SELECT * FROM jobs WHERE id = ?';
        const job = await new Promise((resolve, reject) => {
            db.db.get(query, [req.params.id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (job) {
            job.ai_analysis = JSON.parse(job.ai_analysis || '{}');
            job.required_skills = JSON.parse(job.required_skills || '[]');
        }

        res.json({ success: true, data: job });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get market trends
app.get('/api/trends', async (req, res) => {
    try {
        const days = req.query.days ? parseInt(req.query.days) : 30;
        const trends = await db.getMarketTrends(days);
        res.json({ success: true, data: trends });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get arbitrage opportunities
app.get('/api/arbitrage', async (req, res) => {
    try {
        const minScore = req.query.min_score ? parseInt(req.query.min_score) : 70;
        const opportunities = await db.getArbitrageOpportunities(minScore);
        res.json({ success: true, data: opportunities, count: opportunities.length });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get sector breakdown
app.get('/api/sectors', async (req, res) => {
    try {
        const query = `
            SELECT 
                sector,
                COUNT(*) as total_jobs,
                ROUND(AVG(salary_max), 0) as avg_salary,
                COUNT(CASE WHEN is_wfh = 1 THEN 1 END) as wfh_jobs,
                ROUND(COUNT(CASE WHEN is_wfh = 1 THEN 1 END) * 100.0 / COUNT(*), 2) as wfh_percentage
            FROM jobs
            GROUP BY sector
            ORDER BY total_jobs DESC
        `;

        const sectors = await new Promise((resolve, reject) => {
            db.db.all(query, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });

        res.json({ success: true, data: sectors });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get salary analysis
app.get('/api/salary-analysis', async (req, res) => {
    try {
        const sector = req.query.sector;
        const salaryStats = await db.getSalaryStats(sector);
        res.json({ success: true, data: salaryStats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get WFH analysis
app.get('/api/wfh-analysis', async (req, res) => {
    try {
        const wfhStats = await db.getWFHAnalysis();
        res.json({ success: true, data: wfhStats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get skills demand
app.get('/api/skills-demand', async (req, res) => {
    try {
        const skills = await db.getSkillsDemand();
        res.json({ success: true, data: skills });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Export jobs to CSV
app.post('/api/export', async (req, res) => {
    try {
        const { filters = {}, format = 'csv' } = req.body;
        const jobs = await db.getJobs(filters);

        if (format === 'csv') {
            const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
            const filename = `jobs_${timestamp}.csv`;

            const csvWriter = createObjectCsvWriter({
                path: path.join(__dirname, '..', '..', 'data', 'exports', filename),
                header: [
                    { id: 'id', title: 'ID' },
                    { id: 'job_title', title: 'Job Title' },
                    { id: 'company_name', title: 'Company' },
                    { id: 'location', title: 'Location' },
                    { id: 'is_wfh', title: 'WFH' },
                    { id: 'salary_min', title: 'Salary Min' },
                    { id: 'salary_max', title: 'Salary Max' },
                    { id: 'experience_min', title: 'Experience Min' },
                    { id: 'experience_max', title: 'Experience Max' },
                    { id: 'sector', title: 'Sector' },
                    { id: 'arbitrage_score', title: 'Arbitrage Score' },
                    { id: 'job_url', title: 'Job URL' },
                ],
            });

            await csvWriter.writeRecords(jobs);
            res.json({ success: true, filename, count: jobs.length });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get dashboard summary
app.get('/api/summary', async (req, res) => {
    try {
        const totalJobs = await new Promise((resolve, reject) => {
            db.db.get('SELECT COUNT(*) as count FROM jobs', (err, row) => {
                if (err) reject(err);
                else resolve(row?.count || 0);
            });
        });

        const wfhJobs = await new Promise((resolve, reject) => {
            db.db.get('SELECT COUNT(*) as count FROM jobs WHERE is_wfh = 1', (err, row) => {
                if (err) reject(err);
                else resolve(row?.count || 0);
            });
        });

        const avgSalary = await new Promise((resolve, reject) => {
            db.db.get('SELECT ROUND(AVG(salary_max), 0) as avg FROM jobs', (err, row) => {
                if (err) reject(err);
                else resolve(row?.avg || 0);
            });
        });

        const arbitrageCount = await new Promise((resolve, reject) => {
            db.db.get('SELECT COUNT(*) as count FROM jobs WHERE is_arbitrage_opportunity = 1', (err, row) => {
                if (err) reject(err);
                else resolve(row?.count || 0);
            });
        });

        res.json({
            success: true,
            data: {
                total_jobs: totalJobs,
                wfh_jobs: wfhJobs,
                wfh_percentage: Math.round((wfhJobs / totalJobs) * 100),
                avg_salary: avgSalary,
                arbitrage_opportunities: arbitrageCount,
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─── Initialize Server ──────────────────────────────────────────────
export async function startDashboard(dbInstance, port = 3000) {
    db = dbInstance;

    return new Promise((resolve) => {
        app.listen(port, () => {
            console.log(`\n🚀 Dashboard Server running at http://localhost:${port}`);
            console.log('\n📊 Available Endpoints:');
            console.log('   GET  /api/jobs                     - All jobs with filters');
            console.log('   GET  /api/jobs/:id                 - Job details');
            console.log('   GET  /api/trends                   - Market trends');
            console.log('   GET  /api/arbitrage                - Arbitrage opportunities');
            console.log('   GET  /api/sectors                  - Sector breakdown');
            console.log('   GET  /api/salary-analysis          - Salary insights');
            console.log('   GET  /api/wfh-analysis             - WFH statistics');
            console.log('   GET  /api/skills-demand            - Skills demand');
            console.log('   GET  /api/summary                  - Dashboard summary');
            console.log('   POST /api/export                   - Export CSV\n');
            resolve();
        });
    });
}

export default app;
