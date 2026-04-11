const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT, 10),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
});

const zoomieGuildStateDao = {

    async activateCatnip(discordGuildId, durationMinutes = 5) {
        const expiresAt = Date.now() + durationMinutes * 60 * 1000;

        const res = await pool.query(
            `INSERT INTO zoomie_guild_state 
                (discord_guild_id, catnip_expires_at, updated_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (discord_guild_id)
             DO UPDATE SET 
                catnip_expires_at = $2,
                updated_at = NOW()
             RETURNING *`,
            [discordGuildId, expiresAt]
        );

        return res.rows[0];
    },

    async isCatnipActive(discordGuildId) {
        const res = await pool.query(
            `SELECT catnip_expires_at 
             FROM zoomie_guild_state
             WHERE discord_guild_id = $1`,
            [discordGuildId]
        );

        if (!res.rows[0]) return false;
        if (!res.rows[0].catnip_expires_at) return false;

        return res.rows[0].catnip_expires_at > Date.now();
    },

    async clearCatnip(discordGuildId) {
        await pool.query(
            `UPDATE zoomie_guild_state
             SET catnip_expires_at = NULL,
                 updated_at = NOW()
             WHERE discord_guild_id = $1`,
            [discordGuildId]
        );
    }
};

module.exports = zoomieGuildStateDao;