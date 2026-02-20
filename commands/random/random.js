const Command = require('../command-interface.js');
let eventEmitter = require('../../core/eventEmitter');

class RandomNumber extends Command {
    static slashData = require('discord.js').SlashCommandBuilder
        ? new (require('discord.js').SlashCommandBuilder)()
            .setName('random')
            .setDescription('Generate a random number between min and max')
            .addIntegerOption(option =>
                option.setName('min')
                      .setDescription('Minimum number')
                      .setRequired(false)
            )
            .addIntegerOption(option =>
                option.setName('max')
                      .setDescription('Maximum number')
                      .setRequired(false)
            )
        : undefined;

    async execute(context) {
        const { interaction, message, lastResult, text } = context;

        let min = 1;
        let max = 100;

        if (interaction) {
            // Slash command
            const minOpt = interaction.options.getInteger('min');
            const maxOpt = interaction.options.getInteger('max');
            if (minOpt !== null) min = minOpt;
            if (maxOpt !== null) max = maxOpt;
        } else if (text) {
            // Reaction or context-based trigger
            const args = text.trim().split(/\s+/);
            if (args.length >= 2) {
                const parsedMin = parseInt(args[0]);
                const parsedMax = parseInt(args[1]);
                if (!isNaN(parsedMin) && !isNaN(parsedMax) && parsedMin <= parsedMax) {
                    min = parsedMin;
                    max = parsedMax;
                }
            }
        }

        const result = this.randomInRange(min, max);
        const response = `🎲 Your random number between ${min} and ${max} is **${result}**!`;

        // Logging
        if (lastResult === null) {
            console.log('RandomNumber range:', min, max);
            console.log('RandomNumber result:', result);
        } else {
            console.log('RandomNumber executed in chain/pipeline:', result);
        }

        // Emit for UI/overlay
        eventEmitter.emit('broadcast', {
            type: 'command:random',
            payload: response
        });

        return response;
    }

    randomInRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

module.exports = RandomNumber;