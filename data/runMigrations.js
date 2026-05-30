const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT, 10),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
});

// Postgres "already exists" error codes — safe to skip on a fresh schema_migrations bootstrap
const ALREADY_EXISTS_CODES = new Set(['42P07', '42701', '42710', '42P16']);

async function runMigrations() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            filename TEXT PRIMARY KEY,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    const dir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(dir)
        .filter(f => f.endsWith('.sql'))
        .sort();

    for (const file of files) {
        const { rows } = await pool.query(
            'SELECT 1 FROM schema_migrations WHERE filename = $1',
            [file]
        );
        if (rows.length > 0) continue;

        const sql = fs.readFileSync(path.join(dir, file), 'utf8');
        try {
            await pool.query(sql);
            console.log(`[migrations] applied ${file}`);
        } catch (err) {
            if (ALREADY_EXISTS_CODES.has(err.code)) {
                console.warn(`[migrations] skipped ${file} (objects already exist)`);
            } else {
                throw err;
            }
        }

        await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
    }
}

module.exports = runMigrations;
