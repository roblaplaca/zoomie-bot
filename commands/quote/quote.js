const Command = require('../command-interface.js');
const learnedQuotesDao = require('../../data/learnedQuotesDao');
const Logger = require('../../core/logger');
const logger = new Logger();
const { SlashCommandBuilder } = require('discord.js');

class QuoteCommand extends Command {

    static slashData = new SlashCommandBuilder()
        .setName('quote')
        .setDescription('Retrieve a learned quote')
        .addStringOption(option =>
            option.setName('target')
                  .setDescription('Who or what to get a quote for (mention or subject)')
                  .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('index')
                  .setDescription('Specific quote index')
                  .setRequired(false)
        );

    async execute(context) {
        const { interaction, guildId, subject, text } = context;

        if (!guildId) return 'This command must be used on a server.';

        // Determine target and index
        let targetInput, index;

        if (interaction) {
            // Slash command
            targetInput = interaction.options.getString('target').trim();
            index = interaction.options.getInteger('index');
        } else {
            // Reaction trigger
            targetInput = subject?.id ? `<@${subject.id}>` : subject; // subject = user object or string
            index = null; // reactions won't supply index
        }

        // Detect if targetInput is a user mention
        const mentionMatch = targetInput.match(/^<@!?(\d+)>$/);
        const isUser = !!mentionMatch;
        const targetIdOrSubject = isUser ? mentionMatch[1] : targetInput.toLowerCase();

        try {
            let quote;

            if (index !== null) {
                quote = await learnedQuotesDao.getQuoteByIndex(guildId, targetIdOrSubject, index);
            } else {
                quote = await learnedQuotesDao.getRandomQuote(guildId, targetIdOrSubject);
            }

            if (!quote) {
                return isUser
                    ? `No quotes found for <@${targetIdOrSubject}>.`
                    : `No quotes found for "${targetInput}".`;
            }

            logger.info(`Sent quote for "${targetIdOrSubject}" in guild ${guildId}: ${quote.quote}`);

            return isUser
                ? `<@${targetIdOrSubject}>: ${quote.quote}`
                : `${targetIdOrSubject}: ${quote.quote}`;

        } catch (err) {
            logger.error('Error fetching quote', err);
            return "Something went wrong fetching that quote.";
        }
    }
}

module.exports = QuoteCommand;