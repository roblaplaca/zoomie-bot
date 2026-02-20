const Command = require('../command-interface.js');
const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

class Joke extends Command {

    static slashData = new SlashCommandBuilder()
        .setName('joke')
        .setDescription('Tell a random joke');

    async execute(context) {
        // Support slash commands or reactions
        const interaction = context.interaction;

        let responseText = "The joke machine broke. That *is* the joke.";

        try {
            const res = await axios.get(
                'https://v2.jokeapi.dev/joke/Miscellaneous,Pun,Spooky',
                {
                    params: {
                        blacklistFlags: 'nsfw,religious,political,racist,sexist,explicit'
                    }
                }
            );

            const data = res.data;

            if (data.error) {
                responseText = "No jokes survived the filter.";
            } 
            else if (data.type === 'single') {
                responseText = data.joke;
            } 
            else if (data.type === 'twopart') {
                responseText = `🤔 ${data.setup}\n🤣 ${data.delivery}`;
            }

        } catch (err) {
            console.error('Joke API error:', err.message);
        }

        console.log('Joke result:', responseText);

        return responseText;
    }
}

module.exports = Joke;