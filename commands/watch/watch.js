const Command = require('../command-interface.js');
const db = require('../../data/dao');
const Logger = require('../../core/logger');
const logger = new Logger();

class WatchCommand extends Command {
    async execute(context) {
        const { args, channelId, guildId } = context;

        if (!guildId) {
            return "Hisssss!!! I can only watch in a server channel, not a DM.";
        }

        if (!args || args.length === 0) {
            return "Hisssss!!! You didn't tell me who to watch, i.e.: !watch https://www.twitch.tv/heyitsquzo";
        }

        const url = args[0];
        let platform, channelName;

        if (url.includes('twitch.tv')) {
            platform = 'twitch';
            channelName = url.split('twitch.tv/')[1].replace(/\/$/, '');
        } else {
            return "Hisssss!!! I can only watch Twitch for now.";
        }

        try {
            await db.addToWatchlist(platform, channelName, guildId, channelId);
            return `Ready to pounce! I'll alert you when ${channelName} goes live!`;
        } catch (error) {
            logger.error('Error adding to watchlist:', error);
            return "Hissss!!! Something went wrong storing your watch request.";
        }
    }
}

module.exports = WatchCommand;