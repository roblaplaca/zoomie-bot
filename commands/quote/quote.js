const Command = require('../command-interface.js');
const learnedQuotesDao = require('../../data/learnedQuotesDao');
const Logger = require('../../core/logger');
const logger = new Logger();

class QuoteCommand extends Command {
    async execute(context) {
        const { args, guildId } = context;

        if (args.length < 1) {
            return "Hissss! YOU HAVE TO DO: !quote @user|concept [index]";
        }

        // Extract first argument: could be a mention or a concept string
        const target = args.shift();
        let targetIdOrConcept;
        const mentionMatch = target.match(/^<@!?(\d+)>$/);
        if (mentionMatch) {
            targetIdOrConcept = mentionMatch[1]; // Discord user ID
        } else {
            targetIdOrConcept = target.toLowerCase(); // Concept string
        }

        // Optional index argument
        let index = null;
        if (args.length > 0 && /^\d+$/.test(args[0])) {
            index = parseInt(args[0], 10);
        }

        try {
            let quote;

            if (index !== null) {
                quote = await learnedQuotesDao.getQuoteByIndex(
                    guildId,
                    targetIdOrConcept,
                    index
                );
            } else {
                quote = await learnedQuotesDao.getRandomQuote(
                    guildId,
                    targetIdOrConcept
                );
            }

            if (!quote) {
                if (mentionMatch) {
                    return `Hissss! No quotes found for <@${targetIdOrConcept}>.`;
                } else {
                    return `Hissss! No quotes found for concept "${targetIdOrConcept}".`;
                }
            }

            logger.info(
                `Sent quote for "${targetIdOrConcept}" in guild ${guildId}: "${quote.quote}"`
            );

            return `${quote.quote}`;

        } catch (err) {
            logger.error('Error fetching quote', err);
            return "Hissss! It didn't work.";
        }
    }
}

module.exports = QuoteCommand;
