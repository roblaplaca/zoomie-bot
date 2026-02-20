const Command = require('../command-interface.js');
const { SlashCommandBuilder } = require('discord.js');

class EightBall extends Command {

    static slashData = new SlashCommandBuilder()
        .setName('8ball')
        .setDescription('Ask the 8ball a question')
        .addStringOption(option =>
            option.setName('question')
                  .setDescription('Your question for the 8ball')
                  .setRequired(false)
        );

    async execute(context) {
        // Support both slash commands and reactions
        const question = context.interaction
            ? context.interaction.options.getString('question') || '[no question]'
            : context.text || '[no question]';

        const answer = this.getRandomAnswer();

        console.log('8Ball question:', question);
        console.log('8Ball response:', answer);

        return `🎱 ${answer}`;
    }

    getRandomAnswer() {
        const catAnswers = [
            "Purrhaps yes 🐾",
            "Meowy definitely!",
            "Hiss… maybe not.",
            "Tail twitch says yes!",
            "I knead to think about it… ask later.",
            "Paw-sitively!",
            "Claws say no.",
            "Fur real… yes.",
            "Outlook purrhaps good.",
            "Sleep on it, then ask again.",
            "Chasing yarn says yes!",
            "Catnip vibes: uncertain.",
            "My whiskers twitch… yes.",
            "Scratch that… no.",
            "Paws and consider again.",
            "The litter box says maybe.",
            "Feline intuition: yes.",
            "Not in the mood to answer…",
            "Mrow? Ask again later.",
            "Purrhaps not today."
        ];

        return catAnswers[Math.floor(Math.random() * catAnswers.length)];
    }
}

module.exports = EightBall;