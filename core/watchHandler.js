const axios = require('axios');
const dao = require('../data/dao');
const discordClient = require('../clients/discordClient');

class WatchHandler {
    constructor() {
        this.pollInterval = 60 * 1000; // 60 seconds
        this.twitchAuthToken = null;
    }

    async start() {
        await this.refreshTwitchToken();
        console.log('starting to poll');
        await this.pollLoop();
        setInterval(() => this.pollLoop(), this.pollInterval);
    }

    // --- Main polling loop ---
    async pollLoop() {
        try {
            const watches = await dao.getAllTwitchWatches();
            if (!watches.length) return;

            const liveStreams = await this.getLiveStreams(watches);

            for (const watch of watches) {
                const streamData = liveStreams.find(
                    s => s.user_login.toLowerCase() === watch.channel_name.toLowerCase()
                );
                if (!streamData) continue;

                if (streamData.id !== watch.last_stream_id) {
                    await this.sendLiveNotification(watch, streamData);
                    await dao.updateLastStreamId(watch.id, streamData.id);
                }
            }
        } catch (err) {
            console.error('WatchHandler poll error:', err);
        }
    }

    // --- Twitch helpers ---
    async refreshTwitchToken() {
        const clientId = process.env.TWITCH_CLIENT_ID;
        const clientSecret = process.env.TWITCH_CLIENT_SECRET;

        try {
            const res = await axios.post(
                'https://id.twitch.tv/oauth2/token',
                null,
                { params: { client_id: clientId, client_secret: clientSecret, grant_type: 'client_credentials' } }
            );

            this.twitchAuthToken = res.data.access_token;
            console.log('Twitch app token acquired.');
        } catch (err) {
            console.error('Failed to get Twitch token:', err.response?.data || err.message);
        }
    }

    async getLiveStreams(watches) {
        const userLogins = [...new Set(watches.map(w => w.channel_name))];
        if (!userLogins.length) return [];

        const url = `https://api.twitch.tv/helix/streams?${userLogins.map(u => `user_login=${u}`).join('&')}`;
        try {
            const res = await axios.get(url, {
                headers: {
                    'Client-ID': process.env.TWITCH_CLIENT_ID,
                    'Authorization': `Bearer ${this.twitchAuthToken}`
                }
            });
            return res.data.data;
        } catch (err) {
            if (err.response?.status === 401) {
                console.log('Twitch token expired, refreshing...');
                await this.refreshTwitchToken();
                return this.getLiveStreams(watches);
            }
            console.error('Twitch API error:', err.response?.data || err.message);
            return [];
        }
    }

    // --- Notification helpers ---
    async sendLiveNotification(watch, streamData) {
        const twitchUrl = `https://twitch.tv/${streamData.user_login}`;

        // Replace {width} and {height} placeholders in Twitch thumbnail
        const thumbnailUrl = streamData.thumbnail_url
            ? streamData.thumbnail_url.replace('{width}', '640').replace('{height}', '360')
            : undefined;

        const embed = {
            author: {
                name: streamData.user_name,
                url: twitchUrl
            },
            title: streamData.title || 'Live on Twitch!',
            url: twitchUrl,
            description: streamData.game_name || 'Playing something epic!',
            color: 0x9146FF,
            image: thumbnailUrl ? { url: thumbnailUrl } : undefined, // <- this is correct
            fields: [
                { name: 'Game', value: streamData.game_name || 'Unknown', inline: true },
                { name: 'Viewers', value: `${streamData.viewer_count || '0'}`, inline: true }
            ],
            timestamp: new Date().toISOString(),
            footer: { text: 'Zoomie Alerts' }
        };

        const text = `🚨 ${streamData.user_name} just went live! Time to pounce! 🐱💨`;

        try {
            await discordClient.sendEmbed(watch.discord_channel_id, { text, ...embed });
        } catch (err) {
            console.error('Error sending live notification:', err);
        }
    }

}

module.exports = new WatchHandler();