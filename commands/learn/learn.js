const Command = require('../command-interface.js');
const learnedQuotesDao = require('../../data/learnedQuotesDao');
const Logger = require('../../core/logger');
const logger = new Logger();
const { SlashCommandBuilder } = require('discord.js');

class LearnCommand extends Command {

    static slashData = new SlashCommandBuilder()
        .setName('learn')
        .setDescription('Teach the bot a new quote for someone or something')
        .addStringOption(option =>
            option.setName('target')
                  .setDescription('Who or what this quote is for (mention or name)')
                  .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('quote')
                  .setDescription('The quote to learn')
                  .setRequired(true)
        );

    async execute(context) {
        const { interaction, guildId, subject, text } = context;

        if (!guildId) return 'This command must be used on a server.';

        // Determine target and quote depending on source
        let targetInput, quote;

        if (interaction) {
            // Slash command
            targetInput = interaction.options.getString('target').trim();
            quote = interaction.options.getString('quote').trim();
        } else {
            // Reaction trigger
            targetInput = subject?.id ? `<@${subject.id}>` : subject; // subject = message author or string
            quote = text?.trim() || '[no quote provided]';
        }

        // Check if target is a user mention
        const mentionMatch = targetInput.match(/^<@!?(\d+)>$/);
        const isUser = !!mentionMatch;
        const targetIdOrSubject = isUser ? mentionMatch[1] : targetInput.toLowerCase();

        try {
            await learnedQuotesDao.addQuote(guildId, targetIdOrSubject, quote);
            logger.info(`Learned quote for "${targetIdOrSubject}" in guild ${guildId}: ${quote}`);

            // Return friendly message
            return isUser
                ? `🧠 Learned a new quote for <@${targetIdOrSubject}>: ${quote}`
                : `🧠 Learned a new quote for ${targetIdOrSubject}: ${quote}`;

        } catch (err) {
            logger.error('Error saving learned quote', err);
            return 'Failed to save quote. Please try again later.';
        }
    }
}

module.exports = LearnCommand;