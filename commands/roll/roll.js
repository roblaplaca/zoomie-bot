const Command = require('../command-interface.js');
const { SlashCommandBuilder } = require('discord.js');

class Roll extends Command {
    static slashData = new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Roll a dice')
        .addIntegerOption(option =>
            option.setName('max')
                  .setDescription('Maximum number on the dice')
                  .setRequired(false)
        );

    async execute(context) {
        // For slash commands
        let max = 6;

        if (context.interaction) {
            max = context.interaction.options.getInteger('max') || 6;
        } else if (context.text) {
            // For reactions or free text context
            const match = context.text.match(/(\d+)/);
            if (match) max = parseInt(match[1]);
        }

        const result = this.rollDice(max);

        console.log('Roll max:', max);
        console.log('Roll result:', result);

        return `🎲 You rolled a ${result} on a ${max} sided die!`;
    }

    rollDice(max) {
        return Math.floor(Math.random() * max) + 1;
    }
}

module.exports = Roll;