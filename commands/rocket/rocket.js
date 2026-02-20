const Command = require('../command-interface.js');
const { SlashCommandBuilder } = require('discord.js');

class Rocket extends Command {
    static slashData = new SlashCommandBuilder()
        .setName('rocket')
        .setDescription('Launch a rocket!');

    async execute(context) {
        // context could be from a reaction or a slash command
        return '```\n' + this.getRocketArt() + '\n```';
    }

    getRocketArt() {
        return `
           ^
          /^\\
         /___\\
        |=   =|
        |     | 
        |     |
        |     |
        |  N  |
        |  O  |  
        |  T  |
        |  H  |
        |  I  |        
        |  N  |
        |  G  |
        |     |
        |  T  |
        |  O  |
        |     |
        |  S  |
        |  E  |
        |  E  |
        |     |
        |  H  |
        |  E  |
        |  R  |
        |  E  |
        |     |
        |     |
        |     |        
       /|##!##|\\
      / |##!##| \\
     /  |##!##|  \\
    |  / ^ | ^ \\  |
    | /  ( | )  \\ |
    |/   ( | )   \\|
        ((   ))
       ((  :  ))
       ((  :  ))
        ((   ))
         (( ))
          ( )
           .
           .
           .
           .
           .
           .
🔥 NOTHING TO SEE HERE! 🔥
`;
    }
}

module.exports = Rocket;