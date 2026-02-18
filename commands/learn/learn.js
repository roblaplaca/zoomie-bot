const Command = require('../command-interface.js');
const learnedQuotesDao = require('../../data/learnedQuotesDao');
const Logger = require('../../core/logger');
const logger = new Logger();

class LearnCommand extends Command {
    async execute(context) {
        const { args, guildId } = context;

        // Require at least a user mention and some quote text
        if (args.length < 2) {
            return "Usage: !learn @user [quote]";
        }

        // Extract user mention
        const userMention = args.shift();
        const discordUserId = userMention.replace(/[<@!>]/g, '');

        // Basic mention validation
        if (!/^\d+$/.test(discordUserId)) {
            return "You must mention a valid user.";
        }

        const quote = args.join(' ').trim();

        if (!quote) {
            return "You must provide a quote to learn!";
        }

        try {
            await learnedQuotesDao.addQuote(guildId, discordUserId, quote);

            logger.info(
                `Learned quote for ${discordUserId} in guild ${guildId}: "${quote}"`
            );

            return `Learned a new quote for <@${discordUserId}>!`;

        } catch (err) {
            logger.error('Error saving learned quote', err);
            return "Failed to save quote. Please try again later.";
        }
    }
}

module.exports = LearnCommand;