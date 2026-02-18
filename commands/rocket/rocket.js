const Command = require('../command-interface.js');
let eventEmitter = require('../../core/eventEmitter');

class Rocket extends Command {
    execute(context) {
        const { lastResult } = context;

        const rocketArt = this.getRocketArt();
        const response = `\`\`\`\n${rocketArt}\n\`\`\``;

        // Logging
        if (lastResult === null) {
            console.log('Rocket deployed!');
        } else {
            console.log('Rocket executed in chain/pipeline.');
        }

        // Emit for UI/overlay (if you want to show the rocket there too)
        eventEmitter.emit('broadcast', {
            type: 'command:rocket',
            payload: response
        });

        return response;
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
        |     |
        |     |
        |     |        
        |  L  |
        |  O  |
        |  O  |
        |  K  |
        |     |
        |  A  |
        |  W  |
        |  A  |
        |  Y  |
        |  !  |
        |  !  |
        |  !  |
        |     |
        |     |
        |     |  
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
   🔥 LOOK AWAY! 🔥
`;
    }
}

module.exports = Rocket;
