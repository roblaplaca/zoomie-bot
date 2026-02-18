const Command = require('../command-interface.js');
const learnedQuotesDao = require('../../data/learnedQuotesDao');
const Logger = require('../../core/logger');
const logger = new Logger();

class LearnCommand extends Command {
    async execute(context) {
        const { args, guildId } = context;

        if (args.length < 2) {
            return "Usage: !learn @user|concept [quote]";
        }

        // Extract target (could be a user mention or concept string)
        const target = args.shift();
        let targetIdOrConcept;

        // Check if it's a user mention
        const mentionMatch = target.match(/^<@!?(\d+)>$/);
        if (mentionMatch) {
            targetIdOrConcept = mentionMatch[1]; // Discord user ID
        } else {
            // Treat as concept string
            targetIdOrConcept = target.toLowerCase(); // e.g., "trashtalk"
        }

        const quote = args.join(' ').trim();
        if (!quote) {
            return "You must provide a quote to learn!";
        }

        try {
            await learnedQuotesDao.addQuote(guildId, targetIdOrConcept, quote);

            logger.info(
                `Learned quote for "${targetIdOrConcept}" in guild ${guildId}: "${quote}"`
            );

            if (mentionMatch) {
                return `Learned a new quote for <@${targetIdOrConcept}>!`;
            } else {
                return `Learned a new quote for concept "${targetIdOrConcept}"!`;
            }

        } catch (err) {
            logger.error('Error saving learned quote', err);
            return "Failed to save quote. Please try again later.";
        }
    }
}

module.exports = LearnCommand;
