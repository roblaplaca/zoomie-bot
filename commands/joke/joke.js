const Command = require('../command-interface.js');
let eventEmitter = require('../../core/eventEmitter');
const axios = require('axios');

class Joke extends Command {
    async execute(context) {
        const { lastResult } = context;

        let responseText = "The joke machine broke. That *is* the joke.";

        try {
            const res = await axios.get(
                'https://v2.jokeapi.dev/joke/Miscellaneous,Dark,Pun,Spooky',
                {
                    params: {
                        blacklistFlags: 'racist,sexist,explicit'
                    }
                }
            );

            if (res.data.error) {
                responseText = "No jokes survived the filter.";
            } 
            else if (res.data.type === 'single') {
                responseText = `${res.data.joke}`;
            } 
            else if (res.data.type === 'twopart') {
                responseText =
`🤔 ${res.data.setup}
🤣 ${res.data.delivery}`;
            }

        } catch (err) {
            console.error('Joke API error:', err.message);
        }

        if (lastResult === null) {
            console.log('Joke result:', responseText);
        }

        eventEmitter.emit('broadcast', {
            type: 'command:joke',
            payload: responseText
        });

        return responseText;
    }
}

module.exports = Joke;
