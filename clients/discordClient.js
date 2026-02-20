const axios = require('axios');
const crypto = require('crypto');
const querystring = require('querystring');
const { Client, GatewayIntentBits, Partials } = require('discord.js');

const registerSlashCommands = require('../core/registerSlashCommands');

class DiscordClient {
    constructor() {
        this.clientId = process.env.DISCORD_CLIENT_ID;
        this.clientSecret = process.env.DISCORD_CLIENT_SECRET;
        this.redirectUri = process.env.DISCORD_REDIRECT_URL;
        this.botToken = process.env.DISCORD_BOT_TOKEN;
        this.client = null;
    }

    getAuthUrl(req) {
        const scopes = 'bot applications.commands';

        const state = crypto.randomBytes(16).toString('hex');

        req.session.oauthState = state;

        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            response_type: 'code',
            scope: scopes,
            permissions: '534723951680',
            state
        });

        return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
    }

    async getOAuthToken(code) {
        try {
            const oauthResult = await axios({
                method: 'POST',
                url: 'https://discord.com/api/oauth2/token',
                data: querystring.stringify({
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    code: code,
                    grant_type: 'authorization_code',
                    redirect_uri: this.redirectUri,
                    scope: 'bot',
                }),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            return oauthResult.data; // Returns the full token object
        } catch (error) {
            console.error('Error exchanging code for token:', error);
            return null;
        }
    }

    async connect() {
        if (this.client) {
            return;
        }

        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.MessageContent
            ],
            partials: [Partials.Message, Partials.Channel, Partials.Reaction]
        });

        return new Promise((resolve, reject) => {
            this.client.once('ready', async () => {
                console.log('Discord Bot is ready!');

                const guildId = process.env.NODE_ENV === 'development' ? process.env.DISCORD_GUILD_ID : undefined;

                await registerSlashCommands({
                    token: this.botToken,
                    clientId: this.clientId,
                    guildId
                });

                resolve();
            });

            this.client.on('error', (error) => {
                console.error('Discord client error:', error);
                reject(error);
            });

            this.client.login(this.botToken);
        });
    }

	async getChannelIdByName(channelName) {
	    if (!this.client || !this.client.isReady()) {
	        throw new Error('Discord client is not connected.');
	    }

	    let foundChannelId = null;

	    this.client.guilds.cache.forEach(guild => {
	        guild.channels.cache.forEach(channel => {
	            if (channel.isTextBased() && channel.name === channelName) {
	                foundChannelId = channel.id;
	                return;
	            }
	        });
	        if (foundChannelId) return;
	    });

	    return foundChannelId;
	}

	listenToChannel(channelId, callback) {
        if (!this.client || !this.client.isReady()) {
            throw new Error('Discord client is not connected.');
        }

        this.client.on('messageCreate', (message) => {
            if (message.channel.id === channelId) {
                callback(message);
            }
        });
    }

    async sendEmbed(channelId, { text, ...embedData }) {
        if (!this.client || !this.client.isReady()) {
            throw new Error('Discord client is not connected.');
        }

        const channel = this.client.channels.cache.get(channelId);
        if (!channel || !channel.isTextBased()) {
            console.warn('Discord channel not found or not text-based:', channelId);
            return;
        }

        // Only send image if url is provided
        if (embedData.image && embedData.image.url && typeof embedData.image.url !== 'string') {
            embedData.image.url = String(embedData.image.url);
        }

        await channel.send({ content: text, embeds: [embedData] });
    }

}

module.exports = new DiscordClient();