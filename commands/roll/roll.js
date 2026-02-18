const Command = require('../command-interface.js');
let eventEmitter = require('../../core/eventEmitter');

class Roll extends Command {
    execute(context) {
        const { message, lastResult } = context;

        // Extract max number, default to 6
        const match = message.match(/^!roll\s*(\d+)?/i);
        const max = match && match[1] ? parseInt(match[1]) : 6;

        const result = this.rollDice(max);
        const response = `${result}`;

        // Logging
        if (lastResult === null) {
            console.log('Roll max:', max);
            console.log('Roll result:', result);
        } else {
            console.log('Roll executed in chain/pipeline:', result);
        }

        // Emit for UI/overlay
        eventEmitter.emit('broadcast', {
            type: 'command:roll',
            payload: response
        });

        return response;
    }

    rollDice(max) {
        return Math.floor(Math.random() * max) + 1;
    }
}

module.exports = Roll;