const Command = require('../command-interface.js');
const { SlashCommandBuilder } = require('discord.js');

class CoinFlip extends Command {

    static slashData = new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('Flip a coin');

    async execute({ interaction }) {

        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        const response = `🪙 It's ${result}!`;

        console.log('CoinFlip result:', result);

        return response;
    }
}

module.exports = CoinFlip;