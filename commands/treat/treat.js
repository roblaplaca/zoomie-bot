const Command = require('../command-interface.js');
const zoomieGuildStateDao = require('../../data/zoomieGuildStateDao');
const Logger = require('../../core/logger');
const logger = new Logger();
const { SlashCommandBuilder } = require('discord.js');

const TREAT_RESPONSES = [
    '...fine. But don\'t read into this.',       // 0 → 1
    'Another one. I\'ll allow it.',               // 1 → 2
    'You\'re not terrible at bribery.',           // 2 → 3
    'Okay. I\'m listening.',                      // 3 → 4
    'This is embarrassing for both of us.',       // 4 → 5
];

class TreatCommand extends Command {

    static slashData = new SlashCommandBuilder()
        .setName('treat')
        .setDescription('Give Zoomie a treat. Bribery works, up to a point.');

    async execute(context) {
        const { guildId } = context;

        if (!guildId) return 'Treats only work in servers. Witnesses required.';

        try {
            const { level, maxed } = await zoomieGuildStateDao.giveTreat(guildId);

            if (maxed) return 'I\'m already bought. Save it for later.';

            logger.info(`Treat given in guild ${guildId}, now at level ${level}`);
            return TREAT_RESPONSES[level - 1];

        } catch (err) {
            logger.error('Error giving treat', err);
            return 'The treat fell behind the fridge.';
        }
    }
}

module.exports = TreatCommand;
