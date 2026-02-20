const Command = require('../command-interface.js');
const db = require('../../data/dao');
const Logger = require('../../core/logger');
const logger = new Logger();
const { SlashCommandBuilder } = require('discord.js');

class WatchCommand extends Command {
    static slashData = new SlashCommandBuilder()
        .setName('watch')
        .setDescription('Add a Twitch channel to the watchlist')
        .addStringOption(option =>
            option.setName('url')
                  .setDescription('Twitch channel URL to watch')
                  .setRequired(true)
        );

    async execute(context) {
        const { guildId, channelId, interaction, text } = context;

        if (!guildId) {
            return "Hisssss!!! I can only watch in a server channel, not a DM.";
        }

        // Determine the URL from slash command or free-text
        const url = interaction?.options.getString('url')?.trim() || (text || '').trim();

        if (!url) {
            return "Hisssss!!! You didn't tell me who to watch, e.g.: /watch https://www.twitch.tv/heyitsquzo";
        }

        let platform, channelName;

        if (url.includes('twitch.tv')) {
            platform = 'twitch';
            channelName = url.split('twitch.tv/')[1].replace(/\/$/, '');
        } else {
            return "Hisssss!!! I can only watch Twitch for now.";
        }

        // Make sure we have a valid channel ID
        const targetChannelId = channelId || interaction?.channelId;
        if (!targetChannelId) {
            return "Hisssss!!! I need a channel to watch in!";
        }

        try {
            await db.addToWatchlist(platform, channelName, guildId, targetChannelId);
            return `Ready to pounce! I'll alert you when ${channelName} goes live!`;
        } catch (error) {
            logger.error('Error adding to watchlist:', error);
            return "Hissss!!! Something went wrong storing your watch request.";
        }
    }
}

module.exports = WatchCommand;