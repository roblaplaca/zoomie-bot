const Command = require('../command-interface.js');
let eventEmitter = require('../../core/eventEmitter');

class CoinFlip extends Command {
    execute(context) {
        const { lastResult } = context;

        const result = this.flipCoin();
        const response = `It's ${result}!`;

        // Logging
        if (lastResult === null) {
            console.log('CoinFlip result:', result);
        } else {
            console.log('CoinFlip executed in chain/pipeline:', result);
        }

        // Emit for UI/overlay
        eventEmitter.emit('broadcast', {
            type: 'command:coinflip',
            payload: response
        });

        return response;
    }

    flipCoin() {
        return Math.random() < 0.5 ? 'heads' : 'tails';
    }
}

module.exports = CoinFlip;