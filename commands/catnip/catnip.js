const Command = require('../command-interface.js');
const zoomieGuildStateDao = require('../../data/zoomieGuildStateDao');
const Logger = require('../../core/logger');
const logger = new Logger();
const { SlashCommandBuilder } = require('discord.js');

class CatnipCommand extends Command {

    static slashData = new SlashCommandBuilder()
        .setName('catnip')
        .setDescription('Give Zoomie catnip for a short time')
        .addIntegerOption(option =>
            option.setName('duration')
                  .setDescription('Duration in minutes (1–10, default 2)')
                  .setMinValue(1)
                  .setMaxValue(10)
                  .setRequired(false)
        );

    async execute(context) {
        const { interaction, guildId } = context;

        if (!guildId) {
            return 'Catnip only works in servers. I need witnesses.';
        }

        try {
            const durationMinutes =
                interaction?.options.getInteger('duration') ?? 2;

            // Activate catnip via the DAO
            await zoomieGuildStateDao.activateCatnip(guildId, durationMinutes);

            logger.info(
                `Catnip activated in guild ${guildId} for ${durationMinutes} minutes`
            );

            // Immediate trippy response
            return `...whoa. The carpet is blinking. (${durationMinutes}m)`;

        } catch (err) {
            logger.error('Error activating catnip', err);
            return 'The catnip fell behind the fridge. Try again.';
        }
    }
}

module.exports = CatnipCommand;