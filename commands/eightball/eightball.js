const Command = require('../command-interface.js');
let eventEmitter = require('../../core/eventEmitter');

class EightBall extends Command {
    execute(context) {
        const { message, lastResult } = context;

        // Optional: extract question for logging
        const question = message.replace(/^!8ball\s*/i, '').trim();

        const response = this.getRandomAnswer();

        if (lastResult === null) {
            console.log('8Ball question:', question || '[no question]');
            console.log('8Ball cat response:', response);
        } else {
            console.log('8Ball executed in chain/pipeline:', response);
        }

        // Emit for UI/overlay
        eventEmitter.emit('broadcast', {
            type: 'command:8ball',
            payload: response
        });

        return response;
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

        const index = Math.floor(Math.random() * catAnswers.length);
        return catAnswers[index];
    }
}

module.exports = EightBall;
