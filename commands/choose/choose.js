const { SlashCommandBuilder } = require('discord.js');
const Command = require('../command-interface');

class Choose extends Command {

    static slashData = new SlashCommandBuilder()
        .setName('choose')
        .setDescription('Pick randomly from your options')
        .addStringOption(option =>
            option.setName('options')
                  .setDescription('Comma- or space-separated list of choices')
                  .setRequired(true)
        );

    async execute({ interaction }) {
        let optionsString = interaction.options.getString('options') || '';
        optionsString = optionsString.trim();

        if (!optionsString) return 'No valid choices provided!';

        // Split by comma OR multiple spaces
        const options = optionsString
            .split(/\s*,\s*|\s+/)
            .map(opt => opt.trim())
            .filter(Boolean);

        if (options.length === 0) return 'No valid choices provided!';

        const randomIndex = Math.floor(Math.random() * options.length);
        const choice = options[randomIndex];

        return choice;
    }
}

module.exports = Choose;