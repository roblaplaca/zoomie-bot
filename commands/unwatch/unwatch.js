const Command = require('../command-interface.js');
const db = require('../../data/dao');
const Logger = require('../../core/logger');
const logger = new Logger();

class UnwatchCommand extends Command {
    async execute(context) {
        const { args, channelId, guildId } = context;

        if (!guildId) {
            return "Hisssss!!! I can only unwatch in a server channel, not a DM.";
        }

        if (!args || args.length === 0) {
            return "Hisssss!!! You didn't tell me who to unwatch, i.e.: !unwatch https://www.twitch.tv/heyitsquzo";
        }

        const url = args[0];
        let platform, channelName;

        if (url.includes('twitch.tv')) {
            platform = 'twitch';
            channelName = url.split('twitch.tv/')[1].replace(/\/$/, '');
        } else {
            return "Hisssss!!! I can only unwatch Twitch for now.";
        }

        try {
            await db.removeFromWatchlist(platform, channelName, guildId, channelId);
            return `Fine. I won't alert you when ${channelName} goes live anymore.`;
        } catch (error) {
            logger.error('Error removing from watchlist:', error);
            return "Hissss!!! Something went wrong removing your watch request.";
        }
    }
}

module.exports = UnwatchCommand;