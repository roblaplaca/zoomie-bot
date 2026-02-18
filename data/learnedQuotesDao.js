const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT, 10),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
});

const learnedQuotesDao = {
    // Add a new quote for a user in a guild
    async addQuote(discordGuildId, discordUserId, quote) {
        const res = await pool.query(
            `INSERT INTO learned_quotes (discord_guild_id, discord_user_id, quote)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [discordGuildId, discordUserId, quote]
        );
        return res.rows[0];
    },

    // Get all quotes for a specific user in a guild
    async getQuotesForUser(discordGuildId, discordUserId) {
        const res = await pool.query(
            `SELECT * FROM learned_quotes
             WHERE discord_guild_id = $1 AND discord_user_id = $2`,
            [discordGuildId, discordUserId]
        );
        return res.rows;
    },

    // Get a random quote for a specific user in a guild
    async getRandomQuote(discordGuildId, discordUserId) {
        const res = await pool.query(
            `SELECT * FROM learned_quotes
             WHERE discord_guild_id = $1 AND discord_user_id = $2
             ORDER BY RANDOM()
             LIMIT 1`,
            [discordGuildId, discordUserId]
        );
        return res.rows[0];
    },

    // Optional: delete a specific quote by ID
    async deleteQuoteById(id) {
        await pool.query(
            `DELETE FROM learned_quotes
             WHERE id = $1`,
            [id]
        );
    },

    // Get Nth most recent quote (1 = most recent)
    async getQuoteByIndex(discordGuildId, discordUserId, index) {
        const offset = index - 1;

        const res = await pool.query(
            `SELECT *
             FROM learned_quotes
             WHERE discord_guild_id = $1
               AND discord_user_id = $2
             ORDER BY created_at DESC
             OFFSET $3
             LIMIT 1`,
            [discordGuildId, discordUserId, offset]
        );

        return res.rows[0];
    }
};

module.exports = learnedQuotesDao;
