const Command = require('../command-interface.js');
let eventEmitter = require('../../core/eventEmitter');

class Choose extends Command {
    execute(context) {
        const { args, lastResult } = context;

        console.log('Choose context: ', context)

    	let output = this.getRandomArg(args);

    	if (lastResult === null) {
            console.log('choose: passthrough : ', output);
        } else {
            console.log('choose: execute');
        }

        eventEmitter.emit('broadcast', {
            type: 'command:choose',
            payload: output
        });

        return output;
    }

    getRandomArg(args) {
		const randomIndex = Math.floor(Math.random() * args.length);

		return args[randomIndex].trim();
	}
}

module.exports = Choose;