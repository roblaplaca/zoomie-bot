const Command = require('../command-interface.js');
const learnedQuotesDao = require('../../data/learnedQuotesDao');
const Logger = require('../../core/logger');
const logger = new Logger();

class QuoteCommand extends Command {
    async execute(context) {
        const { args, guildId } = context;

        if (args.length < 1) {
            return "Hissss! YOU HAVE TO DO: !quote @user";
        }

        const userMention = args.shift();
        const discordUserId = userMention.replace(/[<@!>]/g, '');

        if (!/^\d+$/.test(discordUserId)) {
            return "You must mention a valid user.";
        }

        // Optional index argument
        let index = null;

        if (args.length > 0 && /^\d+$/.test(args[0])) {
            index = parseInt(args[0], 10);
        }

        try {
            let quote;

            if (index) {
                quote = await learnedQuotesDao.getQuoteByIndex(
                    guildId,
                    discordUserId,
                    index
                );
            } else {
                quote = await learnedQuotesDao.getRandomQuote(
                    guildId,
                    discordUserId
                );
            }

            if (!quote) {
                return `Hissss! No quotes found for <@${discordUserId}>.`;
            }

            logger.info(
                `Sent quote for ${discordUserId} in guild ${guildId}: "${quote.quote}"`
            );

            return `${quote.quote}`;

        } catch (err) {
            logger.error('Error fetching quote', err);
            return "Hissss! It didn't work.";
        }
    }
}

module.exports = QuoteCommand;