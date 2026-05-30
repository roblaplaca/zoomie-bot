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
    },

    // Treats decay at 1 level per 20 minutes. Max 5.
    TREAT_DECAY_MS: 20 * 60 * 1000,
    TREAT_MAX: 5,

    _effectiveTreats(count, givenAt) {
        if (!givenAt || !count) return 0;
        const decayed = Math.floor((Date.now() - givenAt) / this.TREAT_DECAY_MS);
        return Math.max(0, count - decayed);
    },

    async giveTreat(discordGuildId) {
        const res = await pool.query(
            `SELECT treat_count, treat_given_at FROM zoomie_guild_state WHERE discord_guild_id = $1`,
            [discordGuildId]
        );

        const row = res.rows[0];
        const current = row ? this._effectiveTreats(row.treat_count, row.treat_given_at) : 0;

        if (current >= this.TREAT_MAX) return { level: current, maxed: true };

        const newCount = current + 1;

        await pool.query(
            `INSERT INTO zoomie_guild_state (discord_guild_id, treat_count, treat_given_at, updated_at)
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT (discord_guild_id)
             DO UPDATE SET treat_count = $2, treat_given_at = $3, updated_at = NOW()`,
            [discordGuildId, newCount, Date.now()]
        );

        return { level: newCount, maxed: false };
    },

    async getTreatLevel(discordGuildId) {
        const res = await pool.query(
            `SELECT treat_count, treat_given_at FROM zoomie_guild_state WHERE discord_guild_id = $1`,
            [discordGuildId]
        );
        if (!res.rows[0]) return 0;
        return this._effectiveTreats(res.rows[0].treat_count, res.rows[0].treat_given_at);
    }
};

module.exports = zoomieGuildStateDao;