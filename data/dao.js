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
    async addToWatchlist(platform, channelName, discordGuildId, discordChannelId, roleId = null) {
        const res = await pool.query(
            `INSERT INTO watches (platform, channel_name, discord_guild_id, discord_channel_id, role_id)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (platform, channel_name, discord_guild_id, discord_channel_id) DO NOTHING
             RETURNING *`,
            [platform, channelName, discordGuildId, discordChannelId, roleId]
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
            `SELECT id, platform, channel_name, discord_guild_id, discord_channel_id, last_stream_id, role_id
             FROM watches
             WHERE platform = $1`,
            ['twitch']
        );
        return res.rows;
    },

    async saveRoleRedeem({ guildId, channelId, messageId, yesEmoji, noEmoji, roleId }) {
        await pool.query(
            `INSERT INTO role_redeems (guild_id, channel_id, message_id, yes_emoji, no_emoji, role_id)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (guild_id, message_id) DO UPDATE
             SET channel_id = $2, yes_emoji = $4, no_emoji = $5, role_id = $6`,
            [guildId, channelId, messageId, yesEmoji, noEmoji, roleId]
        );
    },

    async getRoleRedeemByMessage(messageId) {
        const res = await pool.query(
            `SELECT * FROM role_redeems WHERE message_id = $1`,
            [messageId]
        );
        return res.rows[0] || null;
    },

    async getAllRoleRedeems() {
        const res = await pool.query(`SELECT * FROM role_redeems`);
        return res.rows;
    }
};

module.exports = dao;