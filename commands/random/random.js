const Command = require('../command-interface.js');
let eventEmitter = require('../../core/eventEmitter');

class RandomNumber extends Command {
    execute(context) {
        const { message, lastResult } = context;

        // Extract min and max from message: "!random 10 50"
        const args = message.trim().split(/\s+/).slice(1); // skip !random
        let min = 1;
        let max = 100;

        if (args.length === 2) {
            const parsedMin = parseInt(args[0]);
            const parsedMax = parseInt(args[1]);
            if (!isNaN(parsedMin) && !isNaN(parsedMax) && parsedMin <= parsedMax) {
                min = parsedMin;
                max = parsedMax;
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
