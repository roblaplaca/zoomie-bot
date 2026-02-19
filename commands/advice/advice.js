const Command = require('../command-interface.js');
let eventEmitter = require('../../core/eventEmitter');
const axios = require('axios');

class Advice extends Command {
    async execute(context) {
        const { lastResult } = context;

        let responseText = "I tried to get advice… but wisdom is buffering 🤔";

        try {
            const res = await axios.get('https://api.adviceslip.com/advice', {
                headers: {
                    'Cache-Control': 'no-cache'
                },
                params: {
                    t: Date.now() // prevents cached responses
                }
            });

            if (res.data && res.data.slip && res.data.slip.advice) {
                responseText = `💡 ${res.data.slip.advice}`;
            }

        } catch (err) {
            console.error('Advice API error:', err.message);
        }

        // Logging
        if (lastResult === null) {
            console.log('Advice result:', responseText);
        } else {
            console.log('Advice executed in chain/pipeline.');
        }

        // Emit for overlay/UI
        eventEmitter.emit('broadcast', {
            type: 'command:advice',
            payload: responseText
        });

        return responseText;
    }
}

module.exports = Advice;
