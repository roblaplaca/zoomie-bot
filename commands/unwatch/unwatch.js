const Command = require('../command-interface.js');
const db = require('../../data/dao');
const Logger = require('../../core/logger');
const logger = new Logger();
const { SlashCommandBuilder } = require('discord.js');

class UnwatchCommand extends Command {
    static slashData = new SlashCommandBuilder()
        .setName('unwatch')
        .setDescription('Remove a Twitch channel from the watchlist')
        .addStringOption(option =>
            option.setName('url')
                  .setDescription('Twitch channel URL to stop watching')
                  .setRequired(true)
        );

    async execute(context) {
        const { guildId, channelId, interaction, text } = context;

        if (!guildId) {
            return "Hisssss!!! I can only unwatch in a server channel, not a DM.";
        }

        // Determine the URL from slash command or free-text context
        const url = interaction?.options.getString('url')?.trim() || (text || '').trim();

        if (!url) {
            return "Hisssss!!! You didn't tell me who to unwatch, e.g.: /unwatch https://www.twitch.tv/heyitsquzo";
        }

        let platform, channelName;

        if (url.includes('twitch.tv')) {
            platform = 'twitch';
            channelName = url.split('twitch.tv/')[1].replace(/\/$/, '');
        } else {
            return "Hisssss!!! I can only unwatch Twitch for now.";
        }

        // Ensure we have a valid channel ID
        const targetChannelId = channelId || interaction?.channelId;
        if (!targetChannelId) {
            return "Hisssss!!! I need a channel to unwatch in!";
        }

        try {
            await db.removeFromWatchlist(platform, channelName, guildId, targetChannelId);
            return `Fine. I won't alert you when ${channelName} goes live anymore.`;
        } catch (error) {
            logger.error('Error removing from watchlist:', error);
            return "Hissss!!! Something went wrong removing your watch request.";
        }
    }
}

module.exports = UnwatchCommand;