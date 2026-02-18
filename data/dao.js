const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT, 10),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
});

const dao = {
    // Add a channel to watch
    async addToWatchlist(platform, channelName, discordGuildId, discordChannelId) {
        const res = await pool.query(
            `INSERT INTO watches (platform, channel_name, discord_guild_id, discord_channel_id)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (platform, channel_name, discord_guild_id, discord_channel_id) DO NOTHING
             RETURNING *`,
            [platform, channelName, discordGuildId, discordChannelId]
        );
        return res.rows[0]?.id || null;
    },

    // Remove a channel from watchlist
    async removeFromWatchlist(platform, channelName, discordGuildId, discordChannelId) {
        await pool.query(
            `DELETE FROM watches
             WHERE platform = $1 AND channel_name = $2 AND discord_guild_id = $3 AND discord_channel_id = $4`,
            [platform, channelName, discordGuildId, discordChannelId]
        );
    },

    // Get all watched channels
    async getWatchlist() {
        const res = await pool.query('SELECT * FROM watches');
        return res.rows;
    },

    // Get a specific watch entry
    async getWatch(platform, channelName, discordGuildId, discordChannelId) {
        const res = await pool.query(
            `SELECT * FROM watches
             WHERE platform = $1 AND channel_name = $2 AND discord_guild_id = $3 AND discord_channel_id = $4`,
            [platform, channelName, discordGuildId, discordChannelId]
        );
        return res.rows[0];
    },

    // Update the last_stream_id for a channel
    async updateLastStreamId(id, lastStreamId) {
        await pool.query(
            `UPDATE watches
             SET last_stream_id = $1
             WHERE id = $2`,
            [lastStreamId, id]
        );
    },

    // Get all Twitch watches
    async getAllTwitchWatches() {
        const res = await pool.query(
            `SELECT id, platform, channel_name, discord_guild_id, discord_channel_id, last_stream_id
             FROM watches
             WHERE platform = $1`,
            ['twitch']
        );
        return res.rows;
    }
};

module.exports = dao;